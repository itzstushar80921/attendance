import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FlaskConical, 
  Calendar, 
  Clock, 
  Plus, 
  Sparkles, 
  BookMarked, 
  Check, 
  X,
  Edit3,
  Users,
  Building2
} from 'lucide-react';
import { api, DEFAULT_COURSES } from '../services/api';

export default function SessionSelector({
  sessionConfig,
  setSessionConfig,
  courses = [],
  onCoursesUpdated,
  availableBatches = ['B1', 'B2'],
  onStartSession,
  isSessionActive,
  totalStudentsCount = 20
}) {
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({
    code: '',
    name: '',
    department: 'Computer Science & Engineering',
    semester: 5,
    has_lab: true
  });
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [customBatchInput, setCustomBatchInput] = useState('');

  // Use courses passed in, or default fallback courses so it is NEVER blank
  const courseList = courses && courses.length > 0 ? courses : DEFAULT_COURSES;

  // Auto-sync sessionConfig course if empty or invalid
  useEffect(() => {
    if (!isCustomCourse && courseList.length > 0) {
      const match = courseList.find(c => c.code === sessionConfig.course_code);
      if (!match) {
        setSessionConfig(prev => ({
          ...prev,
          course_code: courseList[0].code,
          course_name: courseList[0].name,
          semester: courseList[0].semester || prev.semester
        }));
      }
    }
  }, [courseList, isCustomCourse, sessionConfig.course_code]);

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
      lab_batch: type === 'lab' ? (prev.lab_batch === 'All' ? 'B1' : prev.lab_batch) : 'All'
    }));
  };

  const handleCourseSelectChange = (e) => {
    const code = e.target.value;
    const selected = courseList.find(c => c.code === code);
    if (selected) {
      setSessionConfig(prev => ({
        ...prev,
        course_code: selected.code,
        course_name: selected.name,
        semester: selected.semester || prev.semester
      }));
    }
  };

  const handleAddBatch = (e) => {
    e.preventDefault();
    if (!customBatchInput.trim()) return;
    const clean = customBatchInput.trim().toUpperCase();
    setSessionConfig(prev => ({ ...prev, lab_batch: clean }));
    setCustomBatchInput('');
    setIsAddingBatch(false);
  };

  const handleSaveNewCourse = async (e) => {
    e.preventDefault();
    if (!newCourseForm.code || !newCourseForm.name) {
      alert('Please provide Course Code and Name');
      return;
    }

    try {
      const res = await api.addCourse(newCourseForm);
      if (res.success) {
        if (onCoursesUpdated) onCoursesUpdated();
        setSessionConfig(prev => ({
          ...prev,
          course_code: newCourseForm.code.toUpperCase(),
          course_name: newCourseForm.name,
          semester: newCourseForm.semester
        }));
        setIsAddingCourse(false);
        setIsCustomCourse(false);
        setNewCourseForm({
          code: '',
          name: '',
          department: 'Computer Science & Engineering',
          semester: 5,
          has_lab: true
        });
      }
    } catch (err) {
      alert('Failed to save course: ' + err.message);
    }
  };

  // Compile batch options: 'All', plus all registered batches, plus current selected batch if custom
  const allBatches = Array.from(new Set([
    ...availableBatches,
    sessionConfig.lab_batch
  ].filter(b => b && b !== 'All')));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* College Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-3.5 sm:p-4 border-b border-indigo-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-300" />
          <span className="font-extrabold text-xs sm:text-sm tracking-wide">
            Government Engineering College, Bokaro
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-indigo-200">
          Faculty Session Setup
        </span>
      </div>

      {/* Step 1: Class Type Segmented Switcher */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Step 1: Select Class Type
        </label>
        
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
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
              ? '📚 Full class cohort lecture attendance' 
              : '🔬 Practical lab batch attendance'}
          </span>
          <span className="font-semibold text-indigo-600">
            {sessionConfig.class_type === 'lab' ? 'Lab Batch Filter Active' : 'Cohort Attendance'}
          </span>
        </div>
      </div>

      {/* Session Details Form */}
      <div className="p-4 sm:p-5 space-y-4">
        
        {/* Course / Subject Selection & Custom Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
              Course / Subject
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomCourse(!isCustomCourse)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isCustomCourse ? 'Select from Roster' : 'Type Custom Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCourse(true)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100"
              >
                <Plus className="w-3 h-3" />
                <span>New Course</span>
              </button>
            </div>
          </div>

          {!isCustomCourse ? (
            <div className="relative">
              <select
                value={sessionConfig.course_code}
                onChange={handleCourseSelectChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-xs"
              >
                {courseList.map(course => (
                  <option key={course.code} value={course.code}>
                    {course.code} — {course.name} ({course.department ? `${course.department}, ` : ''}Sem {course.semester || 5})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Code (e.g. DCD01)"
                value={sessionConfig.course_code}
                onChange={(e) => setSessionConfig(prev => ({ ...prev, course_code: e.target.value.toUpperCase() }))}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <input
                type="text"
                placeholder="Course Title (e.g. Digital Circuital Design)"
                value={sessionConfig.course_name}
                onChange={(e) => setSessionConfig(prev => ({ ...prev, course_name: e.target.value }))}
                className="sm:col-span-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}
        </div>

        {/* Cohort / Student Roster Filter Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            Class Cohort to Load for Attendance
          </label>
          <select
            value={sessionConfig.student_cohort || 'all'}
            onChange={(e) => setSessionConfig(prev => ({ ...prev, student_cohort: e.target.value }))}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Enrolled Students (All {totalStudentsCount} GEC Bokaro Students)</option>
            <option value="5">Semester 5 Students (CS & VLSI)</option>
            <option value="1">Semester 1 Students</option>
            <option value="3">Semester 3 Students</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            {sessionConfig.student_cohort === 'all' || !sessionConfig.student_cohort
              ? `✓ Will load all ${totalStudentsCount} enrolled students from GEC Bokaro roster`
              : `Filtered for Semester ${sessionConfig.student_cohort} students`}
          </p>
        </div>

        {/* Modal: Quick Add Course */}
        {isAddingCourse && (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 animate-in fade-in duration-150 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase text-indigo-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" /> Add Course to Database
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingCourse(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Course Code (e.g. CS506)"
                value={newCourseForm.code}
                onChange={(e) => setNewCourseForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 uppercase"
              />
              <input
                type="text"
                placeholder="Course Title"
                value={newCourseForm.name}
                onChange={(e) => setNewCourseForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingCourse(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewCourse}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Save Course
              </button>
            </div>
          </div>
        )}

        {/* Lab Batch Selection (Dynamic & Editable by Professor) */}
        {sessionConfig.class_type === 'lab' && (
          <div className="bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-violet-900">
                Select or Add Lab Batch Group
              </label>
              <span className="text-[11px] font-semibold text-violet-700">
                Currently: Batch {sessionConfig.lab_batch}
              </span>
            </div>

            {/* Batch Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* All Batches Option */}
              <button
                type="button"
                onClick={() => setSessionConfig(prev => ({ ...prev, lab_batch: 'All' }))}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  sessionConfig.lab_batch === 'All'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white text-violet-800 border border-violet-200 hover:bg-violet-100'
                }`}
              >
                All Batches
              </button>

              {/* Dynamic Batches */}
              {allBatches.map(batch => (
                <button
                  key={batch}
                  type="button"
                  onClick={() => setSessionConfig(prev => ({ ...prev, lab_batch: batch }))}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    sessionConfig.lab_batch === batch
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white text-violet-800 border border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  Batch {batch}
                </button>
              ))}

              {/* Add Custom Batch Button */}
              {!isAddingBatch ? (
                <button
                  type="button"
                  onClick={() => setIsAddingBatch(true)}
                  className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-white text-violet-700 border border-dashed border-violet-300 hover:border-violet-500 hover:bg-violet-100 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Custom Batch</span>
                </button>
              ) : (
                <form onSubmit={handleAddBatch} className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Batch (e.g. B3, G1)"
                    value={customBatchInput}
                    onChange={(e) => setCustomBatchInput(e.target.value)}
                    className="w-24 px-2 py-1 text-xs font-bold bg-white border border-violet-400 rounded-lg uppercase focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-violet-600 text-white rounded-lg text-xs"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingBatch(false)}
                    className="p-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              )}
            </div>

            <p className="text-[11px] text-violet-700">
              {sessionConfig.lab_batch === 'All' 
                ? 'Marking attendance for all students across the entire cohort'
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
