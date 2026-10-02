-- ====================================================================
-- College Mobile Attendance System - Seed Data
-- ====================================================================

-- 1. Insert Courses
INSERT INTO public.courses (code, name, department, semester, credits, has_lab)
VALUES 
    ('CS501', 'Database Management Systems', 'Computer Science & Engineering', 5, 4, true),
    ('CS502', 'Operating Systems', 'Computer Science & Engineering', 5, 4, true),
    ('CS503', 'Computer Networks', 'Computer Science & Engineering', 5, 4, true),
    ('CS504', 'Design & Analysis of Algorithms', 'Computer Science & Engineering', 5, 4, false),
    ('CS505', 'Web Technologies & Cloud Computing', 'Computer Science & Engineering', 5, 3, true)
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Predefined Student List (Semester 5, Section A, Batches B1 and B2)
INSERT INTO public.students (roll_number, name, email, department, semester, section, lab_batch, phone)
VALUES 
    ('2024CS001', 'Aarav Sharma', 'aarav.sharma@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43210'),
    ('2024CS002', 'Aditi Verma', 'aditi.verma@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43211'),
    ('2024CS003', 'Ananya Patel', 'ananya.patel@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43212'),
    ('2024CS004', 'Aryan Mukherjee', 'aryan.m@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43213'),
    ('2024CS005', 'Bhavya Nair', 'bhavya.nair@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43214'),
    ('2024CS006', 'Chirag Joshi', 'chirag.j@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43215'),
    ('2024CS007', 'Devansh Gupta', 'devansh.g@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43216'),
    ('2024CS008', 'Diya Reddy', 'diya.reddy@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43217'),
    ('2024CS009', 'Eshan Malhotra', 'eshan.m@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43218'),
    ('2024CS010', 'Ishaan Sengupta', 'ishaan.s@college.edu', 'Computer Science & Engineering', 5, 'A', 'B1', '+91 98765 43219'),
    ('2024CS011', 'Kavya Iyer', 'kavya.iyer@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43220'),
    ('2024CS012', 'Manish Kulkarni', 'manish.k@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43221'),
    ('2024CS013', 'Meera Deshmukh', 'meera.d@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43222'),
    ('2024CS014', 'Nikhil Choudhury', 'nikhil.c@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43223'),
    ('2024CS015', 'Pooja Bhatt', 'pooja.b@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43224'),
    ('2024CS016', 'Pranav Menon', 'pranav.m@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43225'),
    ('2024CS017', 'Rhea Kapoor', 'rhea.k@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43226'),
    ('2024CS018', 'Rohan Bhatnagar', 'rohan.b@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43227'),
    ('2024CS019', 'Siddharth Rao', 'siddharth.r@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43228'),
    ('2024CS020', 'Tanvi Mehta', 'tanvi.m@college.edu', 'Computer Science & Engineering', 5, 'A', 'B2', '+91 98765 43229')
ON CONFLICT (roll_number) DO NOTHING;

-- 3. Insert Sample Past Lecture Sessions
INSERT INTO public.attendance_sessions (id, class_type, course_code, course_name, date, time_slot, semester, section, lab_batch, professor_name, topic_covered, location)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'lecture', 'CS501', 'Database Management Systems', CURRENT_DATE - INTERVAL '14 days', '09:00 AM - 10:00 AM', 5, 'A', 'All', 'Dr. Robert Vance', 'ER Models and Relational Schema Conversion', 'LH-201'),
    ('11111111-1111-1111-1111-111111111102', 'lecture', 'CS501', 'Database Management Systems', CURRENT_DATE - INTERVAL '10 days', '09:00 AM - 10:00 AM', 5, 'A', 'All', 'Dr. Robert Vance', 'SQL Joins, Subqueries and Aggregations', 'LH-201'),
    ('11111111-1111-1111-1111-111111111103', 'lecture', 'CS501', 'Database Management Systems', CURRENT_DATE - INTERVAL '7 days', '10:00 AM - 11:00 AM', 5, 'A', 'All', 'Dr. Robert Vance', 'Normalization: 1NF, 2NF, 3NF and BCNF', 'LH-201'),
    ('11111111-1111-1111-1111-111111111104', 'lecture', 'CS501', 'Database Management Systems', CURRENT_DATE - INTERVAL '3 days', '09:00 AM - 10:00 AM', 5, 'A', 'All', 'Dr. Robert Vance', 'Transaction Management and ACID Properties', 'LH-201')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Sample Past Lab Sessions
