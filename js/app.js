/**
 * Markiety IT Institute (MIT) - Frontend & Admin JavaScript
 * Features:
 * - Theme toggle with persistence
 * - Responsive navigation & smooth scrolling
 * - Mouse-tracking glow & back-to-top button
 * - Dynamic course rendering & modal details
 * - JSON-LD injection for SEO
 * - Admission form with localStorage persistence & invoice
 * - Contact form message capture
 * - Admin login & dashboard CRUD for students, courses, certificates
 */

const MITApp = (() => {
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const noop = () => { };

  // Global image viewer lightbox
  window.viewImage = (imageSrc) => {
    // Create lightbox overlay
    const overlay = document.createElement('div');
    overlay.className = 'image-lightbox';
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <img src="${imageSrc}" alt="Course Preview" class="lightbox-img">
    `;

    // Close on click outside or on X button
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
        overlay.remove();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    document.body.appendChild(overlay);
  };


  const PATH = window.location.pathname.replace(/\\/g, '/');
  const IS_ADMIN = PATH.toLowerCase().includes('/admin/');
  const IS_STUDENT = PATH.toLowerCase().includes('/students/');
  const IS_SUBDIR = IS_ADMIN || IS_STUDENT;
  const DATA_PATH = IS_SUBDIR ? '../data/courses.json' : 'data/courses.json';
  const ASSET_BASE = IS_SUBDIR ? '../assets' : 'assets';
  const DATA_VERSION = '2025-11-09';
  const CUSTOM_VERSION = 'custom';

  // Centralised business identifiers - update here to change email/phone/payment account across dynamic UI
  const CONTACT = {
    email: 'markietyitinstitute@gmail.com',
    phone: '+8801624547667',
    bkash: '01624547667'
  };
  const BKASH_ACCOUNT = CONTACT.bkash;

  // Decide authoritative admin: 'backend' (Supabase) or 'static' (localStorage)
  const ADMIN_AUTHORITY = 'backend';

  const LS_KEYS = {
    theme: 'mit_theme',
    courses: 'mit_courses',
    expenses: 'mit_expenses_base',
    coursesVersion: 'mit_courses_version',
    students: 'mit_students',
    certificates: 'mit_certificates',
    credentials: 'mit_admin_credentials',
    session: 'mit_admin_session',
    messages: 'mit_contact_messages'
  };

  const DEFAULT_ADMIN = {
    email: 'admin@mit',
    password: 'mit12345'
  };

  const STUDENT_SESSION_KEY = 'mit_student_session';

  const instructors = [];



  const state = {
    courses: [],
    instructors,
    courseSchemaInjected: false
  };

  const storage = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      // Never block session or credential writes — login/logout must always work
      const alwaysWritable = [LS_KEYS.session, LS_KEYS.credentials, LS_KEYS.theme];
      if (!alwaysWritable.includes(key) && ADMIN_AUTHORITY === 'backend' && IS_ADMIN) {
        // Non-session admin keys are managed by Supabase; skip local overwrite
        const adminDataKeys = [LS_KEYS.students, LS_KEYS.courses, LS_KEYS.certificates];
        if (adminDataKeys.includes(key)) {
          // Still allow — this is used as a local cache
        }
      }
      localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
      localStorage.removeItem(key);
    }
  };

  const decodeEntities = (() => {
    const textarea = document.createElement('textarea');
    return (value) => {
      if (typeof value !== 'string') return value || '';
      textarea.innerHTML = value;
      return textarea.value;
    };
  })();

  const sanitizeStudentRecord = (student) => {
    if (!student || typeof student !== 'object') return student;
    const clone = { ...student };
    const decodeFields = [
      'studentNameEn', 'studentNameBn', 'fatherNameEn', 'fatherNameBn',
      'motherNameEn', 'motherNameBn', 'permanentAddress', 'presentAddress', 'notes'
    ];
    decodeFields.forEach((field) => {
      if (clone[field]) clone[field] = decodeEntities(clone[field]);
    });
    return clone;
  };

  const getStudents = () => {
    const list = storage.get(LS_KEYS.students, []) || [];
    if (!Array.isArray(list)) return [];
    const sanitized = list.map(sanitizeStudentRecord);
    if (JSON.stringify(sanitized) !== JSON.stringify(list)) {
      storage.set(LS_KEYS.students, sanitized);
    }
    return sanitized;
  };

  let studentModalEl = null;
  let studentFormEl = null;
  let studentFormMsg = null;
  let editingStudentId = null;
  const paymentUI = {
    panel: null,
    txnField: null,
    txnInput: null,
    amount: null,
    course: null,
    seatStatus: null,
    copyBtn: null,
    tutorialBtn: null,
    videoWrap: null
  };

  let selectedCourseId = '';

  const setStudentFieldValue = (name, value = '') => {
    if (!studentFormEl) return null;
    const field = studentFormEl.elements[name];
    if (!field) return null;
    field.value = value ?? '';
    return field;
  };
  const markCoursesCustom = () => {
    localStorage.setItem(LS_KEYS.coursesVersion, CUSTOM_VERSION);
  };

  const clearCourseOverride = () => {
    storage.remove(LS_KEYS.courses);
    localStorage.removeItem(LS_KEYS.coursesVersion);
  };

  const formatDisplayDate = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return value || '';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const parseBDT = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    const numeric = value.replace(/[^\d.]/g, '');
    return Number(numeric || 0);
  };

  const BDT_LOCALES = ['bn-BD', 'en-BD', 'en-US'];

  const formatPlainBDT = (amount) => {
    const parsed = parseBDT(amount);
    const value = Number.isFinite(parsed) ? parsed : 0;
    let formatted = '';
    try {
      formatted = new Intl.NumberFormat(BDT_LOCALES, { maximumFractionDigits: 0 }).format(value);
    } catch {
      formatted = value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return `Tk ${formatted}`.trim();
  };

  const formatDateTime = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return value || '';
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const createExpenseEntry = (amount, note = 'Operational expense') => ({
    id: `expense-${Date.now()}`,
    amount: Math.max(0, Number(amount) || 0),
    note: note || 'Operational expense',
    createdAt: new Date().toISOString()
  });

  const getExpenseEntries = () => {
    const raw = localStorage.getItem(LS_KEYS.expenses);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // legacy value stored as plain number
    }
    const legacy = Number(raw);
    if (Number.isFinite(legacy) && legacy > 0) {
      const entry = createExpenseEntry(legacy, 'Legacy expense import');
      localStorage.setItem(LS_KEYS.expenses, JSON.stringify([entry]));
      return [entry];
    }
    return [];
  };

  const saveExpenseEntries = (entries = []) => {
    localStorage.setItem(LS_KEYS.expenses, JSON.stringify(entries));
  };

  const addExpenseEntry = (amount, note) => {
    const entries = getExpenseEntries();
    entries.push(createExpenseEntry(amount, note));
    saveExpenseEntries(entries);
    return entries;
  };

  const getExpenseTotal = () => getExpenseEntries()
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

  const getSelectedCourse = () => state.courses.find(course => String(course.id) === String(selectedCourseId));

  const updateBkashPanel = () => {
    if (!paymentUI.panel) return;
    const course = getSelectedCourse();
    const discountState = getCourseDiscountState(course);
    const amount = parseBDT(discountState.payable || 0);
    if (paymentUI.amount) paymentUI.amount.textContent = amount ? formatPlainBDT(amount) : 'Tk 0';
    if (paymentUI.course) paymentUI.course.textContent = course?.title || 'Select a course';
    if (paymentUI.seatStatus) {
      if (!course) {
        paymentUI.seatStatus.textContent = 'Select a course to view discount availability.';
      } else if (discountState.hasLimit) {
        paymentUI.seatStatus.textContent = discountState.left > 0
          ? `${discountState.left} of ${discountState.limit} discount seats left.`
          : 'Discount seats claimed &mdash; regular fee applies.';
      } else if (discountState.discountActive) {
        paymentUI.seatStatus.textContent = 'Limited-time discount available for this course.';
      } else {
        paymentUI.seatStatus.textContent = 'Regular fee applies for this course.';
      }
    }
  };

  const setBkashVisibility = (show) => {
    if (!paymentUI.panel || !paymentUI.txnField || !paymentUI.txnInput) return;
    paymentUI.panel.hidden = !show;
    paymentUI.txnField.hidden = !show;
    paymentUI.txnInput.required = show;
    if (show) {
      updateBkashPanel();
      paymentUI.panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const courseResources = {
    'digital-marketing': {
      materials: [
        'SEO & Analytics fundamentals',
        'Social Media Marketing strategies',
        'Google Ads & Meta Ads campaigns',
        'Email & Content Marketing best practices'
      ],
      homework: [
        'Week 1: Create a basic SEO audit',
        'Week 2: Design a social media content calendar',
        'Week 3: Set up a Google Ads campaign',
        'Week 4: Write email marketing copy'
      ],
      links: [
        { title: 'Google Analytics', url: 'https://analytics.google.com' },
        { title: 'Meta Business Suite', url: 'https://business.facebook.com' },
        { title: 'Google Ads', url: 'https://ads.google.com' }
      ],
      files: [
        { label: 'Digital Marketing Course.pptx', url: '../assets/resources/digital-marketing-course.pptx' }
      ]
    },
    'graphics-design': {
      materials: [
        'Canva for Social Media design',
        'Adobe Photoshop basics',
        'Illustrator logo design',
        'Brand identity principles'
      ],
      homework: [
        'Week 1: Create 5 social media posts',
        'Week 2: Design a logo concept',
        'Week 3: Build a brand style guide'
      ],
      links: [
        { title: 'Canva', url: 'https://canva.com' },
        { title: 'Adobe Creative Cloud', url: 'https://adobe.com' }
      ],
      files: [
        { label: 'Graphics Design Course.pptx', url: '../assets/resources/graphics-design-course.pptx' }
      ]
    },
    'video-editing': {
      materials: [
        'Premiere Pro essentials',
        'CapCut Pro techniques',
        'Color grading fundamentals',
        'Motion graphics basics'
      ],
      homework: [
        'Week 1: Edit a 30-second promo',
        'Week 2: Create a YouTube intro',
        'Week 3: Color grade a short clip'
      ],
      links: [
        { title: 'Adobe Premiere Pro', url: 'https://adobe.com/premiere' },
        { title: 'CapCut', url: 'https://capcut.com' }
      ],
      files: [
        { label: 'Video Editing Course.pptx', url: '../assets/resources/video-editing-course.pptx' }
      ]
    },
    'basic-computer-course': {
      materials: [
        'Microsoft Word essentials',
        'Excel spreadsheet basics',
        'PowerPoint presentations',
        'Internet & email management'
      ],
      homework: [
        'Week 1: Create a formatted document',
        'Week 2: Build a budget spreadsheet',
        'Week 3: Design a presentation'
      ],
      links: [
        { title: 'Microsoft Office', url: 'https://office.com' },
        { title: 'Google Workspace', url: 'https://workspace.google.com' }
      ],
      files: [
        { label: 'Basic Computer – Slides', url: '../assets/resources/basic-computer-slides.md' },
        { label: 'Basic Computer – Homework', url: '../assets/resources/basic-computer-homework.md' }
      ]
    },
    'freelancing-career-development': {
      materials: [
        'Fiverr profile optimization',
        'Upwork proposal writing',
        'Client communication skills',
        'Portfolio building strategies'
      ],
      homework: [
        'Week 1: Set up your Fiverr profile',
        'Week 2: Write 3 winning proposals',
        'Week 3: Build your portfolio website'
      ],
      links: [
        { title: 'Fiverr', url: 'https://fiverr.com' },
        { title: 'Upwork', url: 'https://upwork.com' }
      ],
      files: [
        { label: 'Freelancing Course.pptx', url: '../assets/resources/freelancing-course.pptx' }
      ]
    }
  };

  const getCourseResources = (courseId, courseTitle) => {
    const idSlug = slugify(String(courseId || ''));
    const titleSlug = slugify(String(courseTitle || ''));

    // Try lookup by ID first, then by Title slug
    const resources = courseResources[courseId] || courseResources[idSlug] || courseResources[titleSlug];

    if (resources) return resources;

    // Fallback resources
    return {
      materials: [
        `Orientation for ${courseTitle || 'your course'}`,
        'Weekly live Q&A schedule',
        'Project submission checklist'
      ],
      homework: [
        'Join the MIT student community group.',
        'Submit your first progress update via the portal.'
      ],
      links: [
        { title: 'Student Support', url: `mailto:${CONTACT.email}` }
      ],
      files: [
        { label: 'Slides Placeholder', url: '../assets/resources/digital-marketing-slides.md' }
      ]
    };
  };

  const FALLBACK_COURSES = [
    {
      title: 'Basic Computer Course',
      instructor: 'Md. Tuhin Khandakar',
      duration: '2.5 Months',
      fee: '3000 BDT',
      discount: '2500 BDT',
      discountSeatsLimit: 20,
      discountSeatsLeft: 20,
      certificate: 'Government-Approved',
      image: 'assets/BASIC.svg',
      topics: [
        'Microsoft Word / Excel / PowerPoint / Access',
        'Internet & Email Management',
        'File Handling & Google Workspace',
        'Intro to AI Tools (ChatGPT, Copilot)'
      ],
      outcomes: [
        'Work confidently with Microsoft Office Suite',
        'Create professional documents and presentations',
        'Understand computer maintenance and digital productivity'
      ],
      featured: true
    },
    {
      title: 'Digital Marketing',
      instructor: 'Md. Tuhin Khandakar',
      duration: '3 Months',
      fee: '6000 BDT',
      discount: '5500 BDT',
      discountSeatsLimit: 20,
      discountSeatsLeft: 20,
      certificate: 'Government-Approved',
      image: 'assets/MARKETING.svg',
      topics: [
        'SEO & Analytics',
        'Social Media Marketing (Facebook, Instagram, YouTube)',
        'Google Ads & Meta Ads',
        'Email & Content Marketing',
        'Branding & AI Tools'
      ],
      outcomes: [
        'Run profitable ad campaigns',
        'Develop brand growth strategies',
        'Master AI-powered marketing tools'
      ],
      featured: true
    },
    {
      title: 'Graphics Design',
      instructor: 'Iqbal',
      duration: '3 Months',
      fee: '5000 BDT',
      discount: '4500 BDT',
      discountSeatsLimit: 20,
      discountSeatsLeft: 20,
      certificate: 'Government-Approved',
      image: 'assets/GRAPHICS-DESIGN.svg',
      topics: [
        'Canva for Social Media & Branding',
        'Photoshop Editing',
        'Illustrator Logo Design',
        'Brand Identity Basics'
      ],
      outcomes: [
        'Design brand kits and social posts',
        'Understand typography & color theory',
        'Create logos for real clients'
      ],
      featured: true
    },
    {
      title: 'Video Editing',
      instructor: 'Md. Mahin',
      duration: '3 Months',
      fee: '5000 BDT',
      discount: '4500 BDT',
      discountSeatsLimit: 20,
      discountSeatsLeft: 20,
      certificate: 'Government-Approved',
      image: 'assets/VIDEO-EDITING.svg',
      topics: [
        'Premiere Pro / CapCut Pro',
        'YouTube & Reels Editing',
        'Color Grading & Sound Sync',
        'Motion Graphics Basics'
      ],
      outcomes: [
        'Edit cinematic and social media videos',
        'Add transitions, sync sound, and export properly',
        'Work with creators & brands professionally'
      ],
      featured: true
    },
    {
      title: 'Freelancing & Career Development',
      instructor: 'Md. Tuhin Khandakar',
      duration: '2 Months',
      fee: '4000 BDT',
      discount: '3500 BDT',
      discountSeatsLimit: 20,
      discountSeatsLeft: 20,
      certificate: 'Government-Approved',
      image: 'assets/FREELANCING.svg',
      topics: [
        'Fiverr & Upwork Setup',
        'Proposal Writing & Client Communication',
        'Portfolio & Personal Branding',
        'Pricing & Gig Optimization'
      ],
      outcomes: [
        'Set up freelance profiles & attract clients',
        'Communicate professionally with clients',
        'Build a sustainable freelance career'
      ],
      featured: false
    }
  ];

  const generateTrackingNumber = (students = getStudents()) => {
    const current = students.reduce((acc, student) => {
      const match = /MIT-(\d+)/i.exec(student?.trackingNo || '');
      if (!match) return acc;
      return Math.max(acc, Number(match[1]));
    }, 0);
    return `MIT-${String(current + 1).padStart(4, '0')}`;
  };

  const valueOrNA = (value, fallback = 'N/A') => {
    if (value === 0) return '0';
    if (!value) return fallback;
    const str = String(value).trim();
    return str.length ? str : fallback;
  };

  const normalizePhone = (value = '') => value.replace(/\D+/g, '');

  const slugify = str => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const formatBDT = (value) => {
    const amount = parseBDT(value);
    if (Number.isNaN(amount) || amount === 0) return value || '';
    try {
      return new Intl.NumberFormat(BDT_LOCALES, {
        style: 'currency',
        currency: 'BDT',
        maximumFractionDigits: 0
      }).format(amount).replace('BDT', 'BDT').trim();
    } catch {
      return `Tk ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`.trim();
    }
  };

  const parseSeatCount = (value, fallback = 0) => {
    if (value === undefined || value === null || value === '') return fallback;
    const num = Number.parseInt(value, 10);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
  };

  const getCourseDiscountState = (course = {}) => {
    if (!course) {
      return {
        limit: 0,
        left: 0,
        hasLimit: false,
        discountActive: false,
        payable: '',
        discountValue: ''
      };
    }
    const limitSource = course.discountSeatsLimit !== undefined ? course.discountSeatsLimit : course.discountSeats;
    const limit = parseSeatCount(limitSource, 0);
    const hasLimit = limit > 0;
    const hasLeftValue = course.discountSeatsLeft !== undefined && course.discountSeatsLeft !== null && course.discountSeatsLeft !== '';
    const leftRaw = hasLeftValue ? course.discountSeatsLeft : limit;
    let left = parseSeatCount(leftRaw, limit);
    if (hasLimit && left > limit) left = limit;
    const discountActive = Boolean(course.discount && (!hasLimit || left > 0));
    const payable = discountActive ? (course.discount || course.fee) : course.fee;
    return {
      limit,
      left: hasLimit ? left : 0,
      hasLimit,
      discountActive,
      payable,
      discountValue: discountActive ? course.discount : ''
    };
  };

  // Helper to get instructor photo based on name
  const getInstructorPhoto = (instructorName) => {
    const name = (instructorName || '').toLowerCase();
    if (name.includes('tuhin')) return `${ASSET_BASE}/instructors/TUHIN.jpeg`;
    if (name.includes('iqbal')) return `${ASSET_BASE}/instructors/IQBAL.jpeg`;
    if (name.includes('mahin')) return `${ASSET_BASE}/instructors/MAHIN.jpeg`;
    return `${ASSET_BASE}/logo.jpg`; // Fallback
  };

  const courseCard = (course) => {
    const admissionPath = IS_SUBDIR ? '../admission.html' : 'admission.html';
    const fee = formatBDT(course.fee);
    const discountState = getCourseDiscountState(course);
    const discount = discountState.discountActive && course.discount ? formatBDT(course.discount) : null;

    // Badges
    const featuredBadge = course.featured ? '<span class="badge badge-featured">Featured</span>' : '';
    const seatBadge = discountState.hasLimit
      ? `<span class="badge badge-seats ${discountState.left > 0 ? 'available' : 'full'}">${discountState.left > 0 ? `${discountState.left} Seats Left` : 'Batch Full'}</span>`
      : '';

    // Image handling
    let image = course.image;
    const titleLower = (course.title || '').toLowerCase();
    if (titleLower.includes('basic computer')) image = `${ASSET_BASE}/BASIC-COMPUTER-COURSE.jpg`;
    else if (titleLower.includes('digital marketing')) image = `${ASSET_BASE}/DIGITAL-MARKETING-COURSE.jpg`;
    else if (titleLower.includes('graphic')) image = `${ASSET_BASE}/GRAPHICS-DESIGN-COURSE.jpg`;
    else if (titleLower.includes('video editing')) image = `${ASSET_BASE}/VIDEO-EDITING-COURSE.jpg`;
    else if (titleLower.includes('freelancing')) image = `${ASSET_BASE}/FREELANCING-COURSE.jpg`;

    if (!image) image = `${ASSET_BASE}/BASIC-COMPUTER-COURSE.jpg`;

    return `
      <article class="course-card premium-card" data-course-id="${course.id}">
        <div class="card-image-wrap" onclick="window.viewImage('${image}')" role="button" aria-label="View course image">
          <img src="${image}" alt="${course.title}" class="card-img" loading="lazy">
          <div class="card-badges-top">
            ${featuredBadge}
            ${seatBadge}
          </div>
          <div class="card-zoom-hint">
            <span class="icon-zoom">🔍</span>
          </div>
        </div>
        
        <div class="card-content">
          <div class="card-meta">
            <span class="meta-item"><i class="icon-clock">⏱️</i> ${course.duration}</span>
            <span class="meta-item"><i class="icon-star">⭐</i> 4.9 (120+)</span>
          </div>

          <h3 class="course-title">${course.title}</h3>
          
          <div class="instructor-row">
             <img src="${getInstructorPhoto(course.instructor)}" alt="${course.instructor}" class="instructor-avatar" onerror="this.src='${ASSET_BASE}/logo.jpg'">
             <span class="instructor-name">${course.instructor}</span>
          </div>

          <div class="card-footer">
            <div class="price-block">
              ${discount
        ? `<span class="price-old">${fee}</span><span class="price-new">${discount}</span>`
        : `<span class="price-new">${fee}</span>`}
            </div>
            <div class="card-btn-group">
              <button type="button" class="btn-details" data-role="course-details" data-course-id="${course.id}">Details</button>
              <a class="btn-enroll" href="${admissionPath}?course=${encodeURIComponent(course.title)}">Enroll</a>
            </div>
          </div>
        </div>
      </article>
    `;
  };

  const courseModal = {
    el: null,
    title: null,
    body: null,
    cta: null,
    init() {
      this.el = qs('#courseModal');
      if (!this.el) return;
      this.title = qs('#courseModalTitle', this.el);
      this.body = qs('#courseModalBody', this.el);
      this.cta = qs('#courseModalCta', this.el);

      this.el.addEventListener('close', () => this.body && (this.body.innerHTML = ''));
    },
    open(course) {
      if (!this.el || !course) return;
      const admissionPath = IS_SUBDIR ? '../admission.html' : 'admission.html';
      this.title.textContent = course.title;
      const discountState = getCourseDiscountState(course);
      const fee = formatBDT(course.fee);
      const discount = discountState.discountActive && course.discount ? formatBDT(course.discount) : null;
      const seatNote = discountState.hasLimit
        ? `<p class="muted small"><strong>Discount Seats:</strong> ${discountState.left > 0 ? `${discountState.left} of ${discountState.limit} available` : 'All claimed for this batch.'}</p>`
        : '';
      const topics = (course.topics || []).map(item => `<li>${item}</li>`).join('');
      const outcomes = (course.outcomes || []).map(item => `<li>${item}</li>`).join('');

      // Instructor photo section
      const instructorPhoto = course.instructorPhoto
        ? `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
             <img src="${course.instructorPhoto}" alt="${course.instructor}" 
                  style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--blue);" 
                  onerror="this.style.display='none'">
             <div>
               <strong style="display: block; font-size: 1.05rem;">${course.instructor}</strong>
               <span style="color: var(--muted); font-size: 0.9rem;">Course Instructor</span>
             </div>
           </div>`
        : `<p><strong>Instructor:</strong> ${course.instructor}</p>`;

      this.body.innerHTML = `
        ${instructorPhoto}
        <p><strong>Duration:</strong> ${course.duration}</p>
        <p><strong>Certification:</strong> ${course.certificate || 'MIT Certified'}</p>
        <p><strong>Investment:</strong> ${fee}${discount ? ` (Discount: ${discount})` : ''}</p>
        ${seatNote}
        <div>
          <h3>What you will learn</h3>
          <ul>${topics}</ul>
        </div>
        <div>
          <h3>Outcomes</h3>
          <ul>${outcomes}</ul>
        </div>
      `;
      this.cta.href = `${admissionPath}?course=${encodeURIComponent(course.title)}`;
      if (!this.el.open) this.el.showModal();
    }
  };

  const handleCourseButtons = () => {
    document.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-role="course-details"]');
      if (!btn) return;
      const { courseId } = btn.dataset;
      const course = state.courses.find(c => String(c.id) === String(courseId));
      if (course) {
        event.preventDefault();
        courseModal.open(course);
      }
    });
  };

  const buildCourseId = (course) => course.id || slugify(course.title);

  const ensureCourseShape = (course) => {
    const seatState = getCourseDiscountState(course);

    // Force-map local images based on title to ensure correct assets are used
    // This overrides any database values which might be incorrect (e.g. logos)
    let image = course.image;
    const titleLower = (course.title || '').toLowerCase();

    if (titleLower.includes('basic computer')) image = 'assets/BASIC-COMPUTER-COURSE.jpg';
    else if (titleLower.includes('digital marketing')) image = 'assets/DIGITAL-MARKETING-COURSE.jpg';
    else if (titleLower.includes('graphic')) image = 'assets/GRAPHICS-DESIGN-COURSE.jpg';
    else if (titleLower.includes('video editing')) image = 'assets/VIDEO-EDITING-COURSE.jpg';
    else if (titleLower.includes('freelancing')) image = 'assets/FREELANCING-COURSE.jpg';

    // Fallback if still no image
    if (!image) image = 'assets/BASIC-COMPUTER-COURSE.jpg';

    return {
      id: buildCourseId(course),
      title: course.title,
      instructor: course.instructor,
      instructorPhoto: course.instructorPhoto,
      image: image,
      duration: course.duration,
      fee: course.fee,
      discount: course.discount,
      certificate: course.certificate,
      topics: course.topics || [],
      outcomes: course.outcomes || [],
      summary: course.summary || '',
      featured: Boolean(course.featured),
      discountSeatsLimit: seatState.limit,
      discountSeatsLeft: seatState.left
    };
  };

  const loadCourses = async () => {
    // Supabase Integration - Primary Source
    if (window.db) {
      try {
        const dbCourses = await window.db.getCourses();
        if (dbCourses && dbCourses.length) {
          state.courses = dbCourses.map(ensureCourseShape);
          // Sync to localStorage as fallback
          storage.set(LS_KEYS.courses, state.courses);
          return state.courses;
        }
      } catch (e) {
        console.warn('Supabase courses fetch failed, falling back to local storage', e);
      }
    }

    // Local Storage Fallback
    const override = storage.get(LS_KEYS.courses);
    if (Array.isArray(override) && override.length) {
      state.courses = override.map(ensureCourseShape);
      return state.courses;
    }

    // JSON file (ultimate fallback)
    try {
      const res = await fetch(DATA_PATH, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.statusText);
      const list = await res.json();
      state.courses = list.map(ensureCourseShape);
      return state.courses;
    } catch (err) {
      console.error('Failed to load courses.json', err);
      state.courses = [];
      return [];
    }
  };

  const seedInitialStudent = () => {
    const existing = getStudents();
    if (existing.length) return;
    const course = state.courses.find(item => item.title.toLowerCase().includes('digital marketing'));
    const discountState = getCourseDiscountState(course);
    const discountValue = discountState.discountActive ? (course?.discount || '') : '';
    const record = {
      id: 'MIT-SEED-0001',
      trackingNo: 'MIT-0001',
      fullName: 'Aiyet Hossain',
      studentNameEn: 'Aiyet Hossain',
      studentNameBn: '\u0986\u0987\u09DF\u09BE\u09A4 \u09B9\u09CB\u09B8\u09BE\u0987\u09A8',
      fatherNameEn: 'Amir Hossain',
      fatherNameBn: '\u0986\u09AE\u09BF\u09B0 \u09B9\u09CB\u09B8\u09BE\u0987\u09A8',
      motherNameEn: 'Shamima Amir',
      motherNameBn: '\u09B6\u09BE\u09AE\u09C0\u09AE\u09BE \u0986\u09AE\u09BF\u09B0',
      dob: '2005-08-02',
      education: 'HSC',
      permanentAddress: 'Madhabdi, Narsingdi, Bangladesh',
      presentAddress: 'Madhabdi, Narsingdi, Bangladesh',
      studentPhone: '+8801768083011',
      parentPhone: '+8801711139220',
      email: 'aiyet.hossain@example.com',
      nid: '6930713679',
      portalPhone: normalizePhone('+8801768083011'),
      portalPin: '4582',
      payment: 'bKash',
      paymentTxn: '9GSD7K2L',
      notes: 'Initial student record imported from legacy admission form.',
      courseId: course?.id || 'digital-marketing',
      courseTitle: 'Basic+ Digital Marketing',
      courseInstructor: course?.instructor || 'Md. Tuhin Khandakar',
      courseDuration: course?.duration || '3 Months',
      courseFee: course?.fee || '6000 BDT',
      coursePayable: discountValue || course?.fee || '6000 BDT',
      courseDiscount: discountValue,
      discountApplied: Boolean(discountValue),
      certificate: course?.certificate || 'Government-Approved',
      createdAt: '2025-11-09T00:00:00+06:00',
      formDate: '2025-11-09T00:00:00+06:00',
      photo: null
    };
    storage.set(LS_KEYS.students, [record]);
    if (course?.id && discountState.hasLimit && discountState.discountActive) {
      updateCourseSeats(course.id, -1);
    }
  };

  const injectCourseSchema = (courses = []) => {
    if (state.courseSchemaInjected || !courses.length) return;
    const anchor = qs('#coursesSchemaAnchor');
    if (!anchor) return;
    const items = courses.slice(0, 10).map((course, index) => ({
      '@type': 'Course',
      'name': course.title,
      'description': course.summary || (course.outcomes?.join(', ') || ''),
      'provider': {
        '@type': 'Organization',
        'name': 'Markiety IT Institute (MIT)',
        'sameAs': 'https://markietyitinstitute.netlify.app/'
      },
      'position': index + 1
    }));
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'itemListElement': items
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema, null, 2);
    anchor.appendChild(script);
    state.courseSchemaInjected = true;
  };

  const renderPopularCourses = () => {
    const wrap = qs('#popularCourses');
    if (!wrap) return;

    // Safety check: if state.courses is empty, show loading message
    if (!state.courses || state.courses.length === 0) {
      wrap.innerHTML = '<p class="muted">Loading courses...</p>';
      return;
    }

    const courses = [...state.courses].filter(c => c.featured).slice(0, 3);

    // If no featured courses, show first 3
    const displayCourses = courses.length > 0 ? courses : state.courses.slice(0, 3);

    if (displayCourses.length === 0) {
      wrap.innerHTML = '<p class="muted">No courses available.</p>';
      return;
    }

    wrap.innerHTML = displayCourses.map(courseCard).join('');
  };

  const renderCoursesPage = () => {
    const grid = qs('#coursesGrid');
    if (!grid) return;
    const searchInput = qs('#courseSearch');
    const instructorSelect = qs('#courseInstructor');
    const sortSelect = qs('#courseSort');
    const resetBtn = qs('#courseReset');
    const summary = qs('#coursesSummary');
    const empty = qs('#coursesEmpty');

    const instructorsSet = new Set();
    state.courses.forEach(course => {
      if (course.instructor) instructorsSet.add(course.instructor);
    });
    if (instructorSelect) {
      instructorSelect.innerHTML = '<option value="">All instructors</option>' +
        [...instructorsSet].map(name => `<option value="${name}">${name}</option>`).join('');
    }

    // Check URL parameters for instructor filter
    const urlParams = new URLSearchParams(window.location.search);
    const instructorParam = urlParams.get('instructor');
    if (instructorParam && instructorSelect) {
      instructorSelect.value = instructorParam;
    }

    const applyFilters = () => {
      const term = (searchInput?.value || '').toLowerCase();
      const instructor = instructorSelect?.value || '';
      const sort = sortSelect?.value || 'default';

      let filtered = state.courses.filter(course => {
        const haystack = `${course.title} ${course.instructor} ${course.duration} ${course.topics.join(' ')}`.toLowerCase();
        const matchesTerm = !term || haystack.includes(term);
        const matchesInstructor = !instructor || course.instructor === instructor;
        return matchesTerm && matchesInstructor;
      });

      if (sort === 'duration') {
        filtered = filtered.slice().sort((a, b) => parseBDT(a.duration) - parseBDT(b.duration));
      } else if (sort === 'fee') {
        filtered = filtered.slice().sort((a, b) => parseBDT(a.fee) - parseBDT(b.fee));
      } else {
        filtered = filtered.slice().sort((a, b) => Number(b.featured) - Number(a.featured));
      }

      grid.innerHTML = filtered.map(courseCard).join('');
      if (summary) summary.textContent = `Showing ${filtered.length} of ${state.courses.length} courses`;
      if (empty) empty.hidden = filtered.length > 0;
    };

    [searchInput, instructorSelect, sortSelect].forEach(el => el?.addEventListener('input', applyFilters));
    resetBtn?.addEventListener('click', (event) => {
      if (searchInput) searchInput.value = '';
      if (instructorSelect) instructorSelect.value = '';
      if (sortSelect) sortSelect.value = 'default';
      applyFilters();
    });

    applyFilters();
    injectCourseSchema(state.courses);
  };

  const renderInstructors = async () => {
    const list = qs('#instructorsList');
    if (!list) return;

    try {
      let instructors = [];

      // 1. Try Supabase
      if (window.db) {
        const dbInstructors = await window.db.getInstructors();
        if (dbInstructors && dbInstructors.length) {
          instructors = dbInstructors;
        }
      }

      // 2. Fallback to JSON
      if (!instructors.length) {
        const instructorsPath = IS_SUBDIR ? '../data/instructors.json' : 'data/instructors.json';
        const res = await fetch(instructorsPath, { cache: 'no-store' });
        if (res.ok) instructors = await res.json();
      }

      state.instructors = instructors;

      const socialIcon = (platform) => {
        const icons = {
          portfolio: '🌐',
          linkedin: '💼',
          facebook: '📘',
          instagram: '📸',
          youtube: '▶️'
        };
        return icons[platform] || '🔗';
      };

      const template = (instructor) => {
        const socialLinks = instructor.social && Object.keys(instructor.social).length > 0
          ? `<div class="social-links" style="display: flex; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap;">
               ${Object.entries(instructor.social).map(([platform, url]) =>
            url ? `<a href="${url}" target="_blank" rel="noopener" class="btn btn-ghost" style="font-size: 0.9rem; padding: 0.5rem 0.75rem;" title="${platform}">
                   ${socialIcon(platform)} ${platform.charAt(0).toUpperCase() + platform.slice(1)}
                 </a>` : ''
          ).join('')}
             </div>`
          : '';

        return `
          <article class="card instructor">
            <img src="${instructor.photo}" alt="${instructor.name}" loading="lazy" 
                 style="border-radius: var(--radius-md); width: 100%; height: 280px; object-fit: cover;" 
                 onerror="this.src='${ASSET_BASE}/logo.jpg'" />
            <h3>${instructor.name}</h3>
            <p class="muted small">${instructor.title}</p>
            <p>${instructor.bio}</p>
            <div class="meta-list small muted" style="margin-top: 0.75rem;">
              ${(instructor.specialties || []).map(spec => `<span>• ${spec}</span>`).join('')}
            </div>
            ${socialLinks}
            <div style="margin-top: 1rem;">
              <a href="courses.html?instructor=${encodeURIComponent(instructor.name)}" class="btn btn-gradient" style="width: 100%; text-align: center;">View Courses</a>
            </div>
          </article>
        `;
      };

      list.innerHTML = instructors.map(template).join('');
    } catch (error) {
      console.error('Failed to load instructors:', error);
      if (list) list.innerHTML = '<p class="muted">Unable to load instructor profiles.</p>';
    }
  };

  const buildCourseOptions = (placeholderText = 'Select a course') => {
    const placeholder = placeholderText ? `<option value="">${placeholderText}</option>` : '';
    return placeholder + state.courses.map((course) => {
      const seats = getCourseDiscountState(course);
      const seatSuffix = seats.hasLimit
        ? ` - ${seats.left > 0 ? `${seats.left} discount seats left` : 'Discount seats claimed'}`
        : '';
      return `<option value="${course.id}">${course.title}${seatSuffix}</option>`;
    }).join('');
  };

  const hydrateStudentCourseSelect = (select, placeholder = 'Select a course') => {
    if (!select) return;
    select.innerHTML = buildCourseOptions(placeholder);
  };

  const fillStudentForm = (student) => {
    if (!studentFormEl || !student) return;
    setStudentFieldValue('trackingNo', student.trackingNo || student.id);
    setStudentFieldValue('studentNameEn', student.studentNameEn || student.fullName || '');
    setStudentFieldValue('studentNameBn', student.studentNameBn || '');
    setStudentFieldValue('fatherNameEn', student.fatherNameEn || '');
    setStudentFieldValue('fatherNameBn', student.fatherNameBn || '');
    setStudentFieldValue('motherNameEn', student.motherNameEn || '');
    setStudentFieldValue('motherNameBn', student.motherNameBn || '');
    setStudentFieldValue('dob', student.dob || '');
    setStudentFieldValue('education', student.education || '');
    setStudentFieldValue('studentPhone', student.studentPhone || student.phone || '');
    setStudentFieldValue('parentPhone', student.parentPhone || '');
    setStudentFieldValue('email', student.email || '');
    setStudentFieldValue('nid', student.nid || '');
    setStudentFieldValue('permanentAddress', student.permanentAddress || student.address || '');
    setStudentFieldValue('presentAddress', student.presentAddress || student.address || '');
    setStudentFieldValue('payment', student.payment || '');
    setStudentFieldValue('paymentTxn', student.paymentTxn || '');
    setStudentFieldValue('portalPin', student.portalPin || '');
    setStudentFieldValue('notes', student.notes || '');
    const courseSelect = studentFormEl.elements.courseId;
    if (courseSelect) {
      hydrateStudentCourseSelect(courseSelect, 'Keep current');
      courseSelect.value = student.courseId || '';
    }
    setStudentFieldValue('courseTitle', student.courseTitle || '');
    setStudentFieldValue('courseInstructor', student.courseInstructor || '');
    setStudentFieldValue('courseDuration', student.courseDuration || '');
    setStudentFieldValue('courseFee', student.courseFee || '');
    setStudentFieldValue('courseDiscount', student.courseDiscount || '');
    const photoInput = studentFormEl.elements.photoFile;
    if (photoInput) photoInput.value = '';

    const unlockedContainer = qs('#editUnlockedCoursesContainer');
    if (unlockedContainer) {
      if (!state.courses.length) {
        state.courses = storage.get(LS_KEYS.courses, []);
      }
      const unlocked = student.unlockedCourses || (student.courseId ? [student.courseId] : []);
      unlockedContainer.innerHTML = state.courses.map(c => `
        <label class="checkbox-label" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <input type="checkbox" name="unlockedCourses" value="${c.id}" ${unlocked.includes(String(c.id)) ? 'checked' : ''}>
          <span>${c.title}</span>
        </label>
      `).join('');
    }
  };

  const openStudentEditor = (student) => {
    if (!studentModalEl || !studentFormEl) return;
    editingStudentId = student.id;
    fillStudentForm(student);
    studentModalEl.showModal();
  };

  const populateCourseSelect = () => {
    const select = qs('#selectedCourse');
    if (!select) return;
    select.innerHTML = buildCourseOptions('Select a course');

    const params = new URLSearchParams(window.location.search);
    const courseParam = params.get('course');
    if (courseParam && state.courses.length) {
      const found =
        state.courses.find(course => course.title.toLowerCase() === courseParam.toLowerCase()) ||
        state.courses.find(course => String(course.id).toLowerCase() === courseParam.toLowerCase());
      if (found) select.value = found.id;
    }
    selectedCourseId = select.value || '';
    updateBkashPanel();
    if (!select.dataset.listenerAttached) {
      select.addEventListener('change', () => {
        selectedCourseId = select.value;
        updateBkashPanel();
      });
      select.dataset.listenerAttached = 'true';
    }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Full Admission Form document (detailed)
  const createAdmissionForm = (record, course) => {
    const fee = formatBDT(record.courseFee || course?.fee);
    const discountValue = record.courseDiscount || '';
    const discountFormatted = discountValue ? formatBDT(discountValue) : null;
    const formDate = formatDisplayDate(record.formDate || record.createdAt);
    const currentYear = new Date(record.createdAt || Date.now()).getFullYear();

    const fieldRow = (label, value) => `
      <div class="field-row">
        <span class="field-label">${label}:</span>
        <span class="field-value${value ? ' filled' : ''}">${value || ''}</span>
      </div>`;

    return `
    <div class="admission-form">
      <div class="watermark">MARKIETY IT INSTITUTE</div>
      
      <header class="form-header">
        <div class="header-left">
          <div class="logo-row">
            <img src="${ASSET_BASE}/logo.jpg" alt="MIT" />
            <div>
              <h1>MARKIETY</h1>
              <div class="tagline">IT INSTITUTE</div>
            </div>
          </div>
          <div class="contact-row">
            <span>📧 ${CONTACT.email}</span>
            <span>📞 ${CONTACT.phone}</span>
          </div>
        </div>
        
        <div class="header-center">
          <h2>ADMISSION FORM</h2>
        </div>
        
        <div class="header-right">
          <div class="tracking"><strong>Tracking No.:</strong> ${valueOrNA(record.trackingNo || record.id)}</div>
          <div class="tracking"><strong>Date:</strong> ${formDate}</div>
        </div>
      </header>
      
      <div class="section-bar">Student Information</div>
      <div class="info-grid">
        ${fieldRow("Student's Name (English)", record.studentNameEn || record.fullName)}
        ${fieldRow("Student's Name (বাংলায়)", record.studentNameBn)}
        ${fieldRow("Email", record.email)}
        ${fieldRow("Student's Phone No.", record.studentPhone || record.phone)}
        ${fieldRow("Parent's Phone No.", record.parentPhone)}
        ${fieldRow("Date of Birth", formatDisplayDate(record.dob))}
        ${fieldRow("Last Education", record.education)}
        ${fieldRow("NID / Birth Certificate", record.nid)}
      </div>
      
      <div class="section-bar">Parents' Information</div>
      <div class="info-grid">
        ${fieldRow("Father's Name (English)", record.fatherNameEn)}
        ${fieldRow("পিতার নাম (বাংলায়)", record.fatherNameBn)}
        ${fieldRow("Mother's Name (English)", record.motherNameEn)}
        ${fieldRow("মাতার নাম (বাংলায়)", record.motherNameBn)}
      </div>
      
      <div class="section-bar">Address</div>
      <div class="info-grid">
        ${fieldRow("Permanent Address", record.permanentAddress || record.address)}
        ${fieldRow("Present Address", record.presentAddress || record.address)}
      </div>
      
      <div class="section-bar">Course Details</div>
      <div class="info-grid">
        ${fieldRow("Course Name", record.courseTitle)}
        ${fieldRow("Instructor", record.courseInstructor)}
        ${fieldRow("Duration", record.courseDuration)}
        ${fieldRow("Course Fee", fee)}
        ${fieldRow("Discount", discountFormatted || 'N/A')}
        ${fieldRow("Payable Amount", discountFormatted || fee)}
      </div>
      
      <div class="section-bar">Student Declaration</div>
      <p class="declaration">
        I, <strong>${valueOrNA(record.studentNameEn || record.fullName)}</strong>, confirm that I am willingly taking admission to the 
        course at <strong>Markiety IT Institute (MIT)</strong> for the year ${currentYear}. I will follow all institute rules 
        and regulations. The institute reserves full rights to suspend or discontinue my course in 
        case of any disciplinary violation or non-payment of fees.
      </p>
      
      <div class="dual-signature">
        <div class="sig-box">
          <div class="sig-line"></div>
          <span>Student Signature</span>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <span>Authorized Signature</span>
        </div>
      </div>
      
      <div class="section-bar">Official Use Only</div>
      <div class="info-grid">
        ${fieldRow("Admission Taken By", '')}
        ${fieldRow("Checked By", '')}
        ${fieldRow("Approved By (Founder/CEO)", 'Md. Tuhin Khandakar')}
      </div>
      
      <footer class="form-footer">
        <div class="brand">Markiety IT Institute (MIT) - A Project of Markiety</div>
        <div class="address">Address: Madhabdi, Narsingdi | Mail: ${CONTACT.email}</div>
        <div class="copyright">&copy; ${currentYear} Markiety IT Institute. All Rights Reserved.</div>
      </footer>
    </div>
  `;
  };

  // Invoice document (compact for payment)
  const createInvoice = (record, course) => {
    const fee = formatBDT(record.courseFee || course?.fee);
    const discountValue = record.courseDiscount || '';
    const discountFormatted = discountValue ? formatBDT(discountValue) : null;
    const formDate = formatDisplayDate(record.formDate || record.createdAt);
    const currentYear = new Date(record.createdAt || Date.now()).getFullYear();
    // Helper for field rows
    const fieldRow = (label, value) => `
      <div class="field-row">
        <span class="field-label">${label}:</span>
        <span class="field-value${value ? ' filled' : ''}">${value || ''}</span>
      </div>`;

    return `
    <div class="admission-form">
      <div class="watermark">MARKIETY IT INSTITUTE</div>
      
      <!-- HEADER -->
      <header class="form-header">
        <div class="header-left">
          <div class="logo-row">
            <img src="${ASSET_BASE}/logo.jpg" alt="MIT" />
            <div>
              <h1>MARKIETY</h1>
              <div class="tagline">IT INSTITUTE</div>
            </div>
          </div>
          <div class="contact-row">
            <span>📧 ${CONTACT.email}</span>
            <span>📞 ${CONTACT.phone}</span>
          </div>
        </div>
        
        <div class="header-center">
          <h2>INVOICE</h2>
        </div>
        
        <div class="header-right">
          ${record.photo ? `<img src="${record.photo}" class="invoice-photo" alt="Student" />` : ''}
          <div class="tracking"><strong>Invoice No.:</strong> ${valueOrNA(record.trackingNo || record.id)}</div>
          <div class="tracking"><strong>Date:</strong> ${formDate}</div>
        </div>
      </header>
      
      <!-- STUDENT INFORMATION -->
      <div class="section-bar">Student Information</div>
      <div class="info-grid">
        ${fieldRow("Student Name", record.studentNameEn || record.fullName)}
        ${fieldRow("Course Name", record.courseTitle)}
        ${fieldRow("Course Duration", record.courseDuration)}
        ${fieldRow("Phone Number", record.studentPhone || record.phone)}
      </div>
      
      <!-- PAYMENT DETAILS -->
      <div class="section-bar">Payment Details</div>
      <div class="info-grid">
        ${fieldRow("Course Fee", fee)}
        ${fieldRow("Discount (if any)", discountFormatted || 'N/A')}
        ${fieldRow("Total Payable", discountFormatted || fee)}
        ${fieldRow("Amount Paid", '_____________')}
        ${fieldRow("Due Amount", '_____________')}
      </div>
      
      <div class="payment-methods">
        <strong>Payment Method:</strong>
        <label><input type="checkbox" disabled> Cash</label>
        <label><input type="checkbox" disabled> Bkash</label>
        <label><input type="checkbox" disabled> Nagad</label>
        <label><input type="checkbox" disabled> Bank Transfer</label>
        <label><input type="checkbox" disabled> Other: ___________</label>
      </div>
      
      <!-- PORTAL LOGIN INFO -->
      <div class="portal-info-box">
        <strong>🔐 Student Portal Login Credentials</strong>
        <div class="portal-creds">
          <span>📱 Username (Phone): <strong>${record.portalPhone || record.studentPhone}</strong></span>
          <span>🔑 PIN: <strong class="pin-code">${record.portalPin}</strong></span>
        </div>
        <small>Login at: students/index.html</small>
      </div>
      
      <!-- SIGNATURES -->
      <div class="dual-signature">
        <div class="sig-box">
          <div class="sig-line"></div>
          <span>Student Signature</span>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <span>Authorized Signature</span>
        </div>
      </div>
      
      <!-- FOOTER -->
      <footer class="form-footer">
        <div class="brand">Markiety IT Institute (MIT) - A Project of Markiety</div>
        <div class="address">Address: Madhabdi, Narsingdi | Mail: ${CONTACT.email}</div>
        <div class="copyright">&copy; ${currentYear} Markiety IT Institute. All Rights Reserved.</div>
      </footer>
    </div>
  `;
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const initStudentEditor = () => {
    studentModalEl = qs('#studentModal');
    studentFormEl = qs('#studentForm');
    studentFormMsg = qs('#studentFormStatus');
    if (!studentModalEl || !studentFormEl) return;

    const closeButtons = qsa('[data-close="studentModal"]', studentModalEl);
    closeButtons.forEach(btn => btn.addEventListener('click', () => studentModalEl.close()));

    const courseSelect = studentFormEl.elements.courseId;
    courseSelect?.addEventListener('change', () => {
      const selected = state.courses.find(course => String(course.id) === String(courseSelect.value));
      if (!selected) return;
      setStudentFieldValue('courseTitle', selected.title);
      setStudentFieldValue('courseInstructor', selected.instructor || '');
      setStudentFieldValue('courseDuration', selected.duration || '');
      setStudentFieldValue('courseFee', selected.fee || '');
      setStudentFieldValue('courseDiscount', selected.discount || '');
    });

    studentModalEl.addEventListener('close', () => {
      studentFormEl.reset();
      const photoInput = studentFormEl.elements.photoFile;
      if (photoInput) photoInput.value = '';
      editingStudentId = null;
      if (studentFormMsg) studentFormMsg.textContent = '';
    });

    studentFormEl.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!editingStudentId) return;
      if (studentFormMsg) studentFormMsg.textContent = 'Saving...';
      const formData = new FormData(studentFormEl);
      const values = Object.fromEntries(formData.entries());
      const students = getStudents();
      const index = students.findIndex(student => student.id === editingStudentId);
      if (index < 0) {
        if (studentFormMsg) studentFormMsg.textContent = 'Record not found.';
        return;
      }

      const clean = (val, fallback = '') => {
        if (val === undefined || val === null) return fallback;
        return String(val).trim();
      };

      const courseId = values.courseId || students[index].courseId || '';
      const selectedCourse = state.courses.find(course => String(course.id) === String(courseId));
      const photoFile = studentFormEl.elements.photoFile?.files?.[0];
      const unlockedCourses = [...studentFormEl.querySelectorAll('input[name="unlockedCourses"]:checked')].map(cb => cb.value);

      const updated = {
        ...students[index],
        unlockedCourses,
        studentNameEn: clean(values.studentNameEn, students[index].studentNameEn),
        studentNameBn: clean(values.studentNameBn, students[index].studentNameBn),
        fatherNameEn: clean(values.fatherNameEn, students[index].fatherNameEn),
        fatherNameBn: clean(values.fatherNameBn, students[index].fatherNameBn),
        motherNameEn: clean(values.motherNameEn, students[index].motherNameEn),
        motherNameBn: clean(values.motherNameBn, students[index].motherNameBn),
        dob: values.dob || students[index].dob,
        education: clean(values.education, students[index].education),
        studentPhone: clean(values.studentPhone, students[index].studentPhone),
        parentPhone: clean(values.parentPhone, students[index].parentPhone),
        email: clean(values.email, students[index].email),
        nid: clean(values.nid, students[index].nid),
        permanentAddress: clean(values.permanentAddress, students[index].permanentAddress),
        presentAddress: clean(values.presentAddress, students[index].presentAddress),
        payment: values.payment || students[index].payment,
        notes: clean(values.notes, students[index].notes),
        courseId,
        courseTitle: clean(values.courseTitle, selectedCourse?.title || students[index].courseTitle),
        courseInstructor: clean(values.courseInstructor, selectedCourse?.instructor || students[index].courseInstructor),
        courseDuration: clean(values.courseDuration, selectedCourse?.duration || students[index].courseDuration),
        courseFee: clean(values.courseFee, selectedCourse?.fee || students[index].courseFee),
        courseDiscount: clean(values.courseDiscount, selectedCourse?.discount || students[index].courseDiscount),
        paymentTxn: clean(values.paymentTxn, students[index].paymentTxn),
        portalPin: clean(values.portalPin, students[index].portalPin)
      };

      const previousPayable = students[index].coursePayable || students[index].courseDiscount || students[index].courseFee;
      updated.discountApplied = Boolean(updated.courseDiscount);
      updated.coursePayable = updated.courseDiscount || updated.courseFee || previousPayable;

      updated.fullName = updated.studentNameEn;
      updated.portalPhone = normalizePhone(updated.studentPhone || students[index].studentPhone || '');

      if (photoFile && photoFile.size) {
        updated.photo = await toBase64(photoFile);
      }

      storage.set(LS_KEYS.students, [
        ...students.slice(0, index),
        updated,
        ...students.slice(index + 1)
      ]);

      // Supabase Sync
      if (window.db) {
        try {
          await window.db.saveStudent(updated);
          if (studentFormMsg) studentFormMsg.textContent = 'Saved to cloud.';
        } catch (err) {
          console.error('Cloud save failed', err);
          // Even if cloud save fails, we still want to continue with local storage
        }
      }
      renderStudentsTable();
      if (studentFormMsg) studentFormMsg.textContent = 'Student updated.';
      setTimeout(() => {
        if (studentFormMsg) studentFormMsg.textContent = '';
        studentModalEl.close();
      }, 800);
    });
  };

  const printHTML = (html, title = 'Print') => {
    const win = window.open('', '_blank', 'width=860,height=900');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8" /><title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Inter', -apple-system, sans-serif; 
          font-size: 11pt;
          line-height: 1.4;
          color: #0b0d12; 
          background: #fff;
          padding: 0;
        }
        h1,h2,h3,h4 { font-family: 'Poppins', sans-serif; }
        
        .admission-form {
          max-width: 210mm;
          margin: 0 auto;
          padding: 8mm 12mm;
          background: #fff;
          position: relative;
        }
        
        /* Header */
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4mm;
          padding-bottom: 3mm;
          border-bottom: 2px solid #0077cc;
        }
        
        .header-left { display: flex; flex-direction: column; gap: 2mm; }
        .header-left .logo-row { display: flex; align-items: center; gap: 3mm; }
        .header-left .logo-row img { width: 12mm; height: 12mm; }
        .header-left .logo-row h1 { font-size: 14pt; color: #0077cc; margin: 0; }
        .header-left .logo-row .tagline { font-size: 8pt; color: #475569; }
        .header-left .tracking { font-size: 9pt; }
        
        .header-center { text-align: center; }
        .header-center h2 { font-size: 20pt; color: #0b0d12; letter-spacing: 2px; }
        
        .header-right { text-align: right; font-size: 9pt; }
        .photo-box {
          width: 28mm;
          height: 35mm;
          border: 1.5px solid #0077cc;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 8pt;
          color: #475569;
          padding: 2mm;
          line-height: 1.2;
          font-weight: 600;
        }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        
        /* Section Titles */
        .section-title {
          font-size: 10pt;
          font-weight: 700;
          color: #0077cc;
          text-decoration: underline;
          margin: 5mm 0 3mm;
        }
        
        /* Form Fields */
        .field-row {
          display: flex;
          align-items: baseline;
          margin-bottom: 2mm;
          font-size: 10pt;
        }
        .field-label { min-width: 52mm; }
        .field-value {
          flex: 1;
          border-bottom: 1px solid #0b0d12;
          min-height: 4.5mm;
          padding-left: 1mm;
        }
        .field-value.filled { font-weight: 600; }
        
        /* Watermark */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 36pt;
          font-weight: 700;
          color: rgba(0, 119, 204, 0.04);
          letter-spacing: 3px;
          pointer-events: none;
          white-space: nowrap;
          z-index: 0;
        }
        
        /* Declaration */
        .declaration {
          margin: 5mm 0;
          font-size: 9pt;
          line-height: 1.5;
          text-align: justify;
        }
        
        /* Signature */
        .signature-section {
          display: flex;
          justify-content: flex-end;
          margin: 8mm 0 5mm;
        }
        .sig-block { text-align: center; }
        .sig-line {
          border-top: 1px solid #0b0d12;
          width: 50mm;
          padding-top: 2mm;
          margin-top: 12mm;
          font-size: 9pt;
          font-weight: 600;
        }
        
        /* Section Bar */
        .section-bar {
          background: linear-gradient(90deg, #1e3a5f, #2a4a6f);
          color: white;
          padding: 1.5mm 4mm;
          font-weight: 700;
          font-size: 9pt;
          margin: 3mm 0 2mm;
          border-radius: 2px;
        }
        
        /* Info Grid */
        .info-grid {
          padding: 0 2mm;
        }
        
        /* Payment Methods */
        .payment-methods {
          display: flex;
          flex-wrap: wrap;
          gap: 3mm;
          align-items: center;
          padding: 2mm;
          font-size: 8pt;
          border: 1px solid #e2e8f0;
          margin: 2mm 0;
        }
        .payment-methods label {
          display: flex;
          align-items: center;
          gap: 1mm;
        }
        
        /* Portal Info Box */
        .portal-info-box {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border: 2px solid #0077cc;
          border-radius: 4px;
          padding: 3mm;
          margin: 3mm 0;
          text-align: center;
        }
        .portal-creds {
          display: flex;
          justify-content: center;
          gap: 8mm;
          margin: 2mm 0;
          font-size: 11pt;
        }
        .pin-code {
          background: #0077cc;
          color: white;
          padding: 1mm 3mm;
          border-radius: 4px;
          letter-spacing: 2px;
        }
        
        /* Dual Signature */
        .dual-signature {
          display: flex;
          justify-content: space-between;
          margin: 5mm 0;
          padding-top: 6mm;
        }
        .sig-box {
          text-align: center;
          width: 45%;
        }
        .sig-box .sig-line {
          border-top: 1px solid #0b0d12;
          margin-bottom: 2mm;
        }
        .sig-box span {
          font-size: 9pt;
          font-weight: 600;
        }
        
        /* Contact Row */
        .contact-row {
          display: flex;
          gap: 4mm;
          font-size: 8pt;
          color: #475569;
          margin-top: 2mm;
        }
        
        /* Footer */
        .form-footer {
          margin-top: 4mm;
          padding-top: 3mm;
          border-top: 1px solid #0077cc;
          text-align: center;
          font-size: 8pt;
          color: #475569;
        }
        .form-footer .brand { font-weight: 700; margin-bottom: 1mm; }
        .form-footer .address { margin-bottom: 1mm; }
        .form-footer .copyright { font-size: 7pt; margin-top: 1mm; }
        
        @media print {
          body { padding: 0; }
          .admission-form { padding: 6mm 10mm; }
          @page { size: A4; margin: 0; }
        }
      </style>
      </head><body>${html}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const handleAdmissionForm = () => {
    const form = qs('#admissionForm');
    if (!form) return;
    const message = qs('#admissionMessage');
    const outputSection = qs('#admissionOutput');
    const receiptContainer = qs('#admissionReceipt');
    const printBtn = qs('#printInvoice');
    const downloadBtn = qs('#downloadInvoice');
    paymentUI.panel = qs('#bkashPanel');
    paymentUI.txnField = qs('#bkashTxnField');
    paymentUI.txnInput = qs('#paymentTxn');
    paymentUI.amount = qs('#bkashAmount');
    paymentUI.course = qs('#bkashCourseLabel');
    paymentUI.seatStatus = qs('#courseSeatStatus');
    paymentUI.copyBtn = qs('#bkashCopyAccount');
    paymentUI.tutorialBtn = qs('#bkashTutorialBtn');
    paymentUI.videoWrap = qs('#bkashVideo');
    updateBkashPanel();

    populateCourseSelect();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      message.textContent = 'Processing...';

      const formData = new FormData(form);
      const courseId = formData.get('course');
      const course = state.courses.find(item => String(item.id) === String(courseId));
      const discountState = getCourseDiscountState(course);
      const discountValue = discountState.discountActive ? (course?.discount || '') : '';
      const payableAmount = discountValue || course?.fee || '';
      const paymentMethod = formData.get('payment');
      const paymentTxn = formData.get('paymentTxn')?.trim() || '';

      if (paymentMethod === 'bKash' && !paymentTxn) {
        message.textContent = 'bKash payment requires a transaction ID.';
        paymentUI.txnInput?.focus();
        return;
      }

      // Validate photo upload (optional)
      const photoFile = formData.get('photo');

      const students = getStudents();
      const portalPhone = normalizePhone(formData.get('studentPhone') || formData.get('phone') || '');
      const portalPin = `${Math.floor(1000 + Math.random() * 9000)}`;

      const record = {
        id: `MIT-${Date.now()}`,
        trackingNo: generateTrackingNumber(students),
        fullName: formData.get('studentNameEn'),
        studentNameEn: formData.get('studentNameEn'),
        studentNameBn: formData.get('studentNameBn'),
        fatherNameEn: formData.get('fatherNameEn'),
        fatherNameBn: formData.get('fatherNameBn'),
        motherNameEn: formData.get('motherNameEn'),
        motherNameBn: formData.get('motherNameBn'),
        dob: formData.get('dob'),
        education: formData.get('education'),
        permanentAddress: formData.get('permanentAddress'),
        presentAddress: formData.get('presentAddress'),
        studentPhone: formData.get('studentPhone'),
        parentPhone: formData.get('parentPhone'),
        email: formData.get('email'),
        nid: formData.get('nid'),
        payment: paymentMethod,
        paymentTxn,
        notes: formData.get('notes') || '',
        portalPhone,
        portalPin,
        courseId,
        courseTitle: course?.title || formData.get('course'),
        courseInstructor: course?.instructor || '',
        courseDuration: course?.duration || '',
        courseFee: course?.fee || '',
        coursePayable: payableAmount,
        courseDiscount: discountValue,
        discountApplied: Boolean(discountValue),
        certificate: course?.certificate || 'MIT Certified',
        createdAt: new Date().toISOString(),
        formDate: new Date().toISOString(),
        photo: null
      };

      // Process photo if provided
      if (photoFile && photoFile.size) {
        try {
          record.photo = await toBase64(photoFile);
        } catch (err) {
          console.warn('Unable to read photo', err);
        }
      }

      students.push(record);
      storage.set(LS_KEYS.students, students);

      // Supabase Sync
      if (window.db) {
        try {
          await window.db.saveStudent(record);
        } catch (err) {
          console.error('Cloud save failed', err);
          // Even if cloud save fails, we still want to continue with local storage
        }
      }

      let seatUpdateNote = '';
      if (courseId && discountState.hasLimit && discountState.discountActive) {
        const updatedCourse = updateCourseSeats(courseId, -1);
        if (updatedCourse) {
          seatUpdateNote = ` ${updatedCourse.discountSeatsLeft} discount seats remain for ${updatedCourse.title}.`;
        }
      }

      const invoiceMarkup = createInvoice(record, course);
      receiptContainer.innerHTML = invoiceMarkup;
      outputSection.hidden = false;
      outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Create a styled success message with login credentials
      message.innerHTML = `
        <div class="admission-success-card">
          <div class="success-header">
            <span class="success-icon">✅</span>
            <strong>Admission Successful!</strong>
          </div>
          <div class="success-credentials">
            <div class="credential-item">
              <span class="credential-label">📱 Phone (Username):</span>
              <span class="credential-value">${record.portalPhone || record.studentPhone}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">🔐 Portal PIN:</span>
              <span class="credential-value pin-highlight">${record.portalPin}</span>
            </div>
          </div>
          <div class="success-login-link">
            <a href="students/index.html" class="btn btn-gradient" target="_blank">🚀 Go to Student Portal</a>
          </div>
          <p class="success-note">⚠️ Save your PIN! You'll need it to access course materials.${seatUpdateNote}</p>
        </div>
      `;

      form.reset();
      populateCourseSelect();

      downloadBtn.onclick = () => downloadJSON(record, `${record.trackingNo || record.id}.json`);
      printBtn.onclick = () => printHTML(invoiceMarkup, 'MIT Admission Form');
    });

    const paymentMethodSelect = qs('#paymentMethod');
    paymentMethodSelect?.addEventListener('change', () => {
      setBkashVisibility(paymentMethodSelect.value === 'bKash');
    });
    setBkashVisibility(paymentMethodSelect?.value === 'bKash');

    paymentUI.copyBtn?.addEventListener('click', () => {
      const status = paymentUI.copyBtn;
      const original = status.textContent;
      navigator.clipboard?.writeText(CONTACT.bkash).then(() => {
        status.textContent = 'Copied!';
        setTimeout(() => (status.textContent = original), 1500);
      }).catch(() => alert(`Copy this number manually: ${BKASH_ACCOUNT}`));
    });

    paymentUI.tutorialBtn?.addEventListener('click', () => {
      if (!paymentUI.videoWrap) return;
      paymentUI.videoWrap.hidden = !paymentUI.videoWrap.hidden;
      const video = paymentUI.videoWrap.querySelector('video');
      if (!paymentUI.videoWrap.hidden) {
        video?.play()?.catch(() => { });
      } else {
        video?.pause();
      }
    });
  };

  const handleContactForm = () => {
    const form = qs('#contactForm');
    if (!form) return;
    const status = qs('#contactMessageStatus');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const messages = storage.get(LS_KEYS.messages, []);
      messages.push({ ...data, createdAt: new Date().toISOString() });
      storage.set(LS_KEYS.messages, messages);

      // Supabase Sync via service layer
      if (window.db?.initialized) {
        const { error } = await window.db.saveContactMessage(data);

        if (error) {
          console.error('Contact cloud sync failed:', error);
          status.textContent = 'Message saved locally but cloud sync failed. We\'ll still receive it.';
        } else {
          status.textContent = 'Thanks for reaching out! We will get back to you shortly.';
        }
      } else {
        status.textContent = 'Thanks for reaching out! We will get back to you shortly.';
      }

      form.reset();
      setTimeout(() => { status.textContent = ''; }, 4000);
    });
  };

  const handleBackToTop = () => {
    const btn = qs('#backToTop');
    if (!btn) return;
    const toggle = () => {
      if (window.scrollY > 380) btn.classList.add('visible');
      else btn.classList.remove('visible');
    };
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    toggle();
  };

  const handleSmoothAnchors = () => {
    qsa('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (event) => {
        const targetId = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  const handleMouseGlow = () => {
    const glowAreas = qsa('[data-glow]');
    if (!glowAreas.length) return;
    glowAreas.forEach(area => {
      area.addEventListener('pointermove', (event) => {
        const rect = area.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        area.style.setProperty('--glow-x', `${x}%`);
        area.style.setProperty('--glow-y', `${y}%`);
      });
    });
  };

  const handleNav = () => {
    const nav = qs('.primary-nav');
    const toggle = qs('#navToggle');
    const links = qsa('.nav-links a[data-nav]');
    const page = document.body.dataset.page;

    links.forEach(link => {
      if (link.dataset.nav === page) link.classList.add('is-active');
    });

    toggle?.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });

    nav?.addEventListener('click', (event) => {
      if (event.target.matches('.nav-links a')) {
        nav.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', (event) => {
      if (nav && nav.classList.contains('open') && !nav.contains(event.target)) {
        nav.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
      }
    });
  };

  const initTheme = () => {
    const stored = storage.get(LS_KEYS.theme);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.body.dataset.theme = theme;

    const toggle = qs('#themeToggle');
    toggle?.addEventListener('click', () => {
      const current = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = current;
      storage.set(LS_KEYS.theme, current);
    });
  };

  const setYear = () => {
    const el = qs('#currentYear');
    if (el) el.textContent = new Date().getFullYear();
  };

  const hashString = async (input) => {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const ensureAdminCredentials = async () => {
    const stored = storage.get(LS_KEYS.credentials);
    if (stored?.email && stored?.hash) return stored;
    const hash = await hashString(DEFAULT_ADMIN.password);
    const creds = { email: DEFAULT_ADMIN.email, hash };
    storage.set(LS_KEYS.credentials, creds);
    return creds;
  };

  const initAdminLogin = async () => {
    const form = qs('#adminLoginForm');
    if (!form) return;
    const status = qs('#adminLoginStatus');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = 'Verifying with cloud...';
      const data = Object.fromEntries(new FormData(form));

      if (window.db) {
        const { data: user, error } = await window.db.adminLogin(data.email, data.password);
        if (user && !error) {
          storage.set(LS_KEYS.session, { email: user.email, at: Date.now() });
          status.textContent = 'Success! Redirecting...';
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
          return;
        }
      }

      // Legacy fallback for development
      if (data.email === DEFAULT_ADMIN.email && data.password === DEFAULT_ADMIN.password) {
        storage.set(LS_KEYS.session, { email: data.email, at: Date.now() });
        status.textContent = 'Login successful (Dev Fallback).';
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
      } else {
        status.textContent = 'Invalid credentials or connection error.';
      }
    });
  };

  const ensureAdminSession = () => {
    const session = storage.get(LS_KEYS.session);
    if (!session) {
      // Fix login loop: redirect to admin/index.html, not root index.html
      const loginPath = IS_ADMIN ? 'index.html' : 'admin/index.html';
      window.location.href = loginPath;
      return null;
    }
    return session;
  };

  const renderStudentsTable = () => {
    // If advanced dashboard is loaded, let it handle rendering
    if (window.refreshAdvancedDashboard) {
      window.refreshAdvancedDashboard();
      renderAnalytics();
      return;
    }

    const tbody = qs('#studentsTbody');
    if (!tbody) return;
    const students = getStudents();
    if (!students.length) {
      tbody.innerHTML = '<tr><td colspan="7">No student submissions yet.</td></tr>';
      renderAnalytics();
      return;
    }
    const rows = [...students].reverse();
    tbody.innerHTML = rows.map((student) => {
      const discountApplied = Boolean(student.courseDiscount);
      const payableDisplay = formatBDT(student.coursePayable || student.courseDiscount || student.courseFee);
      const regularDisplay = formatBDT(student.courseFee);
      const paymentDetails = discountApplied
        ? `<div class="student-meta">Discounted Fee: ${valueOrNA(payableDisplay)}</div>
           <div class="student-meta muted">Regular: ${valueOrNA(regularDisplay)}</div>`
        : `<div class="student-meta">${valueOrNA(payableDisplay)}</div>`;
      return `
        <tr data-student-id="${student.id}">
          <td>
            <strong>${student.trackingNo || student.id}</strong>
            <div class="student-meta">${student.id}</div>
          </td>
          <td>
            <strong>${student.studentNameEn || student.fullName}</strong>
            <div class="student-meta">
              ${valueOrNA(student.studentPhone || student.phone)}
              <br />${valueOrNA(student.email)}
            </div>
            <div class="student-meta">Portal PIN: ${valueOrNA(student.portalPin, '&mdash;')}</div>
          </td>
          <td>
            <strong>${student.courseTitle}</strong>
            <div class="student-meta">${student.courseInstructor || ''}</div>
          </td>
          <td>
            <strong>${valueOrNA(student.payment)}</strong>
            ${paymentDetails}
            <div class="student-meta">Txn: ${valueOrNA(student.paymentTxn, '-')}</div>
          </td>
          <td>${formatDisplayDate(student.createdAt)}</td>
          <td>
            <div class="student-actions">
              <button type="button" class="btn btn-ghost" data-action="print-form">📄 Form</button>
              <button type="button" class="btn btn-ghost" data-action="print-invoice">🧾 Invoice</button>
              <button type="button" class="btn btn-ghost" data-action="download-student">📥 JSON</button>
              <button type="button" class="btn btn-ghost" data-action="edit-student">✏️ Edit</button>
              <button type="button" class="btn btn-danger" data-action="delete-student">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    renderAnalytics();
  };

  const renderCoursesTable = () => {
    const tbody = qs('#coursesTbody');
    if (!tbody) return;
    const stored = storage.get(LS_KEYS.courses, state.courses);
    const courses = (stored || []).map(ensureCourseShape);
    storage.set(LS_KEYS.courses, courses);
    state.courses = courses;
    tbody.innerHTML = courses.map(course => `
      <tr data-course-id="${course.id}">
        <td><strong>${course.title}</strong></td>
        <td>${course.instructor}</td>
        <td>${course.duration}</td>
        <td>${course.fee}</td>
        <td>${course.discountSeatsLimit
        ? `<strong>${course.discountSeatsLeft}</strong> / ${course.discountSeatsLimit}`
        : '<span class="muted small">Unlimited</span>'}</td>
        <td>${course.featured ? 'Yes' : 'No'}</td>
        <td>
          <div class="section-actions">
            <button type="button" class="btn btn-outline" data-action="edit-course">Edit</button>
            <button type="button" class="btn btn-outline" data-action="delete-course">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  const renderCertificatesTable = () => {
    const tbody = qs('#certificatesTbody');
    if (!tbody) return;
    const certs = storage.get(LS_KEYS.certificates, []);
    if (!certs.length) {
      tbody.innerHTML = '<tr><td colspan="4">No certificates uploaded yet.</td></tr>';
      return;
    }
    const rows = [...certs].reverse();
    tbody.innerHTML = rows.map(cert => `
      <tr data-cert-id="${cert.id}">
        <td>${cert.studentId}</td>
        <td>${cert.fileName}</td>
        <td>${new Date(cert.createdAt).toLocaleString()}</td>
        <td>
          <div class="section-actions">
            <button type="button" class="btn btn-outline" data-action="download-cert">Download</button>
            <button type="button" class="btn btn-outline" data-action="delete-cert">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  const renderMessagesTable = () => {
    const tbody = qs('#messagesTbody');
    if (!tbody) return;
    // Try Supabase cache first, then fall back to local messages key
    let messages = storage.get(LS_KEYS.messages, []);
    if (!messages.length) {
      messages = storage.get('mit_contact_messages', []);
    }
    if (!messages.length) {
      tbody.innerHTML = '<tr><td colspan="4">No messages yet.</td></tr>';
      return;
    }
    const rows = [...messages].reverse();
    tbody.innerHTML = rows.map(msg => {
      const truncated = msg.message && msg.message.length > 80
        ? msg.message.substring(0, 80) + '\u2026'
        : (msg.message || '');
      return `
        <tr>
          <td>${msg.name || ''}</td>
          <td><a href="mailto:${msg.email || ''}">${msg.email || ''}</a></td>
          <td>${truncated}</td>
          <td>${formatDateTime(msg.createdAt || msg.created_at)}</td>
        </tr>
      `;
    }).join('');
  };

  const refreshCoursesUI = () => {
    renderPopularCourses();
    renderCoursesPage();
    renderCoursesTable();
    populateCourseSelect();
    updateBkashPanel();
  };

  const updateCourseSeats = (courseId, delta = 0) => {
    if (!courseId || !delta) return null;
    const stored = storage.get(LS_KEYS.courses, state.courses);
    const courses = (stored && stored.length ? stored : state.courses).map(ensureCourseShape);
    const index = courses.findIndex(course => String(course.id) === String(courseId));
    if (index < 0) return null;
    const target = courses[index];
    if (!target.discountSeatsLimit) return target;
    const nextValue = Math.max(0, Math.min(target.discountSeatsLeft + delta, target.discountSeatsLimit));
    if (nextValue === target.discountSeatsLeft) return target;
    courses[index] = { ...target, discountSeatsLeft: nextValue };
    storage.set(LS_KEYS.courses, courses);
    markCoursesCustom();
    state.courses = courses;
    refreshCoursesUI();
    return courses[index];
  };

  const getStudentPayments = () => {

    const students = getStudents();

    return students.map((student) => {

      const createdAt = student.createdAt || student.formDate || new Date().toISOString();

      const amount = parseBDT(student.coursePayable || student.courseDiscount || student.courseFee);

      return {

        id: student.id,

        trackingNo: student.trackingNo || student.id,

        name: student.studentNameEn || student.fullName || 'Unknown',

        course: student.courseTitle || 'N/A',

        amount,

        formattedAmount: formatBDT(student.coursePayable || student.courseDiscount || student.courseFee || amount),

        payment: student.payment || 'Pending',

        createdAt

      };

    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  };



  const renderFinanceDetails = () => {

    const incomeBody = qs('#incomeBreakdownBody');

    const payments = getStudentPayments();

    if (incomeBody) {

      const recent = payments.slice(0, 10);

      incomeBody.innerHTML = recent.length ? recent.map(payment => `

        <tr>

          <td>



            <strong>${payment.name}</strong>

            <div class="muted small">${payment.course}</div>

          </td>

          <td>${payment.formattedAmount}</td>

          <td>${valueOrNA(payment.payment)}</td>

          <td>${formatDateTime(payment.createdAt)}</td>

        </tr>`).join('') : '<tr><td colspan="4">No admissions yet.</td></tr>';

    }

    const incomeTotalEl = qs('#incomeTotal');

    if (incomeTotalEl) {

      const total = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      incomeTotalEl.textContent = formatPlainBDT(total);

    }



    const expenseBody = qs('#expenseBreakdownBody');

    if (expenseBody) {

      const entries = getExpenseEntries();

      expenseBody.innerHTML = entries.length ? [...entries].reverse().map(entry => `

        <tr>

          <td>${formatBDT(entry.amount)}</td>

          <td>${entry.note || 'Operational expense'}</td>

          <td>${formatDateTime(entry.createdAt)}</td>

        </tr>`).join('') : '<tr><td colspan="3">No expense records yet.</td></tr>';

    }



    const expenseTotalEl = qs('#expenseTotal');

    if (expenseTotalEl) expenseTotalEl.textContent = formatPlainBDT(getExpenseTotal());

  };



  const renderAnalytics = () => {
    const lineCanvas = qs('#salesChart');
    const pieCanvas = qs('#financePie');
    if (!lineCanvas || !pieCanvas) return;
    const students = getStudents();
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: date.toLocaleString('en-US', { month: 'short' }),
        value: 0
      });
    }
    students.forEach(student => {
      const date = new Date(student.createdAt || Date.now());
      const label = date.toLocaleString('en-US', { month: 'short' });
      const amount = parseBDT(student.coursePayable || student.courseFee || 0);
      const bucket = months.find(item => item.label === label);
      if (bucket) bucket.value += amount;
    });
    const labels = months.map(m => m.label);
    const data = months.map(m => m.value);
    drawLineChart(lineCanvas, labels, data);
    const totalSales = data.reduce((sum, val) => sum + val, 0);
    const expenseEntries = getExpenseEntries();
    const expenses = expenseEntries.length ? getExpenseTotal() : Math.max(totalSales * 0.4, 5000);
    const profit = Math.max(totalSales - expenses, 0);
    drawPieChart(pieCanvas, [totalSales, expenses], ['#4F7CFF', '#00C9A7']);
    const salesTotalEl = qs('#salesTotal');
    if (salesTotalEl) salesTotalEl.textContent = formatPlainBDT(totalSales);
    const profitEl = qs('#profitTotal');
    if (profitEl) profitEl.textContent = formatPlainBDT(profit);
    renderFinanceDetails();
  };

  const setupCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
  };

  const drawLineChart = (canvas, labels, data) => {
    const { ctx, width, height } = setupCanvas(canvas);
    const padding = 32;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const max = Math.max(...data, 1);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    ctx.strokeStyle = '#4F7CFF';
    ctx.fillStyle = '#4F7CFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding + (chartWidth / Math.max(labels.length - 1, 1)) * index;
      const y = height - padding - (value / max) * chartHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    data.forEach((value, index) => {
      const x = padding + (chartWidth / Math.max(labels.length - 1, 1)) * index;
      const y = height - padding - (value / max) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#475569';
    ctx.font = '12px Inter, sans-serif';
    labels.forEach((label, index) => {
      const x = padding + (chartWidth / Math.max(labels.length - 1, 1)) * index;
      ctx.fillText(label, x - 12, height - padding + 16);
    });
  };

  const drawPieChart = (canvas, data, colors) => {
    const { ctx, width, height } = setupCanvas(canvas);
    const total = data.reduce((sum, val) => sum + val, 0) || 1;
    let start = -Math.PI / 2;
    const radius = Math.min(width, height) / 2 - 20;
    data.forEach((value, index) => {
      const angle = (value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2);
      ctx.fillStyle = colors[index % colors.length];
      ctx.arc(width / 2, height / 2, radius, start, start + angle);
      ctx.fill();
      start += angle;
    });
  };

  const resetCourseImagePreview = () => {
    const preview = qs('#courseImagePreview');
    const label = qs('#courseImageLabel');
    const labelText = qs('#courseImageLabelText');
    const clearBtn = qs('#clearCourseImage');
    const urlInput = qs('#courseImageUrl');
    const fileInput = qs('#courseImage');
    if (preview) { preview.src = ''; preview.hidden = true; }
    if (label) label.style.display = '';
    if (labelText) labelText.textContent = 'Click to upload a course photo';
    if (clearBtn) clearBtn.hidden = true;
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
  };

  const setCourseImagePreview = (url) => {
    const preview = qs('#courseImagePreview');
    const label = qs('#courseImageLabel');
    const clearBtn = qs('#clearCourseImage');
    const urlInput = qs('#courseImageUrl');
    if (!url) { resetCourseImagePreview(); return; }
    if (preview) { preview.src = url; preview.hidden = false; }
    if (label) label.style.display = 'none';
    if (clearBtn) clearBtn.hidden = false;
    if (urlInput) urlInput.value = url;
  };

  const initCourseImageUpload = () => {
    const fileInput = qs('#courseImage');
    const clearBtn = qs('#clearCourseImage');
    if (!fileInput) return;

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert('Image is too large. Please choose a file under 2 MB.');
        fileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setCourseImagePreview(e.target.result);
      reader.readAsDataURL(file);
    });

    clearBtn?.addEventListener('click', () => {
      resetCourseImagePreview();
    });
  };

  const resetCourseForm = () => {
    const form = qs('#courseForm');
    if (!form) return;
    form.reset();
    qs('#courseId').value = '';
    const title = qs('#courseFormTitle');
    if (title) title.textContent = 'Add Course';
    qs('#courseFormStatus').textContent = '';
    resetCourseImagePreview();
  };

  const initCoursesForm = () => {
    const form = qs('#courseForm');
    if (!form) return;

    initCourseImageUpload();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = qs('#courseFormStatus');
      const saveBtn = qs('#saveCourseBtn');
      const data = Object.fromEntries(new FormData(form));
      const courses = storage.get(LS_KEYS.courses, state.courses);
      const seatsLimit = parseSeatCount(data.discountSeatsLimit, 0);
      const seatsLeft = parseSeatCount(data.discountSeatsLeft, seatsLimit);

      // Handle image upload to Supabase Storage
      let imageUrl = qs('#courseImageUrl')?.value || '';
      const imageFile = qs('#courseImage')?.files?.[0];

      if (imageFile && window.db) {
        status.textContent = '⏳ Uploading image...';
        if (saveBtn) saveBtn.disabled = true;
        try {
          const uploaded = await window.db.uploadImage(imageFile, 'course-images');
          if (uploaded) {
            imageUrl = uploaded;
            setCourseImagePreview(uploaded);
          } else {
            status.textContent = '⚠️ Image upload failed, saving without photo.';
          }
        } catch (err) {
          console.warn('Image upload error:', err);
          status.textContent = '⚠️ Image upload failed, saving without photo.';
        }
        if (saveBtn) saveBtn.disabled = false;
      }

      const payload = {
        id: data.id || `course-${Date.now()}`,
        title: data.title,
        instructor: data.instructor,
        duration: data.duration,
        fee: data.fee,
        discount: data.discount,
        certificate: data.certificate,
        description: data.description || '',
        topics: data.topics ? data.topics.split(',').map(item => item.trim()).filter(Boolean) : [],
        outcomes: data.outcomes ? data.outcomes.split(',').map(item => item.trim()).filter(Boolean) : [],
        featured: Boolean(data.featured),
        discountSeatsLimit: seatsLimit,
        discountSeatsLeft: seatsLeft || seatsLimit,
        image: imageUrl || undefined
      };

      // Supabase Sync - COURSE
      if (window.db) {
        status.textContent = '⏳ Saving to cloud...';
        const { data: saved, error } = await window.db.saveCourse(payload);
        if (error) {
          console.error('Course cloud sync failed', error);
          status.textContent = `❌ Save failed: ${error.message || JSON.stringify(error)}`;
          return;
        }
        // Use the DB-generated ID for the local copy
        if (saved?.id) payload.id = saved.id;
      }

      const index = courses.findIndex(course => String(course.id) === String(payload.id));
      if (index >= 0) {
        courses[index] = { ...courses[index], ...payload };
        status.textContent = '✅ Course updated successfully.';
      } else {
        courses.push(payload);
        status.textContent = '✅ Course added successfully.';
      }
      storage.set(LS_KEYS.courses, courses);
      markCoursesCustom();
      state.courses = courses;
      refreshCoursesUI();
      setTimeout(() => { status.textContent = ''; }, 2500);
    });

    qs('#resetCourseForm')?.addEventListener('click', (event) => {
      event.preventDefault();
      resetCourseForm();
    });
  };

  const handleDashboardActions = () => {
    const studentsWrap = qs('#studentsTable');
    const coursesWrap = qs('#coursesTable');
    const certsWrap = qs('#certificatesTable');

    studentsWrap?.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      const row = btn.closest('tr');
      const id = row?.dataset.studentId;
      if (!id) return;
      const students = getStudents();
      const student = students.find(item => item.id === id);
      if (!student) return;
      const course = state.courses.find(item => String(item.id) === String(student.courseId));
      if (btn.dataset.action === 'print-form') {
        const markup = createAdmissionForm(student, course);
        printHTML(markup, `AdmissionForm-${student.trackingNo || student.id}`);
      } else if (btn.dataset.action === 'print-invoice') {
        const markup = createInvoice(student, course);
        printHTML(markup, `Invoice-${student.trackingNo || student.id}`);
      } else if (btn.dataset.action === 'download-student') {
        downloadJSON(student, `${student.trackingNo || student.id}.json`);
      } else if (btn.dataset.action === 'edit-student') {
        openStudentEditor(student);
      } else if (btn.dataset.action === 'delete-student') {
        if (confirm('Remove this student record?')) {
          storage.set(LS_KEYS.students, students.filter(item => item.id !== id));
          if (window.db) window.db.deleteStudent(id);
          renderStudentsTable();
        }
      }
    });

    coursesWrap?.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      const row = btn.closest('tr');
      const id = row?.dataset.courseId;
      if (!id) return;
      const courses = storage.get(LS_KEYS.courses, state.courses);
      const index = courses.findIndex(item => String(item.id) === String(id));
      if (index < 0) return;
      if (btn.dataset.action === 'edit-course') {
        const course = courses[index];
        const form = qs('#courseForm');
        if (!form) return;
        qs('#courseFormTitle').textContent = 'Edit Course';
        qs('#courseId').value = course.id;
        qs('#courseTitle').value = course.title;
        qs('#courseInstructor').value = course.instructor;
        qs('#courseDuration').value = course.duration;
        qs('#courseFee').value = parseFloat(String(course.fee).replace(/[^0-9.]/g, '')) || '';
        qs('#courseDiscount').value = parseFloat(String(course.discount || '').replace(/[^0-9.]/g, '')) || '';
        qs('#courseSeatsLimit').value = course.discountSeatsLimit ?? '';
        qs('#courseSeatsLeft').value = course.discountSeatsLeft ?? '';
        qs('#courseCertificate').value = course.certificate || '';
        qs('#courseDescription') && (qs('#courseDescription').value = course.description || '');
        qs('#courseTopics').value = course.topics?.join(', ') || '';
        qs('#courseOutcomes').value = course.outcomes?.join(', ') || '';
        qs('#courseFeatured').checked = Boolean(course.featured);
        // Set image preview if course has one
        if (course.image || course.image_url) {
          setCourseImagePreview(course.image || course.image_url);
        } else {
          resetCourseImagePreview();
        }
        window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
      } else if (btn.dataset.action === 'delete-course') {
        if (confirm('Delete this course from cloud?')) {
          if (window.db) window.db.deleteCourse(id);
          const filtered = courses.filter(item => String(item.id) !== String(id));
          storage.set(LS_KEYS.courses, filtered);
          state.courses = filtered;
          refreshCoursesUI();
        }
      }
    });

    certsWrap?.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      const row = btn.closest('tr');
      const id = row?.dataset.certId;
      const certs = storage.get(LS_KEYS.certificates, []);
      const cert = certs.find(item => item.id === id);
      if (!cert) return;
      if (btn.dataset.action === 'download-cert') {
        const link = document.createElement('a');
        link.href = cert.data;
        link.download = cert.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (btn.dataset.action === 'delete-cert') {
        if (confirm('Delete this certificate?')) {
          storage.set(LS_KEYS.certificates, certs.filter(item => item.id !== id));
          renderCertificatesTable();
        }
      }
    });
  };

  const initDashboard = async () => {
    if (!qs('body[data-page="admin-dashboard"]')) return;
    const session = ensureAdminSession();
    if (!session) return;
    const creds = await ensureAdminCredentials();
    const emailEl = qs('#settingsEmail');
    if (emailEl) emailEl.value = creds.email;
    const passEl = qs('#settingsPassword');
    if (passEl) passEl.value = '';

    await loadCourses();

    // Cloud Data Injection - fetch from Supabase and render
    if (window.db?.initialized) {
      window.db.getStudents((students) => {
        // Update localStorage with cloud data then re-render
        renderStudentsTable();
      });
      window.db.getContactMessages((messages) => {
        renderMessagesTable();
      });
      window.db.getCourses((courses) => {
        if (courses && courses.length) {
          state.courses = courses.map(ensureCourseShape);
        }
        renderCoursesTable();
      });
    }

    seedInitialStudent();

    qs('#logoutButton')?.addEventListener('click', () => {
      storage.remove(LS_KEYS.session);
      window.location.href = 'index.html';
    });

    initStudentEditor();

    const tabs = qsa('.tab');
    const panels = qsa('.tab-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(btn => {
          const isActive = btn === tab;
          btn.classList.toggle('is-active', isActive);
          btn.setAttribute('aria-selected', String(isActive));
        });
        panels.forEach(panel => panel.hidden = panel.id !== `tab${target.charAt(0).toUpperCase()}${target.slice(1)}`);
      });
    });

    renderStudentsTable();
    renderCoursesTable();
    renderCertificatesTable();
    renderMessagesTable();
    initCoursesForm();
    handleDashboardActions();
    renderAnalytics();
    window.addEventListener('resize', () => renderAnalytics());
    if (studentFormEl?.elements?.courseId) {
      hydrateStudentCourseSelect(studentFormEl.elements.courseId, 'Keep current');
    }
    qs('#updateExpensesBtn')?.addEventListener('click', () => {
      const amountInput = prompt('Enter expense amount (BDT):', '');
      if (amountInput === null) return;
      const value = Number(amountInput);
      if (!Number.isFinite(value) || value < 0) {
        alert('Please enter a valid amount.');
        return;
      }
      const note = prompt('Add a note for this expense (e.g., Rent, Utilities):', 'General expense');
      addExpenseEntry(value, note || 'General expense');
      renderAnalytics();
      renderFinanceDetails();
    });

    qs('#exportStudents')?.addEventListener('click', () => {
      const students = getStudents();
      if (!students.length) return alert('No records to export yet.');
      downloadJSON(students, `mit-students-${Date.now()}.json`);
    });

    qs('#printStudents')?.addEventListener('click', () => {
      const students = getStudents();
      if (!students.length) return alert('No records to print yet.');
      const list = [...students].reverse().map(student => `
        <article style="margin-bottom:18px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
          <h3>${student.trackingNo || student.id} &mdash; ${student.studentNameEn || student.fullName}</h3>
          <p>Course: ${student.courseTitle} (${student.courseInstructor || 'Instructor TBD'})</p>
          <p>Email: ${student.email || 'N/A'} &bull; Student Phone: ${student.studentPhone || student.phone || 'N/A'}</p>
          <p>Parent Phone: ${student.parentPhone || 'N/A'} &bull; Payment: ${student.payment}</p>
          <p>Portal Login: ${student.portalPhone || student.studentPhone || 'N/A'} &bull; PIN: ${student.portalPin || 'Issued by MIT'}</p>
          <p>Submitted: ${new Date(student.createdAt).toLocaleString()}</p>
        </article>
      `).join('');
      printHTML(`<h1>MIT Student Summary</h1>${list}`, 'MIT Students');
    });

    qs('#exportCourses')?.addEventListener('click', () => {
      const courses = storage.get(LS_KEYS.courses, state.courses);
      downloadJSON(courses, `mit-courses-${Date.now()}.json`);
    });

    qs('#importCourses')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text).map(ensureCourseShape);
        storage.set(LS_KEYS.courses, data);
        markCoursesCustom();
        state.courses = data;
        refreshCoursesUI();
      } catch (err) {
        alert('Invalid JSON file.');
        console.error(err);
      }
      event.target.value = '';
    });

    qs('#certificateForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.target;
      const status = qs('#certificateStatus');
      const formData = new FormData(form);
      const file = formData.get('file');
      if (!file || !file.size) {
        status.textContent = 'Select a file to upload.';
        return;
      }
      status.textContent = 'Uploading...';
      const dataUrl = await toBase64(file);
      const record = {
        id: `CERT-${Date.now()}`,
        studentId: formData.get('studentId'),
        fileName: file.name,
        mime: file.type,
        data: dataUrl,
        createdAt: new Date().toISOString()
      };
      const certs = storage.get(LS_KEYS.certificates, []);
      certs.push(record);
      storage.set(LS_KEYS.certificates, certs);
      renderCertificatesTable();
      form.reset();
      status.textContent = 'Certificate saved.';
      setTimeout(() => { status.textContent = ''; }, 2000);
    });

    qs('#settingsForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = qs('#settingsStatus');
      const data = Object.fromEntries(new FormData(event.target));
      if (!data.password) {
        status.textContent = 'Password cannot be empty.';
        return;
      }
      status.textContent = 'Updating credentials...';

      // Update in Supabase first
      if (window.db?.initialized) {
        const currentSession = storage.get(LS_KEYS.session);
        const currentEmail = currentSession?.email || DEFAULT_ADMIN.email;
        const { error } = await window.db.updateAdminCredentials(currentEmail, data.email, data.password);
        if (error) {
          status.textContent = `Cloud update failed: ${error.message || error}`;
          return;
        }
        // Update local session email
        storage.set(LS_KEYS.session, { email: data.email, at: Date.now() });
      }

      const hash = await hashString(data.password);
      storage.set(LS_KEYS.credentials, { email: data.email, hash });
      status.textContent = 'Credentials updated successfully.';
      event.target.reset();
      setTimeout(() => { status.textContent = ''; }, 2500);
    });
  };

  // ============================================================================
  // STUDENT PORTAL
  // ============================================================================



  const initStudentLogin = () => {
    const form = qs('#studentLoginForm');
    if (!form) return;
    const status = qs('#studentLoginMessage');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const phone = normalizePhone(qs('#loginPhone')?.value || '');
      const pin = qs('#loginPin')?.value || '';

      if (!phone || !pin) {
        if (status) status.textContent = 'Please enter both phone and PIN.';
        return;
      }

      if (status) status.textContent = 'Verifying with server...';

      if (window.db) {
        const { data: student, error } = await window.db.studentLogin(phone, pin);
        if (student && !error) {
          // Store full session data for portal use
          sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify({
            id: student.id,
            trackingNo: student.trackingNo,
            fullName: student.fullName || student.studentNameEn,
            name: student.fullName || student.studentNameEn,
            course: student.courseTitle,
            courseId: student.courseId,
            instructor: student.courseInstructor,
            pin: student.portalPin,
            photo: student.photo || null,
            unlockedCourses: student.unlockedCourses || (student.courseId ? [String(student.courseId)] : []),
            at: Date.now()
          }));
          if (status) status.textContent = 'Redirecting...';
          setTimeout(() => { window.location.href = 'portal.html'; }, 500);
          return;
        }
      }

      // Local fallback
      const students = getStudents();
      const student = students.find(s => normalizePhone(s.portalPhone || s.studentPhone) === phone && String(s.portalPin) === String(pin));

      if (student) {
        sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify({
          id: student.id,
          trackingNo: student.trackingNo,
          fullName: student.fullName || student.studentNameEn,
          name: student.fullName || student.studentNameEn,
          course: student.courseTitle,
          courseId: student.courseId,
          instructor: student.courseInstructor,
          pin: student.portalPin,
          photo: student.photo || null,
          unlockedCourses: student.unlockedCourses || (student.courseId ? [String(student.courseId)] : []),
          at: Date.now()
        }));
        if (status) status.textContent = 'Redirecting (Offline Cache)...';
        setTimeout(() => { window.location.href = 'portal.html'; }, 500);
      } else {
        if (status) status.textContent = 'Invalid Phone or PIN.';
      }
    });
  };

  const initStudentPortal = async () => {
    if (!document.body.dataset.page || document.body.dataset.page !== 'student-portal') return;

    // Check session
    const sessionData = sessionStorage.getItem(STUDENT_SESSION_KEY);
    if (!sessionData) {
      window.location.href = 'index.html';
      return;
    }

    // Refresh student data from Supabase and find the logged-in student
    let fullStudentData = null;
    if (window.db) {
      try {
        const allStudents = await window.db.getStudents();
        if (allStudents && allStudents.length) {
          fullStudentData = allStudents.find(s => s.id === student.id) || null;
        }
      } catch (e) {
        console.warn('Failed to refresh student data from Supabase', e);
      }
    }
    // Merge fresh data into session if available
    if (fullStudentData) {
      student.name = fullStudentData.fullName || fullStudentData.studentNameEn || student.name;
      student.course = fullStudentData.courseTitle || student.course;
      student.courseId = fullStudentData.courseId || student.courseId;
      student.instructor = fullStudentData.courseInstructor || student.instructor;
      student.pin = fullStudentData.portalPin || student.pin;
      student.photo = fullStudentData.photo || student.photo;
      student.unlockedCourses = fullStudentData.unlockedCourses || student.unlockedCourses || [];
      student.trackingNo = fullStudentData.trackingNo || student.trackingNo;
    }

    // Refresh course data from Supabase to ensure we have the latest
    try {
      await loadCourses();
    } catch (e) {
      console.warn('Failed to refresh course data', e);
    }

    const student = JSON.parse(sessionData);

    // Populate student info
    const nameEl = qs('#portalStudentName');
    const trackingEl = qs('#portalTracking');
    const courseEl = qs('#portalCourseName');
    const instructorEl = qs('#portalInstructor');
    const pinEl = qs('#portalPin');

    // Logout button
    qs('#studentLogout')?.addEventListener('click', () => {
      sessionStorage.removeItem(STUDENT_SESSION_KEY);
      window.location.href = 'index.html';
    });

    // Determine active course
    const params = new URLSearchParams(window.location.search);
    let activeCourseId = params.get('courseId') || student.courseId;

    // Verify access
    const unlockedCourses = student.unlockedCourses || (student.courseId ? [String(student.courseId)] : []);
    if (activeCourseId && !unlockedCourses.includes(String(activeCourseId)) && String(activeCourseId) !== String(student.courseId)) {
      activeCourseId = student.courseId; // Fallback
    }

    const activeCourse = state.courses.find(c => String(c.id) === String(activeCourseId));

    if (nameEl) nameEl.textContent = student.name || student.fullName || 'MIT Student';
    if (trackingEl) trackingEl.textContent = student.trackingNo || 'MIT-0000';
    if (courseEl) courseEl.textContent = activeCourse ? activeCourse.title : (student.course || 'MIT Course');
    if (instructorEl) instructorEl.textContent = activeCourse ? activeCourse.instructor : (student.instructor || 'MIT Mentor');
    if (pinEl) pinEl.textContent = student.pin || '----';

    // Display student photo if available
    const photoEl = qs('#portalStudentPhoto');
    if (photoEl) {
      const photoSrc = student.photo || (fullStudentData && fullStudentData.photo);
      if (photoSrc) {
        photoEl.src = photoSrc;
        photoEl.style.display = 'block';
        photoEl.onerror = () => {
          photoEl.style.display = 'none';
          photoEl.onerror = null;
        };
      } else {
        photoEl.style.display = 'none';
      }
    }

    // Get course resources using helper
    const resources = getCourseResources(activeCourseId, activeCourse ? activeCourse.title : student.course);

    // Populate materials
    const materialsList = qs('#materialsList');
    if (materialsList) {
      if (resources.materials && resources.materials.length > 0) {
        materialsList.innerHTML = resources.materials.map(m => `<li>${m}</li>`).join('');
      } else {
        materialsList.innerHTML = '<li class="muted">No materials available yet.</li>';
      }
    }

    // Populate homework
    const homeworkList = qs('#homeworkList');
    if (homeworkList) {
      if (resources.homework && resources.homework.length > 0) {
        homeworkList.innerHTML = resources.homework.map(h => `<li>${h}</li>`).join('');
      } else {
        homeworkList.innerHTML = '<li class="muted">No homework assigned yet.</li>';
      }
    }

    // Populate links
    const linksList = qs('#linksList');
    if (linksList) {
      if (resources.links && resources.links.length > 0) {
        linksList.innerHTML = resources.links.map(l =>
          `<li><a href="${l.url}" target="_blank" rel="noopener">${l.title || l.label}</a></li>`
        ).join('');
      } else {
        linksList.innerHTML = '<li class="muted">No links available yet.</li>';
      }
    }

    // Populate downloadable files (Slides & Sheets)
    const slidesList = qs('#slidesList');
    if (slidesList) {
      if (resources.files && resources.files.length > 0) {
        slidesList.innerHTML = resources.files.map(f =>
          `<li><a href="${f.url}" download>${f.name || f.label}</a></li>`
        ).join('');
      } else {
        slidesList.innerHTML = '<li class="muted">No slides available yet.</li>';
      }
    }

    // Show other courses
    const courseAccessGrid = qs('#courseAccessGrid');
    if (courseAccessGrid && state.courses) {
      const otherCourses = state.courses.filter(c => String(c.id) !== String(activeCourseId));
      courseAccessGrid.innerHTML = otherCourses.map(course => {
        const isUnlocked = unlockedCourses.includes(String(course.id));
        if (isUnlocked) {
          return `
            <article class="card course-unlocked" style="border-color: #00C9A7; border-width: 2px;">
              <h3>${course.title}</h3>
              <p class="muted small">${course.duration} • ${course.instructor}</p>
              <p style="color: #00C9A7; font-weight: 600;">✅ Access Granted</p>
              <a href="?courseId=${course.id}" class="btn btn-sm btn-outline">View Materials</a>
            </article>
          `;
        } else {
          return `
            <article class="card course-locked">
              <h3>${course.title}</h3>
              <p class="muted small">${course.duration} • ${course.instructor}</p>
              <p class="muted">🔒 Locked</p>
              <a href="../admission.html?course=${encodeURIComponent(course.title)}" class="btn btn-sm btn-outline">Unlock Course</a>
            </article>
          `;
        }
      }).join('');
    }
  };

  const boot = async () => {
    initTheme();
    setYear();
    handleNav();
    handleBackToTop();
    handleSmoothAnchors();
    handleMouseGlow();
    courseModal.init();
    handleCourseButtons();
    handleContactForm();
    initAdminLogin();

    // Load courses first and wait for completion
    try {
      await loadCourses();

      // Ensure courses were loaded
      if (state.courses && state.courses.length > 0) {
        console.log(`✓ Loaded ${state.courses.length} courses successfully`);
      } else {
        console.warn('⚠ No courses loaded');
      }
    } catch (error) {
      console.error('✗ Error loading courses:', error);
    }

    // Now render everything that depends on courses
    renderPopularCourses();
    renderCoursesPage();
    renderInstructors();
    populateCourseSelect();
    handleAdmissionForm();
    initStudentLogin();
    await initStudentPortal();

    await initDashboard();
  };

  // Expose render functions for Supabase Realtime
  window.renderStudentsTable = renderStudentsTable;
  window.renderCoursesPage = renderCoursesPage;
  window.refreshCoursesUI = refreshCoursesUI;
  window.renderMessagesTable = renderMessagesTable;

  return { boot };
})();

// Boot exactly once — safe for both inline and deferred script loading
(function () {
  let booted = false;
  const safeBoot = () => {
    if (booted) return;
    booted = true;
    MITApp.boot();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeBoot);
  } else {
    safeBoot();
  }
})();

// ============================================================================
// PREMIUM STATS COUNTER ANIMATION
// ============================================================================

/**
 * Animates number counters on scroll into view
 * Works with elements that have data-count attribute
 */
const animateStatsCounter = () => {
  const stats = document.querySelectorAll('.stat-value[data-count]');

  stats.forEach(stat => {
    const target = parseInt(stat.dataset.count);
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    let hasAnimated = false;

    const updateCount = () => {
      if (current < target) {
        current += increment;
        stat.textContent = Math.floor(current);
        requestAnimationFrame(updateCount);
      } else {
        stat.textContent = target;
      }
    };

    // Intersection Observer for scroll trigger
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          updateCount();
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5 // Trigger when 50% visible
    });

    observer.observe(stat.parentElement);
  });
};

// Initialize stats animation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', animateStatsCounter);
} else {
  animateStatsCounter();
}


















