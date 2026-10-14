from pathlib import Path

import numpy as np
import torch
from transformers import AutoFeatureExtractor, AutoModel

from app.models.emotion_model import AttentionClassifier


BASE_DIR = Path(__file__).resolve().parents[2]
CHECKPOINT = BASE_DIR / "model" / "wavlm_attention_best.pth"

MODEL_NAME = "microsoft/wavlm-base"

CLASSES = [
    "anger", "disgust", "fear",
    "happy", "neutral", "sad"
]

SR = 16000


class EmotionModelService:
    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        self.extractor = None
        self.encoder = None
        self.classifier = None

    def load(self):
        if not CHECKPOINT.is_file():
            raise FileNotFoundError(
                f"Checkpoint not found: {CHECKPOINT}"
            )

        print(f"Loading WavLM on {self.device}...")

        self.extractor = AutoFeatureExtractor.from_pretrained(
            MODEL_NAME
        )

        self.encoder = AutoModel.from_pretrained(
            MODEL_NAME
        ).to(self.device).eval()

        for param in self.encoder.parameters():
            param.requires_grad = False

        self.classifier = AttentionClassifier().to(self.device)

        state = torch.load(
            CHECKPOINT,
            map_location=self.device,
            weights_only=True
        )

        self.classifier.load_state_dict(state)
        self.classifier.eval()

        print("WavLM model loaded successfully.")

    def predict(self, audio: np.ndarray) -> dict:
        if self.classifier is None or self.encoder is None:
            raise RuntimeError("Model has not been loaded")

        inputs = self.extractor(
            audio.astype(np.float32),
            sampling_rate=SR,
            return_tensors="pt"
        )

        inputs = {
            key: value.to(self.device)
            for key, value in inputs.items()
        }

        with torch.inference_mode():
            hidden = self.encoder(
                **inputs
            ).last_hidden_state.float()

            probs = torch.softmax(
                self.classifier(hidden), dim=1
            )[0].cpu().numpy()

        predicted = int(np.argmax(probs))
        anger = float(probs[0])
        disgust = float(probs[1])

        return {
            "predicted_emotion": CLASSES[predicted],
            "model_confidence": float(probs[predicted]),
            "emotion_probabilities": {
                name: float(probs[index])
                for index, name in enumerate(CLASSES)
            },
            "anger_probability": anger,
            "disgust_probability": disgust,
            "frustration_related_signal": anger + disgust
        }


emotion_model = EmotionModelService()
