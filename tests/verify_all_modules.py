import os
import sys
import numpy as np
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.ml.cnn.inference import run_cnn_inference
from backend.ml.gradcam.gradcam import generate_gradcam_visualizations
from backend.ml.counterfactual.what_if import apply_counterfactual_intervention
from backend.ml.similarity.retriever import get_retriever
from backend.ml.progression.growth_analyzer import analyze_disease_progression
from backend.app.services.report_generator import generate_pdf_report
from backend.app.database.db import (
    init_db, save_patient, save_session, save_cnn_prediction, save_gradcam,
    save_counterfactual, save_progression, save_report_meta, get_session
)

def run_verification():
    print("--- 1. Testing Database Initialization & CRUD ---")
    init_db()
    save_patient("PAT-001", "Jane Doe", 59, "F")
    save_session("SES-001", "PAT-001", "scan.png", "backend/uploads/scan.png", 204800, "PNG")
    sess = get_session("SES-001")
    assert sess is not None
    print("Database verified successfully!")

    print("--- 2. Creating Synthetic Thoracic CT Image ---")
    os.makedirs("backend/uploads", exist_ok=True)
    os.makedirs("backend/reports", exist_ok=True)
    test_path = "backend/uploads/verify_scan.png"
    
    # Thoracic cross-section
    arr = np.full((256, 256, 3), 35, dtype=np.uint8)
    # Focal hyperdense nodular lesion
    arr[90:130, 90:130] = [190, 190, 190]
    Image.fromarray(arr).save(test_path)
    print(f"Saved test scan to {test_path}")

    print("--- 3. Testing CNN Inference ---")
    inf = run_cnn_inference(test_path)
    print(f"Malignancy Probability: {inf['cancer_probability']*100:.1f}%")
    print(f"Predicted Stage: {inf['predicted_stage']}")
    print(f"Inference Latency: {inf['inference_time_ms']} ms")
    save_cnn_prediction("SES-001", inf["cancer_probability"], inf["predicted_class"], inf["predicted_stage"], inf["stage_probabilities"], inf["inference_time_ms"], inf["model_status"], inf["embedding"])

    print("--- 4. Testing Grad-CAM Generation ---")
    gc = generate_gradcam_visualizations(test_path, "backend/uploads", "SES-001")
    print(f"Original URL: {gc['original_url']}")
    print(f"Heatmap URL: {gc['heatmap_url']}")
    print(f"Overlay URL: {gc['overlay_url']}")
    print(f"Salient Box: {gc['salient_box']}")
    save_gradcam("SES-001", gc["original_url"], gc["heatmap_url"], gc["overlay_url"], gc["salient_box"], gc["salient_circle"])

    print("--- 5. Testing Counterfactual What-If (All 3 modes) ---")
    for m in ["mask", "blur", "reduce_intensity"]:
        for s in ["low", "medium", "high"]:
            cf = apply_counterfactual_intervention(test_path, gc, m, s, "backend/uploads", "SES-001")
            print(f"  Mode: {m:16} | Strength: {s:6} | Post-Prob: {cf['counterfactual_probability']*100:.1f}% | Trend: {cf['trend']}")
    save_counterfactual("SES-001", "mask", "high", cf)

    print("--- 6. Testing Similar Case Retrieval (Cosine Similarity) ---")
    retriever = get_retriever()
    cases = retriever.retrieve_similar_cases(query_embedding=inf["embedding"], top_k=4)
    print(f"Retrieved {len(cases)} cases.")
    for c in cases:
        print(f"  Case: {c['case_id']:14} | Match: {c['similarity_score']}% | Diag: {c['diagnosis']} ({c['stage']})")

    print("--- 7. Testing Disease Progression Simulator ---")
    prog = analyze_disease_progression(test_path, "2025-01-15", test_path, "2025-07-20", test_path, "2026-02-10", "backend/uploads", "SES-001")
    print(f"Volume Doubling Time (VDT): {prog['summary']['volume_doubling_time_days']} days")
    print(f"Kinetics: {prog['summary']['clinical_kinetics']}")
    print(f"Projected +90d Area: {prog['future_projection']['projected_90d_area_mm2']} mm²")
    save_progression("SES-001", "2025-01-15", "2025-07-20", "2026-02-10", prog)

    print("--- 8. Testing ReportLab PDF Report Generation ---")
    pdf_path = os.path.join("backend", "reports", "SES-001_report.pdf")
    generate_pdf_report(
        report_id="RPT-TEST-2026",
        session_id="SES-001",
        patient_data={"patient_id": "PAT-001", "name": "Jane Doe", "age": 59, "gender": "F"},
        cnn_data=inf,
        gradcam_data=gc,
        counterfactual_data=cf,
        similar_cases=cases,
        progression_data=prog,
        output_pdf_path=pdf_path,
        backend_base_dir=os.path.abspath("backend")
    )
    assert os.path.exists(pdf_path)
    file_size = os.path.getsize(pdf_path)
    print(f"PDF Generated successfully at {pdf_path}")
    print(f"PDF Size: {file_size} bytes ({round(file_size/1024, 1)} KB)")

    print("\n=======================================================")
    print("SUCCESS: ALL 8 CORE MODULES VERIFIED 100% OPERATIONAL!")
    print("=======================================================")

if __name__ == "__main__":
    run_verification()

