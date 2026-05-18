/**
 * Payment Approval Service
 * Handles cash payment verification workflow
 * Ensures students only get portal access AFTER payment is verified
 */

const PaymentApprovalService = (() => {
    const PAYMENT_STATUS = {
        PENDING: 'pending',
        VERIFIED: 'verified',
        REJECTED: 'rejected'
    };

    /**
     * Check if student can access portal based on payment status
     * @param {Object} student - Student record from database
     * @returns {Object} - { canAccess: boolean, reason: string }
     */
    function canAccessPortal(student) {
        const paymentStatus = student.payment_status || student.paymentStatus;

        if (!paymentStatus) {
            // Legacy records without payment_status - default to verified for backward compatibility
            return { canAccess: true, reason: 'Legacy account - no payment status' };
        }

        if (paymentStatus === PAYMENT_STATUS.VERIFIED) {
            return { canAccess: true, reason: 'Payment verified' };
        }

        return {
            canAccess: false,
            reason: 'Payment pending verification. Please contact admin for assistance.'
        };
    }

    /**
     * Approve a student's cash payment
     * @param {string} studentId - Student's UUID
     * @returns {Promise<Object>}
     */
    async function approveCashPayment(studentId) {
        if (!window.db || !window.db.initialized) {
            return { success: false, error: 'Database not initialized' };
        }

        try {
            const { data, error } = await window.db.client
                .from('students')
                .update({ payment_status: PAYMENT_STATUS.VERIFIED })
                .eq('id', studentId)
                .select()
                .single();

            if (error) throw error;

            // Send notification (SMS/Email would be configured here)
            await sendApprovalNotification(data);

            return { success: true, data, message: 'Payment approved successfully' };
        } catch (error) {
            console.error('Error approving payment:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reject a student's cash payment
     * @param {string} studentId - Student's UUID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>}
     */
    async function rejectCashPayment(studentId, reason) {
        if (!window.db || !window.db.initialized) {
            return { success: false, error: 'Database not initialized' };
        }

        try {
            const { data, error } = await window.db.client
                .from('students')
                .update({
                    payment_status: PAYMENT_STATUS.REJECTED,
                    notes: reason
                })
                .eq('id', studentId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data, message: 'Payment rejected' };
        } catch (error) {
            console.error('Error rejecting payment:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all pending payments for admin review
     * @returns {Promise<Array>}
     */
    async function getPendingPayments() {
        if (!window.db || !window.db.initialized) {
            return [];
        }

        try {
            const { data, error } = await window.db.client
                .from('students')
                .select('*')
                .eq('payment_status', PAYMENT_STATUS.PENDING)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching pending payments:', error);
            return [];
        }
    }

    /**
     * Get all verified payments
     * @returns {Promise<Array>}
     */
    async function getVerifiedPayments() {
        if (!window.db || !window.db.initialized) {
            return [];
        }

        try {
            const { data, error } = await window.db.client
                .from('students')
                .select('*')
                .eq('payment_status', PAYMENT_STATUS.VERIFIED)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching verified payments:', error);
            return [];
        }
    }

    /**
     * Send approval notification to student
     * @param {Object} student - Student record
     * @private
     */
    async function sendApprovalNotification(student) {
        // TODO: Integrate with SMS/Email service
        console.log(`Notification: Payment approved for ${student.email || student.student_phone}`);

        // For now, just log - in production, integrate with:
        // - SMS API (bKash/Nagad)
        // - Email service (SendGrid, etc.)
    }

    /**
     * Create payment record with proper status
     * @param {Object} studentData - Student data from admission form
     * @returns {Promise<Object>}
     */
    async function createStudentWithPaymentStatus(studentData) {
        if (!window.db || !window.db.initialized) {
            return { success: false, error: 'Database not initialized' };
        }

        const paymentMethod = studentData.payment || studentData.paymentMethod;
        const isCashPayment = paymentMethod === 'cash' || paymentMethod === 'manual';

        // Cash/manual payments require admin verification
        // Online payments (bKash/Nagad) are auto-verified
        const initialStatus = isCashPayment ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.VERIFIED;

        const studentRecord = {
            ...studentData,
            payment_status: initialStatus,
            created_at: new Date().toISOString()
        };

        try {
            const { data, error } = await window.db.client
                .from('students')
                .insert([studentRecord])
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data,
                paymentStatus: initialStatus,
                requiresVerification: isCashPayment
            };
        } catch (error) {
            console.error('Error creating student:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Initialize the payment approval service
     */
    function init() {
        console.log('Payment Approval Service initialized');

        // Expose globally for admin dashboard use
        window.PaymentApproval = {
            PAYMENT_STATUS,
            canAccessPortal,
            approveCashPayment,
            rejectCashPayment,
            getPendingPayments,
            getVerifiedPayments,
            createStudentWithPaymentStatus
        };
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        PAYMENT_STATUS,
        canAccessPortal,
        approveCashPayment,
        rejectCashPayment,
        getPendingPayments,
        getVerifiedPayments,
        createStudentWithPaymentStatus
    };
})();