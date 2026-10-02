import React, { useState, useMemo } from 'react';
import StudentCard from './StudentCard';
import { 
  CheckCheck, 
  XCircle, 
  Search, 
  Filter, 
  Send, 
  RotateCcw, 
  Users, 
  Check, 
  X, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

export default function AttendanceSheet({
  students,
  sessionConfig,
  attendanceMap,
  setAttendanceMap,
  remarksMap,
  setRemarksMap,
  onSubmit,
  isSubmitting,
  onReset
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');

  // Filter students based on lab batch (if lab session is configured for specific batch) and search
  const visibleStudents = useMemo(() => {
    return students.filter(st => {
      // If session is for a specific lab batch, enforce that
      if (sessionConfig.class_type === 'lab' && sessionConfig.lab_batch !== 'All') {
        if (st.lab_batch !== sessionConfig.lab_batch) return false;
      } else if (batchFilter !== 'All') {
        if (st.lab_batch !== batchFilter) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return st.name.toLowerCase().includes(q) || st.roll_number.toLowerCase().includes(q);
      }

      return true;
    });
  }, [students, sessionConfig, batchFilter, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = visibleStudents.length;
    let present = 0;
    let absent = 0;
    let late = 0;

    visibleStudents.forEach(st => {
      const status = attendanceMap[st.id] || 'present';
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
    });

    const attended = present + late;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    return { total, present, absent, late, percentage };
  }, [visibleStudents, attendanceMap]);

  // Handlers for bulk actions
  const handleMarkAll = (status) => {
    setAttendanceMap(prev => {
      const updated = { ...prev };
      visibleStudents.forEach(st => {
        updated[st.id] = status;
      });
      return updated;
    });
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleRemarksChange = (studentId, remark) => {
    setRemarksMap(prev => ({
      ...prev,
      [studentId]: remark
    }));
  };

  return (
    <div className="space-y-4">
      
      {/* Session Active Info Badge */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
        sessionConfig.class_type === 'lab'
          ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200'
          : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
              sessionConfig.class_type === 'lab'
                ? 'bg-violet-600 text-white'
                : 'bg-indigo-600 text-white'
            }`}>
              {sessionConfig.class_type.toUpperCase()} SESSION
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {sessionConfig.date} • {sessionConfig.time_slot}
            </span>
          </div>
          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mt-1">
            {sessionConfig.course_code}: {sessionConfig.course_name}
          </h3>
          {sessionConfig.topic_covered && (
            <p className="text-xs text-slate-600 mt-0.5">
              Topic: <span className="font-medium text-slate-800">{sessionConfig.topic_covered}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="self-start sm:self-auto text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Change Settings
        </button>
      </div>

      {/* Live Sticky Summary & Quick Actions Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-md space-y-3">
        
        {/* KPI Counts */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total</span>
            <span className="text-lg font-extrabold text-slate-800">{stats.total}</span>
          </div>
          <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Present</span>
            <span className="text-lg font-extrabold text-emerald-700">{stats.present}</span>
          </div>
          <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">Absent</span>
            <span className="text-lg font-extrabold text-rose-700">{stats.absent}</span>
          </div>
          <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100">
            <span className="text-[10px] uppercase font-bold text-indigo-600 block">Rate</span>
            <span className="text-lg font-extrabold text-indigo-700">{stats.percentage}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 h-full transition-all duration-300" 
            style={{ width: `${stats.total > 0 ? (stats.present / stats.total) * 100 : 0}%` }}
          />
          <div 
            className="bg-amber-400 h-full transition-all duration-300" 
            style={{ width: `${stats.total > 0 ? (stats.late / stats.total) * 100 : 0}%` }}
          />
          <div 
            className="bg-rose-500 h-full transition-all duration-300" 
            style={{ width: `${stats.total > 0 ? (stats.absent / stats.total) * 100 : 0}%` }}
          />
        </div>

        {/* Quick Bulk Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleMarkAll('present')}
              className="text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all touch-press"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>All Present</span>
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('absent')}
              className="text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all touch-press"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>All Absent</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Tap cards to toggle P / A / L
          </span>
        </div>

      </div>

      {/* Search & Batch Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Lab batch filter (when session is 'All' batches) */}
        {sessionConfig.class_type === 'lecture' && (
          <div className="flex items-center gap-1 shrink-0 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Batch:
            </span>
            {['All', 'B1', 'B2'].map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBatchFilter(b)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                  batchFilter === b
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Student List */}
      <div className="space-y-2 pb-24">
        {visibleStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No students found</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting search or batch filters</p>
          </div>
        ) : (
          visibleStudents.map((student, idx) => (
            <StudentCard
              key={student.id}
              student={student}
              index={idx}
              status={attendanceMap[student.id] || 'present'}
              onStatusChange={handleStatusChange}
              remarks={remarksMap[student.id] || ''}
              onRemarksChange={handleRemarksChange}
            />
          ))
        )}
      </div>

      {/* Floating Bottom Submit Button */}
      <div className="fixed bottom-14 md:bottom-6 left-0 right-0 p-4 z-40 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || visibleStudents.length === 0}
            className={`w-full py-4 px-6 rounded-2xl text-white font-extrabold text-base shadow-2xl flex items-center justify-center gap-3 transition-all ${
              sessionConfig.class_type === 'lab'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 active:scale-95 shadow-violet-300'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 active:scale-95 shadow-indigo-300'
            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Send className="w-5 h-5" />
            <span>
              {isSubmitting ? 'Submitting to Supabase...' : `Submit Attendance (${stats.present}/${stats.total} Present)`}
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}
