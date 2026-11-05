import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.database.db import init_db
from backend.app.routes import upload, detection, counterfactual, similarity, progression, report

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
DATASETS_DIR = os.path.join(os.path.dirname(BASE_DIR), "datasets")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(DATASETS_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite DB tables & ensure folders
    init_db()
    print("[System] Thoracic Lung Cancer Analysis Backend online.")
    yield
    print("[System] Shutting down backend.")

app = FastAPI(
    title="Lung Cancer Detection and Staging API",
    description="Dual-Head CNN Detection, Explainable AI (Grad-CAM), Counterfactual What-If Verification, Similar Case Retrieval, Progression Simulator, and PDF Reporting",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for image and PDF access
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")
app.mount("/datasets", StaticFiles(directory=DATASETS_DIR), name="datasets")

# Include API Routers
app.include_router(upload.router)
app.include_router(detection.router)
app.include_router(counterfactual.router)
app.include_router(similarity.router)
app.include_router(progression.router)
app.include_router(report.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Lung Cancer Detection & Staging API",
        "ml_backend": "PyTorch / Torchvision / OpenCV",
        "storage": "SQLite + Local File System"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main.py:app", host="127.0.0.1", port=8000, reload=True)

