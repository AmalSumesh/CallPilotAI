import numpy as np

from app.services.model_service import SR, EmotionModelService


WINDOW_SEC = 3
STEP_SEC = 1

WINDOW_SIZE = SR * WINDOW_SEC
STEP_SIZE = SR * STEP_SEC


def analyze_audio(
    audio: np.ndarray,
    model: EmotionModelService
) -> list[dict]:
    if audio.size == 0:
        raise ValueError("Audio is empty")

    if len(audio) <= WINDOW_SIZE:
        starts = [0]
    else:
        starts = list(
            range(0, len(audio) - WINDOW_SIZE + 1, STEP_SIZE)
        )

        final_start = len(audio) - WINDOW_SIZE

        if starts[-1] != final_start:
            starts.append(final_start)

    results = []

    for start in starts:
        chunk = audio[start:start + WINDOW_SIZE]
        valid_duration = len(chunk) / SR

        if len(chunk) < WINDOW_SIZE:
            chunk = np.pad(
                chunk,
                (0, WINDOW_SIZE - len(chunk))
            )

        prediction = model.predict(chunk)

        results.append({
            "window_start_seconds": start / SR,
            "window_end_seconds": min(
                start / SR + valid_duration,
                len(audio) / SR
            ),
            **prediction
        })

    return results


class LiveAudioBuffer:
    def __init__(self):
        self.buffer = np.empty(0, dtype=np.float32)
        self.samples_processed = 0

    def add_audio(
        self, audio_chunk: np.ndarray
    ) -> list[tuple[float, float, np.ndarray]]:
        self.buffer = np.concatenate(
            (self.buffer, audio_chunk)
        )

        windows = []

        while len(self.buffer) >= WINDOW_SIZE:
            chunk = self.buffer[:WINDOW_SIZE].copy()

            start = self.samples_processed / SR
            end = start + WINDOW_SEC

            windows.append((start, end, chunk))

            self.buffer = self.buffer[STEP_SIZE:]
            self.samples_processed += STEP_SIZE

        return windows
