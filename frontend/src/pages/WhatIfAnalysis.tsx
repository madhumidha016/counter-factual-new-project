import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { runCounterfactual } from '../services/api';
import { ComparisonGraph } from '../components/ComparisonGraph';
import { 
  Sliders, 
  ArrowRight, 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Loader2, 
  Sparkles,
  Info,
  Layers,
  CheckCircle2,
  Scan
} from 'lucide-react';

export const WhatIfAnalysis: React.FC = () => {
  const { 
    uploadData, 
    detectionData, 
    counterfactualData, 
    setCounterfactualData, 
    setCurrentPage 
  } = useAnalysis();

  const [selectedMode, setSelectedMode] = useState<string>('mask');
  const [selectedStrength, setSelectedStrength] = useState<string>('medium');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!uploadData || !detectionData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
          <Sliders className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Scan Detection Required First</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Counterfactual what-if perturbation requires an initial baseline scan analysis and Grad-CAM lesion localization.
        </p>
        <button
          onClick={() => setCurrentPage('detection')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-glow-blue"
        >
          <span>Run Detection First</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const origProb = detectionData.cancer_probability;
  const origNormalProb = Math.round((1.0 - origProb) * 100);
  const origProbPercent = Math.round(origProb * 100);

  const handleApplyWhatIf = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const res = await runCounterfactual(
        uploadData.session_id,
        selectedMode,
        selectedStrength
      );
      setCounterfactualData(res);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to execute counterfactual intervention.");
    } finally {
      setIsProcessing(false);
    }
  };

  const modes = [
    {
      id: 'mask',
      label: 'Mask Suspicious Region',
      desc: 'Inpaints the localized pulmonary lesion with simulated healthy parenchyma attenuation to observe complete ablation effect.'
    },
    {
      id: 'blur',
      label: 'Blur Suspicious Region',
      desc: 'Applies Gaussian filtration to attenuate edge sharpness, spiculation, and fine calcification signatures.'
    },
    {
      id: 'reduce_intensity',
      label: 'Reduce Intensity in Suspicious Region',
      desc: 'Decreases radiodensity by scaling Hounsfield attenuation towards sub-solid or air-density baseline.'
    }
  ];

  const strengths = [
    {
      id: 'low',
      title: '1. LOW INTERVENTION',
      subtitle: 'Mild 35% controlled perturbation',
      description: 'Applies a subtle 35% blend of the intervention kernel. Evaluates initial model sensitivity to mild histological edge attenuation.',
      sliderVal: 35
    },
    {
      id: 'medium',
      title: '2. MEDIUM INTERVENTION',
      subtitle: 'Moderate 70% controlled perturbation',
      description: 'Applies a substantial 70% modification across the lesion area. Assesses model stability under significant loss of focal nodule contrast.',
      sliderVal: 70
    },
    {
      id: 'high',
      title: '3. HIGH INTERVENTION',
      subtitle: 'Full 100% complete ablation intervention',
      description: 'Applies complete 100% masking or maximal smoothing across the target region to test total causal reliance of the neural classifier.',
      sliderVal: 100
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Counterfactual What-If Analysis
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Investigate how modifying selected image features changes the same CNN model's prediction. 
            Causal counterfactual verification applies controlled perturbations directly to the identified lesion region.
          </p>
        </div>
        <button
          onClick={() => setCurrentPage('similar')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold transition self-start sm:self-auto shrink-0 shadow-glow-blue"
        >
          <span>Next: Similar Cases</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* STEP 1 & 2: ORIGINAL CT SCAN & IDENTIFIED IMPORTANT REGION MASK */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-white/[0.08] pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyan-400" />
            Step 1 & 2: Baseline Scan & Localized Lesion Region Mask
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Initial model inference and spatial region mask derived from Grad-CAM attribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Original CT Scan with Overlaid Metrics */}
          <div className="md:col-span-4 space-y-2 text-center">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-square flex items-center justify-center shadow-md">
              <img
                src={detectionData.original_url}
                alt="Original CT Scan"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-bold text-white">Original Uploaded CT Scan</div>
          </div>

          {/* Center: Localized Lesion Mask Visual */}
          <div className="md:col-span-4 space-y-2 text-center">
            <div className="rounded-xl overflow-hidden border border-cyan-500/30 bg-black aspect-square flex items-center justify-center shadow-glow-cyan">
              <img
                src={counterfactualData?.mask_image_url || detectionData.overlay_url}
                alt="Identified Region Mask"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-bold text-cyan-300">Identified Lesion Region Mask</div>
            <p className="text-[11px] text-slate-400">Targeted high-importance zone for perturbation</p>
          </div>

          {/* Right: Original Prediction Baseline Summary */}
          <div className="md:col-span-4 p-5 bg-[#0d1322] rounded-xl border border-white/[0.08] space-y-3 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Baseline Model Predictions
            </span>

            <div className="p-3 bg-red-950/40 rounded-lg border border-red-500/30">
              <span className="text-slate-400 text-[11px] block">Original Cancer Probability:</span>
              <span className="text-2xl font-black text-red-400">{origProbPercent}%</span>
            </div>

            <div className="p-3 bg-emerald-950/40 rounded-lg border border-emerald-500/30">
              <span className="text-slate-400 text-[11px] block">Original Normal Probability:</span>
              <span className="text-2xl font-black text-emerald-400">{origNormalProb}%</span>
            </div>

            <div className="pt-1 text-slate-300 space-y-1">
              <p><span className="text-slate-400">Predicted Category:</span> <span className="font-bold text-white">{detectionData.predicted_class}</span></p>
              <p><span className="text-slate-400">Predicted Stage:</span> <span className="font-bold text-cyan-300">{detectionData.predicted_stage}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3 & 5: CONFIGURE WHAT-IF INTERVENTION (VERTICAL LAYOUT) */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-white/[0.08] pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Step 3 & 5: Configure What-If Intervention
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select the digital perturbation mode and choose an intervention strength arranged vertically.
          </p>
        </div>

        {/* Intervention Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Intervention Mode
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {modes.map((m) => {
              const isSelected = selectedMode === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/10 shadow-glow-cyan'
                      : 'border-white/10 hover:border-white/20 bg-[#111827]/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => setSelectedMode(m.id)}
                      className="text-cyan-500 focus:ring-cyan-400"
                    />
                    <span className="text-sm font-bold text-white">{m.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 5: VERTICAL INTERVENTION STRENGTH OPTIONS (ONE BELOW ANOTHER) */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Intervention Strength (Arranged Vertically)
          </label>

          <div className="flex flex-col space-y-4">
            {strengths.map((s) => {
              const isSelected = selectedStrength === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStrength(s.id)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 shadow-glow-cyan'
                      : 'border-white/10 hover:border-white/20 bg-[#111827]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#080B14]" />}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white tracking-wide">{s.title}</span>
                        <span className="text-xs text-cyan-300 ml-2 font-medium">({s.subtitle})</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">{s.sliderVal}% Intensity</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 pl-8 leading-relaxed">
                    {s.description}
                  </p>

                  {/* Vertical controls revealed directly below the selection */}
                  {isSelected && (
                    <div className="mt-4 pt-3 border-t border-white/10 pl-8 space-y-2 animate-fadeIn">
                      <div className="flex justify-between text-xs text-slate-300 font-medium">
                        <span>Applied Perturbation Level:</span>
                        <span className="text-cyan-300 font-bold">{s.sliderVal}% Kernel Attenuation</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
                          style={{ width: `${s.sliderVal}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.08]">
          <span className="text-xs text-slate-400">
            Selected: <span className="font-bold text-cyan-300">{selectedMode.replace('_', ' ').toUpperCase()}</span> ({selectedStrength.toUpperCase()})
          </span>

          <button
            onClick={handleApplyWhatIf}
            disabled={isProcessing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:opacity-95 text-white text-sm font-bold transition shadow-glow-cyan hover:scale-[1.02] disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Applying Intervention & Rerunning Same CNN Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Apply What-If Analysis</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-950/60 border border-red-500/40 text-red-200 text-xs rounded-xl shadow-glow-red">
            {errorMessage}
          </div>
        )}
      </div>

      {/* STEP 7 & 8: BEFORE AND AFTER COMPARISON WITH PERCENTAGES ABOVE EACH IMAGE */}
      {counterfactualData && (
        <div className="space-y-8 animate-fadeIn">
          {/* STEP 7: BEFORE AND AFTER IMAGE COMPARISON */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="text-lg font-bold text-white">
                Step 7: Before and After Image Comparison
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Percentages and measured shifts prominently displayed above each radiological image.
              </p>
            </div>

            {/* PROMINENT COMPARISON BAR ABOVE BOTH IMAGES */}
            <div className="p-4 bg-[#0d1322] rounded-xl border border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-4 text-center items-center">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Original Prediction</span>
                <span className="text-3xl font-black text-white">{Math.round(counterfactualData.original_probability * 100)}%</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Normal: {Math.round((counterfactualData.original_normal_probability || (1 - counterfactualData.original_probability)) * 100)}%
                </span>
              </div>

              <div className="p-3 bg-blue-950/50 rounded-xl border border-cyan-500/30 shadow-glow-cyan">
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">Measured Difference</span>
                <span className={`text-2xl sm:text-3xl font-black ${counterfactualData.probability_difference < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {counterfactualData.difference_percentage_points !== undefined
                    ? `${counterfactualData.difference_percentage_points > 0 ? '+' : ''}${counterfactualData.difference_percentage_points} percentage points`
                    : `${counterfactualData.probability_difference > 0 ? '+' : ''}${(counterfactualData.probability_difference * 100).toFixed(1)} percentage points`}
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5">
                  Trend: {counterfactualData.trend}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">Counterfactual Prediction</span>
                <span className="text-3xl font-black text-cyan-300">{Math.round(counterfactualData.counterfactual_probability * 100)}%</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Normal: {Math.round((counterfactualData.counterfactual_normal_probability || (1 - counterfactualData.counterfactual_probability)) * 100)}%
                </span>
              </div>
            </div>

            {/* Large Before and After Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              {/* Left: Original Image */}
              <div className="space-y-2 text-center">
                <div className="p-3 bg-[#0d1322] rounded-xl border border-white/10 mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Original Scan</span>
                  <div className="text-xl font-black text-red-400 mt-0.5">
                    Cancer Prob: {Math.round(counterfactualData.original_probability * 100)}%
                  </div>
                  <div className="text-xs text-slate-400">
                    Normal Prob: {Math.round((counterfactualData.original_normal_probability || (1 - counterfactualData.original_probability)) * 100)}%
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-square flex items-center justify-center shadow-md">
                  <img
                    src={detectionData.original_url}
                    alt="Original CT Scan"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs text-slate-400">
                  Category: <span className="text-white font-semibold">{counterfactualData.original_predicted_stage}</span>
                </div>
              </div>

              {/* Right: Counterfactual Modified Image */}
              <div className="space-y-2 text-center">
                <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-500/30 mb-2">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Counterfactual Modified Scan</span>
                  <div className="text-xl font-black text-cyan-300 mt-0.5">
                    Cancer Prob: {Math.round(counterfactualData.counterfactual_probability * 100)}%
                  </div>
                  <div className="text-xs text-slate-400">
                    Normal Prob: {Math.round((counterfactualData.counterfactual_normal_probability || (1 - counterfactualData.counterfactual_probability)) * 100)}%
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-cyan-500/30 bg-black aspect-square flex items-center justify-center shadow-glow-cyan">
                  <img
                    src={counterfactualData.modified_image_url}
                    alt="Counterfactual Modified Scan"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs text-slate-400">
                  Applied: <span className="text-cyan-300 font-semibold">{counterfactualData.description}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 8: PREDICTION COMPARISON GRAPH */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Step 8: Prediction Comparison Graph
              </h2>
              <p className="text-xs text-slate-400">
                Direct comparative analysis between Original and Counterfactual probabilities for Cancer, Normal, and Stage classes.
              </p>
            </div>

            <ComparisonGraph data={counterfactualData.comparison_chart_data} />
          </div>

          {/* STEP 9: COUNTERFACTUAL INTERPRETATION & SCIENTIFIC LIMITATION */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-400" />
              Step 9: Counterfactual Scientific Interpretation
            </h2>

            <div className="p-4 bg-[#0d1322] rounded-xl border border-white/[0.08] text-xs text-slate-200 space-y-2 leading-relaxed">
              <p className="font-semibold text-cyan-300">Model Sensitivity Summary:</p>
              <p>{counterfactualData.scientific_interpretation}</p>
            </div>

            <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">CRITICAL SCIENTIFIC & METHODOLOGICAL LIMITATION</p>
                <p className="leading-relaxed">
                  {counterfactualData.medical_disclaimer}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation CTA */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentPage('gradcam')}
              className="text-xs font-semibold text-slate-400 hover:text-white"
            >
              ← Back to Grad-CAM
            </button>
            <button
              onClick={() => setCurrentPage('similar')}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold transition shadow-glow-blue hover:scale-[1.02]"
            >
              <span>Proceed to Similar Case Retrieval</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
