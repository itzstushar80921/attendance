import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import TakeAttendancePage from './pages/TakeAttendancePage';
import UnifiedReport from './components/UnifiedReport';
import HistoryPage from './pages/HistoryPage';
import StudentsPage from './pages/StudentsPage';
import { api } from './services/api';
import { Database, Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [healthInfo, setHealthInfo] = useState(null);

  useEffect(() => {
    async function checkBackend() {
      try {
        const info = await api.checkHealth();
        setHealthInfo(info);
      } catch (err) {
        console.warn('Backend health check warning:', err.message);
        setHealthInfo({ supabaseConnected: false, database: 'Offline / Connecting' });
      }
    }
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        healthInfo={healthInfo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        
        {/* Supabase Notice Banner (If not yet connected to live Supabase URL) */}
        {healthInfo && !healthInfo.supabaseConnected && (
          <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 text-xs text-amber-900 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Active in Demo In-Memory Database Mode.</span>{' '}
                <span className="text-amber-800">
                  Full feature preview is active! To sync with your real Supabase instance, add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">SUPABASE_URL</code> & <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">SUPABASE_ANON_KEY</code> to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">backend/.env</code>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'attendance' && (
          <TakeAttendancePage onNavigateToReports={() => setActiveTab('reports')} />
        )}

        {activeTab === 'reports' && (
          <UnifiedReport />
        )}

        {activeTab === 'history' && (
          <HistoryPage />
        )}

        {activeTab === 'students' && (
          <StudentsPage />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on desktop) */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

    </div>
  );
}
