import React from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Server, 
  BookOpen, 
  BarChart3, 
  History, 
  Users,
  Building2 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, healthInfo }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & College Brand: Government Engineering College, Bokaro */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-lg leading-tight">
                  Government Engineering College, Bokaro
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  GEC Bokaro
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                राजकीय अभियंत्रण महाविद्यालय, बोकारो • Faculty Attendance & Lab Portal
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Take Attendance
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'reports'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Unified Reports
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              Session History
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'students'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Students & Batches
            </button>
          </nav>

          {/* System Status Indicator (Supabase Connected) */}
          <div className="flex items-center gap-2 shrink-0">
            <div 
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200"
              title="Database Connected to Supabase"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Supabase Live</span>
              <span className="sm:hidden">Online</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
