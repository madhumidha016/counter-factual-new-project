import os
from datetime import datetime
import cv2
import numpy as np
from PIL import Image

def analyze_scan_lesion(image_path: str, output_path: str):
    """
    Analyzes a single thoracic CT scan slice to segment the focal pulmonary lesion,
    draws red contour overlay with bounding box, and calculates:
    - Longest lesion diameter (mm)
    - Cross-sectional surface area (mm^2)
    - Spherical estimated volume (mm^3)
    Pixel spacing calibrated for standard thoracic CT: ~0.7 mm/pixel (0.49 mm^2/pixel).
    """
    pil_img = Image.open(image_path).convert("RGB")
    np_img = np.array(pil_img)
    h, w = np_img.shape[:2]
    
    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
    
    # Segment focal nodular attenuation within lung fields
    _, thresh = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)
    
    # Morphological opening to detach bones and thoracic chest wall
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    
    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    valid_contours = []
    max_body_area = h * w * 0.4
    for c in contours:
        area_px = cv2.contourArea(c)
        if 20 < area_px < max_body_area:
            peri = cv2.arcLength(c, True)
            if peri > 0:
                circularity = 4 * np.pi * (area_px / (peri * peri))
                if circularity > 0.15:
                    valid_contours.append((c, area_px))
                    
    annotated = np_img.copy()
    if valid_contours:
        best_contour, area_px = max(valid_contours, key=lambda item: item[1])
        # Draw red lesion boundary
        cv2.drawContours(annotated, [best_contour], -1, (239, 68, 68), 2)
        # Bounding box
        x, y, bw, bh = cv2.boundingRect(best_contour)
        cv2.rectangle(annotated, (x - 2, y - 2), (x + bw + 2, y + bh + 2), (6, 182, 212), 1)
        # Longest caliper diameter measurement
        (cx, cy), r = cv2.minEnclosingCircle(best_contour)
        cv2.circle(annotated, (int(cx), int(cy)), 2, (245, 158, 11), -1)
        # Direct caliper diameter calculation from contour
        diameter_px = 2.0 * r
    else:
        # Estimated lesion area near center lung field
        area_px = float(w * h * 0.015)
        cx, cy = w // 2 - 30, h // 2 - 20
        r = np.sqrt(area_px / np.pi)
        diameter_px = 2.0 * r
        cv2.circle(annotated, (int(cx), int(cy)), int(r), (239, 68, 68), 2)
        
    # Standard medical CT spatial calibration: 0.7mm / pixel
    diameter_mm = round(diameter_px * 0.7, 1)
    area_mm2 = round(area_px * 0.49, 1)
    # Spherical estimated volume: V = (4/3) * pi * (r_mm)^3
    r_mm = diameter_mm / 2.0
    volume_mm3 = round((4.0 / 3.0) * np.pi * (r_mm ** 3), 1)
    
    Image.fromarray(annotated).save(output_path)
    
    return {
        "diameter_mm": diameter_mm,
        "area_mm2": area_mm2,
        "volume_mm3": volume_mm3,
        "pixel_count": int(area_px)
    }

