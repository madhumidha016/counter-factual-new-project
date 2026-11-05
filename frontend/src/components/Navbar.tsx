import React from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { PageName } from '../types';
import { 
  Activity, 
  FileText, 
  Layers, 
  Sliders, 
  Copy, 
  TrendingUp, 
  Home as HomeIcon,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPage, setCurrentPage, uploadData } = useAnalysis();

  const navItems: { id: PageName; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <HomeIcon className="w-4 h-4" /> },
    { id: 'detection', label: 'CNN Detection', icon: <Activity className="w-4 h-4" /> },
    { id: 'gradcam', label: 'Grad-CAM', icon: <Layers className="w-4 h-4" /> },
    { id: 'whatif', label: 'What-If Analysis', icon: <Sliders className="w-4 h-4" /> },
    { id: 'similar', label: 'Similar Cases', icon: <Copy className="w-4 h-4" /> },
    { id: 'progression', label: 'Progression', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'report', label: 'Report', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a0f1d]/90 backdrop-blur-2xl border-b border-cyan-500/15 shadow-[0_4px_30px_rgba(0,0,0,0.45)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo & Brand Presentation */}
          <div 
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-3.5 cursor-pointer group select-none shrink-0"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-purple-600 p-[2px] shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] group-hover:scale-105">
                <div className="w-full h-full bg-[#0c1322] rounded-[10px] flex items-center justify-center">
                  <span className="text-xl font-black bg-gradient-to-br from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent tracking-wider">
                    L
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0f1d]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                  Lung Cancer Detection
                </span>
                <span className="hidden xl:inline-flex text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                  Clinical Imaging
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Thoracic CT Diagnostic Platform</p>
            </div>
          </div>

          {/* Navigation Links with Enhanced Spacing, Visibility & Active Indicators */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 overflow-x-auto py-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 via-cyan-500/25 to-blue-600/20 text-white border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.07] border border-transparent'
                  }`}
                >
                  <span className={`transition-colors ${isActive ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active Session Status Badge */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {uploadData ? (
              <div className="flex items-center gap-2.5 text-xs bg-[#111c33]/90 text-slate-200 px-3.5 py-2 rounded-xl border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-emerald-400 font-bold tracking-tight">{uploadData.session_id}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs bg-[#111827]/80 text-slate-400 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Ready for CT Upload</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
