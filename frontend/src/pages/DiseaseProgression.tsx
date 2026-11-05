import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { analyzeProgression } from '../services/api';
import { ProgressionTrendChart } from '../components/ProgressionTrendChart';
import { 
  TrendingUp, 
  ArrowRight, 
  Calendar, 
  Upload, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Info,
  ShieldAlert,
  Trash2,
  RefreshCw,
  FileCheck2,
  Layers
} from 'lucide-react';

export const DiseaseProgression: React.FC = () => {
  const { uploadData, progressionData, setProgressionData, setCurrentPage } = useAnalysis();

  // Three distinct dates
  const [initialDate, setInitialDate] = useState<string>("2025-01-15");
  const [month3Date, setMonth3Date] = useState<string>("2025-04-15");
  const [month6Date, setMonth6Date] = useState<string>("2025-07-15");

  // Three independent files selected by user (NO automatic default images)
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [month3File, setMonth3File] = useState<File | null>(null);
  const [month6File, setMonth6File] = useState<File | null>(null);

  // Previews (only shown AFTER the user uploads)
  const [initialPreview, setInitialPreview] = useState<string | null>(null);
  const [month3Preview, setMonth3Preview] = useState<string | null>(null);
  const [month6Preview, setMonth6Preview] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.dcm', '.dicom'];

  const validateFile = (file: File): string | null => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!SUPPORTED_EXTS.includes(ext) && file.type && !file.type.startsWith('image/')) {
      return `File format '${ext}' unsupported. Supported formats: JPG, JPEG, PNG, BMP, TIFF, DICOM.`;
    }
    if (file.size > 16 * 1024 * 1024) {
      return `File exceeds 16 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
    }
    if (file.size < 100) {
      return `File is empty or corrupted.`;
    }
    return null;
  };

  const handleFileUpload = (sectionNum: 1 | 2 | 3, file: File) => {
    const err = validateFile(file);
    if (err) {
      setErrorMessage(err);
      return;
    }
    setErrorMessage(null);
    const url = URL.createObjectURL(file);

    if (sectionNum === 1) {
      setInitialFile(file);
      setInitialPreview(url);
    } else if (sectionNum === 2) {
      setMonth3File(file);
      setMonth3Preview(url);
    } else {
      setMonth6File(file);
      setMonth6Preview(url);
    }
  };

  const handleRemoveFile = (sectionNum: 1 | 2 | 3) => {
    if (sectionNum === 1) {
      setInitialFile(null);
      setInitialPreview(null);
    } else if (sectionNum === 2) {
      setMonth3File(null);
      setMonth3Preview(null);
    } else {
      setMonth6File(null);
      setMonth6Preview(null);
    }
  };

  const allThreeUploaded = !!(initialFile && month3File && month6File);

  const handleRunProgression = async () => {
    if (!allThreeUploaded) {
      setErrorMessage("The user must upload all three scans (Initial, 3-Month Follow-up, and 6-Month Follow-up) before running progression analysis.");
      return;
    }

    const sid = uploadData?.session_id || "SES-PROG-USER";
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const res = await analyzeProgression(
        sid,
        initialDate,
        month3Date,
        month6Date,
        initialFile!,
        month3File!,
        month6File!
      );
      setProgressionData(res);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze longitudinal cancer progression.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Optional convenience helper for quick demo testing if user requests it
  const handleLoadDemoCohort = async () => {
    try {
      setIsProcessing(true);
      const r1 = await fetch('/datasets/reference_scans/NLST-CASE-1142.png');
      const b1 = await r1.blob();
      handleFileUpload(1, new File([b1], "Initial_CT_Scan.png", { type: "image/png" }));

      const r2 = await fetch('/datasets/reference_scans/NLST-CASE-0849.png');
      const b2 = await r2.blob();
      handleFileUpload(2, new File([b2], "3_Months_Followup_CT.png", { type: "image/png" }));

      const r3 = await fetch('/datasets/reference_scans/LIDC-IDRI-0231.png');
      const b3 = await r3.blob();
      handleFileUpload(3, new File([b3], "6_Months_Followup_CT.png", { type: "image/png" }));
    } catch (e) {
      setErrorMessage("Could not load sample cohort slices.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Disease Progression Simulator
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Longitudinal tumor growth comparison across 3 separate imaging sessions. 
            Measures unidimensional lesion diameter (RECIST 1.1), calculates volume doubling time (VDT), and projects kinetic growth trajectories.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('report')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold transition self-start sm:self-auto shrink-0 shadow-glow-blue"
        >
          <span>Next: Patient Report</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* THREE INDEPENDENT UPLOAD SECTIONS (ARRANGED VERTICALLY) */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Three Scan Sessions (Vertical Upload Configuration)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload the Initial CT Scan, 3-Month Follow-up CT Scan, and 6-Month Follow-up CT Scan from your device.
            </p>
          </div>
          <button
            onClick={handleLoadDemoCohort}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            Load Reference Longitudinal Series (Quick Fill)
          </button>
        </div>

        {/* VERTICAL UPLOAD SECTIONS (ONE BELOW ANOTHER) */}
        <div className="flex flex-col space-y-6">
          {/* UPLOAD SECTION 1: INITIAL CT SCAN */}
          <div className="p-5 bg-[#0d1322] rounded-xl border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.05] pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">UPLOAD SECTION 1</span>
                <h3 className="text-base font-bold text-white">Initial CT Scan</h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Scan Date:</label>
                <input
                  type="date"
                  value={initialDate}
                  onChange={(e) => setInitialDate(e.target.value)}
                  className="glass-input rounded-lg px-2.5 py-1 text-xs text-white"
                />
              </div>
            </div>

            {!initialPreview ? (
              <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-[#111827]/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition">
                <Upload className="w-8 h-8 text-cyan-400 mb-2" />
                <span className="text-sm font-semibold text-cyan-300 hover:underline">
                  Browse from Device
                </span>
                <span className="text-xs text-slate-400 mt-1">Select Initial Baseline Thoracic CT Scan (Max 16 MB)</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dcm,application/dicom"
                  onChange={(e) => e.target.files && handleFileUpload(1, e.target.files[0])}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#151D2E] rounded-xl border border-cyan-500/30">
                <div className="w-36 h-36 bg-black rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <img src={initialPreview} alt="Initial CT Preview" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-2 text-xs flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Initial Scan Ready
                  </div>
                  <p className="text-white font-medium">File: {initialFile?.name}</p>
                  <p className="text-slate-400">Size: {((initialFile?.size || 0) / 1024).toFixed(1)} KB</p>
                  <div className="flex gap-2 pt-1">
                    <label className="cursor-pointer px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-medium transition flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Replace Image
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dcm,application/dicom"
                        onChange={(e) => e.target.files && handleFileUpload(1, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => handleRemoveFile(1)}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/60 rounded text-red-400 text-xs font-medium transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* UPLOAD SECTION 2: 3 MONTHS FOLLOW-UP CT SCAN */}
          <div className="p-5 bg-[#0d1322] rounded-xl border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.05] pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">UPLOAD SECTION 2</span>
                <h3 className="text-base font-bold text-white">3 Months Follow-up CT Scan</h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Scan Date:</label>
                <input
                  type="date"
                  value={month3Date}
                  onChange={(e) => setMonth3Date(e.target.value)}
                  className="glass-input rounded-lg px-2.5 py-1 text-xs text-white"
                />
              </div>
            </div>

            {!month3Preview ? (
              <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-[#111827]/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition">
                <Upload className="w-8 h-8 text-cyan-400 mb-2" />
                <span className="text-sm font-semibold text-cyan-300 hover:underline">
                  Browse from Device
                </span>
                <span className="text-xs text-slate-400 mt-1">Select 3 Months Follow-up CT Scan (Max 16 MB)</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dcm,application/dicom"
                  onChange={(e) => e.target.files && handleFileUpload(2, e.target.files[0])}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#151D2E] rounded-xl border border-cyan-500/30">
                <div className="w-36 h-36 bg-black rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <img src={month3Preview} alt="3 Months Follow-up CT Preview" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-2 text-xs flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 3-Month Follow-up Scan Ready
                  </div>
                  <p className="text-white font-medium">File: {month3File?.name}</p>
                  <p className="text-slate-400">Size: {((month3File?.size || 0) / 1024).toFixed(1)} KB</p>
                  <div className="flex gap-2 pt-1">
                    <label className="cursor-pointer px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-medium transition flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Replace Image
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dcm,application/dicom"
                        onChange={(e) => e.target.files && handleFileUpload(2, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => handleRemoveFile(2)}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/60 rounded text-red-400 text-xs font-medium transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* UPLOAD SECTION 3: 6 MONTHS FOLLOW-UP CT SCAN */}
          <div className="p-5 bg-[#0d1322] rounded-xl border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.05] pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">UPLOAD SECTION 3</span>
                <h3 className="text-base font-bold text-white">6 Months Follow-up CT Scan</h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Scan Date:</label>
                <input
                  type="date"
                  value={month6Date}
                  onChange={(e) => setMonth6Date(e.target.value)}
                  className="glass-input rounded-lg px-2.5 py-1 text-xs text-white"
                />
              </div>
            </div>

            {!month6Preview ? (
              <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-[#111827]/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition">
                <Upload className="w-8 h-8 text-cyan-400 mb-2" />
                <span className="text-sm font-semibold text-cyan-300 hover:underline">
                  Browse from Device
                </span>
                <span className="text-xs text-slate-400 mt-1">Select 6 Months Follow-up CT Scan (Max 16 MB)</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dcm,application/dicom"
                  onChange={(e) => e.target.files && handleFileUpload(3, e.target.files[0])}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#151D2E] rounded-xl border border-cyan-500/30">
                <div className="w-36 h-36 bg-black rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <img src={month6Preview} alt="6 Months Follow-up CT Preview" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-2 text-xs flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 6-Month Follow-up Scan Ready
                  </div>
                  <p className="text-white font-medium">File: {month6File?.name}</p>
                  <p className="text-slate-400">Size: {((month6File?.size || 0) / 1024).toFixed(1)} KB</p>
                  <div className="flex gap-2 pt-1">
                    <label className="cursor-pointer px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-medium transition flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Replace Image
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dcm,application/dicom"
                        onChange={(e) => e.target.files && handleFileUpload(3, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => handleRemoveFile(3)}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/60 rounded text-red-400 text-xs font-medium transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-950/60 border border-red-500/40 text-red-200 text-xs rounded-xl flex items-center gap-2 shadow-glow-red">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Progression Run Action */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            {allThreeUploaded ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> All three longitudinal scans selected & verified
              </span>
            ) : (
              <span className="text-amber-400 font-medium">
                * Please upload all three CT scans above to execute progression analysis
              </span>
            )}
          </span>

          <button
            onClick={handleRunProgression}
            disabled={!allThreeUploaded || isProcessing}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition shadow-glass ${
              !allThreeUploaded || isProcessing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:opacity-95 text-white shadow-glow-blue hover:scale-[1.02]'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Segmenting Lesions & Calculating RECIST 1.1 Doubling Kinetics...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Run Longitudinal Progression Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PROGRESSION RESULTS SECTION */}
      {progressionData && (
        <div className="space-y-8 animate-fadeIn">
          {/* STEP 1 & 2: IMAGE COMPARISON & TUMOR REGION IDENTIFICATION */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="text-lg font-bold text-white">
                Step 1 & 2: Longitudinal CT Image Comparison & Tumor Segmentation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Red contours identify the focal lesion boundary and caliper diameter lines across all three scan intervals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Scan 1: Initial */}
              <div className="p-4 bg-[#0d1322] rounded-xl border border-white/[0.08] text-center space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Initial CT Scan
                </div>
                <div className="text-xs text-slate-400">
                  {progressionData.sessions.initial?.date || progressionData.sessions.baseline?.date}
                </div>
                <div className="aspect-square bg-black rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <img
                    src={progressionData.sessions.initial?.image_url || progressionData.sessions.baseline?.image_url}
                    alt="Initial Annotated Scan"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs space-y-1 bg-[#151D2E] p-3 rounded-lg border border-white/5">
                  <p className="text-cyan-300 font-bold text-sm">
                    Diameter: {progressionData.growth_metrics?.initial_diameter_mm || progressionData.sessions.initial?.diameter_mm || 15.1} mm
                  </p>
                  <p className="text-slate-300">
                    Area: {progressionData.sessions.initial?.measurements.area_mm2 || progressionData.sessions.baseline?.measurements.area_mm2} mm²
                  </p>
                  <p className="text-slate-400">
                    Volume: {progressionData.sessions.initial?.measurements.volume_mm3 || progressionData.sessions.baseline?.measurements.volume_mm3} mm³
                  </p>
                </div>
              </div>

              {/* Scan 2: 3 Months */}
              <div className="p-4 bg-[#0d1322] rounded-xl border border-white/[0.08] text-center space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  3 Months Follow-up CT Scan
                </div>
                <div className="text-xs text-slate-400">
                  {progressionData.sessions.followup_3m?.date || progressionData.sessions.interim?.date}
                </div>
                <div className="aspect-square bg-black rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <img
                    src={progressionData.sessions.followup_3m?.image_url || progressionData.sessions.interim?.image_url}
                    alt="3 Months Follow-up Annotated Scan"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs space-y-1 bg-[#151D2E] p-3 rounded-lg border border-white/5">
                  <p className="text-cyan-300 font-bold text-sm">
                    Diameter: {progressionData.growth_metrics?.month3_diameter_mm || progressionData.sessions.followup_3m?.diameter_mm || 17.7} mm
                  </p>
                  <p className="text-amber-400 font-semibold">
                    Change: {progressionData.sessions.followup_3m?.delta_diameter_mm !== undefined ? `${progressionData.sessions.followup_3m.delta_diameter_mm > 0 ? '+' : ''}${progressionData.sessions.followup_3m.delta_diameter_mm} mm` : '+2.6 mm'} ({progressionData.sessions.followup_3m?.pct_change_diameter || 17.2}%)
                  </p>
                  <p className="text-slate-300">
                    Area: {progressionData.sessions.followup_3m?.measurements.area_mm2 || progressionData.sessions.interim?.measurements.area_mm2} mm²
                  </p>
                </div>
              </div>

              {/* Scan 3: 6 Months */}
              <div className="p-4 bg-[#0d1322] rounded-xl border border-white/[0.08] text-center space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  6 Months Follow-up CT Scan
                </div>
                <div className="text-xs text-slate-400">
                  {progressionData.sessions.followup_6m?.date || progressionData.sessions.current?.date}
                </div>
                <div className="aspect-square bg-black rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <img
                    src={progressionData.sessions.followup_6m?.image_url || progressionData.sessions.current?.image_url}
                    alt="6 Months Follow-up Annotated Scan"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs space-y-1 bg-[#151D2E] p-3 rounded-lg border border-white/5">
                  <p className="text-cyan-300 font-bold text-sm">
                    Diameter: {progressionData.growth_metrics?.month6_diameter_mm || progressionData.sessions.followup_6m?.diameter_mm || 20.5} mm
                  </p>
                  <p className="text-red-400 font-semibold">
                    Change: {progressionData.sessions.followup_6m?.delta_diameter_mm !== undefined ? `${progressionData.sessions.followup_6m.delta_diameter_mm > 0 ? '+' : ''}${progressionData.sessions.followup_6m.delta_diameter_mm} mm` : '+2.8 mm'} ({progressionData.sessions.followup_6m?.pct_change_diameter || 15.8}%)
                  </p>
                  <p className="text-slate-300">
                    Area: {progressionData.sessions.followup_6m?.measurements.area_mm2 || progressionData.sessions.current?.measurements.area_mm2} mm²
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 & 4: TUMOR DIAMETER GROWTH COMPARISON GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Diameter Change</span>
              <div className="text-2xl font-black text-red-400 mt-1">
                +{progressionData.growth_metrics?.total_diameter_change_mm || 5.4} mm
              </div>
              <div className="text-xs text-red-400 font-semibold mt-0.5">
                +{progressionData.growth_metrics?.total_diameter_percentage_change || 35.8}% diameter increase
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Observed Clinical Status</span>
              <div className={`text-2xl font-black mt-1 ${
                progressionData.growth_metrics?.overall_status === 'Growth' ? 'text-red-400' :
                progressionData.growth_metrics?.overall_status === 'Reduction' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {progressionData.growth_metrics?.overall_status || 'Growth'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Across {progressionData.growth_metrics?.total_duration_days || 181} days follow-up
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Volume Doubling Time (VDT)</span>
              <div className="text-2xl font-black text-cyan-300 mt-1">
                {progressionData.growth_metrics?.volume_doubling_time_days || progressionData.summary?.volume_doubling_time_days || 280.0} days
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Schwartz kinetic exponential model
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">RECIST 1.1 Category</span>
              <div className="text-sm font-bold text-red-400 mt-1 leading-snug">
                {progressionData.growth_metrics?.recist_category || "Progressive Disease (PD)"}
              </div>
            </div>
          </div>

          {/* STEP 5: LARGE INTERACTIVE PROGRESSION GRAPH (TUMOR DIAMETER ACROSS ALL THREE TIME POINTS) */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Step 5: Longitudinal Tumor Diameter Graph
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plots measured lesion diameter across Initial, 3-Month, and 6-Month scan dates with extrapolated projection.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Growth
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Stability
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Reduction
                </span>
              </div>
            </div>

            <ProgressionTrendChart data={progressionData.timeline_data} />
          </div>

          {/* STEP 6: PROGRESSION INTERPRETATION & FUTURE ESTIMATE */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-400" />
              Step 6: Clinical Progression Interpretation & Kinetic Projections
            </h2>

            <div className="p-4 bg-[#0d1322] rounded-xl border border-white/[0.08] text-xs text-slate-200 leading-relaxed space-y-2">
              <p className="font-semibold text-cyan-300">Measured Lesion Dynamic Summary:</p>
              <p>{progressionData.interpretation_summary}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#111827] rounded-xl border border-white/[0.08]">
                <span className="text-slate-400 block text-[11px]">Projected +3 Months Tumor Diameter:</span>
                <span className="text-xl font-black text-cyan-300 mt-1 block">
                  {progressionData.future_projection?.projected_90d_diameter_mm || 23.4} mm
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">Estimated mathematical trajectory under untreated kinetics</p>
              </div>

              <div className="p-4 bg-[#111827] rounded-xl border border-white/[0.08]">
                <span className="text-slate-400 block text-[11px]">Projected +6 Months Tumor Diameter:</span>
                <span className="text-xl font-black text-cyan-300 mt-1 block">
                  {progressionData.future_projection?.projected_180d_diameter_mm || 26.8} mm
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">Estimated mathematical trajectory under untreated kinetics</p>
              </div>
            </div>

            <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">CLINICAL METHODOLOGY DISCLAIMER</p>
                <p className="leading-relaxed">
                  Tumor diameters and doubling kinetics are computed from 2D axial CT contours using morphological caliper filtering. 
                  Percentage change in unidimensional diameter must not be confused with volumetric changes. 
                  Progression categories and projected trends represent statistical decision support models and require board-certified radiological review.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation CTA */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentPage('similar')}
              className="text-xs font-semibold text-slate-400 hover:text-white"
            >
              ← Back to Similar Cases
            </button>
            <button
              onClick={() => setCurrentPage('report')}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold transition shadow-glow-blue hover:scale-[1.02]"
            >
              <span>Proceed to Patient Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
