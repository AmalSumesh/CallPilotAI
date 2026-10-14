from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.concurrency import run_in_threadpool

from app.routes.inferenceRoutes import router
from app.services.model_service import emotion_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_in_threadpool(emotion_model.load)
    yield


app = FastAPI(
    title="CallPilot AI ML Service",
    lifespan=lifespan
)

app.include_router(router)
