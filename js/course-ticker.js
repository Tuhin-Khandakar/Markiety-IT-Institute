/**
 * Course Ticker - Animated background marquee for Hero section
 * Fetches course names from Supabase and displays them in infinite scrolling rows
 */

(function() {
    'use strict';

    // Default fallback courses if Supabase fails
    const DEFAULT_COURSES = [
        'Digital Marketing',
        'Graphics Design',
        'Video Editing',
        'Basic Computer',
        'Freelancing'
    ];

    // State to hold courses
    let courses = [];
    let initialized = false;

    /**
     * Initialize the course ticker
     */
    async function initCourseTicker() {
        // Prevent multiple initialization
        if (initialized) return;
        initialized = true;

        // Wait for Supabase to be ready
        await waitForSupabase();

        // Fetch courses and render ticker
        await fetchCoursesAndRender();
    }

    /**
     * Wait for Supabase to be initialized
     */
    async function waitForSupabase() {
        const maxAttempts = 20;
        let attempts = 0;

        while (attempts < maxAttempts) {
            if (window.db && window.db.initialized) {
                return true;
            }
            await sleep(250);
            attempts++;
        }
        console.warn('Supabase not available, using default courses');
        return false;
    }

    /**
     * Sleep helper
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch courses from Supabase and render ticker
     */
    async function fetchCoursesAndRender() {
        try {
            // Use the centralized db service if available
            if (window.db && window.db.initialized) {
                const data = await window.db.getCourses();
                if (data && data.length > 0) {
                    courses = data.map(c => c.title);
                }
            } else if (window.db) {
                // Try initializing if not yet done
                await window.db.init();
                const data = await window.db.getCourses();
                if (data && data.length > 0) {
                    courses = data.map(c => c.title);
                }
            }

            // Fallback to cached data if Supabase fetch failed
            if (courses.length === 0) {
                const cached = localStorage.getItem('mit_courses');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    courses = parsed.map(c => c.title || c).filter(Boolean);
                }
            }

            // Final fallback to defaults
            if (courses.length === 0) {
                courses = DEFAULT_COURSES;
            }

            // Render the ticker
            renderCourseTicker();

        } catch (error) {
            console.error('Error in course ticker:', error);
            courses = DEFAULT_COURSES;
            renderCourseTicker();
        }
    }

    /**
     * Render the course ticker HTML
     */
    function renderCourseTicker() {
        const tickerContainer = document.getElementById('courseTickerContainer');
        if (!tickerContainer) return;

        // Create 3 rows with different speeds for parallax effect
        const rows = [
            { speed: 'slow', delay: '0s', offset: 0 },
            { speed: 'medium', delay: '-5s', offset: 1 },
            { speed: 'fast', delay: '-10s', offset: 2 }
        ];

        let html = '';

        const isBn = window.location.pathname.endsWith('-bn.html');
        const translateCourse = (title) => {
            if (!isBn) return title;
            const dict = {
                "Digital Marketing": "ডিজিটাল মার্কেটিং",
                "Graphics Design": "গ্রাফিক্স ডিজাইন",
                "Video Editing": "ভিডিও সম্পাদনা",
                "Basic Computer": "বেসিক কম্পিউটার কোর্স",
                "Freelancing": "ফ্রিল্যান্সিং এবং ক্যারিয়ার উন্নয়ন",
                "Freelancing & Career Development": "ফ্রিল্যান্সিং এবং ক্যারিয়ার উন্নয়ন"
            };
            return dict[title] || title;
        };

        rows.forEach((row, rowIndex) => {
            html += `<div class="course-ticker-row course-ticker-${row.speed}" style="animation-delay: ${row.delay};">`;

            // Create duplicated course list for seamless loop (2x)
            const rowCourses = getOffsetCourses(row.offset);

            // Add courses twice for seamless infinite scroll
            [...rowCourses, ...rowCourses].forEach(course => {
                html += `<span class="course-ticker-item">${translateCourse(course)}</span>`;
            });

            html += `</div>`;
        });

        tickerContainer.innerHTML = html;
        tickerContainer.classList.add('ticker-loaded');
    }

    /**
     * Get courses with offset for variety
     */
    function getOffsetCourses(offset) {
        const len = courses.length;
        if (len <= 1) return courses;

        // Rotate array based on offset
        const rotated = [];
        for (let i = 0; i < len; i++) {
            rotated.push(courses[(i + offset) % len]);
        }
        return rotated;
    }

    /**
     * Initialize when DOM is ready
     */
    function init() {
        // Only run on index/home page
        if (!document.querySelector('body[data-page="index"]')) return;

        initCourseTicker();

        // Pause animations when page is hidden to save resources
        document.addEventListener('visibilitychange', () => {
            const ticker = document.querySelector('.course-ticker');
            if (!ticker) return;

            if (document.hidden) {
                ticker.style.animationPlayState = 'paused';
            } else {
                ticker.style.animationPlayState = 'running';
            }
        });
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();