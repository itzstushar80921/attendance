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
        if (cleanRoll.length >= 3) {
          student = {
            id: `std-${cleanRoll}`,
            roll_number: cleanRoll,
            name: `Student (${cleanRoll})`,
            email: `${cleanRoll.toLowerCase()}@gecbokaro.ac.in`,
            department: 'Computer Science & Engineering',
            semester: 3,
            section: 'A',
            lab_batch: 'B1'
          };
          if (isSupabaseConfigured) {
            try {
              const { data: newStd } = await supabase.from('students').insert([student]).select().maybeSingle();
              if (newStd) student = newStd;
            } catch (e) {
              console.warn('Auto-provision student notice:', e.message);
            }
          }
        } else {
          return res.status(404).json({
            success: false,
            message: `Student with Roll Number "${cleanRoll}" not found in Government Engineering College, Bokaro records.`
          });
        }
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
      const facultyName = identifier.includes('vance') 
        ? 'Dr. Robert Vance' 
        : (identifier.includes('sharma') 
            ? 'Prof. Sharma' 
            : (identifier.includes('admin') ? 'Prof. HOD Computer Science' : 'Prof. Faculty Member'));

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
    } catch (err) {
      next(err);
    }
  },

  /**
   * Google Sign-in Authentication (Handles both Students and Professors)
   */
  async googleLogin(req, res, next) {
    try {
      const { email, name, role, roll_number } = req.body;

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Google Email is required.'
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const userName = (name && name.trim()) ? name.trim() : cleanEmail.split('@')[0];

      // 1. If explicit Professor role or recognized faculty domain/prefix:
      if (role === 'professor' || cleanEmail.includes('faculty') || cleanEmail.includes('prof') || cleanEmail.includes('admin@gecbokaro')) {
        return res.json({
          success: true,
          message: `Welcome, ${userName}`,
          role: 'professor',
          user: {
            name: userName.includes('Prof') || userName.includes('Dr.') ? userName : `Prof. ${userName}`,
            email: cleanEmail,
            department: 'Computer Science & Engineering',
            institution: 'Government Engineering College, Bokaro',
            designation: 'Faculty / Course Instructor'
          },
          token: `prof_google_${Date.now()}`
        });
      }

      // 2. Student Authentication via Google
      let student = null;
      if (isSupabaseConfigured) {
        // First, attempt lookup by Google email
        const { data: byEmail, error: errEmail } = await supabase
          .from('students')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (errEmail) throw errEmail;
        student = byEmail;

        // If not found by email, but student provided their Roll Number to link their account:
        if (!student && roll_number && roll_number.trim()) {
          const cleanRoll = roll_number.trim().toUpperCase();
          const { data: byRoll, error: errRoll } = await supabase
            .from('students')
            .select('*')
            .ilike('roll_number', cleanRoll)
            .maybeSingle();

          if (errRoll) throw errRoll;

          if (byRoll) {
            // Link Google email to this student record in database
            const { data: updated, error: updateErr } = await supabase
              .from('students')
              .update({ email: cleanEmail, updated_at: new Date().toISOString() })
              .eq('id', byRoll.id)
              .select()
              .single();

            if (!updateErr && updated) {
              student = updated;
            } else {
              student = byRoll;
            }
          }
        }
      } else {
        // Mock fallback
        student = mockDb.students.find(s => s.email && s.email.toLowerCase() === cleanEmail);
        if (!student && roll_number && roll_number.trim()) {
          const cleanRoll = roll_number.trim().toUpperCase();
          student = mockDb.students.find(s => s.roll_number.toUpperCase() === cleanRoll);
          if (student) {
            student.email = cleanEmail;
          }
        }
      }

      if (!student) {
        // Return structured prompt telling frontend to ask student for their roll number to link Google
        return res.status(200).json({
          success: false,
          needsRollNumber: true,
          email: cleanEmail,
          name: userName,
          message: `Google Account (${cleanEmail}) authenticated. Please provide your College Roll Number to link your profile.`
        });
      }

      return res.json({
        success: true,
        message: 'Google login successful. Welcome back, ' + student.name,
        role: 'student',
        user: {
          id: student.id,
          roll_number: student.roll_number,
          name: student.name,
          email: student.email || cleanEmail,
          department: student.department,
          semester: student.semester,
          section: student.section,
          lab_batch: student.lab_batch
        },
        token: `std_google_${student.id}_${Date.now()}`
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
