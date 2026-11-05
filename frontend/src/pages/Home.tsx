import React, { useState, useRef } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { uploadCTScan } from '../services/api';
import { 
  UploadCloud, 
  ArrowRight, 
  Sliders, 
  Copy, 
  TrendingUp, 
  FileCheck2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

export const Home: React.FC = () => {
  const { setCurrentPage, setUploadData } = useAnalysis();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);

    const validExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.dcm', '.dicom'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext) && file.type && !file.type.startsWith('image/')) {
      setErrorMessage("Unsupported file format. Please upload JPG, PNG, BMP, TIFF, or DICOM files.");
      return;
    }

    // Size validation: 16 MB
    if (file.size > 16 * 1024 * 1024) {
      setErrorMessage(`File exceeds 16 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadCTScan(file);
      setUploadData(res);
      setCurrentPage('detection');
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process scan upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-cyan-300">
          <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
          Clinical Thoracic Imaging Decision Support
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Lung Cancer Detection and Staging using CNN with Counterfactual What-If Analysis
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          An end-to-end medical software platform for automated thoracic CT classification, Grad-CAM interpretability, 
          causal counterfactual intervention, reference case retrieval, and longitudinal disease progression modeling.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setCurrentPage('detection')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-sm transition shadow-glow-blue hover:scale-[1.02]"
          >
            <span>Analyze CT Scan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upload CT Scan Section */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Upload CT Scan</h2>
          <p className="text-xs text-slate-400">Provide an axial thoracic computed tomography scan for deep learning analysis.</p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-500/10 shadow-glow-cyan'
              : 'border-slate-700 hover:border-slate-500 bg-[#111827]/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dcm,application/dicom"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <span className="text-sm font-medium text-slate-200">Verifying and processing CT scan...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-cyan-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-cyan-400 hover:underline">
                    Browse File from Device
                  </span>
                  <span className="text-sm text-slate-400"> or drag and drop your image here</span>
                </div>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <p>Supported Formats: JPEG, JPG, PNG, BMP, TIFF, and DICOM</p>
                  <p>Maximum File Size: 16 MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Core Scientific Contributions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white text-center sm:text-left">
          Core Scientific Contributions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card-interactive rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-cyan-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                1. Counterfactual Causal Verification
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                <li>Evaluate how model predictions change after controlled image interventions.</li>
                <li>Compare original and modified CT scan predictions with sensitivity attribution.</li>
                <li>Verify causal reliance on nodular pathology vs background artifacts.</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-white/[0.08] mt-4">
              <span className="text-xs font-medium text-cyan-400/80">Explainable AI & Causal Inference</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card-interactive rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Copy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                2. Similar Case Retrieval System
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                <li>Retrieve similar CT scan cases from the available thoracic registry.</li>
                <li>Cosine similarity indexing over 256-D deep CNN representations.</li>
                <li>Display verified diagnoses, staging, and available clinical treatment outcomes.</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-white/[0.08] mt-4">
              <span className="text-xs font-medium text-purple-400/80">Case-Based Clinical Reasoning</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card-interactive rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                3. Disease Progression Simulator
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                <li>Compare CT scans taken at different time intervals across 3 longitudinal sessions.</li>
                <li>Analyze lesion growth, volume doubling time, and boundary expansion.</li>
                <li>Project future Gompertzian progression trends with confidence bounds.</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-white/[0.08] mt-4">
              <span className="text-xs font-medium text-emerald-400/80">Longitudinal Volumetric Modeling</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
