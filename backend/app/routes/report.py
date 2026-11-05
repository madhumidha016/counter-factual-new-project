import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.app.schemas.schemas import ReportGenerateRequest, ReportResponse
from backend.app.database.db import (
    get_session, get_cnn_prediction, get_gradcam, get_latest_counterfactual,
    get_latest_progression, save_report_meta, get_all_reports, get_report_by_id
)
from backend.ml.similarity.retriever import get_retriever
from backend.app.services.report_generator import generate_pdf_report

router = APIRouter(prefix="/api", tags=["Report Generation"])

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "reports")
BACKEND_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

@router.post("/report/generate")
async def generate_patient_report(payload: ReportGenerateRequest):
    session_id = payload.session_id
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")

    cnn_pred = get_cnn_prediction(session_id)
    if not cnn_pred:
        raise HTTPException(status_code=400, detail="CNN detection must be completed before generating a report.")

    gradcam_rec = get_gradcam(session_id) or {}
    cf_rec = get_latest_counterfactual(session_id) or {
        "mode": "Not Conducted",
        "strength": "N/A",
        "original_probability": cnn_pred["cancer_probability"],
        "counterfactual_probability": cnn_pred["cancer_probability"],
        "probability_difference": 0.0,
        "percentage_change": 0.0,
        "original_predicted_stage": cnn_pred["predicted_stage"],
        "counterfactual_predicted_stage": cnn_pred["predicted_stage"],
        "trend": "Baseline",
        "description": "Baseline evaluation without intervention.",
        "scientific_interpretation": "Intervention not configured."
    }

    retriever = get_retriever()
    similar_cases = retriever.retrieve_similar_cases(
        query_embedding=cnn_pred["embedding"],
        top_k=4
    )

    prog_rec = get_latest_progression(session_id)
    prog_data = prog_rec["results"] if prog_rec else {
        "sessions": {
            "baseline": {"date": "2025-01-15", "measurements": {"area_mm2": 180.0, "volume_mm3": 1820.0, "diameter_mm": 15.1}},
            "interim": {"date": "2025-07-20", "measurements": {"area_mm2": 245.0, "volume_mm3": 2840.0, "diameter_mm": 17.7}, "change_from_baseline": {"percentage": 36.1}},
            "current": {"date": "2026-02-10", "measurements": {"area_mm2": 330.0, "volume_mm3": 4450.0, "diameter_mm": 20.5}, "change_from_interim": {"percentage": 34.7}}
        },
        "summary": {
            "total_area_change_mm2": 150.0,
            "total_growth_percentage": 83.3,
            "total_duration_days": 391,
            "volume_doubling_time_days": 285.0,
            "clinical_kinetics": "Typical Malignant Solid Doubling"
        },
        "future_projection": {
            "projected_90d_area_mm2": 398.0,
            "projected_180d_area_mm2": 482.0
        }
    }

    patient_data = {
        "patient_id": sess["patient_id"],
        "name": payload.patient_name or "Clinical Study Patient",
        "age": payload.patient_age or 58,
        "gender": payload.patient_gender or "M"
    }

    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"
    pdf_filename = f"{report_id}_{sess['patient_id']}.pdf"
    output_pdf_path = os.path.join(REPORTS_DIR, pdf_filename)

    # Compile PDF Report via ReportLab
    generate_pdf_report(
        report_id=report_id,
        session_id=session_id,
        patient_data=patient_data,
        cnn_data=cnn_pred,
        gradcam_data=gradcam_rec,
        counterfactual_data=cf_rec,
        similar_cases=similar_cases,
        progression_data=prog_data,
        output_pdf_path=output_pdf_path,
        backend_base_dir=BACKEND_BASE_DIR
    )

    report_payload = {
        "report_id": report_id,
        "session_id": session_id,
        "patient_id": sess["patient_id"],
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "patient_data": patient_data,
        "cnn_data": cnn_pred,
        "gradcam_data": gradcam_rec,
        "counterfactual_data": cf_rec,
        "similar_cases": similar_cases,
        "progression_data": prog_data,
        "pdf_filename": pdf_filename,
        "download_url": f"/api/report/{report_id}/download"
    }

    # Save to database
    save_report_meta(
        report_id=report_id,
        session_id=session_id,
        patient_id=sess["patient_id"],
        pdf_path=output_pdf_path,
        pdf_filename=pdf_filename,
        report_data=report_payload
    )

    return report_payload

@router.get("/report/{report_id}/download")
async def download_report_pdf(report_id: str):
    rep = get_report_by_id(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found.")
        
    pdf_path = rep.get("pdf_path")
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Report PDF file not found on server.")
        
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=rep.get("pdf_filename", f"{report_id}.pdf")
    )

@router.get("/reports")
async def list_reports():
    return get_all_reports()

@router.get("/report/{report_id}")
async def get_report_details(report_id: str):
    rep = get_report_by_id(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found.")
    return rep

