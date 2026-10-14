import torch
import torch.nn as nn


class AttentionClassifier(nn.Module):
    def __init__(self, input_dim=768, num_classes=6):
        super().__init__()

        self.attention = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.Tanh(),
            nn.Linear(128, 1)
        )

        self.classifier = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        weights = torch.softmax(
            self.attention(x), dim=1
        )

        pooled = (x * weights).sum(dim=1)

        return self.classifier(pooled)
