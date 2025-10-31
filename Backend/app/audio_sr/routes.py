from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
import logging

# ✅ Import VoiceFixer service
from .service import voicefixer_service

router = APIRouter()
log = logging.getLogger(__name__)

@router.post("/process-audio")
async def process_audio(
    file: UploadFile = File(...),
    target_sr: int = 44100
):
    """
    Process audio with VoiceFixer restoration.
    Automatically detects and handles aliased audio.
    """
    log.info(f"📥 Received audio file: {file.filename}")
    
    # Validate file type
    if not file.filename.lower().endswith(('.wav', '.mp3', '.flac', '.ogg')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload WAV, MP3, FLAC, or OGG file."
        )
    
    # Validate target sample rate
    if target_sr not in [16000, 24000, 44100, 48000]:
        raise HTTPException(
            status_code=400,
            detail="Target sample rate must be 16000, 24000, 44100, or 48000 Hz"
        )
    
    try:
        # Process audio
        result = await voicefixer_service.process_audio(file, target_sr=target_sr)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"❌ Error processing audio: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Audio processing failed: {str(e)}"
        )

@router.get("/model-info")
async def get_model_info():
    """Get information about VoiceFixer model"""
    try:
        info = voicefixer_service.get_model_info()
        return {
            "model": info["model_name"],
            "version": info["version"],
            "status": "loaded" if info["loaded"] else "not_loaded",
            "device": info["device"],
            "capabilities": info["capabilities"],
            "supported_modes": info["supported_modes"],
            "processing_time": info["typical_processing_time"],
            "repository": info["repository"],
            "description": "Fast audio restoration and bandwidth extension using VoiceFixer"
        }
    except Exception as e:
        log.error(f"❌ Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check for VoiceFixer service"""
    return {
        "service": "VoiceFixer Audio Restoration",
        "status": "healthy" if voicefixer_service.model_loaded else "ready",
        "model_loaded": voicefixer_service.model_loaded,
        "device": voicefixer_service.device,
        "model": "VoiceFixer v0.1.2"
    }




















# from fastapi import APIRouter, HTTPException, UploadFile, File
# from fastapi.responses import FileResponse
# import logging

# # ✅ Import VoiceFixer service
# from .service import voicefixer_service as service

# router = APIRouter()
# log = logging.getLogger(__name__)

# @router.post("/process-audio")
# async def process_audio(
#     file: UploadFile = File(...),
#     target_sr: int = 44100  # VoiceFixer optimal: 44.1kHz
# ):
#     """
#     Process audio with VoiceFixer restoration.
#     Automatically detects and handles aliased audio.
    
#     Parameters:
#     - file: Audio file (WAV, MP3, FLAC)
#     - target_sr: Target sample rate (44100 or 48000)
#     """
#     log.info(f"📥 Received audio file: {file.filename}")
    
#     # Validate file type
#     if not file.filename.lower().endswith(('.wav', '.mp3', '.flac', '.ogg')):
#         raise HTTPException(
#             status_code=400,
#             detail="Invalid file format. Please upload WAV, MP3, FLAC, or OGG file."
#         )
    
#     # Validate target sample rate
#     if target_sr not in [16000, 24000, 44100, 48000]:
#         raise HTTPException(
#             status_code=400,
#             detail="Target sample rate must be 16000, 24000, 44100, or 48000 Hz"
#         )
    
#     try:
#         # ✅ Lazy-load model on first request
#         if not service.model_loaded:
#             log.info("🔄 First request detected - loading VoiceFixer model...")
#             log.info("⏳ This will take 10-30 seconds. Please wait...")
        
#         # Process audio
#         result = await service.process_audio(file, target_sr=target_sr)
        
#         return result
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         log.error(f"❌ Error processing audio: {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Audio processing failed: {str(e)}"
#         )

# @router.get("/model-info")
# async def get_model_info():
#     """Get information about VoiceFixer model"""
#     try:
#         info = service.get_model_info()
#         return {
#             "model": info["model_name"],
#             "version": info["version"],
#             "status": "loaded" if info["loaded"] else "not_loaded",
#             "device": info["device"],
#             "capabilities": info["capabilities"],
#             "supported_modes": info["supported_modes"],
#             "processing_time": info["typical_processing_time"],
#             "repository": info["repository"],
#             "description": "Fast audio restoration and bandwidth extension using VoiceFixer"
#         }
#     except Exception as e:
#         log.error(f"❌ Error getting model info: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/health")
# async def health_check():
#     """Health check for VoiceFixer service"""
#     return {
#         "service": "VoiceFixer Audio Restoration",
#         "status": "healthy" if service.model_loaded else "ready",
#         "model_loaded": service.model_loaded,
#         "device": service.device,
#         "model": "VoiceFixer v0.1.2"
#     }














# from fastapi import APIRouter, HTTPException, UploadFile, File
# from fastapi.responses import FileResponse
# import logging

# # from .service import audiosr_service  # ✅ CRITICAL: Import the service
# from .service import voicefixer_service as service



# router = APIRouter()
# log = logging.getLogger(__name__)

# # --- Your Drone Model ---
# # (I am assuming your model loading logic is here or in utils)
# # For this example, we'll create a placeholder
# drone_model = None
# model_loaded = False

# def load_drone_model():
#     """
#     Loads the drone detection model.
#     This is called by main.py on startup.
#     """
#     global drone_model, model_loaded
#     if model_loaded:
#         log.info("Drone detection model already loaded.")
#         return

#     try:
#         log.info("Loading drone detection model...")
#         # -----------------------------------------------------------
#         # TODO: Put your actual model loading logic here
#         # Example: drone_model = YourModel.load("path/to/model")
#         # -----------------------------------------------------------
        
#         # Simulating a successful load for the example
#         drone_model = "My_Drone_Model_Object" 
#         model_loaded = True
#         log.info("Drone detection model loaded successfully!")

#     except Exception as e:
#         log.error(f"❌ Failed to load drone detection model: {e}")
#         model_loaded = False

# # --- Example Health Check for this Router ---
# @router.get("/health")
# def get_radar_health():
#     """Health check for the Radar service."""
#     status = "healthy" if model_loaded else "degraded"
#     return {
#         "service": "Radar Detection",
#         "status": status,
#         "model_loaded": model_loaded
#     }

# # --- Example Endpoint ---
# @router.post("/detect-drone")
# async def detect_drone():
#     """
#     (Example) A placeholder endpoint for drone detection.
#     You would replace this with your actual API logic.
#     """
#     if not model_loaded:
#         raise HTTPException(status_code=503, detail="Model is not loaded.")
    
#     # TODO: Add your signal processing logic here
#     # (e.g., get file, process with drone_model)
    
#     return {"detection": "drone", "confidence": 0.95}

# @router.post("/process-audio")
# async def process_audio_with_ai(
#     file: UploadFile = File(...),
#     target_sr: int = 48000
# ):
#     """Process aliased audio with AI-powered super-resolution"""
#     log.info(f"📥 Received audio file: {file.filename}")
    
#     # Validate file type
#     if not file.filename.lower().endswith(('.wav', '.mp3', '.flac')):
#         raise HTTPException(
#             status_code=400,
#             detail="Invalid file format. Please upload WAV, MP3, or FLAC file."
#         )
    
#     # Validate target sample rate
#     if target_sr not in [24000, 48000]:
#         raise HTTPException(
#             status_code=400,
#             detail="Target sample rate must be 24000 or 48000 Hz"
#         )
    
#     try:
#         # ✅ Load model on first request (lazy loading)
#         if not audiosr_service.model_loaded:
#             log.info("🔄 First request detected - loading AudioSR model...")
#             log.info("⏳ This will take 2-5 minutes. Please wait...")
#             audiosr_service.load_model()
            
#             if not audiosr_service.model_loaded:
#                 raise HTTPException(
#                     status_code=503,
#                     detail="AudioSR model failed to load. Please try again later."
#                 )
        
#         # Process audio using the singleton service instance
#         return await audiosr_service.process_audio(file, target_sr)
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         log.error(f"❌ Error processing audio: {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Audio processing failed: {str(e)}"
#         )

# @router.get("/model-info")
# async def get_model_info():
#     """Get information about the loaded AudioSR model"""
#     info = audiosr_service.get_model_info()
#     return {
#         "model": "AudioSR",
#         "status": "loaded" if info["loaded"] else "not_loaded",
#         "device": info["device"],
#         "supported_input_rates": info["supported_input_rates"],
#         "supported_output_rates": info["supported_output_rates"],
#         "description": "State-of-the-art audio super-resolution using diffusion models"
#     }

# @router.get("/health")
# async def health_check():
#     """Health check for AudioSR service"""
#     return {
#         "status": "healthy" if audiosr_service.model_loaded else "degraded",
#         "model_loaded": audiosr_service.model_loaded,
#         "device": audiosr_service.device
#     }