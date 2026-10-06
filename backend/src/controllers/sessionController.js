import { supabase, isSupabaseConfigured, mockDb } from '../config/supabase.js';

/**
 * Helper to normalize and attach extra class metadata
 */
export const formatSessionWithExtra = (s) => {
  if (!s) return s;
  const isExtra = Boolean(
    s.is_extra_class === true || 
    (typeof s.topic_covered === 'string' && s.topic_covered.includes('[EXTRA CLASS'))
  );
  let extraReason = s.extra_reason || null;
  if (!extraReason && typeof s.topic_covered === 'string' && s.topic_covered.includes('[EXTRA CLASS:')) {
    const match = s.topic_covered.match(/\[EXTRA CLASS:\s*([^\]]+)\]/);
    if (match) extraReason = match[1].trim();
  }
  return {
    ...s,
    is_extra_class: isExtra,
    extra_reason: extraReason
  };
};

/**
 * Controller for Attendance Sessions (Lecture / Lab / Extra Classes)
 */
export const sessionController = {
  /**
   * Create a new attendance session (Regular Lecture, Lab, or Extra Class)
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
        location,
        is_extra_class,
        extra_reason
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

      const isExtra = Boolean(is_extra_class);
      let formattedTopic = topic_covered || '';
      if (isExtra && !formattedTopic.includes('[EXTRA CLASS')) {
        formattedTopic = `[EXTRA CLASS${extra_reason ? `: ${extra_reason}` : ''}] ${formattedTopic}`.trim();
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
        topic_covered: formattedTopic,
        location: location || (class_type === 'lab' ? 'CS Lab' : 'LH-201')
      };

      if (isSupabaseConfigured) {
        // Attempt insert with extra class fields if table has columns
        let insertedData = null;
        try {
          const { data, error } = await supabase
            .from('attendance_sessions')
            .insert([{
              ...sessionData,
              is_extra_class: isExtra,
              extra_reason: extra_reason || null
            }])
            .select()
            .single();
          if (!error && data) {
            insertedData = data;
          }
        } catch (colErr) {
          // Fallback to inserting sessionData without optional columns
        }

        if (!insertedData) {
          const { data, error } = await supabase
            .from('attendance_sessions')
            .insert([sessionData])
            .select()
            .single();

          if (error) throw error;
          insertedData = data;
        }

        return res.status(201).json({ success: true, data: formatSessionWithExtra(insertedData) });
      }

      // Mock DB
      const newId = `sess-${Date.now()}`;
      const sessionWithId = {
        id: newId,
        ...sessionData,
        is_extra_class: isExtra,
        extra_reason: extra_reason || null,
        created_at: new Date().toISOString()
      };
      mockDb.sessions.unshift(sessionWithId);

      return res.status(201).json({ success: true, data: formatSessionWithExtra(sessionWithId) });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get sessions with optional class_type filter (lecture vs lab) and extra class filter
   */
  async getSessions(req, res, next) {
    try {
      const { class_type, course_code, semester, date, is_extra_class } = req.query;

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

        let formatted = (data || []).map(formatSessionWithExtra);
        if (is_extra_class !== undefined && is_extra_class !== null) {
          const wantExtra = is_extra_class === 'true' || is_extra_class === true;
          formatted = formatted.filter(s => s.is_extra_class === wantExtra);
        }

        return res.json({ success: true, count: formatted.length, data: formatted });
      }

      // Mock fallback
      let list = [...mockDb.sessions].map(formatSessionWithExtra);
      if (class_type && class_type !== 'all') {
        list = list.filter(s => s.class_type === class_type);
      }
      if (course_code) list = list.filter(s => s.course_code === course_code);
      if (semester) list = list.filter(s => s.semester === parseInt(semester, 10));
      if (date) list = list.filter(s => s.date === date);
      if (is_extra_class !== undefined && is_extra_class !== null) {
        const wantExtra = is_extra_class === 'true' || is_extra_class === true;
        list = list.filter(s => s.is_extra_class === wantExtra);
      }

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

        return res.json({ success: true, data: { ...formatSessionWithExtra(session), records: records || [] } });
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

      return res.json({ success: true, data: { ...formatSessionWithExtra(session), records } });
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
