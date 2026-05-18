/**
 * Live Class Service - WebRTC Video Conferencing
 * Real-time video classes using WebRTC with Supabase for signaling
 */

const LiveClassService = (() => {
    const ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ];

    let localStream = null;
    let peers = {}; // { peerId: RTCPeerConnection }
    let currentClassId = null;
    let currentUserId = null;
    let isTeacher = false;
    let signalingChannel = null;

    /**
     * Initialize live class service
     * @param {string} userId - Current user's UUID
     * @param {boolean} isTeacher - Whether user is a teacher
     */
    function init(userId, isTeacherRole = false) {
        currentUserId = userId;
        isTeacher = isTeacherRole;

        console.log('Live Class Service initialized', { isTeacher: isTeacherRole });
        window.LiveClassService = {
            startClass,
            endClass,
            joinClass,
            leaveClass,
            toggleAudio,
            toggleVideo,
            shareScreen
        };
    }

    /**
     * Start a new live class (teacher only)
     * @param {string} classId - Class/room identifier
     * @returns {Promise<Object>}
     */
    async function startClass(classId) {
        if (!isTeacher) {
            return { success: false, error: 'Only teachers can start classes' };
        }

        try {
            currentClassId = classId;

            // Get local media stream
            localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: true
            });

            // Setup signaling channel via Supabase
            await setupSignalingChannel(classId);

            return {
                success: true,
                stream: localStream,
                message: 'Class started. Waiting for students to join.'
            };
        } catch (error) {
            console.error('Start class error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Join an existing class (student or teacher)
     * @param {string} classId - Class/room identifier
     * @returns {Promise<Object>}
     */
    async function joinClass(classId) {
        try {
            currentClassId = classId;

            // Get local media stream
            localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: true
            });

            // Setup signaling channel
            await setupSignalingChannel(classId);

            // Announce joining via signaling
            await signalingChannel.send({
                type: 'broadcast',
                event: 'user-join',
                payload: {
                    userId: currentUserId,
                    isTeacher: isTeacher
                }
            });

            return {
                success: true,
                stream: localStream,
                message: 'Joined class successfully'
            };
        } catch (error) {
            console.error('Join class error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Leave current class
     */
    function leaveClass() {
        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }

        // Close all peer connections
        Object.values(peers).forEach(pc => pc.close());
        peers = {};

        // Unsubscribe from signaling
        if (signalingChannel) {
            signalingChannel.unsubscribe();
            signalingChannel = null;
        }

        currentClassId = null;
        console.log('Left class');
    }

    /**
     * End class (teacher only)
     */
    function endClass() {
        if (!isTeacher) {
            console.warn('Only teacher can end class');
            return;
        }

        leaveClass();
        console.log('Class ended by teacher');
    }

    /**
     * Toggle audio on/off
     * @returns {boolean} - Current audio state
     */
    function toggleAudio() {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }

    /**
     * Toggle video on/off
     * @returns {boolean} - Current video state
     */
    function toggleVideo() {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }

    /**
     * Share screen
     * @returns {Promise<Object>}
     */
    async function shareScreen() {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always'
                },
                audio: false
            });

            const screenTrack = screenStream.getVideoTracks()[0];

            // Replace video track in all peer connections
            Object.values(peers).forEach(pc => {
                const sender = pc.getSenders().find(s =>
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });

            // Handle screen share ended
            screenTrack.onended = async () => {
                // Restore camera video
                const cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
                const cameraTrack = cameraStream.getVideoTracks()[0];

                Object.values(peers).forEach(pc => {
                    const sender = pc.getSenders().find(s =>
                        s.track && s.track.kind === 'video'
                    );
                    if (sender) {
                        sender.replaceTrack(cameraTrack);
                    }
                });
            };

            return { success: true, stream: screenStream };
        } catch (error) {
            console.error('Screen share error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup Supabase realtime channel for signaling
     * @private
     */
    async function setupSignalingChannel(classId) {
        const channelName = `live-class-${classId}`;

        signalingChannel = window.db.client.channel(channelName);

        signalingChannel
            .on('broadcast', { event: 'user-join' }, (payload) => {
                handleUserJoin(payload.data);
            })
            .on('broadcast', { event: 'offer' }, (payload) => {
                handleOffer(payload.data);
            })
            .on('broadcast', { event: 'answer' }, (payload) => {
                handleAnswer(payload.data);
            })
            .on('broadcast', { event: 'ice-candidate' }, (payload) => {
                handleIceCandidate(payload.data);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connected to signaling channel');
                }
            });
    }

    /**
     * Handle user join event
     * @private
     */
    async function handleUserJoin(data) {
        if (data.userId === currentUserId) return; // Ignore self

        console.log('User joined:', data);

        // Create offer if we are the teacher or were already in the room
        if (isTeacher || currentUserId) {
            await createPeerConnection(data.userId, true);
        }
    }

    /**
     * Create WebRTC peer connection
     * @private
     */
    async function createPeerConnection(remotePeerId, initiator = false) {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                signalingChannel.send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: {
                        candidate: event.candidate,
                        from: currentUserId,
                        to: remotePeerId
                    }
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote stream');
            window.dispatchEvent(new CustomEvent('remoteStream', {
                detail: {
                    peerId: remotePeerId,
                    stream: event.streams[0]
                }
            }));
        };

        // Handle connection state
        pc.onconnectionstatechange = () => {
            console.log(`Peer ${remotePeerId} connection state:`, pc.connectionState);
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                delete peers[remotePeerId];
            }
        };

        peers[remotePeerId] = pc;

        // Create and send offer if initiator
        if (initiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            signalingChannel.send({
                type: 'broadcast',
                event: 'offer',
                payload: {
                    offer: pc.localDescription,
                    from: currentUserId,
                    to: remotePeerId
                }
            });
        }

        return pc;
    }

    /**
     * Handle incoming offer
     * @private
     */
    async function handleOffer(data) {
        if (data.to !== currentUserId) return;

        const pc = await createPeerConnection(data.from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        signalingChannel.send({
            type: 'broadcast',
            event: 'answer',
            payload: {
                answer: pc.localDescription,
                from: currentUserId,
                to: data.from
            }
        });
    }

    /**
     * Handle incoming answer
     * @private
     */
    async function handleAnswer(data) {
        if (data.to !== currentUserId) return;

        const pc = peers[data.from];
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    }

    /**
     * Handle incoming ICE candidate
     * @private
     */
    async function handleIceCandidate(data) {
        if (data.to !== currentUserId) return;

        const pc = peers[data.from];
        if (pc && data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }

    // Auto-initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Will be initialized with user ID when user logs in
    });

    return {
        init,
        startClass,
        endClass,
        joinClass,
        leaveClass,
        toggleAudio,
        toggleVideo,
        shareScreen
    };
})();