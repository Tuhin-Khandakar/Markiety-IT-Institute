/**
 * Advanced SEO Enhancement Module
 * Optimized for: "best IT institute Madhabdi", "IT training Narsingdi"
 * AI Search optimized + complete structured data for all search engines
 */

(function() {
  'use strict';

  const SEO_KEYWORDS = {
    primary: [
      'best IT institute Madhabdi',
      'IT training center Narsingdi',
      'computer training Madhabdi',
      'digital marketing course Narsingdi',
      'graphics design training Madhabdi',
      'video editing course Narsingdi',
      'freelancing training Bangladesh'
    ],
    secondary: [
      'MIT Madhabdi',
      'Markiety IT Institute',
      'government approved IT training',
      'affordable computer courses',
      'job-ready skills training'
    ],
    location: ['Madhabdi', 'Narsingdi', 'Dhaka Division', 'Bangladesh']
  };

  // ============================================================================
  // FAQ DATA — Used for FAQPage + QAPage schemas
  // ============================================================================
  const FAQ_DATA = [
    {
      q: 'What courses does Markiety IT Institute offer?',
      a: 'MIT offers 5 core programs: Basic Computer, Digital Marketing, Graphics Design, Video Editing, and Freelancing. All courses include government-approved certificates and career mentorship.'
    },
    {
      q: 'How much does a course cost at MIT?',
      a: 'Course fees range from BDT 2,500 to 6,000 depending on the program. We also offer installment payment plans. Contact us for the latest pricing on specific courses.'
    },
    {
      q: 'Does MIT provide certificates?',
      a: 'Yes. All graduates receive a government-approved completion certificate from Markiety IT Institute, recognized by employers and agencies across Bangladesh.'
    },
    {
      q: 'Can I pay course fees in installments?',
      a: 'Yes, MIT offers installment payment plans. You can pay in 2-3 installments for most courses. Full payment is required before certificate issuance.'
    },
    {
      q: 'What is the refund policy?',
      a: 'Full refunds are available if you cancel at least 7 days before the course starts. 50% refund within 7 days. No refund after 2 sessions. See our Refund Policy page for full details.'
    },
    {
      q: 'Where is Markiety IT Institute located?',
      a: 'MIT is located at Nodi Bangla Manik Palace, 2nd Floor, 39 No Shop, Madhabdi, Narsingdi, Bangladesh. We offer both in-person and hybrid learning options.'
    },
    {
      q: 'How do I enroll in a course?',
      a: 'You can enroll online through our admission form at markietyitinstitute.netlify.app/admission.html, or visit our campus. Online admissions are processed via bKash, Nagad, Rocket, or bank transfer.'
    },
    {
      q: 'Does MIT help with job placement?',
      a: 'Yes. We provide career mentorship, freelance profile reviews, interview preparation, and connect students with job leads and client referrals through our alumni network.'
    }
  ];

  // ============================================================================
  // REVIEW DATA — For Review/Rating schemas (AI search engines love this)
  // ============================================================================
  const REVIEWS = [
    {
      author: 'Sadia Akter',
      rating: 5,
      reviewBody: 'MIT gave me the roadmap to master paid ads and scale campaigns. The mentors are genuinely invested in your success. Best investment I ever made for my career.',
      bestRating: 5,
     worstRating: 1,
      datePublished: '2025-11-15'
    },
    {
      author: 'Tanvir Hasan',
      rating: 5,
      reviewBody: 'The portfolio feedback sessions helped me land my first international clients on Fiverr within weeks. Everything is practical and hands-on. Highly recommend!',
      bestRating: 5,
      worstRating: 1,
      datePublished: '2025-12-02'
    },
    {
      author: 'Habib Rahman',
      rating: 5,
      reviewBody: 'I loved the supportive community. From instructors to peers, everyone shares opportunities to grow together. MIT is not just a course, it is a career launchpad.',
      bestRating: 5,
      worstRating: 1,
      datePublished: '2026-01-10'
    }
  ];

  // ============================================================================
  // INSTRUCTOR DATA — For Person schema
  // ============================================================================
  const INSTRUCTORS = [
    {
      name: 'Md. Tuhin Khandakar',
      alternateName: 'Abir',
      jobTitle: 'Founder & CEO',
      description: 'Digital Marketing Strategist, Entrepreneur & Mentor with years of agency experience leading Markiety.',
      image: 'https://markietyitinstitute.netlify.app/assets/instructors/TUHIN.jpeg',
      sameAs: [
        'https://facebook.com/markietyitinstitute',
        'https://linkedin.com/company/markietyitinstitute'
      ]
    },
    {
      name: 'Iqbal Hossain',
      jobTitle: 'Graphics Design Specialist',
      description: 'Master of visual storytelling, branding, and creative design systems.',
      image: 'https://markietyitinstitute.netlify.app/assets/instructors/IQBAL.jpeg',
      sameAs: []
    },
    {
      name: 'Md. Mahin',
      jobTitle: 'Video Editing Specialist',
      description: 'Creative editor specializing in cinematic production and social media content.',
      image: 'https://markietyitinstitute.netlify.app/assets/instructors/MAHIN.jpeg',
      sameAs: []
    }
  ];

  // ============================================================================
  // COURSE SCHEMAS — One per course for rich search results
  // ============================================================================
  const COURSE_SCHEMAS = [
    {
      name: 'Digital Marketing Course at MIT',
      description: 'Complete Digital Marketing training covering SEO, Social Media Marketing, Google Ads, Meta Ads, Email Marketing, and Analytics. Government-approved certificate included.',
      provider: 'Markiety IT Institute',
      url: 'https://markietyitinstitute.netlify.app/courses.html',
      price: '5500',
      currency: 'BDT',
      duration: '3 months',
      courseMode: 'Blended',
      workload: '48 hours',
      instructor: 'Md. Tuhin Khandakar',
      level: 'Beginner to Intermediate'
    },
    {
      name: 'Graphics Design Course at MIT',
      description: 'Professional Graphics Design training with Canva, Adobe Photoshop, and Illustrator. Learn branding, social media design, UI basics, and build a portfolio.',
      provider: 'Markiety IT Institute',
      url: 'https://markietyitinstitute.netlify.app/courses.html',
      price: '4500',
      currency: 'BDT',
      duration: '3 months',
      courseMode: 'Blended',
      workload: '48 hours',
      instructor: 'Iqbal Hossain',
      level: 'Beginner to Intermediate'
    },
    {
      name: 'Video Editing Course at MIT',
      description: 'Professional Video Editing with Adobe Premiere Pro and CapCut Pro. Learn cinematic editing, color grading, motion graphics, and social media content creation.',
      provider: 'Markiety IT Institute',
      url: 'https://markietyitinstitute.netlify.app/courses.html',
      price: '4500',
      currency: 'BDT',
      duration: '3 months',
      courseMode: 'Blended',
      workload: '48 hours',
      instructor: 'Md. Mahin',
      level: 'Beginner to Intermediate'
    },
    {
      name: 'Freelancing Course at MIT',
      description: 'Complete Freelancing mastery — set up Fiverr, Upwork profiles, write winning proposals, manage clients, and scale from beginner to top-rated seller.',
      provider: 'Markiety IT Institute',
      url: 'https://markietyitinstitute.netlify.app/courses.html',
      price: '6000',
      currency: 'BDT',
      duration: '3 months',
      courseMode: 'Blended',
      workload: '48 hours',
      instructor: 'Md. Tuhin Khandakar',
      level: 'Beginner'
    },
    {
      name: 'Basic Computer Course at MIT',
      description: 'Essential computer skills for beginners — MS Office, internet usage, file management, email, and digital literacy. Perfect starting point for tech careers.',
      provider: 'Markiety IT Institute',
      url: 'https://markietyitinstitute.netlify.app/courses.html',
      price: '2500',
      currency: 'BDT',
      duration: '2 months',
      courseMode: 'Blended',
      workload: '32 hours',
      instructor: 'MIT Faculty',
      level: 'Complete Beginner'
    }
  ];

  // ============================================================================
  // Meta Tags
  // ============================================================================
  function injectMetaTags() {
    const meta = {
      keywords: [...SEO_KEYWORDS.primary, ...SEO_KEYWORDS.secondary, ...SEO_KEYWORDS.location].join(', '),
      author: 'Markiety IT Institute',
      'geo.region': 'BD-13',
      'geo.placename': 'Madhabdi, Narsingdi',
      'geo.position': '24.1833;90.7833',
      'ICBM': '24.1833, 90.7833',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'robots': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      'googlebot': 'index, follow',
      'revisit-after': '7 days',
      'rating': 'general',
      'referrer': 'no-referrer-when-downgrade',
      'format-detection': 'telephone=no'
    };

    Object.entries(meta).forEach(([name, content]) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const el = document.createElement('meta');
        el.name = name;
        el.content = content;
        document.head.appendChild(el);
      }
    });
  }

  // ============================================================================
  // All Structured Data (JSON-LD)
  // ============================================================================
  function injectStructuredData() {
    const page = document.body.getAttribute('data-page') || 'index';
    const schemas = [];

    // 1. Organization Schema (always)
    schemas.push({
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "@id": "https://markietyitinstitute.netlify.app/#organization",
      "name": "Markiety IT Institute",
      "alternateName": ["MIT Madhabdi", "MIT"],
      "url": "https://markietyitinstitute.netlify.app/",
      "logo": "https://markietyitinstitute.netlify.app/assets/logo.jpg",
      "image": "https://markietyitinstitute.netlify.app/assets/og-image.png",
      "description": "Best IT Institute in Madhabdi, Narsingdi offering government-approved courses in Digital Marketing, Graphics Design, Video Editing, Freelancing, and Computer Training with 100% job placement support.",
      "foundingDate": "2025",
      "founder": {
        "@type": "Person",
        "name": "Md. Tuhin Khandakar",
        "jobTitle": "Founder & CEO",
        "image": "https://markietyitinstitute.netlify.app/assets/instructors/TUHIN.jpeg",
        "sameAs": ["https://facebook.com/markietyitinstitute", "https://linkedin.com/company/markietyitinstitute"]
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Nodi Bangla Manik Palace, 2nd Floor, 39 No Shop",
        "addressLocality": "Madhabdi",
        "addressRegion": "Narsingdi",
        "postalCode": "1604",
        "addressCountry": "BD"
      },
      "geo": { "@type": "GeoCoordinates", "latitude": "24.1833", "longitude": "90.7833" },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+880-1624-547667",
        "contactType": "customer service",
        "email": "markietyitinstitute@gmail.com",
        "availableLanguage": ["English", "Bengali"],
        "areaServed": "BD"
      },
      "sameAs": [
        "https://facebook.com/markietyitinstitute",
        "https://instagram.com/markietyitinstitute",
        "https://linkedin.com/company/markietyitinstitute"
      ],
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "350", "bestRating": "5", "worstRating": "1" },
      "numberOfEmployees": { "@type": "QuantitativeValue", "value": "15" },
      "slogan": "Learn. Build. Earn.",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "IT Training Courses",
        "numberOfItems": "5",
        "itemListElement": COURSE_SCHEMAS.map(c => ({
          "@type": "Offer",
          "itemOffered": { "@type": "Service", "name": c.name, "description": c.description }
        }))
      }
    });

    // 2. LocalBusiness Schema (always)
    schemas.push({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://markietyitinstitute.netlify.app/#localbusiness",
      "name": "Markiety IT Institute - Best IT Training Center in Madhabdi",
      "image": "https://markietyitinstitute.netlify.app/assets/logo.jpg",
      "priceRange": "BDT 2500 - 6000",
      "telephone": "+880-1624-547667",
      "email": "markietyitinstitute@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Nodi Bangla Manik Palace, 2nd Floor, 39 No Shop, Madhabdi",
        "addressLocality": "Narsingdi",
        "postalCode": "1604",
        "addressCountry": "BD"
      },
      "geo": { "@type": "GeoCoordinates", "latitude": "24.1833", "longitude": "90.7833" },
      "url": "https://markietyitinstitute.netlify.app/",
      "openingHoursSpecification": [
        { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], "opens": "09:00", "closes": "20:00" }
      ],
      "paymentAccepted": "Cash, bKash, Nagad, Rocket, Bank Transfer",
      "currenciesAccepted": "BDT"
    });

    // 3. Website Schema with SearchAction (always)
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://markietyitinstitute.netlify.app/#website",
      "url": "https://markietyitinstitute.netlify.app/",
      "name": "Markiety IT Institute - Best IT Training in Madhabdi",
      "description": "Top-rated IT institute in Madhabdi, Narsingdi offering government-approved courses",
      "publisher": { "@id": "https://markietyitinstitute.netlify.app/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://markietyitinstitute.netlify.app/courses.html?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "inLanguage": "en-BD"
    });

    // 4. FAQPage Schema (always — AI search engines LOVE this)
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": FAQ_DATA.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a,
          "author": { "@type": "Organization", "name": "Markiety IT Institute" }
        }
      }))
    });

    // 5. Aggregate Rating + Reviews (always for social proof)
    schemas.push({
      "@context": "https://schema.org",
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "350",
      "bestRating": "5",
      "worstRating": "1",
      "itemReviewed": {
        "@type": "EducationalOrganization",
        "name": "Markiety IT Institute",
        "url": "https://markietyitinstitute.netlify.app/"
      }
    });

    // Individual Reviews
    REVIEWS.forEach((r, i) => {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Review",
        "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": r.bestRating, "worstRating": r.worstRating },
        "author": { "@type": "Person", "name": r.author },
        "reviewBody": r.reviewBody,
        "itemReviewed": { "@type": "EducationalOrganization", "name": "Markiety IT Institute" },
        "datePublished": r.datePublished,
        "publisher": { "@type": "Organization", "name": "Markiety IT Institute" }
      });
    });

    // 6. Course Schemas (on courses and index pages)
    if (page === 'courses' || page === 'index') {
      COURSE_SCHEMAS.forEach(c => {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "Course",
          "name": c.name,
          "description": c.description,
          "provider": { "@type": "Organization", "name": c.provider, "url": c.url },
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": c.courseMode,
            "duration": c.duration,
            "inLanguage": "en-BD",
            "courseWorkload": c.workload,
            "location": { "@type": "Place", "name": "Markiety IT Institute, Madhabdi" },
            "instructor": { "@type": "Person", "name": c.instructor }
          },
          "offers": { "@type": "Offer", "price": c.price, "priceCurrency": c.currency, "availability": "https://schema.org/InStock", "validFrom": "2025-01-01" },
          "educationalLevel": c.level,
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50", "bestRating": "5" }
        });
      });
    }

    // 7. Person Schemas (on instructors page)
    if (page === 'instructors') {
      INSTRUCTORS.forEach(inst => {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "Person",
          "name": inst.name,
          "alternateName": inst.alternateName,
          "jobTitle": inst.jobTitle,
          "description": inst.description,
          "image": inst.image,
          "worksFor": { "@type": "Organization", "name": "Markiety IT Institute", "url": "https://markietyitinstitute.netlify.app/" },
          "sameAs": inst.sameAs.length ? inst.sameAs : undefined
        });
      });
    }

    // 8. Event Schema — upcoming cohort (on admission page)
    if (page === 'admission') {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Event",
        "name": "MIT Summer 2026 Cohort — Digital Marketing & Freelancing",
        "description": "Enrollment open for MIT's Summer 2026 cohort. Limited 30 seats. Learn Digital Marketing, Graphics Design, Video Editing, and Freelancing with government-approved certificates.",
        "startDate": "2026-06-01T09:00:00+06:00",
        "endDate": "2026-08-31T20:00:00+06:00",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": { "@type": "Place", "name": "Markiety IT Institute", "address": { "@type": "PostalAddress", "streetAddress": "Nodi Bangla Manik Palace, 2nd Floor, 39 No Shop, Madhabdi", "addressLocality": "Narsingdi", "addressCountry": "BD" } },
        "organizer": { "@type": "Organization", "name": "Markiety IT Institute", "url": "https://markietyitinstitute.netlify.app/" },
        "offers": { "@type": "Offer", "price": "5500", "priceCurrency": "BDT", "availability": "https://schema.org/InStock", "url": "https://markietyitinstitute.netlify.app/admission.html" }
      });
    }

    // 9. VideoObject (placeholder — add video URL when available)
    // schemas.push({ ... }); // commented out until video URL is available

    // 10. QAPage — How to start freelancing guide
    schemas.push({
      "@context": "https://schema.org",
      "@type": "QAPage",
      "mainEntity": {
        "@type": "Question",
        "name": "How to start freelancing with no experience in Bangladesh?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Start by enrolling in a structured IT training program like MIT. Learn a high-demand skill (Digital Marketing, Graphics Design, or Video Editing), build a portfolio with real projects, create professional profiles on Fiverr and Upwork, and apply consistently. MIT's Freelancing course specifically teaches this roadmap from zero to your first international client.",
          "author": { "@type": "Organization", "name": "Markiety IT Institute" }
        }
      }
    });

    // Inject all schemas
    schemas.forEach((schema, index) => {
      const scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.id = `seo-schema-${index}`;
      scriptTag.textContent = JSON.stringify(schema);
      document.head.appendChild(scriptTag);
    });
  }

  // ============================================================================
  // Dynamic Title & Description
  // ============================================================================
  function optimizePageTitles() {
    const page = document.body.getAttribute('data-page') || '';

    const titles = {
      'index': 'Best IT Institute in Madhabdi | Markiety IT Institute (MIT) — Top Computer Training Center Narsingdi',
      'courses': 'IT Courses in Madhabdi 2026 | Digital Marketing, Graphics Design, Video Editing — MIT',
      'about': 'About MIT — Leading IT Training Institute in Madhabdi, Narsingdi | Markiety',
      'admission': 'Admission Open 2026 | Best IT Institute Madhabdi — Enroll Now at MIT',
      'contact': 'Contact MIT — Best IT Training Center in Madhabdi, Narsingdi',
      'instructors': 'Expert Instructors at MIT — Learn from Industry Professionals | Markiety IT Institute',
      'terms': 'Terms and Conditions — Markiety IT Institute (MIT)',
      'privacy': 'Privacy Policy — Markiety IT Institute (MIT)',
      'refund': 'Refund Policy — Markiety IT Institute (MIT)'
    };

    const descriptions = {
      'index': 'Markiety IT Institute (MIT) is the #1 IT training center in Madhabdi, Narsingdi. Government-approved courses in Digital Marketing, Graphics Design, Video Editing & Freelancing. 1200+ graduates. Expert mentors. Limited seats open!',
      'courses': 'Explore top IT courses at MIT Madhabdi: Digital Marketing (BDT 5,500), Graphics Design (BDT 4,500), Video Editing (BDT 4,500), Freelancing (BDT 6,000), Basic Computer (BDT 2,500). Government-approved certificates, expert instructors, installment plans available.',
      'about': 'Learn about MIT — Madhabdi\'s premier IT institute. Founded 2025 by Md. Tuhin Khandakar. Government-approved, expert instructors, modern facilities, 1200+ successful graduates earning globally.',
      'admission': 'Admission open at Markiety IT Institute! Enroll in Digital Marketing, Graphics Design, Video Editing, or Freelancing courses. Govt-approved certificates. bKash/Nagad payment. Limited seats!',
      'contact': 'Contact Markiety IT Institute in Madhabdi. Visit us at Nodi Bangla Manik Palace, Madhabdi, Narsingdi. Call +880 1624-547667 or email markietyitinstitute@gmail.com.',
      'instructors': 'Meet MIT\'s expert instructors — Digital Marketing strategists, Graphics Design specialists, and Video Editing professionals with real agency experience.',
      'terms': 'Terms and Conditions for Markiety IT Institute (MIT). Read our policies on enrollment, fees, refunds, conduct, and student responsibilities.',
      'privacy': 'Privacy Policy for Markiety IT Institute (MIT). Learn how we collect, use, and protect your personal data when you enroll or browse our site.',
      'refund': 'MIT\'s Refund Policy — fair, transparent, and student-friendly. 100% refund before start, 50% within 7 days, full details inside.'
    };

    if (titles[page]) document.title = titles[page];

    let metaDesc = document.querySelector('meta[name="description"]');
    if (descriptions[page] && metaDesc) {
      metaDesc.content = descriptions[page];
    }
  }

  // ============================================================================
  // Open Graph Enhancement
  // ============================================================================
  function enhanceOpenGraphTags() {
    const page = document.body.getAttribute('data-page') || 'index';
    const ogTags = {
      'og:type': 'website',
      'og:site_name': 'Markiety IT Institute - Best IT Training in Madhabdi',
      'og:locale': 'en_BD',
      'og:locale:alternate': 'bn_BD',
      'twitter:card': 'summary_large_image',
      'twitter:site': '@markietyit',
      'twitter:creator': '@markietyit'
    };

    Object.entries(ogTags).forEach(([prop, content]) => {
      const sel = prop.startsWith('twitter:') ? `meta[name="${prop}"]` : `meta[property="${prop}"]`;
      if (!document.querySelector(sel)) {
        const el = document.createElement('meta');
        if (prop.startsWith('twitter:')) { el.name = prop; } else { el.setAttribute('property', prop); }
        el.content = content;
        document.head.appendChild(el);
      }
    });
  }

  // ============================================================================
  // Canonical + Hreflang
  // ============================================================================
  function ensureCanonicalURL() {
    const baseURL = 'https://markietyitinstitute.netlify.app';
    const path = window.location.pathname;
    const canonicalURL = baseURL + path;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalURL;
  }

  function addAlternateLanguageLinks() {
    const baseURL = 'https://markietyitinstitute.netlify.app';
    const path = window.location.pathname;
    const href = baseURL + path;

    ['en-BD', 'en', 'x-default'].forEach(hl => {
      if (!document.querySelector(`link[hreflang="${hl}"]`)) {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = hl;
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }

  // ============================================================================
  // Performance Tags
  // ============================================================================
  function addPerformanceTags() {
    const domains = {
      'dns-prefetch': ['https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
      'preconnect': ['https://hurtjslsvwcrfngcnlcs.supabase.co']
    };

    Object.entries(domains).forEach(([rel, urls]) => {
      urls.forEach(url => {
        const sel = rel === 'preconnect' ? `link[href="${url}"]` : `link[rel="${rel}"][href="${url}"]`;
        if (!document.querySelector(sel)) {
          const link = document.createElement('link');
          link.rel = rel;
          link.href = url;
          if (rel === 'preconnect') link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        }
      });
    });

    // RSS placeholder
    if (!document.querySelector('link[type="application/rss+xml"]')) {
      const rss = document.createElement('link');
      rss.rel = 'alternate';
      rss.type = 'application/rss+xml';
      rss.title = 'MIT Blog Feed';
      rss.href = 'https://markietyitinstitute.netlify.app/blog.xml';
      document.head.appendChild(rss);
    }
  }

  // ============================================================================
  // Init
  // ============================================================================
  function initSEO() {
    try {
      injectMetaTags();
      injectStructuredData();
      optimizePageTitles();
      enhanceOpenGraphTags();
      ensureCanonicalURL();
      addAlternateLanguageLinks();
      addPerformanceTags();
    } catch (err) {
      console.error('SEO Error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSEO);
  } else {
    initSEO();
  }

  window.SEO = { refresh: initSEO, keywords: SEO_KEYWORDS };
})();