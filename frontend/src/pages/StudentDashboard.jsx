import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  FlaskConical, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Filter, 
  ChevronRight, 
  LogOut, 
  FileSpreadsheet,
  Info,
  Layers,
  Zap,
  Target
} from 'lucide-react';
import { api } from '../services/api';

export default function StudentDashboard({ studentUser, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  
  // Semester Switcher: default to student's registered semester
  const [selectedSemester, setSelectedSemester] = useState(studentUser?.semester || 5);
  
  // Interactive Simulator State: student can test "What if I attend next N classes?"
  const [simulateExtraAttended, setSimulateExtraAttended] = useState(0);

  // History Filter: 'all' | 'regular' | 'extra'
  const [historyFilter, setHistoryFilter] = useState('all');

  const fetchStudentReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentId = studentUser.id || studentUser.roll_number;
      const res = await api.getStudentDetailedReport(studentId, selectedSemester);
      if (res.success) {
        setReportData(res);
      } else {
        setError(res.message || 'Failed to fetch student report');
      }
    } catch (err) {
      setError(err.message || 'Error loading attendance details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentReport();
  }, [selectedSemester, studentUser]);

  const summary = reportData?.semesterSummary || {};
  const target75 = reportData?.target75Analysis || {};
  const subjects = reportData?.subjects || [];
  const history = reportData?.history || [];

  // Filtered session history
  const filteredHistory = useMemo(() => {
    if (historyFilter === 'extra') {
      return history.filter(h => h.is_extra_class);
    }
    if (historyFilter === 'regular') {
      return history.filter(h => !h.is_extra_class);
    }
    return history;
  }, [history, historyFilter]);

  // Interactive Target Simulation Calculation
  const totalConducted = summary.overall?.conducted || 0;
  const totalAttended = summary.overall?.attended || 0;
  const simulatedTotal = totalConducted + simulateExtraAttended;
  const simulatedAttended = totalAttended + simulateExtraAttended;
  const simulatedPercentage = simulatedTotal > 0 
    ? Math.round((simulatedAttended / simulatedTotal) * 100) 
    : 100;

  // Export Student Attendance Card
  const handleExportAttendanceCard = () => {
    if (!reportData) return;
    const lines = [
      `"GOVERNMENT ENGINEERING COLLEGE, BOKARO"`,
      `"STUDENT ATTENDANCE REPORT & 75% COMPLIANCE SLIP"`,
      `"Student Name: ${studentUser.name}"`,
      `"Roll Number: ${studentUser.roll_number}"`,
      `"Department: ${studentUser.department}"`,
      `"Semester: ${selectedSemester}"`,
      `"Overall Attendance: ${summary.overall?.percentage || 0}% (${summary.overall?.attended || 0} / ${summary.overall?.conducted || 0})"`,
      `"Eligibility Status: ${summary.overall?.percentage >= 75 ? 'ELIGIBLE (>= 75%)' : 'ATTENDANCE SHORTAGE (< 75%)'}"`,
      `"Classes Needed for 75%: ${target75.classesNeededFor75 || 0}"`,
      '',
      `"Subject-wise Breakdown:"`,
      `"Course Code,Course Name,Conducted,Attended,Percentage,Status"`,
      ...subjects.map(s => `"${s.course_code}","${s.course_name}",${s.total_conducted},${s.attended},${s.percentage}%,${s.percentage >= 75 ? 'Eligible' : 'Shortage'}`),
      '',
      `"Session-by-Session History:"`,
      `"Date,Time Slot,Type,Category,Course,Status,Topic Covered"`,
      ...history.map(h => `"${h.date}","${h.time_slot}","${h.class_type}","${h.is_extra_class ? 'Extra Class' : 'Regular'}","${h.course_code}","${h.status}","${h.topic_covered || ''}"`)
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `GEC_Bokaro_${studentUser.roll_number}_Sem${selectedSemester}_Attendance.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Top Banner / Student Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/60 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100 shrink-0">
              {studentUser.name?.charAt(0) || 'S'}
            </div>
            
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {studentUser.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {studentUser.roll_number}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                  Lab Batch: {studentUser.lab_batch || 'B1'}
                </span>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {studentUser.department || 'Computer Science & Engineering'} • Sec {studentUser.section || 'A'}
              </p>
              
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold mt-0.5">
                <span>Government Engineering College, Bokaro</span>
                <span>•</span>
                <span>राजकीय अभियंत्रण महाविद्यालय, बोकारो</span>
              </div>
            </div>
          </div>

          {/* Semester Selector & Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
              <Layers className="w-4 h-4 text-slate-500 ml-1.5" />
              <span className="text-slate-600 text-xs">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(parseInt(e.target.value, 10))}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-900 font-black text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchStudentReport}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-xs"
              title="Refresh Report"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportAttendanceCard}
              disabled={loading || !reportData}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Slip</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all"
                title="Log out of student portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

          </div>

        </div>

      </div>

      {loading && !reportData ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Loading Semester {selectedSemester} Attendance Record...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to Government Engineering College, Bokaro database</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center text-rose-800">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="font-bold text-sm">{error}</p>
          <button
            onClick={fetchStudentReport}
            className="mt-3 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-sm"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          
          {/* ======================================================== */}
          {/* ⭐ 75% ATTENDANCE TARGET SAFEGUARD & CALCULATOR WIDGET   */}
          {/* ======================================================== */}
          <div className={`rounded-3xl p-5 sm:p-6 border shadow-sm transition-all relative overflow-hidden ${
            target75.isEligible
              ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200 text-emerald-950'
              : 'bg-gradient-to-br from-rose-50 via-amber-50/50 to-white border-rose-200 text-rose-950'
          }`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                  target75.isEligible ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'
                }`}>
                  {target75.isEligible ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      AICTE / University 75% Mandatory Attendance Target
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      target75.isEligible
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {target75.isEligible ? 'Eligible for Exams' : 'Attendance Shortage Warning'}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black mt-1 tracking-tight">
                    {target75.isEligible ? (
                      <span className="text-emerald-800">
                        Excellent! You have achieved {target75.currentPercentage}% overall attendance.
                      </span>
                    ) : (
                      <span className="text-rose-800">
                        Attention Required: Current Attendance is {target75.currentPercentage}%.
                      </span>
                    )}
                  </h2>

                  <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 max-w-2xl leading-relaxed">
                    {target75.statusMessage}
                  </p>

                  {/* Explicit "Classes Needed" Badge for Shortage */}
                  {!target75.isEligible && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-200">
                      <Target className="w-4 h-4 text-amber-300" />
                      <span>
                        Must Attend Next <strong>{target75.classesNeededFor75}</strong> Consecutive Classes
                      </span>
                    </div>
                  )}

                  {target75.isEligible && target75.classesCanAffordToMiss > 0 && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>
                        Safe Margin: Can afford to miss up to <strong>{target75.classesCanAffordToMiss}</strong> classes safely
                      </span>
                    </div>
                  )}

                </div>
              </div>

              {/* Big Attendance % Metric Display */}
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Semester {selectedSemester} Total
                </span>
                <div className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  target75.isEligible ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {summary.overall?.percentage || 0}%
                </div>
                <span className="text-xs font-bold text-slate-600">
                  {summary.overall?.attended || 0} / {summary.overall?.conducted || 0} Attended
                </span>
              </div>

            </div>

            {/* Interactive Target Simulator Bar */}
            <div className="mt-5 pt-4 border-t border-slate-200/70 bg-white/70 backdrop-blur-xs p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-indigo-950">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <strong>Simulate Your Attendance Goal:</strong> "If I attend future classes..."
                </span>
                <span className="text-indigo-700 font-black">
                  + {simulateExtraAttended} upcoming classes attended &rarr; Projected: {simulatedPercentage}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={simulateExtraAttended}
                  onChange={(e) => setSimulateExtraAttended(parseInt(e.target.value, 10))}
                  className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <span className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-xs min-w-[50px] text-center">
                  +{simulateExtraAttended}
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Formula applied: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">Target \ge 75% \iff X \ge \lceil 3C - 4A \rceil</code> where C = classes conducted ({totalConducted}), A = classes attended ({totalAttended}).
              </p>
            </div>

          </div>

          {/* ======================================================== */}
          {/* THREE METRICS: LECTURE vs LAB vs EXTRA CLASSES           */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            
            {/* Lecture Metric */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Theory Lectures</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {summary.lecture?.percentage || 0}%
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  ({summary.lecture?.attended || 0}/{summary.lecture?.conducted || 0} classes)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    (summary.lecture?.percentage || 0) >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, summary.lecture?.percentage || 0)}%` }}
                />
              </div>
            </div>

            {/* Practical Lab Metric */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Practical Labs</span>
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {summary.lab?.percentage || 0}%
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  ({summary.lab?.attended || 0}/{summary.lab?.conducted || 0} labs)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    (summary.lab?.percentage || 0) >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, summary.lab?.percentage || 0)}%` }}
                />
              </div>
            </div>

            {/* Extra Classes Conducted Metric */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extra / Remedial Classes</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-700">
                  {summary.extraClasses?.attended || 0}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  Attended out of {summary.extraClasses?.conducted || 0} extra sessions
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Helps improve overall attendance score towards the 75% mark
              </p>
            </div>

          </div>

          {/* ======================================================== */}
          {/* SUBJECT-WISE ATTENDANCE BREAKDOWN TABLE                  */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Subject-Wise Attendance Breakdown (Semester {selectedSemester})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Track individual courses to ensure 75% minimum attendance in every subject
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
                {subjects.length} Enrolled Courses
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-3 text-center">Theory</th>
                    <th className="py-3 px-3 text-center">Lab</th>
                    <th className="py-3 px-3 text-center">Total Classes</th>
                    <th className="py-3 px-3 text-center">Attended</th>
                    <th className="py-3 px-3 text-center">Percentage</th>
                    <th className="py-3 px-4 text-center">75% Target Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        No sessions recorded for Semester {selectedSemester} yet.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((subj) => (
                      <tr key={subj.course_code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900">{subj.course_code}</div>
                          <div className="text-xs text-slate-500">{subj.course_name}</div>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600">
                          {subj.lecture_attended} / {subj.lecture_conducted}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600">
                          {subj.lab_conducted > 0 ? `${subj.lab_attended} / ${subj.lab_conducted}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {subj.total_conducted}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-indigo-700">
                          {subj.attended}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black ${
                            subj.percentage >= 75
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {subj.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {subj.percentage >= 75 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Eligible</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-xs" title={`Attend next ${subj.classes_needed_for_75} classes to hit 75%`}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Need {subj.classes_needed_for_75} more class{subj.classes_needed_for_75 === 1 ? '' : 'es'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* ======================================================== */}
          {/* SESSION ATTENDANCE HISTORY LIST (REGULAR & EXTRA)        */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Session Attendance History (Semester {selectedSemester})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete timeline of theory, practical, and extra sessions taken by faculty
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    historyFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All ({history.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('regular')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    historyFilter === 'regular' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Regular
                </button>
                <button
                  onClick={() => setHistoryFilter('extra')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    historyFilter === 'extra' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ⚡ Extra Classes ({summary.extraClasses?.conducted || 0})
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
                  No attendance records found for this filter in Semester {selectedSemester}.
                </div>
              ) : (
                filteredHistory.map((item, idx) => {
                  const isPresent = item.status === 'present';
                  const isLate = item.status === 'late';
                  const isAbsent = item.status === 'absent';

                  return (
                    <div key={item.session_id || idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                      
                      <div className="flex items-start gap-3">
                        
                        {/* Status Icon Indicator */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isPresent 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : isLate 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-rose-100 text-rose-700'
                        }`}>
                          {isPresent && <CheckCircle2 className="w-5 h-5" />}
                          {isLate && <Clock className="w-5 h-5" />}
                          {isAbsent && <XCircle className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900">
                              {item.course_code}: {item.course_name}
                            </span>
                            
                            {/* Class Type Tag */}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              item.class_type === 'lecture'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-violet-50 text-violet-700 border border-violet-200'
                            }`}>
                              {item.class_type}
                            </span>

                            {/* Extra Class Highlight Badge */}
                            {item.is_extra_class && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-600" />
                                <span>Extra Class{item.extra_reason ? `: ${item.extra_reason}` : ''}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {item.date}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {item.time_slot}
                            </span>
                            {item.location && (
                              <>
                                <span>•</span>
                                <span>{item.location}</span>
                              </>
                            )}
                          </div>

                          {item.topic_covered && (
                            <p className="text-xs text-slate-600 mt-1 italic">
                              Topic: {item.topic_covered}
                            </p>
                          )}
                        </div>

                      </div>

                      {/* Right Status Badge */}
                      <div className="self-start sm:self-center shrink-0">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isLate
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </>
      )}

    </div>
  );
}
