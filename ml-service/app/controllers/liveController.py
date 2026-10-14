import numpy as np

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from app.services.audio_service import LiveAudioBuffer
from app.services.model_service import emotion_model
from app.services.inference_lock import inference_lock


router = APIRouter()

MAX_MESSAGE_BYTES = 256 * 1024


@router.websocket("/ws/live")
async def live_inference(websocket: WebSocket):
    await websocket.accept()

    audio_buffer = LiveAudioBuffer()

    try:
        await websocket.send_json({
            "type": "ready",
            "sample_rate": 16000,
            "format": "pcm_s16le",
            "channels": 1,
            "window_seconds": 3,
            "step_seconds": 1
        })

        while True:
            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                break

            audio_bytes = message.get("bytes")

            if audio_bytes is None:
                continue

            if len(audio_bytes) > MAX_MESSAGE_BYTES:
                await websocket.send_json({
                    "type": "error",
                    "message": "Audio chunk is too large"
                })
                continue

            if len(audio_bytes) % 2 != 0:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid PCM16 audio chunk"
                })
                continue

            pcm = np.frombuffer(audio_bytes, dtype="<i2")

            if pcm.size == 0:
                continue

            audio = pcm.astype(np.float32) / 32768.0
            windows = audio_buffer.add_audio(audio)

            for start, end, window in windows:
                def predict():
                    with inference_lock:
                        return emotion_model.predict(window)

                result = await run_in_threadpool(predict)

                await websocket.send_json({
                    "type": "emotion",
                    "window_start_seconds": start,
                    "window_end_seconds": end,
                    **result
                })

    except WebSocketDisconnect:
        print("Live audio client disconnected")

    except Exception as error:
        print("LIVE INFERENCE ERROR:", error)

        try:
            await websocket.send_json({
                "type": "error",
                "message": "Live inference failed"
            })
        except Exception:
            pass