INSERT INTO public.attendance_sessions (id, class_type, course_code, course_name, date, time_slot, semester, section, lab_batch, professor_name, topic_covered, location)
VALUES 
    ('22222222-2222-2222-2222-222222222201', 'lab', 'CS501', 'Database Management Systems', CURRENT_DATE - INTERVAL '12 days', '02:00 PM - 04:00 PM', 5, 'A', 'B1', 'Dr. Robert Vance', 'Lab 1: DDL & DML Commands in PostgreSQL', 'CS Lab-3'),
    ('22222222-2222-2222-2222-222222222202', 'lab', 'CS501', 'Database Management Systems', CURRENT_DATE - INTERVAL '11 days', '02:00 PM - 04:00 PM', 5, 'A', 'B2', 'Dr. Robert Vance', 'Lab 1: DDL & DML Commands in PostgreSQL', 'CS Lab-3'),
    ('22222222-2222-2222-2222-222222222203', 'lab', 'CS501', 'Database Management Systems', CURRENT_DATE - INTERVAL '5 days', '02:00 PM - 04:00 PM', 5, 'A', 'B1', 'Dr. Robert Vance', 'Lab 2: Complex Joins and View Creation', 'CS Lab-3'),
    ('22222222-2222-2222-2222-222222222204', 'lab', 'CS501', 'Database Management Systems', CURRENT_DATE - INTERVAL '4 days', '02:00 PM - 04:00 PM', 5, 'A', 'B2', 'Dr. Robert Vance', 'Lab 2: Complex Joins and View Creation', 'CS Lab-3')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Sample Attendance Records for Lectures & Labs
-- Let's populate records for all students for lecture 1
INSERT INTO public.attendance_records (session_id, student_id, status)
SELECT 
    '11111111-1111-1111-1111-111111111101'::uuid, 
    id, 
    CASE 
        WHEN roll_number IN ('2024CS004', '2024CS014') THEN 'absent'
        WHEN roll_number IN ('2024CS008') THEN 'late'
        ELSE 'present'
    END
FROM public.students
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Lecture 2
INSERT INTO public.attendance_records (session_id, student_id, status)
SELECT 
    '11111111-1111-1111-1111-111111111102'::uuid, 
    id, 
    CASE 
        WHEN roll_number IN ('2024CS002', '2024CS015') THEN 'absent'
        ELSE 'present'
    END
FROM public.students
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Lecture 3
INSERT INTO public.attendance_records (session_id, student_id, status)
SELECT 
    '11111111-1111-1111-1111-111111111103'::uuid, 
    id, 
    CASE 
        WHEN roll_number IN ('2024CS004', '2024CS011', '2024CS019') THEN 'absent'
        ELSE 'present'
    END
FROM public.students
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Lecture 4
INSERT INTO public.attendance_records (session_id, student_id, status)
SELECT 
    '11111111-1111-1111-1111-111111111104'::uuid, 
    id, 
    CASE 
        WHEN roll_number IN ('2024CS004', '2024CS007') THEN 'absent'
        ELSE 'present'
    END
FROM public.students
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Lab 1 (Batch B1)
INSERT INTO public.attendance_records (session_id, student_id, status)
SELECT 
    '22222222-2222-2222-2222-222222222201'::uuid, 
    id, 
    CASE 
        WHEN roll_number = '2024CS004' THEN 'absent'
        ELSE 'present'
    END
FROM public.students WHERE lab_batch = 'B1'
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Lab 1 (Batch B2)
INSERT INTO public.attendance_records (session_id, student_id, status)
SELECT 
    '22222222-2222-2222-2222-222222222202'::uuid, 
    id, 
    CASE 
        WHEN roll_number = '2024CS012' THEN 'absent'
        ELSE 'present'
    END
FROM public.students WHERE lab_batch = 'B2'
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Lab 2 (Batch B1)
INSERT INTO public.attendance_records (session_id, student_id, status)
SELECT 
    '22222222-2222-2222-2222-222222222203'::uuid, 
    id, 
    CASE 
        WHEN roll_number = '2024CS009' THEN 'absent'
        ELSE 'present'
    END
FROM public.students WHERE lab_batch = 'B1'
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Lab 2 (Batch B2)
INSERT INTO public.attendance_records (session_id, student_id, status)
SELECT 
    '22222222-2222-2222-2222-222222222204'::uuid, 
    id, 
    'present'
FROM public.students WHERE lab_batch = 'B2'
ON CONFLICT (session_id, student_id) DO NOTHING;
