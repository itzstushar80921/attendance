import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FlaskConical, 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Ban,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'lecture', 'lab', 'extra', 'cancelled'
  const [selectedSession, setSelectedSession] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Class Cancellation Modal States
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState('Faculty Official Meeting / Duty');
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const reasonPresets = [
    'Faculty Official Meeting / Duty',
    'Faculty Leave / Medical Emergency',
    'College Sports / Cultural Event',
    'Institutional / State Holiday',
    'Technical / Computer Lab Maintenance',
    'Syllabus Rescheduled',
    'Other / Custom Reason'
  ];

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType === 'extra') {
        params.is_extra_class = true;
      } else if (filterType === 'cancelled') {
        params.is_cancelled = true;
      } else if (filterType !== 'all') {
        params.class_type = filterType;
      }

      const res = await api.getSessions(params);
      if (res.success) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filterType]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Cancel Class Confirmation
  const handleConfirmCancelClass = async () => {
    if (!sessionToCancel) return;
    try {
      setActionLoading(true);
      const finalReason = cancelReasonPreset === 'Other / Custom Reason' 
        ? (customReason.trim() || 'Cancelled by instructor')
        : cancelReasonPreset;

      const res = await api.cancelSession(sessionToCancel.id, finalReason);
      if (res.success) {
        setSessions(prev => prev.map(s => s.id === sessionToCancel.id ? res.data : s));
        if (selectedSession?.id === sessionToCancel.id) {
          setSelectedSession(res.data);
        }
        showToast(`Class cancelled successfully. Attendance reports updated!`);
        setSessionToCancel(null);
        setCustomReason('');
      }
    } catch (err) {
      alert('Failed to cancel session: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Restore Class
  const handleRestoreClass = async (session, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Restore this cancelled class session (${session.course_code})? Attendance calculations will be re-included.`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.restoreSession(session.id);
      if (res.success) {
        setSessions(prev => prev.map(s => s.id === session.id ? res.data : s));
        if (selectedSession?.id === session.id) {
          setSelectedSession(res.data);
        }
        showToast('Class session restored! Attendance re-included.');
      }
    } catch (err) {
      alert('Failed to restore session: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session and its attendance records permanently?')) {
      return;
    }
    try {
      setDeletingId(id);
      await api.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSession?.id === id) setSelectedSession(null);
      showToast('Session record deleted.');
    } catch (err) {
      alert('Failed to delete session: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleInspectSession = async (session) => {
    try {
      const res = await api.getSessionById(session.id);
      if (res.success) {
        setSelectedSession(res.data);
      }
    } catch (err) {
      alert('Error fetching session details: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Session Attendance & Class History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Audit logs of lecture and lab sessions • Cancel or restore classes as needed
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('lecture')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterType === 'lecture' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lectures
          </button>
          <button
            onClick={() => setFilterType('lab')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterType === 'lab' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Labs
          </button>
          <button
            onClick={() => setFilterType('extra')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterType === 'extra' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ Extra
          </button>
          <button
            onClick={() => setFilterType('cancelled')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterType === 'cancelled' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚫 Cancelled
          </button>
        </div>
      </div>

      {/* Session Cards List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">Loading session history...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base">No sessions match this filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Use "Take Attendance" to launch a new class or switch filter pills above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {sessions.map(sess => {
            const isLab = sess.class_type === 'lab';
            const isCancelled = Boolean(sess.is_cancelled);

            return (
              <div
                key={sess.id}
                onClick={() => handleInspectSession(sess)}
                className={`bg-white rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between p-4 sm:p-5 ${
                  isCancelled 
                    ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full uppercase font-black text-[10px] tracking-wide ${
                        isLab ? 'bg-violet-100 text-violet-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {sess.class_type} {isLab && sess.lab_batch ? `• Batch ${sess.lab_batch}` : ''}
                      </span>

                      {sess.is_extra_class && !isCancelled && (
                        <span className="px-2 py-0.5 rounded-full uppercase font-black text-[10px] tracking-wide bg-amber-100 text-amber-900 border border-amber-300">
                          ⚡ Extra Class{sess.extra_reason ? `: ${sess.extra_reason}` : ''}
                        </span>
                      )}

                      {isCancelled && (
                        <span className="px-2.5 py-0.5 rounded-full uppercase font-black text-[10px] tracking-wide bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <Ban className="w-3 h-3 text-rose-600" />
                          <span>Cancelled Class</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {sess.date}
                    </span>
                  </div>

                  {/* Course Code & Name */}
                  <h3 className={`font-extrabold text-base leading-snug ${isCancelled ? 'text-slate-700 line-through' : 'text-slate-900'}`}>
                    {sess.course_code}: {sess.course_name}
                  </h3>

                  {/* Cancellation Reason Notice */}
                  {isCancelled && (
                    <div className="mt-2 p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-900 text-xs flex items-start gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Reason: </span>
                        <span>{sess.cancellation_reason || 'Cancelled by instructor'}</span>
                        <span className="block text-[11px] text-rose-700 font-normal">Attendance is deducted from student total calculation.</span>
                      </div>
                    </div>
                  )}

                  {sess.clean_topic && (
                    <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-1">
                      Topic: {sess.clean_topic}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {sess.time_slot}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {sess.location || (isLab ? 'Lab' : 'LH')}
                    </span>
                  </div>
                </div>

                {/* Card Actions Bottom Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    <span>Inspect Roster</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* CANCEL CLASS / RESTORE CLASS TOGGLE */}
                    {isCancelled ? (
                      <button
                        type="button"
                        onClick={(e) => handleRestoreClass(sess, e)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1 transition-all"
                        title="Restore class and re-include in attendance"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToCancel(sess);
                        }}
                        disabled={actionLoading}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 transition-all"
                        title="Cancel this class session"
                      >
                        <Ban className="w-3 h-3 text-rose-600" />
                        <span>Cancel Class</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDelete(sess.id, e)}
                      disabled={deletingId === sess.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Permanently delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Cancel Class Reason Dialog */}
      {sessionToCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-rose-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Cancel Class Session
                </h3>
              </div>
              <button
                onClick={() => setSessionToCancel(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <span className="font-bold block text-slate-900 text-sm">
                  {sessionToCancel.course_code}: {sessionToCancel.course_name}
                </span>
                <span>Date: {sessionToCancel.date} • Slot: {sessionToCancel.time_slot}</span>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Impact on Attendance:</strong> This class will be marked as cancelled. It will be <strong>excluded from conducted class totals</strong>, so students will not be penalized and attendance percentages will update automatically.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Reason for Class Cancellation *
                </label>
                <select
                  value={cancelReasonPreset}
                  onChange={(e) => setCancelReasonPreset(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {reasonPresets.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {cancelReasonPreset === 'Other / Custom Reason' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Custom Cancellation Note
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Guest lecture scheduled in auditorium"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSessionToCancel(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-white"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmCancelClass}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Class Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Session Details Inspector */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded uppercase font-black text-[10px] ${
                    selectedSession.class_type === 'lab' ? 'bg-violet-100 text-violet-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {selectedSession.class_type}
                  </span>
                  {selectedSession.is_cancelled && (
                    <span className="px-2 py-0.5 rounded uppercase font-black text-[10px] bg-rose-100 text-rose-800">
                      Cancelled
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedSession.date} • {selectedSession.time_slot}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mt-1">
                  {selectedSession.course_code}: {selectedSession.course_name}
                </h3>
                {selectedSession.clean_topic && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    Topic: {selectedSession.clean_topic}
                  </p>
                )}
                {selectedSession.is_cancelled && (
                  <p className="text-xs text-rose-700 font-semibold mt-1">
                    Cancellation Reason: {selectedSession.cancellation_reason || 'N/A'} (Excluded from student totals)
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Student Roster Status ({selectedSession.records?.length || 0})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedSession.records?.map(rec => (
                  <div key={rec.id} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {rec.students?.roll_number || 'N/A'}
                      </span>
                      <span className="font-bold text-slate-800">
                        {rec.students?.name || 'Student'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      selectedSession.is_cancelled ? 'bg-slate-100 text-slate-600' :
                      rec.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                      rec.status === 'absent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedSession.is_cancelled ? 'Class Cancelled' : rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                {selectedSession.is_cancelled ? (
                  <button
                    type="button"
                    onClick={(e) => handleRestoreClass(selectedSession, e)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Class</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSessionToCancel(selectedSession)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm flex items-center gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel This Class</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
