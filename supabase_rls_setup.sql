-- ============================================================================
-- MARKIETY IT INSTITUTE (MIT) - COMPLETE SUPABASE SCHEMA (SAFE / IDEMPOTENT)
-- Safe to run multiple times. Uses ALTER TABLE to patch existing tables.
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- TABLE: courses  (create or patch existing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id                     bigserial    PRIMARY KEY,
  title                  text         NOT NULL,
  created_at             timestamptz  DEFAULT now() NOT NULL
);

-- Patch any missing columns safely
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor           text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_photo     text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS image_url            text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration             text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS fee                  numeric(10,2);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS discount             numeric(10,2);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS certificate          text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description          text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS topics               text[]  DEFAULT '{}';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS outcomes             text[]  DEFAULT '{}';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS featured             boolean DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS discount_seats_total int     DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS discount_seats_claimed int   DEFAULT 0;

-- ============================================================================
-- TABLE: students  (create or patch existing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.students (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz  DEFAULT now() NOT NULL
);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS tracking_no       text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_name_en   text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_name_bn   text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS father_name_en    text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS father_name_bn    text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS mother_name_en    text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS mother_name_bn    text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS date_of_birth     date;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email             text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_phone     text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone      text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nid_number        text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS permanent_address text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS present_address   text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS course_id         bigint;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS course_title      text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS course_instructor text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS payment_method    text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS payment_amount    numeric(10,2) DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS transaction_id    text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS notes             text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS portal_phone      text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS portal_pin        text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS unlocked_courses  text[] DEFAULT '{}';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url         text;

-- ============================================================================
-- TABLE: certificates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz  DEFAULT now() NOT NULL
);
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_id  text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS file_name   text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS file_url    text;

-- ============================================================================
-- TABLE: expenses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz  DEFAULT now() NOT NULL
);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS amount  numeric(10,2);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS note    text;

-- ============================================================================
-- TABLE: contact_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz  DEFAULT now() NOT NULL
);
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS name     text;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS email    text;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS message  text;

-- ============================================================================
-- TABLE: admin_users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz  DEFAULT now() NOT NULL
);
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email     text;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS password  text;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS role      text DEFAULT 'admin';

-- Ensure unique constraint on email
DO $$
BEGIN
  ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_email_unique UNIQUE (email);
EXCEPTION WHEN duplicate_table THEN
  NULL; -- constraint already exists, ignore
END $$;

-- ============================================================================
-- TABLE: instructors
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instructors (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz  DEFAULT now() NOT NULL
);
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS name        text;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS subject     text;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS bio         text;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS photo       text;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS specialties text[]  DEFAULT '{}';
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS social      jsonb   DEFAULT '{}'::jsonb;

