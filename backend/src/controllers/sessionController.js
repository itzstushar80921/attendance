import { supabase, isSupabaseConfigured, mockDb } from '../config/supabase.js';

/**
 * Controller for Attendance Sessions (Lecture / Lab)
 */
export const sessionController = {
  /**
   * Create a new attendance session (Lecture or Lab)
   */
  async createSession(req, res, next) {
    try {
      const {
        class_type,
        course_code,
        course_name,
        date,
        time_slot,
        semester,
        section,
        lab_batch,
        professor_name,
        topic_covered,
        location
      } = req.body;

      if (!class_type || !['lecture', 'lab'].includes(class_type)) {
        return res.status(400).json({ 
          success: false, 
          message: "Class type is required and must be either 'lecture' or 'lab'" 
        });
      }

      if (!course_code || !time_slot) {
        return res.status(400).json({ 
          success: false, 
          message: 'Course code and time slot are required' 
        });
      }

      const sessionData = {
        class_type,
        course_code,
        course_name: course_name || course_code,
        date: date || new Date().toISOString().split('T')[0],
        time_slot,
        semester: semester ? parseInt(semester, 10) : 5,
        section: section || 'A',
        lab_batch: class_type === 'lab' ? (lab_batch || 'B1') : 'All',
        professor_name: professor_name || 'Dr. Robert Vance',
        topic_covered: topic_covered || '',
        location: location || (class_type === 'lab' ? 'CS Lab' : 'LH-201')
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('attendance_sessions')
          .insert([sessionData])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
      }

      // Mock DB
      const newId = `sess-${Date.now()}`;
      const sessionWithId = {
        id: newId,
        ...sessionData,
        created_at: new Date().toISOString()
      };
      mockDb.sessions.unshift(sessionWithId);

      return res.status(201).json({ success: true, data: sessionWithId });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get sessions with optional class_type filter (lecture vs lab)
   */
  async getSessions(req, res, next) {
    try {
      const { class_type, course_code, semester, date } = req.query;

      if (isSupabaseConfigured) {
        let query = supabase
          .from('attendance_sessions')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (class_type && class_type !== 'all') {
          query = query.eq('class_type', class_type);
        }
        if (course_code) query = query.eq('course_code', course_code);
        if (semester) query = query.eq('semester', parseInt(semester, 10));
        if (date) query = query.eq('date', date);

        const { data, error } = await query;
        if (error) throw error;
        return res.json({ success: true, count: data.length, data });
      }

      // Mock fallback
      let list = [...mockDb.sessions];
      if (class_type && class_type !== 'all') {
        list = list.filter(s => s.class_type === class_type);
      }
      if (course_code) list = list.filter(s => s.course_code === course_code);
      if (semester) list = list.filter(s => s.semester === parseInt(semester, 10));
      if (date) list = list.filter(s => s.date === date);

      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json({ success: true, count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get single session with its attendance records
   */
  async getSessionById(req, res, next) {
    try {
      const { id } = req.params;

      if (isSupabaseConfigured) {
        const { data: session, error: sErr } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (sErr || !session) {
          return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const { data: records, error: rErr } = await supabase
          .from('attendance_records')
          .select('*, students(id, roll_number, name, lab_batch)')
          .eq('session_id', id);

        if (rErr) throw rErr;

        return res.json({ success: true, data: { ...session, records: records || [] } });
      }

      // Mock
      const session = mockDb.sessions.find(s => s.id === id);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      const records = mockDb.records
        .filter(r => r.session_id === id)
        .map(r => {
          const student = mockDb.students.find(st => st.id === r.student_id);
          return {
            ...r,
            students: student ? {
              id: student.id,
              roll_number: student.roll_number,
              name: student.name,
              lab_batch: student.lab_batch
            } : null
          };
        });

      return res.json({ success: true, data: { ...session, records } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete session
   */
  async deleteSession(req, res, next) {
    try {
      const { id } = req.params;

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('attendance_sessions')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.json({ success: true, message: 'Session and its attendance records deleted' });
      }

      mockDb.sessions = mockDb.sessions.filter(s => s.id !== id);
      mockDb.records = mockDb.records.filter(r => r.session_id !== id);

      return res.json({ success: true, message: 'Session and its attendance records deleted' });
    } catch (err) {
      next(err);
    }
  }
};
