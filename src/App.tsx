import React from 'react';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { AlertDetailModal } from './components/alerts/AlertDetailModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { FirebaseSetupModal } from './components/auth/FirebaseSetupModal';

// Authentication Screens
import { AuthLayout } from './components/auth/AuthLayout';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';

// Pages
import { CommandCentre } from './pages/CommandCentre';
import { TrafficAnalysis } from './pages/TrafficAnalysis';
import { NetworkMap } from './pages/NetworkMap';
import { AlertIntelligence } from './pages/AlertIntelligence';
import { AttackStoryline } from './pages/AttackStoryline';
import { Investigations } from './pages/Investigations';
import { AISecurityAnalyst } from './pages/AISecurityAnalyst';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

import { ShieldAlert, Loader2, Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, selectedAlert, setSelectedAlert, theme } = useSecurity();
  const { 
    isAuthenticated, 
    isLoading, 
    authView, 
    isProfileOpen, 
    setIsProfileOpen, 
    isFirebaseSetupOpen, 
    setIsFirebaseSetupOpen 
  } = useAuth();

  // 1. Initial Authentication Session Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#060913] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4 font-mono select-none">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-sky-600/30 to-blue-700/20 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.35)] animate-pulse">
            <ShieldAlert className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-cyan-500/40 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-cyan-400" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center space-x-1.5 text-sm font-bold tracking-widest text-white">
            <span>SENTINEL</span>
            <span className="text-cyan-400">X</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              v2.4-SOC
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Restoring Authenticated SOC Session...</span>
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State: Show Authentication Gateway
  if (!isAuthenticated) {
    return (
      <AuthLayout>
        {authView === 'login' && <LoginPage />}
        {authView === 'register' && <RegisterPage />}
        {authView === 'forgot-password' && <ForgotPasswordPage />}
        {authView === 'reset-password' && <ResetPasswordPage />}
      </AuthLayout>
    );
  }

  // 3. Authenticated State: Full Protected SOC Dashboard
  const renderActivePage = () => {
    switch (activeTab) {
      case 'command-centre':
        return <CommandCentre />;
      case 'traffic':
        return <TrafficAnalysis />;
      case 'network-map':
        return <NetworkMap />;
      case 'alerts':
        return <AlertIntelligence />;
      case 'storyline':
        return <AttackStoryline />;
      case 'investigations':
        return <Investigations />;
      case 'ai-analyst':
        return <AISecurityAnalyst />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <CommandCentre />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#080B12] text-slate-100' : 'bg-white text-slate-900'
    }`}>
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-colors duration-200 ${
          theme === 'dark' 
            ? 'bg-gradient-to-b from-[#080B12] via-[#0A0E17] to-[#080B12]' 
            : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal />
      <AlertDetailModal 
        alert={selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
      />
      {isProfileOpen && (
        <UserProfileModal onClose={() => setIsProfileOpen(false)} />
      )}
      {isFirebaseSetupOpen && (
        <FirebaseSetupModal onClose={() => setIsFirebaseSetupOpen(false)} />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SecurityProvider>
        <AppContent />
      </SecurityProvider>
    </AuthProvider>
  );
}

export default App;
