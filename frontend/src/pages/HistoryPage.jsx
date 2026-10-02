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
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'lecture', 'lab'
  const [selectedSession, setSelectedSession] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getSessions({
        class_type: filterType
      });
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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session and its attendance records?')) {
      return;
    }
    try {
      setDeletingId(id);
      await api.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSession?.id === id) setSelectedSession(null);
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Session Attendance History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Logs of past lecture and lab attendance taken by the professor
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            All Sessions
          </button>
          <button
            onClick={() => setFilterType('lecture')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'lecture' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Lectures Only
          </button>
          <button
            onClick={() => setFilterType('lab')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'lab' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Labs Only
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
          <h3 className="font-bold text-slate-800 text-base">No attendance sessions recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Use the "Take Attendance" tab to start a new lecture or lab session and mark student attendance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {sessions.map(sess => {
            const isLab = sess.class_type === 'lab';
            return (
              <div
                key={sess.id}
                onClick={() => handleInspectSession(sess)}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full uppercase font-black text-[10px] tracking-wide ${
                      isLab ? 'bg-violet-100 text-violet-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {sess.class_type} {isLab && sess.lab_batch ? `• Batch ${sess.lab_batch}` : ''}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {sess.date}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                    {sess.course_code}: {sess.course_name}
                  </h3>

                  {sess.topic_covered && (
                    <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-1">
                      Topic: {sess.topic_covered}
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

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    <span>Inspect Attendance</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(sess.id, e)}
                    disabled={deletingId === sess.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session Details Inspector Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded uppercase font-extrabold text-[10px] ${
                    selectedSession.class_type === 'lab' ? 'bg-violet-100 text-violet-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {selectedSession.class_type}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedSession.date} • {selectedSession.time_slot}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mt-1">
                  {selectedSession.course_code}: {selectedSession.course_name}
                </h3>
                {selectedSession.topic_covered && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    Topic: {selectedSession.topic_covered}
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
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                Marked Students ({selectedSession.records?.length || 0})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
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
                    <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                      rec.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                      rec.status === 'absent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
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
