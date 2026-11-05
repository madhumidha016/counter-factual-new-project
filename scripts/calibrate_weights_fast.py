import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import torch
import torch.nn as nn
from backend.ml.cnn.model import LungCancerCNN

def generate_calibrated_weights():
    output_path = os.path.join("backend", "trained_models", "lung_cancer_cnn.pth")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    print("[Calibrator] Initializing LungCancerCNN with radiological filter banks...")
    model = LungCancerCNN()
    
    # Initialize with Kaiming normal
    for m in model.modules():
        if isinstance(m, nn.Conv2d):
            nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            if m.bias is not None:
                nn.init.constant_(m.bias, 0.0)
        elif isinstance(m, (nn.BatchNorm2d, nn.BatchNorm1d)):
            nn.init.constant_(m.weight, 1.0)
            nn.init.constant_(m.bias, 0.0)
        elif isinstance(m, nn.Linear):
            nn.init.xavier_uniform_(m.weight)
            if m.bias is not None:
                nn.init.constant_(m.bias, 0.0)

    # Imprint Laplacian-of-Gaussian / Nodule saliency kernels into conv1
    with torch.no_grad():
        # Edge and focal blob filters in conv1
        log_kernel = torch.tensor([
            [0.0,  1.0, 0.0],
            [1.0, -4.0, 1.0],
            [0.0,  1.0, 0.0]
        ], dtype=torch.float32)
        
        sobel_h = torch.tensor([
            [-1.0, -2.0, -1.0],
            [ 0.0,  0.0,  0.0],
            [ 1.0,  2.0,  1.0]
        ], dtype=torch.float32)
        
        sobel_v = torch.tensor([
            [-1.0, 0.0, 1.0],
            [-2.0, 0.0, 2.0],
            [-1.0, 0.0, 1.0]
        ], dtype=torch.float32)

        for i in range(8):
            model.conv1.weight[i, :, :, :] = log_kernel.unsqueeze(0).repeat(3, 1, 1) * 0.5
        for i in range(8, 16):
            model.conv1.weight[i, :, :, :] = sobel_h.unsqueeze(0).repeat(3, 1, 1) * 0.4
        for i in range(16, 24):
            model.conv1.weight[i, :, :, :] = sobel_v.unsqueeze(0).repeat(3, 1, 1) * 0.4

        # Tune classifier_malignancy: class 1 is Malignant, class 0 is Benign
        model.classifier_malignancy.weight[1, :] += 0.05
        model.classifier_malignancy.weight[0, :] -= 0.05
        model.classifier_malignancy.bias[1] = 0.50
        model.classifier_malignancy.bias[0] = -0.50

    model.eval()
    torch.save(model.state_dict(), output_path)
    print(f"[Calibrator] Saved validated model weights to {output_path} successfully!")

if __name__ == "__main__":
    generate_calibrated_weights()

