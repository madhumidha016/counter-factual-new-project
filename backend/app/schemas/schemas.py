from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class PatientCreate(BaseModel):
    patient_id: Optional[str] = "PAT-2026-001"
    name: Optional[str] = "Clinical Study Patient"
    age: Optional[int] = 58
    gender: Optional[str] = "M"

class UploadResponse(BaseModel):
    session_id: str
    patient_id: str
    filename: str
    file_size_bytes: int
    file_type: str
    image_url: str
    status: str
    message: str

class DetectionRequest(BaseModel):
    session_id: str

class DetectionResponse(BaseModel):
    session_id: str
    cancer_probability: float
    predicted_class: str
    predicted_stage: str
    stage_probabilities: Dict[str, float]
    inference_time_ms: float
    model_status: str
    original_url: str
    heatmap_url: str
    overlay_url: str
    explanation: str
    similar_cases_preview: List[Dict[str, Any]]

class CounterfactualRequest(BaseModel):
    session_id: str
    mode: str = Field(..., description="mask | blur | reduce_intensity")
    strength: str = Field(..., description="low | medium | high")

class CounterfactualResponse(BaseModel):
    session_id: str
    mode: str
    strength: str
    original_probability: float
    counterfactual_probability: float
    original_normal_probability: float
    counterfactual_normal_probability: float
    probability_difference: float
    difference_percentage_points: float
    percentage_change: float
    original_predicted_stage: str
    counterfactual_predicted_stage: str
    original_predicted_class: Optional[str] = "Malignant"
    counterfactual_predicted_class: Optional[str] = "Malignant"
    trend: str
    description: str
    scientific_interpretation: str
    modified_image_url: str
    mask_image_url: Optional[str] = None
    comparison_chart_data: List[Dict[str, Any]]
    medical_disclaimer: str

class SimilarCaseFilterRequest(BaseModel):
    session_id: str
    stage_filter: Optional[str] = "all"
    diagnosis_filter: Optional[str] = "all"
    min_similarity: Optional[float] = 0.0

class ProgressionResponse(BaseModel):
    session_id: str
    sessions: Dict[str, Any]
    growth_metrics: Dict[str, Any]
    future_projection: Dict[str, Any]
    interpretation_summary: str
    timeline_data: List[Dict[str, Any]]

class ReportGenerateRequest(BaseModel):
    session_id: str
    patient_name: Optional[str] = "Clinical Study Patient"
    patient_age: Optional[int] = 58
    patient_gender: Optional[str] = "M"

class ReportResponse(BaseModel):
    report_id: str
    session_id: str
    patient_id: str
    pdf_filename: str
    download_url: str
    created_at: str
    summary_data: Dict[str, Any]
