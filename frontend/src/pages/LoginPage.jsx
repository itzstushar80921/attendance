import React, { useState } from 'react';
import { 
  Building2, 
  GraduationCap, 
  UserCheck, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'professor'
  const [rollNumber, setRollNumber] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  
  const [facultyId, setFacultyId] = useState('faculty@gecbokaro.ac.in');
  const [facultyPassword, setFacultyPassword] = useState('admin123');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Student Login Handler
  const handleStudentSubmit = async (e) => {
    e?.preventDefault();
    if (!rollNumber.trim()) {
      setError('Please enter your University Roll Number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.studentLogin(rollNumber.trim(), studentPassword);
      if (res.success) {
        onLoginSuccess(res);
      } else {
        setError(res.message || 'Unable to log in as student.');
      }
    } catch (err) {
      setError(err.message || 'Network error during student login.');
    } finally {
      setLoading(false);
    }
  };

  // Professor Login Handler
  const handleProfessorSubmit = async (e) => {
    e?.preventDefault();
    if (!facultyId.trim()) {
      setError('Please enter your Faculty ID or Email.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.professorLogin(facultyId.trim(), facultyPassword);
      if (res.success) {
        onLoginSuccess(res);
      } else {
        setError(res.message || 'Unable to log in as professor.');
      }
    } catch (err) {
      setError(err.message || 'Network error during professor login.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins
  const handleQuickStudentLogin = (roll) => {
    setRollNumber(roll);
    setError(null);
    setLoading(true);
    api.studentLogin(roll)
      .then(res => {
        if (res.success) onLoginSuccess(res);
        else setError(res.message);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleQuickProfLogin = () => {
    setFacultyId('faculty@gecbokaro.ac.in');
    setFacultyPassword('admin123');
    setError(null);
    setLoading(true);
    api.professorLogin('faculty@gecbokaro.ac.in', 'admin123')
      .then(res => {
        if (res.success) onLoginSuccess(res);
        else setError(res.message);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-indigo-50/40 to-slate-100 flex flex-col justify-center items-center px-4 py-8">
      
      {/* College Identity Header */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-200 mb-3 ring-4 ring-white">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/80 text-indigo-800 text-[11px] font-black uppercase tracking-wider mb-1.5 border border-indigo-200">
          Government of Jharkhand • AICTE Approved
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Government Engineering College, Bokaro
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
          राजकीय अभियंत्रण महाविद्यालय, बोकारो
        </p>
        <p className="text-xs text-indigo-600 font-bold mt-0.5">
          Digital Academic Attendance Management Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveRole('student'); setError(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeRole === 'student'
                ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveRole('professor'); setError(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeRole === 'professor'
                ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Faculty / Professor</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* 1. STUDENT LOGIN FORM */}
          {activeRole === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  University Roll Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 2024CS002 or 2504001"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all uppercase tracking-wider"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Enter your registered roll number to view semester attendance & 75% calculation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Password / PIN <span className="text-slate-400 font-normal lowercase">(optional in demo mode)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Enter PIN (Default: Roll Number)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>View My Attendance & 75% Target</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Sample Logins for Students */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Quick Access (Sample GEC Bokaro Students):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickStudentLogin('2024CS002')}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-all"
                  >
                    Aditi Verma (2024CS002)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStudentLogin('2024CS003')}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-all"
                  >
                    Ananya Patel (2024CS003)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStudentLogin('2504001')}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-all"
                  >
                    Abhiudhay (2504001)
                  </button>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Student Features:
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time overall, lecture & lab attendance %</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>75% Target Calculator</strong>: Know exact classes required to reach 75%</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Separate tracking for each semester with subject-wise reports</span>
                </div>
              </div>

            </form>
          )}

          {/* 2. PROFESSOR LOGIN FORM */}
          {activeRole === 'professor' && (
            <form onSubmit={handleProfessorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Faculty Email or ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    placeholder="e.g. faculty@gecbokaro.ac.in"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Faculty Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={facultyPassword}
                    onChange={(e) => setFacultyPassword(e.target.value)}
                    placeholder="Enter password (default: admin123)"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Default password: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-bold">admin123</code></span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-black text-sm shadow-lg shadow-slate-300 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating Faculty...
                  </span>
                ) : (
                  <>
                    <span>Log In to Faculty Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Faculty Demo Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleQuickProfLogin}
                  className="w-full py-2.5 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold text-xs border border-violet-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>One-Click Faculty Demo (Dr. Robert Vance)</span>
                </button>
              </div>

              {/* Professor Highlights */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Faculty Privileges:
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Take attendance for regular Lectures & Practical Labs</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Create & manage Extra Classes</strong> with remedial attendance</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Editable Lab Batches, Semester Isolation & CSV Export</span>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 font-medium">
        © {new Date().getFullYear()} Government Engineering College, Bokaro • All Rights Reserved
      </div>

    </div>
  );
}
