from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import tempfile
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

radar_router = APIRouter()

# Global variable to store the model (loaded once)
drone_detector = None

def load_drone_model():
    """Load the drone detection model once when the server starts"""
    global drone_detector
    if drone_detector is None:
        try:
            logger.info("Loading drone detection model...")
            from transformers import pipeline
            drone_detector = pipeline(
                "audio-classification", 
                model="preszzz/drone-audio-detection-05-17-trial-0"
            )
            logger.info("Drone detection model loaded successfully!")
        except Exception as e:
            logger.error(f"Failed to load drone detection model: {str(e)}")
            # Don't raise the error, just log it so the server can still start
            drone_detector = None
    return drone_detector

@radar_router.post("/detect-drone")
async def detect_drone(audio_file: UploadFile = File(...)):
    """
    Detect if the uploaded audio contains drone sounds
    """
    try:
        # Check if model is loaded
        detector = load_drone_model()
        if detector is None:
            raise HTTPException(
                status_code=503, 
                detail="Drone detection model is not available. Please check server logs."
            )

        # Validate file type (optional - let the model handle format detection)
        logger.info(f"Processing audio file: {audio_file.filename} ({audio_file.content_type})")
        
        # Save uploaded file temporarily
        file_extension = os.path.splitext(audio_file.filename)[1] if audio_file.filename else '.wav'
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Process audio directly with the model (same as your notebook)
            logger.info("Classifying audio for drone detection...")
            results = detector(temp_file_path)
            
            if not results:
                raise HTTPException(status_code=500, detail="No results returned from model")
            
            # Process results (same format as your notebook)
            processed_results = []
            for result in results:
                processed_results.append({
                    "label": result['label'],
                    "confidence": round(result['score'] * 100, 2)  # Convert to percentage
                })
            
            # Determine primary detection
            primary_result = max(results, key=lambda x: x['score'])
            is_drone = primary_result['label'].lower() == 'drone'
            confidence = round(primary_result['score'] * 100, 2)
            
            logger.info(f"Analysis complete. Primary detection: {primary_result['label']} ({confidence}%)")
            
            return JSONResponse(content={
                "success": True,
                "filename": audio_file.filename,
                "primary_detection": {
                    "is_drone": is_drone,
                    "label": primary_result['label'],
                    "confidence": confidence
                },
                "detailed_results": processed_results,
                "message": f"Audio classified as '{primary_result['label']}' with {confidence}% confidence"
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in drone detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@radar_router.get("/model-info")
async def get_model_info():
    """Get information about the drone detection model"""
    detector = load_drone_model()
    model_available = detector is not None
    
    return {
        "model_name": "preszzz/drone-audio-detection-05-17-trial-0",
        "description": "Pre-trained model for detecting drone sounds in audio files",
        "supported_formats": ["WAV", "MP3", "OGG", "FLAC", "M4A"],
        "labels": ["drone", "not_drone"],
        "model_loaded": model_available,
        "status": "ready" if model_available else "loading_failed"
    }

@radar_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "radar_detection"}