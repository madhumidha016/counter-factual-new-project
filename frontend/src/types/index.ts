export type PageName = 
  | 'home' 
  | 'detection' 
  | 'gradcam' 
  | 'whatif' 
  | 'similar' 
  | 'progression' 
  | 'report';

export interface UploadData {
  session_id: string;
  patient_id: string;
  filename: string;
  file_size_bytes: number;
  file_type: string;
  image_url: string;
  status: string;
  message: string;
}

export interface StageProbabilities {
  "Stage I": number;
  "Stage II": number;
  "Stage III": number;
  "Stage IV": number;
}

export interface SimilarCase {
  case_id: string;
  similarity_score: number;
  diagnosis: string;
  stage: string;
  sub_stage?: string;
  nodule_size_mm?: number;
  anatomical_location?: string;
  morphology?: string;
  treatment?: string;
  treatment_outcome?: string;
  molecular_biomarkers?: string;
  histology?: string;
  image_url: string;
}

export interface DetectionData {
  session_id: string;
  cancer_probability: number;
  predicted_class: string;
  predicted_stage: string;
  stage_probabilities: StageProbabilities;
  inference_time_ms: number;
  model_status: string;
  original_url: string;
  heatmap_url: string;
  overlay_url: string;
  explanation: string;
  similar_cases_preview: SimilarCase[];
}

export interface ChartPoint {
  metric: string;
  Original: number;
  Counterfactual: number;
}

export interface CounterfactualData {
  session_id: string;
  mode: string;
  strength: string;
  original_probability: number;
  counterfactual_probability: number;
  original_normal_probability?: number;
  counterfactual_normal_probability?: number;
  probability_difference: number;
  difference_percentage_points?: number;
  percentage_change: number;
  original_predicted_stage: string;
  counterfactual_predicted_stage: string;
  original_predicted_class?: string;
  counterfactual_predicted_class?: string;
  trend: string;
  description: string;
  scientific_interpretation: string;
  modified_image_url: string;
  mask_image_url?: string;
  comparison_chart_data: ChartPoint[];
  medical_disclaimer: string;
}

export interface LesionMeasurement {
  area_mm2: number;
  volume_mm3: number;
  diameter_mm: number;
  pixel_count: number;
}

export interface ProgressionTimelinePoint {
  session: string;
  date: string;
  area_mm2: number;
  volume_mm3: number;
  diameter_mm: number;
  type: string;
  status?: string;
}

export interface ProgressionData {
  session_id: string;
  sessions: {
    initial?: {
      label: string;
      date: string;
      image_url: string;
      diameter_mm: number;
      measurements: LesionMeasurement;
    };
    followup_3m?: {
      label: string;
      date: string;
      image_url: string;
      diameter_mm: number;
      measurements: LesionMeasurement;
      delta_diameter_mm: number;
      pct_change_diameter: number;
      interval_days: number;
    };
    followup_6m?: {
      label: string;
      date: string;
      image_url: string;
      diameter_mm: number;
      measurements: LesionMeasurement;
      delta_diameter_mm: number;
      pct_change_diameter: number;
      interval_days: number;
    };
    baseline?: any;
    interim?: any;
    current?: any;
  };
  growth_metrics?: {
    initial_diameter_mm: number;
    month3_diameter_mm: number;
    month6_diameter_mm: number;
    total_diameter_change_mm: number;
    total_diameter_percentage_change: number;
    total_area_change_mm2: number;
    total_duration_days: number;
    volume_doubling_time_days: number;
    overall_status: string;
    status_color: string;
    recist_category: string;
    kinetic_assessment: string;
  };
  summary?: {
    total_area_change_mm2: number;
    total_growth_percentage: number;
    total_duration_days: number;
    volume_doubling_time_days: number;
    clinical_kinetics: string;
  };
  future_projection: {
    projected_90d_diameter_mm?: number;
    projected_180d_diameter_mm?: number;
    projected_90d_area_mm2?: number;
    projected_180d_area_mm2?: number;
    growth_trend?: string;
    methodology_explanation: string;
    clinical_disclaimer?: string;
  };
  interpretation_summary?: string;
  timeline_data: ProgressionTimelinePoint[];
}

export interface ReportData {
  report_id: string;
  session_id: string;
  patient_id: string;
  created_at: string;
  patient_data: {
    patient_id: string;
    name: string;
    age: number;
    gender: string;
  };
  cnn_data: DetectionData;
  gradcam_data: {
    original_url: string;
    heatmap_url: string;
    overlay_url: string;
  };
  counterfactual_data: CounterfactualData;
  similar_cases: SimilarCase[];
  progression_data: ProgressionData;
  pdf_filename: string;
  download_url: string;
}
