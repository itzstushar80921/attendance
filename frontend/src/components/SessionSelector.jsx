import React from 'react';
import { BookOpen, FlaskConical, Calendar, Clock, MapPin, Sparkles, BookMarked } from 'lucide-react';

export default function SessionSelector({
  sessionConfig,
  setSessionConfig,
  courses,
  onStartSession,
  isSessionActive
}) {
  const lectureTimeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:15 AM - 12:15 PM',
    '01:15 PM - 02:15 PM',
    '02:15 PM - 03:15 PM'
  ];

  const labTimeSlots = [
    '09:00 AM - 11:00 AM',
    '11:15 AM - 01:15 PM',
    '02:00 PM - 04:00 PM',
    '03:00 PM - 05:00 PM'
  ];

  const handleClassTypeChange = (type) => {
    setSessionConfig(prev => ({
      ...prev,
      class_type: type,
      time_slot: type === 'lab' ? labTimeSlots[2] : lectureTimeSlots[0],
      location: type === 'lab' ? 'CS Lab-3' : 'LH-201',
      lab_batch: type === 'lab' ? 'B1' : 'All'
    }));
  };

  const handleCourseChange = (e) => {
    const code = e.target.value;
    const selected = courses.find(c => c.code === code);
    setSessionConfig(prev => ({
      ...prev,
      course_code: code,
      course_name: selected ? selected.name : code
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Top Header: Class Type Segmented Switcher */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Step 1: Select Class Type
        </label>
        
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
          {/* Lecture Option */}
          <button
            type="button"
            onClick={() => handleClassTypeChange('lecture')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm sm:text-base transition-all ${
              sessionConfig.class_type === 'lecture'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Lecture Session</span>
          </button>

          {/* Lab Option */}
          <button
            type="button"
            onClick={() => handleClassTypeChange('lab')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm sm:text-base transition-all ${
              sessionConfig.class_type === 'lab'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            }`}
          >
            <FlaskConical className="w-5 h-5" />
            <span>Practical Lab</span>
          </button>
        </div>

        <div className="mt-2 text-xs flex items-center justify-between text-slate-500">
          <span>
            {sessionConfig.class_type === 'lecture' 
              ? '📚 Full cohort lecture attendance' 
              : '🔬 Lab batch practical session attendance'}
          </span>
          <span className="font-semibold text-indigo-600">
            {sessionConfig.class_type === 'lab' ? 'Lab Division Enabled' : 'Section-wide'}
          </span>
        </div>
      </div>

      {/* Session Details Form */}
      <div className="p-4 sm:p-5 space-y-4">
        
        {/* Course Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Course / Subject
          </label>
          <div className="relative">
            <select
              value={sessionConfig.course_code}
              onChange={handleCourseChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none"
            >
              {courses.map(course => (
                <option key={course.code} value={course.code}>
                  {course.code} — {course.name}
                </option>
              ))}
            </select>
            <BookMarked className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Lab Batch Selection (Shown only when class_type === 'lab') */}
        {sessionConfig.class_type === 'lab' && (
          <div className="bg-violet-50/70 border border-violet-100 rounded-xl p-3.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-violet-900 mb-2">
              Select Lab Batch Group
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['B1', 'B2', 'All'].map(batch => (
                <button
                  key={batch}
                  type="button"
                  onClick={() => setSessionConfig(prev => ({ ...prev, lab_batch: batch }))}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    sessionConfig.lab_batch === batch
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white text-violet-800 border border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  {batch === 'All' ? 'All Batches' : `Batch ${batch}`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-violet-700 mt-2">
              {sessionConfig.lab_batch === 'All' 
                ? 'Marking attendance for all students across both lab groups'
                : `Filtered strictly for Batch ${sessionConfig.lab_batch} students`}
            </p>
          </div>
        )}

        {/* Date & Time Slot Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date
            </label>
            <input
              type="date"
              value={sessionConfig.date}
              onChange={(e) => setSessionConfig(prev => ({ ...prev, date: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Time Slot
            </label>
            <select
              value={sessionConfig.time_slot}
              onChange={(e) => setSessionConfig(prev => ({ ...prev, time_slot: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              {(sessionConfig.class_type === 'lab' ? labTimeSlots : lectureTimeSlots).map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Topic Covered (Optional) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            Topic / Syllabus Unit Covered (Optional)
          </label>
          <input
            type="text"
            placeholder={sessionConfig.class_type === 'lab' ? 'e.g. Lab 3: SQL Views & Triggers' : 'e.g. Relational Calculus & Queries'}
            value={sessionConfig.topic_covered}
            onChange={(e) => setSessionConfig(prev => ({ ...prev, topic_covered: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onStartSession}
            className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 ${
              sessionConfig.class_type === 'lab'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-200'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200'
            }`}
          >
            <span>{isSessionActive ? 'Update Active Sheet' : 'Load Attendance Sheet'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              {sessionConfig.class_type.toUpperCase()}
            </span>
          </button>
        </div>

      </div>

    </div>
  );
}
