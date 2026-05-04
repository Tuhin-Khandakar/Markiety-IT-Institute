/**
 * Advanced SEO Enhancement Module
 * Optimizes for: "best IT institute Madhabdi", "IT training Narsingdi", etc.
 */

(function() {
  'use strict';

  // ============================================================================
  // SEO KEYWORDS - Update these for targeting
  // ============================================================================

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
      'job-ready skills training',
      'online offline IT courses'
    ],
    location: [
      'Madhabdi',
      'Narsingdi',
      'Dhaka Division',
      'Bangladesh'
    ]
  };

  // ============================================================================
  // Dynamic Meta Tag Injection
  // ============================================================================

  function injectMetaTags() {
    const meta = {
      // Keywords meta (still used by some engines)
      keywords: [...SEO_KEYWORDS.primary, ...SEO_KEYWORDS.secondary, ...SEO_KEYWORDS.location].join(', '),

      // Author
      author: 'Markiety IT Institute',

      // Geo tags
      'geo.region': 'BD-13',
      'geo.placename': 'Madhabdi, Narsingdi',
      'geo.position': '24.1833;90.7833',
      'ICBM': '24.1833, 90.7833',

      // Mobile web app
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',

      // Search engine directives
      'robots': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      'googlebot': 'index, follow',
      'bingbot': 'index, follow',

      // Language
      'language': 'English',
      'content-language': 'en-BD',

      // Rating
      'rating': 'general',
      'revisit-after': '7 days'
    };

    Object.entries(meta).forEach(([name, content]) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const metaTag = document.createElement('meta');
        metaTag.name = name;
        metaTag.content = content;
        document.head.appendChild(metaTag);
      }
    });
  }

  // ============================================================================
  // Enhanced Structured Data (JSON-LD)
  // ============================================================================

  function injectStructuredData() {
    // Main Organization Schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "@id": "https://markietyitinstitute.netlify.app/#organization",
      "name": "Markiety IT Institute",
      "alternateName": "MIT Madhabdi",
      "url": "https://markietyitinstitute.netlify.app/",
      "logo": "https://markietyitinstitute.netlify.app/assets/logo.jpg",
      "image": "https://markietyitinstitute.netlify.app/assets/og-image.png",
      "description": "Best IT Institute in Madhabdi, Narsingdi offering government-approved courses in Digital Marketing, Graphics Design, Video Editing, and Computer Training with 100% job placement support.",
      "foundingDate": "2025",
      "founder": {
        "@type": "Person",
        "name": "Md. Tuhin Khandakar",
        "jobTitle": "Founder & CEO"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Nodi Bangla Manik Palace, 2nd Floor, 39 No Shop",
        "addressLocality": "Madhabdi",
        "addressRegion": "Narsingdi",
        "postalCode": "1604",
        "addressCountry": "BD"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "24.1833",
        "longitude": "90.7833"
      },
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
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "350",
        "bestRating": "5",
        "worstRating": "1"
      },
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "value": "15"
      },
      "slogan": "Learn. Build. Earn.",
      "keywords": SEO_KEYWORDS.primary.join(', ')
    };

    // Local Business Schema
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://markietyitinstitute.netlify.app/#localbusiness",
      "name": "Markiety IT Institute - Best IT Training Center in Madhabdi",
      "image": "https://markietyitinstitute.netlify.app/assets/logo.jpg",
      "priceRange": "BDT 2500 - 6000",
      "telephone": "+880-1624-547667",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Nodi Bangla Manik Palace, 2nd Floor, 39 No Shop, Madhabdi",
        "addressLocality": "Narsingdi",
        "postalCode": "1604",
        "addressCountry": "BD"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "24.1833",
        "longitude": "90.7833"
      },
      "url": "https://markietyitinstitute.netlify.app/",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
          "opens": "09:00",
          "closes": "20:00"
        }
      ],
      "paymentAccepted": "Cash, bKash, Nagad",
      "currenciesAccepted": "BDT"
    };

    // Courses Offered Schema
    const coursesSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "IT Courses in Madhabdi",
      "description": "Government-approved IT training courses",
      "itemListElement": [
        {
          "@type": "Course",
          "name": "Digital Marketing Course",
          "description": "Complete Digital Marketing training with SEO, Social Media, Google Ads, Meta Ads",
          "provider": {
            "@type": "Organization",
            "name": "Markiety IT Institute",
            "sameAs": "https://markietyitinstitute.netlify.app/"
          },
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "Blended",
            "duration": "P3M",
            "inLanguage": "en-BD",
            "courseWorkload": "PT12H",
            "location": "Madhabdi, Narsingdi"
          },
          "offers": {
            "@type": "Offer",
            "price": "5500",
            "priceCurrency": "BDT",
            "availability": "https://schema.org/InStock"
          }
        },
        {
          "@type": "Course",
          "name": "Graphics Design Course",
          "description": "Professional Graphics Design training with Canva, Photoshop, Illustrator",
          "provider": {
            "@type": "Organization",
            "name": "Markiety IT Institute"
          },
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "Blended",
            "duration": "P3M"
          },
          "offers": {
            "@type": "Offer",
            "price": "4500",
            "priceCurrency": "BDT"
          }
        },
        {
          "@type": "Course",
          "name": "Video Editing Course",
          "description": "Professional Video Editing with Premiere Pro, CapCut Pro",
          "provider": {
            "@type": "Organization",
            "name": "Markiety IT Institute"
          },
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "Blended",
            "duration": "P3M"
          },
          "offers": {
            "@type": "Offer",
            "price": "4500",
            "priceCurrency": "BDT"
          }
        }
      ]
    };

    // Website Schema
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://markietyitinstitute.netlify.app/#website",
      "url": "https://markietyitinstitute.netlify.app/",
      "name": "Markiety IT Institute - Best IT Training in Madhabdi",
      "description": "Top-rated IT institute in Madhabdi, Narsingdi offering government-approved courses",
      "publisher": {
        "@id": "https://markietyitinstitute.netlify.app/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://markietyitinstitute.netlify.app/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "inLanguage": "en-BD"
    };

    // Breadcrumb Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://markietyitinstitute.netlify.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Courses",
          "item": "https://markietyitinstitute.netlify.app/courses.html"
        }
      ]
    };

    // Inject all schemas
    const schemas = [
      organizationSchema,
      localBusinessSchema,
      coursesSchema,
      websiteSchema,
      breadcrumbSchema
    ];

    schemas.forEach((schema, index) => {
      const scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.id = `schema-${index}`;
      scriptTag.textContent = JSON.stringify(schema);
      document.head.appendChild(scriptTag);
    });
  }

  // ============================================================================
  // Dynamic Title & Description Optimization
  // ============================================================================

  function optimizePageTitles() {
    const page = document.body.getAttribute('data-page') || '';

    const titleTemplates = {
      'index': 'Best IT Institute in Madhabdi | Markiety IT Institute - Top Computer Training Center Narsingdi',
      'courses': 'IT Courses in Madhabdi | Digital Marketing, Graphics Design, Video Editing - MIT',
      'about': 'About MIT - Leading IT Training Institute in Madhabdi, Narsingdi',
      'admission': 'Admission Open | Best IT Institute Madhabdi - Enroll Now at MIT',
      'contact': 'Contact MIT | Best IT Training Center in Madhabdi, Narsingdi',
      'instructors': 'Expert Instructors | Professional IT Training at MIT Madhabdi'
    };

    const descriptionTemplates = {
      'index': 'Markiety IT Institute (MIT) is the best IT training center in Madhabdi, Narsingdi. Offering government-approved courses in Digital Marketing, Graphics Design, Video Editing with 100% job placement. Enroll now!',
      'courses': 'Explore top IT courses at MIT Madhabdi: Digital Marketing, Graphics Design, Video Editing, Freelancing. Government-approved certificates, expert instructors, affordable fees.',
      'about': 'Learn about MIT - Madhabdi\'s premier IT institute. Government-approved, expert instructors, modern facilities, 1200+ successful graduates.',
      'admission': 'Admission open for Digital Marketing, Graphics Design, Video Editing courses. Limited seats! Best IT training in Madhabdi with govt-approved certificates.',
      'contact': 'Contact Markiety IT Institute in Madhabdi. Visit us at Nodi Bangla Manik Palace or call +880-1624-547667 for IT course inquiries.'
    };

    if (titleTemplates[page]) {
      document.title = titleTemplates[page];
    }

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (descriptionTemplates[page]) {
      if (metaDesc) {
        metaDesc.content = descriptionTemplates[page];
      } else {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = descriptionTemplates[page];
        document.head.appendChild(metaDesc);
      }
    }
  }

  // ============================================================================
  // Open Graph Tags Enhancement
  // ============================================================================

  function enhanceOpenGraphTags() {
    const ogTags = {
      'og:type': 'website',
      'og:site_name': 'Markiety IT Institute - Best IT Training in Madhabdi',
      'og:locale': 'en_BD',
      'og:locale:alternate': 'bn_BD',
      'twitter:card': 'summary_large_image',
      'twitter:site': '@markietyit',
      'twitter:creator': '@markietyit'
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      const selector = property.startsWith('twitter:')
        ? `meta[name="${property}"]`
        : `meta[property="${property}"]`;

      if (!document.querySelector(selector)) {
        const metaTag = document.createElement('meta');
        if (property.startsWith('twitter:')) {
          metaTag.name = property;
        } else {
          metaTag.setAttribute('property', property);
        }
        metaTag.content = content;
        document.head.appendChild(metaTag);
      }
    });
  }

  // ============================================================================
  // Canonical URL Management
  // ============================================================================

  function ensureCanonicalURL() {
    const currentPath = window.location.pathname;
    const baseURL = 'https://markietyitinstitute.netlify.app';
    const canonicalURL = baseURL + currentPath;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalURL;
  }

  // ============================================================================
  // Alternate Language Links
  // ============================================================================

  function addAlternateLanguageLinks() {
    const currentPath = window.location.pathname;
    const baseURL = 'https://markietyitinstitute.netlify.app';

    const alternates = [
      { hreflang: 'en-BD', href: baseURL + currentPath },
      { hreflang: 'en', href: baseURL + currentPath },
      { hreflang: 'x-default', href: baseURL + currentPath }
    ];

    alternates.forEach(alt => {
      if (!document.querySelector(`link[hreflang="${alt.hreflang}"]`)) {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = alt.hreflang;
        link.href = alt.href;
        document.head.appendChild(link);
      }
    });
  }

  // ============================================================================
  // Performance & SEO Tags
  // ============================================================================

  function addPerformanceTags() {
    // DNS prefetch for external resources
    const dnsPrefetch = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net'
    ];

    dnsPrefetch.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Preconnect for critical resources
    const preconnect = [
      'https://hurtjslsvwcrfngcnlcs.supabase.co'
    ];

    preconnect.forEach(domain => {
      if (!document.querySelector(`link[href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }

  // ============================================================================
  // Initialize All SEO Enhancements
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

      console.log('✅ SEO Enhancements Applied - Optimized for "best IT institute Madhabdi"');
    } catch (error) {
      console.error('SEO Enhancement Error:', error);
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSEO);
  } else {
    initSEO();
  }

  // Export for manual trigger
  window.SEO = {
    refresh: initSEO,
    keywords: SEO_KEYWORDS
  };

})();
