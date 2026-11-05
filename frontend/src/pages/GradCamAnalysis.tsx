import React from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { StageDistributionChart } from '../components/StageDistributionChart';
import { 
  ArrowRight, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowUpRight,
  Eye,
  Activity,
  ShieldAlert
} from 'lucide-react';

export const GradCamAnalysis: React.FC = () => {
  const { detectionData, setCurrentPage } = useAnalysis();

  if (!detectionData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">No Detection Data Available</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please upload a thoracic CT scan and execute CNN detection before viewing Grad-CAM saliency maps.
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

  const prob = detectionData.cancer_probability;
  const probPercent = Math.round(prob * 100);

  // Distinct risk color-coding:
  // High probability: RED (#EF4444)
  // Moderate probability: ORANGE (#F59E0B)
  // Low probability: GREEN (#22C55E)
  let riskTheme = {
    badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    barColor: "bg-emerald-500",
    glowClass: "shadow-glow-green",
    label: "Low Malignancy Probability (Low Risk)",
    textColor: "text-emerald-400"
  };

  if (prob >= 0.70) {
    riskTheme = {
      badgeBg: "bg-red-500/10 border-red-500/40 text-red-400",
      barColor: "bg-red-500",
      glowClass: "shadow-glow-red",
      label: "High Malignancy Probability (High Risk)",
      textColor: "text-red-400"
    };
  } else if (prob >= 0.40) {
    riskTheme = {
      badgeBg: "bg-amber-500/10 border-amber-500/40 text-amber-400",
      barColor: "bg-amber-500",
      glowClass: "shadow-glow-orange",
      label: "Moderate / Indeterminate Probability (Warning)",
      textColor: "text-amber-400"
    };
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Grad-CAM Analysis
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Gradient-weighted Class Activation Mapping computes spatial gradients flowing into convolutional layer 
            <span className="font-mono text-xs bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-white/10 mx-1">conv4</span> 
            to highlight critical pulmonary lesions guiding deep network classification.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('whatif')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold transition self-start sm:self-auto shrink-0 shadow-glow-blue"
        >
          <span>Proceed to Counterfactual What-If</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION 1: CANCER PROBABILITY (PROMINENT AT TOP) */}
      <div className={`glass-card rounded-2xl p-6 sm:p-8 space-y-4 border ${riskTheme.glowClass}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Primary Diagnostic Probability Indicator
            </span>
            <div className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-1 flex items-baseline gap-3">
              <span>Cancer Probability:</span>
              <span className={riskTheme.textColor}>{probPercent}%</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskTheme.badgeBg}`}>
              {riskTheme.label}
            </span>
            <span className="text-xs text-slate-400">
              Inference Latency: <span className="font-mono text-cyan-300">{detectionData.inference_time_ms} ms</span>
            </span>
          </div>
        </div>

        {/* Large Progress Bar with Risk Gradient */}
        <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-white/10 p-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${riskTheme.barColor}`}
            style={{ width: `${probPercent}%` }}
          />
        </div>

        {/* Clear Visual Breakdown: Cancer, Normal, Category, Stage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs text-slate-300">
          <div className="p-4 bg-red-950/40 rounded-xl border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <span className="text-slate-400 text-[11px] block uppercase font-bold tracking-wider">Cancer Probability</span>
            <span className="text-2xl font-black text-red-400 mt-1 block">{probPercent}%</span>
            <p className="text-[11px] text-slate-400 mt-1">Predicted malignancy likelihood</p>
          </div>

          <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="text-slate-400 text-[11px] block uppercase font-bold tracking-wider">Normal Probability</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{100 - probPercent}%</span>
            <p className="text-[11px] text-slate-400 mt-1">Predicted benign / non-malignant</p>
          </div>

          <div className="p-4 bg-[#0d1629] rounded-xl border border-white/[0.08]">
            <span className="text-slate-400 text-[11px] block uppercase font-bold tracking-wider">Predicted Category</span>
            <span className="text-2xl font-black text-white mt-1 block">{detectionData.predicted_class}</span>
            <p className="text-[11px] text-slate-400 mt-1">Decision threshold: 50%</p>
          </div>

          <div className="p-4 bg-[#0d1629] rounded-xl border border-white/[0.08]">
            <span className="text-slate-400 text-[11px] block uppercase font-bold tracking-wider">Predicted Stage</span>
            <span className="text-2xl font-black text-cyan-300 mt-1 block">{detectionData.predicted_stage}</span>
            <p className="text-[11px] text-slate-400 mt-1">TNM pulmonary classification</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: CANCER STAGE PREDICTION & LARGE INTERACTIVE PROBABILITY CHART */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Stage-wise Probability Distribution
            </h2>
            <p className="text-xs text-slate-400">
              Interactive probability comparison chart across clinical staging categories. Distinct risk colors applied.
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            Highest Stage Predicted: {detectionData.predicted_stage}
          </div>
        </div>

        {/* Large Attractive Interactive Probability Chart */}
        <StageDistributionChart 
          probabilities={detectionData.stage_probabilities}
          predictedStage={detectionData.predicted_stage}
        />

        <div className="p-3.5 bg-blue-950/30 rounded-xl border border-blue-500/20 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <b>Visual Interpretation of Results:</b> Stage I represents localized nodular disease (&le; 3 cm); Stage II represents larger masses (3–5 cm) or hilar nodal involvement; Stage III indicates mediastinal lymphadenopathy; and Stage IV indicates distant metastatic dissemination. Model staging is a statistical estimation requiring histological and full-body PET-CT validation.
          </span>
        </div>
      </div>

      {/* SECTION 3: GRAD-CAM VISUALIZATION (Original, Heatmap, Overlay) */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            Grad-CAM Visual Explanations (Side-by-Side Comparison)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Saliency attribution maps localizing the focal pulmonary regions contributing directly to the model's malignancy neuron.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* 1. Original CT Scan */}
          <div className="space-y-2 text-center">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-square flex items-center justify-center shadow-md">
              <img
                src={detectionData.original_url}
                alt="Original Thoracic CT Scan"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-bold text-white">
              1. Original CT Scan
            </div>
            <p className="text-[11px] text-slate-400">Unprocessed axial thoracic input slice</p>
          </div>

          {/* 2. Grad-CAM Heatmap */}
          <div className="space-y-2 text-center">
            <div className="rounded-xl overflow-hidden border border-red-500/30 bg-black aspect-square flex items-center justify-center shadow-glow-red">
              <img
                src={detectionData.heatmap_url}
                alt="Grad-CAM Saliency Heatmap"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-bold text-red-400">
              2. Grad-CAM Heatmap
            </div>
            <p className="text-[11px] text-slate-400">ColorJet spatial gradient intensity distribution</p>
          </div>

          {/* 3. Grad-CAM Overlay */}
          <div className="space-y-2 text-center">
            <div className="rounded-xl overflow-hidden border border-cyan-500/30 bg-black aspect-square flex items-center justify-center shadow-glow-cyan">
              <img
                src={detectionData.overlay_url}
                alt="Grad-CAM Lesion Overlay"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-bold text-cyan-300">
              3. Grad-CAM Overlay
            </div>
            <p className="text-[11px] text-slate-400">Blended anatomical lesion registration (62% CT / 38% Map)</p>
          </div>
        </div>
      </div>

      {/* SECTION 4: COMPARATIVE SIMILAR CASES PREVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Comparative Similar Cases Preview
            </h2>
            <p className="text-xs text-slate-400">
              Nearest reference cases retrieved from the clinical dataset based on cosine distance across 256-D CNN embeddings.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('similar')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
          >
            <span>View All Clinical Records</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {detectionData.similar_cases_preview.map((sc) => (
            <div 
              key={sc.case_id}
              className="glass-card-interactive rounded-xl p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{sc.case_id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-cyan-300 border border-cyan-500/30">
                    {sc.similarity_score}% Match
                  </span>
                </div>

                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
                  <img
                    src={sc.image_url}
                    alt={sc.case_id}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-bold text-white">{sc.diagnosis}</p>
                  <p className="text-slate-400">Stage: <span className="font-medium text-slate-200">{sc.stage}</span></p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    <span className="text-slate-300 font-medium">Outcome:</span> {sc.treatment_outcome}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA to What-If Analysis */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={() => setCurrentPage('whatif')}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold transition shadow-glow-blue hover:scale-[1.02]"
        >
          <span>Proceed to Counterfactual What-If Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
