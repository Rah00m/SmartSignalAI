import logging
import librosa
import soundfile as sf
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

def validate_audio_file(file_path: str) -> bool:
    """
    Validate if audio file can be loaded
    
    Args:
        file_path: Path to audio file
    
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        y, sr = librosa.load(file_path, sr=None)
        return True
    except Exception as e:
        logger.error(f"Invalid audio file: {e}")
        return False

def get_audio_info(file_path: str) -> dict:
    """
    Get detailed audio file information
    
    Args:
        file_path: Path to audio file
    
    Returns:
        dict: Audio metadata (sample_rate, duration, samples, channels)
    """
    try:
        y, sr = librosa.load(file_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)
        
        return {
            "sample_rate": sr,
            "duration": duration,
            "samples": len(y),
            "channels": 1 if y.ndim == 1 else y.shape[0],
            "nyquist_frequency": sr / 2
        }
    except Exception as e:
        logger.error(f"Error getting audio info: {e}")
        return {}

def normalize_audio(audio: np.ndarray) -> np.ndarray:
    """
    Normalize audio to [-1, 1] range
    
    Args:
        audio: Input audio array
    
    Returns:
        np.ndarray: Normalized audio
    """
    max_val = np.abs(audio).max()
    if max_val > 0:
        return audio / max_val
    return audio

def resample_audio(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    """
    Resample audio to target sample rate
    
    Args:
        audio: Input audio array
        orig_sr: Original sample rate
        target_sr: Target sample rate
    
    Returns:
        np.ndarray: Resampled audio
    """
    return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)

def calculate_audio_quality_metrics(original: np.ndarray, enhanced: np.ndarray) -> dict:
    """
    Calculate quality metrics comparing original and enhanced audio
    
    Args:
        original: Original audio array
        enhanced: Enhanced audio array
    
    Returns:
        dict: Quality metrics (SNR, correlation, etc.)
    """
    # Ensure same length
    min_len = min(len(original), len(enhanced))
    original = original[:min_len]
    enhanced = enhanced[:min_len]
    
    # Calculate SNR (Signal-to-Noise Ratio)
    noise = enhanced - original
    signal_power = np.mean(original ** 2)
    noise_power = np.mean(noise ** 2)
    snr = 10 * np.log10(signal_power / (noise_power + 1e-10))
    
    # Calculate correlation
    correlation = np.corrcoef(original, enhanced)[0, 1]
    
    return {
        "snr_db": float(snr),
        "correlation": float(correlation),
        "rms_original": float(np.sqrt(np.mean(original ** 2))),
        "rms_enhanced": float(np.sqrt(np.mean(enhanced ** 2)))
    }