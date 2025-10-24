from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .ecg import ecg_router
from .car.routes import car_router
from .radar.routes import radar_router
from .eeg.routes import eeg_router  # Add this import

app = FastAPI()

@app.on_event("startup")
def list_routes():
    print("\n📋 Registered API Routes:")
    for route in app.routes:
        if hasattr(route, 'methods'):
            print(f"{route.methods} -> {route.path}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(ecg_router, prefix="/ecg", tags=["ECG"])
app.include_router(eeg_router, prefix="/eeg", tags=["EEG"])  # Add this line
app.include_router(car_router, prefix="/api/car", tags=["Car Audio"])
app.include_router(radar_router, prefix="/api/radar", tags=["Radar/Drone Detection"])

@app.get("/")
def root():
    return {"message": "Welcome to SmartSignalAI API"}

# Load the drone model when the server starts
@app.on_event("startup")
async def startup_event():
    from .radar.routes import load_drone_model
    try:
        load_drone_model()
        print("✅ Drone detection model loaded successfully")
    except Exception as e:
        print(f"Warning: Could not load drone detection model: {e}")
    
    # EEG data is loaded automatically in the eeg_router
    print("✅ EEG routes initialized")