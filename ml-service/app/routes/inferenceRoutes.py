from fastapi import APIRouter

from app.controllers.uploadController import router as upload_router
from app.controllers.liveController import router as live_router
from app.services.model_service import emotion_model


router = APIRouter()

router.include_router(
    upload_router,
    prefix="/api/audio",
    tags=["Audio Analysis"]
)

router.include_router(live_router)


@router.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": emotion_model.classifier is not None,
        "sample_rate": 16000
    }
