import os
from fastapi import APIRouter, HTTPException
from backend.app.schemas.schemas import DetectionRequest, DetectionResponse
from backend.app.database.db import (
    get_session, save_cnn_prediction, get_cnn_prediction, save_gradcam, get_gradcam
)
from backend.ml.cnn.inference import run_cnn_inference
from backend.ml.gradcam.gradcam import generate_gradcam_visualizations
from backend.ml.similarity.retriever import get_retriever

router = APIRouter(prefix="/api", tags=["CNN Detection & Grad-CAM"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

@router.post("/detect", response_model=DetectionResponse)
async def execute_cnn_detection(payload: DetectionRequest):
    session_id = payload.session_id
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a CT scan first.")

    image_path = sess["original_image_path"]
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Original scan file missing from disk.")

    # 1. Run CNN Inference
    cnn_results = run_cnn_inference(image_path)

    # 2. Save prediction
    save_cnn_prediction(
        session_id=session_id,
        cancer_prob=cnn_results["cancer_probability"],
        pred_class=cnn_results["predicted_class"],
        pred_stage=cnn_results["predicted_stage"],
        stage_probs=cnn_results["stage_probabilities"],
        time_ms=cnn_results["inference_time_ms"],
        status=cnn_results["model_status"],
        embedding=cnn_results["embedding"]
    )

    # 3. Generate Grad-CAM Heatmap & Overlay
    gradcam_res = generate_gradcam_visualizations(
        image_path=image_path,
        output_dir=UPLOAD_DIR,
        session_id=session_id
    )

    # 4. Save Grad-CAM to Database
    save_gradcam(
        session_id=session_id,
        orig_url=gradcam_res["original_url"],
        hm_url=gradcam_res["heatmap_url"],
        ov_url=gradcam_res["overlay_url"],
        sbox=gradcam_res["salient_box"],
        scircle=gradcam_res["salient_circle"]
    )

    # 5. Retrieve 4 Similar Reference Cases for preview
    retriever = get_retriever()
    similar_cases_preview = retriever.retrieve_similar_cases(
        query_embedding=cnn_results["embedding"],
        top_k=4
    )

    return DetectionResponse(
        session_id=session_id,
        cancer_probability=cnn_results["cancer_probability"],
        predicted_class=cnn_results["predicted_class"],
        predicted_stage=cnn_results["predicted_stage"],
        stage_probabilities=cnn_results["stage_probabilities"],
        inference_time_ms=cnn_results["inference_time_ms"],
        model_status=cnn_results["model_status"],
        original_url=gradcam_res["original_url"],
        heatmap_url=gradcam_res["heatmap_url"],
        overlay_url=gradcam_res["overlay_url"],
        explanation=gradcam_res["explanation"],
        similar_cases_preview=similar_cases_preview
    )

@router.get("/gradcam/{session_id}")
async def fetch_gradcam_results(session_id: str):
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    cnn_pred = get_cnn_prediction(session_id)
    gradcam_rec = get_gradcam(session_id)
    
    if not cnn_pred or not gradcam_rec:
        raise HTTPException(status_code=404, detail="Analysis results not yet generated for this session.")
        
    retriever = get_retriever()
    similar_cases_preview = retriever.retrieve_similar_cases(
        query_embedding=cnn_pred["embedding"],
        top_k=4
    )
    
    return {
        "session_id": session_id,
        "cancer_probability": cnn_pred["cancer_probability"],
        "predicted_class": cnn_pred["predicted_class"],
        "predicted_stage": cnn_pred["predicted_stage"],
        "stage_probabilities": cnn_pred["stage_probabilities"],
        "inference_time_ms": cnn_pred["inference_time_ms"],
        "original_url": gradcam_rec["original_url"],
        "heatmap_url": gradcam_rec["heatmap_url"],
        "overlay_url": gradcam_rec["overlay_url"],
        "salient_box": gradcam_rec["salient_box"],
        "similar_cases_preview": similar_cases_preview
    }

