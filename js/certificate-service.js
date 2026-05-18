/**
 * Certificate Service - Generate and Manage Certificates
 * Creates unique certificates for students upon course completion
 */

const CertificateService = (() => {
    /**
     * Generate a unique certificate code
     * Format: CERT-YYYY-XXXXXX (year-random string)
     * @private
     */
    function generateCertificateCode() {
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `CERT-${year}-${random}`;
    }

    /**
     * Initialize certificate service
     */
    function init() {
        console.log('Certificate Service initialized');
        window.CertificateService = {
            generateCertificate,
            verifyCertificate,
            getStudentCertificates,
            downloadCertificate,
            viewCertificate
        };
    }

    /**
     * View a certificate by code
     * @param {string} certificateCode - Certificate code to view
     * @returns {Promise<void>}
     */
    async function viewCertificate(certificateCode) {
        if (!window.db || !window.db.initialized) {
            MITToast?.error('Database not available');
            return;
        }

        try {
            const { data: certificate, error } = await window.db.client
                .from('certificates')
                .select('*, students(*), courses(*)')
                .eq('certificate_code', certificateCode)
                .single();

            if (error || !certificate) {
                MITToast?.error('Certificate not found');
                return;
            }

            if (!certificate.is_valid) {
                MITToast?.warning('This certificate is no longer valid');
            }

            generateCertificateHTML(certificate.students, certificate.courses, certificate);
        } catch (error) {
            console.error('Error viewing certificate:', error);
            MITToast?.error('Failed to load certificate');
        }
    }

    /**
     * Generate a certificate for a student
     * @param {string} studentId - Student's UUID
     * @param {string} courseId - Course UUID
     * @returns {Promise<Object>}
     */
    async function generateCertificate(studentId, courseId) {
        if (!window.db || !window.db.initialized) {
            return { success: false, error: 'Database not initialized' };
        }

        try {
            // Get student details
            const { data: student, error: studentError } = await window.db.client
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (studentError || !student) {
                throw new Error('Student not found');
            }

            // Get course details
            const { data: course, error: courseError } = await window.db.client
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (courseError || !course) {
                throw new Error('Course not found');
            }

            // Verify payment is complete
            if (student.payment_status !== 'verified') {
                return {
                    success: false,
                    error: 'Payment not verified. Complete payment to receive certificate.'
                };
            }

            // Generate unique certificate code
            const certificateCode = generateCertificateCode();
            const baseUrl = window.location.origin;

            // Save to database
            const { data, error } = await window.db.client
                .from('certificates')
                .insert([{
                    student_id: studentId,
                    course_id: courseId,
                    certificate_code: certificateCode,
                    issue_date: new Date().toISOString(),
                    verification_link: `${baseUrl}/certificate.html?verify=${certificateCode}`,
                    is_valid: true
                }])
                .select()
                .single();

            if (error) throw error;

            // Generate and display the certificate
            generateCertificateHTML(student, course, data);

            return { success: true, data, message: 'Certificate generated successfully' };
        } catch (error) {
            console.error('Certificate generation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify a certificate by code
     * @param {string} certificateCode - Certificate code to verify
     * @returns {Promise<Object>}
     */
    async function verifyCertificate(certificateCode) {
        if (!window.db || !window.db.initialized) {
            return { valid: false, error: 'Database not initialized' };
        }

        try {
            const { data, error } = await window.db.client
                .from('certificates')
                .select('*, students(*), courses(*)')
                .eq('certificate_code', certificateCode)
                .single();

            if (error || !data) {
                return { valid: false, message: 'Certificate not found' };
            }

            return {
                valid: data.is_valid,
                data: {
                    code: data.certificate_code,
                    studentName: data.students?.student_name_en,
                    courseName: data.courses?.title,
                    issueDate: data.issue_date,
                    verificationLink: data.verification_link
                }
            };
        } catch (error) {
            console.error('Certificate verification error:', error);
            return { valid: false, error: error.message };
        }
    }

    /**
     * Get all certificates for a student
     * @param {string} studentId - Student's UUID
     * @returns {Promise<Array>}
     */
    async function getStudentCertificates(studentId) {
        if (!window.db || !window.db.initialized) {
            return [];
        }

        try {
            const { data, error } = await window.db.client
                .from('certificates')
                .select('*, courses(title, instructor)')
                .eq('student_id', studentId)
                .order('issue_date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching student certificates:', error);
            return [];
        }
    }

    /**
     * Generate and display certificate as printable HTML
     * @private
     */
    function generateCertificateHTML(student, course, certificate) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Certificate - ${certificate.certificate_code}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .certificate {
            background: white;
            padding: 60px 40px;
            border: 4px solid #667eea;
            border-radius: 16px;
            max-width: 800px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        .header {
            font-size: 42px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 8px;
            letter-spacing: 2px;
        }
        .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 40px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .intro {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
        }
        .student-name {
            font-size: 36px;
            font-weight: bold;
            color: #333;
            margin: 20px 0 30px;
            padding: 10px 0;
            border-bottom: 2px solid #667eea;
            display: inline-block;
        }
        .course-text {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
        }
        .course-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 40px;
        }
        .details {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .details p {
            margin: 8px 0;
            color: #666;
        }
        .code {
            font-family: monospace;
            font-size: 14px;
            color: #999;
            margin-top: 20px;
        }
        .verify-link {
            display: inline-block;
            margin-top: 10px;
            color: #667eea;
            text-decoration: none;
        }
        .signature {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #667eea;
        }
        .signature p {
            color: #666;
            font-size: 14px;
        }
        .actions {
            margin-top: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .btn-print {
            background: #667eea;
            color: white;
        }
        .btn-close {
            background: #e0e0e0;
            color: #666;
        }
        @media print {
            body { padding: 0; }
            .actions { display: none; }
            .certificate { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">CERTIFICATE</div>
        <div class="subtitle">of Completion</div>

        <div class="intro">This is to certify that</div>

        <div class="student-name">${student.student_name_en}</div>

        <div class="course-text">has successfully completed the course</div>

        <div class="course-name">${course.title}</div>

        <div class="details">
            <p><strong>Instructor:</strong> ${course.instructor || 'Markiety IT Institute'}</p>
            <p><strong>Issue Date:</strong> ${new Date(certificate.issue_date).toLocaleDateString('en-GB')}</p>
        </div>

        <div class="code">
            Certificate Code: ${certificate.certificate_code}
        </div>
        <a class="verify-link" href="${certificate.verification_link}">
            Verify Certificate
        </a>

        <div class="signature">
            <p>Markiety IT Institute</p>
            <p>Nodi Bangla Manik Palace, Madhabdi, Narsingdi</p>
        </div>

        <div class="actions">
            <button class="btn btn-print" onclick="window.print()">
                🖨️ Print Certificate
            </button>
            <button class="btn btn-close" onclick="window.close()">
                ✕ Close
            </button>
        </div>
    </div>
</body>
</html>`;

        // Open in new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    }

    /**
     * Download certificate as PDF (placeholder - uses print)
     * @param {string} certificateId - Certificate UUID
     */
    async function downloadCertificate(certificateId) {
        // For now, just trigger print dialog
        // In production, could use jsPDF or html2canvas
        window.print();
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        generateCertificate,
        verifyCertificate,
        getStudentCertificates,
        downloadCertificate
    };
})();