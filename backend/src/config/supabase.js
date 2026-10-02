import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project-id') &&
  supabaseKey !== 'eyJhbGciOi...your-anon-key...'
);

export let supabase = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase Client initialized with URL:', supabaseUrl);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️  Supabase URL/Key not configured in .env. Initializing in-memory demo database mode.');
  console.log('👉 To connect your live Supabase database, set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env');
}

// -------------------------------------------------------------
// High-fidelity in-memory mock store for demo/offline use
// Mirrors Supabase tables when live DB is not yet connected
// -------------------------------------------------------------
export const mockDb = {
  courses: [
    { id: 'c1', code: 'CS501', name: 'Database Management Systems', department: 'Computer Science & Engineering', semester: 5, credits: 4, has_lab: true },
    { id: 'c2', code: 'CS502', name: 'Operating Systems', department: 'Computer Science & Engineering', semester: 5, credits: 4, has_lab: true },
    { id: 'c3', code: 'CS503', name: 'Computer Networks', department: 'Computer Science & Engineering', semester: 5, credits: 4, has_lab: true },
    { id: 'c4', code: 'CS504', name: 'Design & Analysis of Algorithms', department: 'Computer Science & Engineering', semester: 5, credits: 4, has_lab: false }
  ],
  students: [
    { id: 's01', roll_number: '2024CS001', name: 'Aarav Sharma', email: 'aarav.sharma@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43210' },
    { id: 's02', roll_number: '2024CS002', name: 'Aditi Verma', email: 'aditi.verma@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43211' },
    { id: 's03', roll_number: '2024CS003', name: 'Ananya Patel', email: 'ananya.patel@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43212' },
    { id: 's04', roll_number: '2024CS004', name: 'Aryan Mukherjee', email: 'aryan.m@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43213' },
    { id: 's05', roll_number: '2024CS005', name: 'Bhavya Nair', email: 'bhavya.nair@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43214' },
    { id: 's06', roll_number: '2024CS006', name: 'Chirag Joshi', email: 'chirag.j@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43215' },
    { id: 's07', roll_number: '2024CS007', name: 'Devansh Gupta', email: 'devansh.g@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43216' },
    { id: 's08', roll_number: '2024CS008', name: 'Diya Reddy', email: 'diya.reddy@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43217' },
    { id: 's09', roll_number: '2024CS009', name: 'Eshan Malhotra', email: 'eshan.m@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43218' },
    { id: 's10', roll_number: '2024CS010', name: 'Ishaan Sengupta', email: 'ishaan.s@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B1', phone: '+91 98765 43219' },
    { id: 's11', roll_number: '2024CS011', name: 'Kavya Iyer', email: 'kavya.iyer@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43220' },
    { id: 's12', roll_number: '2024CS012', name: 'Manish Kulkarni', email: 'manish.k@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43221' },
    { id: 's13', roll_number: '2024CS013', name: 'Meera Deshmukh', email: 'meera.d@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43222' },
    { id: 's14', roll_number: '2024CS014', name: 'Nikhil Choudhury', email: 'nikhil.c@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43223' },
    { id: 's15', roll_number: '2024CS015', name: 'Pooja Bhatt', email: 'pooja.b@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43224' },
    { id: 's16', roll_number: '2024CS016', name: 'Pranav Menon', email: 'pranav.m@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43225' },
    { id: 's17', roll_number: '2024CS017', name: 'Rhea Kapoor', email: 'rhea.k@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43226' },
    { id: 's18', roll_number: '2024CS018', name: 'Rohan Bhatnagar', email: 'rohan.b@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43227' },
    { id: 's19', roll_number: '2024CS019', name: 'Siddharth Rao', email: 'siddharth.r@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43228' },
    { id: 's20', roll_number: '2024CS020', name: 'Tanvi Mehta', email: 'tanvi.m@college.edu', department: 'Computer Science & Engineering', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43229' }
  ],
  sessions: [
    {
      id: 'sess-lec-1',
      class_type: 'lecture',
      course_code: 'CS501',
      course_name: 'Database Management Systems',
      date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
      time_slot: '09:00 AM - 10:00 AM',
      semester: 5,
      section: 'A',
      lab_batch: 'All',
      professor_name: 'Dr. Robert Vance',
      topic_covered: 'ER Models and Relational Schema Conversion',
      location: 'LH-201',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString()
    },
    {
      id: 'sess-lec-2',
      class_type: 'lecture',
      course_code: 'CS501',
      course_name: 'Database Management Systems',
      date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      time_slot: '09:00 AM - 10:00 AM',
      semester: 5,
      section: 'A',
      lab_batch: 'All',
      professor_name: 'Dr. Robert Vance',
      topic_covered: 'SQL Joins, Subqueries and Aggregations',
      location: 'LH-201',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 'sess-lec-3',
      class_type: 'lecture',
      course_code: 'CS501',
      course_name: 'Database Management Systems',
      date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      time_slot: '10:00 AM - 11:00 AM',
      semester: 5,
      section: 'A',
      lab_batch: 'All',
      professor_name: 'Dr. Robert Vance',
      topic_covered: 'Normalization: 1NF, 2NF, 3NF and BCNF',
      location: 'LH-201',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString()
    },
    {
      id: 'sess-lec-4',
      class_type: 'lecture',
      course_code: 'CS501',
      course_name: 'Database Management Systems',
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      time_slot: '09:00 AM - 10:00 AM',
      semester: 5,
      section: 'A',
      lab_batch: 'All',
      professor_name: 'Dr. Robert Vance',
      topic_covered: 'Transaction Management & ACID properties',
      location: 'LH-201',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'sess-lab-1',
      class_type: 'lab',
      course_code: 'CS501',
      course_name: 'Database Management Systems Lab',
      date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
      time_slot: '02:00 PM - 04:00 PM',
      semester: 5,
      section: 'A',
      lab_batch: 'B1',
      professor_name: 'Dr. Robert Vance',
      topic_covered: 'Lab 1: PostgreSQL DDL & DML Commands',
      location: 'CS Lab-3',
      created_at: new Date(Date.now() - 12 * 86400000).toISOString()
    },
    {
      id: 'sess-lab-2',
      class_type: 'lab',
      course_code: 'CS501',
      course_name: 'Database Management Systems Lab',
      date: new Date(Date.now() - 11 * 86400000).toISOString().split('T')[0],
      time_slot: '02:00 PM - 04:00 PM',
      semester: 5,
      section: 'A',
      lab_batch: 'B2',
      professor_name: 'Dr. Robert Vance',
      topic_covered: 'Lab 1: PostgreSQL DDL & DML Commands',
      location: 'CS Lab-3',
      created_at: new Date(Date.now() - 11 * 86400000).toISOString()
    },
    {
      id: 'sess-lab-3',
      class_type: 'lab',
      course_code: 'CS501',
      course_name: 'Database Management Systems Lab',
      date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      time_slot: '02:00 PM - 04:00 PM',
      semester: 5,
      section: 'A',
      lab_batch: 'B1',
      professor_name: 'Dr. Robert Vance',
      topic_covered: 'Lab 2: Complex Joins and View Creation',
      location: 'CS Lab-3',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'sess-lab-4',
      class_type: 'lab',
      course_code: 'CS501',
      course_name: 'Database Management Systems Lab',
      date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      time_slot: '02:00 PM - 04:00 PM',
      semester: 5,
      section: 'A',
      lab_batch: 'B2',
      professor_name: 'Dr. Robert Vance',
      topic_covered: 'Lab 2: Complex Joins and View Creation',
      location: 'CS Lab-3',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    }
  ],
  records: []
};

// Initialize default mock attendance records
(function initializeMockAttendance() {
  const students = mockDb.students;
  // Lec 1
  students.forEach(st => {
    let status = 'present';
    if (st.roll_number === '2024CS004' || st.roll_number === '2024CS014') status = 'absent';
    if (st.roll_number === '2024CS008') status = 'late';
    mockDb.records.push({
      id: `rec-lec1-${st.id}`,
      session_id: 'sess-lec-1',
      student_id: st.id,
      status,
      marked_at: new Date(Date.now() - 14 * 86400000).toISOString()
    });
  });

  // Lec 2
  students.forEach(st => {
    let status = 'present';
    if (st.roll_number === '2024CS002' || st.roll_number === '2024CS015') status = 'absent';
    mockDb.records.push({
      id: `rec-lec2-${st.id}`,
      session_id: 'sess-lec-2',
      student_id: st.id,
      status,
      marked_at: new Date(Date.now() - 10 * 86400000).toISOString()
    });
  });

  // Lec 3
  students.forEach(st => {
    let status = 'present';
    if (['2024CS004', '2024CS011', '2024CS019'].includes(st.roll_number)) status = 'absent';
    mockDb.records.push({
      id: `rec-lec3-${st.id}`,
      session_id: 'sess-lec-3',
      student_id: st.id,
      status,
      marked_at: new Date(Date.now() - 6 * 86400000).toISOString()
    });
  });

  // Lec 4
  students.forEach(st => {
    let status = 'present';
    if (['2024CS004', '2024CS007'].includes(st.roll_number)) status = 'absent';
    mockDb.records.push({
      id: `rec-lec4-${st.id}`,
      session_id: 'sess-lec-4',
      student_id: st.id,
      status,
      marked_at: new Date(Date.now() - 2 * 86400000).toISOString()
    });
  });

  // Lab 1 (B1)
  students.filter(s => s.lab_batch === 'B1').forEach(st => {
    const status = st.roll_number === '2024CS004' ? 'absent' : 'present';
    mockDb.records.push({
      id: `rec-lab1-${st.id}`,
      session_id: 'sess-lab-1',
      student_id: st.id,
      status,
      marked_at: new Date(Date.now() - 12 * 86400000).toISOString()
    });
  });

  // Lab 1 (B2)
  students.filter(s => s.lab_batch === 'B2').forEach(st => {
    const status = st.roll_number === '2024CS012' ? 'absent' : 'present';
    mockDb.records.push({
      id: `rec-lab2-${st.id}`,
      session_id: 'sess-lab-2',
      student_id: st.id,
      status,
      marked_at: new Date(Date.now() - 11 * 86400000).toISOString()
    });
  });

  // Lab 2 (B1)
  students.filter(s => s.lab_batch === 'B1').forEach(st => {
    const status = st.roll_number === '2024CS009' ? 'absent' : 'present';
    mockDb.records.push({
      id: `rec-lab3-${st.id}`,
      session_id: 'sess-lab-3',
      student_id: st.id,
      status,
      marked_at: new Date(Date.now() - 5 * 86400000).toISOString()
    });
  });

  // Lab 2 (B2)
  students.filter(s => s.lab_batch === 'B2').forEach(st => {
    mockDb.records.push({
      id: `rec-lab4-${st.id}`,
      session_id: 'sess-lab-4',
      student_id: st.id,
      status: 'present',
      marked_at: new Date(Date.now() - 4 * 86400000).toISOString()
    });
  });
})();