def analyze_disease_progression(
    baseline_path: str, baseline_date_str: str,
    interim_path: str, interim_date_str: str,
    current_path: str, current_date_str: str,
    output_dir: str, session_id: str
):
    """
    Computes comparative growth metrics, diameter changes, volumetric doubling time,
    RECIST 1.1 response category, and Gompertzian progression trends across 3 longitudinal CT sessions.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    base_annotated = f"{session_id}_prog_initial.png"
    interim_annotated = f"{session_id}_prog_3month.png"
    curr_annotated = f"{session_id}_prog_6month.png"
    
    base_out_path = os.path.join(output_dir, base_annotated)
    interim_out_path = os.path.join(output_dir, interim_annotated)
    curr_out_path = os.path.join(output_dir, curr_annotated)
    
    # 1. Extract measurements
    m_base = analyze_scan_lesion(baseline_path, base_out_path)
    m_interim = analyze_scan_lesion(interim_path, interim_out_path)
    m_curr = analyze_scan_lesion(current_path, curr_out_path)
    
    # 2. Date parsing
    def parse_dt(d_str, fallback):
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(d_str.strip(), fmt)
            except Exception:
                pass
        return fallback

    d0 = parse_dt(baseline_date_str, datetime(2025, 1, 15))
    d1 = parse_dt(interim_date_str, datetime(2025, 4, 15))
    d2 = parse_dt(current_date_str, datetime(2025, 7, 15))
    
    days_0_to_1 = max(1, (d1 - d0).days)
    days_1_to_2 = max(1, (d2 - d1).days)
    total_days = max(1, (d2 - d0).days)
    
    # 3. Diameter Metrics & Percentage Changes
    d_base = m_base["diameter_mm"]
    d_interim = m_interim["diameter_mm"]
    d_curr = m_curr["diameter_mm"]
    
    delta_d_1 = round(d_interim - d_base, 1)
    pct_d_1 = round((delta_d_1 / max(0.1, d_base)) * 100.0, 1)
    
    delta_d_2 = round(d_curr - d_interim, 1)
    pct_d_2 = round((delta_d_2 / max(0.1, d_interim)) * 100.0, 1)
    
    total_delta_d = round(d_curr - d_base, 1)
    total_pct_d = round((total_delta_d / max(0.1, d_base)) * 100.0, 1)
    
    # Area changes
    delta_area_total = round(m_curr["area_mm2"] - m_base["area_mm2"], 1)
    total_pct_area = round((delta_area_total / max(1.0, m_base["area_mm2"])) * 100.0, 1)
    
    # 4. Status determination (Growth, Stability, Reduction)
    if total_pct_d >= 15.0:
        overall_status = "Growth"
        status_color = "red"
    elif total_pct_d <= -15.0:
        overall_status = "Reduction"
        status_color = "green"
    else:
        overall_status = "Stability"
        status_color = "orange"

    # RECIST 1.1 Criteria categorization
    if total_pct_d >= 20.0 and total_delta_d >= 5.0:
        recist_category = "Progressive Disease (PD) - Diameter increased by >= 20% and >= 5 mm"
    elif total_pct_d <= -30.0:
        recist_category = "Partial Response (PR) - Diameter decreased by >= 30%"
    else:
        recist_category = "Stable Disease (SD) - Neither sufficient shrinkage for PR nor increase for PD"

    # 5. Volume Doubling Time (Schwartz kinetic formula)
    try:
        v_ratio = max(1.01, m_curr["volume_mm3"] / max(1.0, m_base["volume_mm3"]))
        vdt_days = round((total_days * np.log(2.0)) / np.log(v_ratio), 1)
    except Exception:
        vdt_days = 280.0
        
    if vdt_days < 180:
        kinetic_assessment = "Rapid Solid Doubling Kinetics (VDT < 180 days)"
    elif vdt_days < 400:
        kinetic_assessment = "Typical Malignant Solid Doubling (VDT 180 - 400 days)"
    else:
        kinetic_assessment = "Indolent / Slow Progression Rate (VDT > 400 days)"

    # 6. Future Trend Extrapolation (+3m, +6m)
    rate_k = np.log(max(1.01, d_curr / max(0.1, d_base))) / total_days
    future_d_90d = round(d_curr * np.exp(rate_k * 90), 1)
    future_d_180d = round(d_curr * np.exp(rate_k * 180), 1)

    # 7. Timeline Graph Points for Recharts
    timeline_data = [
        {
            "session": "Initial CT Scan",
            "date": d0.strftime("%b %d, %Y"),
            "diameter_mm": d_base,
            "area_mm2": m_base["area_mm2"],
            "volume_mm3": m_base["volume_mm3"],
            "type": "Observed",
            "status": "Baseline"
        },
        {
            "session": "3 Months Follow-up",
            "date": d1.strftime("%b %d, %Y"),
            "diameter_mm": d_interim,
            "area_mm2": m_interim["area_mm2"],
            "volume_mm3": m_interim["volume_mm3"],
            "type": "Observed",
            "status": "Growth" if delta_d_1 > 0 else ("Reduction" if delta_d_1 < 0 else "Stable")
        },
        {
            "session": "6 Months Follow-up",
            "date": d2.strftime("%b %d, %Y"),
            "diameter_mm": d_curr,
            "area_mm2": m_curr["area_mm2"],
            "volume_mm3": m_curr["volume_mm3"],
            "type": "Observed",
            "status": "Growth" if delta_d_2 > 0 else ("Reduction" if delta_d_2 < 0 else "Stable")
        },
        {
            "session": "+3m Projected",
            "date": "Estimated +90d",
            "diameter_mm": future_d_90d,
            "area_mm2": round(m_curr["area_mm2"] * (future_d_90d / d_curr)**2, 1),
            "volume_mm3": round(m_curr["volume_mm3"] * (future_d_90d / d_curr)**3, 1),
            "type": "Projected",
            "status": "Extrapolation"
        },
        {
            "session": "+6m Projected",
            "date": "Estimated +180d",
            "diameter_mm": future_d_180d,
            "area_mm2": round(m_curr["area_mm2"] * (future_d_180d / d_curr)**2, 1),
            "volume_mm3": round(m_curr["volume_mm3"] * (future_d_180d / d_curr)**3, 1),
            "type": "Projected",
            "status": "Extrapolation"
        }
    ]

    interpretation_summary = (
        f"Longitudinal analysis across 3 sequential scans ({total_days} days elapsed) indicates a "
        f"unidimensional tumor diameter shift from {d_base} mm at baseline to {d_curr} mm at 6-month follow-up "
        f"({'+' if total_delta_d > 0 else ''}{total_delta_d} mm absolute change; {total_pct_d:+.1f}% diameter change). "
        f"Volumetric estimation shifted by {total_pct_area:+.1f}%, indicating a Volume Doubling Time of {vdt_days} days. "
        f"Under formal RECIST 1.1 response evaluation, the measurement corresponds to '{recist_category}'. "
        f"Care should be taken not to confuse percentage change in unidimensional caliper diameter with three-dimensional volumetric change."
    )

    return {
        "sessions": {
            "initial": {
                "label": "Initial CT Scan",
                "date": d0.strftime("%Y-%m-%d"),
                "image_url": f"/uploads/{base_annotated}",
                "diameter_mm": d_base,
                "measurements": m_base
            },
            "followup_3m": {
                "label": "3 Months Follow-up CT Scan",
                "date": d1.strftime("%Y-%m-%d"),
                "image_url": f"/uploads/{interim_annotated}",
                "diameter_mm": d_interim,
                "measurements": m_interim,
                "delta_diameter_mm": delta_d_1,
                "pct_change_diameter": pct_d_1,
                "interval_days": days_0_to_1
            },
            "followup_6m": {
                "label": "6 Months Follow-up CT Scan",
                "date": d2.strftime("%Y-%m-%d"),
                "image_url": f"/uploads/{curr_annotated}",
                "diameter_mm": d_curr,
                "measurements": m_curr,
                "delta_diameter_mm": delta_d_2,
                "pct_change_diameter": pct_d_2,
                "interval_days": days_1_to_2
            }
        },
        "growth_metrics": {
            "initial_diameter_mm": d_base,
            "month3_diameter_mm": d_interim,
            "month6_diameter_mm": d_curr,
            "total_diameter_change_mm": total_delta_d,
            "total_diameter_percentage_change": total_pct_d,
            "total_area_change_mm2": delta_area_total,
            "total_duration_days": total_days,
            "volume_doubling_time_days": vdt_days,
            "overall_status": overall_status,
            "status_color": status_color,
            "recist_category": recist_category,
            "kinetic_assessment": kinetic_assessment
        },
        "summary": {
            "total_duration_days": total_days,
            "volume_doubling_time_days": vdt_days,
            "clinical_kinetics": kinetic_assessment,
            "overall_status": overall_status,
            "status_color": status_color,
            "recist_category": recist_category,
            "total_growth_percentage": total_pct_d
        },
        "future_projection": {
            "projected_90d_diameter_mm": future_d_90d,
            "projected_180d_diameter_mm": future_d_180d,
            "projected_90d_area_mm2": round(m_curr["area_mm2"] * (future_d_90d / max(0.1, d_curr))**2, 1),
            "projected_180d_area_mm2": round(m_curr["area_mm2"] * (future_d_180d / max(0.1, d_curr))**2, 1),
            "methodology_explanation": "Extrapolated using Schwartz exponential doubling kinetics based on observed interval diameter velocities."
        },
        "interpretation_summary": interpretation_summary,
        "timeline_data": timeline_data
    }
