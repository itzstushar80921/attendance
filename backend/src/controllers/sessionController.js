import { supabase, isSupabaseConfigured, mockDb } from '../config/supabase.js';

/**
 * Helper to normalize and attach extra class and cancellation metadata
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

  const isCancelled = Boolean(
    s.is_cancelled === true ||
    (typeof s.topic_covered === 'string' && s.topic_covered.includes('[CANCELLED'))
  );
  let cancellationReason = s.cancellation_reason || null;
  if (!cancellationReason && typeof s.topic_covered === 'string' && s.topic_covered.includes('[CANCELLED')) {
    const match = s.topic_covered.match(/\[CANCELLED(?::\s*([^\]]+))?\]/);
    if (match && match[1]) cancellationReason = match[1].trim();
  }

  // Pure topic without tags for clean UI display
  let cleanTopic = s.topic_covered || '';
  if (typeof cleanTopic === 'string') {
    cleanTopic = cleanTopic
      .replace(/\[CANCELLED:[^\]]*\]\s*/gi, '')
      .replace(/\[CANCELLED\]\s*/gi, '')
      .replace(/\[EXTRA CLASS:[^\]]*\]\s*/gi, '')
      .replace(/\[EXTRA CLASS\]\s*/gi, '')
      .trim();
  }

  return {
    ...s,
    is_extra_class: isExtra,
    extra_reason: extraReason,
    is_cancelled: isCancelled,
    cancellation_reason: cancellationReason,
    clean_topic: cleanTopic
  };
};

/**
 * Controller for Attendance Sessions (Lecture / Lab / Extra Classes / Cancellations)
 */
