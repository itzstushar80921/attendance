-- ====================================================================
-- College Mobile Attendance System - Supabase PostgreSQL Schema
-- ====================================================================

-- 1. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_number VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE,
    department VARCHAR(80) NOT NULL DEFAULT 'Computer Science & Engineering',
    semester INT NOT NULL DEFAULT 5,
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    lab_batch VARCHAR(10) NOT NULL DEFAULT 'B1', -- e.g. B1, B2, B3 for lab division
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Courses / Subjects Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(80) NOT NULL DEFAULT 'Computer Science & Engineering',
    semester INT NOT NULL DEFAULT 5,
    credits INT NOT NULL DEFAULT 4,
    has_lab BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Attendance Sessions Table
-- Stores lecture and lab sessions separately
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_type VARCHAR(10) NOT NULL CHECK (class_type IN ('lecture', 'lab')),
    course_code VARCHAR(30) NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_slot VARCHAR(50) NOT NULL, -- e.g. '09:00 AM - 10:00 AM'
    semester INT NOT NULL DEFAULT 5,
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    lab_batch VARCHAR(10), -- NULL or 'All' for lectures; 'B1', 'B2' etc. for labs
    professor_name VARCHAR(100) NOT NULL DEFAULT 'Dr. Robert Vance',
    topic_covered TEXT,
    location VARCHAR(50), -- e.g. 'LH-204' or 'CS Lab-2'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Attendance Records Table
-- References the specific session and student, recording present / absent / late
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status VARCHAR(15) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    remarks VARCHAR(255),
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_session_student UNIQUE (session_id, student_id)
);

-- Indexes for lightning-fast queries and reporting
CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(semester, section, lab_batch);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON public.attendance_sessions(class_type);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON public.attendance_sessions(course_code, semester);
CREATE INDEX IF NOT EXISTS idx_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_records_status ON public.attendance_records(status);

-- Enable Row Level Security (RLS) & Allow Read/Write for Authenticated and Anon keys
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Default policies (allows full access via Anon/Service role for this application)
DROP POLICY IF EXISTS "Allow anon full access to students" ON public.students;
CREATE POLICY "Allow anon full access to students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access to courses" ON public.courses;
CREATE POLICY "Allow anon full access to courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access to attendance_sessions" ON public.attendance_sessions;
CREATE POLICY "Allow anon full access to attendance_sessions" ON public.attendance_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access to attendance_records" ON public.attendance_records;
CREATE POLICY "Allow anon full access to attendance_records" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);
