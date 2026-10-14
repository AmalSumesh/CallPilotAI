import asyncio
import tempfile
from pathlib import Path

import librosa

from fastapi import APIRouter, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.services.model_service import emotion_model, SR
from app.services.audio_service import analyze_audio
from app.services.inference_lock import inference_lock


router = APIRouter()

ALLOWED_EXTENSIONS = {
    ".wav", ".mp3", ".flac", ".ogg", ".m4a"
}

MAX_UPLOAD_BYTES = 50 * 1024 * 1024


@router.post("/analyze")
async def analyze_upload(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format"
        )

    temp_path = None

    try:
        total_bytes = 0

        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix
        ) as temp_file:
            temp_path = temp_file.name

            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                total_bytes += len(chunk)

                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="Audio file exceeds 50 MB"
                    )

                temp_file.write(chunk)

        if total_bytes == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded audio file is empty"
            )

        def process_file():
            audio, _ = librosa.load(
                temp_path, sr=SR, mono=True
            )

            if len(audio) == 0:
                raise ValueError("Audio contains no readable samples")

            # A regular thread lock safely coordinates requests
            # that share the same model instance.
            with inference_lock:
                results = analyze_audio(audio, emotion_model)

            return len(audio) / SR, results

        duration, results = await run_in_threadpool(process_file)

        return {
            "audio_duration_seconds": duration,
            "windows_analyzed": len(results),
            "results": results,
            "note": (
                "Anger plus disgust is an experimental signal, "
                "not a validated measure of customer frustration."
            )
        }

    except HTTPException:
        raise

    except Exception as error:
        print("UPLOAD ANALYSIS ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to analyze audio"
        )

    finally:
        await file.close()

        if temp_path and Path(temp_path).exists():
            Path(temp_path).unlink()
