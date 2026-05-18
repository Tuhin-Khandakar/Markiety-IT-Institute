# 🚀 Pre-Launch Smoke Test Checklist

Run these tests after deploying to Netlify to verify everything works correctly.

## Core Pages
- [ ] Home page (`/`) loads without errors
- [ ] About page (`/about.html`) loads
- [ ] Courses page (`/courses.html`) loads, courses render from Supabase/fallback
- [ ] Instructors page (`/instructors.html`) loads, instructor cards render
- [ ] Admission page (`/admission.html`) loads
- [ ] Contact page (`/contact.html`) loads
- [ ] Gallery page (`/gallery.html`) loads, lightbox works
- [ ] Blog page (`/blog.html`) loads
- [ ] Verify page (`/verify.html`) loads

## Navigation
- [ ] Top nav shows correct active page (highlighted)
- [ ] Click each nav link - page changes correctly
- [ ] Footer quick links work
- [ ] "Apply Now" button goes to admission
- [ ] Mobile hamburger menu works

## Forms
- [ ] Admission form - fill and submit (localStorage save works)
- [ ] Admission form - bKash panel shows when bKash selected, hides for other methods
- [ ] Contact form - submit shows success message
- [ ] Terms checkbox required on admission form

## Authentication
- [ ] Admin login (`/admin/`) - login works, dashboard loads
- [ ] Student login (`/students/`) - login works, portal loads
- [ ] Student portal shows correct student data

## Key Features
- [ ] Certificate verification works (Supabase + local fallback)
- [ ] Dark/Light theme toggle works, persists on reload
- [ ] WhatsApp float button works (opens WA chat)
- [ ] Back to top button works
- [ ] Search overlay opens with Ctrl+K or search icon
- [ ] Course modal opens from courses page

## Performance
- [ ] No console errors on any page
- [ ] Images load (no broken image icons)
- [ ] Lazy loading works (check network tab)

## SEO & Meta
- [ ] Each page has unique title
- [ ] Each page has meta description
- [ ] Open Graph tags present
- [ ] Twitter card present
- [ ] Canonical URLs correct

## Accessibility
- [ ] Keyboard navigation works (Tab through links)
- [ ] Focus states visible on interactive elements
- [ ] Color contrast readable in light and dark modes

## Technical
- [ ] `robots.txt` blocks `/admin/` and `/students/`
- [ ] `sitemap.xml` lists all public pages
- [ ] Netlify redirects work (test `/admin`, `/students`)
- [ ] Security headers present (CSP, HSTS, etc.)

## Browser Test
- [ ] Chrome - everything works
- [ ] Firefox - everything works
- [ ] Safari - everything works
- [ ] Mobile (320px-480px) - no horizontal scroll, readable text