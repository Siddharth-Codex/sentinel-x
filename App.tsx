import React from 'react';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { AlertDetailModal } from './components/alerts/AlertDetailModal';

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

const AppContent: React.FC = () => {
  const { activeTab, selectedAlert, setSelectedAlert, theme } = useSecurity();

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
    </div>
  );
};

export function App() {
  return (
    <SecurityProvider>
      <AppContent />
    </SecurityProvider>
  );
}

export default App;
