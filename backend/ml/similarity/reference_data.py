import os
import cv2
import numpy as np
from PIL import Image

REFERENCE_CASES = [
    {
        "case_id": "LIDC-IDRI-0078",
        "diagnosis": "Adenocarcinoma",
        "stage": "Stage I",
        "sub_stage": "Stage I-A2 (T1b N0 M0)",
        "nodule_size_mm": 18.5,
        "anatomical_location": "Right Upper Lobe (Apical segment)",
        "morphology": "Part-solid ground-glass nodule with subtle pleural indentation",
        "treatment": "Video-Assisted Thoracoscopic Surgery (VATS) Segmentectomy + Mediastinal LN Sampling",
        "treatment_outcome": "Complete R0 Resection; 5-Year Disease-Free Survival (DFS 94%); No adjuvant chemotherapy required",
        "molecular_biomarkers": "EGFR L858R mutation positive, ALK negative, PD-L1 TPS < 1%",
        "histology": "Acinar predominant adenocarcinoma",
        "scan_features": [0.82, 0.25, 0.15, 0.05, 0.18, 0.72] # Feature vector seed
    },
    {
        "case_id": "NLST-CASE-1142",
        "diagnosis": "Squamous Cell Carcinoma",
        "stage": "Stage II",
        "sub_stage": "Stage II-B (T2b N1 M0)",
        "nodule_size_mm": 38.0,
        "anatomical_location": "Left Lower Lobe (Superior segment)",
        "morphology": "Solid cavitary mass with thick irregular wall and ipsilateral hilar node enlargement",
        "treatment": "Left Lower Lobectomy followed by 4 cycles of Adjuvant Cisplatin + Gemcitabine",
        "treatment_outcome": "Partial pathologic response; 3-Year Recurrence-Free Survival; Hilar clearance confirmed",
        "molecular_biomarkers": "FGFR1 amplification detected, PD-L1 TPS 45%",
        "histology": "Moderately differentiated keratinizing squamous cell carcinoma",
        "scan_features": [0.35, 0.88, 0.45, 0.12, 0.65, 0.55]
    },
    {
        "case_id": "LIDC-IDRI-0231",
        "diagnosis": "Large Cell Neuroendocrine",
        "stage": "Stage III",
        "sub_stage": "Stage III-A (T3 N2 M0)",
        "nodule_size_mm": 52.0,
        "anatomical_location": "Right Middle Lobe with Subcarinal N2 extension",
        "morphology": "Heterogeneous hypoattenuating necrotic mass abutting pericardium",
        "treatment": "Neoadjuvant Chemo-Immunotherapy (Carboplatin + Etoposide + Durvalumab) followed by Thoracotomy",
        "treatment_outcome": "38% volumetric regression following induction; Stable disease at 18 months post-op",
        "molecular_biomarkers": "Synaptophysin (+), Chromogranin (+), Ki-67 index 65%",
        "histology": "High-grade neuroendocrine carcinoma",
        "scan_features": [0.15, 0.42, 0.91, 0.38, 0.85, 0.40]
    },
    {
        "case_id": "NLST-CASE-2905",
        "diagnosis": "Metastatic Adenocarcinoma",
        "stage": "Stage IV",
        "sub_stage": "Stage IV-A (M1a - Malignant Pleural Effusion)",
        "nodule_size_mm": 44.0,
        "anatomical_location": "Bilateral multifocal peripheral lung fields",
        "morphology": "Primary right lower lobe mass with diffuse contralateral satellite micronodules",
        "treatment": "First-line Osimertinib (Tagrisso 80mg daily) + Palliative Pleurodesis",
        "treatment_outcome": "16-Month Progression-Free Survival; Substantial symptom resolution and effusion control",
        "molecular_biomarkers": "EGFR Exon 19 deletion (E746_A750del) confirmed via liquid biopsy ctDNA",
        "histology": "Poorly differentiated invasive adenocarcinoma",
        "scan_features": [0.08, 0.18, 0.45, 0.95, 0.92, 0.30]
    },
    {
        "case_id": "LIDC-IDRI-0012",
        "diagnosis": "Benign Hamartoma",
        "stage": "Benign",
        "sub_stage": "Non-neoplastic (Solitary Pulmonary Nodule)",
        "nodule_size_mm": 14.0,
        "anatomical_location": "Left Upper Lobe (Anterior segment)",
        "morphology": "Well-circumscribed smooth nodule with characteristic internal fat and popcorn calcification",
        "treatment": "Conservative surveillance with low-dose non-contrast thoracic CT at 6, 12, and 24 months",
        "treatment_outcome": "Volumetric stability confirmed over 2-year monitoring; No malignant transformation",
        "molecular_biomarkers": "Not indicated for benign pathology",
        "histology": "Mesenchymal benign hamartoma (cartilage and adipose tissue)",
        "scan_features": [0.12, 0.08, 0.05, 0.02, 0.08, 0.92]
    },
    {
        "case_id": "NLST-CASE-0849",
        "diagnosis": "Invasive Adenocarcinoma",
        "stage": "Stage I",
        "sub_stage": "Stage I-B (T2a N0 M0)",
        "nodule_size_mm": 28.0,
        "anatomical_location": "Right Lower Lobe (Posterior basal segment)",
        "morphology": "Solid nodule with prominent radial spiculation and vascular convergence",
        "treatment": "Robotic-Assisted Thoracic Surgery (RATS) Right Lower Lobectomy + Systematic LN Dissection",
        "treatment_outcome": "R0 resection verified; 4-Year Disease-Free Survival (DFS 88%); Negative margins",
        "molecular_biomarkers": "KRAS G12C mutation positive, PD-L1 TPS 15%",
        "histology": "Papillary and solid subtype adenocarcinoma",
        "scan_features": [0.78, 0.38, 0.18, 0.06, 0.35, 0.68]
    },
    {
        "case_id": "LIDC-IDRI-0348",
        "diagnosis": "Squamous Cell Carcinoma",
        "stage": "Stage III",
        "sub_stage": "Stage III-B (T4 N2 M0)",
        "nodule_size_mm": 60.0,
        "anatomical_location": "Right Upper Lobe hilar mass with main bronchus invasion",
        "morphology": "Large central infiltrating tumor causing secondary post-obstructive atelectasis",
        "treatment": "Definitive Concurrent Chemoradiotherapy (60 Gy IMRT in 30 fx + Cisplatin/Etoposide) + Consolidation Durvalumab",
        "treatment_outcome": "Locoregional control achieved; Persistent atelectasis resolved; No distant metastases at 14 months",
        "molecular_biomarkers": "PD-L1 TPS 80% (High expression)",
        "histology": "Invasive squamous cell carcinoma with focal central necrosis",
        "scan_features": [0.20, 0.55, 0.88, 0.28, 0.78, 0.45]
    },
    {
        "case_id": "NLST-CASE-3120",
        "diagnosis": "Benign Granuloma",
        "stage": "Benign",
        "sub_stage": "Non-neoplastic (Histoplasmosis / Post-infectious)",
        "nodule_size_mm": 11.0,
        "anatomical_location": "Right Middle Lobe (Lateral segment)",
        "morphology": "Dense central laminated calcification with sharply demarcated borders",
        "treatment": "Clinical observation; No surgical or pharmacotherapy intervention required",
        "treatment_outcome": "Unchanged dimensions on comparative 12-month low-dose CT; Clinically benign",
        "molecular_biomarkers": "Non-applicable",
        "histology": "Fibrocalcific necrotizing granulomatous lesion",
        "scan_features": [0.10, 0.05, 0.04, 0.01, 0.05, 0.95]
    }
]

