/**
 * Advanced Admin Dashboard Features
 * - Bulk operations (delete, export)
 * - Advanced filtering (course, payment, date range)
 * - Search with autocomplete
 * - Pagination for large datasets
 * - Sortable columns
 * - Export to Excel (CSV format)
 * - SMS notifications (placeholder for API)
 * - Data backup/restore
 */

(function() {
  'use strict';

  // State management
  const dashboardState = {
    allStudents: [],
    filteredStudents: [],
    selectedStudents: new Set(),
    currentPage: 1,
    itemsPerPage: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filters: {
      search: '',
      course: '',
      payment: '',
      dateFrom: '',
      dateTo: ''
    }
  };

  // Wait for DOM and main app to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedFeatures);
  } else {
    initAdvancedFeatures();
  }

  function initAdvancedFeatures() {
    // Only run on admin dashboard
    if (!document.querySelector('body[data-page="admin-dashboard"]')) return;

    // Wait for main app to load students - retry pattern for reliability
    let attempts = 0;
    const maxAttempts = 10;

    const tryInit = () => {
      const students = localStorage.getItem('mit_students');
      if (students || attempts >= maxAttempts) {
        loadStudentsData();
        initSearchAndFilters();
        initBulkOperations();
        initPagination();
        initSorting();
        initExcelExport();
        initSMSFeatures();
        initBackupRestore();
        populateCourseFilter();
      } else {
        attempts++;
        setTimeout(tryInit, 200);
      }
    };

    tryInit();
  }

  // Load students from localStorage (synced by main app)
  function loadStudentsData() {
    try {
      const stored = localStorage.getItem('mit_students');
      if (stored) {
        dashboardState.allStudents = JSON.parse(stored);
        dashboardState.filteredStudents = [...dashboardState.allStudents];
        applyFiltersAndRender();
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    }
  }

  // Refresh data (call this after any update)
  window.refreshAdvancedDashboard = function() {
    loadStudentsData();
  };

  // ============================================================================
  // SEARCH & FILTERS
  // ============================================================================

  function initSearchAndFilters() {
    const searchBox = document.getElementById('studentSearchBox');
    const filterCourse = document.getElementById('filterCourse');
    const filterPayment = document.getElementById('filterPayment');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const clearBtn = document.getElementById('clearFilters');

    if (!searchBox) return;

    // Debounced search
    let searchTimeout;
    searchBox.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        dashboardState.filters.search = e.target.value.toLowerCase().trim();
        applyFiltersAndRender();
      }, 300);
    });

    // Course filter
    filterCourse?.addEventListener('change', (e) => {
      dashboardState.filters.course = e.target.value;
      applyFiltersAndRender();
    });

    // Payment filter
    filterPayment?.addEventListener('change', (e) => {
      dashboardState.filters.payment = e.target.value;
      applyFiltersAndRender();
    });

    // Date filters
    filterDateFrom?.addEventListener('change', (e) => {
      dashboardState.filters.dateFrom = e.target.value;
      applyFiltersAndRender();
    });

    filterDateTo?.addEventListener('change', (e) => {
      dashboardState.filters.dateTo = e.target.value;
      applyFiltersAndRender();
    });

    // Clear filters
    clearBtn?.addEventListener('click', () => {
      dashboardState.filters = {
        search: '',
        course: '',
        payment: '',
        dateFrom: '',
        dateTo: ''
      };
      searchBox.value = '';
      if (filterCourse) filterCourse.value = '';
      if (filterPayment) filterPayment.value = '';
      if (filterDateFrom) filterDateFrom.value = '';
      if (filterDateTo) filterDateTo.value = '';
      applyFiltersAndRender();
    });
  }

  function populateCourseFilter() {
    const filterCourse = document.getElementById('filterCourse');
    if (!filterCourse) return;

    // Get unique courses
    const courses = new Set();
    dashboardState.allStudents.forEach(s => {
      if (s.courseTitle) courses.add(s.courseTitle);
    });

    // Populate dropdown
    Array.from(courses).sort().forEach(course => {
      const option = document.createElement('option');
      option.value = course;
      option.textContent = course;
      filterCourse.appendChild(option);
    });
  }

  function applyFiltersAndRender() {
    let filtered = [...dashboardState.allStudents];
    const f = dashboardState.filters;

    // Search filter (name, phone, email, tracking)
    if (f.search) {
      filtered = filtered.filter(s => {
        const searchable = [
          s.studentNameEn || '',
          s.fullName || '',
          s.studentPhone || '',
          s.phone || '',
          s.email || '',
          s.trackingNo || '',
          s.id || ''
        ].join(' ').toLowerCase();
        return searchable.includes(f.search);
      });
    }

    // Course filter
    if (f.course) {
      filtered = filtered.filter(s => s.courseTitle === f.course);
    }

    // Payment filter
    if (f.payment) {
      filtered = filtered.filter(s => s.payment === f.payment);
    }

    // Date range filter
    if (f.dateFrom) {
      const fromDate = new Date(f.dateFrom);
      filtered = filtered.filter(s => {
        const studentDate = new Date(s.createdAt);
        return studentDate >= fromDate;
      });
    }

    if (f.dateTo) {
      const toDate = new Date(f.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(s => {
        const studentDate = new Date(s.createdAt);
        return studentDate <= toDate;
      });
    }

    dashboardState.filteredStudents = filtered;
    dashboardState.currentPage = 1; // Reset to first page
    applySortAndPagination();
  }

  // ============================================================================
  // SORTING
  // ============================================================================

  function initSorting() {
    const headers = document.querySelectorAll('.sortable');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const sortField = header.dataset.sort;
        if (dashboardState.sortBy === sortField) {
          // Toggle order
          dashboardState.sortOrder = dashboardState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          dashboardState.sortBy = sortField;
          dashboardState.sortOrder = 'asc';
        }

        // Update UI
        headers.forEach(h => {
          h.classList.remove('sort-asc', 'sort-desc');
          const icon = h.querySelector('.sort-icon');
          if (icon) icon.textContent = '';
        });

        header.classList.add(dashboardState.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
        const icon = header.querySelector('.sort-icon');
        if (icon) icon.textContent = dashboardState.sortOrder === 'asc' ? '▲' : '▼';

        applySortAndPagination();
      });
    });
  }

  function applySortAndPagination() {
    // Sort
    const sorted = [...dashboardState.filteredStudents].sort((a, b) => {
      const field = dashboardState.sortBy;
      let aVal = a[field] || '';
      let bVal = b[field] || '';

      // Handle date sorting
      if (field === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        // String comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return dashboardState.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return dashboardState.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const itemsPerPage = dashboardState.itemsPerPage === 'all'
      ? sorted.length
      : parseInt(dashboardState.itemsPerPage);

    const start = (dashboardState.currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = sorted.slice(start, end);

    renderStudentsTable(paginated);
    updatePaginationUI(sorted.length);
    updateStudentCounts(paginated.length, sorted.length);
  }

  function updateStudentCounts(showing, total) {
    const countEl = document.getElementById('studentCount');
    const totalEl = document.getElementById('totalStudentCount');
    if (countEl) countEl.textContent = showing;
    if (totalEl) totalEl.textContent = total;
  }

  // ============================================================================
  // PAGINATION
  // ============================================================================

  function initPagination() {
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    itemsPerPageSelect?.addEventListener('change', (e) => {
      dashboardState.itemsPerPage = e.target.value;
      dashboardState.currentPage = 1;
      applySortAndPagination();
    });

    prevBtn?.addEventListener('click', () => {
      if (dashboardState.currentPage > 1) {
        dashboardState.currentPage--;
        applySortAndPagination();
      }
    });

    nextBtn?.addEventListener('click', () => {
      const totalPages = Math.ceil(dashboardState.filteredStudents.length /
        (dashboardState.itemsPerPage === 'all' ? 1 : parseInt(dashboardState.itemsPerPage)));
      if (dashboardState.currentPage < totalPages) {
        dashboardState.currentPage++;
        applySortAndPagination();
      }
    });
  }

  function updatePaginationUI(totalItems) {
    const itemsPerPage = dashboardState.itemsPerPage === 'all'
      ? totalItems
      : parseInt(dashboardState.itemsPerPage);

    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (pageInfo) {
      pageInfo.textContent = `Page ${dashboardState.currentPage} of ${totalPages}`;
    }

    if (prevBtn) {
      prevBtn.disabled = dashboardState.currentPage <= 1;
    }

    if (nextBtn) {
      nextBtn.disabled = dashboardState.currentPage >= totalPages;
    }
  }

  // ============================================================================
  // RENDER TABLE WITH CHECKBOXES
  // ============================================================================

  function renderStudentsTable(students) {
    const tbody = document.getElementById('studentsTbody');
    if (!tbody) return;

    if (!students.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No students found.</td></tr>';
      return;
    }

    tbody.innerHTML = students.map(student => {
      const isSelected = dashboardState.selectedStudents.has(student.id);
      const payableDisplay = formatBDT(student.coursePayable || student.courseDiscount || student.courseFee);

      return `
        <tr data-student-id="${student.id}">
          <td>
            <input type="checkbox" class="student-checkbox" data-id="${student.id}" ${isSelected ? 'checked' : ''} />
          </td>
          <td>
            <strong>${student.trackingNo || student.id}</strong>
            <div class="student-meta">${student.id}</div>
          </td>
          <td>
            <strong>${student.studentNameEn || student.fullName}</strong>
            <div class="student-meta">
              ${student.studentPhone || student.phone || 'N/A'}
              <br />${student.email || 'N/A'}
            </div>
            <div class="student-meta">Portal PIN: ${student.portalPin || '—'}</div>
          </td>
          <td>
            <strong>${student.courseTitle}</strong>
            <div class="student-meta">${student.courseInstructor || ''}</div>
          </td>
          <td>
            <strong>${student.payment || 'N/A'}</strong>
            <div class="student-meta">${payableDisplay}</div>
            <div class="student-meta">Txn: ${student.paymentTxn || '-'}</div>
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

    // Attach checkbox listeners
    tbody.querySelectorAll('.student-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', handleCheckboxChange);
    });

    updateBulkButtonStates();
  }

  function formatBDT(amount) {
    const num = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    return `Tk ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  function formatDisplayDate(value) {
    const date = value ? new Date(value) : new Date();
    if (isNaN(date.getTime())) return value || '';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  function initBulkOperations() {
    const selectAllMain = document.getElementById('selectAllStudents');
    const selectAllHeader = document.getElementById('selectAllStudentsHeader');
    const bulkDeleteBtn = document.getElementById('bulkDeleteStudents');
    const bulkExportBtn = document.getElementById('bulkExportStudents');

    // Select all checkboxes
    [selectAllMain, selectAllHeader].forEach(el => {
      el?.addEventListener('change', (e) => {
        const isChecked = e.target.checked;

        // Get current page students
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(cb => {
          cb.checked = isChecked;
          const id = cb.dataset.id;
          if (isChecked) {
            dashboardState.selectedStudents.add(id);
          } else {
            dashboardState.selectedStudents.delete(id);
          }
        });

        // Sync both select-all checkboxes
        if (selectAllMain && e.target !== selectAllMain) selectAllMain.checked = isChecked;
        if (selectAllHeader && e.target !== selectAllHeader) selectAllHeader.checked = isChecked;

        updateBulkButtonStates();
      });
    });

    // Bulk delete
    bulkDeleteBtn?.addEventListener('click', () => {
      const count = dashboardState.selectedStudents.size;
      if (count === 0) return;

      if (confirm(`Delete ${count} selected student(s)? This cannot be undone.`)) {
        const idsToDelete = Array.from(dashboardState.selectedStudents);

        // Delete from Supabase if available
        if (window.db?.initialized) {
          idsToDelete.forEach(id => window.db.deleteStudent(id));
        }

        // Delete from local storage
        const students = JSON.parse(localStorage.getItem('mit_students') || '[]');
        const filtered = students.filter(s => !idsToDelete.includes(s.id));
        localStorage.setItem('mit_students', JSON.stringify(filtered));

        dashboardState.selectedStudents.clear();
        loadStudentsData();

        if (window.toast) window.toast.success(`Deleted ${count} student(s)`);
        if (window.renderStudentsTable) window.renderStudentsTable();
      }
    });

    // Bulk export
    bulkExportBtn?.addEventListener('click', () => {
      const selected = dashboardState.allStudents.filter(s =>
        dashboardState.selectedStudents.has(s.id)
      );

      if (selected.length === 0) return;

      const dataStr = JSON.stringify(selected, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      if (window.toast) window.toast.success(`Exported ${selected.length} student(s)`);
    });
  }

  function handleCheckboxChange(e) {
    const id = e.target.dataset.id;
    if (e.target.checked) {
      dashboardState.selectedStudents.add(id);
    } else {
      dashboardState.selectedStudents.delete(id);
    }
    updateBulkButtonStates();

    // Update select-all checkboxes
    const allCheckboxes = document.querySelectorAll('.student-checkbox');
    const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
    const selectAllMain = document.getElementById('selectAllStudents');
    const selectAllHeader = document.getElementById('selectAllStudentsHeader');
    if (selectAllMain) selectAllMain.checked = allChecked;
    if (selectAllHeader) selectAllHeader.checked = allChecked;
  }

  function updateBulkButtonStates() {
    const count = dashboardState.selectedStudents.size;
    const bulkDeleteBtn = document.getElementById('bulkDeleteStudents');
    const bulkExportBtn = document.getElementById('bulkExportStudents');
    const sendSMSBtn = document.getElementById('sendSMSBulk');

    [bulkDeleteBtn, bulkExportBtn, sendSMSBtn].forEach(btn => {
      if (btn) btn.disabled = count === 0;
    });
  }

  // ============================================================================
  // EXCEL EXPORT (CSV)
  // ============================================================================

  function initExcelExport() {
    const exportBtn = document.getElementById('exportToExcel');
    exportBtn?.addEventListener('click', exportToCSV);
  }

  function exportToCSV() {
    const students = dashboardState.filteredStudents;
    if (students.length === 0) {
      alert('No students to export');
      return;
    }

    // CSV headers
    const headers = [
      'Tracking No',
      'Student Name',
      'Father Name',
      'Mother Name',
      'Date of Birth',
      'Phone',
      'Email',
      'NID',
      'Address',
      'Course',
      'Instructor',
      'Fee',
      'Payment Method',
      'Transaction ID',
      'Portal PIN',
      'Submitted Date'
    ];

    // Build CSV rows
    const rows = students.map(s => [
      s.trackingNo || s.id,
      s.studentNameEn || s.fullName,
      s.fatherNameEn || '',
      s.motherNameEn || '',
      s.dob || '',
      s.studentPhone || s.phone || '',
      s.email || '',
      s.nid || '',
      s.permanentAddress || '',
      s.courseTitle || '',
      s.courseInstructor || '',
      s.courseFee || '',
      s.payment || '',
      s.paymentTxn || '',
      s.portalPin || '',
      s.createdAt ? new Date(s.createdAt).toLocaleString() : ''
    ]);

    // Escape CSV values
    const escapeCSV = (val) => {
      const str = String(val || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    if (window.toast) window.toast.success('Exported to Excel (CSV)');
  }

  // ============================================================================
  // SMS NOTIFICATIONS
  // ============================================================================

  function initSMSFeatures() {
    const sendSMSBulkBtn = document.getElementById('sendSMSBulk');
    const smsModal = document.getElementById('smsModal');
    const closeBtns = document.querySelectorAll('[data-close="smsModal"]');
    const sendBtn = document.getElementById('sendSMSBtn');
    const messageBox = document.getElementById('smsMessage');
    const charCount = document.getElementById('smsCharCount');
    const templateSelect = document.getElementById('smsTemplate');

    sendSMSBulkBtn?.addEventListener('click', () => {
      if (dashboardState.selectedStudents.size === 0) return;

      // Populate recipients
      const selected = dashboardState.allStudents.filter(s =>
        dashboardState.selectedStudents.has(s.id)
      );
      const phones = selected.map(s => s.studentPhone || s.phone).filter(Boolean);
      const recipientsBox = document.getElementById('smsRecipients');
      if (recipientsBox) {
        recipientsBox.value = phones.join(', ');
      }

      smsModal?.showModal();
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => smsModal?.close());
    });

    // Character counter
    messageBox?.addEventListener('input', (e) => {
      if (charCount) {
        charCount.textContent = e.target.value.length;
      }
    });

    // Template selector
    templateSelect?.addEventListener('change', (e) => {
      const templates = {
        admission: 'Congratulations! Your admission to MIT is confirmed. Welcome to our institute. Login: [PHONE] PIN: [PIN]',
        payment: 'Dear student, your payment for [COURSE] is due. Please pay Tk [AMOUNT] at your earliest convenience.',
        class: 'Class reminder: Your [COURSE] class is scheduled for [DATE] at [TIME]. Please attend on time.',
        certificate: 'Good news! Your course certificate is ready for collection. Visit our office during business hours.'
      };

      if (e.target.value && messageBox) {
        messageBox.value = templates[e.target.value] || '';
        if (charCount) {
          charCount.textContent = messageBox.value.length;
        }
      }
    });

    // Send SMS (placeholder)
    sendBtn?.addEventListener('click', () => {
      const message = messageBox?.value.trim();
      const recipients = document.getElementById('smsRecipients')?.value;

      if (!message || !recipients) {
        alert('Please enter a message and select recipients');
        return;
      }

      // Placeholder for SMS API integration
      const statusEl = document.getElementById('smsStatus');
      if (statusEl) {
        statusEl.textContent = 'SMS API integration required. Connect to Twilio, BulkSMS BD, or similar service.';
      }

      // In real implementation, call SMS gateway API here
      console.log('SMS would be sent to:', recipients);
      console.log('Message:', message);

      setTimeout(() => {
        alert('SMS feature requires API integration. This is a placeholder demonstration.');
        smsModal?.close();
      }, 1500);
    });
  }

  // ============================================================================
  // BACKUP & RESTORE
  // ============================================================================

  function initBackupRestore() {
    const backupBtn = document.getElementById('backupData');
    const restoreBtn = document.getElementById('restoreData');
    const restoreInput = document.getElementById('restoreFileInput');

    backupBtn?.addEventListener('click', () => {
      const backup = {
        students: JSON.parse(localStorage.getItem('mit_students') || '[]'),
        courses: JSON.parse(localStorage.getItem('mit_courses') || '[]'),
        certificates: JSON.parse(localStorage.getItem('mit_certificates') || '[]'),
        expenses: JSON.parse(localStorage.getItem('mit_expenses_base') || '[]'),
        messages: JSON.parse(localStorage.getItem('mit_contact_messages') || '[]'),
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mit-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      if (window.toast) window.toast.success('Backup created successfully');
    });

    restoreBtn?.addEventListener('click', () => {
      restoreInput?.click();
    });

    restoreInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target.result);

          if (!confirm('Restore data from backup? This will overwrite current data.')) {
            return;
          }

          // Restore to localStorage
          if (backup.students) localStorage.setItem('mit_students', JSON.stringify(backup.students));
          if (backup.courses) localStorage.setItem('mit_courses', JSON.stringify(backup.courses));
          if (backup.certificates) localStorage.setItem('mit_certificates', JSON.stringify(backup.certificates));
          if (backup.expenses) localStorage.setItem('mit_expenses_base', JSON.stringify(backup.expenses));
          if (backup.messages) localStorage.setItem('mit_contact_messages', JSON.stringify(backup.messages));

          if (window.toast) window.toast.success('Data restored successfully');

          // Reload page to reflect changes
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          alert('Failed to restore backup: Invalid file format');
          console.error(error);
        }
      };
      reader.readAsText(file);
    });
  }

})();
