import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  FlaskConical, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Mail, 
  GraduationCap, 
  Download,
  Filter 
} from 'lucide-react';
import { api } from '../services/api';

export default function StudentDetailModal({ studentId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'lecture', 'lab'

  useEffect(() => {
    async function fetchStudentDetail() {
      try {
        setLoading(true);
        const res = await api.getStudentDetailedReport(studentId);
        if (res.success) {
          setReportData(res);
        } else {
          setError(res.message || 'Failed to load student data');
        }
      } catch (err) {
        setError(err.message || 'Error loading student details');
      } finally {
        setLoading(false);
      }
    }
    if (studentId) fetchStudentDetail();
  }, [studentId]);

  if (!studentId) return null;

  const { student, semesterSummary, monthlyBreakdown, history } = reportData || {};

  const filteredHistory = history?.filter(item => {
    if (historyFilter === 'all') return true;
    return item.class_type === historyFilter;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-100">
              {student ? student.name.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {student?.name || 'Loading...'}
                </h3>
                <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                  {student?.roll_number}
                </span>
                <span className="text-xs font-semibold bg-violet-100 text-violet-800 px-2 py-0.5 rounded">
                  Lab Batch {student?.lab_batch}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>{student?.department}</span> • <span>Sem {student?.semester}, Sec {student?.section}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Calculating student attendance breakdown...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Semester Attendance KPI Cards */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                  Semester 5 Attendance Summary
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Lecture Attendance */}
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> Lectures
                      </span>
                      <span className="text-xs font-extrabold text-indigo-900">
                        {semesterSummary.lecture.attended} / {semesterSummary.lecture.conducted}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-indigo-700">
                        {semesterSummary.lecture.percentage}%
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({semesterSummary.lecture.absent} missed)
                      </span>
                    </div>
                    <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${semesterSummary.lecture.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Lab Attendance */}
                  <div className="bg-violet-50/70 border border-violet-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-violet-700 flex items-center gap-1">
                        <FlaskConical className="w-3.5 h-3.5" /> Practical Labs
                      </span>
                      <span className="text-xs font-extrabold text-violet-900">
                        {semesterSummary.lab.attended} / {semesterSummary.lab.conducted}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-violet-700">
                        {semesterSummary.lab.percentage}%
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({semesterSummary.lab.absent} missed)
                      </span>
                    </div>
                    <div className="w-full bg-violet-200 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-violet-600 h-full rounded-full"
                        style={{ width: `${semesterSummary.lab.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Overall Unified Attendance */}
                  <div className={`border rounded-2xl p-4 ${
                    semesterSummary.overall.percentage >= 75
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold flex items-center gap-1 ${
                        semesterSummary.overall.percentage >= 75 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        <GraduationCap className="w-3.5 h-3.5" /> Unified Overall
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        {semesterSummary.overall.attended} / {semesterSummary.overall.conducted}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-black ${
                        semesterSummary.overall.percentage >= 75 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {semesterSummary.overall.percentage}%
                      </span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                        semesterSummary.overall.percentage >= 75 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {semesterSummary.overall.percentage >= 75 ? 'Eligible' : 'Shortage'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          semesterSummary.overall.percentage >= 75 ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                        style={{ width: `${semesterSummary.overall.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                  Monthly Attendance Records (Lecture & Lab)
                </h4>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Month</th>
                          <th className="py-2.5 px-3">Lectures</th>
                          <th className="py-2.5 px-3">Labs</th>
                          <th className="py-2.5 px-3">Combined Total</th>
                          <th className="py-2.5 px-3 text-right">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {monthlyBreakdown?.map((m) => (
                          <tr key={m.month} className="hover:bg-white/60">
                            <td className="py-2.5 px-3 font-bold text-slate-800 font-mono">
                              {m.month}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-indigo-700">
                                {m.lecture.attended}/{m.lecture.conducted}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1">({m.lecture.percentage}%)</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-violet-700">
                                {m.lab.attended}/{m.lab.conducted}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1">({m.lab.percentage}%)</span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">
                              {m.total.attended}/{m.total.conducted}
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold">
                              <span className={`px-2 py-0.5 rounded-full ${
                                m.total.percentage >= 75 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {m.total.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Complete Session Log Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Session Log History ({filteredHistory.length})
                  </h4>

                  {/* Filter: All / Lecture / Lab */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => setHistoryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        historyFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setHistoryFilter('lecture')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        historyFilter === 'lecture' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Lectures
                    </button>
                    <button
                      onClick={() => setHistoryFilter('lab')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        historyFilter === 'lab' ? 'bg-violet-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Labs
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredHistory.map((item, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] ${
                            item.class_type === 'lab' 
                              ? 'bg-violet-100 text-violet-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {item.class_type}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.date}
                          </span>
                          <span className="text-slate-500">
                            • {item.time_slot}
                          </span>
                        </div>
                        <p className="font-medium text-slate-700 truncate mt-0.5">
                          {item.course_code}: {item.topic_covered || item.course_name}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs uppercase ${
                          item.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status === 'present' && <CheckCircle className="w-3.5 h-3.5" />}
                          {item.status === 'absent' && <XCircle className="w-3.5 h-3.5" />}
                          {item.status === 'late' && <Clock className="w-3.5 h-3.5" />}
                          {item.status}
                        </span>
                        {item.remarks && (
                          <span className="block text-[10px] text-slate-500 italic mt-0.5">
                            "{item.remarks}"
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-sm transition-all"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
