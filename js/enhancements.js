/**
 * MIT Frontend Enhancements - World-Class Features
 *
 * This module provides advanced functionality:
 * - Enhanced toast notifications
 * - Loading states and skeleton screens
 * - Scroll reveal animations
 * - Form validation with real-time feedback
 * - Performance monitoring
 * - Error boundary handling
 * - Intersection Observer for lazy loading
 */

(function() {
  'use strict';

  // ============================================================================
  // TOAST NOTIFICATION - USE MITToast FROM toast.js
  // ============================================================================
  // Note: Toast system is now provided by toast.js (MITToast)
  // We ensure it's available or create a minimal fallback

  if (!window.toast) {
    console.warn('⚠️ MITToast not loaded, using basic fallback');
    window.toast = {
      show: (message) => alert(message),
      success: (message) => alert(`✓ ${message}`),
      error: (message) => alert(`✕ ${message}`),
      warning: (message) => alert(`⚠ ${message}`),
      info: (message) => alert(`ℹ ${message}`)
    };
  }

  // ============================================================================
  // LOADING STATE MANAGER
  // ============================================================================

  class LoadingManager {
    constructor() {
      this.overlay = null;
      this.activeLoaders = new Set();
      this.init();
    }

    init() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'loading-overlay';
      this.overlay.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <p id="loading-message">Loading...</p>
        </div>
      `;
      document.body.appendChild(this.overlay);
    }

    show(message = 'Loading...', id = 'default') {
      const messageEl = this.overlay.querySelector('#loading-message');
      if (messageEl) {
        messageEl.textContent = message;
      }

      this.activeLoaders.add(id);
      this.overlay.classList.add('active');
    }

    hide(id = 'default') {
      this.activeLoaders.delete(id);

      if (this.activeLoaders.size === 0) {
        this.overlay.classList.remove('active');
      }
    }

    hideAll() {
      this.activeLoaders.clear();
      this.overlay.classList.remove('active');
    }
  }

  window.loading = new LoadingManager();

  // ============================================================================
  // SCROLL REVEAL ANIMATIONS
  // ============================================================================

  class ScrollReveal {
    constructor() {
      this.observer = null;
      this.elements = [];
      this.init();
    }

    init() {
      if (!('IntersectionObserver' in window)) {
        // Fallback: reveal all elements immediately
        document.querySelectorAll('.scroll-reveal').forEach(el => {
          el.classList.add('revealed');
        });
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      );

      this.observe();
    }

    observe() {
      document.querySelectorAll('.scroll-reveal').forEach(el => {
        this.observer.observe(el);
      });
    }

    refresh() {
      this.observe();
    }
  }

  const scrollReveal = new ScrollReveal();
  window.scrollReveal = scrollReveal;

  // ============================================================================
  // ENHANCED FORM VALIDATION
  // ============================================================================

  class FormValidator {
    constructor(form) {
      this.form = form;
      this.fields = new Map();
      this.init();
    }

    init() {
      if (!this.form) return;

      const inputs = this.form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        this.fields.set(input.name, input);

        // Real-time validation
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => {
          if (input.parentElement.classList.contains('has-error')) {
            this.validateField(input);
          }
        });
      });

      // Form submission
      this.form.addEventListener('submit', (e) => {
        if (!this.validateAll()) {
          e.preventDefault();
          this.focusFirstError();
        }
      });
    }

    validateField(input) {
      const field = input.parentElement;
      const value = input.value.trim();
      let isValid = true;
      let errorMessage = '';

      // Remove previous states
      field.classList.remove('has-error', 'has-success');
      const existingError = field.querySelector('.error-message');
      if (existingError) existingError.remove();

      // Required field validation
      if (input.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
      }

      // Email validation
      if (input.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
      }

      // Phone validation (Bangladesh format)
      if (input.type === 'tel' && value) {
        const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
        if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
          isValid = false;
          errorMessage = 'Please enter a valid phone number';
        }
      }

      // Number validation
      if (input.type === 'number') {
        const min = input.getAttribute('min');
        const max = input.getAttribute('max');
        const numValue = parseFloat(value);

        if (min !== null && numValue < parseFloat(min)) {
          isValid = false;
          errorMessage = `Value must be at least ${min}`;
        }
        if (max !== null && numValue > parseFloat(max)) {
          isValid = false;
          errorMessage = `Value must be at most ${max}`;
        }
      }

      // Update UI
      if (!isValid) {
        field.classList.add('has-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.textContent = errorMessage;
        field.appendChild(errorEl);
      } else if (value) {
        field.classList.add('has-success');
      }

      return isValid;
    }

    validateAll() {
      let isValid = true;
      const inputs = this.form.querySelectorAll('input, select, textarea');

      inputs.forEach(input => {
        if (!this.validateField(input)) {
          isValid = false;
        }
      });

      return isValid;
    }

    focusFirstError() {
      const firstError = this.form.querySelector('.has-error input, .has-error select, .has-error textarea');
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    reset() {
      this.fields.forEach((input) => {
        const field = input.parentElement;
        field.classList.remove('has-error', 'has-success');
        const errorMsg = field.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
      });
    }
  }

  window.FormValidator = FormValidator;

  // ============================================================================
  // LAZY IMAGE LOADING
  // ============================================================================

  class LazyImageLoader {
    constructor() {
      this.observer = null;
      this.init();
    }

    init() {
      if (!('IntersectionObserver' in window)) {
        // Fallback: load all images immediately
        this.loadAllImages();
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px'
        }
      );

      this.observe();
    }

    observe() {
      document.querySelectorAll('img[data-src]').forEach(img => {
        this.observer.observe(img);
      });
    }

    loadImage(img) {
      const src = img.getAttribute('data-src');
      if (!src) return;

      img.addEventListener('load', () => {
        img.classList.add('loaded');
      });

      img.addEventListener('error', () => {
        img.classList.add('error');
        console.error(`Failed to load image: ${src}`);
      });

      img.src = src;
      img.removeAttribute('data-src');
    }

    loadAllImages() {
      document.querySelectorAll('img[data-src]').forEach(img => {
        this.loadImage(img);
      });
    }

    refresh() {
      this.observe();
    }
  }

  const lazyImageLoader = new LazyImageLoader();
  window.lazyImageLoader = lazyImageLoader;

  // ============================================================================
  // PERFORMANCE MONITOR
  // ============================================================================

  class PerformanceMonitor {
    constructor() {
      this.metrics = {};
      this.init();
    }

    init() {
      if (!('performance' in window)) return;

      window.addEventListener('load', () => {
        this.measurePageLoad();
      });
    }

    measurePageLoad() {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (!perfData) return;

      this.metrics = {
        dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
        tcp: Math.round(perfData.connectEnd - perfData.connectStart),
        ttfb: Math.round(perfData.responseStart - perfData.requestStart),
        download: Math.round(perfData.responseEnd - perfData.responseStart),
        domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart),
        domComplete: Math.round(perfData.domComplete - perfData.fetchStart),
        loadComplete: Math.round(perfData.loadEventEnd - perfData.fetchStart)
      };

      // Log in development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.table(this.metrics);
      }
    }

    mark(name) {
      if ('performance' in window && performance.mark) {
        performance.mark(name);
      }
    }

    measure(name, startMark, endMark) {
      if ('performance' in window && performance.measure) {
        try {
          performance.measure(name, startMark, endMark);
          const measure = performance.getEntriesByName(name)[0];
          return Math.round(measure.duration);
        } catch (e) {
          console.warn('Performance measure failed:', e);
        }
      }
      return null;
    }
  }

  window.performanceMonitor = new PerformanceMonitor();

  // ============================================================================
  // ERROR HANDLER
  // ============================================================================

  class ErrorHandler {
    constructor() {
      this.init();
    }

    init() {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.handleError(event.error || event.message);
      });

      // Promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason);
      });
    }

    handleError(error) {
      console.error('Application error:', error);

      // Show user-friendly message
      if (window.toast) {
        window.toast.error('An unexpected error occurred. Please try again.');
      }

      // Log to analytics (if available)
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message || String(error),
          fatal: false
        });
      }
    }

    logError(error, context = '') {
      console.error(`Error in ${context}:`, error);

      if (window.toast) {
        window.toast.error(`Error: ${error.message || 'Something went wrong'}`);
      }
    }
  }

  window.errorHandler = new ErrorHandler();

  // ============================================================================
  // DEBOUNCE & THROTTLE UTILITIES
  // ============================================================================

  window.debounce = function(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  window.throttle = function(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // ============================================================================
  // RIPPLE EFFECT FOR INTERACTIVE ELEMENTS
  // ============================================================================

  function addRippleEffect(element, event) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');

    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  // Apply ripple to cards
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card && !e.target.closest('button, a, input, select, textarea')) {
      addRippleEffect(card, e);
    }
  }, true);

  // ============================================================================
  // KEYBOARD NAVIGATION HELPER
  // ============================================================================

  class KeyboardNavigationHelper {
    constructor() {
      this.init();
    }

    init() {
      // Show focus outline only when using keyboard
      document.addEventListener('mousedown', () => {
        document.body.classList.add('using-mouse');
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          document.body.classList.remove('using-mouse');
        }

        // Escape key closes modals
        if (e.key === 'Escape') {
          const openModal = document.querySelector('dialog[open]');
          if (openModal) {
            openModal.close();
          }
        }
      });
    }
  }

  new KeyboardNavigationHelper();

  // ============================================================================
  // SMOOTH SCROLL TO TOP
  // ============================================================================

  function initBackToTop() {
    const button = document.getElementById('backToTop');
    if (!button || button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';

    const toggleVisibility = window.throttle(() => {
      if (window.pageYOffset > 300) {
        button.classList.add('visible');
      } else {
        button.classList.remove('visible');
      }
    }, 100);

    window.addEventListener('scroll', toggleVisibility);

    button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ============================================================================
  // INITIALIZE ON DOM READY
  // ============================================================================

  function initialize() {
    initBackToTop();

    // Initialize form validators
    document.querySelectorAll('form[data-validate]').forEach(form => {
      new FormValidator(form);
    });

    // Add page transition effect
    document.body.classList.add('page-transition');
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Refresh observers on dynamic content
  window.addEventListener('mit:content-updated', () => {
    scrollReveal.refresh();
    lazyImageLoader.refresh();
  });

})();
