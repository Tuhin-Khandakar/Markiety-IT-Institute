/**
 * Banner Service - Supabase Banner Management
 * Handles promotional banner CRUD operations
 */

const BannerService = (() => {
    const BUCKET_NAME = 'banners';

    /**
     * Initialize banner service
     */
    function init() {
        console.log('Banner Service initialized');
        window.BannerService = {
            uploadBanner,
            getActiveBanner,
            getAllBanners,
            deactivateBanner,
            deleteBanner,
            displayActiveBanner
        };
    }

    /**
     * Upload a new banner image
     * @param {File} file - Image file
     * @param {Object} options - Banner options (link_url, display_duration)
     * @returns {Promise<Object>}
     */
    async function uploadBanner(file, options = {}) {
        if (!window.db || !window.db.initialized) {
            return { success: false, error: 'Database not initialized' };
        }

        try {
            // Upload image to Supabase Storage
            const { data: uploadData, error: uploadError } = await window.db.client.storage
                .from(BUCKET_NAME)
                .upload(`banner-${Date.now()}.${file.name.split('.').pop()}`, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = window.db.client.storage
                .from(BUCKET_NAME)
                .getPublicUrl(uploadData.path);

            // Save banner metadata to database
            const { data, error } = await window.db.client
                .from('banners')
                .insert([{
                    image_url: publicUrl,
                    link_url: options.link_url || null,
                    display_duration: options.display_duration || 6,
                    is_active: true,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data, message: 'Banner uploaded successfully' };
        } catch (error) {
            console.error('Banner upload error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get the currently active banner
     * @returns {Promise<Object>}
     */
    async function getActiveBanner() {
        if (!window.db || !window.db.initialized) {
            return null;
        }

        try {
            const { data, error } = await window.db.client
                .from('banners')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return data || null;
        } catch (error) {
            console.error('Error fetching active banner:', error);
            return null;
        }
    }

    /**
     * Get all banners (for admin management)
     * @returns {Promise<Array>}
     */
    async function getAllBanners() {
        if (!window.db || !window.db.initialized) {
            return [];
        }

        try {
            const { data, error } = await window.db.client
                .from('banners')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching banners:', error);
            return [];
        }
    }

    /**
     * Deactivate a banner (without deleting)
     * @param {string} bannerId - Banner UUID
     * @returns {Promise<Object>}
     */
    async function deactivateBanner(bannerId) {
        if (!window.db || !window.db.initialized) {
            return { success: false, error: 'Database not initialized' };
        }

        try {
            const { data, error } = await window.db.client
                .from('banners')
                .update({ is_active: false })
                .eq('id', bannerId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data, message: 'Banner deactivated' };
        } catch (error) {
            console.error('Error deactivating banner:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete a banner completely
     * @param {string} bannerId - Banner UUID
     * @returns {Promise<Object>}
     */
    async function deleteBanner(bannerId) {
        if (!window.db || !window.db.initialized) {
            return { success: false, error: 'Database not initialized' };
        }

        try {
            const { error } = await window.db.client
                .from('banners')
                .delete()
                .eq('id', bannerId);

            if (error) throw error;

            return { success: true, message: 'Banner deleted' };
        } catch (error) {
            console.error('Error deleting banner:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Display active banner as popup on the website
     * Call this on page load to show banners
     */
    async function displayActiveBanner() {
        const banner = await getActiveBanner();
        if (!banner) return;

        // Check if user already closed this banner (session storage)
        const closedBanners = JSON.parse(sessionStorage.getItem('closedBanners') || '[]');
        if (closedBanners.includes(banner.id)) return;

        // Create banner element
        const bannerEl = document.createElement('div');
        bannerEl.id = 'popup-banner';
        bannerEl.className = 'popup-banner';
        bannerEl.innerHTML = `
            <button class="close-btn" aria-label="Close">&times;</button>
            ${banner.link_url ? `<a href="${banner.link_url}" target="_blank">` : ''}
                <img src="${banner.image_url}" alt="Promotional Banner" />
            ${banner.link_url ? '</a>' : ''}
        `;

        document.body.appendChild(bannerEl);

        // Close button handler
        const closeBtn = bannerEl.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            bannerEl.remove();
            // Remember this banner was closed for this session
            closedBanners.push(banner.id);
            sessionStorage.setItem('closedBanners', JSON.stringify(closedBanners));
        });

        // Auto-close after duration
        setTimeout(() => {
            if (document.body.contains(bannerEl)) {
                bannerEl.remove();
            }
        }, banner.display_duration * 1000);
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        uploadBanner,
        getActiveBanner,
        getAllBanners,
        deactivateBanner,
        deleteBanner,
        displayActiveBanner
    };
})();