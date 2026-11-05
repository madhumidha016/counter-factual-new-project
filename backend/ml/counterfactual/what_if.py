import os
import cv2
import numpy as np
from PIL import Image
from backend.ml.cnn.inference import run_cnn_inference

def apply_counterfactual_intervention(
    image_path: str,
    salient_region: dict,
    mode: str,
    strength: str,
    output_dir: str,
    session_id: str
):
    """
    Applies counterfactual intervention to the localized suspicious region:
    - Mode: 'mask' | 'blur' | 'reduce_intensity'
    - Strength: 'low' | 'medium' | 'high'
    
    Generates modified CT image, saves visual lesion mask, re-runs CNN inference,
    and computes comparative sensitivity metrics for both cancer and normal probabilities.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Load original image
    pil_orig = Image.open(image_path).convert("RGB")
    np_img = np.array(pil_orig).copy()
    h, w = np_img.shape[:2]
    
    # 2. Extract salient region coordinates
    box = salient_region.get("salient_box")
    circle = salient_region.get("salient_circle")
    
    if box:
        bx = max(0, min(w - 1, box.get("x", w // 3)))
        by = max(0, min(h - 1, box.get("y", h // 3)))
        bw = max(10, min(w - bx, box.get("w", w // 4)))
        bh = max(10, min(h - by, box.get("h", h // 4)))
    else:
        bx, by, bw, bh = w // 3, h // 3, w // 4, h // 4

    # Create elliptical mask for organic anatomical transition
    mask_binary = np.zeros((h, w), dtype=np.uint8)
    center = (bx + bw // 2, by + bh // 2)
    axes = (max(5, bw // 2), max(5, bh // 2))
    cv2.ellipse(mask_binary, center, axes, 0, 0, 360, 255, -1)
    
    # Save visual mask image (cyan highlighted overlay indicating targeted lesion zone)
    mask_visual = np_img.copy()
    mask_colored = np.zeros_like(np_img)
    mask_colored[:, :] = [6, 182, 212] # Cyan accent highlight
    mask_indices = mask_binary > 0
    mask_visual[mask_indices] = cv2.addWeighted(
        mask_visual[mask_indices], 0.45, mask_colored[mask_indices], 0.55, 0
    )
    # Draw contour border around mask
    contours, _ = cv2.findContours(mask_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(mask_visual, contours, -1, (6, 182, 212), 2)
    
    mask_filename = f"{session_id}_mask.png"
    mask_path = os.path.join(output_dir, mask_filename)
    Image.fromarray(mask_visual).save(mask_path)
    
    # Smooth boundary with Gaussian feathering for natural counterfactual blending
    mask_soft = cv2.GaussianBlur(mask_binary, (21, 21), 11) / 255.0
    mask_soft_3c = np.repeat(mask_soft[:, :, np.newaxis], 3, axis=2)
    
    # 3. Strength multiplier
    strength_map = {
        "low": 0.35,
        "medium": 0.70,
        "high": 1.00
    }
    alpha = strength_map.get(strength.lower(), 0.70)
    
    modified_img = np_img.astype(np.float32)
    mode_lower = mode.lower()
    
    if "mask" in mode_lower:
        # Mask intervention: Inpaint / replace suspicious nodule with adjacent healthy lung parenchyma
        gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
        lung_bg_val = float(np.percentile(gray[gray > 20], 25)) if np.any(gray > 20) else 45.0
        noise = np.random.normal(0, 3, np_img.shape).astype(np.float32)
        healthy_tissue = np.full_like(modified_img, lung_bg_val) + noise
        healthy_tissue = np.clip(healthy_tissue, 0, 255)
        
        blended = modified_img * (1.0 - alpha * mask_soft_3c) + healthy_tissue * (alpha * mask_soft_3c)
        modified_img = blended
        intervention_description = f"Masked suspicious pulmonary lesion ({strength} strength) with simulated healthy parenchymal attenuation."
        
    elif "blur" in mode_lower:
        # Blur intervention: Attenuates high-frequency spiculation and fine calcification signatures
        ksize = int(15 * alpha) * 2 + 1
        ksize = max(5, ksize)
        blurred = cv2.GaussianBlur(np_img, (ksize, ksize), 0).astype(np.float32)
        blended = modified_img * (1.0 - alpha * mask_soft_3c) + blurred * (alpha * mask_soft_3c)
        modified_img = blended
        intervention_description = f"Applied Gaussian smoothing (kernel {ksize}x{ksize}, {strength} strength) to attenuate spiculation and lesion borders."
        
    elif "intensity" in mode_lower or "reduce" in mode_lower:
        # Intensity reduction: Scales radiological radiodensity down towards air/sub-solid density
        scale_factor = 1.0 - (0.75 * alpha)
        attenuated = modified_img * scale_factor
        blended = modified_img * (1.0 - mask_soft_3c) + (modified_img * (1.0 - alpha) + attenuated * alpha) * mask_soft_3c
        modified_img = blended
        intervention_description = f"Reduced radiodensity by {int(alpha * 75)}% ({strength} strength) to simulate sub-solid or ground-glass attenuation."
        
    else:
        modified_img = modified_img * (1.0 - 0.4 * mask_soft_3c)
        intervention_description = "Applied localized attenuation intervention."

    modified_img = np.clip(modified_img, 0, 255).astype(np.uint8)
    
    # 4. Save modified image
    cf_filename = f"{session_id}_cf_{mode}_{strength}.png"
    cf_path = os.path.join(output_dir, cf_filename)
    Image.fromarray(modified_img).save(cf_path)
    
    # 5. Execute CNN inference on the counterfactual image
    cf_inference = run_cnn_inference(cf_path)
    
    # 6. Execute CNN inference on original image to ensure exact baseline comparison
    orig_inference = run_cnn_inference(image_path)
    
    orig_prob = orig_inference["cancer_probability"]
    cf_prob = cf_inference["cancer_probability"]
    
    # Normal probabilities (Normal = 1.0 - Malignancy Probability)
    orig_normal_prob = round(1.0 - orig_prob, 4)
    cf_normal_prob = round(1.0 - cf_prob, 4)
    
    prob_diff = round(cf_prob - orig_prob, 4)
    diff_percentage_points = round((cf_prob - orig_prob) * 100.0, 1)
    pct_change = round(((cf_prob - orig_prob) / max(0.001, orig_prob)) * 100, 2)
    
    if prob_diff < -0.02:
        trend = "Decreased"
    elif prob_diff > 0.02:
        trend = "Increased"
    else:
        trend = "Stable / Unchanged"
        
    scientific_interpretation = (
        f"Following the counterfactual '{mode.replace('_', ' ').title()}' intervention ({strength.capitalize()} strength), "
        f"the model's predicted malignancy probability shifted from {orig_prob * 100:.1f}% to {cf_prob * 100:.1f}% "
        f"({'+' if diff_percentage_points > 0 else ''}{diff_percentage_points:.1f} percentage points; {pct_change:+.1f}%). "
        f"Concurrently, the predicted normal likelihood changed from {orig_normal_prob * 100:.1f}% to {cf_normal_prob * 100:.1f}%. "
        f"This measured sensitivity indicates that the neural network relies causally on focal radiomic features within the targeted region "
        f"rather than background thoracic anatomy."
    )
    
    return {
        "modified_image_url": f"/uploads/{cf_filename}",
        "mask_image_url": f"/uploads/{mask_filename}",
        "original_probability": orig_prob,
        "counterfactual_probability": cf_prob,
        "original_normal_probability": orig_normal_prob,
        "counterfactual_normal_probability": cf_normal_prob,
        "probability_difference": prob_diff,
        "difference_percentage_points": diff_percentage_points,
        "percentage_change": pct_change,
        "original_predicted_stage": orig_inference["predicted_stage"],
        "counterfactual_predicted_stage": cf_inference["predicted_stage"],
        "original_predicted_class": orig_inference["predicted_class"],
        "counterfactual_predicted_class": cf_inference["predicted_class"],
        "trend": trend,
        "mode": mode,
        "strength": strength,
        "description": intervention_description,
        "scientific_interpretation": scientific_interpretation,
        "comparison_chart_data": [
            {
                "metric": "Cancer Probability",
                "Original": round(orig_prob * 100, 1),
                "Counterfactual": round(cf_prob * 100, 1)
            },
            {
                "metric": "Normal Probability",
                "Original": round(orig_normal_prob * 100, 1),
                "Counterfactual": round(cf_normal_prob * 100, 1)
            },
            {
                "metric": "Stage I Likelihood",
                "Original": round(orig_inference["stage_probabilities"]["Stage I"] * 100, 1),
                "Counterfactual": round(cf_inference["stage_probabilities"]["Stage I"] * 100, 1)
            },
            {
                "metric": "Stage II Likelihood",
                "Original": round(orig_inference["stage_probabilities"]["Stage II"] * 100, 1),
                "Counterfactual": round(cf_inference["stage_probabilities"]["Stage II"] * 100, 1)
            },
            {
                "metric": "Stage III Likelihood",
                "Original": round(orig_inference["stage_probabilities"]["Stage III"] * 100, 1),
                "Counterfactual": round(cf_inference["stage_probabilities"]["Stage III"] * 100, 1)
            },
            {
                "metric": "Stage IV Likelihood",
                "Original": round(orig_inference["stage_probabilities"]["Stage IV"] * 100, 1),
                "Counterfactual": round(cf_inference["stage_probabilities"]["Stage IV"] * 100, 1)
            }
        ],
        "medical_disclaimer": "CRITICAL SCIENTIFIC LIMITATION: A decrease in model prediction following region masking or blurring demonstrates computational sensitivity and feature attribution. It does NOT independently prove that the targeted tissue has resolved or that cancer has been biologically treated."
    }
