import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  FlaskConical, 
  GraduationCap, 
  AlertTriangle, 
  Search, 
  Download, 
  Filter, 
  Calendar, 
  ChevronRight, 
  ArrowUpDown,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import AttendanceCharts from './AttendanceCharts';
import StudentDetailModal from './StudentDetailModal';
import { api } from '../services/api';

export default function UnifiedReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ summary: {}, monthlyTrends: [], students: [] });
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [viewFilter, setViewFilter] = useState('all'); // 'all', 'lecture', 'lab', 'defaulters'
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getUnifiedReport({
        semester: 5,
        month: selectedMonth
      });
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Failed to fetch report');
      }
    } catch (err) {
      setError(err.message || 'Error loading attendance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth]);

  // Filter students based on search and view filter
  const filteredStudents = useMemo(() => {
    return (data.students || []).filter(st => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = st.name.toLowerCase().includes(q) || st.roll_number.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // View Filter
      if (viewFilter === 'defaulters') {
        return st.is_low_attendance;
      }

      return true;
    });
  }, [data.students, searchTerm, viewFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Roll Number',
      'Name',
      'Department',
      'Semester',
      'Section',
      'Lab Batch',
      'Lectures Conducted',
      'Lectures Attended',
      'Lecture %',
      'Labs Conducted',
      'Labs Attended',
      'Lab %',
      'Total Conducted',
      'Total Attended',
      'Overall %',
      'Status'
    ];

    const rows = filteredStudents.map(s => [
      `"${s.roll_number}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      s.semester,
      `"${s.section}"`,
      `"${s.lab_batch}"`,
      s.lecture.conducted,
      s.lecture.attended,
      `${s.lecture.percentage}%`,
      s.lab.conducted,
      s.lab.attended,
      `${s.lab.percentage}%`,
      s.overall.conducted,
      s.overall.attended,
      `${s.overall.percentage}%`,
      s.overall.percentage >= 75 ? 'Eligible' : 'Attendance Shortage (<75%)'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_Sem5_${selectedMonth}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data.summary || {};

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Unified Attendance Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Semester 5 • Computer Science & Engineering • Lecture & Lab Consolidated
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-xs"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Overall Unified % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Avg</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.avgOverallPercentage || 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.totalSessions || 0} total sessions held
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
        </div>

        {/* Lecture Attendance % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Lecture Avg</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-indigo-700">
              {summary.avgLecturePercentage || 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.totalLectureSessions || 0} lectures conducted
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
        </div>

        {/* Lab Attendance % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Lab Avg</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-violet-700">
              {summary.avgLabPercentage || 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.totalLabSessions || 0} practical labs held
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-600" />
        </div>

        {/* Attendance Shortage (<75%) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Defaulters</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">
              {summary.lowAttendanceCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              / {summary.totalStudents || 0}
            </span>
          </div>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            Below 75% attendance threshold
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

      </div>

      {/* Visual Charts */}
      <AttendanceCharts 
        monthlyTrends={data.monthlyTrends} 
        summary={summary} 
      />

      {/* Interactive Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* View Filter Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs">
            <button
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                viewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Unified (All)
            </button>
            <button
              onClick={() => setViewFilter('lecture')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                viewFilter === 'lecture' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Lectures Focus
            </button>
            <button
              onClick={() => setViewFilter('lab')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                viewFilter === 'lab' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Labs Focus
            </button>
            <button
              onClick={() => setViewFilter('defaulters')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                viewFilter === 'defaulters' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700'
              }`}
            >
              &lt;75% Shortage
            </button>
          </div>

        </div>
      </div>

      {/* Student Attendance List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        
        {/* Mobile View: Cards */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No students match the criteria.
            </div>
          ) : (
            filteredStudents.map(st => (
              <div
                key={st.id}
                onClick={() => setSelectedStudentId(st.id)}
                className="p-4 active:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      {st.roll_number}
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      Batch {st.lab_batch}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm truncate mt-1">
                    {st.name}
                  </h4>
                  
                  {/* Attendance Mini Chips */}
                  <div className="flex items-center gap-2 mt-2 text-xs font-semibold">
                    <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Lec: {st.lecture.percentage}%
                    </span>
                    <span className="text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                      Lab: {st.lab.percentage}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className={`text-base font-black ${
                      st.overall.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {st.overall.percentage}%
                    </span>
                    <span className={`block text-[10px] font-bold uppercase ${
                      st.overall.percentage >= 75 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {st.overall.percentage >= 75 ? 'OK' : 'Shortage'}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tablet & Desktop View: Unified Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Roll No & Student</th>
                <th className="py-3.5 px-3">Batch</th>
                <th className="py-3.5 px-3 text-indigo-800">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Lecture Attendance
                  </span>
                </th>
                <th className="py-3.5 px-3 text-violet-800">
                  <span className="flex items-center gap-1">
                    <FlaskConical className="w-3.5 h-3.5 text-violet-600" />
                    Lab Attendance
                  </span>
                </th>
                <th className="py-3.5 px-3">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
                    Unified Overall
                  </span>
                </th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No student records found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(st => (
                  <tr 
                    key={st.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedStudentId(st.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {st.roll_number}
                        </span>
                        <span className="font-bold text-slate-900">{st.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        Batch {st.lab_batch}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-700">
                          {st.lecture.percentage}%
                        </span>
                        <span className="text-xs text-slate-500">
                          ({st.lecture.attended}/{st.lecture.conducted})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-violet-700">
                          {st.lab.percentage}%
                        </span>
                        <span className="text-xs text-slate-500">
                          ({st.lab.attended}/{st.lab.conducted})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                          st.overall.percentage >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {st.overall.percentage}%
                        </span>
                        <span className="text-xs text-slate-500">
                          ({st.overall.attended}/{st.overall.conducted})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentId(st.id);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Drill Down
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Student Detailed Breakdown Modal */}
      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

    </div>
  );
}
