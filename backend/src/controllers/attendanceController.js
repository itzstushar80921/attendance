import { supabase, isSupabaseConfigured, mockDb } from '../config/supabase.js';

/**
 * Controller for Marking and Managing Attendance Records
 */
export const attendanceController = {
  /**
   * Submit or update attendance records in bulk for a session
   * Supports both Lecture and Lab sessions
   */
  async submitAttendance(req, res, next) {
    try {
      const { session_id, records } = req.body;

      if (!session_id || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'session_id and non-empty records array are required'
        });
      }

      const formattedRecords = records.map(r => ({
        session_id,
        student_id: r.student_id,
        status: r.status || 'present',
        remarks: r.remarks || null,
        marked_at: new Date().toISOString()
      }));

      if (isSupabaseConfigured) {
        // Upsert so professors can review and re-submit or amend attendance
        const { data, error } = await supabase
          .from('attendance_records')
          .upsert(formattedRecords, {
            onConflict: 'session_id,student_id'
          })
          .select();

        if (error) throw error;

        return res.json({
          success: true,
          message: `Attendance marked successfully for ${formattedRecords.length} students`,
          count: formattedRecords.length,
          data
        });
      }

      // Mock DB
      formattedRecords.forEach(rec => {
        const existingIdx = mockDb.records.findIndex(
          r => r.session_id === session_id && r.student_id === rec.student_id
        );
        if (existingIdx >= 0) {
          mockDb.records[existingIdx] = {
            ...mockDb.records[existingIdx],
            ...rec,
            id: mockDb.records[existingIdx].id
          };
        } else {
          mockDb.records.push({
            id: `rec-${Date.now()}-${rec.student_id}`,
            ...rec
          });
        }
      });

      return res.json({
        success: true,
        message: `Attendance marked successfully for ${formattedRecords.length} students`,
        count: formattedRecords.length
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Quick update for a single student's status in a session
   */
  async updateSingleRecord(req, res, next) {
    try {
      const { session_id, student_id, status, remarks } = req.body;

      if (!session_id || !student_id || !status) {
        return res.status(400).json({
          success: false,
          message: 'session_id, student_id, and status are required'
        });
      }

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('attendance_records')
          .upsert([{
            session_id,
            student_id,
            status,
            remarks: remarks || null,
            marked_at: new Date().toISOString()
          }], {
            onConflict: 'session_id,student_id'
          })
          .select()
          .single();

        if (error) throw error;
        return res.json({ success: true, data });
      }

      const existingIdx = mockDb.records.findIndex(
        r => r.session_id === session_id && r.student_id === student_id
      );

      const recordData = {
        session_id,
        student_id,
        status,
        remarks: remarks || null,
        marked_at: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        mockDb.records[existingIdx] = { ...mockDb.records[existingIdx], ...recordData };
      } else {
        mockDb.records.push({ id: `rec-${Date.now()}`, ...recordData });
      }

      return res.json({ success: true, data: recordData });
    } catch (err) {
      next(err);
    }
  }
};
