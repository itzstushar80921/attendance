import { supabase, isSupabaseConfigured, mockDb } from '../config/supabase.js';

/**
 * Controller for Unified & Detailed Attendance Reports
 */
export const reportController = {
  /**
   * Unified Attendance Report
   * Aggregates Lecture and Lab attendance separately and in unified view for all students
   */
  async getUnifiedReport(req, res, next) {
    try {
      const { semester, course_code, month, section } = req.query;

      let students = [];
      let sessions = [];
      let records = [];

      if (isSupabaseConfigured) {
        // 1. Fetch Students
        let stQuery = supabase.from('students').select('*').order('roll_number', { ascending: true });
        if (semester) stQuery = stQuery.eq('semester', parseInt(semester, 10));
        if (section) stQuery = stQuery.eq('section', section);
        const { data: stData, error: stErr } = await stQuery;
        if (stErr) throw stErr;
        students = stData || [];

        // 2. Fetch Sessions
        let sessQuery = supabase.from('attendance_sessions').select('*');
        if (semester) sessQuery = sessQuery.eq('semester', parseInt(semester, 10));
        if (course_code) sessQuery = sessQuery.eq('course_code', course_code);
        if (section) sessQuery = sessQuery.eq('section', section);
        const { data: sessData, error: sessErr } = await sessQuery;
        if (sessErr) throw sessErr;
        sessions = sessData || [];

        // 3. Fetch Records
        if (sessions.length > 0) {
          const sessionIds = sessions.map(s => s.id);
          const { data: recData, error: recErr } = await supabase
            .from('attendance_records')
            .select('*')
            .in('session_id', sessionIds);
          if (recErr) throw recErr;
          records = recData || [];
        }
      } else {
        // Mock DB fallback
        students = [...mockDb.students];
        if (semester) students = students.filter(s => s.semester === parseInt(semester, 10));
        if (section) students = students.filter(s => s.section === section);

        sessions = [...mockDb.sessions];
        if (semester) sessions = sessions.filter(s => s.semester === parseInt(semester, 10));
        if (course_code) sessions = sessions.filter(s => s.course_code === course_code);
        if (section) sessions = sessions.filter(s => s.section === section);

        const sessionIds = new Set(sessions.map(s => s.id));
        records = mockDb.records.filter(r => sessionIds.has(r.session_id));
      }

      // Filter by Month if specified (format YYYY-MM)
      if (month && month !== 'all') {
        sessions = sessions.filter(s => s.date.startsWith(month));
        const filteredSessionIds = new Set(sessions.map(s => s.id));
        records = records.filter(r => filteredSessionIds.has(r.session_id));
      }

      const lectureSessions = sessions.filter(s => s.class_type === 'lecture');
      const labSessions = sessions.filter(s => s.class_type === 'lab');

      // Create quick record lookup: session_id + student_id -> status
      const recordMap = new Map();
      records.forEach(r => {
        recordMap.set(`${r.session_id}_${r.student_id}`, r.status);
      });

      // Calculate per student metrics
      const studentReports = students.map(student => {
        // Lecture stats
        const studentLectureSessions = lectureSessions;
        let lecturesAttended = 0;
        studentLectureSessions.forEach(sess => {
          const status = recordMap.get(`${sess.id}_${student.id}`);
          if (status === 'present' || status === 'late') {
            lecturesAttended++;
          }
        });
        const lecturesConducted = studentLectureSessions.length;
        const lecturePercentage = lecturesConducted > 0 
          ? Math.round((lecturesAttended / lecturesConducted) * 100) 
          : 100;

        // Lab stats (only sessions where lab_batch is 'All' or matches student's batch)
        const studentLabSessions = labSessions.filter(
          s => !s.lab_batch || s.lab_batch === 'All' || s.lab_batch === student.lab_batch
        );
        let labsAttended = 0;
        studentLabSessions.forEach(sess => {
          const status = recordMap.get(`${sess.id}_${student.id}`);
          if (status === 'present' || status === 'late') {
            labsAttended++;
          }
        });
        const labsConducted = studentLabSessions.length;
        const labPercentage = labsConducted > 0 
          ? Math.round((labsAttended / labsConducted) * 100) 
          : 100;

        // Unified / Combined stats
        const totalConducted = lecturesConducted + labsConducted;
        const totalAttended = lecturesAttended + labsAttended;
        const overallPercentage = totalConducted > 0 
          ? Math.round((totalAttended / totalConducted) * 100) 
          : 100;

        return {
          id: student.id,
          roll_number: student.roll_number,
          name: student.name,
          department: student.department,
          semester: student.semester,
          section: student.section,
          lab_batch: student.lab_batch,
          email: student.email,
          lecture: {
            conducted: lecturesConducted,
            attended: lecturesAttended,
            absent: lecturesConducted - lecturesAttended,
            percentage: lecturePercentage
          },
          lab: {
            conducted: labsConducted,
            attended: labsAttended,
            absent: labsConducted - labsAttended,
            percentage: labPercentage
          },
          overall: {
            conducted: totalConducted,
            attended: totalAttended,
            absent: totalConducted - totalAttended,
            percentage: overallPercentage
          },
          is_low_attendance: overallPercentage < 75,
          classes_needed_for_75: overallPercentage < 75 ? Math.max(0, Math.ceil(3 * totalConducted - 4 * totalAttended)) : 0,
          classes_can_miss: overallPercentage >= 75 && totalConducted > 0 ? Math.max(0, Math.floor((4 * totalAttended - 3 * totalConducted) / 3)) : 0
        };
      });

      // Class-wide summary metrics
      const totalStudents = studentReports.length;
      const avgLecturePct = totalStudents > 0 
        ? Math.round(studentReports.reduce((acc, s) => acc + s.lecture.percentage, 0) / totalStudents) 
        : 0;
      const avgLabPct = totalStudents > 0 
        ? Math.round(studentReports.reduce((acc, s) => acc + s.lab.percentage, 0) / totalStudents) 
        : 0;
      const avgOverallPct = totalStudents > 0 
        ? Math.round(studentReports.reduce((acc, s) => acc + s.overall.percentage, 0) / totalStudents) 
        : 0;
      const lowAttendanceCount = studentReports.filter(s => s.is_low_attendance).length;

      // Monthly Trend Aggregation for Charts
      const monthMap = {};
      sessions.forEach(sess => {
        const mKey = sess.date.substring(0, 7); // YYYY-MM
        if (!monthMap[mKey]) {
          monthMap[mKey] = {
            month: mKey,
            lecture_sessions: 0,
            lab_sessions: 0,
            lecture_presents: 0,
            lecture_total_marked: 0,
            lab_presents: 0,
            lab_total_marked: 0
          };
        }
        if (sess.class_type === 'lecture') {
          monthMap[mKey].lecture_sessions++;
        } else {
          monthMap[mKey].lab_sessions++;
        }
      });

      records.forEach(r => {
        const sess = sessions.find(s => s.id === r.session_id);
        if (!sess) return;
        const mKey = sess.date.substring(0, 7);
        if (monthMap[mKey]) {
          const isAttended = r.status === 'present' || r.status === 'late';
          if (sess.class_type === 'lecture') {
            monthMap[mKey].lecture_total_marked++;
            if (isAttended) monthMap[mKey].lecture_presents++;
          } else {
            monthMap[mKey].lab_total_marked++;
            if (isAttended) monthMap[mKey].lab_presents++;
          }
        }
      });

      const monthlyTrends = Object.values(monthMap)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(m => ({
          month: m.month,
          lecturePct: m.lecture_total_marked > 0 ? Math.round((m.lecture_presents / m.lecture_total_marked) * 100) : 0,
          labPct: m.lab_total_marked > 0 ? Math.round((m.lab_presents / m.lab_total_marked) * 100) : 0,
          totalSessions: m.lecture_sessions + m.lab_sessions
        }));

      return res.json({
        success: true,
        summary: {
          totalStudents,
          totalLectureSessions: lectureSessions.length,
          totalLabSessions: labSessions.length,
          totalSessions: sessions.length,
          avgLecturePercentage: avgLecturePct,
          avgLabPercentage: avgLabPct,
          avgOverallPercentage: avgOverallPct,
          lowAttendanceCount,
          goodAttendanceCount: totalStudents - lowAttendanceCount
        },
        monthlyTrends,
        students: studentReports
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Detailed Report for a Single Student
   * Shows monthly and semester-wise attendance for both lectures and labs
   */
  async getStudentDetailedReport(req, res, next) {
    try {
      const { studentId } = req.params;

      let student = null;
      let sessions = [];
      let records = [];

      const targetSemester = req.query.semester ? parseInt(req.query.semester, 10) : null;

      if (isSupabaseConfigured) {
        let stQuery = supabase.from('students').select('*');
        // Support lookup by UUID or roll_number
        if (studentId.includes('-') && studentId.length > 20) {
          stQuery = stQuery.eq('id', studentId);
        } else {
          stQuery = stQuery.eq('roll_number', studentId);
        }

        const { data: stData, error: stErr } = await stQuery.maybeSingle();
        if (stErr || !stData) {
          return res.status(404).json({ success: false, message: 'Student not found with identifier ' + studentId });
        }
        student = stData;

        const effectiveSemester = targetSemester || student.semester;

        // Fetch all sessions for effective semester
        const { data: sessData, error: sessErr } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('semester', effectiveSemester)
          .order('date', { ascending: false });
        if (sessErr) throw sessErr;
        sessions = sessData || [];

        // Fetch records for this student
        const { data: recData, error: recErr } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('student_id', student.id);
        if (recErr) throw recErr;
        records = recData || [];
      } else {
        student = mockDb.students.find(s => s.id === studentId || s.roll_number.toLowerCase() === studentId.toLowerCase());
        if (!student) {
          return res.status(404).json({ success: false, message: 'Student not found with identifier ' + studentId });
        }
        const effectiveSemester = targetSemester || student.semester;
        sessions = mockDb.sessions
          .filter(s => s.semester === effectiveSemester)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        records = mockDb.records.filter(r => r.student_id === student.id);
      }

      const effectiveSemester = targetSemester || student.semester;
      const recordMap = new Map();
      records.forEach(r => recordMap.set(r.session_id, r));

      // Filter applicable sessions for this student
      const applicableSessions = sessions.filter(sess => {
        if (sess.class_type === 'lecture') return true;
        if (!sess.lab_batch || sess.lab_batch === 'All' || sess.lab_batch === student.lab_batch) return true;
        return false;
      });

      // Session-by-session history with extra class metadata
      const history = applicableSessions.map(sess => {
        const rec = recordMap.get(sess.id);
        const isExtra = Boolean(
          sess.is_extra_class === true || 
          (typeof sess.topic_covered === 'string' && sess.topic_covered.includes('[EXTRA CLASS'))
        );
        let extraReason = sess.extra_reason || null;
        if (!extraReason && typeof sess.topic_covered === 'string' && sess.topic_covered.includes('[EXTRA CLASS:')) {
          const match = sess.topic_covered.match(/\[EXTRA CLASS:\s*([^\]]+)\]/);
          if (match) extraReason = match[1].trim();
        }

        return {
          session_id: sess.id,
          class_type: sess.class_type,
          course_code: sess.course_code,
          course_name: sess.course_name,
          date: sess.date,
          time_slot: sess.time_slot,
          location: sess.location,
          topic_covered: sess.topic_covered,
          is_extra_class: isExtra,
          extra_reason: extraReason,
          status: rec ? rec.status : 'unmarked',
          remarks: rec ? rec.remarks : null,
          marked_at: rec ? rec.marked_at : null
        };
      });

      // Monthly aggregation
      const monthlyMap = {};
      history.forEach(item => {
        const mKey = item.date.substring(0, 7); // YYYY-MM
        if (!monthlyMap[mKey]) {
          monthlyMap[mKey] = {
            month: mKey,
            lecture: { conducted: 0, attended: 0, absent: 0 },
            lab: { conducted: 0, attended: 0, absent: 0 },
            total: { conducted: 0, attended: 0, absent: 0 }
          };
        }

        const isAttended = item.status === 'present' || item.status === 'late';
        const type = item.class_type; // 'lecture' or 'lab'

        monthlyMap[mKey][type].conducted++;
        monthlyMap[mKey].total.conducted++;

        if (isAttended) {
          monthlyMap[mKey][type].attended++;
          monthlyMap[mKey].total.attended++;
        } else {
          monthlyMap[mKey][type].absent++;
          monthlyMap[mKey].total.absent++;
        }
      });

      const monthlyBreakdown = Object.values(monthlyMap)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(m => ({
          month: m.month,
          lecture: {
            ...m.lecture,
            percentage: m.lecture.conducted > 0 ? Math.round((m.lecture.attended / m.lecture.conducted) * 100) : 100
          },
          lab: {
            ...m.lab,
            percentage: m.lab.conducted > 0 ? Math.round((m.lab.attended / m.lab.conducted) * 100) : 100
          },
          total: {
            ...m.total,
            percentage: m.total.conducted > 0 ? Math.round((m.total.attended / m.total.conducted) * 100) : 100
          }
        }));

      // Semester totals
      const lectureItems = history.filter(h => h.class_type === 'lecture');
      const labItems = history.filter(h => h.class_type === 'lab');

      const lectureAttended = lectureItems.filter(h => h.status === 'present' || h.status === 'late').length;
      const labAttended = labItems.filter(h => h.status === 'present' || h.status === 'late').length;

      const totalConducted = history.length;
      const totalAttended = lectureAttended + labAttended;
      const overallPercentage = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 100;

      // Regular vs Extra Class breakdown
      const extraItems = history.filter(h => h.is_extra_class);
      const regularItems = history.filter(h => !h.is_extra_class);
      const extraAttended = extraItems.filter(h => h.status === 'present' || h.status === 'late').length;
      const regularAttended = regularItems.filter(h => h.status === 'present' || h.status === 'late').length;

      // Subject-wise Breakdown
      const subjectMap = {};
      history.forEach(item => {
        const key = item.course_code;
        if (!subjectMap[key]) {
          subjectMap[key] = {
            course_code: key,
            course_name: item.course_name,
            total_conducted: 0,
            attended: 0,
            absent: 0,
            lecture_conducted: 0,
            lecture_attended: 0,
            lab_conducted: 0,
            lab_attended: 0,
            extra_conducted: 0,
            extra_attended: 0
          };
        }
        subjectMap[key].total_conducted++;
        const isAttended = item.status === 'present' || item.status === 'late';
        if (isAttended) subjectMap[key].attended++;
        else subjectMap[key].absent++;

        if (item.class_type === 'lecture') {
          subjectMap[key].lecture_conducted++;
          if (isAttended) subjectMap[key].lecture_attended++;
        } else {
          subjectMap[key].lab_conducted++;
          if (isAttended) subjectMap[key].lab_attended++;
        }

        if (item.is_extra_class) {
          subjectMap[key].extra_conducted++;
          if (isAttended) subjectMap[key].extra_attended++;
        }
      });

      const subjects = Object.values(subjectMap).map(subj => {
        const pct = subj.total_conducted > 0 ? Math.round((subj.attended / subj.total_conducted) * 100) : 100;
        const classesNeeded = (subj.total_conducted > 0 && pct < 75)
          ? Math.max(0, Math.ceil(3 * subj.total_conducted - 4 * subj.attended))
          : 0;
        return {
          ...subj,
          percentage: pct,
          is_eligible: pct >= 75,
          classes_needed_for_75: classesNeeded
        };
      });

      // 75% Attendance Safeguard / Target Calculator formula
      // Condition: (Attended + X) / (Conducted + X) >= 0.75
      // 0.25 * X >= 0.75 * Conducted - Attended  =>  X >= 3 * Conducted - 4 * Attended
      const classesNeededFor75 = overallPercentage < 75 && totalConducted > 0
        ? Math.max(0, Math.ceil(3 * totalConducted - 4 * totalAttended))
        : 0;
      
      // If student is at or above 75%, how many classes can they safely miss?
      // Attended / (Conducted + M) >= 0.75  =>  0.75 * M <= Attended - 0.75 * Conducted => M <= (4*Attended - 3*Conducted) / 3
      const classesCanAffordToMiss = overallPercentage >= 75 && totalConducted > 0
        ? Math.max(0, Math.floor((4 * totalAttended - 3 * totalConducted) / 3))
        : 0;

      return res.json({
        success: true,
        student,
        effectiveSemester,
        target75Analysis: {
          requiredPercentage: 75,
          currentPercentage: overallPercentage,
          isEligible: overallPercentage >= 75,
          classesNeededFor75,
          classesCanAffordToMiss,
          totalConducted,
          totalAttended,
          statusMessage: overallPercentage >= 75
            ? `Eligible: Attendance is ${overallPercentage}%. You can safely miss up to ${classesCanAffordToMiss} upcoming class${classesCanAffordToMiss === 1 ? '' : 'es'} while maintaining at least 75%.`
            : `Warning: Attendance is ${overallPercentage}%. You need to attend the next ${classesNeededFor75} consecutive class${classesNeededFor75 === 1 ? '' : 'es'} without absence to reach the 75% requirement.`
        },
        semesterSummary: {
          semester: effectiveSemester,
          lecture: {
            conducted: lectureItems.length,
            attended: lectureAttended,
            absent: lectureItems.length - lectureAttended,
            percentage: lectureItems.length > 0 ? Math.round((lectureAttended / lectureItems.length) * 100) : 100
          },
          lab: {
            conducted: labItems.length,
            attended: labAttended,
            absent: labItems.length - labAttended,
            percentage: labItems.length > 0 ? Math.round((labAttended / labItems.length) * 100) : 100
          },
          overall: {
            conducted: totalConducted,
            attended: totalAttended,
            absent: totalConducted - totalAttended,
            percentage: overallPercentage
          },
          extraClasses: {
            conducted: extraItems.length,
            attended: extraAttended,
            regularConducted: regularItems.length,
            regularAttended: regularAttended
          },
          is_low_attendance: totalConducted > 0 && overallPercentage < 75
        },
        subjects,
        monthlyBreakdown,
        history
      });
    } catch (err) {
      next(err);
    }
  }
};
