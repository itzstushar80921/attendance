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
  BookOpen
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

  // New Student Form
  const [newStudent, setNewStudent] = useState({
    roll_number: '',
    name: '',
    email: '',
    department: 'Computer Science & Engineering',
    semester: 1,
    section: 'A',
    lab_batch: 'B1',
    phone: ''
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Fetch all students (not hardcoded to semester 5 so all added students show up!)
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

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  // Add student form submit with duplicate handling & update_if_exists
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
          semester: 1,
          section: 'A',
          lab_batch: availableBatches[0] || 'B1',
          phone: ''
        });

        // Ensure semester filter shows newly added student
        if (semesterFilter !== 'All' && semesterFilter !== newStudent.semester) {
          setSemesterFilter('All');
        } else {
          fetchStudents();
        }
      }
    } catch (err) {
      // Check if error is duplicate
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
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Class Roster & Batch Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage student registrations and customize lab batch groups stored in Supabase
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBatchManagerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold text-xs sm:text-sm transition-all shadow-xs"
          >
            <Settings className="w-4 h-4 text-violet-600" />
            <span>Manage Batches</span>
          </button>

          <button
            onClick={() => {
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-100 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Semester & Batch Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        
        {/* Semester Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Semester:
          </span>
          {['All', 1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
            <button
              key={sem}
              onClick={() => setSemesterFilter(sem)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                semesterFilter === sem
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sem === 'All' ? 'All Semesters' : `Sem ${sem}`}
            </button>
          ))}
        </div>

        {/* Batch Selection */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lab Batch:
          </span>
          <button
            onClick={() => setBatchFilter('All')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              batchFilter === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Batches ({students.length})
          </button>

          {availableBatches.map(b => (
            <button
              key={b}
              onClick={() => setBatchFilter(b)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                batchFilter === b
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100'
              }`}
            >
              <span>Batch {b}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                batchFilter === b ? 'bg-white/20' : 'bg-violet-200 text-violet-900'
              }`}>
                {batchCounts[b] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar (Visible when students are selected) */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-indigo-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-200" />
            <span className="font-bold text-sm">
              {selectedStudentIds.length} students selected
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-indigo-200 font-medium hidden sm:inline">
              Move to:
            </span>
            <select
              value={bulkTargetBatch}
              onChange={(e) => setBulkTargetBatch(e.target.value)}
              className="bg-white text-slate-800 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none"
            >
              {availableBatches.map(b => (
                <option key={b} value={b}>Batch {b}</option>
              ))}
            </select>
            <button
              onClick={handleBulkBatchUpdate}
              disabled={submitting}
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all"
            >
              {submitting ? 'Updating...' : 'Assign Batch'}
            </button>
            <button
              onClick={() => setSelectedStudentIds([])}
              className="text-xs text-indigo-200 hover:text-white px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search & Select All Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-600 font-medium">
          <button
            onClick={selectAllVisible}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs"
          >
            {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All Visible</span>
          </button>
        </div>
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Loading student roster from Supabase...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No students found matching query</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting "All Semesters" or resetting batch filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredStudents.map(st => {
            const isSelected = selectedStudentIds.includes(st.id);
            const isEditing = editingStudentId === st.id;

            return (
              <div
                key={st.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition-all flex flex-col justify-between ${
                  isSelected ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSelectStudent(st.id)}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {st.roll_number}
                      </span>
                    </div>

                    {/* Interactive Lab Batch Modifier */}
                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setEditingStudentId(st.id);
                          setInlineBatchVal(st.lab_batch);
                        }}
                        className="text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg border border-violet-200 flex items-center gap-1 transition-all"
                        title="Click to edit batch"
                      >
                        <span>Batch {st.lab_batch}</span>
                        <Edit2 className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-violet-100 p-0.5 rounded-lg">
                        <select
                          value={inlineBatchVal}
                          onChange={(e) => {
                            setInlineBatchVal(e.target.value);
                            handleUpdateBatch(st.id, e.target.value);
                          }}
                          className="text-xs font-bold text-violet-900 bg-transparent focus:outline-none"
                          autoFocus
                        >
                          {availableBatches.map(b => (
                            <option key={b} value={b}>Batch {b}</option>
                          ))}
                          <option value="B3">Batch B3</option>
                          <option value="B4">Batch B4</option>
                        </select>
                        <button
                          onClick={() => setEditingStudentId(null)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 px-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base">
                    {st.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {st.department}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{st.email}</span>
                  </div>
                  {st.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{st.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1">
                    <span>Semester {st.semester} • Section {st.section}</span>
                    <button
                      onClick={() => handleDeleteStudent(st.id, st.name)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-all"
                      title="Remove student from database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Batch Group Customization Manager */}
      {isBatchManagerOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-600" />
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

            <div className="p-4 sm:p-6 space-y-6">
              
              {/* Form 1: Add New Batch */}
              <form onSubmit={handleCreateNewBatch} className="bg-violet-50/70 border border-violet-100 p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-900">
                  1. Create New Batch Group
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. B3, Batch-A3, Group-1"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Add Batch
                  </button>
                </div>
              </form>

              {/* Form 2: Rename Batch Across Cohort */}
              <form onSubmit={handleRenameBatch} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Rename Batch Across All Students
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
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">New Batch Name</label>
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
                  className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                >
                  {submitting ? 'Renaming in Database...' : 'Apply Rename to Database'}
                </button>
              </form>

            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsBatchManagerOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Student (With Inline Duplicate Validation & Overwrite) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Add Student to Database
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

            <form onSubmit={(e) => handleAddStudentSubmit(e, false)} className="p-4 sm:p-6 space-y-4">
              
              {/* Duplicate Error Banner with Overwrite Action */}
              {addError && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Attention:</span>
                      <span>{addError.message}</span>
                    </div>
                  </div>
                  {addError.isDuplicate && (
                    <div className="pt-2 flex items-center gap-2 border-t border-amber-200">
                      <button
                        type="button"
                        onClick={() => handleAddStudentSubmit(null, true)}
                        disabled={submitting}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        {submitting ? 'Updating...' : 'Update & Overwrite with New Details'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddError(null)}
                        className="px-2 py-1 text-xs text-amber-800 hover:underline"
                      >
                        Change Roll Number
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2504001"
                  value={newStudent.roll_number}
                  onChange={(e) => {
                    setNewStudent(prev => ({ ...prev, roll_number: e.target.value }));
                    if (addError) setAddError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditya Sharma"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Semester
                  </label>
                  <select
                    value={newStudent.semester}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, semester: parseInt(e.target.value, 10) }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Lab Batch Group
                  </label>
                  <select
                    value={newStudent.lab_batch}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, lab_batch: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableBatches.map(b => (
                      <option key={b} value={b}>Batch {b}</option>
                    ))}
                    <option value="B3">Batch B3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="student@college.edu"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setAddError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
                >
                  {submitting ? 'Saving to Database...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
