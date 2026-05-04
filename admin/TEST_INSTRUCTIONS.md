# Admin Dashboard Testing Instructions

## Quick Start Testing

### Test 1: Login Loop Bug Fix (CRITICAL)
**Status**: ✅ FIXED

1. Open `admin/index.html` in browser
2. Login with: `admin@mit` / `mit12345`
3. **Expected**: Redirects to `dashboard.html` successfully
4. Clear localStorage: `localStorage.clear()` in console
5. Refresh page
6. **Expected**: Redirects to login page WITHOUT looping
7. **Pass Criteria**: No infinite redirects, clean login flow

---

### Test 2: Advanced Search & Filter
1. Go to Students tab
2. Type in search box: student name, phone, or email
3. **Expected**: Results update instantly (300ms debounce)
4. Select course from dropdown
5. **Expected**: Only students from that course shown
6. Select payment method
7. **Expected**: Only students with that payment shown
8. Click "Clear Filters"
9. **Expected**: All students visible again

---

### Test 3: Bulk Operations
1. Click checkbox next to 3-5 students
2. **Expected**: Bulk action buttons become enabled
3. Click "Export Selected"
4. **Expected**: Downloads JSON file with selected students
5. Select more students
6. Click "Delete Selected"
7. Confirm deletion
8. **Expected**: Selected students removed, data synced to Supabase

---

### Test 4: Pagination
1. Change items per page to "10"
2. **Expected**: Shows 10 students per page
3. Click "Next"
4. **Expected**: Shows next 10 students
5. Change to "All"
6. **Expected**: Shows all students on one page

---

### Test 5: Column Sorting
1. Click "Student Name" header
2. **Expected**: Sorts A-Z with ▲ indicator
3. Click again
4. **Expected**: Sorts Z-A with ▼ indicator
5. Click "Submitted Date" header
6. **Expected**: Sorts by date, most recent first

---

### Test 6: Export to Excel
1. Filter students by course (optional)
2. Click "Export to Excel"
3. **Expected**: Downloads CSV file
4. Open file in Excel or Google Sheets
5. **Expected**: All columns visible, data properly formatted

---

### Test 7: SMS Feature (Placeholder)
1. Select 2-3 students with phone numbers
2. Click "Send SMS"
3. **Expected**: Modal opens with phone numbers pre-filled
4. Type a message
5. **Expected**: Character counter updates
6. Select a template
7. **Expected**: Message field populates
8. Click "Send SMS"
9. **Expected**: Shows API placeholder message

---

### Test 8: Backup & Restore
1. Click "Backup All Data"
2. **Expected**: Downloads `mit-backup-[timestamp].json`
3. Open JSON file
4. **Expected**: Contains students, courses, certificates, expenses, messages
5. Click "Restore Data"
6. Upload the backup file
7. Confirm restore
8. **Expected**: Page reloads with restored data

---

## Browser Console Tests

### Check for JavaScript Errors
```javascript
// Should show no errors
console.log('Dashboard State:', window.dashboardState);

// Should exist
console.log('Advanced Dashboard Loaded:', typeof window.refreshAdvancedDashboard);

// Should show students
console.log('Students:', JSON.parse(localStorage.getItem('mit_students')));
```

### Test Session Storage
```javascript
// Should return session object or null
console.log('Session:', JSON.parse(localStorage.getItem('mit_admin_session')));

// Manually create session (for testing)
localStorage.setItem('mit_admin_session', JSON.stringify({
  email: 'admin@mit',
  at: Date.now()
}));

// Verify no loop
location.reload();
```

### Test Filter State
```javascript
// Should show current filter state
console.log('Filters:', window.dashboardState?.filters);

// Should show selected students
console.log('Selected:', Array.from(window.dashboardState?.selectedStudents || []));
```

---

## Performance Tests

### Large Dataset Test
```javascript
// Generate 100 test students
const testStudents = Array.from({length: 100}, (_, i) => ({
  id: `test-${i}`,
  trackingNo: `MIT-${1000000000000 + i}`,
  studentNameEn: `Test Student ${i}`,
  studentPhone: `0162454766${String(i).padStart(2, '0')}`,
  email: `student${i}@test.com`,
  courseTitle: ['Digital Marketing', 'Graphics Design', 'Video Editing'][i % 3],
  payment: ['Cash', 'bKash', 'Nagad'][i % 3],
  courseFee: 5000,
  createdAt: new Date(Date.now() - i * 86400000).toISOString()
}));

localStorage.setItem('mit_students', JSON.stringify(testStudents));
location.reload();

// Test pagination, sorting, filtering with 100 students
```

### Measure Performance
```javascript
console.time('Filter');
// Apply a filter
console.timeEnd('Filter'); // Should be < 50ms

console.time('Sort');
// Click sort header
console.timeEnd('Sort'); // Should be < 30ms

console.time('Render');
// Change page
console.timeEnd('Render'); // Should be < 100ms
```

---

## Known Issues & Limitations

### SMS Feature
- **Status**: Placeholder only
- **Action Needed**: Integrate with SMS gateway API
- **Recommended**: BulkSMS Bangladesh, SSL Wireless, or Twilio

### Real-time Sync
- Changes made by other admins won't appear until page refresh
- Supabase Realtime subscriptions will auto-update (already configured)

### Date Filtering
- Uses local timezone
- Date range is inclusive

### Export Limits
- CSV export loads all filtered data into memory
- For very large datasets (10,000+), consider server-side export

---

## Troubleshooting

### Problem: Login loop still occurs
**Solution**: 
1. Clear all localStorage: `localStorage.clear()`
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)
4. Check console for errors

### Problem: Advanced features not working
**Solution**:
1. Check if `admin-dashboard-advanced.js` loaded: 
   ```javascript
   console.log(typeof window.refreshAdvancedDashboard)
   ```
2. Verify no JavaScript errors in console
3. Check if Supabase is initialized: `console.log(window.db?.initialized)`

### Problem: Filters not applying
**Solution**:
1. Clear filters with "Clear Filters" button
2. Check if students array is populated:
   ```javascript
   console.log(JSON.parse(localStorage.getItem('mit_students')))
   ```

### Problem: Pagination stuck
**Solution**:
1. Change items per page to "All"
2. Clear filters
3. Check page number doesn't exceed total pages

---

## Success Criteria

All features are working correctly if:

- ✅ No login loop - clean login/logout flow
- ✅ Search returns instant results
- ✅ Filters work independently and in combination
- ✅ Pagination shows correct subsets
- ✅ Sorting changes order with visual indicator
- ✅ Bulk operations work on selected items
- ✅ Excel export creates valid CSV file
- ✅ SMS modal opens with correct data
- ✅ Backup/restore preserves all data
- ✅ No JavaScript errors in console
- ✅ Responsive on mobile/tablet
- ✅ Dark mode works correctly

---

## Next Steps After Testing

1. **SMS Integration**: Connect to SMS gateway API
2. **Email Notifications**: Add similar bulk email feature
3. **Advanced Analytics**: Add charts for trends
4. **Audit Log**: Track admin actions
5. **Export Scheduler**: Schedule automatic backups

---

**Test Date**: ___________
**Tester**: ___________
**Browser**: ___________
**Result**: ☐ Pass  ☐ Fail  ☐ Needs Review
