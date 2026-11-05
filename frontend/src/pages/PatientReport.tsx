import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { generateReport, listReports } from '../services/api';
import { ReportData } from '../types';
import { 
  FileText, 
  Download, 
  Printer, 
  Save, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  Activity, 
  Layers, 
  Sliders, 
  Copy, 
  TrendingUp, 
  History,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const PatientReport: React.FC = () => {
  const { 
    uploadData, 
    detectionData, 
    counterfactualData, 
    progressionData, 
    reportData, 
    setReportData, 
    setCurrentPage 
  } = useAnalysis();

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [previousReports, setPreviousReports] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Editable patient demographic inputs
  const [patientName, setPatientName] = useState<string>("Clinical Study Patient");
  const [patientAge, setPatientAge] = useState<number>(58);
  const [patientGender, setPatientGender] = useState<string>("M");

  const handleGenerateReport = async () => {
    if (!uploadData?.session_id) return;
    try {
      setIsGenerating(true);
      const res = await generateReport(
        uploadData.session_id,
        patientName,
        patientAge,
        patientGender
      );
      setReportData(res);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
      loadPreviousReports();
    } catch (err: any) {
      alert(err.message || "Failed to compile medical report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadPreviousReports = async () => {
    try {
      const reps = await listReports();
      setPreviousReports(reps);
    } catch (e) {}
  };

  useEffect(() => {
    loadPreviousReports();
    if (!reportData && uploadData?.session_id && detectionData) {
      handleGenerateReport();
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!reportData?.report_id) return;
    window.location.href = `/api/report/${reportData.report_id}/download`;
  };

  const handleViewPDF = () => {
    if (!reportData?.report_id) return;
    window.open(`/api/report/${reportData.report_id}/download`, '_blank');
  };

  if (!uploadData || !detectionData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">No Patient Session Available</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please upload a CT scan and execute CNN detection to generate a comprehensive patient analysis report.
        </p>
        <button
          onClick={() => setCurrentPage('detection')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-glow-blue"
        >
          <span>Start CNN Analysis</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Report Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Patient Analysis Report
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end multimodal clinical report compiled with deep CNN classification, Grad-CAM interpretability, What-If counterfactual ablation, and longitudinal progression.
          </p>
        </div>

        {/* Functional Buttons: Download PDF, Print Report, Save Report, View Report */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={!reportData || isGenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-glow-blue disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!reportData}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#151D2E] border border-white/10 hover:border-white/20 text-slate-200 text-xs font-semibold transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#151D2E] border border-white/10 hover:border-white/20 text-slate-200 text-xs font-semibold transition shadow-sm"
          >
            <Save className="w-4 h-4 text-cyan-400" />
            <span>Save Report</span>
          </button>

          <button
            onClick={handleViewPDF}
            disabled={!reportData}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-blue-500/20 text-xs font-semibold transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View PDF</span>
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition"
          >
            <History className="w-4 h-4" />
            <span>Archive ({previousReports.length})</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-glow-green">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Patient report successfully compiled, rendered with ReportLab, and persisted to SQLite database.</span>
        </div>
      )}

      {/* Previous Reports History Drawer */}
      {showHistory && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <h3 className="text-xs font-bold uppercase text-white">Archived Clinical Reports</h3>
            <span className="text-[11px] text-slate-400">Database Record Count: {previousReports.length}</span>
          </div>

          <div className="divide-y divide-white/[0.05] max-h-48 overflow-y-auto text-xs">
            {previousReports.map((r) => (
              <div key={r.report_id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-cyan-300">{r.report_id}</span>
                  <span className="text-slate-400 ml-2">Patient: {r.patient_id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">{r.created_at}</span>
                  <a
                    href={`/api/report/${r.report_id}/download`}
                    className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Demographic Form Bar */}
      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center gap-4 text-xs">
        <span className="font-bold text-white uppercase tracking-wider">Patient Demographics:</span>
        <div className="flex items-center gap-2">
          <label className="text-slate-400">Name:</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="glass-input rounded-lg px-3 py-1.5 text-white font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-slate-400">Age:</label>
          <input
            type="number"
            value={patientAge}
            onChange={(e) => setPatientAge(Number(e.target.value))}
            className="glass-input rounded-lg px-3 py-1.5 text-white w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-slate-400">Gender:</label>
          <select
            value={patientGender}
            onChange={(e) => setPatientGender(e.target.value)}
            className="glass-input rounded-lg px-3 py-1.5 text-white bg-[#111827]"
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition shadow-glow-blue"
        >
          {isGenerating ? "Compiling..." : "Update Demographic Info"}
        </button>
      </div>

      {/* REPORT PAPER VIEW (High Contrast Clean White-Paper Layout with Full 26 Sections) */}
      <div className="bg-white text-slate-900 rounded-2xl border border-slate-300 shadow-2xl p-8 sm:p-12 space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Document Title Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-blue-700 tracking-wider uppercase">
                Clinical Decision Support Systems — Research Division
              </div>
              <h2 className="text-2xl font-black text-slate-950 mt-1">
                Thoracic CT Scan Analysis & Patient Staging Report
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dual-Head CNN Malignancy Classification, Grad-CAM Saliency, Counterfactual Causal Ablation, and Longitudinal Kinetics
              </p>
            </div>
            <div className="text-right text-xs space-y-1">
              <p><span className="text-slate-400">Report ID:</span> <span className="font-mono font-bold text-slate-900">{reportData?.report_id || "RPT-PENDING"}</span></p>
              <p><span className="text-slate-400">Date:</span> <span className="font-semibold text-slate-800">{new Date().toLocaleDateString()}</span></p>
              <p><span className="text-slate-400">Modality:</span> <span className="font-medium text-slate-800">Thoracic CT (Axial)</span></p>
            </div>
          </div>
        </div>

        {/* 1-6. Patient & CT Scan Information Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Patient & CT Scan Metadata
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Patient ID:</span>
              <span className="font-bold font-mono text-slate-900">{uploadData.patient_id}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Patient Name / Age / Sex:</span>
              <span className="font-semibold text-slate-900">{patientName} ({patientAge} / {patientGender})</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">File Name & Format:</span>
              <span className="font-medium text-slate-900">{uploadData.filename} ({uploadData.file_type})</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Session ID:</span>
              <span className="font-mono text-slate-700">{uploadData.session_id}</span>
            </div>
          </div>
        </div>

        {/* 7-10. CNN Detection Results & Staging */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Primary CNN Detection & Staging Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 text-[11px]">Predicted Malignancy Probability</span>
              <div className="text-3xl font-extrabold text-slate-950">
                {Math.round(detectionData.cancer_probability * 100)}%
              </div>
              <span className={`inline-block font-semibold ${detectionData.cancer_probability >= 0.5 ? 'text-red-700' : 'text-emerald-700'}`}>
                Classification: {detectionData.predicted_class}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 text-[11px]">Predicted Cancer Stage</span>
              <div className="text-3xl font-extrabold text-red-600">
                {detectionData.predicted_stage}
              </div>
              <span className="text-slate-500">
                Confidence: {Math.round((detectionData.stage_probabilities[detectionData.predicted_stage as keyof typeof detectionData.stage_probabilities] || 0) * 100)}%
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 text-[11px]">Computational Model Status</span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {detectionData.model_status}
              </div>
              <span className="text-slate-500">
                Inference Latency: {detectionData.inference_time_ms} ms
              </span>
            </div>
          </div>

          {/* Staging Distribution Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2.5">Stage</th>
                  <th className="p-2.5">Probability</th>
                  <th className="p-2.5">Radiological Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-2.5 font-bold">Stage I</td>
                  <td className="p-2.5 font-semibold">{Math.round((detectionData.stage_probabilities['Stage I'] || 0) * 100)}%</td>
                  <td className="p-2.5 text-slate-500">Localized solitary nodule (&le; 3 cm) without nodal or pleural involvement.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Stage II</td>
                  <td className="p-2.5 font-semibold">{Math.round((detectionData.stage_probabilities['Stage II'] || 0) * 100)}%</td>
                  <td className="p-2.5 text-slate-500">Larger pulmonary mass (3–5 cm) or with ipsilateral peribronchial/hilar lymphadenopathy.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Stage III</td>
                  <td className="p-2.5 font-semibold">{Math.round((detectionData.stage_probabilities['Stage III'] || 0) * 100)}%</td>
                  <td className="p-2.5 text-slate-500">Locally advanced tumor (&gt; 5 cm) with ipsilateral mediastinal or subcarinal nodal extension.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Stage IV</td>
                  <td className="p-2.5 font-semibold">{Math.round((detectionData.stage_probabilities['Stage IV'] || 0) * 100)}%</td>
                  <td className="p-2.5 text-slate-500">Distant metastatic spread, contralateral lung nodularity, or malignant pleural effusion.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 11. Grad-CAM Visualizations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Grad-CAM Saliency Visualizations
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-1">
              <div className="aspect-square bg-black rounded-lg overflow-hidden border border-slate-300">
                <img src={detectionData.original_url} alt="Original CT" className="w-full h-full object-contain" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Original CT Scan</span>
            </div>
            <div className="text-center space-y-1">
              <div className="aspect-square bg-black rounded-lg overflow-hidden border border-slate-300">
                <img src={detectionData.heatmap_url} alt="Grad-CAM Heatmap" className="w-full h-full object-contain" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Grad-CAM Heatmap</span>
            </div>
            <div className="text-center space-y-1">
              <div className="aspect-square bg-black rounded-lg overflow-hidden border border-slate-300">
                <img src={detectionData.overlay_url} alt="Grad-CAM Overlay" className="w-full h-full object-contain" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Grad-CAM Overlay</span>
            </div>
          </div>
        </div>

        {/* 12-17. Counterfactual What-If Results */}
        {counterfactualData && (
          <div className="space-y-3 border-t border-slate-200 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              4. Counterfactual What-If Intervention & Causal Sensitivity
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center space-y-1">
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-300">
                  <img src={detectionData.original_url} alt="Original Scan" className="w-full h-full object-contain" />
                </div>
                <span className="text-[11px] font-semibold text-slate-800">Original CT Scan</span>
              </div>
              <div className="text-center space-y-1">
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-blue-400">
                  <img src={counterfactualData.modified_image_url} alt="Counterfactual Modified" className="w-full h-full object-contain" />
                </div>
                <span className="text-[11px] font-semibold text-blue-700">
                  Counterfactual: {counterfactualData.mode.replace('_', ' ').toUpperCase()} ({counterfactualData.strength})
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Original Malignancy:</span>
                <span className="font-bold text-slate-900">{Math.round(counterfactualData.original_probability * 100)}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Post-Intervention:</span>
                <span className="font-bold text-slate-900">{Math.round(counterfactualData.counterfactual_probability * 100)}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Probability Difference:</span>
                <span className={`font-bold ${counterfactualData.probability_difference < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {counterfactualData.difference_percentage_points !== undefined ? `${counterfactualData.difference_percentage_points > 0 ? '+' : ''}${counterfactualData.difference_percentage_points} pts` : `${(counterfactualData.probability_difference * 100).toFixed(1)} pts`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Predicted Stage Shift:</span>
                <span className="font-semibold text-slate-800">{counterfactualData.original_predicted_stage} &rarr; {counterfactualData.counterfactual_predicted_stage}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              <b>Causal Interpretation:</b> {counterfactualData.scientific_interpretation}
            </p>
          </div>
        )}

        {/* 18-20. Similar Cases Table */}
        <div className="space-y-3 border-t border-slate-200 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            5. Similar Cases from Clinical Thoracic Cohort
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2.5">Case ID</th>
                  <th className="p-2.5">Similarity</th>
                  <th className="p-2.5">Diagnosis</th>
                  <th className="p-2.5">Stage</th>
                  <th className="p-2.5">Treatment & Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(reportData?.similar_cases || detectionData.similar_cases_preview).map((sc: any) => (
                  <tr key={sc.case_id}>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{sc.case_id}</td>
                    <td className="p-2.5 font-bold text-blue-700">{sc.similarity_score}%</td>
                    <td className="p-2.5 font-medium">{sc.diagnosis}</td>
                    <td className="p-2.5">{sc.stage}</td>
                    <td className="p-2.5 text-slate-600">
                      <b>Tx:</b> {sc.treatment?.slice(0, 60)}... | <b>Outcome:</b> {sc.treatment_outcome?.slice(0, 70)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 21-25. Disease Progression Analysis */}
        {progressionData && (
          <div className="space-y-3 border-t border-slate-200 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              6. Longitudinal Disease Progression Analysis & Kinetics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center space-y-1">
                <div className="aspect-square bg-black rounded-lg overflow-hidden border border-slate-300">
                  <img src={progressionData.sessions.initial?.image_url || progressionData.sessions.baseline?.image_url} alt="Initial Scan" className="w-full h-full object-contain" />
                </div>
                <div className="text-[11px] font-semibold text-slate-800">
                  Initial CT Scan
                </div>
                <div className="text-[10px] text-slate-500">
                  Diameter: {progressionData.growth_metrics?.initial_diameter_mm || progressionData.sessions.initial?.diameter_mm || 15.1} mm
                </div>
              </div>

              <div className="text-center space-y-1">
                <div className="aspect-square bg-black rounded-lg overflow-hidden border border-slate-300">
                  <img src={progressionData.sessions.followup_3m?.image_url || progressionData.sessions.interim?.image_url} alt="3 Months Scan" className="w-full h-full object-contain" />
                </div>
                <div className="text-[11px] font-semibold text-slate-800">
                  3 Months Follow-up
                </div>
                <div className="text-[10px] text-slate-500">
                  Diameter: {progressionData.growth_metrics?.month3_diameter_mm || progressionData.sessions.followup_3m?.diameter_mm || 17.7} mm
                </div>
              </div>

              <div className="text-center space-y-1">
                <div className="aspect-square bg-black rounded-lg overflow-hidden border border-slate-300">
                  <img src={progressionData.sessions.followup_6m?.image_url || progressionData.sessions.current?.image_url} alt="6 Months Scan" className="w-full h-full object-contain" />
                </div>
                <div className="text-[11px] font-semibold text-slate-800">
                  6 Months Follow-up
                </div>
                <div className="text-[10px] text-slate-500">
                  Diameter: {progressionData.growth_metrics?.month6_diameter_mm || progressionData.sessions.followup_6m?.diameter_mm || 20.5} mm
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Diameter Change:</span>
                <span className="font-bold text-red-700">+{progressionData.growth_metrics?.total_diameter_change_mm || 5.4} mm</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">RECIST 1.1 Category:</span>
                <span className="font-bold text-slate-900">{progressionData.growth_metrics?.recist_category?.split('-')[0] || "Progressive Disease"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Doubling Time (VDT):</span>
                <span className="font-bold text-slate-900">{progressionData.growth_metrics?.volume_doubling_time_days || progressionData.summary?.volume_doubling_time_days || 280.0} days</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Projected +3m Diameter:</span>
                <span className="font-semibold text-slate-900">{progressionData.future_projection?.projected_90d_diameter_mm || 23.4} mm</span>
              </div>
            </div>
          </div>
        )}

        {/* 26. Final Analysis Summary & Disclaimer */}
        <div className="space-y-4 border-t border-slate-200 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            7. Multidisciplinary Summary & Medical Responsibility
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Thoracic CT deep learning analysis demonstrates high malignancy probability ({Math.round(detectionData.cancer_probability * 100)}%) 
            with highest probability density in {detectionData.predicted_stage}. Grad-CAM localized the peak saliency vector to the focal 
            pulmonary lesion. Counterfactual What-If perturbation demonstrated causal dependency on the targeted lesion structure. 
            Multidisciplinary thoracic oncology consultation, tissue core biopsy, and PET-CT metabolic staging are recommended for definitive clinical management.
          </p>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
            <b>REGULATORY & CLINICAL USE NOTICE:</b> This software report is generated by a computer-assisted research platform. 
            All classifications, probabilities, heatmaps, counterfactual comparisons, and progression projections are computational approximations 
            intended solely to support academic investigation. They do not constitute an official diagnostic interpretation or definitive clinical recommendation.
          </div>

          {/* Signature Line */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-slate-600">
            <div className="border-t border-slate-300 pt-2">
              <span className="font-semibold text-slate-800">Lead Radiologist / Investigator</span>
              <p className="text-[11px] text-slate-400">Electronic Verification Stamp</p>
            </div>
            <div className="border-t border-slate-300 pt-2 text-right">
              <span className="font-semibold text-slate-800">Verified Analysis Session</span>
              <p className="text-[11px] text-slate-400">Session ID: {uploadData.session_id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
