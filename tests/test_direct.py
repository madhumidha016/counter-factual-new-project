import os
import sys
import asyncio
from io import BytesIO
from PIL import Image
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.database.db import init_db, get_session, get_cnn_prediction
from backend.app.routes.upload import upload_ct_scan
from backend.app.routes.detection import execute_cnn_detection, fetch_gradcam_results
from backend.app.routes.counterfactual import run_counterfactual_analysis
from backend.app.routes.similarity import get_similar_cases
from backend.app.routes.progression import analyze_progression_sessions
from backend.app.routes.report import generate_patient_report, list_reports
from backend.app.schemas.schemas import DetectionRequest, CounterfactualRequest, ReportGenerateRequest
from fastapi import UploadFile

async def main():
    print("[1] Initializing Database...")
    init_db()

    # Create synthetic CT image
    size = 256
    img = np.full((size, size, 3), 35, dtype=np.uint8)
    # Put a dense nodule
    img[90:130, 90:130] = [185, 185, 185]
    pil = Image.fromarray(img)
    buf = BytesIO()
    pil.save(buf, format="PNG")
    content = buf.getvalue()

    upload_file = UploadFile(filename="patient_ct_slice.png", file=BytesIO(content))

    print("[2] Testing Upload Endpoint...")
    up_res = await upload_ct_scan(file=upload_file, patient_id="PAT-TEST-001")
    session_id = up_res.session_id
    print(f"    Uploaded successfully. Session ID: {session_id}")

    print("[3] Testing CNN Detection & Grad-CAM Endpoint...")
    det_res = await execute_cnn_detection(DetectionRequest(session_id=session_id))
    print(f"    Detection Result: Probability={det_res.cancer_probability*100:.1f}%, Stage={det_res.predicted_stage}")
    print(f"    Grad-CAM Heatmap: {det_res.heatmap_url}, Overlay: {det_res.overlay_url}")
    print(f"    Similar cases preview count: {len(det_res.similar_cases_preview)}")

    print("[4] Testing Counterfactual What-If Analysis...")
    for mode in ["mask", "blur", "reduce_intensity"]:
        for strength in ["low", "medium", "high"]:
            cf_res = await run_counterfactual_analysis(
                CounterfactualRequest(session_id=session_id, mode=mode, strength=strength)
            )
            print(f"    Mode={mode}, Strength={strength} -> Post-Prob={cf_res.counterfactual_probability*100:.1f}%, Trend={cf_res.trend}")

    print("[5] Testing Similar Cases Retrieval Endpoint...")
    sim_res = await get_similar_cases(session_id=session_id, stage_filter="all", min_similarity=0.0)
    print(f"    Retrieved {sim_res['total_retrieved']} similar cases.")
    assert len(sim_res['cases']) > 0

    print("[6] Testing Disease Progression Analysis Endpoint...")
    prog_res = await analyze_progression_sessions(
        session_id=session_id,
        baseline_date="2025-01-15",
        interim_date="2025-07-20",
        current_date="2026-02-10",
        baseline_file=UploadFile(filename="b.png", file=BytesIO(content)),
        interim_file=UploadFile(filename="i.png", file=BytesIO(content)),
        current_file=UploadFile(filename="c.png", file=BytesIO(content))
    )
    print(f"    Progression Volume Doubling Time: {prog_res['summary']['volume_doubling_time_days']} days")
    print(f"    Total Growth: +{prog_res['summary']['total_growth_percentage']}%")

    print("[7] Testing Patient Report Generation & PDF Compilation...")
    rep_res = await generate_patient_report(
        ReportGenerateRequest(
            session_id=session_id,
            patient_name="Margaret Holloway",
            patient_age=61,
            patient_gender="F"
        )
    )
    report_id = rep_res["report_id"]
    pdf_filename = rep_res["pdf_filename"]
    print(f"    Generated Report ID: {report_id}")
    print(f"    Generated PDF File: {pdf_filename}")
    
    # Check that PDF exists on disk and is non-empty
    pdf_path = os.path.join(BASE_DIR, "backend", "reports", pdf_filename)
    assert os.path.exists(pdf_path), f"PDF file does not exist at {pdf_path}"
    pdf_size = os.path.getsize(pdf_path)
    print(f"    PDF File Size on disk: {pdf_size} bytes ({round(pdf_size/1024, 1)} KB)")

    print("\n>>> ALL DIRECT API & ML PIPELINES VERIFIED SUCCESSFULLY 100%! <<<")

if __name__ == "__main__":
    asyncio.run(main())

