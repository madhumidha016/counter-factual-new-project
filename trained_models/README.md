# Trained Models Directory

This directory stores the PyTorch weight checkpoint for the Dual-Head Thoracic CT CNN model.

### Expected File:
- `lung_cancer_cnn.pth`: Trained state dictionary for `LungCancerCNN`.

### Model Architecture:
- Backbone: 4-layer Deep Residual-style Convolutional Network with Batch Normalization
- Target Grad-CAM Layer: `conv4` (256 filters, 14x14 feature maps)
- Embedding: 256-dimensional penultimate dense layer
- Head 1: Malignancy Classification (`[Benign, Malignant]`)
- Head 2: Stage Classification (`[Stage I, Stage II, Stage III, Stage IV]`)

### Fallback Engine:
If `lung_cancer_cnn.pth` is not present, the application automatically activates the **Calibrated Radiomics & CNN Feature Engine**.
This engine computes spatial gradient saliency via Grad-CAM hooks and calibrates predictions based on radiological Hounsfield attenuation and nodule density, allowing complete end-to-end functionality, testing, and research demonstrations without requiring a separate pre-downloaded 500MB weights file.

