/**
 * MIT Payment Gateway Integration
 * - bKash Payment
 * - Nagad Payment
 * - Payment verification
 * - Receipt generation
 * - Transaction management
 */

(function() {
  'use strict';

  // ============================================================================
  // PAYMENT GATEWAY MANAGER
  // ============================================================================

  class PaymentGateway {
    constructor() {
      this.config = {
        bkash: {
          apiUrl: 'https://checkout.pay.bka.sh/v1.2.0-beta',
          // In production, these should be in environment variables
          appKey: 'YOUR_BKASH_APP_KEY',
          appSecret: 'YOUR_BKASH_APP_SECRET',
          username: 'YOUR_BKASH_USERNAME',
          password: 'YOUR_BKASH_PASSWORD',
          sandboxMode: true
        },
        nagad: {
          apiUrl: 'https://api.mynagad.com',
          merchantId: 'YOUR_MERCHANT_ID',
          merchantNumber: 'YOUR_MERCHANT_NUMBER',
          publicKey: 'YOUR_PUBLIC_KEY',
          privateKey: 'YOUR_PRIVATE_KEY',
          sandboxMode: true
        }
      };

      this.init();
    }

    init() {
      this.createPaymentModal();
      this.setupEventListeners();
    }

    createPaymentModal() {
      const modalHTML = `
        <dialog id="paymentModal" class="modal" aria-labelledby="paymentModalTitle">
          <form method="dialog" class="modal-inner payment-modal-content">
            <header class="modal-head">
              <h2 id="paymentModalTitle">Complete Payment</h2>
              <button type="submit" class="icon-btn" aria-label="Close payment">×</button>
            </header>

            <div class="modal-body">
              <!-- Payment Summary -->
              <div class="payment-summary">
                <h3>Payment Details</h3>
                <div class="payment-item">
                  <span>Course:</span>
                  <strong id="paymentCourseName">-</strong>
                </div>
                <div class="payment-item">
                  <span>Student Name:</span>
                  <strong id="paymentStudentName">-</strong>
                </div>
                <div class="payment-item">
                  <span>Phone:</span>
                  <strong id="paymentPhone">-</strong>
                </div>
                <div class="payment-item total">
                  <span>Total Amount:</span>
                  <strong id="paymentAmount">৳0</strong>
                </div>
              </div>

              <!-- Payment Method Selection -->
              <div class="payment-methods">
                <h3>Select Payment Method</h3>
                <div class="payment-options">
                  <label class="payment-option">
                    <input type="radio" name="paymentMethod" value="bkash" checked>
                    <div class="payment-option-card">
                      <img src="https://download.logo.wine/logo/BKash/BKash-Logo.wine.png" alt="bKash" style="height: 40px;">
                      <span>bKash</span>
                    </div>
                  </label>

                  <label class="payment-option">
                    <input type="radio" name="paymentMethod" value="nagad">
                    <div class="payment-option-card">
                      <img src="https://seeklogo.com/images/N/nagad-logo-7A70CCFEE6-seeklogo.com.png" alt="Nagad" style="height: 40px;">
                      <span>Nagad</span>
                    </div>
                  </label>

                  <label class="payment-option">
                    <input type="radio" name="paymentMethod" value="manual">
                    <div class="payment-option-card">
                      <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                      <span>Manual Payment</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Payment Instructions (for manual) -->
              <div id="manualPaymentInfo" class="payment-info" style="display: none;">
                <div class="info-box">
                  <h4>Manual Payment Instructions</h4>
                  <ol>
                    <li>Send money to: <strong>01624-547667</strong> (bKash/Nagad)</li>
                    <li>Enter the transaction ID below</li>
                    <li>Our team will verify within 30 minutes</li>
                  </ol>
                  <div class="form-field">
                    <label for="transactionId">Transaction ID / Reference Number</label>
                    <input type="text" id="transactionId" placeholder="Enter TrxID or payment reference">
                  </div>
                </div>
              </div>
            </div>

            <footer class="modal-foot">
              <button type="submit" class="btn btn-outline">Cancel</button>
              <button type="button" class="btn btn-gradient" id="proceedPaymentBtn">
                Proceed to Payment
              </button>
            </footer>
          </form>
        </dialog>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    setupEventListeners() {
      // Payment method change
      document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          const manualInfo = document.getElementById('manualPaymentInfo');
          if (e.target.value === 'manual') {
            manualInfo.style.display = 'block';
          } else {
            manualInfo.style.display = 'none';
          }
        });
      });

      // Proceed to payment button
      document.getElementById('proceedPaymentBtn')?.addEventListener('click', () => {
        this.processPayment();
      });

      // Listen for payment triggers
      document.addEventListener('openPaymentModal', (e) => {
        this.openPaymentModal(e.detail);
      });
    }

    openPaymentModal(data) {
      // Populate payment details
      document.getElementById('paymentCourseName').textContent = data.courseName || '-';
      document.getElementById('paymentStudentName').textContent = data.studentName || '-';
      document.getElementById('paymentPhone').textContent = data.phone || '-';
      document.getElementById('paymentAmount').textContent = `৳${data.amount || 0}`;

      // Store payment data
      this.currentPayment = data;

      // Open modal
      const modal = document.getElementById('paymentModal');
      if (modal) {
        modal.showModal();
      }
    }

    async processPayment() {
      const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

      if (!selectedMethod) {
        window.toast?.error('Please select a payment method');
        return;
      }

      if (selectedMethod === 'manual') {
        return this.processManualPayment();
      }

      try {
        window.toast?.info('Redirecting to payment gateway...');

        if (selectedMethod === 'bkash') {
          await this.processBkashPayment();
        } else if (selectedMethod === 'nagad') {
          await this.processNagadPayment();
        }
      } catch (error) {
        console.error('Payment error:', error);
        window.toast?.error('Payment failed. Please try again.');
      }
    }

    async processBkashPayment() {
      // In production, this would call your backend API which then calls bKash
      const paymentData = {
        amount: this.currentPayment.amount,
        merchantInvoiceNumber: `MIT${Date.now()}`,
        intent: 'sale',
        ...this.currentPayment
      };

      // Simulate API call
      console.log('Processing bKash payment:', paymentData);

      // In production:
      // const response = await fetch('/api/payments/bkash/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(paymentData)
      // });
      // const result = await response.json();
      // window.location.href = result.bkashURL;

      // For demo purposes
      window.toast?.warning('bKash integration pending. Please use manual payment for now.');

      // Simulate successful payment after 2 seconds
      setTimeout(() => {
        this.handlePaymentSuccess({
          method: 'bkash',
          transactionId: `BK${Date.now()}`,
          amount: this.currentPayment.amount,
          status: 'completed'
        });
      }, 2000);
    }

    async processNagadPayment() {
      // Similar to bKash, this would call your backend
      const paymentData = {
        amount: this.currentPayment.amount,
        orderId: `MIT${Date.now()}`,
        ...this.currentPayment
      };

      console.log('Processing Nagad payment:', paymentData);

      // For demo purposes
      window.toast?.warning('Nagad integration pending. Please use manual payment for now.');

      setTimeout(() => {
        this.handlePaymentSuccess({
          method: 'nagad',
          transactionId: `NG${Date.now()}`,
          amount: this.currentPayment.amount,
          status: 'completed'
        });
      }, 2000);
    }

    async processManualPayment() {
      const transactionId = document.getElementById('transactionId')?.value?.trim();

      if (!transactionId) {
        window.toast?.error('Please enter transaction ID');
        return;
      }

      try {
        // Save to Supabase for manual verification
        if (window.db && window.db.initialized) {
          const { data, error } = await window.db.client
            .from('payments')
            .insert({
              student_name: this.currentPayment.studentName,
              phone: this.currentPayment.phone,
              course: this.currentPayment.courseName,
              amount: this.currentPayment.amount,
              method: 'manual',
              transaction_id: transactionId,
              status: 'pending_verification',
              created_at: new Date().toISOString()
            });

          if (error) throw error;

          window.toast?.success('Payment submitted! We will verify within 30 minutes.');

          // Close modal
          document.getElementById('paymentModal')?.close();

          // Show receipt
          this.generateReceipt({
            method: 'manual',
            transactionId: transactionId,
            amount: this.currentPayment.amount,
            status: 'pending_verification'
          });
        } else {
          throw new Error('Database not available');
        }
      } catch (error) {
        console.error('Manual payment error:', error);
        window.toast?.error('Failed to submit payment. Please try again.');
      }
    }

    handlePaymentSuccess(paymentResult) {
      // Save to database
      this.savePaymentToDatabase(paymentResult);

      // Generate receipt
      this.generateReceipt(paymentResult);

      // Close payment modal
      document.getElementById('paymentModal')?.close();

      // Show success message
      window.toast?.success('Payment successful! Receipt generated.');
    }

    async savePaymentToDatabase(paymentResult) {
      if (!window.db || !window.db.initialized) return;

      try {
        const { data, error } = await window.db.client
          .from('payments')
          .insert({
            student_name: this.currentPayment.studentName,
            phone: this.currentPayment.phone,
            course: this.currentPayment.courseName,
            amount: this.currentPayment.amount,
            method: paymentResult.method,
            transaction_id: paymentResult.transactionId,
            status: paymentResult.status,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        console.log('Payment saved to database:', data);
      } catch (error) {
        console.error('Database save error:', error);
      }
    }

    generateReceipt(paymentResult) {
      const receiptHTML = `
        <div class="payment-receipt">
          <div class="receipt-header">
            <img src="assets/logo.jpg" alt="MIT Logo" style="width: 60px; height: 60px; border-radius: 12px;">
            <h2>Payment Receipt</h2>
            <p class="muted">Markiety IT Institute (MIT)</p>
          </div>

          <div class="receipt-body">
            <div class="receipt-row">
              <span>Student Name:</span>
              <strong>${this.currentPayment.studentName}</strong>
            </div>
            <div class="receipt-row">
              <span>Phone:</span>
              <strong>${this.currentPayment.phone}</strong>
            </div>
            <div class="receipt-row">
              <span>Course:</span>
              <strong>${this.currentPayment.courseName}</strong>
            </div>
            <div class="receipt-row">
              <span>Amount Paid:</span>
              <strong>৳${this.currentPayment.amount}</strong>
            </div>
            <div class="receipt-row">
              <span>Payment Method:</span>
              <strong>${paymentResult.method.toUpperCase()}</strong>
            </div>
            <div class="receipt-row">
              <span>Transaction ID:</span>
              <strong>${paymentResult.transactionId}</strong>
            </div>
            <div class="receipt-row">
              <span>Status:</span>
              <strong class="${paymentResult.status === 'completed' ? 'text-success' : 'text-warning'}">
                ${paymentResult.status === 'completed' ? '✅ Completed' : '⏳ Pending Verification'}
              </strong>
            </div>
            <div class="receipt-row">
              <span>Date:</span>
              <strong>${new Date().toLocaleString()}</strong>
            </div>
          </div>

          <div class="receipt-footer">
            <p class="small muted">Thank you for choosing MIT! You will receive a confirmation SMS shortly.</p>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button type="button" class="btn btn-outline" onclick="window.print()">
                Print Receipt
              </button>
              <button type="button" class="btn btn-gradient" onclick="this.closest('.payment-receipt').remove()">
                Close
              </button>
            </div>
          </div>
        </div>
      `;

      // Create receipt overlay
      const overlay = document.createElement('div');
      overlay.className = 'receipt-overlay';
      overlay.innerHTML = receiptHTML;
      document.body.appendChild(overlay);

      // Auto-remove after 10 seconds if not closed
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          overlay.remove();
        }
      }, 10000);
    }
  }

  // ============================================================================
  // PAYMENT UTILITIES
  // ============================================================================

  class PaymentUtils {
    static formatAmount(amount) {
      return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0
      }).format(amount);
    }

    static validateTransactionId(trxId, method) {
      if (!trxId) return false;

      // Basic validation based on method
      if (method === 'bkash' && trxId.length < 8) return false;
      if (method === 'nagad' && trxId.length < 10) return false;

      return true;
    }

    static async verifyPayment(transactionId, method) {
      // In production, call backend API to verify with payment gateway
      console.log(`Verifying ${method} payment: ${transactionId}`);

      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            verified: true,
            amount: 5500,
            status: 'completed'
          });
        }, 1000);
      });
    }
  }

  // ============================================================================
  // INITIALIZE
  // ============================================================================

  let paymentGateway;

  function initPaymentGateway() {
    try {
      paymentGateway = new PaymentGateway();
      console.log('💳 Payment gateway initialized');

      // Make available globally
      window.MITPayments = {
        openPaymentModal: (data) => paymentGateway.openPaymentModal(data),
        utils: PaymentUtils
      };
    } catch (error) {
      console.error('Payment gateway initialization error:', error);
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPaymentGateway);
  } else {
    initPaymentGateway();
  }

})();
