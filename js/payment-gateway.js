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
        apiBase: '/api/payment',
        bkash: {
          sandboxMode: true
        },
        nagad: {
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
                  <label class="payment-option" title="Pay with bKash">
                    <input type="radio" name="paymentMethod" value="bkash">
                    <div class="payment-option-card">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="18" fill="#E71F5E"/>
                        <text x="20" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold">bKash</text>
                      </svg>
                      <span>bKash <small style="display:block; font-size:0.7em;">(Sandbox)</small></span>
                    </div>
                  </label>

                  <label class="payment-option" title="Pay with Nagad">
                    <input type="radio" name="paymentMethod" value="nagad">
                    <div class="payment-option-card">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="18" fill="#FF6D00"/>
                        <text x="20" y="25" text-anchor="middle" fill="white" font-size="10" font-weight="bold">Nagad</text>
                      </svg>
                      <span>Nagad <small style="display:block; font-size:0.7em;">(Sandbox)</small></span>
                    </div>
                  </label>

                  <label class="payment-option">
                    <input type="radio" name="paymentMethod" value="manual" checked>
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

      window.toast?.info('Processing payment...');

      try {
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
      try {
        const createResponse = await fetch(`${this.config.apiBase}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: this.currentPayment.studentName,
            email_address: this.currentPayment.email || 'student@mit.edu',
            mobile_number: this.currentPayment.phone,
            amount: this.currentPayment.amount,
            currency: 'BDT',
            course_name: this.currentPayment.courseName,
            return_url: window.location.origin + '/payment-status'
          })
        });

        const paymentResult = await createResponse.json();

        if (paymentResult.error) {
          window.toast?.error(paymentResult.error.message || 'Payment creation failed');
          return;
        }

        this.currentPayment.pp_id = paymentResult.pp_id;

        const bkashResponse = await fetch(`${this.config.apiBase}/bkash`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            pp_id: paymentResult.pp_id,
            amount: this.currentPayment.amount,
            merchant_invoice_number: `MIT${Date.now()}`
          })
        });

        const bkashResult = await bkashResponse.json();

        if (bkashResult.bkash_url || bkashResult.status === 'sandbox') {
          window.toast?.success('Payment initiated! Redirecting...');

          if (bkashResult.status === 'sandbox') {
            this.handlePaymentSuccess({
              method: 'bkash',
              transactionId: bkashResult.payment_id,
              status: 'completed'
            });
          } else {
            window.location.href = bkashResult.bkash_url;
          }
        } else {
          window.toast?.error('bKash payment initiation failed');
        }
      } catch (error) {
        console.error('bKash payment error:', error);
        window.toast?.error('bKash payment failed. Please try manual payment.');
      }
    }

    async processNagadPayment() {
      try {
        const createResponse = await fetch(`${this.config.apiBase}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: this.currentPayment.studentName,
            email_address: this.currentPayment.email || 'student@mit.edu',
            mobile_number: this.currentPayment.phone,
            amount: this.currentPayment.amount,
            currency: 'BDT',
            course_name: this.currentPayment.courseName,
            return_url: window.location.origin + '/payment-status'
          })
        });

        const paymentResult = await createResponse.json();

        if (paymentResult.error) {
          window.toast?.error(paymentResult.error.message || 'Payment creation failed');
          return;
        }

        this.currentPayment.pp_id = paymentResult.pp_id;

        const nagadResponse = await fetch(`${this.config.apiBase}/nagad`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            pp_id: paymentResult.pp_id,
            amount: this.currentPayment.amount,
            order_id: `MIT${Date.now()}`
          })
        });

        const nagadResult = await nagadResponse.json();

        if (nagadResult.payment_url || nagadResult.success) {
          window.toast?.success('Payment initiated! Redirecting...');

          if (nagadResult.success && nagadResult.payment_url?.includes('sandbox')) {
            this.handlePaymentSuccess({
              method: 'nagad',
              transactionId: nagadResult.payment_ref_id,
              status: 'completed'
            });
          } else if (nagadResult.payment_url) {
            window.location.href = nagadResult.payment_url;
          }
        } else {
          window.toast?.error('Nagad payment initiation failed');
        }
      } catch (error) {
        console.error('Nagad payment error:', error);
        window.toast?.error('Nagad payment failed. Please try manual payment.');
      }
    }

    async processManualPayment() {
      const transactionId = document.getElementById('transactionId')?.value?.trim();

      if (!transactionId) {
        window.toast?.error('Please enter transaction ID');
        return;
      }

      try {
        const createResponse = await fetch(`${this.config.apiBase}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: this.currentPayment.studentName,
            email_address: this.currentPayment.email || 'student@mit.edu',
            mobile_number: this.currentPayment.phone,
            amount: this.currentPayment.amount,
            currency: 'BDT',
            course_name: this.currentPayment.courseName,
            metadata: { transaction_id: transactionId }
          })
        });

        const paymentResult = await createResponse.json();

        window.toast?.success('Payment details captured! Finalizing your application...');

        document.getElementById('paymentModal')?.close();

        this.handlePaymentSuccess({
          method: 'manual',
          transactionId: transactionId,
          pp_id: paymentResult.pp_id,
          status: 'pending'
        });

        document.dispatchEvent(new CustomEvent('manualPaymentReady', {
          detail: { transactionId, pp_id: paymentResult.pp_id }
        }));
      } catch (error) {
        console.error('Manual payment error:', error);
        window.toast?.error('Failed to submit payment. Please try again.');
      }
    }

    handlePaymentSuccess(paymentResult) {
      // Bug 2 & 4: Removed savePaymentToDatabase and saveStudentRecord calls.
      // Database persistence is handled by app.js during the main admission flow.
      
      // Generate invoice/receipt
      this.generateInvoice(paymentResult);

      // Generate invoice/receipt
      this.generateInvoice(paymentResult);

      // Close payment modal
      document.getElementById('paymentModal')?.close();

      // Show success message
      window.toast?.success('Payment successful! Invoice generated.');
    }

    // saveStudentRecord() removed to prevent duplicate records and conflicting tracking numbers.
    // Tracking and student record saving is now handled centrally in app.js.
    async saveStudentRecord(paymentResult) {
      console.warn('PaymentGateway.saveStudentRecord is deprecated. Use app.js logic instead.');
    }

    normalizePhone(phone) {
      if (!phone) return '';
      // Strip all non-digits, then if 13 digits starting with '880', take last 11
      const digits = phone.replace(/\D+/g, '');
      if (digits.length === 13 && digits.startsWith('880')) {
        return digits.slice(-11);
      }
      return digits;
    }

    // generateTrackingNumber() removed to prevent conflicts with app.js format.
    generateTrackingNumber() {
      return `DEP-${Date.now()}`; // Deprecated format
    }

    // savePaymentToDatabase() removed because 'payments' table does not exist in Supabase schema.
    async savePaymentToDatabase(paymentResult) {
       console.warn('PaymentGateway.savePaymentToDatabase is disabled (missing table).');
    }

    generateInvoice(paymentResult) {
      const student = this.currentPayment.studentRecord || {};
      const today = new Date().toLocaleDateString('en-GB');

      const invoiceHTML = `
        <div class="payment-receipt invoice-document">
          <div class="receipt-header">
            <img src="/assets/logo.jpg" alt="MIT Logo" style="width: 80px; height: 80px; border-radius: 12px; margin-bottom: 1rem;">
            <h2>ADMISSION INVOICE</h2>
            <p class="muted"><strong>Markiety IT Institute (MIT)</strong></p>
            <p class="small muted" style="margin: 0;">Nodi Bangla Manik Palace, 2nd Floor, Madhabdi, Narsingdi</p>
            <p class="small muted" style="margin: 0;">Phone: +880 1624-547667 | Email: markietyitinstitute@gmail.com</p>
          </div>

          <div class="invoice-meta" style="display: flex; justify-content: space-between; padding: 1.5rem 2rem; background: var(--light); border-radius: 8px; margin: 1rem 2rem;">
            <div>
              <p class="small muted" style="margin: 0 0 0.25rem;">Invoice Number</p>
              <strong>${student.trackingNo || student.id || 'MIT-' + Date.now()}</strong>
            </div>
            <div style="text-align: right;">
              <p class="small muted" style="margin: 0 0 0.25rem;">Date</p>
              <strong>${today}</strong>
            </div>
          </div>

          <div class="receipt-body">
            <h3 style="margin: 0 0 1rem; padding: 0 0 0.5rem; border-bottom: 2px solid var(--border);">Student Information</h3>
            <div class="receipt-row">
              <span>Student Name:</span>
              <strong>${this.currentPayment.studentName}</strong>
            </div>
            <div class="receipt-row">
              <span>Email:</span>
              <strong>${this.currentPayment.email || 'N/A'}</strong>
            </div>
            <div class="receipt-row">
              <span>Phone:</span>
              <strong>${this.currentPayment.phone}</strong>
            </div>
            ${student.nid ? `
            <div class="receipt-row">
              <span>NID/Birth Certificate:</span>
              <strong>${student.nid}</strong>
            </div>` : ''}

            <h3 style="margin: 1.5rem 0 1rem; padding: 0 0 0.5rem; border-bottom: 2px solid var(--border);">Course Details</h3>
            <div class="receipt-row">
              <span>Course Name:</span>
              <strong>${this.currentPayment.courseName}</strong>
            </div>
            <div class="receipt-row">
              <span>Course Fee:</span>
              <strong>৳${this.currentPayment.amount}</strong>
            </div>
            <div class="receipt-row" style="background: rgba(79, 124, 255, 0.05); padding: 0.75rem; border-radius: 8px; margin: 0.5rem 0;">
              <span style="font-size: 1.1rem;">Total Amount Paid:</span>
              <strong style="font-size: 1.2rem; color: var(--blue);">৳${this.currentPayment.amount}</strong>
            </div>

            <h3 style="margin: 1.5rem 0 1rem; padding: 0 0 0.5rem; border-bottom: 2px solid var(--border);">Payment Information</h3>
            <div class="receipt-row">
              <span>Payment Method:</span>
              <strong>${paymentResult.method.toUpperCase()}</strong>
            </div>
            <div class="receipt-row">
              <span>Transaction ID:</span>
              <strong>${paymentResult.transactionId}</strong>
            </div>
            <div class="receipt-row">
              <span>Payment Status:</span>
              <strong class="${paymentResult.status === 'completed' ? 'text-success' : 'text-warning'}">
                ${paymentResult.status === 'completed' ? '✅ Completed' : '⏳ Pending Verification'}
              </strong>
            </div>
            <div class="receipt-row">
              <span>Payment Date:</span>
              <strong>${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</strong>
            </div>

            ${student.portalPhone && student.portalPin ? `
            <div style="background: linear-gradient(135deg, #4F7CFF, #00C9A7); color: white; padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0;">
              <h3 style="margin: 0 0 1rem; color: white;">🎓 Student Portal Access</h3>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
                <p style="margin: 0 0 0.5rem; font-size: 0.85rem; opacity: 0.9;">Username (Phone)</p>
                <p style="margin: 0; font-size: 1.2rem; font-weight: 700;">${student.portalPhone}</p>
              </div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 1rem; border-radius: 8px;">
                <p style="margin: 0 0 0.5rem; font-size: 0.85rem; opacity: 0.9;">Portal PIN</p>
                <p style="margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: 0.25rem;">${student.portalPin}</p>
              </div>
              <p style="margin: 1rem 0 0; font-size: 0.85rem; opacity: 0.9;">⚠️ Save your PIN! You'll need it to access course materials at: <strong>/students/index.html</strong></p>
            </div>
            ` : ''}
          </div>

          <div class="receipt-footer">
            <div style="background: var(--light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
              <h4 style="margin: 0 0 0.75rem;">📋 Next Steps:</h4>
              <ol style="margin: 0; padding-left: 1.5rem;">
                <li>Save this invoice for your records</li>
                <li>You will receive a confirmation SMS within 30 minutes</li>
                <li>Access course materials via Student Portal</li>
                <li>Attend orientation session (details via SMS)</li>
              </ol>
            </div>
            <p class="small muted" style="text-align: center; margin-bottom: 1rem;">
              <strong>Thank you for choosing Markiety IT Institute!</strong><br>
              For any queries, contact: +880 1624-547667 | markietyitinstitute@gmail.com
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
              <button type="button" class="btn btn-outline" onclick="window.print()">
                🖨️ Print Invoice
              </button>
              <button type="button" class="btn btn-gradient" onclick="window.location.href='/students/index.html'">
                🚀 Go to Student Portal
              </button>
            </div>
          </div>
        </div>
      `;

      // Create receipt overlay
      const overlay = document.createElement('div');
      overlay.className = 'receipt-overlay';
      overlay.innerHTML = invoiceHTML;
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
