from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import tempfile
from typing import Optional
import traceback

# Import the sound generator and analyzer
try:
    from .sound_generator import CarSoundGenerator
    print("Successfully imported CarSoundGenerator")
except ImportError as e:
    print(f"Failed to import CarSoundGenerator: {e}")
    CarSoundGenerator = None

try:
    from .sound_analyzer import CarSoundAnalyzer
    print("Successfully imported CarSoundAnalyzer")
except ImportError as e:
    print(f"Failed to import CarSoundAnalyzer: {e}")
    CarSoundAnalyzer = None

car_router = APIRouter()

# Initialize services if available
sound_generator = None
sound_analyzer = None

if CarSoundGenerator:
    try:
        sound_generator = CarSoundGenerator()
        print("CarSoundGenerator initialized successfully")
    except Exception as e:
        print(f"Failed to initialize CarSoundGenerator: {e}")

if CarSoundAnalyzer:
    try:
        sound_analyzer = CarSoundAnalyzer()
        print("CarSoundAnalyzer initialized successfully")
    except Exception as e:
        print(f"Failed to initialize CarSoundAnalyzer: {e}")

class SoundGenerationRequest(BaseModel):
    velocity: float
    frequency: float

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a', 'ogg', 'flac'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@car_router.post("/generate-sound")
async def generate_car_sound(request: SoundGenerationRequest):
    """
    Generate car sound based on velocity and frequency
    """
    try:
        print(f"=== GENERATE SOUND REQUEST RECEIVED ===")
        print(f"Received request: car_speed={request.velocity} m/s, frequency={request.frequency} Hz")
        
        # Updated validation for m/s (to match your original)
        if not (0 <= request.velocity <= 100):
            print(f"Car speed validation failed: {request.velocity}")
            raise HTTPException(status_code=400, detail="Car speed must be between 0 and 100 m/s")
        
        if not (20 <= request.frequency <= 1000):
            print(f"Frequency validation failed: {request.frequency}")
            raise HTTPException(status_code=400, detail="Frequency must be between 20 and 1000 Hz")
        
        # Check if sound generator is available
        if not sound_generator:
            print("Sound generator not available!")
            raise HTTPException(status_code=500, detail="Sound generator not available")
        
        # Generate the sound
        print("Starting sound generation...")
        audio_file_path = sound_generator.generate_car_sound(
            float(request.velocity), float(request.frequency)
        )
        
        # Verify file exists
        if not os.path.exists(audio_file_path):
            print(f"Generated file does not exist: {audio_file_path}")
            raise HTTPException(status_code=500, detail="Failed to generate audio file")
        
        file_size = os.path.getsize(audio_file_path)
        print(f"Audio file generated successfully: {audio_file_path}")
        print(f"File size: {file_size} bytes")
        
        return FileResponse(
            audio_file_path,
            media_type='audio/wav',
            filename=f'doppler_saturated_tone.wav'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_car_sound: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@car_router.post("/analyze-sound")
async def analyze_car_sound(
    audio: UploadFile = File(...),
    expected_frequency: Optional[float] = Form(100)
):
    """
    Analyze uploaded audio file to extract velocity and frequency
    """
    try:
        print(f"Received file for analysis: {audio.filename}")
        
        if not allowed_file(audio.filename):
            raise HTTPException(status_code=400, detail="Invalid file type. Supported: WAV, MP3, M4A, OGG, FLAC")
        
        # Check if analyzer is available
        if not sound_analyzer:
            raise HTTPException(status_code=500, detail="Sound analyzer not available")
        
        # Save uploaded file temporarily
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, audio.filename)
        
        with open(file_path, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)
        
        try:
            # Analyze the audio file with real analysis
            analysis_result = sound_analyzer.analyze_audio_file(file_path, expected_frequency)
            
            return analysis_result
            
        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in analyze_car_sound: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@car_router.get("/health")
async def health_check():
    """Health check endpoint"""
    status = {
        "status": "Car audio service is running",
        "sound_generator_available": sound_generator is not None,
        "sound_analyzer_available": sound_analyzer is not None
    }
    
    print(f"Health check: {status}")
    return status

@car_router.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {
        "message": "Car router is working!",
        "endpoints": [
            "/api/car/health",
            "/api/car/test", 
            "/api/car/generate-sound",
            "/api/car/analyze-sound"
        ]
    }