-- ============================================================================
-- SEED: Default admin user
-- ============================================================================
INSERT INTO public.admin_users (email, password, role)
VALUES ('admin@mit', 'mit12345', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- SEED: Instructors (only if table is empty)
-- ============================================================================
INSERT INTO public.instructors (name, title, subject, bio, photo, specialties, social)
SELECT
  'Md. Tuhin Khandakar (Abir)',
  'Founder & CEO',
  'Digital Marketing',
  'Expert digital strategist with years of hands-on experience in SEO, social media, and AI-powered marketing.',
  'assets/instructors/TUHIN.jpeg',
  ARRAY['Digital Marketing', 'SEO', 'Freelancing', 'AI Tools'],
  '{"facebook": "https://facebook.com/markietyitinstitute"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.instructors LIMIT 1);

INSERT INTO public.instructors (name, title, subject, bio, photo, specialties, social)
SELECT
  'Iqbal',
  'Senior Instructor',
  'Graphics Design',
  'Professional graphic designer with expertise in Canva, Adobe Photoshop, and brand identity design.',
  'assets/instructors/IQBAL.jpeg',
  ARRAY['Canva', 'Photoshop', 'Illustrator', 'Brand Design'],
  '{}'::jsonb
WHERE (SELECT COUNT(*) FROM public.instructors) < 2;

INSERT INTO public.instructors (name, title, subject, bio, photo, specialties, social)
SELECT
  'Md. Mahin',
  'Instructor',
  'Video Editing',
  'Creative video editor specializing in Premiere Pro, CapCut, and YouTube/Reels content production.',
  'assets/instructors/MAHIN.jpeg',
  ARRAY['Premiere Pro', 'CapCut', 'YouTube Editing', 'Color Grading'],
  '{}'::jsonb
WHERE (SELECT COUNT(*) FROM public.instructors) < 3;

-- ============================================================================
-- SEED: Courses (only if table is empty)
-- ============================================================================
INSERT INTO public.courses (title, instructor, duration, fee, discount, certificate, topics, outcomes, featured, discount_seats_total, discount_seats_claimed)
SELECT
  'Basic Computer Course', 'Md. Tuhin Khandakar', '2.5 Months', 3000, 2500,
  'Government-Approved',
  ARRAY['Microsoft Word / Excel / PowerPoint / Access', 'Internet & Email Management', 'File Handling & Google Workspace', 'Intro to AI Tools (ChatGPT, Copilot)'],
  ARRAY['Work confidently with Microsoft Office Suite', 'Create professional documents and presentations', 'Understand computer maintenance and digital productivity'],
  true, 20, 0
WHERE NOT EXISTS (SELECT 1 FROM public.courses LIMIT 1);

INSERT INTO public.courses (title, instructor, duration, fee, discount, certificate, topics, outcomes, featured, discount_seats_total, discount_seats_claimed)
SELECT
  'Digital Marketing', 'Md. Tuhin Khandakar', '3 Months', 6000, 5500,
  'Government-Approved',
  ARRAY['SEO & Analytics', 'Social Media Marketing (Facebook, Instagram, YouTube)', 'Google Ads & Meta Ads', 'Email & Content Marketing', 'Branding & AI Tools'],
  ARRAY['Run profitable ad campaigns', 'Develop brand growth strategies', 'Master AI-powered marketing tools'],
  true, 20, 0
WHERE (SELECT COUNT(*) FROM public.courses) < 2;

INSERT INTO public.courses (title, instructor, duration, fee, discount, certificate, topics, outcomes, featured, discount_seats_total, discount_seats_claimed)
SELECT
  'Graphics Design', 'Iqbal', '3 Months', 5000, 4500,
  'Government-Approved',
  ARRAY['Canva for Social Media & Branding', 'Photoshop Editing', 'Illustrator Logo Design', 'Brand Identity Basics'],
  ARRAY['Design brand kits and social posts', 'Understand typography & color theory', 'Create logos for real clients'],
  true, 20, 0
WHERE (SELECT COUNT(*) FROM public.courses) < 3;

INSERT INTO public.courses (title, instructor, duration, fee, discount, certificate, topics, outcomes, featured, discount_seats_total, discount_seats_claimed)
SELECT
  'Video Editing', 'Md. Mahin', '3 Months', 5000, 4500,
  'Government-Approved',
  ARRAY['Premiere Pro / CapCut Pro', 'YouTube & Reels Editing', 'Color Grading & Sound Sync', 'Motion Graphics Basics'],
  ARRAY['Edit cinematic and social media videos', 'Add transitions, sync sound, and export properly', 'Work with creators & brands professionally'],
  true, 20, 0
WHERE (SELECT COUNT(*) FROM public.courses) < 4;

INSERT INTO public.courses (title, instructor, duration, fee, discount, certificate, topics, outcomes, featured, discount_seats_total, discount_seats_claimed)
SELECT
  'Freelancing & Career Development', 'Md. Tuhin Khandakar', '2 Months', 4000, 3500,
  'Government-Approved',
  ARRAY['Fiverr & Upwork Setup', 'Proposal Writing & Client Communication', 'Portfolio & Personal Branding', 'Pricing & Gig Optimization'],
  ARRAY['Set up freelance profiles & attract clients', 'Communicate professionally with clients', 'Build a sustainable freelance career'],
  false, 20, 0
WHERE (SELECT COUNT(*) FROM public.courses) < 5;

-- ============================================================================
-- AUTO-UPDATE SEATS TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.course_id IS NOT NULL THEN
    UPDATE public.courses
    SET discount_seats_claimed = COALESCE(discount_seats_claimed, 0) + 1
    WHERE id = NEW.course_id
    AND (discount_seats_total IS NULL OR COALESCE(discount_seats_claimed, 0) < discount_seats_total);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_student_enrollment ON public.students;
CREATE TRIGGER on_student_enrollment
  AFTER INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_enrollment();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.admin_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors      ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES  (drop-then-recreate for idempotency)
-- ============================================================================

-- admin_users
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update" ON public.admin_users;
DROP POLICY IF EXISTS "Allow public read access" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin to update"    ON public.admin_users;
CREATE POLICY "admin_users_select" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "admin_users_update" ON public.admin_users FOR UPDATE USING (true);

-- instructors
DROP POLICY IF EXISTS "instructors_select"               ON public.instructors;
DROP POLICY IF EXISTS "instructors_all"                  ON public.instructors;
DROP POLICY IF EXISTS "Allow public read access"         ON public.instructors;
DROP POLICY IF EXISTS "Allow admin to manage instructors" ON public.instructors;
CREATE POLICY "instructors_select" ON public.instructors FOR SELECT USING (true);
CREATE POLICY "instructors_all"    ON public.instructors FOR ALL    USING (true);

-- courses
DROP POLICY IF EXISTS "courses_select"            ON public.courses;
DROP POLICY IF EXISTS "courses_insert"            ON public.courses;
DROP POLICY IF EXISTS "courses_update"            ON public.courses;
DROP POLICY IF EXISTS "courses_delete"            ON public.courses;
DROP POLICY IF EXISTS "Allow public read access"  ON public.courses;
DROP POLICY IF EXISTS "Allow public update access" ON public.courses;
CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_insert" ON public.courses FOR INSERT WITH CHECK (true);
CREATE POLICY "courses_update" ON public.courses FOR UPDATE USING (true);
CREATE POLICY "courses_delete" ON public.courses FOR DELETE USING (true);

-- students
DROP POLICY IF EXISTS "students_select"           ON public.students;
DROP POLICY IF EXISTS "students_insert"           ON public.students;
DROP POLICY IF EXISTS "students_update"           ON public.students;
DROP POLICY IF EXISTS "students_delete"           ON public.students;
DROP POLICY IF EXISTS "Allow public read access"  ON public.students;
DROP POLICY IF EXISTS "Allow public insert access" ON public.students;
DROP POLICY IF EXISTS "Allow public update access" ON public.students;
DROP POLICY IF EXISTS "Allow public delete access" ON public.students;
CREATE POLICY "students_select" ON public.students FOR SELECT USING (true);
CREATE POLICY "students_insert" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "students_update" ON public.students FOR UPDATE USING (true);
CREATE POLICY "students_delete" ON public.students FOR DELETE USING (true);

-- certificates
DROP POLICY IF EXISTS "certs_select"              ON public.certificates;
DROP POLICY IF EXISTS "certs_insert"              ON public.certificates;
DROP POLICY IF EXISTS "certs_delete"              ON public.certificates;
DROP POLICY IF EXISTS "Allow public read access"  ON public.certificates;
DROP POLICY IF EXISTS "Allow public insert access" ON public.certificates;
DROP POLICY IF EXISTS "Allow public delete access" ON public.certificates;
CREATE POLICY "certs_select" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "certs_insert" ON public.certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "certs_delete" ON public.certificates FOR DELETE USING (true);

-- expenses
DROP POLICY IF EXISTS "expenses_select"           ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert"           ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete"           ON public.expenses;
DROP POLICY IF EXISTS "Allow public read access"  ON public.expenses;
DROP POLICY IF EXISTS "Allow public insert access" ON public.expenses;
DROP POLICY IF EXISTS "Allow public delete access" ON public.expenses;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (true);

-- contact_messages
DROP POLICY IF EXISTS "messages_insert"            ON public.contact_messages;
DROP POLICY IF EXISTS "messages_select"            ON public.contact_messages;
DROP POLICY IF EXISTS "Allow public insert access" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow public read access"   ON public.contact_messages;
CREATE POLICY "messages_insert" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_select" ON public.contact_messages FOR SELECT USING (true);
