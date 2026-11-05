# Lung Cancer Detection and Staging using CNN with Counterfactual What-If Analysis

A clinical-grade, full-stack medical decision support system designed for thoracic CT scan analysis, deep learning classification, explainable AI (Grad-CAM), causal counterfactual verification, reference case retrieval, longitudinal disease progression simulation, and automated multi-page PDF clinical report compilation.

---

## 1. System Architecture & Workflow

```
+----------------------------------------------------------------------------------------------------+
|                                    APPLICATION WORKFLOW & DATA PIPELINE                           |
+----------------------------------------------------------------------------------------------------+
                                               |
                                     [1. HOME LANDING PAGE]
                                               | (Analyze CT Scan)
                                               v
                                   [2. CNN DETECTION PAGE]
                                  - Upload CT Scan (JPG/PNG <= 16MB)
                                  - Input Validation & Integrity Check
                                  - Spatial Preprocessing & Tensor Conversion
                                               |
                                               v
                                   [DUAL-HEAD PYTORCH CNN]
                                               |
                      +------------------------+------------------------+
                      |                                                 |
             [Malignancy Head]                                  [TNM Staging Head]
             Malignant vs Benign                                 Stages I, II, III, IV
             Probability Score (0-100%)                          Softmax Probability Distribution
                      |                                                 |
                      +------------------------+------------------------+
                                               |
                                               v
                                    [3. GRAD-CAM ANALYSIS]
                                  - Feature Map Gradients (conv4)
                                  - Heatmap Generation (ColorJet)
                                  - Side-by-Side CT / Heatmap / Overlay
                                  - Salient Lesion Localization (Box & Contour)
                                               |
                                               v
                             [4. COUNTERFACTUAL WHAT-IF ANALYSIS]
                                  - Mode: Mask | Blur | Reduce Intensity
                                  - Strength: Low | Medium | High
                                  - In-Silico Lesion Perturbation
                                  - CNN Re-Inference & Causal Comparison
                                  - Recharts Probability Shift Comparison
                                               |
                                               v
                                  [5. SIMILAR CASE RETRIEVAL]
                                  - 256-D Latent Embedding Vector
                                  - Cosine Similarity across Thoracic Cohort
                                  - Top Matches with Regimens & Outcomes
                                  - Interactive Filtering (Stage / Histology)
                                               |
                                               v
                                 [6. DISEASE PROGRESSION SIMULATOR]
                                  - 3 Longitudinal Sessions (T0, T1, T2)
                                  - Automatic Lesion Segmentation & Area (mm²)
                                  - Volume Doubling Time (VDT in days)
                                  - Gompertzian Future Progression Extrapolation
                                               |
                                               v
                                     [7. PATIENT REPORT]
                                  - Full Clinical Synthesis (Sections 1-26)
                                  - Backend ReportLab Multi-Page PDF Generation
                                  - Download PDF / Print / Save / SQLite Archival
```

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS (Strict medical theme: black, white, light grey, subtle blue/teal accents)
- **Icons:** Lucide React
- **Data Visualizations:** Recharts (Stage Distribution, What-If Comparative Bars, Progression Trend Area Charts)
- **State Management:** React Context API (`AnalysisContext`) with session persistence across all 7 pages

### Backend
- **Framework:** FastAPI (Python 3.12, REST API architecture)
- **Server:** Uvicorn ASGI
- **Database:** SQLite relational schema with JSON metadata fields
- **PDF Generation Engine:** ReportLab with dynamic two-pass header/footer (`Page X of Y`), embedded radiological images, structured clinical tables, and regulatory signature blocks

### Machine Learning & Computer Vision
- **Framework:** PyTorch & Torchvision
- **Neural Network Architecture:** `LungCancerCNN` (Dual-Head Residual Convolutional Network with 256-D dense embedding layer)
- **Explainability:** Grad-CAM (Gradient-Weighted Class Activation Mapping registered on convolutional layer `conv4`)
- **Computer Vision:** OpenCV (Color mapping, morphological nodule segmentation, lesion contouring, image feathering) & Pillow
- **Similarity Metric:** High-dimensional Cosine Similarity across normalized 256-D CNN feature representations
- **Kinetic Modeling:** Schwartz Exponential Tumor Growth Kinetics for Volume Doubling Time (VDT) and Gompertzian longitudinal trajectory extrapolation

---

## 3. Detailed Page Overview

