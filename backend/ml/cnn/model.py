import torch
import torch.nn as nn
import torch.nn.functional as F

class LungCancerCNN(nn.Module):
    """
    Dual-head Convolutional Neural Network for Thoracic CT Scan Analysis.
    Head 1: Malignancy Classification (Benign vs Malignant Probability)
    Head 2: TNM Stage Prediction (Stage I, II, III, IV)
    Embedding Head: 256-dimensional feature vector for Cosine Similarity Retrieval
    """
    def __init__(self):
        super(LungCancerCNN, self).__init__()
        
        # Convolutional Feature Extractor
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        
        # Target layer for Grad-CAM
        self.conv4 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(256)
        
        self.pool = nn.MaxPool2d(2, 2)
        self.adaptive_pool = nn.AdaptiveAvgPool2d((4, 4))
        self.dropout = nn.Dropout(0.35)
        
        # Dense feature embedding projection (256-D)
        self.fc_features = nn.Linear(256 * 4 * 4, 256)
        self.bn_fc = nn.BatchNorm1d(256)
        
        # Head 1: Malignancy Probability (Linear to 2 classes: [Benign, Malignant])
        self.classifier_malignancy = nn.Linear(256, 2)
        
        # Head 2: Stage Classification (4 classes: [Stage I, Stage II, Stage III, Stage IV])
        self.classifier_stage = nn.Linear(256, 4)

    def forward_features(self, x):
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        x = self.pool(F.relu(self.bn4(self.conv4(x))))
        return x

    def forward(self, x):
        features_map = self.forward_features(x)
        pooled = self.adaptive_pool(features_map)
        flattened = torch.flatten(pooled, 1)
        embedding = F.relu(self.bn_fc(self.fc_features(flattened)))
        embedding_dropped = self.dropout(embedding)
        
        malignancy_logits = self.classifier_malignancy(embedding_dropped)
        stage_logits = self.classifier_stage(embedding_dropped)
        
        return malignancy_logits, stage_logits, embedding

