import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { fetchSimilarCases } from '../services/api';
import { SimilarCase } from '../types';
import { 
  Copy, 
  Filter, 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  Dna,
  Layers,
  Sparkles
} from 'lucide-react';

export const SimilarCases: React.FC = () => {
  const { uploadData, detectionData, setCurrentPage } = useAnalysis();

  const [cases, setCases] = useState<SimilarCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [diagnosisFilter, setDiagnosisFilter] = useState<string>('all');
  const [minSimilarity, setMinSimilarity] = useState<number>(0);

  const loadCases = async () => {
    if (!uploadData?.session_id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchSimilarCases(
        uploadData.session_id,
        stageFilter,
        diagnosisFilter,
        minSimilarity
      );
      setCases(res.cases);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve reference cases.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (uploadData?.session_id) {
      loadCases();
    }
  }, [uploadData?.session_id, stageFilter, diagnosisFilter, minSimilarity]);

  if (!uploadData || !detectionData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
          <Copy className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Scan Detection Required</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Similar case retrieval requires 256-D feature embeddings extracted from the query CT scan.
        </p>
        <button
          onClick={() => setCurrentPage('detection')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-glow-blue"
        >
          <span>Go to CNN Detection</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Similar Cases – Clinical Case Retrieval System
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Retrieve past verified clinical records from the thoracic database whose latent CNN feature representations 
            most closely match the patient's current CT scan slice using high-dimensional cosine similarity.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('progression')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold transition self-start sm:self-auto shrink-0 shadow-glow-blue"
        >
          <span>Next: Disease Progression</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Search & Filter Retrieval Parameters</span>
          </div>
          <span className="text-xs text-cyan-300 font-mono font-semibold">
            {cases.length} matched cohort records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Stage Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Filter by Stage:</label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full glass-input rounded-lg p-2.5 text-xs text-white"
            >
              <option value="all" className="bg-[#111827]">All Stages & Benign</option>
              <option value="Stage I" className="bg-[#111827]">Stage I</option>
              <option value="Stage II" className="bg-[#111827]">Stage II</option>
              <option value="Stage III" className="bg-[#111827]">Stage III</option>
              <option value="Stage IV" className="bg-[#111827]">Stage IV</option>
              <option value="Benign" className="bg-[#111827]">Benign Non-Neoplastic</option>
            </select>
          </div>

          {/* Diagnosis Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Filter by Diagnosis:</label>
            <select
              value={diagnosisFilter}
              onChange={(e) => setDiagnosisFilter(e.target.value)}
              className="w-full glass-input rounded-lg p-2.5 text-xs text-white"
            >
              <option value="all" className="bg-[#111827]">All Histological Subtypes</option>
              <option value="Adenocarcinoma" className="bg-[#111827]">Adenocarcinoma</option>
              <option value="Squamous" className="bg-[#111827]">Squamous Cell Carcinoma</option>
              <option value="Neuroendocrine" className="bg-[#111827]">Large Cell / Neuroendocrine</option>
              <option value="Hamartoma" className="bg-[#111827]">Benign Hamartoma</option>
              <option value="Granuloma" className="bg-[#111827]">Benign Granuloma</option>
            </select>
          </div>

          {/* Min Similarity Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-300">Min Cosine Match:</label>
              <span className="font-bold text-cyan-300 font-mono">{minSimilarity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Retrieved Cases Cards */}
      {isLoading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <span className="text-xs text-slate-300">Computing 256-D cosine distance across clinical thoracic archives...</span>
        </div>
      ) : cases.length === 0 ? (
        <div className="p-8 text-center glass-card rounded-2xl text-xs text-slate-400">
          No cases match the specified filtering parameters. Try relaxing the stage or similarity threshold.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <div 
              key={c.case_id}
              className="glass-card-interactive rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-4 bg-[#0d1322] border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-white tracking-wide">{c.case_id}</span>
                  <div className="text-[11px] text-slate-400">{c.anatomical_location}</div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                    {c.similarity_score}% Match
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 flex-1">
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  <div className="aspect-square w-full max-w-[160px] bg-black rounded-xl overflow-hidden border border-white/10 shadow-md">
                    <img
                      src={c.image_url}
                      alt={c.case_id}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 font-mono">Thoracic CT Slice</span>
                </div>

                <div className="sm:col-span-7 space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Diagnosis & Stage</span>
                    <p className="font-bold text-white text-sm">{c.diagnosis}</p>
                    <p className="text-cyan-300 font-semibold">{c.stage} ({c.sub_stage})</p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Morphology</span>
                    <p className="text-slate-300 text-[11px]">{c.morphology} ({c.nodule_size_mm} mm)</p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Clinical Treatment</span>
                    <p className="text-slate-300 text-[11px] leading-tight">{c.treatment}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Observed Registry Outcome</span>
                    <p className="text-emerald-400 font-semibold text-[11px] leading-tight">{c.treatment_outcome}</p>
                  </div>
                </div>
              </div>

              {/* Biomarker Footer */}
              {c.molecular_biomarkers && (
                <div className="px-5 py-2.5 bg-[#0d1322] border-t border-white/[0.08] text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span><b className="text-slate-300">Biomarkers:</b> {c.molecular_biomarkers}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Clinical Comparison Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.08] bg-[#0d1322]">
          <h2 className="text-sm font-bold text-white">
            Cohort Comparison Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured comparison of retrieved cohort pathology, staging classification, and therapeutic regimens.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#111827] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-3">Case ID</th>
                <th className="p-3">Similarity</th>
                <th className="p-3">Diagnosis</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Size (mm)</th>
                <th className="p-3">Treatment Protocol</th>
                <th className="p-3">Clinical Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {cases.map((c) => (
                <tr key={c.case_id} className="hover:bg-white/[0.03] transition">
                  <td className="p-3 font-mono font-bold text-cyan-300">{c.case_id}</td>
                  <td className="p-3 font-bold text-emerald-400">{c.similarity_score}%</td>
                  <td className="p-3 font-semibold text-white">{c.diagnosis}</td>
                  <td className="p-3 text-slate-300">{c.stage}</td>
                  <td className="p-3 text-slate-300">{c.nodule_size_mm} mm</td>
                  <td className="p-3 max-w-xs truncate text-slate-300" title={c.treatment}>{c.treatment}</td>
                  <td className="p-3 max-w-xs truncate text-emerald-300 font-medium" title={c.treatment_outcome}>{c.treatment_outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation CTA */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => setCurrentPage('whatif')}
          className="text-xs font-semibold text-slate-400 hover:text-white"
        >
          ← Back to What-If Analysis
        </button>
        <button
          onClick={() => setCurrentPage('progression')}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold transition shadow-glow-blue hover:scale-[1.02]"
        >
          <span>Proceed to Disease Progression</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
