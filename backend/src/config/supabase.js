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
    { id: 'c4', code: 'CS504', name: 'Design & Analysis of Algorithms', department: 'Computer Science & Engineering', semester: 5, credits: 4, has_lab: false },
    { id: 'c5', code: 'CS505', name: 'Web Technologies & Cloud Computing', department: 'Computer Science & Engineering', semester: 5, credits: 3, has_lab: true },
    { id: 'c6', code: 'DCD01', name: 'DIGITAL CIRCUITAL DESIGN', department: 'EE VLSI', semester: 3, credits: 3, has_lab: true }
  ],
  students: [
    { id: 's2504001', roll_number: '2504001', name: 'ABHIUDHAY DEEPVERMA', email: 'tkd3038@gmail.com', department: 'Computer Science & Engineering', semester: 1, section: 'A', lab_batch: 'B1', phone: '' },
    { id: 's2504002', roll_number: '2504002', name: 'ADITYA KUMAR', email: 'aditya.kumar@college.edu', department: 'EE VLSI', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43226' },
    { id: 's2504003', roll_number: '2504003', name: 'ADITYA RANJAN', email: 'aditya.ranjan@college.edu', department: 'EE VLSI', semester: 5, section: 'A', lab_batch: 'B2', phone: '+91 98765 43225' },
    { id: 's2504008', roll_number: '2504008', name: 'ANUJ YADAV', email: 'anuj.yadav@college.edu', department: 'EE VLSI', semester: 3, section: 'A', lab_batch: 'B1', phone: '+91 9798612107' }
  ],
  sessions: [],
  records: []
};