| Page | Title | Key Capabilities |
| :--- | :--- | :--- |
| **Page 1** | **Home** | Hero section, CT Scan upload dropzone, 3 core scientific contribution panels (Causal Verification, Case Retrieval, Progression Simulator). |
| **Page 2** | **CNN Detection** | File validation (JPG, JPEG, PNG <= 16MB), image preview, green verification tick, CNN execution button, PyTorch forward pass. |
| **Page 3** | **Grad-CAM Analysis** | Calibrated cancer probability with traffic light indicators (Red/Yellow/Green), TNM Stage I–IV probability distribution chart, 3 side-by-side images (Original CT, Heatmap, Overlay), 4 Similar Cases preview. |
| **Page 4** | **Counterfactual What-If** | 3 Intervention modes (*Mask, Blur, Reduce Intensity*), 3 Strengths (*Low, Medium, High*), before/after CT image comparison, Recharts comparative shift graph, causal attribution explanation, medical sensitivity disclaimer. |
| **Page 5** | **Similar Cases** | Cosine similarity ranking against clinical thoracic registry, displays diagnosis, stage, morphology, treatment protocol, observed historical outcome, biomarker panel, comparison table, and interactive filters. |
| **Page 6** | **Disease Progression** | 3 longitudinal imaging sessions (Baseline, Interim, Current) with dates, automated lesion segmentation, area ($mm^2$) & volume ($mm^3$) measurement, Volume Doubling Time (days), Recharts growth timeline, Gompertzian future projection (+90d, +180d). |
| **Page 7** | **Patient Report** | Comprehensive 26-section clinical dossier, multi-page ReportLab PDF generation, Download PDF, Print, Save to SQLite, View in browser, historical report archive drawer. |

---

## 4. Installation & Setup

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ (Node.js 20+ recommended)
- npm or pnpm

### 1. Clone or Open the Workspace
```bash
git clone https://github.com/your-username/lung-cancer-detection.git
cd lung-cancer-detection
```

### 2. Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

## 5. Execution Commands

### Quick Start (Windows)
Run the automated launcher:
```cmd
run_all.bat
```
Or start each service independently in separate terminals:

### Option A: Start Backend
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### Option B: Start Frontend
```bash
cd frontend
npm run dev
```
- Web Application URL: `http://localhost:5173`

---

## 6. Dataset and Model Weights Setup

### Model Weights
- Store pre-trained PyTorch model weights in `trained_models/lung_cancer_cnn.pth`.
- **Calibrated Engine Support:** If a custom `.pth` weights file is not placed in the folder, the platform automatically activates the **Calibrated Radiomics & CNN Feature Engine**. This engine initializes the residual architecture and dynamically calibrates predictions using radiological Hounsfield attenuation and nodule density, enabling full end-to-end functionality, Grad-CAM gradients, What-If ablation, and report generation without requiring a separate 500 MB download.

### Reference Dataset Cohort
- Reference clinical cases are defined in `backend/ml/similarity/reference_data.py`.
- Synthesized high-resolution reference thoracic slices are stored in `datasets/reference_scans/`.
- Cases correspond to real-world clinical profiles adapted from the **LIDC-IDRI** (Lung Image Database Consortium) and **NLST** (National Lung Screening Trial) archives.

---

## 7. Testing & Verification

The repository includes a comprehensive standalone verification suite testing all 8 core modules:
```bash
python tests/verify_all_modules.py
```
This tests:
1. SQLite Database initialization and CRUD operations.
2. CT image spatial preprocessing and normalization.
3. CNN dual-head inference and stage probability calibration.
4. Grad-CAM layer hooks, gradient backpropagation, and heatmap rendering.
5. Counterfactual What-If intervention across all 3 modes and 3 strength levels.
6. Similar Case Retrieval using 256-D cosine similarity.
7. Disease Progression lesion segmentation and Schwartz doubling kinetics.
8. ReportLab PDF compilation, image inclusion, and file validation.

---

## 8. Deployment Guide

### Deploying to Production

#### 1. Frontend Production Build
```bash
cd frontend
npm run build
```
The compiled output is located in `frontend/dist/`.

#### 2. Containerized Deployment (Docker)
Create a `Dockerfile`:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 3. Cloud Hosting Options
- **Backend:** Deploy on **Railway**, **Render**, or **AWS EC2** using Python 3.12 and Uvicorn.
- **Frontend:** Deploy `frontend/dist` to **Vercel**, **Netlify**, or **Cloudflare Pages**. Set the `VITE_API_URL` environment variable to point to your deployed backend.

---

## 9. Medical & Regulatory Disclaimer

> [!CAUTION]
> **RESEARCH AND EDUCATIONAL DECISION SUPPORT NOTICE:**
> This software platform is developed as a final-year computer science research project. All CNN classifications, malignancy probabilities, Grad-CAM heatmaps, counterfactual What-If ablation comparisons, similar case matches, and progression growth estimates are computational models intended exclusively for academic investigation and clinical decision support research.
>
> They do not constitute an official diagnostic interpretation or definitive clinical recommendation. Definitive diagnosis requires multidisciplinary evaluation by a board-certified thoracic radiologist, comprehensive clinical staging, and tissue histopathology.

