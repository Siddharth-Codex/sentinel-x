import React, { useEffect, useRef, useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  HelpCircle, 
  FileText, 
  Activity,
  Cpu,
  Globe,
  Settings,
  Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FirebaseSetupModal } from './FirebaseSetupModal';
import { TermsModal } from './TermsModal';
import { PrivacyModal } from './PrivacyModal';
import { HelpModal } from './HelpModal';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { providerType, isFirebaseReady, setIsFirebaseSetupOpen, isFirebaseSetupOpen } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Subtle animated interactive network particle grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
    }

    const particleCount = Math.min(50, Math.floor((width * height) / 22000));
    const particles: Particle[] = [];
    const colors = ['#0284c7', '#0ea5e9', '#38bdf8', '#06b6d4', '#6366f1'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 120) * 0.15})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-cyan-950/20 via-[#050811] to-[#03050c] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Background animated canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0" 
      />

      {/* Top Banner Navigation Bar */}
      <header className="relative z-10 w-full border-b border-slate-800/60 bg-[#070b16]/75 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-widest font-mono text-white">SENTINEL</span>
              <span className="font-extrabold text-sm text-cyan-400">X</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                v2.4-SOC
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 tracking-wider">
              AI NETWORK THREAT INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Security status indicator & Provider Badge */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsFirebaseSetupOpen(true)}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 text-slate-300 transition-colors"
            title="Configure or inspect authentication backend"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Provider:</span>
            <span className="font-bold text-cyan-300">
              {providerType === 'firebase' ? 'Firebase SDK' : 'Sentinel Sovereign'}
            </span>
            <Settings className="w-3 h-3 text-slate-400 ml-1" />
          </button>

          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOC Gateway Online • TLS 1.3</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Desktop Two-Column / Mobile Single Column */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          
          {/* Left Column: Enterprise SOC Branding, Telemetry & Product Showcase */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero-Trust Enterprise Authentication</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Secure Access to Your <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                  Intelligence Platform
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Authenticate to access your network security operations, investigate behavioral anomalies, and correlate multi-stage threat campaigns.
              </p>
            </div>

            {/* Feature Telemetry Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0A0F1D]/80 backdrop-blur-xs flex items-start space-x-3 shadow-xs">
                <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">Behavioral Engines</div>
                  <div className="text-[11px] text-slate-400">7 deterministic statistical & Z-score detectors</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0A0F1D]/80 backdrop-blur-xs flex items-start space-x-3 shadow-xs">
                <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">Topology Graph</div>
                  <div className="text-[11px] text-slate-400">Subnet cluster mapping with flow animation</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0A0F1D]/80 backdrop-blur-xs flex items-start space-x-3 shadow-xs">
                <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">AI Threat Analyst</div>
                  <div className="text-[11px] text-slate-400">Gemini 3.8 Flash automated incident triage</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0A0F1D]/80 backdrop-blur-xs flex items-start space-x-3 shadow-xs">
                <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">Forensic Dossiers</div>
                  <div className="text-[11px] text-slate-400">Executive PDF reports & case management</div>
                </div>
              </div>
            </div>

            {/* Cryptographic Compliance Notice */}
            <div className="pt-2 text-xs font-mono text-slate-400 flex items-center justify-center lg:justify-start space-x-2">
              <Lock className="w-3.5 h-3.5 text-cyan-500" />
              <span>SHA-512 / PBKDF2 Session Security • RFC-1918 Network Forensics</span>
            </div>
          </div>

          {/* Right Column: Centered High-End Authentication Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>

        </div>
      </main>

      {/* Footer Links with Modals for Terms, Privacy, and Help */}
      <footer className="relative z-10 w-full border-t border-slate-800/60 bg-[#070b16]/75 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 space-y-2 sm:space-y-0">
          <div>
            <span>© {new Date().getFullYear()} SENTINEL X Threat Intelligence Platform. All rights reserved.</span>
          </div>
          <div className="flex items-center space-x-5 font-mono">
            <button 
              onClick={() => setShowPrivacy(true)}
              className="hover:text-cyan-400 transition-colors focus:outline-none"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              onClick={() => setShowTerms(true)}
              className="hover:text-cyan-400 transition-colors focus:outline-none"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button 
              onClick={() => setShowHelp(true)}
              className="hover:text-cyan-400 transition-colors flex items-center space-x-1 focus:outline-none"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help & Docs</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isFirebaseSetupOpen && <FirebaseSetupModal onClose={() => setIsFirebaseSetupOpen(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};
