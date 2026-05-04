/**
 * MIT Advanced Features Module
 * - Live Chat Widget
 * - Testimonials Carousel
 * - Achievements Section
 * - Course Comparison
 * - Search Functionality
 * - Gallery Lightbox
 */

(function() {
  'use strict';

  // ============================================================================
  // LIVE CHAT WIDGET
  // ============================================================================

  class LiveChatWidget {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.widget = null;
      this.init();
    }

    init() {
      this.createWidget();
      this.loadWelcomeMessage();
      this.setupEventListeners();
    }

    createWidget() {
      const widgetHTML = `
        <div class="chat-widget" id="chatWidget">
          <div class="chat-header" id="chatHeader">
            <div class="chat-avatar">
              <img src="assets/logo.jpg" alt="MIT Support">
            </div>
            <div class="chat-info">
              <h4>MIT Support</h4>
              <p class="chat-status">
                <span class="status-dot"></span>
                Online - We typically reply in minutes
              </p>
            </div>
            <button class="chat-close" id="chatClose" aria-label="Close chat">×</button>
          </div>

          <div class="chat-body" id="chatBody">
            <div class="chat-messages" id="chatMessages"></div>
          </div>

          <div class="chat-footer">
            <input
              type="text"
              id="chatInput"
              placeholder="Type your message..."
              class="chat-input"
              maxlength="500"
            >
            <button class="chat-send" id="chatSend" aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>

          <div class="chat-quick-actions">
            <button class="quick-action-btn" data-message="I want to enroll in a course">
              📚 Enroll in Course
            </button>
            <button class="quick-action-btn" data-message="What are the course fees?">
              💰 Course Fees
            </button>
            <button class="quick-action-btn" data-message="What is the admission process?">
              📝 Admission Process
            </button>
            <button class="quick-action-btn" data-message="Can I visit the institute?">
              📍 Visit Institute
            </button>
          </div>
        </div>

        <button class="chat-toggle" id="chatToggle" aria-label="Open chat">
          <svg class="chat-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span class="chat-badge">1</span>
        </button>
      `;

      document.body.insertAdjacentHTML('beforeend', widgetHTML);
      this.widget = document.getElementById('chatWidget');
    }

    setupEventListeners() {
      const toggle = document.getElementById('chatToggle');
      const close = document.getElementById('chatClose');
      const send = document.getElementById('chatSend');
      const input = document.getElementById('chatInput');
      const quickActions = document.querySelectorAll('.quick-action-btn');

      toggle.addEventListener('click', () => this.toggleChat());
      close.addEventListener('click', () => this.closeChat());
      send.addEventListener('click', () => this.sendMessage());
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });

      quickActions.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const message = e.currentTarget.getAttribute('data-message');
          if (message) {
            this.sendQuickMessage(message);
          }
        });
      });
    }

    toggleChat() {
      this.isOpen = !this.isOpen;
      this.widget.classList.toggle('open');
      document.getElementById('chatToggle').classList.toggle('active');

      if (this.isOpen) {
        document.getElementById('chatInput').focus();
        this.removeBadge();
      }
    }

    closeChat() {
      this.isOpen = false;
      this.widget.classList.remove('open');
      document.getElementById('chatToggle').classList.remove('active');
    }

    removeBadge() {
      const badge = document.querySelector('.chat-badge');
      if (badge) badge.style.display = 'none';
    }

    loadWelcomeMessage() {
      setTimeout(() => {
        this.addBotMessage(
          "👋 Hi! Welcome to Markiety IT Institute. How can I help you today?"
        );
      }, 1000);
    }

    sendMessage() {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();

      if (!text) return;

      this.addUserMessage(text);
      input.value = '';

      // Simulate bot response
      setTimeout(() => {
        this.handleBotResponse(text);
      }, 1000);
    }

    sendQuickMessage(text) {
      this.addUserMessage(text);
      setTimeout(() => {
        this.handleBotResponse(text);
      }, 1000);
    }

    addUserMessage(text) {
      const messageHTML = `
        <div class="chat-message user-message">
          <div class="message-content">${this.escapeHtml(text)}</div>
          <div class="message-time">${this.getTime()}</div>
        </div>
      `;
      this.appendMessage(messageHTML);
    }

    addBotMessage(text) {
      const messageHTML = `
        <div class="chat-message bot-message">
          <div class="message-avatar">
            <img src="assets/logo.jpg" alt="MIT">
          </div>
          <div class="message-bubble">
            <div class="message-content">${text}</div>
            <div class="message-time">${this.getTime()}</div>
          </div>
        </div>
      `;
      this.appendMessage(messageHTML);
    }

    handleBotResponse(userMessage) {
      const lowerMsg = userMessage.toLowerCase();
      let response = '';

      if (lowerMsg.includes('course') || lowerMsg.includes('enroll')) {
        response = `We offer 5 amazing courses:<br>
          📱 Digital Marketing - BDT 5,500<br>
          🎨 Graphics Design - BDT 4,500<br>
          🎬 Video Editing - BDT 4,500<br>
          💻 Basic Computer - BDT 2,500<br>
          🚀 Freelancing - BDT 3,500<br><br>
          <a href="courses.html" class="chat-link">View All Courses →</a>`;
      } else if (lowerMsg.includes('fee') || lowerMsg.includes('price') || lowerMsg.includes('cost')) {
        response = `Our course fees range from BDT 2,500 to 5,500. We also offer:<br>
          ✅ Discount for early enrollment<br>
          ✅ Installment payment options<br>
          ✅ Government-approved certificates<br><br>
          Call us: <a href="tel:+8801624547667" class="chat-link">+880 1624-547667</a>`;
      } else if (lowerMsg.includes('admission') || lowerMsg.includes('apply')) {
        response = `📝 Admission Process:<br>
          1. Choose your course<br>
          2. Fill the admission form<br>
          3. Make payment (bKash/Cash)<br>
          4. Get instant confirmation<br><br>
          <a href="admission.html" class="chat-link">Apply Now →</a>`;
      } else if (lowerMsg.includes('visit') || lowerMsg.includes('location') || lowerMsg.includes('address')) {
        response = `📍 Visit us at:<br>
          Nodi Bangla Manik Palace<br>
          2nd Floor, 39 No Shop<br>
          Madhabdi, Narsingdi - 1604<br><br>
          <a href="https://maps.app.goo.gl/Vebu5WxQRrY8dPhG8" target="_blank" class="chat-link">Get Directions →</a>`;
      } else if (lowerMsg.includes('time') || lowerMsg.includes('schedule')) {
        response = `🕐 We're open:<br>
          Saturday - Thursday<br>
          9:00 AM - 8:00 PM<br><br>
          Friday: Closed`;
      } else if (lowerMsg.includes('contact') || lowerMsg.includes('call') || lowerMsg.includes('phone')) {
        response = `📞 Contact us:<br>
          Phone: <a href="tel:+8801624547667" class="chat-link">+880 1624-547667</a><br>
          Email: <a href="mailto:markietyitinstitute@gmail.com" class="chat-link">markietyitinstitute@gmail.com</a><br>
          WhatsApp: <a href="https://wa.me/8801624547667" target="_blank" class="chat-link">Chat Now</a>`;
      } else {
        response = `Thank you for your message! For immediate assistance:<br><br>
          📞 Call: <a href="tel:+8801624547667" class="chat-link">+880 1624-547667</a><br>
          💬 WhatsApp: <a href="https://wa.me/8801624547667" target="_blank" class="chat-link">Chat Now</a><br>
          📧 Email: <a href="mailto:markietyitinstitute@gmail.com" class="chat-link">Email Us</a>`;
      }

      this.addBotMessage(response);
    }

    appendMessage(html) {
      const messagesContainer = document.getElementById('chatMessages');
      messagesContainer.insertAdjacentHTML('beforeend', html);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    getTime() {
      const now = new Date();
      return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // ============================================================================
  // TESTIMONIALS CAROUSEL
  // ============================================================================

  class TestimonialsCarousel {
    constructor(container) {
      this.container = container;
      this.currentIndex = 0;
      this.testimonials = [
        {
          name: "Tahsin Ahmed",
          role: "Digital Marketing Graduate",
          course: "Digital Marketing",
          rating: 5,
          text: "MIT gave me the roadmap to master paid ads and scale campaigns for local brands. The mentors are invested in your success. Now I'm running campaigns for 10+ clients!",
          image: "assets/instructors/placeholder.svg",
          achievement: "Meta Ads Specialist at Tech Startup"
        },
        {
          name: "Sadia Rahman",
          role: "Freelancing Success Story",
          course: "Freelancing & Career",
          rating: 5,
          text: "The portfolio feedback sessions helped me land my first international clients on Fiverr. Everything is practical and hands-on. Earning $500+ monthly now!",
          image: "assets/instructors/placeholder.svg",
          achievement: "Level 2 Seller on Fiverr"
        },
        {
          name: "Habib Khan",
          role: "Video Editing Graduate",
          course: "Video Editing",
          rating: 5,
          text: "I loved the supportive community. From instructors to peers, everyone shares opportunities to grow together. Now working with top YouTubers!",
          image: "assets/instructors/placeholder.svg",
          achievement: "Content Creator & Professional Editor"
        },
        {
          name: "Nusrat Jahan",
          role: "Graphics Design Graduate",
          course: "Graphics Design",
          rating: 5,
          text: "MIT transformed my creative skills. The Canva and Photoshop training was excellent. Within 2 months, I started my own design agency!",
          image: "assets/instructors/placeholder.svg",
          achievement: "Founder of Creative Design Studio"
        },
        {
          name: "Rakib Hassan",
          role: "Computer Training Graduate",
          course: "Basic Computer",
          rating: 5,
          text: "Best computer training in Madhabdi! The instructors are patient and explain everything clearly. Got a job in a local office within 3 weeks!",
          image: "assets/instructors/placeholder.svg",
          achievement: "Data Entry Specialist"
        }
      ];
      this.init();
    }

    init() {
      if (!this.container) return;
      this.render();
      this.setupControls();
      this.startAutoPlay();
    }

    render() {
      const carouselHTML = `
        <div class="testimonials-carousel">
          <div class="carousel-track" id="carouselTrack">
            ${this.testimonials.map((t, i) => this.createTestimonialCard(t, i)).join('')}
          </div>
          <div class="carousel-controls">
            <button class="carousel-btn prev" id="carouselPrev" aria-label="Previous testimonial">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div class="carousel-dots" id="carouselDots">
              ${this.testimonials.map((_, i) =>
                `<button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Go to testimonial ${i + 1}"></button>`
              ).join('')}
            </div>
            <button class="carousel-btn next" id="carouselNext" aria-label="Next testimonial">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
      this.container.innerHTML = carouselHTML;
    }

    createTestimonialCard(testimonial, index) {
      return `
        <div class="testimonial-card ${index === 0 ? 'active' : ''}" data-index="${index}">
          <div class="testimonial-header">
            <img src="${testimonial.image}" alt="${testimonial.name}" class="testimonial-avatar">
            <div class="testimonial-info">
              <h4>${testimonial.name}</h4>
              <p class="testimonial-role">${testimonial.role}</p>
              <div class="testimonial-rating">
                ${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}
              </div>
            </div>
          </div>
          <blockquote class="testimonial-text">"${testimonial.text}"</blockquote>
          <div class="testimonial-footer">
            <span class="testimonial-course">📚 ${testimonial.course}</span>
            <span class="testimonial-achievement">🏆 ${testimonial.achievement}</span>
          </div>
        </div>
      `;
    }

    setupControls() {
      const prevBtn = document.getElementById('carouselPrev');
      const nextBtn = document.getElementById('carouselNext');
      const dots = document.querySelectorAll('.carousel-dot');

      prevBtn?.addEventListener('click', () => this.prev());
      nextBtn?.addEventListener('click', () => this.next());

      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          const index = parseInt(e.currentTarget.getAttribute('data-index'));
          if (!isNaN(index)) {
            this.goTo(index);
          }
        });
      });

      // Touch/swipe support
      let startX = 0;
      const track = document.getElementById('carouselTrack');

      track?.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
      });

      track?.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) {
          if (diff > 0) this.next();
          else this.prev();
        }
      });
    }

    next() {
      this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
      this.update();
    }

    prev() {
      this.currentIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
      this.update();
    }

    goTo(index) {
      this.currentIndex = index;
      this.update();
    }

    update() {
      const cards = document.querySelectorAll('.testimonial-card');
      const dots = document.querySelectorAll('.carousel-dot');

      cards.forEach((card, i) => {
        card.classList.toggle('active', i === this.currentIndex);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === this.currentIndex);
      });

      const track = document.getElementById('carouselTrack');
      if (track) {
        track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
      }
    }

    startAutoPlay() {
      setInterval(() => {
        if (!document.hidden) {
          this.next();
        }
      }, 5000);
    }
  }

  // ============================================================================
  // SITE SEARCH
  // ============================================================================

  class SiteSearch {
    constructor() {
      this.searchData = [];
      this.init();
    }

    init() {
      this.createSearchBar();
      this.loadSearchData();
      this.setupEventListeners();
    }

    createSearchBar() {
      const searchHTML = `
        <div class="search-overlay" id="searchOverlay">
          <div class="search-modal">
            <div class="search-header">
              <input
                type="search"
                id="siteSearch"
                placeholder="Search courses, instructors, or content..."
                class="search-input"
                autocomplete="off"
              >
              <button class="search-close" id="searchClose" aria-label="Close search">×</button>
            </div>
            <div class="search-results" id="searchResults"></div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', searchHTML);
    }

    loadSearchData() {
      // Load searchable content
      this.searchData = [
        { type: 'course', title: 'Digital Marketing', url: 'courses.html', description: 'SEO, Social Media, Google Ads, Meta Ads' },
        { type: 'course', title: 'Graphics Design', url: 'courses.html', description: 'Canva, Photoshop, Illustrator' },
        { type: 'course', title: 'Video Editing', url: 'courses.html', description: 'Premiere Pro, CapCut' },
        { type: 'course', title: 'Basic Computer', url: 'courses.html', description: 'Microsoft Office, Internet' },
        { type: 'course', title: 'Freelancing', url: 'courses.html', description: 'Fiverr, Upwork, Portfolio' },
        { type: 'page', title: 'Admission', url: 'admission.html', description: 'Enroll in courses' },
        { type: 'page', title: 'Contact Us', url: 'contact.html', description: 'Get in touch' },
        { type: 'page', title: 'About MIT', url: 'about.html', description: 'Learn about us' },
        { type: 'instructor', title: 'Md. Tuhin Khandakar', url: 'instructors.html', description: 'Digital Marketing Expert' },
        { type: 'instructor', title: 'Iqbal', url: 'instructors.html', description: 'Graphics Design Specialist' },
        { type: 'instructor', title: 'Md. Mahin', url: 'instructors.html', description: 'Video Editing Expert' }
      ];
    }

    setupEventListeners() {
      const input = document.getElementById('siteSearch');
      const overlay = document.getElementById('searchOverlay');
      const closeBtn = document.getElementById('searchClose');

      // Open search with Ctrl/Cmd + K
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          this.openSearch();
        }
        if (e.key === 'Escape') {
          this.closeSearch();
        }
      });

      input?.addEventListener('input', (e) => {
        this.performSearch(e.target.value);
      });

      closeBtn?.addEventListener('click', () => this.closeSearch());
      overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeSearch();
      });
    }

    openSearch() {
      const overlay = document.getElementById('searchOverlay');
      const input = document.getElementById('siteSearch');
      overlay?.classList.add('active');
      input?.focus();
    }

    closeSearch() {
      const overlay = document.getElementById('searchOverlay');
      overlay?.classList.remove('active');
    }

    performSearch(query) {
      const results = document.getElementById('searchResults');
      if (!query || query.length < 2) {
        results.innerHTML = '<p class="search-empty">Type to search...</p>';
        return;
      }

      const matches = this.searchData.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );

      if (matches.length === 0) {
        results.innerHTML = '<p class="search-empty">No results found</p>';
        return;
      }

      const html = matches.map(item => `
        <a href="${item.url}" class="search-result-item">
          <span class="search-result-type">${item.type}</span>
          <div class="search-result-content">
            <h4>${this.highlight(item.title, query)}</h4>
            <p>${this.highlight(item.description, query)}</p>
          </div>
        </a>
      `).join('');

      results.innerHTML = html;
    }

    highlight(text, query) {
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }
  }

  // ============================================================================
  // INITIALIZE ALL FEATURES
  // ============================================================================

  function initAdvancedFeatures() {
    // Initialize Live Chat
    if (!document.getElementById('chatWidget')) {
      new LiveChatWidget();
      console.log('✅ Live Chat Widget Loaded');
    }

    // Initialize Testimonials Carousel
    const testimonialsContainer = document.getElementById('testimonialsCarousel');
    if (testimonialsContainer) {
      new TestimonialsCarousel(testimonialsContainer);
      console.log('✅ Testimonials Carousel Loaded');
    }

    // Initialize Site Search
    new SiteSearch();
    console.log('✅ Site Search Loaded');

    // Add search trigger button to header
    addSearchButton();
  }

  function addSearchButton() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('searchTrigger')) {
      const searchBtn = document.createElement('button');
      searchBtn.type = 'button';
      searchBtn.id = 'searchTrigger';
      searchBtn.className = 'icon-btn';
      searchBtn.setAttribute('aria-label', 'Search');
      searchBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      `;
      searchBtn.addEventListener('click', () => {
        const overlay = document.getElementById('searchOverlay');
        overlay?.classList.add('active');
        document.getElementById('siteSearch')?.focus();
      });
      headerActions.insertBefore(searchBtn, headerActions.firstChild);
    }
  }

  // ============================================================================
  // GALLERY LIGHTBOX
  // ============================================================================

  class GalleryLightbox {
    constructor() {
      this.currentIndex = 0;
      this.images = [];
      this.init();
    }

    init() {
      this.createLightbox();
      this.attachGalleryListeners();
    }

    createLightbox() {
      const lightboxHTML = `
        <div class="lightbox-overlay" id="lightboxOverlay">
          <button class="lightbox-close" id="lightboxClose" aria-label="Close gallery">×</button>
          <button class="lightbox-prev" id="lightboxPrev" aria-label="Previous image">‹</button>
          <button class="lightbox-next" id="lightboxNext" aria-label="Next image">›</button>
          <div class="lightbox-content">
            <img id="lightboxImage" src="" alt="">
            <div class="lightbox-caption" id="lightboxCaption"></div>
            <div class="lightbox-counter" id="lightboxCounter"></div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', lightboxHTML);

      // Event listeners
      document.getElementById('lightboxClose')?.addEventListener('click', () => this.close());
      document.getElementById('lightboxPrev')?.addEventListener('click', () => this.prev());
      document.getElementById('lightboxNext')?.addEventListener('click', () => this.next());

      document.getElementById('lightboxOverlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'lightboxOverlay') this.close();
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('lightboxOverlay');
        if (overlay?.classList.contains('active')) {
          if (e.key === 'Escape') this.close();
          if (e.key === 'ArrowLeft') this.prev();
          if (e.key === 'ArrowRight') this.next();
        }
      });
    }

    attachGalleryListeners() {
      // Wait for gallery to be rendered
      setTimeout(() => {
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach((item, index) => {
          item.addEventListener('click', () => {
            this.open(index);
          });
        });
      }, 500);
    }

    open(index) {
      const galleryItems = document.querySelectorAll('.gallery-item');
      this.images = Array.from(galleryItems).map(item => ({
        src: item.dataset.full || item.querySelector('img')?.src,
        caption: item.dataset.caption || item.querySelector('img')?.alt || ''
      }));

      if (this.images.length === 0) return;

      this.currentIndex = index;
      this.updateDisplay();
      document.getElementById('lightboxOverlay')?.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    close() {
      document.getElementById('lightboxOverlay')?.classList.remove('active');
      document.body.style.overflow = '';
    }

    next() {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      this.updateDisplay();
    }

    prev() {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.updateDisplay();
    }

    updateDisplay() {
      const img = document.getElementById('lightboxImage');
      const caption = document.getElementById('lightboxCaption');
      const counter = document.getElementById('lightboxCounter');

      if (img && this.images[this.currentIndex]) {
        img.src = this.images[this.currentIndex].src;
        img.alt = this.images[this.currentIndex].caption;

        if (caption) {
          caption.textContent = this.images[this.currentIndex].caption;
        }

        if (counter) {
          counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        }
      }
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedFeatures);
  } else {
    initAdvancedFeatures();
  }

  // Initialize gallery if gallery section exists
  if (document.querySelector('.gallery-grid') || document.querySelector('.gallery-item')) {
    new GalleryLightbox();
  }

  // Export for external use
  window.MITFeatures = {
    LiveChat: LiveChatWidget,
    Testimonials: TestimonialsCarousel,
    Search: SiteSearch,
    Gallery: GalleryLightbox
  };

})();
