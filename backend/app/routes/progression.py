import os
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.database.db import get_session, save_progression, get_latest_progression
from backend.ml.progression.growth_analyzer import analyze_disease_progression
from backend.app.utils.image_loader import is_supported_image, process_and_standardize_image, SUPPORTED_EXTENSIONS

router = APIRouter(prefix="/api", tags=["Disease Progression"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
MAX_FILE_SIZE = 16 * 1024 * 1024 # 16 MB

@router.post("/progression/analyze")
async def analyze_progression_sessions(
    session_id: str = Form(...),
    initial_date: str = Form("2025-01-15"),
    month3_date: str = Form("2025-04-15"),
    month6_date: str = Form("2025-07-15"),
    initial_file: Optional[UploadFile] = File(None),
    followup_3m_file: Optional[UploadFile] = File(None),
    followup_6m_file: Optional[UploadFile] = File(None),
    # Backwards compatibility fields
    baseline_date: Optional[str] = Form(None),
    interim_date: Optional[str] = Form(None),
    current_date: Optional[str] = Form(None),
    baseline_file: Optional[UploadFile] = File(None),
    interim_file: Optional[UploadFile] = File(None),
    current_file: Optional[UploadFile] = File(None)
):
    sess = get_session(session_id)
    if not sess:
        # Allow running with a demo session identifier if not pre-registered
        session_id = f"SES-PROG-{session_id}"
        
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Resolve aliases
    f_init = initial_file or baseline_file
    f_3m = followup_3m_file or interim_file
    f_6m = followup_6m_file or current_file
    
    d_init = initial_date or baseline_date or "2025-01-15"
    d_3m = month3_date or interim_date or "2025-04-15"
    d_6m = month6_date or current_date or "2025-07-15"

    async def save_and_standardize(file_obj: Optional[UploadFile], tag: str):
        if not file_obj or not file_obj.filename:
            # Check if session has original image we can use as fallback for initial
            if tag == "initial" and sess and sess.get("original_image_path") and os.path.exists(sess["original_image_path"]):
                return sess["original_image_path"]
            raise HTTPException(
                status_code=400,
                detail=f"Missing upload for {tag.replace('_', ' ').title()}. All three scans must be uploaded."
            )
            
        if not is_supported_image(file_obj.filename):
            valid_ext_str = ", ".join(sorted([e.upper().lstrip(".") for e in SUPPORTED_EXTENSIONS]))
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format for {tag}. Supported formats: {valid_ext_str}."
            )
            
        content = await file_obj.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"{tag} scan exceeds 16 MB limit.")
        if len(content) < 100:
            raise HTTPException(status_code=400, detail=f"{tag} scan is empty or corrupted.")
            
        raw_ext = os.path.splitext(file_obj.filename)[1].lower()
        raw_path = os.path.join(UPLOAD_DIR, f"{session_id}_{tag}_raw{raw_ext}")
        with open(raw_path, "wb") as f:
            f.write(content)
            
        std_png_path = os.path.join(UPLOAD_DIR, f"{session_id}_{tag}_input.png")
        process_and_standardize_image(raw_path, std_png_path)
        return std_png_path

    path_init = await save_and_standardize(f_init, "initial")
    path_3m = await save_and_standardize(f_3m, "followup_3m")
    path_6m = await save_and_standardize(f_6m, "followup_6m")

    # Run progression analysis
    results = analyze_disease_progression(
        baseline_path=path_init,
        baseline_date_str=d_init,
        interim_path=path_3m,
        interim_date_str=d_3m,
        current_path=path_6m,
        current_date_str=d_6m,
        output_dir=UPLOAD_DIR,
        session_id=session_id
    )

    save_progression(
        session_id=session_id,
        baseline_date=d_init,
        interim_date=d_3m,
        current_date=d_6m,
        results_dict=results
    )

    return {
        "session_id": session_id,
        **results
    }

@router.get("/progression/{session_id}")
async def get_session_progression(session_id: str):
    rec = get_latest_progression(session_id)
    if not rec:
        raise HTTPException(status_code=404, detail="No progression record found for this session.")
    return {
        "session_id": session_id,
        **rec["results"]
    }
