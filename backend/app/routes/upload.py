import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.schemas.schemas import UploadResponse
from backend.app.database.db import save_patient, save_session, get_session
from backend.app.utils.image_loader import is_supported_image, process_and_standardize_image, SUPPORTED_EXTENSIONS

router = APIRouter(prefix="/api", tags=["Upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
MAX_FILE_SIZE = 16 * 1024 * 1024 # 16 MB

@router.post("/upload", response_model=UploadResponse)
async def upload_ct_scan(
    file: UploadFile = File(...),
    patient_id: str = Form(None)
):
    # 1. Validate file format
    if not is_supported_image(file.filename):
        valid_ext_str = ", ".join(sorted([e.upper().lstrip(".") for e in SUPPORTED_EXTENSIONS]))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported medical image format. Supported formats: {valid_ext_str} (Max 16 MB)."
        )

    # 2. Read and validate file size (16 MB maximum)
    contents = await file.read()
    file_size = len(contents)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum permitted limit of 16 MB (Received: {round(file_size / (1024*1024), 2)} MB)."
        )
    if file_size < 100:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file appears to be empty or corrupted (under 100 bytes)."
        )

    # 3. Create unique identifiers
    session_id = f"SES-{uuid.uuid4().hex[:10]}"
    if not patient_id:
        patient_id = f"PAT-{uuid.uuid4().hex[:6].upper()}"

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    raw_ext = os.path.splitext(file.filename)[1].lower()
    raw_saved_path = os.path.join(UPLOAD_DIR, f"{session_id}_raw{raw_ext}")
    
    with open(raw_saved_path, "wb") as f:
        f.write(contents)

    # 4. Standardize image to high-fidelity web PNG (supports DICOM, TIFF, BMP, PNG, JPG)
    standard_png_filename = f"{session_id}_original.png"
    standard_png_path = os.path.join(UPLOAD_DIR, standard_png_filename)
    
    try:
        proc_info = process_and_standardize_image(raw_saved_path, standard_png_path)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to decode medical image: {str(e)}. Please ensure the file is an axial CT slice."
        )

    # 5. Persist to Database
    save_patient(patient_id)
    save_session(
        session_id=session_id,
        patient_id=patient_id,
        filename=file.filename,
        filepath=standard_png_path,
        filesize=file_size,
        filetype=proc_info["format"]
    )

    return UploadResponse(
        session_id=session_id,
        patient_id=patient_id,
        filename=file.filename,
        file_size_bytes=file_size,
        file_type=proc_info["format"],
        image_url=f"/uploads/{standard_png_filename}",
        status="verified",
        message="Medical CT scan slice successfully verified, preprocessed, and registered."
    )

@router.get("/session/{session_id}")
async def get_session_details(session_id: str):
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Analysis session not found.")
    filename = os.path.basename(sess["original_image_path"])
    sess["image_url"] = f"/uploads/{filename}"
    return sess
