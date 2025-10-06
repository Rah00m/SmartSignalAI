from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .ecg import ecg_router
from .car.routes import car_router
from .radar.routes import radar_router  # Add this import

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ecg_router, prefix="/ecg", tags=["ECG"])
app.include_router(car_router, prefix="/api/car", tags=["Car Audio"])
app.include_router(radar_router, prefix="/api/radar", tags=["Radar/Drone Detection"])  # Add this line

@app.get("/")
def root():
    return {"message": "Welcome to SmartSignalAI API"}

# Load the drone model when the server starts
@app.on_event("startup")
async def startup_event():
    from .radar.routes import load_drone_model
    try:
        load_drone_model()
    except Exception as e:
        print(f"Warning: Could not load drone detection model: {e}")
