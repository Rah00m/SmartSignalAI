from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

# Configure logging FIRST
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
log = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SmartSignalAI API",
    description="API for DSP, AI, and Signal Processing with VoiceFixer",
    version="3.0.0"
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Import Services ---
# AudioSR (now using VoiceFixer)
try:
    from app.audio_sr.routes import router as audio_sr_router
    from app.audio_sr.service import voicefixer_service
    log.info("✅ VoiceFixer router imported successfully")
except ImportError as e:
    log.error(f"❌ Failed to import VoiceFixer router: {e}")
    audio_sr_router = None
    voicefixer_service = None

# Radar
try:
    from app.radar.routes import router as radar_router
    from app.radar.routes import load_drone_model
    log.info("✅ Radar router imported successfully")
except ImportError as e:
    log.warning(f"⚠️ Could not import radar router: {e}")
    radar_router = None
    load_drone_model = None

# Car
try:
    from app.car.routes import router as car_router
    log.info("✅ Car router imported successfully")
except ImportError as e:
    log.warning(f"⚠️ Could not import car router: {e}")
    car_router = None

# --- Register Routers ---
if audio_sr_router:
    app.include_router(audio_sr_router, prefix="/api/audio-sr", tags=["Audio Restoration"])
    log.info("📡 VoiceFixer router registered at /api/audio-sr")

if radar_router:
    app.include_router(radar_router, prefix="/api/radar", tags=["Radar"])
    log.info("📡 Radar router registered at /api/radar")
    
if car_router:
    app.include_router(car_router, prefix="/api/car", tags=["Car Audio"])
    log.info("📡 Car router registered at /api/car")

# --- Startup Event ---
@app.on_event("startup")
async def startup_event():
    log.info("=" * 60)
    log.info("🚀 SmartSignalAI API Starting...")
    log.info("=" * 60)
    
    # Load drone model if available
    if load_drone_model:
        try:
            load_drone_model()
            log.info("✅ Drone detection model loaded")
        except Exception as e:
            log.warning(f"⚠️ Could not load drone model: {e}")
    
    # ✅ VoiceFixer lazy loading info
    if voicefixer_service:
        log.info("ℹ️ VoiceFixer model will load on FIRST request (lazy loading)")
        log.info(f"🖥️ VoiceFixer device: {voicefixer_service.device.upper()}")
        log.info("⚡ Processing time: ~10-30 seconds per file")
        log.info("📦 Model size: ~200MB (auto-downloads on first use)")
        
        if voicefixer_service.device == 'cpu':
            log.info("💡 To enable GPU: Update NVIDIA driver + CUDA toolkit")
        else:
            log.info("🎮 GPU acceleration enabled!")
    
    log.info("=" * 60)
    log.info("✅ Server ready! Listening on http://0.0.0.0:8000")
    log.info("📖 API docs: http://localhost:8000/docs")
    log.info("=" * 60)

# --- Root Endpoint ---
@app.get("/")
def read_root():
    """API root endpoint"""
    available_services = {}
    
    if audio_sr_router:
        available_services["audio_restoration"] = {
            "endpoint": "/api/audio-sr",
            "model": "VoiceFixer v0.1.2",
            "description": "Fast audio restoration and bandwidth extension"
        }
    if radar_router:
        available_services["radar_detection"] = {
            "endpoint": "/api/radar",
            "description": "Drone detection from radar signals"
        }
    if car_router:
        available_services["car_audio"] = {
            "endpoint": "/api/car",
            "description": "Car audio processing"
        }
    
    return {
        "message": "Welcome to SmartSignalAI API",
        "version": "3.0.0",
        "ai_model": "VoiceFixer (replaces AudioSR)",
        "services": available_services,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    """Overall API health check"""
    services_status = {}
    
    if audio_sr_router:
        services_status["voicefixer"] = {
            "available": True,
            "loaded": voicefixer_service.model_loaded if voicefixer_service else False,
            "device": voicefixer_service.device if voicefixer_service else "unknown"
        }
    
    if radar_router:
        services_status["radar"] = "available"
    
    if car_router:
        services_status["car"] = "available"
    
    return {
        "status": "healthy",
        "version": "3.0.0",
        "services": services_status
    }

# --- Main Entry Point ---
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )













# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# import uvicorn
# import logging

# # Configure logging FIRST
# logging.basicConfig(level=logging.INFO)
# log = logging.getLogger(__name__)

# # Create the FastAPI app EARLY
# app = FastAPI(
#     title="SmartSignalAI API",
#     description="API for DSP, AI, and Signal Processing tasks.",
#     version="2.0.0"
# )

# # --- Add CORS Middleware ---
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Import AudioSR (this should always work)
# try:
#     from .audio_sr.routes import router as audio_sr_router
#     from .audio_sr.service import audiosr_service
#     log.info("✅ AudioSR router imported successfully")
# except ImportError as e:
#     log.error(f"❌ Failed to import AudioSR router: {e}")
#     audio_sr_router = None
#     audiosr_service = None

# # Try to import radar
# try:
#     from .radar.routes import router as radar_router
#     from .radar.routes import load_drone_model
#     log.info("✅ Radar router imported successfully")
# except ImportError:
#     try:
#         from .radar.routes import radar_router, load_drone_model
#         log.info("✅ Radar router imported successfully (alternative import)")
#     except ImportError as e:
#         log.warning(f"⚠️ Could not import radar router: {e}")
#         radar_router = None
#         load_drone_model = None

# # Try to import car
# try:
#     from .car.routes import router as car_router
#     log.info("✅ Car router imported successfully")
# except ImportError:
#     try:
#         from .car.routes import car_router
#         log.info("✅ Car router imported successfully (alternative import)")
#     except ImportError as e:
#         log.warning(f"⚠️ Could not import car router: {e}")
#         car_router = None

# # --- Include Routers (do this BEFORE startup event) ---
# if audio_sr_router:
#     app.include_router(audio_sr_router, prefix="/api/audio-sr", tags=["Audio Super-Resolution"])
#     log.info("📡 AudioSR router registered at /api/audio-sr")

# if radar_router:
#     app.include_router(radar_router, prefix="/api/radar", tags=["Radar"])
#     log.info("📡 Radar router registered at /api/radar")
    
# if car_router:
#     app.include_router(car_router, prefix="/api/car", tags=["Car Audio"])
#     log.info("📡 Car router registered at /api/car")

# # --- Startup Event ---
# @app.on_event("startup")
# async def startup_event():
#     log.info("🚀 Server is starting up...")
    
#     # Load drone detection model
#     if load_drone_model:
#         try:
#             load_drone_model()
#             log.info("✅ Drone detection model loaded")
#         except Exception as e:
#             log.warning(f"⚠️ Warning: Could not load drone detection model: {e}")
    
#     # ✅ DO NOT load AudioSR on startup!
#     if audiosr_service:
#         log.info("ℹ️ AudioSR model will be loaded on FIRST API request (lazy loading)")
#         log.info(f"🖥️ AudioSR will use: {audiosr_service.device.upper()}")
#         if audiosr_service.device == 'cpu':
#             log.info("⚠️ First request may take 5-10 minutes (CPU mode)")
#             log.info("💡 Update NVIDIA driver to enable GPU acceleration")

# # --- Root Endpoint ---
# @app.get("/")
# def read_root():
#     """A simple root endpoint to show the API is running."""
#     available_services = {}
    
#     if audio_sr_router:
#         available_services["audio_super_resolution"] = "/api/audio-sr"
#     if radar_router:
#         available_services["radar_detection"] = "/api/radar"
#     if car_router:
#         available_services["car_audio"] = "/api/car"
    
#     return {
#         "message": "Welcome to SmartSignalAI API",
#         "version": "2.0.0",
#         "services": available_services
#     }

# @app.get("/health")
# def health_check():
#     """Overall health check"""
#     return {
#         "status": "healthy",
#         "services": {
#             "audio_sr": "available" if audio_sr_router else "unavailable",
#             "radar": "available" if radar_router else "unavailable",
#             "car": "available" if car_router else "unavailable",
#         }
#     }

# # --- Main entry point ---
# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=8000)