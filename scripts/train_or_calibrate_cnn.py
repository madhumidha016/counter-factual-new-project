import os
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
from backend.ml.cnn.model import LungCancerCNN

def generate_synthetic_thoracic_sample(has_tumor=True, stage=1, nodule_scale=1.0, blurred=False):
    """
    Generates a realistic synthetic thoracic CT slice:
    - Dark air outside the patient
    - Elliptical chest wall / ribs with soft tissue
    - Bilateral dark lung fields (HU ~ -700, pixel intensity ~ 40)
    - If has_tumor: focal hyperdense nodule (pixel intensity ~ 170-220) with spiculation
    """
    img = np.zeros((224, 224, 3), dtype=np.float32)
    
    # Coordinates grid
    y, x = np.ogrid[:224, :224]
    cx, cy = 112, 112
    
    # Patient thorax outer ellipse
    thorax_mask = ((x - cx)**2) / (95**2) + ((y - cy)**2) / (85**2) <= 1.0
    img[thorax_mask] = 110.0 # Soft tissue chest wall
    
    # Outer rib ring
    rib_ring = (((x - cx)**2) / (92**2) + ((y - cy)**2) / (82**2) <= 1.0) & \
               (((x - cx)**2) / (88**2) + ((y - cy)**2) / (78**2) >= 1.0)
    img[rib_ring] = 210.0 # Bone HU
    
    # Left and Right Lung Fields (dark cavities)
    left_lung = (((x - 75)**2) / (28**2) + ((y - 110)**2) / (52**2) <= 1.0)
    right_lung = (((x - 149)**2) / (28**2) + ((y - 110)**2) / (52**2) <= 1.0)
    lung_mask = left_lung | right_lung
    
    # Normal lung parenchyma attenuation (~ 42 with subtle noise)
    noise = np.random.normal(0, 3, (224, 224, 3)).astype(np.float32)
    img[lung_mask] = 42.0
    img += noise
    
    label_malignant = 0
    label_stage = 0
    
    if has_tumor and nodule_scale > 0.05:
        label_malignant = 1
        label_stage = min(3, max(0, stage - 1))
        
        # Place nodule inside right or left lung
        tx, ty = (145, 105) if stage % 2 == 0 else (80, 115)
        radius = (6 + stage * 3) * nodule_scale
        
        nodule_region = ((x - tx)**2 + (y - ty)**2) <= (radius**2)
        if blurred:
            nodule_intensity = 60.0 + 30.0 * nodule_scale
        else:
            nodule_intensity = 165.0 + 25.0 * stage
            
        img[nodule_region] = nodule_intensity
        
    img = np.clip(img, 0, 255).astype(np.uint8)
    return img, label_malignant, label_stage

def calibrate_and_train():
    output_path = os.path.join("backend", "trained_models", "lung_cancer_cnn.pth")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    print("[Calibrator] Initializing LungCancerCNN architecture...")
    model = LungCancerCNN()
    model.train()
    
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    criterion_mal = nn.CrossEntropyLoss()
    criterion_stage = nn.CrossEntropyLoss()
    
    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    
    print("[Calibrator] Training on 300 calibrated thoracic CT representations...")
    batch_size = 16
    for epoch in range(15):
        epoch_loss = 0.0
        for _ in range(20): # 20 batches of 16 = 320 samples per epoch
            tensors = []
            mal_targets = []
            stg_targets = []
            
            for _ in range(batch_size):
                has_tumor = np.random.rand() > 0.35
                stage = np.random.choice([1, 2, 3, 4])
                # Varied intervention scale
                nodule_scale = np.random.choice([0.0, 0.35, 0.70, 1.0]) if has_tumor else 0.0
                blurred = np.random.rand() > 0.5
                
                img_np, mal_lbl, stg_lbl = generate_synthetic_thoracic_sample(
                    has_tumor=has_tumor and (nodule_scale > 0.1),
                    stage=stage,
                    nodule_scale=nodule_scale,
                    blurred=blurred
                )
                
                t = torch.from_numpy(img_np.transpose((2, 0, 1))).float() / 255.0
                t = normalize(t)
                tensors.append(t)
                mal_targets.append(mal_lbl)
                stg_targets.append(stg_lbl)
                
            x_batch = torch.stack(tensors)
            y_mal = torch.tensor(mal_targets, dtype=torch.long)
            y_stg = torch.tensor(stg_targets, dtype=torch.long)
            
            optimizer.zero_grad()
            out_mal, out_stg, _ = model(x_batch)
            loss_m = criterion_mal(out_mal, y_mal)
            loss_s = criterion_stage(out_stg, y_stg)
            loss = loss_m + 0.5 * loss_s
            
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
            
        if (epoch + 1) % 5 == 0:
            print(f"  Epoch [{epoch+1}/15] - Loss: {epoch_loss/20:.4f}")
            
    model.eval()
    torch.save(model.state_dict(), output_path)
    print(f"[Calibrator] Successfully saved trained calibrated weights to {output_path}!")

if __name__ == "__main__":
    calibrate_and_train()
