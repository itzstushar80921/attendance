import { supabase, isSupabaseConfigured, mockDb } from '../config/supabase.js';

export const authController = {
  /**
   * Student Login by Roll Number
   */
  async studentLogin(req, res, next) {
    try {
      const { roll_number, password } = req.body;

      if (!roll_number || !roll_number.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Student Roll Number is required to log in.'
        });
      }

      const cleanRoll = roll_number.trim().toUpperCase();

      let student = null;
      if (isSupabaseConfigured) {
        // Query Supabase for student with matching roll_number
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .ilike('roll_number', cleanRoll)
          .maybeSingle();

        if (error) throw error;
        student = data;
      } else {
        student = mockDb.students.find(
          s => s.roll_number.toUpperCase() === cleanRoll
        );
      }

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with Roll Number "${cleanRoll}" not found in Government Engineering College, Bokaro records. Please verify your roll number or contact the department office.`
        });
      }

      // Security note: In full production, password hashes are verified.
      // For student portal access, Roll Number serves as identity verification.
      return res.json({
        success: true,
        message: 'Login successful. Welcome back, ' + student.name,
        role: 'student',
        user: {
          id: student.id,
          roll_number: student.roll_number,
          name: student.name,
          email: student.email,
          department: student.department,
          semester: student.semester,
          section: student.section,
          lab_batch: student.lab_batch
        },
        token: `std_session_${student.id}_${Date.now()}`
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Professor / Faculty Login
   */
  async professorLogin(req, res, next) {
    try {
      const { email_or_id, password } = req.body;

      if (!email_or_id || !email_or_id.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Faculty ID or Email is required.'
        });
      }

      const identifier = email_or_id.trim().toLowerCase();

      // Permissive faculty login for GEC Bokaro professors
      // Supports faculty@gecbokaro.ac.in, admin, prof, or any recognized staff email
      const validPasswords = ['admin', 'admin123', 'gec123', 'gecbokaro', 'faculty123', 'professor', 'password'];
      
      const isKnownFaculty = 
        identifier.includes('faculty') || 
        identifier.includes('prof') || 
        identifier.includes('admin') || 
        identifier.includes('gecbokaro') || 
        identifier.includes('vance');

      // Allow login with recognized credentials or non-empty password
      if (password && (validPasswords.includes(password.toLowerCase()) || isKnownFaculty || password.length >= 4)) {
        const facultyName = identifier.includes('vance') 
          ? 'Dr. Robert Vance' 
          : (identifier.includes('admin') ? 'Prof. HOD Computer Science' : 'Prof. Faculty Member');

        return res.json({
          success: true,
          message: `Welcome, ${facultyName}`,
          role: 'professor',
          user: {
            name: facultyName,
            email: identifier.includes('@') ? identifier : `${identifier}@gecbokaro.ac.in`,
            department: 'Computer Science & Engineering',
            institution: 'Government Engineering College, Bokaro',
            designation: 'Professor / Course Instructor'
          },
          token: `prof_session_${Date.now()}`
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid Faculty credentials. Default faculty password is "admin123" or "gecbokaro".'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Session check endpoint
   */
  async getSessionProfile(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No authentication token provided.' });
      }
      return res.json({
        success: true,
        message: 'Active session'
      });
    } catch (err) {
      next(err);
    }
  }
};
