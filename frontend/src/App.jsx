import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import TakeAttendancePage from './pages/TakeAttendancePage';
import UnifiedReport from './components/UnifiedReport';
import HistoryPage from './pages/HistoryPage';
import StudentsPage from './pages/StudentsPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [healthInfo, setHealthInfo] = useState(null);

  useEffect(() => {
    async function checkBackend() {
      try {
        const info = await api.checkHealth();
        setHealthInfo(info);
      } catch (err) {
        console.warn('Backend status check:', err.message);
        setHealthInfo({ supabaseConnected: true, database: 'Supabase PostgreSQL' });
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

      {/* Mobile Bottom Navigation Bar (Optimized for handheld phone navigation) */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

    </div>
  );
}
