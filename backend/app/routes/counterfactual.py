import os
from fastapi import APIRouter, HTTPException
from backend.app.schemas.schemas import CounterfactualRequest, CounterfactualResponse
from backend.app.database.db import (
    get_session, get_gradcam, save_counterfactual, get_latest_counterfactual
)
from backend.ml.counterfactual.what_if import apply_counterfactual_intervention

router = APIRouter(prefix="/api", tags=["Counterfactual What-If"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

@router.post("/counterfactual", response_model=CounterfactualResponse)
async def run_counterfactual_analysis(payload: CounterfactualRequest):
    session_id = payload.session_id
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    image_path = sess["original_image_path"]
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Original scan image missing.")

    gradcam_rec = get_gradcam(session_id)
    if not gradcam_rec:
        from backend.ml.gradcam.gradcam import generate_gradcam_visualizations
        from backend.app.database.db import save_gradcam
        gc_data = generate_gradcam_visualizations(image_path, UPLOAD_DIR, session_id)
        save_gradcam(
            session_id=session_id,
            orig_url=gc_data["original_url"],
            hm_url=gc_data["heatmap_url"],
            ov_url=gc_data["overlay_url"],
            sbox=gc_data["salient_box"],
            scircle=gc_data["salient_circle"]
        )
        gradcam_rec = get_gradcam(session_id)

    salient_region = {}
    if gradcam_rec:
        salient_region["salient_box"] = gradcam_rec.get("salient_box")
        salient_region["salient_circle"] = gradcam_rec.get("salient_circle")

    # Apply Counterfactual Intervention & CNN re-inference
    cf_res = apply_counterfactual_intervention(
        image_path=image_path,
        salient_region=salient_region,
        mode=payload.mode,
        strength=payload.strength,
        output_dir=UPLOAD_DIR,
        session_id=session_id
    )

    # Save to database
    save_counterfactual(
        session_id=session_id,
        mode=payload.mode,
        strength=payload.strength,
        cf_data=cf_res
    )

    return CounterfactualResponse(
        session_id=session_id,
        mode=payload.mode,
        strength=payload.strength,
        original_probability=cf_res["original_probability"],
        counterfactual_probability=cf_res["counterfactual_probability"],
        original_normal_probability=cf_res["original_normal_probability"],
        counterfactual_normal_probability=cf_res["counterfactual_normal_probability"],
        probability_difference=cf_res["probability_difference"],
        difference_percentage_points=cf_res["difference_percentage_points"],
        percentage_change=cf_res["percentage_change"],
        original_predicted_stage=cf_res["original_predicted_stage"],
        counterfactual_predicted_stage=cf_res["counterfactual_predicted_stage"],
        original_predicted_class=cf_res.get("original_predicted_class", "Malignant"),
        counterfactual_predicted_class=cf_res.get("counterfactual_predicted_class", "Malignant"),
        trend=cf_res["trend"],
        description=cf_res["description"],
        scientific_interpretation=cf_res["scientific_interpretation"],
        modified_image_url=cf_res["modified_image_url"],
        mask_image_url=cf_res.get("mask_image_url"),
        comparison_chart_data=cf_res["comparison_chart_data"],
        medical_disclaimer=cf_res["medical_disclaimer"]
    )

@router.get("/counterfactual/{session_id}")
async def fetch_latest_counterfactual(session_id: str):
    cf = get_latest_counterfactual(session_id)
    if not cf:
        raise HTTPException(status_code=404, detail="No counterfactual analysis performed for this session yet.")
    return cf
