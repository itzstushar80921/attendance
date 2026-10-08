import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  GraduationCap, 
  Mail, 
  Phone, 
  Filter, 
  Check, 
  X, 
  AlertCircle, 
  AlertTriangle, 
  Settings, 
  Edit2, 
  Trash2, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  BookOpen,
  FileSpreadsheet,
  Upload,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [availableBatches, setAvailableBatches] = useState(['B1', 'B2']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  
  // Modals & UI states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState('single'); // 'single' | 'bulk'
  const [isBatchManagerOpen, setIsBatchManagerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [addError, setAddError] = useState(null);

  // Bulk selection
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkTargetBatch, setBulkTargetBatch] = useState('B1');

  // Single student inline editing
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [inlineBatchVal, setInlineBatchVal] = useState('');

  // Batch rename state
  const [renameOldBatch, setRenameOldBatch] = useState('');
  const [renameNewBatch, setRenameNewBatch] = useState('');
  const [newBatchName, setNewBatchName] = useState('');

  // Single Student Form State
  const [newStudent, setNewStudent] = useState({
    roll_number: '',
    name: '',
    email: '',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    lab_batch: 'B1',
    phone: ''
  });

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');
  const [bulkSemester, setBulkSemester] = useState(5);
  const [bulkSection, setBulkSection] = useState('A');
  const [bulkDefaultBatch, setBulkDefaultBatch] = useState('B1');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({
        semester: semesterFilter !== 'All' ? semesterFilter : undefined
      });
      if (res.success) {
        setStudents(res.data);
        if (res.batches && res.batches.length > 0) {
          setAvailableBatches(res.batches);
          if (!renameOldBatch) setRenameOldBatch(res.batches[0]);
          if (!bulkTargetBatch) setBulkTargetBatch(res.batches[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [semesterFilter]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      if (batchFilter !== 'All' && st.lab_batch !== batchFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return st.name.toLowerCase().includes(q) || st.roll_number.toLowerCase().includes(q);
      }
      return true;
    });
  }, [students, batchFilter, searchTerm]);

  // Batch Counts
  const batchCounts = useMemo(() => {
    const counts = {};
    students.forEach(st => {
      const b = st.lab_batch || 'Unassigned';
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [students]);

  // Parsed Bulk Preview
  const parsedBulkStudents = useMemo(() => {
    if (!bulkText.trim()) return [];
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const existingRolls = new Set(students.map(s => s.roll_number.toUpperCase()));
    const seenInBatch = new Set();

    return lines.map(line => {
      // Formats: "Roll, Name, Batch" OR "Roll, Name" OR "Roll\tName"
      const parts = line.includes(',') 
        ? line.split(',').map(p => p.trim())
        : line.split(/\t+/).map(p => p.trim());

      const roll = (parts[0] || '').toUpperCase();
      const name = parts[1] || '';
      const batch = parts[2] ? parts[2].toUpperCase() : bulkDefaultBatch;

      const isDuplicateInDb = existingRolls.has(roll);
      const isDuplicateInBatch = seenInBatch.has(roll);
      if (roll) seenInBatch.add(roll);

      return {
        roll_number: roll,
        name,
        lab_batch: batch,
        isValid: Boolean(roll && name),
        isDuplicate: isDuplicateInDb || isDuplicateInBatch,
        duplicateReason: isDuplicateInDb ? 'Already in Database' : (isDuplicateInBatch ? 'Duplicate in this list' : null)
      };
    });
  }, [bulkText, bulkDefaultBatch, students]);

  // Update single student's batch
  const handleUpdateBatch = async (studentId, newBatch) => {
    try {
      const res = await api.updateStudentBatch(studentId, newBatch);
      if (res.success) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, lab_batch: newBatch } : s));
        setEditingStudentId(null);
        showToast(`Student batch updated to ${newBatch}!`);
        if (!availableBatches.includes(newBatch)) {
          setAvailableBatches(prev => [...prev, newBatch].sort());
        }
      }
    } catch (err) {
      alert('Error updating batch: ' + err.message);
    }
  };

  // Delete student
  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove student "${studentName}" from the database?`)) {
      return;
    }
    try {
      const res = await api.deleteStudent(studentId);
      if (res.success) {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        showToast(`Student ${studentName} removed from database.`);
      }
    } catch (err) {
      alert('Failed to delete student: ' + err.message);
    }
  };

  // Bulk update batches
  const handleBulkBatchUpdate = async () => {
    if (selectedStudentIds.length === 0 || !bulkTargetBatch) return;
    try {
      setSubmitting(true);
      const res = await api.bulkUpdateBatches(selectedStudentIds, bulkTargetBatch);
      if (res.success) {
        setStudents(prev => prev.map(s => selectedStudentIds.includes(s.id) ? { ...s, lab_batch: bulkTargetBatch } : s));
        const count = selectedStudentIds.length;
        setSelectedStudentIds([]);
        showToast(`Successfully reassigned ${count} students to Batch ${bulkTargetBatch}!`);
      }
    } catch (err) {
      alert('Bulk update error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Clean Demo Data action
  const handleCleanDemoData = async () => {
    if (!window.confirm('Clean Demo Data?\n\nThis will remove any sample test accounts (2024CS001-2024CS020) and demo sessions while preserving all real student records. Proceed?')) {
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.cleanDemoData();
      if (res.success) {
        showToast('Demo data cleaned successfully!');
        fetchStudents();
      }
    } catch (err) {
      alert('Failed to clean demo data: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Rename entire batch
  const handleRenameBatch = async (e) => {
    e.preventDefault();
    if (!renameOldBatch || !renameNewBatch.trim()) return;
    const cleanNew = renameNewBatch.trim().toUpperCase();

    try {
      setSubmitting(true);
      const res = await api.renameBatch(renameOldBatch, cleanNew);
      if (res.success) {
        showToast(`Batch ${renameOldBatch} renamed to ${cleanNew}!`);
        setRenameNewBatch('');
        fetchStudents();
      }
    } catch (err) {
      alert('Failed to rename batch: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Create new batch
  const handleCreateNewBatch = (e) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    const clean = newBatchName.trim().toUpperCase();
    if (!availableBatches.includes(clean)) {
      setAvailableBatches(prev => [...prev, clean].sort());
    }
    setBulkTargetBatch(clean);
    setNewBatchName('');
    showToast(`Batch "${clean}" added! You can now assign students to this batch.`);
  };

  // Add Single Student Submit
  const handleAddStudentSubmit = async (e, forceUpdate = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newStudent.roll_number || !newStudent.name) {
      setAddError({ message: 'Roll Number and Student Name are required.' });
      return;
    }

    try {
      setSubmitting(true);
      setAddError(null);

      const payload = {
        ...newStudent,
        update_if_exists: forceUpdate
      };

      const res = await api.addStudent(payload);
      if (res.success) {
        setIsAddModalOpen(false);
        showToast(res.message || `Student ${newStudent.name} saved successfully!`);
        
        // Reset form
        setNewStudent({
          roll_number: '',
          name: '',
          email: '',
          department: 'Computer Science & Engineering',
          semester: 5,
          section: 'A',
          lab_batch: availableBatches[0] || 'B1',
          phone: ''
        });

        if (semesterFilter !== 'All' && semesterFilter !== newStudent.semester) {
          setSemesterFilter('All');
        } else {
          fetchStudents();
        }
      }
    } catch (err) {
      const msg = err.message || 'Failed to save student';
      if (msg.includes('already exists') || msg.includes('already assigned') || msg.includes('duplicate')) {
        setAddError({
          message: msg,
          isDuplicate: true
        });
      } else {
        setAddError({ message: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Add Bulk Students Submit
  const handleBulkSubmit = async () => {
    const validStudents = parsedBulkStudents.filter(s => s.isValid && !s.isDuplicate);
    if (validStudents.length === 0) {
      alert('No new valid student records to add. Please check for errors or duplicates.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        students: validStudents.map(s => ({
          roll_number: s.roll_number,
          name: s.name,
          department: 'Computer Science & Engineering',
          semester: bulkSemester,
          section: bulkSection,
          lab_batch: s.lab_batch
        })),
        default_semester: bulkSemester,
        default_section: bulkSection,
        default_batch: bulkDefaultBatch
      };

      const res = await api.bulkCreateStudents(payload);
      if (res.success) {
        showToast(res.message);
        setBulkText('');
        setIsAddModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      alert('Bulk import error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Class Roster & Student Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Register students, manage lab batch groups, and prevent duplicate data
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Prominent Add Student Window Trigger */}
          <button
            onClick={() => {
              setAddModalTab('single');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => {
              setAddModalTab('bulk');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={() => setIsBatchManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Lab Batches</span>
          </button>

          <button
            onClick={handleCleanDemoData}
            className="px-2.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs hover:bg-rose-100 transition-all"
            title="Clean demo data from database"
          >
            Clean Demo
          </button>
        </div>
      </div>

      {/* Controls Bar: Search, Semester, Batch Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Semester Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase font-bold text-slate-500">Semester:</span>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="All">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </div>

            {/* Batch Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase font-bold text-slate-500">Batch:</span>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="All">All Batches</option>
                {availableBatches.map(b => (
                  <option key={b} value={b}>Batch {b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-indigo-50/80 border border-indigo-200 p-2.5 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <span className="text-xs font-bold text-indigo-900">
              {selectedStudentIds.length} student{selectedStudentIds.length === 1 ? '' : 's'} selected
            </span>
            <div className="flex items-center gap-2">
              <select
                value={bulkTargetBatch}
                onChange={(e) => setBulkTargetBatch(e.target.value)}
                className="bg-white border border-indigo-300 rounded-lg px-2 py-1 text-xs font-bold text-indigo-900"
              >
                {availableBatches.map(b => (
                  <option key={b} value={b}>Assign to Batch {b}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkBatchUpdate}
                disabled={submitting}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                {submitting ? 'Applying...' : 'Apply Batch'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="px-2 py-1 text-xs text-indigo-700 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Students List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Loading student roster...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base">No students found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click "Add Student" above to register students to the roster.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStudents.map(st => {
            const isSelected = selectedStudentIds.includes(st.id);
            return (
              <div
                key={st.id}
                className={`bg-white rounded-xl border p-4 transition-all relative ${
                  isSelected ? 'border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSelectStudent(st.id)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-600"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {st.name}
                      </h4>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {st.roll_number}
                      </span>
                    </div>
                  </div>

                  {/* Batch Pill */}
                  <span className="px-2 py-0.5 rounded-full uppercase font-black text-[10px] bg-violet-100 text-violet-800 shrink-0">
                    Batch {st.lab_batch || 'B1'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Sem {st.semester} • Sec {st.section}</span>
                    <span className="text-[11px] text-slate-400">{st.department || 'CSE'}</span>
                  </div>
                  {st.email && (
                    <div className="text-[11px] text-slate-600 truncate" title={st.email}>
                      {st.email}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Change:</span>
                    <select
                      value={st.lab_batch || 'B1'}
                      onChange={(e) => handleUpdateBatch(st.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-700"
                    >
                      {availableBatches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleDeleteStudent(st.id, st.name)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Remove student"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD STUDENT WINDOW (Single or Bulk Import) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Add Students to Roster
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddError(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setAddModalTab('single')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  addModalTab === 'single' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Single Student Registration
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab('bulk')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  addModalTab === 'bulk' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Bulk Import / Paste Roster
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {/* TAB 1: Single Student Entry */}
              {addModalTab === 'single' && (
                <form onSubmit={(e) => handleAddStudentSubmit(e, false)} className="space-y-4">
                  {/* Duplicate Alert */}
                  {addError && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Duplicate Detected:</span>
                          <span>{addError.message}</span>
                        </div>
                      </div>
                      {addError.isDuplicate && (
                        <button
                          type="button"
                          onClick={() => handleAddStudentSubmit(null, true)}
                          disabled={submitting}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
                        >
                          {submitting ? 'Updating...' : 'Overwrite Existing Details'}
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2504005"
                      value={newStudent.roll_number}
                      onChange={(e) => {
                        setNewStudent(prev => ({ ...prev, roll_number: e.target.value.toUpperCase() }));
                        if (addError) setAddError(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Full Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Semester
                      </label>
                      <select
                        value={newStudent.semester}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, semester: parseInt(e.target.value, 10) }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Lab Batch
                      </label>
                      <select
                        value={newStudent.lab_batch}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, lab_batch: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                      >
                        {availableBatches.map(b => (
                          <option key={b} value={b}>Batch {b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. student@gecbokaro.ac.in"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                    >
                      {submitting ? 'Saving...' : 'Register Student'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: Bulk Import Window */}
              {addModalTab === 'bulk' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <span className="font-bold block text-slate-800">Format Instructions:</span>
                    Paste one student per line in format: <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono font-bold">RollNumber, Student Name, Batch</code>
                    <p className="mt-1 text-[11px] text-slate-500">Example: <br/><code>2504005, Rahul Sharma, B1<br/>2504006, Priya Kumari, B2</code></p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Semester</label>
                      <select
                        value={bulkSemester}
                        onChange={(e) => setBulkSemester(parseInt(e.target.value, 10))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Sem {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Section</label>
                      <input
                        type="text"
                        value={bulkSection}
                        onChange={(e) => setBulkSection(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Default Batch</label>
                      <select
                        value={bulkDefaultBatch}
                        onChange={(e) => setBulkDefaultBatch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"
                      >
                        {availableBatches.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Paste Roster Lines:
                    </label>
                    <textarea
                      rows={6}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="2504005, Rahul Sharma, B1&#10;2504006, Priya Kumari, B2&#10;2504007, Amit Singh, B1"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {/* Parse Preview */}
                  {parsedBulkStudents.length > 0 && (
                    <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Preview ({parsedBulkStudents.length} entries parsed)</span>
                        <span className="text-emerald-700">
                          {parsedBulkStudents.filter(s => s.isValid && !s.isDuplicate).length} ready to add
                        </span>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100 text-xs">
                        {parsedBulkStudents.map((st, i) => (
                          <div key={i} className="pt-1 flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-800">{st.roll_number} - {st.name}</span>
                            {st.isDuplicate ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                {st.duplicateReason}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Batch {st.lab_batch}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkSubmit}
                      disabled={submitting || parsedBulkStudents.filter(s => s.isValid && !s.isDuplicate).length === 0}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                    >
                      {submitting ? 'Importing Roster...' : `Import ${parsedBulkStudents.filter(s => s.isValid && !s.isDuplicate).length} Students`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BATCH GROUP MANAGER */}
      {isBatchManagerOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Batch Group Customization
                </h3>
              </div>
              <button
                onClick={() => setIsBatchManagerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Add Batch */}
              <form onSubmit={handleCreateNewBatch} className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  1. Create New Batch Group
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. B3, Batch-A3"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Add Batch
                  </button>
                </div>
              </form>

              {/* Rename Batch */}
              <form onSubmit={handleRenameBatch} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Rename Batch Across Roster
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Current Batch</label>
                    <select
                      value={renameOldBatch}
                      onChange={(e) => setRenameOldBatch(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold"
                    >
                      {availableBatches.map(b => (
                        <option key={b} value={b}>Batch {b} ({batchCounts[b] || 0} students)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">New Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Batch-A1"
                      value={renameNewBatch}
                      onChange={(e) => setRenameNewBatch(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold uppercase"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !renameNewBatch.trim()}
                  className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  {submitting ? 'Applying...' : 'Apply Rename to Database'}
                </button>
              </form>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsBatchManagerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
