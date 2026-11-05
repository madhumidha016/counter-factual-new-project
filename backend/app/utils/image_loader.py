import os
import cv2
import numpy as np
from PIL import Image

SUPPORTED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".dcm", ".dicom"
}

def is_supported_image(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in SUPPORTED_EXTENSIONS

def process_and_standardize_image(source_path: str, output_png_path: str) -> dict:
    """
    Standardizes any supported medical image format (JPG, PNG, BMP, TIFF, DICOM)
    into a standardized 3-channel RGB PNG slice suitable for web display and CNN inference.
    """
    ext = os.path.splitext(source_path)[1].lower()
    os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
    
    if ext in {".dcm", ".dicom"}:
        try:
            import pydicom
            ds = pydicom.dcmread(source_path, force=True)
            pixel_array = ds.pixel_array.astype(np.float32)
            
            # Apply RescaleSlope and RescaleIntercept to get true Hounsfield Units (HU)
            slope = float(getattr(ds, 'RescaleSlope', 1.0))
            intercept = float(getattr(ds, 'RescaleIntercept', 0.0))
            hu = pixel_array * slope + intercept
            
            # Read window center and width if present, else default to standard Thoracic Lung Window
            wc = getattr(ds, 'WindowCenter', -600.0)
            ww = getattr(ds, 'WindowWidth', 1500.0)
            if isinstance(wc, (list, tuple, pydicom.multival.MultiValue)):
                wc = float(wc[0])
            else:
                wc = float(wc)
            if isinstance(ww, (list, tuple, pydicom.multival.MultiValue)):
                ww = float(ww[0])
            else:
                ww = float(ww)
                
            img_min = wc - ww / 2.0
            img_max = wc + ww / 2.0
            windowed = np.clip(hu, img_min, img_max)
            normalized = ((windowed - img_min) / max(1.0, (img_max - img_min)) * 255.0).astype(np.uint8)
            
            if len(normalized.shape) == 2:
                rgb = cv2.cvtColor(normalized, cv2.COLOR_GRAY2RGB)
            else:
                rgb = normalized[:, :, :3]
                
            Image.fromarray(rgb).save(output_png_path, "PNG")
            h, w = rgb.shape[:2]
            return {
                "format": "DICOM",
                "width": w,
                "height": h,
                "converted_path": output_png_path
            }
        except Exception as e:
            print(f"[DICOM Loader Error] {e}. Attempting fallback generic image reader.")

    # Standard formats: BMP, TIFF, TIF, PNG, JPG, JPEG
    pil_img = Image.open(source_path).convert("RGB")
    pil_img.save(output_png_path, "PNG")
    w, h = pil_img.size
    return {
        "format": ext.lstrip(".").upper(),
        "width": w,
        "height": h,
        "converted_path": output_png_path
    }

