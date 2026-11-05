import os
import sys
from io import BytesIO
from PIL import Image
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.db import init_db

def run_tests():
    print("=== STARTING FULL WORKFLOW INTEGRATION TEST ===")
    init_db()
    
    with TestClient(app) as client:
        # 1. Health check
        print("1. Testing health check...")
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("   -> Health check PASSED")

        # 2. Upload CT Scan
        print("2. Testing scan upload and file format validation...")
        # Bad extension
        res_bad = client.post("/api/upload", files={"file": ("bad.pdf", b"%PDF-1.4", "application/pdf")})
        assert res_bad.status_code == 400, "PDF upload should have been rejected!"
        
        # Valid image
        img_arr = np.full((256, 256, 3), 40, dtype=np.uint8)
        img_arr[80:120, 80:120] = [180, 180, 180] # nodule
        test_img = Image.fromarray(img_arr)
        buf = BytesIO()
        test_img.save(buf, format="PNG")
        raw_bytes = buf.getvalue()

        res_upload = client.post(
            "/api/upload",
            files={"file": ("thoracic_scan_test.png", raw_bytes, "image/png")},
            data={"patient_id": "PAT-2026-TEST"}
        )
        assert res_upload.status_code == 200, f"Upload failed: {res_upload.text}"
        upload_data = res_upload.json()
        session_id = upload_data["session_id"]
        print(f"   -> Upload PASSED! Session ID: {session_id}")

        # 3. Run CNN Detection & Grad-CAM
        print("3. Testing CNN Detection and Grad-CAM generation...")
        res_detect = client.post("/api/detect", json={"session_id": session_id})
        assert res_detect.status_code == 200, f"Detection failed: {res_detect.text}"
        det_data = res_detect.json()
        print(f"   -> CNN Detection PASSED!")
        print(f"      Probability: {det_data['cancer_probability']*100:.1f}%, Stage: {det_data['predicted_stage']}")
        print(f"      Heatmap URL: {det_data['heatmap_url']}, Overlay URL: {det_data['overlay_url']}")
        print(f"      Similar Cases Preview: {len(det_data['similar_cases_preview'])} cases retrieved")

        # 4. Counterfactual What-If
        print("4. Testing Counterfactual What-If Analysis (Mask, Blur, Reduce Intensity)...")
        for mode in ["mask", "blur", "reduce_intensity"]:
            for strength in ["low", "medium", "high"]:
                res_cf = client.post("/api/counterfactual", json={
                    "session_id": session_id,
                    "mode": mode,
                    "strength": strength
                })
                assert res_cf.status_code == 200, f"Counterfactual failed on {mode}-{strength}"
                cf_data = res_cf.json()
                assert "modified_image_url" in cf_data
        print(f"   -> All 9 Counterfactual mode/strength permutations PASSED!")
        print(f"      Latest diff: {cf_data['probability_difference']*100:+.1f}%, Trend: {cf_data['trend']}")

        # 5. Similar Case Retrieval
        print("5. Testing Similar Case Retrieval with Cosine Similarity...")
        res_sim = client.get(f"/api/similar-cases?session_id={session_id}&stage_filter=all")
        assert res_sim.status_code == 200
        cases = res_sim.json()["cases"]
        print(f"   -> Retrieved {len(cases)} cases with top match: {cases[0]['case_id']} ({cases[0]['similarity_score']}%)")

        # 6. Disease Progression
        print("6. Testing Disease Progression Simulator...")
        res_prog = client.post(
            "/api/progression/analyze",
            data={
                "session_id": session_id,
                "baseline_date": "2025-01-15",
                "interim_date": "2025-07-20",
                "current_date": "2026-02-10"
            },
            files={
                "baseline_file": ("b.png", raw_bytes, "image/png"),
                "interim_file": ("i.png", raw_bytes, "image/png"),
                "current_file": ("c.png", raw_bytes, "image/png")
            }
        )
        assert res_prog.status_code == 200, f"Progression failed: {res_prog.text}"
        prog_data = res_prog.json()
        print(f"   -> Progression PASSED! Doubling Time: {prog_data['summary']['volume_doubling_time_days']} days")
        print(f"      Projected +90d Area: {prog_data['future_projection']['projected_90d_area_mm2']} mm²")

        # 7. Patient Report & PDF
        print("7. Testing Patient Report & ReportLab PDF generation...")
        res_rep = client.post("/api/report/generate", json={
            "session_id": session_id,
            "patient_name": "Eleanor Vance",
            "patient_age": 64,
            "patient_gender": "F"
        })
        assert res_rep.status_code == 200, f"Report failed: {res_rep.text}"
        rep_data = res_rep.json()
        report_id = rep_data["report_id"]
        print(f"   -> Report generated PASSED! Report ID: {report_id}")

        # Download PDF
        res_dl = client.get(f"/api/report/{report_id}/download")
        assert res_dl.status_code == 200
        assert res_dl.headers["content-type"] == "application/pdf"
        assert len(res_dl.content) > 5000, "PDF size is unexpectedly small!"
        print(f"   -> PDF Download PASSED! File size: {len(res_dl.content)} bytes ({round(len(res_dl.content)/1024, 1)} KB)")

    print("\nALL 7 WORKFLOW TESTS COMPLETED SUCCESSFULLY WITH 100% PASS RATE!")

if __name__ == "__main__":
    run_tests()
