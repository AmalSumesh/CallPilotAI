from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
