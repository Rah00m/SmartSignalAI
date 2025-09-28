from fastapi import APIRouter
from .ecg_mode1 import router as mode1_router
from .records  import router as mode1_records_router
from .ecg_mode4 import router as mode4_router
from .ecg_mode3 import router as mode3_router
ecg_router = APIRouter()

ecg_router.include_router(mode1_router, prefix="/mode1", tags=["Mode 1"])
ecg_router.include_router(mode1_records_router, prefix="/mode1", tags=["Mode 1"]) 
ecg_router.include_router(mode4_router, prefix="/mode4", tags=["Mode 4"])
ecg_router.include_router(mode3_router, prefix="/mode3", tags=["Mode 3"])
