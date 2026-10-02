import React, { useState, useEffect, useCallback } from 'react';
import SessionSelector from '../components/SessionSelector';
import AttendanceSheet from '../components/AttendanceSheet';
import { api, DEFAULT_COURSES } from '../services/api';
import { CheckCircle2, ArrowRight, RotateCcw, BookOpen, FlaskConical, Building2 } from 'lucide-react';

export default function TakeAttendancePage({ onNavigateToReports }) {
  // Session Configuration State
  const [sessionConfig, setSessionConfig] = useState({
    class_type: 'lecture', // 'lecture' or 'lab'
    course_code: 'CS501',
    course_name: 'Database Management Systems',
    date: new Date().toISOString().split('T')[0],
    time_slot: '09:00 AM - 10:00 AM',
    semester: 5,
    section: 'A',
    student_cohort: 'all', // 'all', '1', '3', '5'
    lab_batch: 'All', // 'All', 'B1', 'B2', etc.
    topic_covered: '',
    location: 'LH-201',
    professor_name: 'Dr. Robert Vance'
  });

  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [students, setStudents] = useState([]);
  const [activeSessionStudents, setActiveSessionStudents] = useState([]);
  const [availableBatches, setAvailableBatches] = useState(['B1', 'B2']);
  const [isSheetActive, setIsSheetActive] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Load available courses and ALL predefined students from GEC Bokaro database
  const loadInitialData = useCallback(async () => {
    try {
      const [courseRes, studentRes] = await Promise.all([
        api.getCourses(),
        api.getStudents() // Fetch all students across all semesters
      ]);

      if (courseRes.success && Array.isArray(courseRes.data) && courseRes.data.length > 0) {
        setCourses(courseRes.data);
        const exists = courseRes.data.some(c => c.code === sessionConfig.course_code);
        if (!exists) {
          const first = courseRes.data[0];
          setSessionConfig(prev => ({
            ...prev,
            course_code: first.code,
            course_name: first.name,
            semester: first.semester || 5
          }));
        }
      }

      if (studentRes.success && Array.isArray(studentRes.data)) {
        setStudents(studentRes.data);
        if (studentRes.batches && studentRes.batches.length > 0) {
          setAvailableBatches(studentRes.batches);
        } else {
          const derived = [...new Set(studentRes.data.map(s => s.lab_batch).filter(Boolean))];
          if (derived.length > 0) setAvailableBatches(derived);
        }
      }
    } catch (err) {
      console.warn('Notice loading initial data:', err.message);
    }
  }, [sessionConfig.course_code]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // When professor clicks "Load Attendance Sheet"
  const handleStartSession = () => {
    let applicable = [...students];

    // 1. Filter by cohort / semester if selected
    if (sessionConfig.student_cohort && sessionConfig.student_cohort !== 'all') {
      const semNum = parseInt(sessionConfig.student_cohort, 10);
      const semFiltered = students.filter(s => s.semester === semNum);
      // If students exist for this semester, use them; if not, fall back to all students so sheet is never empty!
      if (semFiltered.length > 0) {
        applicable = semFiltered;
      }
    }

    // 2. Filter by lab batch if Lab class
    if (sessionConfig.class_type === 'lab' && sessionConfig.lab_batch !== 'All') {
      const batchFiltered = applicable.filter(s => s.lab_batch === sessionConfig.lab_batch);
      if (batchFiltered.length > 0) {
        applicable = batchFiltered;
      }
    }

    // If still empty (e.g. students haven't finished loading yet), use all students
    if (applicable.length === 0 && students.length > 0) {
      applicable = students;
    }

    // Default everyone to 'present' for fast mobile marking
    const initialMap = {};
    applicable.forEach(st => {
      initialMap[st.id] = 'present';
    });

    setActiveSessionStudents(applicable);
    setAttendanceMap(initialMap);
    setRemarksMap({});
    setIsSheetActive(true);
    setSubmitSuccess(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When a student's batch is edited on the card
  const handleStudentBatchChanged = (studentId, newBatch) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, lab_batch: newBatch } : s));
    setActiveSessionStudents(prev => prev.map(s => s.id === studentId ? { ...s, lab_batch: newBatch } : s));
    if (!availableBatches.includes(newBatch)) {
      setAvailableBatches(prev => [...prev, newBatch]);
    }
  };

  // Fallback to show all students
  const handleShowAllStudents = () => {
    setActiveSessionStudents(students);
    const initialMap = {};
    students.forEach(st => {
      initialMap[st.id] = attendanceMap[st.id] || 'present';
    });
    setAttendanceMap(initialMap);
  };

  // Submit attendance to backend & Supabase
  const handleSubmitAttendance = async () => {
    try {
      setIsSubmitting(true);

      // 1. Create the attendance session in the DB
      const sessionRes = await api.createSession(sessionConfig);
      if (!sessionRes.success) {
        throw new Error(sessionRes.message || 'Failed to create session');
      }

      const createdSession = sessionRes.data;

      // 2. Prepare bulk attendance records
      const recordsToSubmit = Object.entries(attendanceMap).map(([studentId, status]) => ({
        student_id: studentId,
        status,
        remarks: remarksMap[studentId] || null
      }));

      // 3. Submit records
      const attendanceRes = await api.submitAttendance(createdSession.id, recordsToSubmit);
      if (!attendanceRes.success) {
        throw new Error(attendanceRes.message || 'Failed to submit attendance records');
      }

      // Calculate stats for confirmation screen
      const total = recordsToSubmit.length;
      const present = recordsToSubmit.filter(r => r.status === 'present').length;
      const late = recordsToSubmit.filter(r => r.status === 'late').length;
      const absent = recordsToSubmit.filter(r => r.status === 'absent').length;

      setSubmitSuccess({
        session: createdSession,
        total,
        present,
        late,
        absent,
        percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0
      });

      setIsSheetActive(false);
    } catch (err) {
      alert('Error submitting attendance: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* College Institutional Title */}
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-700" />
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Government Engineering College, Bokaro
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          राजकीय अभियंत्रण महाविद्यालय, बोकारो • Faculty Mobile Attendance Portal
        </p>
      </div>

      {/* Submission Success Banner */}
      {submitSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-xs uppercase font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    {submitSuccess.session.class_type.toUpperCase()} SAVED
                  </span>
                  <span className="text-xs text-emerald-800 font-semibold">
                    {submitSuccess.session.date}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Attendance Recorded to Database!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  <span className="font-bold text-emerald-700">{submitSuccess.present} Present</span> •{' '}
                  <span className="font-bold text-rose-700">{submitSuccess.absent} Absent</span> •{' '}
                  <span className="font-bold text-amber-700">{submitSuccess.late} Late</span>{' '}
                  ({submitSuccess.percentage}% Rate)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSubmitSuccess(null)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition-all"
              >
                Mark Another
              </button>
              <button
                onClick={onNavigateToReports}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>View Reports</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Flow: Session Configurator OR Active Attendance Sheet */}
      {!isSheetActive ? (
        <div className="space-y-4">
          <div className="text-center sm:text-left max-w-xl">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Take Class Attendance
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Configure course, cohort, and lab batches, then tap below to mark student attendance.
            </p>
          </div>

          <SessionSelector
            sessionConfig={sessionConfig}
            setSessionConfig={setSessionConfig}
            courses={courses}
            onCoursesUpdated={loadInitialData}
            availableBatches={availableBatches}
            onStartSession={handleStartSession}
            isSessionActive={isSheetActive}
            totalStudentsCount={students.length}
          />
        </div>
      ) : (
        <AttendanceSheet
          students={activeSessionStudents.length > 0 ? activeSessionStudents : students}
          sessionConfig={sessionConfig}
          attendanceMap={attendanceMap}
          setAttendanceMap={setAttendanceMap}
          remarksMap={remarksMap}
          setRemarksMap={setRemarksMap}
          onSubmit={handleSubmitAttendance}
          isSubmitting={isSubmitting}
          onReset={() => setIsSheetActive(false)}
          availableBatches={availableBatches}
          onStudentBatchChanged={handleStudentBatchChanged}
          onShowAllStudents={handleShowAllStudents}
          totalAllStudentsCount={students.length}
        />
      )}

    </div>
  );
}
