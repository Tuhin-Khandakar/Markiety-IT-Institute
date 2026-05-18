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

    get assetBase() {
      const path = window.location.pathname;
      if (path.includes('/admin/') || path.includes('/students/')) {
        return '../assets';
      }
      return 'assets';
    }

    createWidget() {
      const isBn = window.location.pathname.endsWith('-bn.html');
      const logoUrl = `${this.assetBase}/logo.jpg`;
      const t = {
        title: isBn ? 'এমআইটি সমর্থন' : 'MIT Support',
        status: isBn ? 'অনলাইন - আমরা সাধারণত কয়েক মিনিটের মধ্যে উত্তর দিই' : 'Online - We typically reply in minutes',
        placeholder: isBn ? 'আপনার বার্তা টাইপ করুন...' : 'Type your message...',
        enroll: isBn ? '📚 কোর্সে ভর্তি হন' : '📚 Enroll in Course',
        fees: isBn ? '💰 কোর্স ফি' : '💰 Course Fees',
        admission: isBn ? '📝 ভর্তি প্রক্রিয়া' : '📝 Admission Process',
        visit: isBn ? '📍 ইনস্টিটিউট পরিদর্শন করুন' : '📍 Visit Institute',
      };
      
      const widgetHTML = `
        <div class="chat-widget" id="chatWidget">
          <div class="chat-header" id="chatHeader">
            <div class="chat-avatar">
              <img src="${logoUrl}" alt="${t.title}">
            </div>
            <div class="chat-info">
              <h4>${t.title}</h4>
              <p class="chat-status">
                <span class="status-dot"></span>
                ${t.status}
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
              placeholder="${t.placeholder}"
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
              ${t.enroll}
            </button>
            <button class="quick-action-btn" data-message="What are the course fees?">
              ${t.fees}
            </button>
            <button class="quick-action-btn" data-message="What is the admission process?">
              ${t.admission}
            </button>
            <button class="quick-action-btn" data-message="Can I visit the institute?">
              ${t.visit}
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
        const isBn = window.location.pathname.endsWith('-bn.html');
        this.addBotMessage(
          isBn ? "👋 নমস্কার! মার্কিটি আইটি ইনস্টিটিউটে আপনাকে স্বাগতম। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?" : "👋 Hi! Welcome to Markiety IT Institute. How can I help you today?"
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
      const logoUrl = `${this.assetBase}/logo.jpg`;
      const messageHTML = `
        <div class="chat-message bot-message">
          <div class="message-avatar">
            <img src="${logoUrl}" alt="MIT">
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
      
      const isBn = window.location.pathname.endsWith('-bn.html');
      
      this.testimonials = [
        {
          name: isBn ? "তাহসিন আহমেদ" : "Tahsin Ahmed",
          role: isBn ? "ডিজিটাল মার্কেটিং স্নাতক" : "Digital Marketing Graduate",
          course: isBn ? "ডিজিটাল মার্কেটিং" : "Digital Marketing",
          rating: 5,
          text: isBn ? "এমআইটি আমাকে পেইড অ্যাডস-এ দক্ষতা অর্জন এবং স্থানীয় ব্র্যান্ডগুলোর জন্য ক্যাম্পেইন সম্প্রসারণ করার পথ দেখিয়েছে। এখানকার মেন্টররা আপনার সাফল্যে আন্তরিকভাবে আগ্রহী। এখন আমি ১০টিরও বেশি ক্লায়েন্টের জন্য ক্যাম্পেইন পরিচালনা করছি!" : "MIT gave me the roadmap to master paid ads and scale campaigns for local brands. The mentors are invested in your success. Now I'm running campaigns for 10+ clients!",
          image: "assets/instructors/placeholder.svg",
          achievement: isBn ? "টেক স্টার্টআপে মেটা অ্যাডস স্পেশালিস্ট" : "Meta Ads Specialist at Tech Startup"
        },
        {
          name: isBn ? "সাদিয়া রহমান" : "Sadia Rahman",
          role: isBn ? "ফ্রিল্যান্সিং সাফল্যের গল্প" : "Freelancing Success Story",
          course: isBn ? "ফ্রিল্যান্সিং ও ক্যারিয়ার" : "Freelancing & Career",
          rating: 5,
          text: isBn ? "পোর্টফোলিও ফিডব্যাক সেশনগুলো আমাকে ফাইভার-এ আমার প্রথম আন্তর্জাতিক ক্লায়েন্ট পেতে সাহায্য করেছে। সবকিছুই বাস্তবসম্মত এবং হাতে-কলমে শেখানোর মতো। এখন মাসে ৫০০ ডলারেরও বেশি আয় করছি!" : "The portfolio feedback sessions helped me land my first international clients on Fiverr. Everything is practical and hands-on. Earning $500+ monthly now!",
          image: "assets/instructors/placeholder.svg",
          achievement: isBn ? "ফাইভার-এ লেভেল ২ সেলার" : "Level 2 Seller on Fiverr"
        },
        {
          name: isBn ? "হাবিব খান" : "Habib Khan",
          role: isBn ? "ভিডিও সম্পাদনা স্নাতক" : "Video Editing Graduate",
          course: isBn ? "ভিডিও সম্পাদনা" : "Video Editing",
          rating: 5,
          text: isBn ? "এখানকার সহায়ক পরিবেশ আমার খুব ভালো লেগেছে। প্রশিক্ষক থেকে শুরু করে সহপাঠী পর্যন্ত, সবাই একসাথে বেড়ে ওঠার সুযোগ করে দেয়। এখন শীর্ষস্থানীয় ইউটিউবারদের সাথে কাজ করছি!" : "I loved the supportive community. From instructors to peers, everyone shares opportunities to grow together. Now working with top YouTubers!",
          image: "assets/instructors/placeholder.svg",
          achievement: isBn ? "কন্টেন্ট ক্রিয়েটর ও পেশাদার সম্পাদক" : "Content Creator & Professional Editor"
        },
        {
          name: isBn ? "নুসরাত জাহান" : "Nusrat Jahan",
          role: isBn ? "গ্রাফিক্স ডিজাইন স্নাতক" : "Graphics Design Graduate",
          course: isBn ? "গ্রাফিক্স ডিজাইন" : "Graphics Design",
          rating: 5,
          text: isBn ? "এমআইটি আমার সৃজনশীল দক্ষতাকে আমূল বদলে দিয়েছে। ক্যানভা এবং ফটোশপের প্রশিক্ষণটি ছিল চমৎকার। মাত্র ২ মাসের মধ্যেই আমি নিজের ডিজাইন এজেন্সি শুরু করে দিয়েছি!" : "MIT transformed my creative skills. The Canva and Photoshop training was excellent. Within 2 months, I started my own design agency!",
          image: "assets/instructors/placeholder.svg",
          achievement: isBn ? "ক্রিয়েটিভ ডিজাইন স্টুডিওর প্রতিষ্ঠাতা" : "Founder of Creative Design Studio"
        },
        {
          name: isBn ? "রাকিব হাসান" : "Rakib Hassan",
          role: isBn ? "কম্পিউটার প্রশিক্ষণ স্নাতক" : "Computer Training Graduate",
          course: isBn ? "বেসিক কম্পিউটার" : "Basic Computer",
          rating: 5,
          text: isBn ? "মাধবড়িতে সেরা কম্পিউটার প্রশিক্ষণ! প্রশিক্ষকরা খুবই ধৈর্যশীল এবং সবকিছু পরিষ্কারভাবে বুঝিয়ে দেন। ৩ সপ্তাহের মধ্যেই স্থানীয় একটি অফিসে চাকরি পেয়েছি!" : "Best computer training in Madhabdi! The instructors are patient and explain everything clearly. Got a job in a local office within 3 weeks!",
          image: "assets/instructors/placeholder.svg",
          achievement: isBn ? "ডেটা এন্ট্রি স্পেশালিস্ট" : "Data Entry Specialist"
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

    get baseUrl() {
      const path = window.location.pathname;
      if (path.includes('/admin/') || path.includes('/students/')) {
        return '../';
      }
      return '';
    }

    createSearchBar() {
      const isBn = window.location.pathname.endsWith('-bn.html');
      const placeholderText = isBn ? "কোর্স, প্রশিক্ষক বা বিষয়বস্তু অনুসন্ধান করুন..." : "Search courses, instructors, or content...";
      
      const searchHTML = `
        <div class="search-overlay" id="searchOverlay">
          <div class="search-modal">
            <div class="search-header">
              <input
                type="search"
                id="siteSearch"
                placeholder="${placeholderText}"
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
      const base = this.baseUrl;
      this.searchData = [
        { type: 'course', title: 'Digital Marketing', url: base + 'courses.html', description: 'SEO, Social Media, Google Ads, Meta Ads' },
        { type: 'course', title: 'Graphics Design', url: base + 'courses.html', description: 'Canva, Photoshop, Illustrator' },
        { type: 'course', title: 'Video Editing', url: base + 'courses.html', description: 'Premiere Pro, CapCut' },
        { type: 'course', title: 'Basic Computer', url: base + 'courses.html', description: 'Microsoft Office, Internet' },
        { type: 'course', title: 'Freelancing', url: base + 'courses.html', description: 'Fiverr, Upwork, Portfolio' },
        { type: 'page', title: 'Admission', url: base + 'admission.html', description: 'Enroll in courses' },
        { type: 'page', title: 'Contact Us', url: base + 'contact.html', description: 'Get in touch' },
        { type: 'page', title: 'About MIT', url: base + 'about.html', description: 'Learn about us' },
        { type: 'instructor', title: 'Md. Tuhin Khandakar', url: base + 'instructors.html', description: 'Digital Marketing Expert' },
        { type: 'instructor', title: 'Iqbal', url: base + 'instructors.html', description: 'Graphics Design Specialist' },
        { type: 'instructor', title: 'Md. Mahin', url: base + 'instructors.html', description: 'Video Editing Expert' }
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
    // Initialize Live Chat (skip on admin/students pages)
    const path = window.location.pathname;
    const isSubdir = path.includes('/admin/') || path.includes('/students/');
    if (!isSubdir && !document.getElementById('chatWidget')) {
      new LiveChatWidget();
    }

    // Initialize Testimonials Carousel
    const testimonialsContainer = document.getElementById('testimonialsCarousel');
    if (testimonialsContainer) {
      new TestimonialsCarousel(testimonialsContainer);
    }

    // Initialize Site Search
    new SiteSearch();

    // Initialize Gallery Lightbox (defer to ensure DOM is ready)
    setTimeout(() => {
      if (document.querySelector('.gallery-grid') || document.querySelector('.gallery-item')) {
        new GalleryLightbox();
      }
    }, 0);

    // Add search trigger button to header
    addSearchButton();
  }

  function addSearchButton() {
    // Use existing search button from HTML instead of creating a new one
    const existingSearchBtn = document.getElementById('searchBtn');

    if (existingSearchBtn) {
      // Add click handler to existing button
      existingSearchBtn.addEventListener('click', () => {
        const overlay = document.getElementById('searchOverlay');
        overlay?.classList.add('active');
        document.getElementById('siteSearch')?.focus();
      });
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

  // Export for external use
  window.MITFeatures = {
    LiveChat: LiveChatWidget,
    Testimonials: TestimonialsCarousel,
    Search: SiteSearch,
    Gallery: GalleryLightbox
  };

})();
