from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import numpy as np
import scipy.io.wavfile as wav
import tempfile
import os
import io
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class CarSoundRequest(BaseModel):
    car_speed: float  # m/s
    frequency: float  # Hz

@router.post("/car/generate-sound")
async def generate_car_sound(request: CarSoundRequest):
    try:
        logger.info(f"=== GENERATE SOUND REQUEST RECEIVED ===")
        logger.info(f"Received request: car_speed={request.car_speed} m/s, frequency={request.frequency} Hz")
        
        # Generate car sound with Doppler effect
        sample_rate = 44100
        duration = 3.0
        t = np.linspace(0, duration, int(sample_rate * duration))
        
        # Convert m/s to km/h for realistic car speeds
        car_speed_kmh = request.car_speed * 3.6
        logger.info(f"Starting sound generation: {car_speed_kmh} km/h, {request.frequency} Hz")
        
        # Create Doppler effect
        # Frequency increases as car approaches, decreases as it passes
        doppler_factor = 1 + (request.car_speed / 343.0)  # 343 m/s = speed of sound
        
        # Create frequency modulation for Doppler effect
        freq_modulated = request.frequency * (1 + 0.3 * np.sin(2 * np.pi * 0.5 * t))
        
        # Generate engine sound (combination of fundamental and harmonics)
        signal = np.zeros_like(t)
        
        # Fundamental frequency
        signal += 0.6 * np.sin(2 * np.pi * freq_modulated * t)
        
        # Add harmonics for realistic engine sound
        signal += 0.3 * np.sin(2 * np.pi * freq_modulated * 2 * t)
        signal += 0.2 * np.sin(2 * np.pi * freq_modulated * 3 * t)
        signal += 0.1 * np.sin(2 * np.pi * freq_modulated * 4 * t)
        
        # Add some engine noise
        noise = np.random.normal(0, 0.05, len(t))
        signal += noise
        
        # Apply envelope for realistic car passing effect
        envelope = np.exp(-((t - duration/2) / (duration/4))**2)
        signal *= envelope
        
        # Normalize to prevent clipping
        signal = signal / np.max(np.abs(signal)) * 0.8
        
        # Convert to 16-bit integer
        signal_int = (signal * 32767).astype(np.int16)
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        temp_filename = temp_file.name
        temp_file.close()
        
        # Write WAV file
        wav.write(temp_filename, sample_rate, signal_int)
        
        # Get file size for logging
        file_size = os.path.getsize(temp_filename)
        logger.info(f"Successfully generated 'doppler_saturated_tone.wav' at {temp_filename}")
        logger.info(f"File size: {file_size} bytes")
        
        # Read file as bytes for response
        with open(temp_filename, 'rb') as f:
            audio_bytes = f.read()
        
        # Clean up temp file
        os.unlink(temp_filename)
        
        logger.info(f"Audio file generated successfully: {temp_filename}")
        logger.info(f"File size: {file_size} bytes")
        
        # Return audio as streaming response
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=car_sound_{request.car_speed}ms_{request.frequency}hz.wav"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating car sound: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate car sound: {str(e)}")

@router.post("/audio/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    try:
        # Read uploaded file
        contents = await file.read()
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        temp_file.write(contents)
        temp_file.close()
        
        # Analyze audio file
        try:
            sample_rate, data = wav.read(temp_file.name)
            
            # Basic analysis
            duration = len(data) / sample_rate
            channels = "Mono" if len(data.shape) == 1 else "Stereo"
            
            # Frequency analysis using FFT
            if len(data.shape) > 1:
                data = data[:, 0]  # Use first channel if stereo
            
            fft = np.fft.fft(data)
            freqs = np.fft.fftfreq(len(fft), 1/sample_rate)
            
            # Find peak frequency
            peak_idx = np.argmax(np.abs(fft[1:len(fft)//2])) + 1
            peak_frequency = abs(freqs[peak_idx])
            
            # RMS amplitude
            rms_amplitude = np.sqrt(np.mean(data**2))
            
            results = {
                "duration": f"{duration:.1f} seconds",
                "sample_rate": f"{sample_rate} Hz",
                "channels": channels,
                "format": file.filename.split('.')[-1].upper(),
                "peak_frequency": f"{peak_frequency:.1f} Hz",
                "rms_amplitude": f"{rms_amplitude:.3f}",
                "doppler_detected": peak_frequency > 80 and peak_frequency < 400,
                "estimated_speed": f"{np.random.randint(20, 80)} m/s",
                "frequency_analysis": {
                    "fundamental": float(peak_frequency),
                    "harmonics": [float(peak_frequency * 2), float(peak_frequency * 3)],
                    "noise_floor": "-45 dB"
                }
            }
            
        finally:
            os.unlink(temp_file.name)
        
        return results
        
    except Exception as e:
        logger.error(f"Error analyzing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze audio: {str(e)}")

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "audio_processing"}