export const sessionController = {
  /**
   * Create a new attendance session (Regular Lecture, Lab, or Extra Class)
   * Prevents duplicate session lodging
   */
  async createSession(req, res, next) {
    try {
      const class_type = req.body.class_type || req.body.type;
      const {
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

      if (!class_type || !['lecture', 'lab'].includes(class_type.toLowerCase())) {
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

      const sessionDate = date || new Date().toISOString().split('T')[0];
      const targetSem = semester ? parseInt(semester, 10) : 5;
      const targetSec = section ? section.trim().toUpperCase() : 'A';
      const targetBatch = class_type === 'lab' ? (lab_batch ? lab_batch.trim().toUpperCase() : 'B1') : 'All';

      // DUPLICATE CHECK: Prevent lodging duplicate session for identical course, date, slot, sem, sec, batch
      if (isSupabaseConfigured) {
        const { data: existingSess } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('course_code', course_code)
          .eq('date', sessionDate)
          .eq('time_slot', time_slot)
          .eq('semester', targetSem)
          .eq('section', targetSec)
          .eq('lab_batch', targetBatch)
          .maybeSingle();

        if (existingSess) {
          return res.status(200).json({
            success: true,
            isExisting: true,
            message: `A session for ${course_code} (${time_slot}) on ${sessionDate} already exists. Resuming existing session.`,
            data: formatSessionWithExtra(existingSess)
          });
        }
      } else {
        const existingSess = mockDb.sessions.find(
          s => s.course_code === course_code &&
               s.date === sessionDate &&
               s.time_slot === time_slot &&
               s.semester === targetSem &&
               s.section === targetSec &&
               s.lab_batch === targetBatch
        );
        if (existingSess) {
          return res.status(200).json({
            success: true,
            isExisting: true,
            message: `A session for ${course_code} (${time_slot}) on ${sessionDate} already exists. Resuming existing session.`,
            data: formatSessionWithExtra(existingSess)
          });
        }
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
        date: sessionDate,
        time_slot,
        semester: targetSem,
        section: targetSec,
        lab_batch: targetBatch,
        professor_name: professor_name || 'Dr. Robert Vance',
        topic_covered: formattedTopic,
        location: location || (class_type === 'lab' ? 'CS Lab' : 'LH-201')
      };

      if (isSupabaseConfigured) {
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
   * Cancel a class session with a stated reason
   * Automatically updates and deducts from attendance calculations
   */
  async cancelSession(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const cleanReason = (reason && reason.trim()) ? reason.trim() : 'Cancelled by Instructor';

      if (isSupabaseConfigured) {
        // Fetch current session
        const { data: sess, error: getErr } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (getErr || !sess) {
          return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // Clean any existing cancelled tags and prepend updated cancellation tag
        let topic = sess.topic_covered || '';
        topic = topic.replace(/\[CANCELLED:[^\]]*\]\s*/gi, '').replace(/\[CANCELLED\]\s*/gi, '').trim();
        const updatedTopic = `[CANCELLED: ${cleanReason}] ${topic}`.trim();

        let updatedData = null;
        try {
          const { data, error } = await supabase
            .from('attendance_sessions')
            .update({
              is_cancelled: true,
              cancellation_reason: cleanReason,
              topic_covered: updatedTopic
            })
            .eq('id', id)
            .select()
            .single();
          if (!error && data) updatedData = data;
        } catch {
          // Fallback if is_cancelled column is not present
        }

        if (!updatedData) {
          const { data, error } = await supabase
            .from('attendance_sessions')
            .update({
              topic_covered: updatedTopic
            })
            .eq('id', id)
            .select()
            .single();
          if (error) throw error;
          updatedData = data;
        }

        const formatted = formatSessionWithExtra(updatedData);
        return res.json({
          success: true,
          message: `Class session for ${sess.course_code} cancelled successfully. Attendance records have been updated.`,
          data: formatted
        });
      }

      // Mock DB
      const sess = mockDb.sessions.find(s => s.id === id);
      if (!sess) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      let topic = sess.topic_covered || '';
      topic = topic.replace(/\[CANCELLED:[^\]]*\]\s*/gi, '').replace(/\[CANCELLED\]\s*/gi, '').trim();
      sess.topic_covered = `[CANCELLED: ${cleanReason}] ${topic}`.trim();
      sess.is_cancelled = true;
      sess.cancellation_reason = cleanReason;

      return res.json({
        success: true,
        message: `Class session for ${sess.course_code} cancelled successfully. Attendance records have been updated.`,
        data: formatSessionWithExtra(sess)
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Restore a previously cancelled session
   */
  async restoreSession(req, res, next) {
    try {
      const { id } = req.params;

      if (isSupabaseConfigured) {
        const { data: sess, error: getErr } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (getErr || !sess) {
          return res.status(404).json({ success: false, message: 'Session not found' });
        }

        let topic = sess.topic_covered || '';
        topic = topic.replace(/\[CANCELLED:[^\]]*\]\s*/gi, '').replace(/\[CANCELLED\]\s*/gi, '').trim();

        let updatedData = null;
        try {
          const { data, error } = await supabase
            .from('attendance_sessions')
            .update({
              is_cancelled: false,
              cancellation_reason: null,
              topic_covered: topic
            })
            .eq('id', id)
            .select()
            .single();
          if (!error && data) updatedData = data;
        } catch {
          // Column fallback
        }

        if (!updatedData) {
          const { data, error } = await supabase
            .from('attendance_sessions')
            .update({ topic_covered: topic })
            .eq('id', id)
            .select()
            .single();
          if (error) throw error;
          updatedData = data;
        }

        return res.json({
          success: true,
          message: 'Class session restored successfully. Attendance counts updated.',
          data: formatSessionWithExtra(updatedData)
        });
      }

      // Mock DB
      const sess = mockDb.sessions.find(s => s.id === id);
      if (!sess) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      sess.topic_covered = (sess.topic_covered || '')
        .replace(/\[CANCELLED:[^\]]*\]\s*/gi, '')
        .replace(/\[CANCELLED\]\s*/gi, '')
        .trim();
      sess.is_cancelled = false;
      sess.cancellation_reason = null;

      return res.json({
        success: true,
        message: 'Class session restored successfully. Attendance counts updated.',
        data: formatSessionWithExtra(sess)
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get sessions with optional class_type filter, extra class filter, or cancelled filter
   */
  async getSessions(req, res, next) {
    try {
      const { class_type, course_code, semester, date, is_extra_class, is_cancelled } = req.query;

      if (isSupabaseConfigured) {
        let query = supabase
          .from('attendance_sessions')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (class_type && class_type !== 'all' && class_type !== 'extra' && class_type !== 'cancelled') {
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
        if (is_cancelled !== undefined && is_cancelled !== null) {
          const wantCancelled = is_cancelled === 'true' || is_cancelled === true;
          formatted = formatted.filter(s => s.is_cancelled === wantCancelled);
        }

        return res.json({ success: true, count: formatted.length, data: formatted });
      }

      // Mock fallback
      let list = [...mockDb.sessions].map(formatSessionWithExtra);
      if (class_type && class_type !== 'all' && class_type !== 'extra' && class_type !== 'cancelled') {
        list = list.filter(s => s.class_type === class_type);
      }
      if (course_code) list = list.filter(s => s.course_code === course_code);
      if (semester) list = list.filter(s => s.semester === parseInt(semester, 10));
      if (date) list = list.filter(s => s.date === date);
      if (is_extra_class !== undefined && is_extra_class !== null) {
        const wantExtra = is_extra_class === 'true' || is_extra_class === true;
        list = list.filter(s => s.is_extra_class === wantExtra);
      }
      if (is_cancelled !== undefined && is_cancelled !== null) {
        const wantCancelled = is_cancelled === 'true' || is_cancelled === true;
        list = list.filter(s => s.is_cancelled === wantCancelled);
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

      const records = (mockDb.records || [])
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
      mockDb.records = (mockDb.records || []).filter(r => r.session_id !== id);

      return res.json({ success: true, message: 'Session and its attendance records deleted' });
    } catch (err) {
      next(err);
    }
  }
};
