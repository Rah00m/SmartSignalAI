from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .ecg import ecg_router
from .car.routes import car_router  # Add this import

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ecg_router, prefix="/ecg", tags=["ECG"])
app.include_router(car_router, prefix="/api/car", tags=["Car Audio"])  # Add this line

@app.get("/")
def root():
    return {"message": "Welcome to SmartSignalAI API"}  # Updated message
