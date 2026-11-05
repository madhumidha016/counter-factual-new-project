import React, { useState, useRef } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { uploadCTScan, runCNNDetection } from '../services/api';
import { 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Play, 
  Loader2, 
  FileText,
  ShieldCheck,
  Cpu,
  Sparkles
} from 'lucide-react';

export const CnnDetection: React.FC = () => {
  const { 
    uploadData, 
    setUploadData, 
    detectionData, 
    setDetectionData, 
    setCurrentPage 
  } = useAnalysis();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.dcm', '.dicom'];

  const validateAndUpload = async (file: File) => {
    setValidationError(null);

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!SUPPORTED_EXTS.includes(ext) && file.type && !file.type.startsWith('image/')) {
      setValidationError(`Unsupported file format '${ext}'. Supported formats: JPG, JPEG, PNG, BMP, TIFF, and DICOM (.dcm).`);
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      setValidationError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum permitted limit of 16 MB.`);
      return;
    }

    if (file.size < 100) {
      setValidationError("File appears to be empty or corrupted (under 100 bytes).");
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadCTScan(file);
      setUploadData(res);
      setDetectionData(null); // Reset downstream results for new scan
    } catch (err: any) {
      setValidationError(err.message || "Failed to upload and verify medical CT scan.");
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
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setUploadData(null);
    setDetectionData(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunDetection = async () => {
    if (!uploadData?.session_id) {
      setValidationError("Please upload and verify a CT scan before running detection.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setValidationError(null);
      const res = await runCNNDetection(uploadData.session_id);
      setDetectionData(res);
      // Navigate to Grad-CAM page as specified in workflow
      setCurrentPage('gradcam');
    } catch (err: any) {
      setValidationError(err.message || "CNN Detection failed during model execution.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadDemoScan = async () => {
    try {
      setIsUploading(true);
      const resp = await fetch('/datasets/reference_scans/LIDC-IDRI-0078.png');
      const blob = await resp.blob();
      const file = new File([blob], "Thoracic_CT_LIDC_0078.png", { type: "image/png" });
      await validateAndUpload(file);
    } catch (err) {
      setValidationError("Failed to load reference demo scan.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Thoracic CT Scan Analysis
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl">
          Automated pulmonary lesion classification and stage inference using a dual-head deep Convolutional Neural Network. 
          Upload an axial thoracic CT slice (supporting DICOM, TIFF, BMP, PNG, JPG) to initiate feature preprocessing and deep inference.
        </p>
      </div>

      {/* Upload and Verification Panel */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">CT Scan Input Verification</h2>
          </div>
          {!uploadData && (
            <button
              onClick={handleLoadDemoScan}
              disabled={isUploading}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Use Reference Clinical Scan (Demo)
            </button>
          )}
        </div>

        {/* Upload Container */}
        {!uploadData ? (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10 shadow-glow-cyan'
                  : 'border-slate-700 hover:border-slate-500 bg-[#111827]/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dcm,application/dicom"
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" />
                    <span className="text-sm text-slate-200 font-medium">Decoding and verifying radiological scan...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-cyan-400 hover:underline">
                        Browse Files from Device
                      </span>
                      <span className="text-sm text-slate-400"> or drag and drop CT scan slice</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Supported Medical Formats: DICOM (.dcm), TIFF, BMP, PNG, JPG (Max 16 MB)
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Uploaded Image Preview & Verification Status */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#0d1322] p-6 rounded-xl border border-white/[0.08]">
            {/* Image Preview */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative group rounded-xl overflow-hidden border border-cyan-500/30 bg-black max-w-xs shadow-glow-cyan">
                <img
                  src={uploadData.image_url}
                  alt="Uploaded Thoracic CT"
                  className="w-full h-56 object-contain"
                />
                <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-black/80 backdrop-blur-md text-cyan-300 text-[10px] rounded-full border border-cyan-500/30 font-mono font-bold">
                  {uploadData.file_type}
                </div>
              </div>
            </div>

            {/* Verification Metadata & Actions */}
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-glow-green">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Scan Verified & Preprocessed</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <p><span className="text-slate-400">File Name:</span> <span className="font-semibold text-white ml-1">{uploadData.filename}</span></p>
                <p><span className="text-slate-400">Format:</span> <span className="font-semibold text-cyan-300 ml-1">{uploadData.file_type} Medical CT</span></p>
                <p><span className="text-slate-400">File Size:</span> <span className="font-semibold text-white ml-1">{(uploadData.file_size_bytes / 1024).toFixed(1)} KB</span></p>
                <p><span className="text-slate-400">Session ID:</span> <span className="font-mono text-cyan-400 ml-1">{uploadData.session_id}</span></p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-medium text-slate-200 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Replace Image</span>
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-xs font-medium text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Image</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dcm,application/dicom"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-3 text-xs text-red-200 shadow-glow-red">
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300">File Validation Error</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        {/* CNN Detection Trigger Button */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Dual-Head Convolutional Neural Network (PyTorch / Torchvision)</span>
          </div>

          <button
            onClick={handleRunDetection}
            disabled={!uploadData || isAnalyzing}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition shadow-glass ${
              !uploadData || isAnalyzing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-glow-blue hover:scale-[1.02]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Executing CNN Forward Pass & Grad-CAM...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run CNN Detection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Process Guide */}
      <div className="glass-card rounded-2xl p-6 text-xs text-slate-300 space-y-2">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          CNN Processing Workflow & Medical Verification
        </h3>
        <p>
          1. <b>Multi-Format Ingestion:</b> Supports native DICOM (.dcm) with automated Hounsfield Unit (HU) lung window calibration (-600 / 1500 HU), TIFF, BMP, PNG, and JPEG.
        </p>
        <p>
          2. <b>Spatial Windowing & Tensor Conversion:</b> Standardized axial slices are converted to normalized PyTorch tensors.
        </p>
        <p>
          3. <b>Dual Classification Heads:</b> Primary head computes calibrated malignancy probability; secondary head estimates TNM Stage I–IV distribution.
        </p>
        <p>
          4. <b>Gradient-Weighted Class Activation:</b> Gradients are computed at convolutional layer <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-white/10 font-mono">conv4</code> to generate spatial saliency heatmaps.
        </p>
      </div>
    </div>
  );
};
