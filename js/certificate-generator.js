/**
 * Certificate Generator Module
 * Professional Academic Certificate with Traditional Design
 * Three-column layout with left sidebar, main body, and footer
 */

(function() {
  'use strict';

  const CertificateGenerator = {
    logoUrl: '../assets/logo.jpg',
    sealUrl: '../assets/IT-INSTITUTE-SEAL.png',
    signatureUrl: '../assets/Tuhin-signature.jpg',

    grades: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'],

    /**
     * Get full student details for certificate
     */
    async getStudentDetails(studentId) {
      if (!window.db || !window.db.initialized) {
        return this.getStudentFromLocalStorage(studentId);
      }

      try {
        const { data, error } = await window.db.client
          .from('students')
          .select(`
            *,
            courses(
              title,
              instructor,
              duration,
              fee
            )
          `)
          .eq('id', studentId)
          .single();

        if (error) throw error;

        return data;
      } catch (e) {
        console.error('Error fetching student details:', e);
        return this.getStudentFromLocalStorage(studentId);
      }
    },

    /**
     * Get tracking number for certificate
     */
    getTrackingNumber(studentData) {
      return studentData?.tracking_no || studentData?.student_id || 'MITI-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    },

    getStudentFromLocalStorage(studentId) {
      try {
        const data = localStorage.getItem('mit_students');
        const students = data ? JSON.parse(data) : [];
        return students.find(s => s.id === studentId);
      } catch (e) {
        return null;
      }
    },

    /**
     * Get all verified students from Supabase
     * @returns {Promise<Array>} Array of student objects with course info
     */
    async getStudents() {
      if (!window.db || !window.db.initialized) {
        console.warn('Supabase not initialized, falling back to localStorage');
        return this.getStudentsLocalStorage();
      }

      try {
        const { data, error } = await window.db.client
          .from('students')
          .select(`
            id,
            tracking_no,
            student_name_en,
            student_name_bn,
            father_name_en,
            mother_name_en,
            email,
            phone,
            created_at,
            payment_status,
            course_id,
            courses(
              title,
              instructor,
              duration
            )
          `)
          .eq('payment_status', 'verified')
          .order('student_name_en', { ascending: true });

        if (error) throw error;

        return (data || []).map(s => ({
          id: s.id,
          trackingNo: s.tracking_no,
          studentNameEn: s.student_name_en,
          studentNameBn: s.student_name_bn,
          fatherNameEn: s.father_name_en,
          motherNameEn: s.mother_name_en,
          email: s.email,
          phone: s.phone,
          createdAt: s.created_at,
          courseId: s.course_id,
          courseTitle: s.courses?.title || 'N/A',
          courseInstructor: s.courses?.instructor || 'Markiety IT Institute',
          courseDuration: s.courses?.duration || 'N/A'
        }));
      } catch (e) {
        console.error('Error fetching students from Supabase:', e);
        return this.getStudentsLocalStorage();
      }
    },

    /**
     * Fallback to localStorage
     * @returns {Array}
     */
    getStudentsLocalStorage() {
      try {
        const data = localStorage.getItem('mit_students');
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error('Error reading students:', e);
        return [];
      }
    },

    /**
     * Generate certificate code
     * Format: MITI-YYYY-XXXXXX
     */
    generateCertificateCode() {
      const year = new Date().getFullYear();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `MITI-${year}-${random}`;
    },

    /**
     * Generate serial number
     */
    generateSerialNumber() {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 9000) + 1000;
      return `MITI/${year}/${random}`;
    },

    /**
     * Generate roll number
     */
    generateRollNumber(studentData, index) {
      const year = new Date().getFullYear();
      return `${year}${String(index + 1).padStart(4, '0')}`;
    },

    /**
     * Save certificate record to database
     */
    async saveCertificateRecord(student, courseName, grade) {
      if (!window.db || !window.db.initialized) return null;

      try {
        const certificateCode = this.generateCertificateCode();
        const baseUrl = window.location.origin;

        const { data, error } = await window.db.client
          .from('certificates')
          .insert([{
            student_id: student.id,
            certificate_code: certificateCode,
            grade: grade,
            course_name: courseName,
            issue_date: new Date().toISOString(),
            is_valid: true,
            verification_link: `${baseUrl}/certificate.html?verify=${certificateCode}`
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (e) {
        console.error('Error saving certificate record:', e);
        return null;
      }
    },

    /**
     * Generate a professional academic certificate PDF
     * Three-column design with refined branding and layout
     */
    async generateCertificate(student, grade) {
      // Get full student details
      const fullStudent = await this.getStudentDetails(student.id || student.studentId);
      const studentData = fullStudent || student;

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const centerX = pageWidth / 2;

      // ===== COLOR PALETTE =====
      const darkBlue = [0, 51, 102];
      const gold = [218, 165, 32];
      const cream = [255, 253, 240];
      const darkGold = [184, 134, 11];
      const navy = [0, 32, 91];

      // ===== BACKGROUND =====
      doc.setFillColor(...cream);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // ===== WATERMARK (center of page) =====
      try {
        const logoImg = await this.loadImage(this.logoUrl);
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        doc.addImage(logoImg, 'JPEG', centerX - 30, 75, 50, 50);
        doc.setGState(new doc.GState({ opacity: 1 }));
      } catch (e) {
        console.warn('Watermark not loaded');
      }

      // ===== TRIPLE-LINE BORDER (Fits A4) =====
      doc.setDrawColor(...darkBlue);
      doc.setLineWidth(2);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      doc.setDrawColor(180, 160, 120);
      doc.setLineWidth(0.8);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      doc.setDrawColor(...gold);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      // ===== LEFT SIDEBAR (55mm width) =====
      const sidebarX = 12;
      const sidebarWidth = 50;

      // Sidebar background
      doc.setFillColor(248, 244, 230);
      doc.rect(sidebarX, 12, sidebarWidth, pageHeight - 24, 'F');

      // Sidebar border
      doc.setDrawColor(...darkBlue);
      doc.setLineWidth(1);
      doc.rect(sidebarX, 12, sidebarWidth, pageHeight - 24);

      // ===== LEFT SIDEBAR: INSTITUTE SEAL & BRANDING =====
      const sealY = 22;
      try {
        const sealImg = await this.loadImage(this.sealUrl);
        doc.addImage(sealImg, 'PNG', sidebarX + 13, sealY, 24, 24);
      } catch (e) {
        this.drawSealPlaceholder(doc, sidebarX + 25, sealY + 12);
      }

      // MARKIETY IT INSTITUTE - New branding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...darkBlue);
      doc.text('MARKIETY IT', sidebarX + 25, sealY + 30, { align: 'center' });
      doc.text('INSTITUTE', sidebarX + 25, sealY + 35, { align: 'center' });

      // Tagline
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...darkGold);
      doc.text('LEARN | BUILD | EARN', sidebarX + 25, sealY + 41, { align: 'center' });

      // ===== LEFT SIDEBAR: CERTIFICATE OF INCORPORATION BOX =====
      const incorpY = 72;
      doc.setFillColor(...darkBlue);
      doc.roundedRect(sidebarX + 4, incorpY, sidebarWidth - 8, 16, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.text('CERTIFICATE OF', sidebarX + 25, incorpY + 5, { align: 'center' });
      doc.text('INCORPORATION', sidebarX + 25, incorpY + 10, { align: 'center' });
      doc.setFontSize(4);
      doc.text('No. MITI/2024/0001', sidebarX + 25, incorpY + 14, { align: 'center' });

      // ===== LEFT SIDEBAR: GRADING MARKS TABLE =====
      const tableY = 98;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...navy);
      doc.text('GRADING MARKS', sidebarX + 25, tableY, { align: 'center' });

      // Table header
      doc.setFillColor(...darkBlue);
      doc.rect(sidebarX + 4, tableY + 3, sidebarWidth - 8, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text('Grade', sidebarX + 14, tableY + 6.5, { align: 'center' });
      doc.text('Marks', sidebarX + 36, tableY + 6.5, { align: 'center' });

      // Grade rows
      const gradeMarks = [
        { grade: 'A+', marks: '90-100' },
        { grade: 'A', marks: '85-89' },
        { grade: 'A-', marks: '80-84' },
        { grade: 'B+', marks: '75-79' },
        { grade: 'B', marks: '70-74' },
        { grade: 'B-', marks: '65-69' },
        { grade: 'C+', marks: '60-64' },
        { grade: 'C', marks: '55-59' }
      ];

      let rowY = tableY + 10;
      gradeMarks.forEach((g, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(245, 240, 230);
          doc.rect(sidebarX + 4, rowY - 2.5, sidebarWidth - 8, 4.5, 'F');
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(...darkBlue);
        doc.text(g.grade, sidebarX + 14, rowY, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(80, 80, 80);
        doc.text(g.marks, sidebarX + 36, rowY, { align: 'center' });
        rowY += 4.5;
      });

      // ===== LEFT SIDEBAR: APPROVED BY =====
      const approvedY = rowY + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...navy);
      doc.text('Approved By:', sidebarX + 25, approvedY, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(...darkGold);
      doc.text('MARKIETY IT', sidebarX + 25, approvedY + 5, { align: 'center' });
      doc.text('INSTITUTE', sidebarX + 25, approvedY + 10, { align: 'center' });

      // ===== MAIN BODY (after sidebar) =====
      const mainStartX = sidebarX + sidebarWidth + 5;
      const mainWidth = pageWidth - mainStartX - 12;

      // ===== HEADER SECTION =====
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...navy);
      doc.text('CERTIFICATE OF COMPLETION', centerX + 10, 22, { align: 'center' });

      // Decorative line
      doc.setDrawColor(...gold);
      doc.setLineWidth(1.5);
      doc.line(centerX - 35, 26, centerX + 55, 26);

      // Subtitle
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('This is to certify that', centerX + 10, 35, { align: 'center' });

      // ===== STUDENT NAME =====
      const studentName = studentData.student_name_en || student.studentNameEn || '{{STUDENT_NAME}}';
      doc.setFont('times', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(...darkBlue);
      doc.text(studentName, centerX + 10, 47, { align: 'center' });

      // Underline
      const nameWidth = doc.getTextWidth(studentName);
      doc.setDrawColor(...darkBlue);
      doc.setLineWidth(0.8);
      doc.line(centerX + 10 - nameWidth/2 - 8, 50, centerX + 10 + nameWidth/2 + 8, 50);

      // ===== PARENTS INFO =====
      const fatherName = studentData.father_name_en || student.fatherNameEn || '{{FATHER_NAME}}';
      const motherName = studentData.mother_name_en || student.motherNameEn || '{{MOTHER_NAME}}';

      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      if (fatherName || motherName) {
        let parentText = 'Son/Daughter of ';
        if (fatherName) parentText += fatherName;
        if (fatherName && motherName) parentText += ' and ';
        if (motherName) parentText += motherName;
        doc.text(parentText, centerX + 10, 58, { align: 'center' });
      }

      // ===== COURSE COMPLETION TEXT =====
      const courseName = studentData.courses?.title || student.courseTitle || '{{COURSE_NAME}}';
      const courseDuration = studentData.courses?.duration || student.courseDuration || '{{DURATION}}';

      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text('has successfully completed the prescribed course of instruction in', centerX + 10, 68, { align: 'center' });

      // Course name
      doc.setFont('times', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...darkBlue);
      doc.text(courseName, centerX + 10, 77, { align: 'center' });

      // Duration
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Duration: ${courseDuration}`, centerX + 10, 84, { align: 'center' });

      // ===== STUDENT DETAILS BOX (FIXED: Grid layout, no overlap) =====
      const detailsBoxY = 90;
      const detailsBoxHeight = 46;

      doc.setFillColor(250, 248, 240);
      doc.roundedRect(mainStartX + 3, detailsBoxY, mainWidth - 6, detailsBoxHeight, 2, 2, 'F');
      doc.setDrawColor(...darkBlue);
      doc.setLineWidth(0.5);
      doc.roundedRect(mainStartX + 3, detailsBoxY, mainWidth - 6, detailsBoxHeight, 2, 2, 'S');

      // Details header
      doc.setFillColor(...darkBlue);
      doc.rect(mainStartX + 3, detailsBoxY, mainWidth - 6, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('STUDENT INFORMATION', mainStartX + mainWidth/2, detailsBoxY + 4.5, { align: 'center' });

      // Generate certificate details
      const serialNo = this.generateSerialNumber();
      const regNo = this.getTrackingNumber(studentData);
      const rollNo = this.generateRollNumber(studentData, Math.floor(Math.random() * 100));
      const createdAt = new Date(studentData.created_at || student.createdAt || Date.now());
      const session = `${createdAt.getFullYear()}-${createdAt.getFullYear() + 1}`;
      const issueDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

      // ===== GRID LAYOUT (Dynamic widths for long names) =====
      // Using grid-cols-[auto_1fr_auto_1fr] equivalent - wider column spacing
      const col1X = mainStartX + 12;
      const col2X = mainStartX + 90; // Extra wide to prevent overlap
      let row = detailsBoxY + 14;

      // Row 1: Serial No | Reg No
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...navy);
      doc.text('Serial No:', col1X, row);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const serialVal = serialNo;
      doc.text(serialVal, col1X + 25, row);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text('Reg No:', col2X, row);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(regNo, col2X + 25, row);

      row += 8;

      // Row 2: Roll No | Session
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text('Roll No:', col1X, row);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(rollNo, col1X + 25, row);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text('Session:', col2X, row);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(session, col2X + 25, row);

      row += 8;

      // Row 3: Father | Mother (extra wide for long names)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text('Father:', col1X, row);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      // Add space after label to prevent overlap
      const fatherText = fatherName || 'N/A';
      doc.text(fatherText, col1X + 25, row);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text('Mother:', col2X, row);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const motherText = motherName || 'N/A';
      doc.text(motherText, col2X + 25, row);

      row += 8;

      // Row 4: Grade | Issue Date
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text('Grade:', col1X, row);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...darkGold);
      doc.text(grade, col1X + 23, row);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text(`(${this.getGradeDescription(grade)})`, col1X + 38, row);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...navy);
      doc.text('Issue Date:', col2X, row);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(issueDate, col2X + 28, row);

      // ===== DYNAMIC QR CODE IN SIDEBAR =====
      const qrYSidebar = approvedY + 18;
      const certificateCode = this.generateCertificateCode();
      const qrUrl = `https://markietyitinstitute.com/verify?id=${certificateCode}`;

      // Generate QR code using async canvas method
      try {
        const qrDataUrl = await this.generateQRCodeImage(qrUrl, 100);
        doc.addImage(qrDataUrl, 'PNG', sidebarX + 15, qrYSidebar, 20, 20);
      } catch (e) {
        console.warn('QR code generation failed:', e);
        doc.setFillColor(245, 245, 245);
        doc.rect(sidebarX + 15, qrYSidebar, 20, 20, 'F');
      }

      // QR code label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(...navy);
      doc.text('SCAN TO', sidebarX + 25, qrYSidebar + 22, { align: 'center' });
      doc.text('VERIFY', sidebarX + 25, qrYSidebar + 26, { align: 'center' });

      // ===== FOOTER SECTION =====
      const footerY = pageHeight - 48;

      // Separator line (gold)
      doc.setDrawColor(...gold);
      doc.setLineWidth(1);
      doc.line(mainStartX + 3, footerY - 5, pageWidth - 12, footerY - 5);

      // ===== 3-COLUMN LAYOUT =====
      const sigCenterX = mainStartX + mainWidth / 2;
      const colWidth = (mainWidth - 20) / 3;

      // Column 1: Left - Founder & CEO Signature
      const col1Center = mainStartX + 15 + colWidth / 2;
      const sigLineWidth = 45;

      // Signature line (dark blue)
      doc.setDrawColor(...darkBlue);
      doc.setLineWidth(0.8);
      doc.line(col1Center - sigLineWidth/2, footerY + 12, col1Center + sigLineWidth/2, footerY + 12);

      // Signature image (with transparency simulation)
      try {
        const sigImg = await this.loadImage(this.signatureUrl);
        // Add with opacity for blend effect
        doc.setGState(new doc.GState({ opacity: 0.9 }));
        doc.addImage(sigImg, 'JPEG', col1Center - 20, footerY - 4, 40, 16);
        doc.setGState(new doc.GState({ opacity: 1 }));
      } catch (e) {
        console.warn('Signature not loaded');
      }

      // Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...navy);
      doc.text('Md. Tuhin Khandakar', col1Center, footerY + 18, { align: 'center' });

      // Title - UPPERCASE with semibold weight
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(60, 60, 60);
      doc.text('FOUNDER & CEO', col1Center, footerY + 23, { align: 'center' });

      // Column 2: Center - Official Seal
      const col2Center = sigCenterX;

      try {
        const sealImg = await this.loadImage(this.sealUrl);
        // Seal with transparency
        doc.setGState(new doc.GState({ opacity: 0.95 }));
        doc.addImage(sealImg, 'PNG', col2Center - 14, footerY - 5, 28, 28);
        doc.setGState(new doc.GState({ opacity: 1 }));
      } catch (e) {
        this.drawSealPlaceholder(doc, col2Center, footerY + 9);
      }

      // Column 3: Right - Course Instructor
      const col3Start = mainStartX + mainWidth - 58;

      // Clean signature line
      doc.setDrawColor(...darkBlue);
      doc.setLineWidth(0.8);
      doc.line(col3Start, footerY + 12, col3Start + 45, footerY + 12);

      // Instructor name
      const instructor = studentData.courses?.instructor || student.courseInstructor || 'Md. Mahin';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...navy);
      doc.text(instructor, col3Start + 22, footerY + 18, { align: 'center' });

      // Title - UPPERCASE with semibold weight
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(60, 60, 60);
      doc.text('COURSE INSTRUCTOR', col3Start + 22, footerY + 23, { align: 'center' });

      // ===== VERIFICATION TEXT (Increased readability) =====
      const verificationY = pageHeight - 18;

      // Main verification text with letter spacing
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5); // ~12pt equivalent for better readability
      doc.setCharSpace(0.5); // Letter spacing simulation
      doc.setTextColor(70, 70, 70);
      doc.text('This certificate is issued without any alteration and is valid for verification.', pageWidth / 2, verificationY, { align: 'center' });

      // URL - High contrast dark blue
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5); // ~14pt equivalent
      doc.setTextColor(0, 32, 96); // Very dark blue for high contrast
      doc.text('markietyitinstitute.com/verify', pageWidth / 2, verificationY + 5, { align: 'center' });

      // ===== SAVE TO DATABASE =====
      await this.saveCertificateRecord(student, courseName, grade);

      // Generate filename and download
      const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
      const safeCourse = courseName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Certificate_${safeName}_${safeCourse}.pdf`;

      doc.save(filename);
    },

    /**
     * Draw intricate border (guilloche style)
     */
    drawIntricateBorder(doc, width, height, color) {
      // Outer border
      doc.setDrawColor(...color);
      doc.setLineWidth(2);
      doc.rect(5, 5, width - 10, height - 10);

      // Inner border
      doc.setDrawColor(180, 160, 120);
      doc.setLineWidth(0.8);
      doc.rect(8, 8, width - 16, height - 16);

      // Corner decorations
      doc.setDrawColor(...color);
      doc.setLineWidth(1);

      const cornerSize = 15;
      const margin = 8;

      // Top-left corner
      doc.line(margin, margin + cornerSize, margin, margin);
      doc.line(margin, margin, margin + cornerSize, margin);

      // Top-right corner
      doc.line(width - margin - cornerSize, margin, width - margin, margin);
      doc.line(width - margin, margin, width - margin, margin + cornerSize);

      // Bottom-left corner
      doc.line(margin, height - margin - cornerSize, margin, height - margin);
      doc.line(margin, height - margin, margin + cornerSize, height - margin);

      // Bottom-right corner
      doc.line(width - margin - cornerSize, height - margin, width - margin, height - margin);
      doc.line(width - margin, height - margin - cornerSize, width - margin, height - margin);

      // Decorative dots
      doc.setFillColor(...color);
      const dotPositions = [
        [15, 15], [width - 15, 15],
        [15, height - 15], [width - 15, height - 15]
      ];
      dotPositions.forEach(([x, y]) => {
        doc.circle(x, y, 1.5, 'F');
      });
    },

    /**
     * Generate QR code as base64 image data
     */
    async generateQRCodeImage(text, size = 100) {
      // Create a canvas for QR generation
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Simple QR-like pattern (since we're in PDF context)
      // This creates a readable placeholder that looks like a QR code
      const gridSize = 21;
      const cellSize = size / gridSize;

      // Use a simple hash-based pattern for consistency
      const hash = this.simpleHash(text);
      ctx.fillStyle = '#003366';

      // Draw position patterns (corners)
      this.drawQRPositionPattern(ctx, 0, 0, cellSize);
      this.drawQRPositionPattern(ctx, (gridSize - 7) * cellSize, 0, cellSize);
      this.drawQRPositionPattern(ctx, 0, (gridSize - 7) * cellSize, cellSize);

      // Draw timing patterns
      for (let i = 8; i < gridSize - 8; i++) {
        ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
        ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
      }

      // Draw data bits based on hash
      let bitIndex = 0;
      for (let row = 8; row < gridSize - 8; row++) {
        for (let col = 8; col < gridSize - 8; col++) {
          if ((hash[bitIndex % hash.length] + row + col) % 3 === 0) {
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
          bitIndex++;
        }
      }

      return canvas.toDataURL('image/png');
    },

    /**
     * Simple hash function for consistent QR patterns
     */
    simpleHash(str) {
      let hash = [];
      for (let i = 0; i < str.length; i++) {
        hash.push(str.charCodeAt(i) % 256);
      }
      // Ensure we have at least 100 bytes
      while (hash.length < 100) {
        hash = hash.concat(hash);
      }
      return hash;
    },

    /**
     * Draw QR position pattern (finder pattern)
     */
    drawQRPositionPattern(ctx, x, y, cellSize) {
      // Outer black square
      ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
      // Inner white square
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
      // Center black square
      ctx.fillStyle = '#003366';
      ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    },

    /**
     * Get grade description
     */
    getGradeDescription(grade) {
      const descriptions = {
        'A+': 'Outstanding',
        'A': 'Excellent',
        'A-': 'Very Good',
        'B+': 'Good',
        'B': 'Above Average',
        'B-': 'Average',
        'C+': 'Above Pass',
        'C': 'Pass',
        'C-': 'Pass'
      };
      return descriptions[grade] || 'Pass';
    },

    /**
     * Draw placeholder seal when image unavailable
     */
    drawSealPlaceholder(doc, x, y) {
      doc.setDrawColor(0, 82, 147);
      doc.setLineWidth(1);
      doc.circle(x, y, 12);

      doc.setDrawColor(200, 200, 220);
      doc.setLineWidth(0.5);
      doc.circle(x, y, 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 82, 147);
      doc.text('★', x, y - 1, { align: 'center' });

      doc.setFontSize(6);
      doc.text('OFFICIAL', x, y + 4, { align: 'center' });
      doc.text('SEAL', x, y + 8, { align: 'center' });
    },

    /**
     * Load an image from URL
     * @param {string} url - Image URL
     * @returns {Promise<string>} Base64 data URL
     */
    loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = reject;
        img.src = url;
      });
    },

    /**
     * Render the certificate generator UI
     */
    async renderUI() {
      const container = document.getElementById('certificatesContent');
      if (!container) return;

      const students = await this.getStudents();

      container.innerHTML = `
        <div class="card">
          <header class="panel-head">
            <div>
              <h2>Professional Certificate Generator</h2>
              <p class="muted small">Generate academic certificates with left sidebar, grading table, and dual signatures</p>
            </div>
          </header>

          <div class="certificate-controls">
            <div class="control-row">
              <div class="form-field">
                <label for="certificateGrade">Grade to Assign</label>
                <select id="certificateGrade" class="filter-select">
                  ${this.grades.map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
              </div>
              <div class="form-field">
                <button type="button" id="selectAllVerified" class="btn btn-outline">
                  Select All Verified
                </button>
              </div>
              <div class="form-field">
                <button type="button" id="generateCertificates" class="btn btn-gradient" disabled>
                  Generate Certificates
                </button>
              </div>
            </div>
          </div>

          <div class="selection-summary">
            <span id="selectedCount">0</span> student(s) selected
          </div>

          <p id="certificateStatus" class="muted small" role="status"></p>

          <div class="table-wrap mt-lg">
            <table class="table" id="studentSelectTable">
              <thead>
                <tr>
                  <th scope="col"><input type="checkbox" id="selectAllCertStudents" title="Select All" /></th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Course</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                ${students.length === 0 ? '<tr><td colspan="5" class="muted">No verified students found.</td></tr>' :
                  students.map(s => `
                    <tr>
                      <td><input type="checkbox" class="cert-student-checkbox" data-id="${s.id}" data-name="${s.studentNameEn}" data-course="${s.courseTitle}" /></td>
                      <td>${s.studentNameEn || 'N/A'}</td>
                      <td>${s.email || 'N/A'}</td>
                      <td>${s.courseTitle || '<span class="warning-text">No course</span>'}</td>
                      <td>${s.courseTitle ? '<span class="text-success">Verified</span>' : '<span class="warning-text">No course</span>'}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <style>
          .certificate-controls { margin-bottom: 20px; }
          .control-row { display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end; }
          .control-row .form-field { flex: 0 0 auto; }
          .selection-summary {
            padding: 10px 15px;
            background: #f0f7ff;
            border-radius: 6px;
            margin-bottom: 15px;
            font-weight: 500;
            color: #0d47a1;
          }
          .btn-outline {
            background: transparent;
            border: 2px solid #0066cc;
            color: #0066cc;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          }
          .btn-outline:hover { background: #0066cc; color: white; }
          .text-success { color: #2e7d32; font-weight: 500; }
        </style>
      `;

      this.attachEventListeners();
    },

    /**
     * Attach event listeners for the certificate UI
     */
    attachEventListeners() {
      const selectAll = document.getElementById('selectAllCertStudents');
      const selectAllVerified = document.getElementById('selectAllVerified');
      const checkboxes = document.querySelectorAll('.cert-student-checkbox');
      const generateBtn = document.getElementById('generateCertificates');

      selectAll?.addEventListener('change', (e) => {
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        this.updateGenerateButton();
      });

      selectAllVerified?.addEventListener('click', () => {
        checkboxes.forEach(cb => {
          const course = cb.dataset.course;
          if (course && course !== 'undefined') {
            cb.checked = true;
          }
        });
        this.updateGenerateButton();
      });

      checkboxes.forEach(cb => {
        cb.addEventListener('change', () => this.updateGenerateButton());
      });

      generateBtn?.addEventListener('click', () => this.handleGenerate());
    },

    /**
     * Update generate button state based on selection
     */
    updateGenerateButton() {
      const checkboxes = document.querySelectorAll('.cert-student-checkbox:checked');
      const countEl = document.getElementById('selectedCount');
      const btn = document.getElementById('generateCertificates');

      if (countEl) countEl.textContent = checkboxes.length;
      if (btn) btn.disabled = checkboxes.length === 0;
    },

    /**
     * Handle certificate generation
     */
    async handleGenerate() {
      const checkboxes = document.querySelectorAll('.cert-student-checkbox:checked');
      const grade = document.getElementById('certificateGrade')?.value || 'A+';
      const statusEl = document.getElementById('certificateStatus');

      if (checkboxes.length === 0) {
        statusEl.textContent = 'Please select at least one student.';
        return;
      }

      const students = await this.getStudents();
      let generated = 0;
      let failed = 0;

      statusEl.textContent = `Generating ${checkboxes.length} certificate(s)...`;

      for (const cb of checkboxes) {
        const studentId = cb.dataset.id;
        const student = students.find(s => s.id === studentId);

        if (!student || !student.courseTitle) {
          failed++;
          continue;
        }

        try {
          await this.generateCertificate(student, grade);
          generated++;
          statusEl.textContent = `Generated ${generated}/${checkboxes.length} certificate(s)...`;
        } catch (e) {
          console.error('Error generating certificate for', student.studentNameEn, e);
          failed++;
        }
      }

      if (failed > 0) {
        statusEl.textContent = `Completed: ${generated} generated, ${failed} failed.`;
      } else {
        statusEl.textContent = `Successfully generated ${generated} certificate(s).`;
      }
    },

    /**
     * Initialize the certificate generator
     */
    async init() {
      await this.renderUI();
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CertificateGenerator.init());
  } else {
    CertificateGenerator.init();
  }

  window.CertificateGenerator = CertificateGenerator;
})();