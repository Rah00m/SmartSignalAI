from fastapi import APIRouter
from .ecg_mode1 import router as mode1_router

ecg_router = APIRouter()

ecg_router.include_router(mode1_router, prefix="/mode1", tags=["Mode 1"])
