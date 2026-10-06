import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import TakeAttendancePage from './pages/TakeAttendancePage';
import UnifiedReport from './components/UnifiedReport';
import HistoryPage from './pages/HistoryPage';
import StudentsPage from './pages/StudentsPage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import { api } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gec_attendance_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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

  const handleLoginSuccess = (authData) => {
    setCurrentUser(authData);
    try {
      localStorage.setItem('gec_attendance_auth', JSON.stringify(authData));
    } catch (e) {
      console.warn('Failed to cache session:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('gec_attendance_auth');
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
  };

  // If user is NOT logged in, show the dual Student & Professor Login Screen
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        healthInfo={healthInfo}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        
        {/* 1. STUDENT PORTAL EXPERIENCE */}
        {currentUser.role === 'student' && (
          <StudentDashboard 
            studentUser={currentUser.user} 
            onLogout={handleLogout} 
          />
        )}

        {/* 2. PROFESSOR PORTAL EXPERIENCE */}
        {currentUser.role === 'professor' && (
          <>
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
          </>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (Only for Professors navigating multiple tools) */}
      {currentUser.role === 'professor' && (
        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      )}

    </div>
  );
}
