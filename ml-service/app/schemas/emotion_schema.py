from typing import Literal
from pydantic import BaseModel


Emotion = Literal[
    "anger", "disgust", "fear",
    "happy", "neutral", "sad"
]


class EmotionResult(BaseModel):
    window_start_seconds: float
    window_end_seconds: float
    predicted_emotion: Emotion
    model_confidence: float
    emotion_probabilities: dict[str, float]
    anger_probability: float
    disgust_probability: float
    frustration_related_signal: float


class UploadAnalysisResponse(BaseModel):
    audio_duration_seconds: float
    windows_analyzed: int
    results: list[EmotionResult]
    note: str
