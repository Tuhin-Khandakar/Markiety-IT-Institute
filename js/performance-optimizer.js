/**
 * MIT Performance Optimization Module
 * - Lazy loading images
 * - WebP format support
 * - Resource hints
 * - Performance monitoring
 * - Cache management
 */

(function() {
  'use strict';

  // ============================================================================
  // IMAGE LAZY LOADING & WebP SUPPORT
  // ============================================================================

  class ImageOptimizer {
    constructor() {
      this.supportsWebP = false;
      this.init();
    }

    async init() {
      await this.checkWebPSupport();
      this.setupLazyLoading();
      this.optimizeExistingImages();
    }

    async checkWebPSupport() {
      return new Promise((resolve) => {
        const webP = new Image();
        webP.onload = webP.onerror = () => {
          this.supportsWebP = (webP.height === 2);
          document.documentElement.classList.add(this.supportsWebP ? 'webp' : 'no-webp');
          resolve(this.supportsWebP);
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      });
    }

    setupLazyLoading() {
      // Use Intersection Observer for lazy loading
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this.loadImage(img);
              observer.unobserve(img);
            }
          });
        }, {
          rootMargin: '50px 0px',
          threshold: 0.01
        });

        // Observe all images with loading="lazy" or data-src
        document.querySelectorAll('img[loading="lazy"], img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      } else {
        // Fallback for older browsers
        document.querySelectorAll('img[data-src]').forEach(img => {
          this.loadImage(img);
        });
      }
    }

    loadImage(img) {
      const src = img.dataset.src || img.src;

      if (img.dataset.src) {
        // Create a temporary image to load
        const tempImg = new Image();
        tempImg.onload = () => {
          img.src = src;
          img.classList.add('loaded');
        };
        tempImg.src = src;
      }

      // Add srcset for responsive images
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
      }
    }

    optimizeExistingImages() {
      // Add width and height attributes to prevent layout shift
      document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
        if (img.naturalWidth && img.naturalHeight) {
          img.setAttribute('width', img.naturalWidth);
          img.setAttribute('height', img.naturalHeight);
        }
      });
    }
  }

  // ============================================================================
  // RESOURCE PRELOADING & PREFETCHING
  // ============================================================================

  class ResourceOptimizer {
    constructor() {
      this.init();
    }

    init() {
      this.preloadCriticalResources();
      this.prefetchNextPages();
      this.setupServiceWorker();
    }

    preloadCriticalResources() {
      // Preload critical fonts
      const fontPreload = document.createElement('link');
      fontPreload.rel = 'preload';
      fontPreload.as = 'font';
      fontPreload.type = 'font/woff2';
      fontPreload.crossOrigin = 'anonymous';
      fontPreload.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2';
      document.head.appendChild(fontPreload);
    }

    prefetchNextPages() {
      // Prefetch likely next pages
      const prefetchPages = [
        'courses.html',
        'admission.html',
        'about.html'
      ];

      prefetchPages.forEach(page => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
      });
    }

    setupServiceWorker() {
      // Register service worker for offline support (if available)
      if ('serviceWorker' in navigator && location.protocol === 'https:') {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('ServiceWorker registered:', registration.scope);
            })
            .catch(err => {
              console.log('ServiceWorker registration failed:', err);
            });
        });
      }
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  class PerformanceMonitor {
    constructor() {
      this.metrics = {};
      this.init();
    }

    init() {
      if ('PerformanceObserver' in window) {
        this.observeWebVitals();
      }

      window.addEventListener('load', () => {
        this.measurePageLoad();
      });
    }

    observeWebVitals() {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        this.reportMetric('LCP', this.metrics.lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
        this.reportMetric('CLS', this.metrics.cls);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    measurePageLoad() {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;

        this.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        this.metrics.firstPaint = timing.responseEnd - timing.fetchStart;

        // Log metrics in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log('📊 Performance Metrics:', {
            pageLoadTime: `${this.metrics.pageLoadTime}ms`,
            domContentLoaded: `${this.metrics.domContentLoaded}ms`,
            firstPaint: `${this.metrics.firstPaint}ms`,
            lcp: this.metrics.lcp ? `${this.metrics.lcp}ms` : 'measuring...',
            fid: this.metrics.fid ? `${this.metrics.fid}ms` : 'waiting for interaction...',
            cls: this.metrics.cls || 0
          });
        }
      }
    }

    reportMetric(name, value) {
      // In production, send to analytics
      // For now, just log in development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`📈 ${name}:`, value);
      }

      // You can integrate with Google Analytics here:
      // if (window.gtag) {
      //   gtag('event', 'web_vitals', {
      //     name: name,
      //     value: Math.round(value),
      //     event_category: 'Web Vitals'
      //   });
      // }
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  class CacheManager {
    constructor() {
      this.cacheName = 'mit-cache-v1';
      this.init();
    }

    init() {
      this.clearOldCaches();
      this.setupCaching();
    }

    clearOldCaches() {
      // Clear old caches on page load
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name !== this.cacheName) {
              caches.delete(name);
            }
          });
        });
      }
    }

    setupCaching() {
      // Cache static assets
      if ('caches' in window) {
        const staticAssets = [
          '/css/style.css',
          '/css/advanced-features.css',
          '/js/app.js',
          '/js/enhancements.js',
          '/js/advanced-features.js',
          '/assets/logo.jpg'
        ];

        caches.open(this.cacheName).then(cache => {
          cache.addAll(staticAssets).catch(err => {
            console.log('Cache add failed:', err);
          });
        });
      }
    }
  }

  // ============================================================================
  // CONNECTION AWARE LOADING
  // ============================================================================

  class ConnectionAwareLoader {
    constructor() {
      this.connection = null;
      this.init();
    }

    init() {
      if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
        this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        this.adaptToConnection();

        this.connection.addEventListener('change', () => {
          this.adaptToConnection();
        });
      }
    }

    adaptToConnection() {
      if (!this.connection) return;

      const effectiveType = this.connection.effectiveType;
      const saveData = this.connection.saveData;

      // Disable high-quality images on slow connections
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        document.documentElement.classList.add('low-bandwidth');

        // Disable autoplay videos
        document.querySelectorAll('video[autoplay]').forEach(video => {
          video.removeAttribute('autoplay');
        });

        console.log('💾 Low bandwidth mode activated');
      } else {
        document.documentElement.classList.remove('low-bandwidth');
      }
    }
  }

  // ============================================================================
  // INITIALIZE ALL OPTIMIZERS
  // ============================================================================

  function initPerformanceOptimization() {
    try {
      new ImageOptimizer();
      new ResourceOptimizer();
      new PerformanceMonitor();
      new CacheManager();
      new ConnectionAwareLoader();

      console.log('⚡ Performance optimization activated');
    } catch (error) {
      console.error('Performance optimization error:', error);
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformanceOptimization);
  } else {
    initPerformanceOptimization();
  }

  // Export for external use
  window.MITPerformance = {
    ImageOptimizer,
    ResourceOptimizer,
    PerformanceMonitor,
    CacheManager
  };

})();
