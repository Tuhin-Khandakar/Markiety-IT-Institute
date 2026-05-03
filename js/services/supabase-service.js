/**
 * ============================================================================
 * SUPABASE SERVICE - THE UNIFIED BACKEND
 * ============================================================================
 * Handles all database interactions, caching, and real-time updates.
 * Replaces all previous supabase-*.js files.
 */

const SUPABASE_CONFIG = {
    url: 'https://hurtjslsvwcrfngcnlcs.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cnRqc2xzdndjcmZuZ2NubGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzIxMzUsImV4cCI6MjA3OTIwODEzNX0.xljAMoobX8syAqas61RT3wLke3qMtEd2utgNFfC1-gc',
};

class SupabaseService {
    constructor() {
        this.client = null;
        this.initialized = false;
        this.subscriptions = {};
        this.cache = {
            messages: 'mit_contact_messages',
            instructors: 'mit_instructors',
            students: 'mit_students',
            courses: 'mit_courses',
            certificates: 'mit_certificates',
            expenses: 'mit_expenses_base',
            admin: 'mit_admin_users'
        };
    }

    init() {
        if (this.initialized) return true;

        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase library not loaded.');
            return false;
        }

        try {
            this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            this.initialized = true;
            console.log('🚀 Supabase Service Initialized');

            // Start real-time listeners
            this.subscribeToAll();
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error);
            return false;
        }
    }

    // ========================================================================
    // GENERIC HELPERS
    // ========================================================================

    /**
     * Fetch data with "Stale-While-Revalidate" strategy
     * 1. Return cached data immediately (if available)
     * 2. Fetch fresh data from DB
     * 3. Update cache and notify callback if data changed
     */
    async fetchWithCache(table, cacheKey, callback) {
        // 1. Load from cache
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (callback) callback(data, true); // true = from cache
            } catch (e) {
                console.warn('Cache parse error', e);
            }
        }

        if (!this.initialized) this.init();
        if (!this.initialized) return null;

        // 2. Fetch from DB
        const { data, error } = await this.client
            .from(table)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Error fetching ${table}:`, error);
            if (window.toast) toast.error(`Failed to sync ${table}`);
            return null;
        }

        // 3. Update cache
        if (data) {
            const currentCache = localStorage.getItem(cacheKey);
            const isDifferent = currentCache !== JSON.stringify(data);

            if (isDifferent) {
                localStorage.setItem(cacheKey, JSON.stringify(data));
                if (callback) callback(data, false); // false = fresh from DB
                console.log(`🔄 Updated ${table} from cloud`);
            }
            return data;
        }
        return null;
    }

    // ========================================================================
    // STUDENTS API
    // ========================================================================

    async getStudents(callback) {
        return this.fetchWithCache('students', this.cache.students, (data, isCache) => {
            const mapped = data.map(this.mapStudentFromDB.bind(this));
            localStorage.setItem(this.cache.students, JSON.stringify(mapped));
            if (callback) callback(mapped, isCache);
            return mapped;
        });
    }

    async saveStudent(studentData) {
        if (!this.initialized) return { error: 'Offline' };

        // Map camelCase to snake_case
        const dbData = this.mapStudentToDB(studentData);

        // Check if update or insert
        // Improved logic: Check if it's an actual UUID (36 characters with hyphens)
        if (studentData.id && typeof studentData.id === 'string' && studentData.id.length === 36 && studentData.id.includes('-')) {
            // It's definitely a UUID from Supabase, so update
            const { data, error } = await this.client
                .from('students')
                .update(dbData)
                .eq('id', studentData.id)
                .select()
                .single();
            return { data: data ? this.mapStudentFromDB(data) : null, error };
        } else {
            // Insert
            // Remove ID if it exists so DB generates UUID
            // But we want to keep 'tracking_no'
            delete dbData.id;

            const { data, error } = await this.client
                .from('students')
                .insert([dbData])
                .select()
                .single();
            return { data: data ? this.mapStudentFromDB(data) : null, error };
        }
    }

    async deleteStudent(id) {
        if (!this.initialized) return { error: 'Offline' };
        return await this.client.from('students').delete().eq('id', id);
    }

    // ========================================================================
    // AUTHENTICATION API
    // ========================================================================

    async adminLogin(email, password) {
        if (!this.initialized) return { error: 'Offline' };

        const { data, error } = await this.client
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .eq('password', password) // Note: Ideally hashed, but following current pattern
            .single();

        if (error || !data) {
            return { error: 'Invalid credentials or access denied.' };
        }

        return { data };
    }

    async updateAdminCredentials(currentEmail, newEmail, newPassword) {
        if (!this.initialized) return { error: 'Offline' };

        const { data, error } = await this.client
            .from('admin_users')
            .update({ email: newEmail, password: newPassword })
            .eq('email', currentEmail)
            .select()
            .single();

        return { data, error };
    }

    async studentLogin(phone, pin) {
        if (!this.initialized) return { error: 'Offline' };

        const { data, error } = await this.client
            .from('students')
            .select('*')
            .eq('portal_phone', phone)
            .eq('portal_pin', pin)
            .single();

        if (error || !data) {
            return { error: 'Invalid Phone or PIN.' };
        }

        return { data: this.mapStudentFromDB(data) };
    }

    // ========================================================================
    // COURSES API
    // ========================================================================

    async getCourses(callback) {
        if (!this.initialized) this.init();
        if (!this.initialized) return [];

        // Courses usually don't change often, but we check anyway
        const { data, error } = await this.client
            .from('courses')
            .select('*')
            .order('id', { ascending: true });

        if (!error && data) {
            // Map to app format
            const mapped = data.map(c => ({
                id: c.id,
                title: c.title,
                instructor: c.instructor,
                instructorPhoto: c.instructor_photo,
                image: c.image_url,
                duration: c.duration,
                fee: c.fee ? String(c.fee) : '',
                discount: c.discount ? String(c.discount) : '',
                certificate: c.certificate,
                description: c.description || '',
                topics: Array.isArray(c.topics) ? c.topics : [],
                outcomes: Array.isArray(c.outcomes) ? c.outcomes : [],
                featured: Boolean(c.featured),
                discountSeatsLimit: c.discount_seats_total || 0,
                discountSeatsLeft: (c.discount_seats_total || 0) - (c.discount_seats_claimed || 0)
            }));

            localStorage.setItem(this.cache.courses, JSON.stringify(mapped));
            if (callback) callback(mapped);
            return mapped;
        }
        return [];
    }

    async uploadImage(file, bucket = 'course-images') {
        if (!this.initialized) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await this.client.storage
            .from(bucket)
            .upload(filePath, file);

        if (error) {
            console.error('Upload error:', error);
            if (window.toast) toast.error(`Upload failed: ${error.message}`);
            return null;
        }

        const { data: { publicUrl } } = this.client.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    }

    async saveCourse(courseData) {
        if (!this.initialized) return { error: 'Offline' };

        // Parse fee/discount as numbers for DB storage
        const parseFee = (v) => {
            if (!v) return null;
            const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
            return isNaN(n) ? null : n;
        };

        const dbData = {
            title: courseData.title,
            instructor: courseData.instructor,
            instructor_photo: courseData.instructorPhoto || null,
            image_url: courseData.image || null,
            duration: courseData.duration,
            fee: parseFee(courseData.fee),
            discount: parseFee(courseData.discount),
            certificate: courseData.certificate || null,
            description: courseData.description || null,
            topics: Array.isArray(courseData.topics) ? courseData.topics : [],
            outcomes: Array.isArray(courseData.outcomes) ? courseData.outcomes : [],
            featured: Boolean(courseData.featured),
            discount_seats_total: courseData.discountSeatsLimit || null,
            discount_seats_claimed: (courseData.discountSeatsLimit || 0) - (courseData.discountSeatsLeft || 0)
        };

        // Update if it's a real DB id (number or UUID not starting with 'course-')
        const isExisting = courseData.id && !String(courseData.id).startsWith('course-');
        if (isExisting) {
            const { data, error } = await this.client
                .from('courses')
                .update(dbData)
                .eq('id', courseData.id)
                .select()
                .single();
            return { data, error };
        } else {
            // Insert - let DB generate ID
            const { data, error } = await this.client
                .from('courses')
                .insert([dbData])
                .select()
                .single();
            return { data, error };
        }
    }

    async deleteCourse(id) {
        if (!this.initialized) return { error: 'Offline' };
        return await this.client.from('courses').delete().eq('id', id);
    }

    // ========================================================================
    // INSTRUCTORS API
    // ========================================================================

    async getInstructors(callback) {
        return this.fetchWithCache('instructors', this.cache.instructors, callback);
    }

    async saveInstructor(data) {
        if (!this.initialized) return { error: 'Offline' };

        // Extract id separately so we don't try to update the PK column
        const { id, ...fields } = data;

        if (id) {
            return await this.client
                .from('instructors')
                .update(fields)
                .eq('id', id)
                .select();
        } else {
            return await this.client
                .from('instructors')
                .insert([fields])
                .select();
        }
    }

    async deleteInstructor(id) {
        if (!this.initialized) return { error: 'Offline' };
        return await this.client.from('instructors').delete().eq('id', id);
    }

    // ========================================================================
    // CERTIFICATES API
    // ========================================================================

    async getCertificates(callback) {
        return this.fetchWithCache('certificates', 'mit_certificates', callback);
    }

    async saveCertificate(data) {
        if (!this.initialized) return { error: 'Offline' };
        const dbData = {
            student_id: data.studentId,
            file_name: data.fileName,
            file_url: data.fileUrl || data.data,
            created_at: data.createdAt || new Date().toISOString()
        };
        return await this.client.from('certificates').insert([dbData]).select();
    }

    async deleteCertificate(id) {
        if (!this.initialized) return { error: 'Offline' };
        return await this.client.from('certificates').delete().eq('id', id);
    }

    // ========================================================================
    // EXPENSES API
    // ========================================================================

    async getExpenses(callback) {
        return this.fetchWithCache('expenses', 'mit_expenses_base', callback);
    }

    async saveExpense(amount, note) {
        if (!this.initialized) return { error: 'Offline' };
        return await this.client.from('expenses').insert([{
            amount: parseFloat(amount),
            note: note,
            created_at: new Date().toISOString()
        }]).select();
    }

    // ========================================================================
    // CONTACT MESSAGES API
    // ========================================================================

    async saveContactMessage(data) {
        if (!this.initialized) return { error: 'Offline' };
        const { data: result, error } = await this.client
            .from('contact_messages')
            .insert([{ 
                name: data.name, 
                email: data.email, 
                message: data.message,
                created_at: new Date().toISOString()
            }]);
        return { data: result, error };
    }

    async getContactMessages(callback) {
        return this.fetchWithCache('contact_messages', this.cache.messages, callback);
    }

    // ========================================================================
    // REALTIME SUBSCRIPTIONS
    // ========================================================================

    subscribeToAll() {
        if (this.subscriptions.all) return;

        this.subscriptions.all = this.client
            .channel('public-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                console.log('🔔 Realtime Change:', payload);
                const table = payload.table;

                // Refresh specific data based on table
                if (table === 'students') this.getStudents(() => {
                    if (window.renderStudentsTable) window.renderStudentsTable();
                });
                if (table === 'courses') this.getCourses(() => {
                    if (window.renderCoursesPage) window.renderCoursesPage();
                });
                if (table === 'contact_messages') this.getContactMessages(() => {
                    if (window.renderMessagesTable) window.renderMessagesTable();
                });

                if (window.toast) toast.info(`Update received: ${table}`);
            })
            .subscribe();
    }

    // ========================================================================
    // MAPPERS
    // ========================================================================

    mapStudentToDB(s) {
        return {
            tracking_no: s.trackingNo || s.id,
            student_name_en: s.studentNameEn || s.fullName,
            student_name_bn: s.studentNameBn,
            father_name_en: s.fatherNameEn,
            father_name_bn: s.fatherNameBn,
            mother_name_en: s.motherNameEn,
            mother_name_bn: s.motherNameBn,
            date_of_birth: s.dob,
            email: s.email,
            student_phone: s.studentPhone || s.phone,
            parent_phone: s.parentPhone,
            nid_number: s.nid,
            permanent_address: s.permanentAddress,
            present_address: s.presentAddress,
            course_id: parseInt(s.courseId) || null,
            course_title: s.courseTitle || s.course,
            course_instructor: s.courseInstructor || s.instructor,
            payment_method: s.payment,
            payment_amount: parseFloat(s.coursePayable || s.courseFee || 0),
            transaction_id: s.paymentTxn,
            notes: s.notes,
            portal_phone: s.portalPhone || s.studentPhone,
            portal_pin: s.portalPin,
            unlocked_courses: s.unlockedCourses || [],
            // photo_url: s.photoUrl // Handle file upload separately
        };
    }

    mapStudentFromDB(s) {
        return {
            id: s.id, // UUID
            trackingNo: s.tracking_no,
            fullName: s.student_name_en,
            studentNameEn: s.student_name_en,
            studentNameBn: s.student_name_bn,
            fatherNameEn: s.father_name_en,
            fatherNameBn: s.father_name_bn,
            motherNameEn: s.mother_name_en,
            motherNameBn: s.mother_name_bn,
            dob: s.date_of_birth,
            email: s.email,
            studentPhone: s.student_phone,
            parentPhone: s.parent_phone,
            nid: s.nid_number,
            permanentAddress: s.permanent_address,
            presentAddress: s.present_address,
            courseId: s.course_id,
            courseTitle: s.course_title,
            courseInstructor: s.course_instructor,
            payment: s.payment_method,
            courseFee: s.payment_amount,
            paymentTxn: s.transaction_id,
            notes: s.notes,
            portalPhone: s.portal_phone,
            portalPin: s.portal_pin,
            unlockedCourses: s.unlocked_courses,
            createdAt: s.created_at,
            photo: s.photo_url // URL instead of Base64
        };
    }
}

// Initialize Global Instance
window.db = new SupabaseService();

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
    window.db.init();
});
