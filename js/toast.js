/**
 * ============================================================================
 * MIT TOAST NOTIFICATION SYSTEM
 * ============================================================================
 * Premium toast notifications with beautiful animations and styling
 * Supports: success, error, warning, info, loading states
 */

const MITToast = {
    container: null,
    toasts: [],
    maxToasts: 5,

    /**
     * Initialize toast container
     */
    init: function () {
        if (this.container) return;

        // Create toast container
        this.container = document.createElement('div');
        this.container.id = 'mit-toast-container';
        this.container.className = 'mit-toast-container';
        document.body.appendChild(this.container);

        // Add styles
        this.injectStyles();
    },

    /**
     * Show success toast
     */
    success: function (message, options = {}) {
        return this.show({
            type: 'success',
            message,
            icon: '✓',
            ...options
        });
    },

    /**
     * Show error toast
     */
    error: function (message, options = {}) {
        return this.show({
            type: 'error',
            message,
            icon: '✕',
            ...options
        });
    },

    /**
     * Show warning toast
     */
    warning: function (message, options = {}) {
        return this.show({
            type: 'warning',
            message,
            icon: '⚠',
            ...options
        });
    },

    /**
     * Show info toast
     */
    info: function (message, options = {}) {
        return this.show({
            type: 'info',
            message,
            icon: 'ℹ',
            ...options
        });
    },

    /**
     * Show loading toast
     */
    loading: function (message, options = {}) {
        return this.show({
            type: 'loading',
            message,
            icon: '⟳',
            duration: 0, // Don't auto-dismiss
            ...options
        });
    },

    /**
     * Show toast notification
     */
    show: function (config) {
        this.init();

        const {
            type = 'info',
            message = '',
            icon = '',
            duration = 4000,
            closable = true,
            action = null,
            actionText = ''
        } = config;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `mit-toast mit-toast-${type}`;

        const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        toast.id = toastId;

        // Build toast content
        let content = `
      <div class="mit-toast-icon ${type === 'loading' ? 'spinning' : ''}">
        ${icon}
      </div>
      <div class="mit-toast-content">
        <div class="mit-toast-message">${message}</div>
      </div>
    `;

        // Add action button if provided
        if (action && actionText) {
            content += `
        <button class="mit-toast-action" data-toast-action="${toastId}">
          ${actionText}
        </button>
      `;
        }

        // Add close button if closable
        if (closable) {
            content += `
        <button class="mit-toast-close" data-toast-close="${toastId}">
          ×
        </button>
      `;
        }

        // Add progress bar if auto-dismiss
        if (duration > 0) {
            content += `<div class="mit-toast-progress" style="animation-duration: ${duration}ms"></div>`;
        }

        toast.innerHTML = content;

        // Add to container
        this.container.appendChild(toast);
        this.toasts.push({ id: toastId, element: toast, type });

        // Manage max toasts
        if (this.toasts.length > this.maxToasts) {
            const oldToast = this.toasts.shift();
            this.dismiss(oldToast.id, false);
        }

        // Trigger animation
        setTimeout(() => toast.classList.add('mit-toast-show'), 10);

        // Set up event listeners
        if (closable) {
            const closeBtn = toast.querySelector(`[data-toast-close="${toastId}"]`);
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.dismiss(toastId));
            }
        }

        if (action) {
            const actionBtn = toast.querySelector(`[data-toast-action="${toastId}"]`);
            if (actionBtn) {
                actionBtn.addEventListener('click', () => {
                    action();
                    this.dismiss(toastId);
                });
            }
        }

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(toastId), duration);
        }

        return {
            id: toastId,
            dismiss: () => this.dismiss(toastId),
            update: (newMessage) => this.update(toastId, newMessage)
        };
    },

    /**
     * Update toast message
     */
    update: function (toastId, newMessage) {
        const toastData = this.toasts.find(t => t.id === toastId);
        if (toastData) {
            const messageEl = toastData.element.querySelector('.mit-toast-message');
            if (messageEl) {
                messageEl.textContent = newMessage;
            }
        }
    },

    /**
     * Dismiss toast
     */
    dismiss: function (toastId, animate = true) {
        const index = this.toasts.findIndex(t => t.id === toastId);
        if (index === -1) return;

        const toastData = this.toasts[index];

        if (animate) {
            toastData.element.classList.add('mit-toast-hide');
            setTimeout(() => {
                toastData.element.remove();
            }, 300);
        } else {
            toastData.element.remove();
        }

        this.toasts.splice(index, 1);
    },

    /**
     * Clear all toasts
     */
    clear: function () {
        this.toasts.forEach(toast => {
            toast.element.remove();
        });
        this.toasts = [];
    },

    /**
     * Inject CSS styles
     */
    injectStyles: function () {
        if (document.getElementById('mit-toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'mit-toast-styles';
        style.textContent = `
      /* Toast Container */
      .mit-toast-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        max-width: 420px;
      }

      /* Toast Base */
      .mit-toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
        border-left: 4px solid;
        transform: translateX(calc(100% + 40px));
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: all;
        position: relative;
        overflow: hidden;
        min-width: 320px;
        backdrop-filter: blur(10px);
      }

      .mit-toast-show {
        transform: translateX(0);
        opacity: 1;
      }

      .mit-toast-hide {
        transform: translateX(calc(100% + 40px));
        opacity: 0;
      }

      /* Dark theme support */
      body[data-theme="dark"] .mit-toast {
        background: rgba(17, 24, 39, 0.95);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      /* Toast Types */
      .mit-toast-success {
        border-left-color: #00C9A7;
      }

      .mit-toast-error {
        border-left-color: #EF4444;
      }

      .mit-toast-warning {
        border-left-color: #F59E0B;
      }

      .mit-toast-info {
        border-left-color: #4F7CFF;
      }

      .mit-toast-loading {
        border-left-color: #8B5CF6;
      }

      /* Toast Icon */
      .mit-toast-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        color: white;
      }

      .mit-toast-success .mit-toast-icon {
        background: #00C9A7;
      }

      .mit-toast-error .mit-toast-icon {
        background: #EF4444;
      }

      .mit-toast-warning .mit-toast-icon {
        background: #F59E0B;
      }

      .mit-toast-info .mit-toast-icon {
        background: #4F7CFF;
      }

      .mit-toast-loading .mit-toast-icon {
        background: #8B5CF6;
      }

      .mit-toast-icon.spinning {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Toast Content */
      .mit-toast-content {
        flex: 1;
        min-width: 0;
      }

      .mit-toast-message {
        color: #1F2937;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.5;
        word-wrap: break-word;
      }

      body[data-theme="dark"] .mit-toast-message {
        color: #F3F4F6;
      }

      /* Action Button */
      .mit-toast-action {
        flex-shrink: 0;
        padding: 6px 14px;
        background: rgba(79, 124, 255, 0.1);
        border: 1px solid rgba(79, 124, 255, 0.3);
        border-radius: 6px;
        color: #4F7CFF;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .mit-toast-action:hover {
        background: rgba(79, 124, 255, 0.2);
        border-color: rgba(79, 124, 255, 0.5);
        transform: translateY(-1px);
      }

      /* Close Button */
      .mit-toast-close {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.05);
        color: #6B7280;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mit-toast-close:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #1F2937;
        transform: scale(1.1);
      }

      body[data-theme="dark"] .mit-toast-close {
        background: rgba(255, 255, 255, 0.1);
        color: #D1D5DB;
      }

      body[data-theme="dark"] .mit-toast-close:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #F3F4F6;
      }

      /* Progress Bar */
      .mit-toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #4F7CFF, #00C9A7);
        border-radius: 0 0 0 12px;
        animation: progress linear;
        transform-origin: left;
      }

      @keyframes progress {
        from { width: 0%; }
        to { width: 100%; }
      }

      /* Responsive */
      @media (max-width: 480px) {
        .mit-toast-container {
          right: 16px;
          left: 16px;
          top: 70px;
          max-width: none;
        }

        .mit-toast {
          min-width: 0;
        }
      }

      /* Hover pause progress */
      .mit-toast:hover .mit-toast-progress {
        animation-play-state: paused;
      }
    `;

        document.head.appendChild(style);
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MITToast.init());
} else {
    MITToast.init();
}

// Make it globally available
window.MITToast = MITToast;
window.toast = MITToast; // Shorthand