def generate_reference_ct_scans(output_dir: str):
    """
    Generates realistic thoracic CT scan slices corresponding to the 8 clinical reference cases.
    Saves them as PNG images in the reference directory.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    for case in REFERENCE_CASES:
        cid = case["case_id"]
        filename = f"{cid}.png"
        filepath = os.path.join(output_dir, filename)
        case["image_path"] = filepath
        case["image_url"] = f"/datasets/reference_scans/{filename}"
        
        if os.path.exists(filepath):
            continue
            
        # Synthesize realistic anatomical Thoracic CT slice
        # Size: 380x380
        size = 380
        img = np.zeros((size, size), dtype=np.uint8)
        
        # 1. Thoracic body wall (elliptical torso)
        cv2.ellipse(img, (size//2, size//2), (size//2 - 25, size//2 - 45), 0, 0, 360, 185, -1)
        # Subcutaneous fat layer
        cv2.ellipse(img, (size//2, size//2), (size//2 - 35, size//2 - 55), 0, 0, 360, 95, -1)
        # Rib cage / cortical bone
        cv2.ellipse(img, (size//2, size//2), (size//2 - 42, size//2 - 62), 0, 0, 360, 240, 4)
        
        # 2. Lung fields (low density dark regions)
        # Right lung
        cv2.ellipse(img, (size//2 - 65, size//2 + 5), (48, 80), 0, 0, 360, 28, -1)
        # Left lung
        cv2.ellipse(img, (size//2 + 65, size//2 + 5), (44, 78), 0, 0, 360, 28, -1)
        
        # 3. Mediastinum & Spine
        # Spine bone posterior
        cv2.circle(img, (size//2, size//2 + 85), 18, 245, -1)
        cv2.circle(img, (size//2, size//2 + 85), 8, 40, -1) # Spinal canal
        # Mediastinal heart / great vessels
        cv2.ellipse(img, (size//2 + 5, size//2 - 20), (38, 48), 15, 0, 360, 120, -1)
        
        # 4. Bronchovascular markings (delicate vascular tree in lungs)
        for _ in range(8):
            rx = int(np.random.normal(size//2 - 65, 20))
            ry = int(np.random.normal(size//2 + 5, 30))
            cv2.circle(img, (rx, ry), np.random.randint(1, 3), int(np.random.randint(80, 140)), -1)
        for _ in range(8):
            lx = int(np.random.normal(size//2 + 65, 20))
            ly = int(np.random.normal(size//2 + 5, 30))
            cv2.circle(img, (lx, ly), np.random.randint(1, 3), int(np.random.randint(80, 140)), -1)
            
        # 5. Pathological lesion specific to this case
        stage = case["stage"]
        diag = case["diagnosis"]
        radius = max(4, int(case["nodule_size_mm"] / 2.2))
        
        if "Benign" in stage:
            # Smooth, well-demarcated nodule
            cx, cy = size//2 - 60, size//2 - 20
            cv2.circle(img, (cx, cy), radius, 190, -1)
            if "Hamartoma" in diag:
                cv2.circle(img, (cx, cy), radius//2, 80, -1) # fat density
            elif "Granuloma" in diag:
                cv2.circle(img, (cx, cy), radius//2, 250, -1) # dense calcium
        elif "Stage I" in stage:
            # Small spiculated nodule
            cx, cy = size//2 - 70, size//2 - 30
            cv2.circle(img, (cx, cy), radius, 185, -1)
            for angle in range(0, 360, 45):
                rad = np.deg2rad(angle)
                ex = int(cx + (radius + 5) * np.cos(rad))
                ey = int(cy + (radius + 5) * np.sin(rad))
                cv2.line(img, (cx, cy), (ex, ey), 160, 1)
        elif "Stage II" in stage:
            # Larger cavitary or lobulated mass
            cx, cy = size//2 + 65, size//2 + 25
            cv2.circle(img, (cx, cy), radius, 195, -1)
            cv2.circle(img, (cx - 2, cy - 2), radius // 3, 35, -1) # Cavitation
        elif "Stage III" in stage:
            # Infiltrating central lesion abutting mediastinum
            cx, cy = size//2 - 35, size//2 - 15
            cv2.ellipse(img, (cx, cy), (radius + 8, radius), 25, 0, 360, 200, -1)
        else: # Stage IV
            # Multifocal nodules
            cx, cy = size//2 + 60, size//2 - 20
            cv2.circle(img, (cx, cy), radius, 195, -1)
            cv2.circle(img, (size//2 - 60, size//2 + 30), radius // 2, 180, -1)
            cv2.circle(img, (size//2 - 75, size//2 - 10), radius // 3, 175, -1)

        # Smooth and convert to 3-channel
        img_rgb = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
        Image.fromarray(img_rgb).save(filepath)

