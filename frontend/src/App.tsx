import React from 'react';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CnnDetection } from './pages/CnnDetection';
import { GradCamAnalysis } from './pages/GradCamAnalysis';
import { WhatIfAnalysis } from './pages/WhatIfAnalysis';
import { SimilarCases } from './pages/SimilarCases';
import { DiseaseProgression } from './pages/DiseaseProgression';
import { PatientReport } from './pages/PatientReport';

const MainContent: React.FC = () => {
  const { currentPage } = useAnalysis();

  return (
    <main className="flex-1 pb-16">
      {currentPage === 'home' && <Home />}
      {currentPage === 'detection' && <CnnDetection />}
      {currentPage === 'gradcam' && <GradCamAnalysis />}
      {currentPage === 'whatif' && <WhatIfAnalysis />}
      {currentPage === 'similar' && <SimilarCases />}
      {currentPage === 'progression' && <DiseaseProgression />}
      {currentPage === 'report' && <PatientReport />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AnalysisProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0f1d] via-[#0d1629] to-[#121026] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <MainContent />
        <footer className="bg-[#0b1220]/80 backdrop-blur-md border-t border-white/[0.08] py-4 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-green" />
              <span className="font-semibold text-slate-300">Thoracic Imaging Clinical Decision Support Environment</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Standard Protocol v2.4</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              <span>Confidential Diagnostic Workspace &bull; Clinical Analysis System</span>
            </div>
          </div>
        </footer>
      </div>
    </AnalysisProvider>
  );
};

export default App;

