import {
  UploadData,
  DetectionData,
  CounterfactualData,
  ProgressionData,
  ReportData,
  SimilarCase
} from '../types';

const API_BASE = '/api';

export async function uploadCTScan(file: File, patientId?: string): Promise<UploadData> {
  const formData = new FormData();
  formData.append('file', file);
  if (patientId) {
    formData.append('patient_id', patientId);
  }

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to upload CT scan.' }));
    throw new Error(err.detail || 'Upload failed.');
  }

  return response.json();
}

export async function runCNNDetection(sessionId: string): Promise<DetectionData> {
  const response = await fetch(`${API_BASE}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'CNN Detection failed.' }));
    throw new Error(err.detail || 'CNN Detection failed.');
  }

  return response.json();
}

export async function fetchGradCAM(sessionId: string): Promise<DetectionData> {
  const response = await fetch(`${API_BASE}/gradcam/${sessionId}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to fetch Grad-CAM.' }));
    throw new Error(err.detail || 'Failed to fetch Grad-CAM.');
  }
  return response.json();
}

export async function runCounterfactual(
  sessionId: string,
  mode: string,
  strength: string
): Promise<CounterfactualData> {
  const response = await fetch(`${API_BASE}/counterfactual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, mode, strength }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Counterfactual Analysis failed.' }));
    throw new Error(err.detail || 'Counterfactual Analysis failed.');
  }

  return response.json();
}

export async function fetchSimilarCases(
  sessionId: string,
  stageFilter: string = 'all',
  diagnosisFilter: string = 'all',
  minSimilarity: number = 0
): Promise<{ cases: SimilarCase[]; total_retrieved: number }> {
  const params = new URLSearchParams({
    session_id: sessionId,
    stage_filter: stageFilter,
    diagnosis_filter: diagnosisFilter,
    min_similarity: minSimilarity.toString(),
  });

  const response = await fetch(`${API_BASE}/similar-cases?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to retrieve similar cases.' }));
    throw new Error(err.detail || 'Failed to retrieve similar cases.');
  }

  return response.json();
}

export async function analyzeProgression(
  sessionId: string,
  initialDate: string,
  month3Date: string,
  month6Date: string,
  initialFile: File,
  month3File: File,
  month6File: File
): Promise<ProgressionData> {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('initial_date', initialDate);
  formData.append('month3_date', month3Date);
  formData.append('month6_date', month6Date);
  // Also append baseline aliases for backend compatibility
  formData.append('baseline_date', initialDate);
  formData.append('interim_date', month3Date);
  formData.append('current_date', month6Date);

  formData.append('initial_file', initialFile);
  formData.append('followup_3m_file', month3File);
  formData.append('followup_6m_file', month6File);
  formData.append('baseline_file', initialFile);
  formData.append('interim_file', month3File);
  formData.append('current_file', month6File);

  const response = await fetch(`${API_BASE}/progression/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Progression analysis failed.' }));
    throw new Error(err.detail || 'Progression analysis failed.');
  }

  return response.json();
}

export async function generateReport(
  sessionId: string,
  patientName: string = 'Clinical Study Patient',
  age: number = 58,
  gender: string = 'M'
): Promise<ReportData> {
  const response = await fetch(`${API_BASE}/report/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      patient_name: patientName,
      patient_age: age,
      patient_gender: gender,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'PDF Report generation failed.' }));
    throw new Error(err.detail || 'PDF Report generation failed.');
  }

  return response.json();
}

export async function listReports(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/reports`);
  if (!response.ok) return [];
  return response.json();
}

