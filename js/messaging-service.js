/**
 * Messaging Service - In-App Chat
 * Real-time messaging between students and admin
 */

const MessagingService = (() => {
    let currentUserId = null;
    let realtimeSubscription = null;

    /**
     * Initialize messaging service
     * @param {string} userId - Current user's UUID
     */
    function init(userId) {
        currentUserId = userId;
        setupRealtimeListener();

        console.log('Messaging Service initialized');
        window.MessagingService = {
            sendMessage,
            getConversation,
            getAllConversations,
            markAsRead,
            subscribeToMessages
        };
    }

    /**
     * Send a message to another user
     * @param {string} receiverId - Recipient's UUID
     * @param {string} messageText - Message content
     * @param {string} courseId - Optional course UUID
     * @returns {Promise<Object>}
     */
    async function sendMessage(receiverId, messageText, courseId = null) {
        if (!window.db || !window.db.initialized) {
            return { success: false, error: 'Database not initialized' };
        }

        if (!currentUserId) {
            return { success: false, error: 'User not logged in' };
        }

        try {
            const { data, error } = await window.db.client
                .from('messages')
                .insert([{
                    sender_id: currentUserId,
                    receiver_id: receiverId,
                    course_id: courseId,
                    message_text: messageText,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data, message: 'Message sent' };
        } catch (error) {
            console.error('Send message error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get messages in a conversation between two users
     * @param {string} otherUserId - The other user's UUID
     * @param {string} courseId - Optional course filter
     * @returns {Promise<Array>}
     */
    async function getConversation(otherUserId, courseId = null) {
        if (!window.db || !window.db.initialized) {
            return [];
        }

        try {
            let query = window.db.client
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
                .order('created_at', { ascending: true });

            if (courseId) {
                query = query.eq('course_id', courseId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get conversation error:', error);
            return [];
        }
    }

    /**
     * Get all conversations for current user
     * Returns list of users with whom current user has exchanged messages
     * @returns {Promise<Array>}
     */
    async function getAllConversations() {
        if (!window.db || !window.db.initialized || !currentUserId) {
            return [];
        }

        try {
            // Get all messages sent by or received by current user
            const { data, error } = await window.db.client
                .from('messages')
                .select('*, students!messages_sender_id_fkey(student_name_en), admin_users!messages_sender_id_fkey(email)')
                .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by other user
            const conversationsMap = new Map();

            data?.forEach(msg => {
                const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;

                if (!conversationsMap.has(otherId)) {
                    conversationsMap.set(otherId, {
                        participantId: otherId,
                        lastMessage: msg.message_text,
                        lastMessageTime: msg.created_at,
                        unreadCount: 0
                    });
                }

                // Count unread messages from other user
                if (msg.sender_id === otherId && msg.receiver_id === currentUserId && !msg.is_read) {
                    const conv = conversationsMap.get(otherId);
                    conv.unreadCount++;
                }
            });

            return Array.from(conversationsMap.values());
        } catch (error) {
            console.error('Get conversations error:', error);
            return [];
        }
    }

    /**
     * Mark messages from a sender as read
     * @param {string} senderId - Sender's UUID
     * @returns {Promise<Object>}
     */
    async function markAsRead(senderId) {
        if (!window.db || !window.db.initialized) {
            return { success: false, error: 'Database not initialized' };
        }

        try {
            const { data, error } = await window.db.client
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', senderId)
                .eq('receiver_id', currentUserId)
                .eq('is_read', false)
                .select();

            if (error) throw error;

            return { success: true, count: data?.length || 0 };
        } catch (error) {
            console.error('Mark as read error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Subscribe to real-time messages
     * @param {Function} callback - Function to call on new message
     * @returns {Object} - Subscription object with unsubscribe method
     */
    function subscribeToMessages(callback) {
        if (!window.db || !window.db.initialized) {
            console.warn('Cannot subscribe - database not initialized');
            return { unsubscribe: () => {} };
        }

        // Clean up existing subscription
        if (realtimeSubscription) {
            realtimeSubscription.unsubscribe();
        }

        realtimeSubscription = window.db.client
            .channel('messages-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`
                },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();

        return {
            unsubscribe: () => {
                if (realtimeSubscription) {
                    realtimeSubscription.unsubscribe();
                    realtimeSubscription = null;
                }
            }
        };
    }

    /**
     * Setup basic realtime listener (called on init)
     * @private
     */
    function setupRealtimeListener() {
        if (!window.db || !window.db.initialized || !currentUserId) {
            return;
        }

        realtimeSubscription = window.db.client
            .channel('messages-listener')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`
                },
                (payload) => {
                    // Dispatch custom event for UI to handle
                    window.dispatchEvent(new CustomEvent('newMessage', {
                        detail: payload.new
                    }));
                }
            )
            .subscribe();
    }

    // Auto-initialize with current user from session (if available)
    document.addEventListener('DOMContentLoaded', () => {
        // Try to get user from session storage
        const session = JSON.parse(localStorage.getItem('mit_student_session') || '{}');
        if (session.id) {
            init(session.id);
        } else {
            // Check admin session
            const adminSession = JSON.parse(localStorage.getItem('mit_admin_session') || '{}');
            if (adminSession.id) {
                init(adminSession.id);
            }
        }
    });

    return {
        init,
        sendMessage,
        getConversation,
        getAllConversations,
        markAsRead,
        subscribeToMessages
    };
})();