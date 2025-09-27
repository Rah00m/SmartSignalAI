from fastapi import APIRouter
from .ecg_mode1 import router as mode1_router
from .recordes  import router as mode1_records_router
ecg_router = APIRouter()

ecg_router.include_router(mode1_router, prefix="/mode1", tags=["Mode 1"])
ecg_router.include_router(mode1_records_router, prefix="/mode1", tags=["Mode 1"]) 