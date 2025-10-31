import librosa
import soundfile as sf
import torch
import logging
import os
import numpy as np
from pathlib import Path
from fastapi import UploadFile
from fastapi.responses import FileResponse

# ✅ Import VoiceFixer
try:
    from voicefixer import VoiceFixer
    VOICEFIXER_AVAILABLE = True
except ImportError as e:
    logging.error(f"❌ VoiceFixer import failed: {e}")
    VOICEFIXER_AVAILABLE = False

# Setup logging
log = logging.getLogger(__name__)

# --- Define paths for temporary files ---
TEMP_DIR = Path("temp_audio")
TEMP_DIR.mkdir(exist_ok=True)
TEMP_INPUT_PATH = TEMP_DIR / "temp_input.wav"
TEMP_OUTPUT_PATH = TEMP_DIR / "temp_output.wav"
TEMP_RESAMPLED_PATH = TEMP_DIR / "temp_resampled.wav"

class VoiceFixerService:
    def __init__(self):
        """Initialize VoiceFixer service for audio restoration."""
        if not VOICEFIXER_AVAILABLE:
            log.error("❌ VoiceFixer not available. Install: pip install voicefixer")
            self.model = None
            self.model_loaded = False
            self.device = 'cpu'
            return
        
        self.model = None
        self.model_loaded = False
        
        # ✅ Auto-detect device
        cuda_available = torch.cuda.is_available()
        
        if cuda_available:
            try:
                gpu_name = torch.cuda.get_device_name(0)
                log.info(f"🎮 GPU detected: {gpu_name}")
                self.device = 'cuda'
            except Exception as e:
                log.warning(f"⚠️ CUDA check failed: {e}")
                self.device = 'cpu'
        else:
            self.device = 'cpu'
            log.info(f"⚠️ No GPU detected - using CPU")
        
        log.info(f"✅ VoiceFixerService initialized. Device: {self.device}")

    def load_model(self):
        """
        Load VoiceFixer model (lazy loading on first request).
        Model downloads automatically on first use (~200MB).
        """
        if self.model_loaded:
            log.info("VoiceFixer model already loaded.")
            return

        if not VOICEFIXER_AVAILABLE:
            raise Exception("VoiceFixer not installed. Run: pip install voicefixer")

        try:
            log.info("📦 Loading VoiceFixer model...")
            log.info("⏳ First load: downloading model (~200MB)")
            
            # ✅ Initialize VoiceFixer
            self.model = VoiceFixer()
            
            self.model_loaded = True
            log.info("✅ VoiceFixer model loaded successfully!")
            log.info("📚 Model: VoiceFixer v0.1.2")
            log.info("🔗 GitHub: https://github.com/haoheliu/voicefixer")
            
            if self.device == 'cuda':
                try:
                    gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
                    log.info(f"📊 GPU Memory: {gpu_memory:.2f} GB")
                except:
                    pass

        except Exception as e:
            log.error(f"❌ Failed to load VoiceFixer: {e}")
            log.error("Full traceback:", exc_info=True)
            self.model_loaded = False
            raise Exception(f"Model loading failed: {str(e)}")

    def detect_actual_sample_rate(self, audio, stated_sr):
        """
        Analyze audio spectrum to detect actual bandwidth.
        Returns detected sample rate if aliasing suspected.
        """
        log.info(f"🔍 Analyzing spectral content (stated: {stated_sr}Hz)...")
        
        try:
            # FFT analysis
            fft = np.fft.rfft(audio)
            freqs = np.fft.rfftfreq(len(audio), 1/stated_sr)
            magnitude = np.abs(fft)
            
            # Find max significant frequency
            threshold = np.max(magnitude) * 0.01
            significant_freqs = freqs[magnitude > threshold]
            
            if len(significant_freqs) > 0:
                max_freq = np.max(significant_freqs)
                detected_sr = int(max_freq * 2.2)  # Nyquist + margin
                
                # Check for aliasing
                if detected_sr < stated_sr * 0.5:
                    log.warning(f"⚠️ Aliasing detected!")
                    log.info(f"   Stated SR: {stated_sr}Hz")
                    log.info(f"   Max frequency: {max_freq:.0f}Hz")
                    log.info(f"   Detected SR: ~{detected_sr}Hz")
                    return detected_sr
            
            log.info(f"✅ No aliasing - genuine {stated_sr}Hz audio")
            return stated_sr
            
        except Exception as e:
            log.warning(f"⚠️ Spectrum analysis failed: {e}")
            return stated_sr

    async def process_audio(
        self, 
        file: UploadFile,
        target_sr: int = 44100,
        mode: int = 0
    ):
        """
        Process audio using VoiceFixer with automatic aliasing detection.
        
        Args:
            file: Uploaded audio file
            target_sr: Target sample rate (default 44100Hz)
            mode: 0=denoise only, 1=denoise+44.1kHz, 2=denoise+48kHz
        """
        # ✅ Lazy load model
        if not self.model_loaded:
            log.info("🔄 Loading VoiceFixer model...")
            self.load_model()
        
        if self.model is None:
            raise Exception("VoiceFixer model failed to load")

        try:
            # 1. Save uploaded file
            log.info(f"📥 Received: {file.filename}")
            
            content = await file.read()
            with open(TEMP_INPUT_PATH, "wb") as f:
                f.write(content)
            log.info(f"💾 Saved {len(content)} bytes to {TEMP_INPUT_PATH}")

            # 2. Load and analyze audio
            log.info("📊 Loading audio with librosa...")
            y_audio, sr_stated = librosa.load(str(TEMP_INPUT_PATH), sr=None, mono=True)
            duration = len(y_audio) / sr_stated
            log.info(f"✅ Loaded: {sr_stated}Hz, {duration:.2f}s, {len(y_audio)} samples")

            # 3. ✅ DETECT ALIASING
            sr_actual = self.detect_actual_sample_rate(y_audio, sr_stated)
            
            # 4. ✅ Handle aliased audio
            if sr_actual < sr_stated * 0.8:
                log.info(f"🔧 Aliased audio detected - preprocessing:")
                log.info(f"   Step 1: Downsample {sr_stated}Hz → {sr_actual}Hz")
                log.info(f"   Step 2: VoiceFixer restoration → {target_sr}Hz")
                
                # Downsample to actual bandwidth
                y_resampled = librosa.resample(y_audio, orig_sr=sr_stated, target_sr=sr_actual)
                sf.write(str(TEMP_RESAMPLED_PATH), y_resampled, sr_actual)
                log.info(f"💾 Saved resampled audio: {sr_actual}Hz")
                
                input_path = str(TEMP_RESAMPLED_PATH)
                input_sr = sr_actual
            else:
                # Not aliased - use original
                input_path = str(TEMP_INPUT_PATH)
                input_sr = sr_stated
            
            # # 5. Check if enhancement needed
            # if input_sr >= target_sr and sr_actual >= sr_stated * 0.9:
            #     log.warning(f"⚠️ Input already high quality ({input_sr}Hz)")
            #     log.info("📋 Returning original audio")
                
            #     return FileResponse(
            #         str(TEMP_INPUT_PATH),
            #         media_type="audio/wav",
            #         filename=f"original_{file.filename}",
            #         headers={
            #             "X-Sample-Rate": str(sr_stated),
            #             "X-Processing": "Skipped (high quality)",
            #             "X-Device": self.device.upper()
            #         }
                # )

            # 6. ✅ RUN VOICEFIXER RESTORATION
            log.info(f"🚀 Running VoiceFixer on {self.device.upper()}...")
            log.info(f"   Input: {input_sr}Hz")
            log.info(f"   Target: {target_sr}Hz")
            log.info(f"   Mode: {mode} (0=denoise, 1=+44.1k, 2=+48k)")
            log.info(f"   Processing time: ~10-30 seconds")
            
            # VoiceFixer mode mapping
            voicefixer_mode = 1 if target_sr <= 44100 else 2
            
            # ✅ Call VoiceFixer.restore()
            self.model.restore(
                input=input_path,
                output=str(TEMP_OUTPUT_PATH),
                cuda=self.device == 'cuda',
                mode=voicefixer_mode
            )
            
            log.info(f"✅ VoiceFixer restoration complete!")

            # 7. Verify output
            if not TEMP_OUTPUT_PATH.exists():
                raise Exception("VoiceFixer failed to create output file")
            
            file_size = TEMP_OUTPUT_PATH.stat().st_size
            log.info(f"💾 Output saved: {file_size} bytes")
            
            # 8. Verify output sample rate
            y_output, sr_output = librosa.load(str(TEMP_OUTPUT_PATH), sr=None)
            log.info(f"📊 Output verified: {sr_output}Hz, {len(y_output)/sr_output:.2f}s")

            # 9. Return enhanced audio
            return FileResponse(
                str(TEMP_OUTPUT_PATH),
                media_type="audio/wav",
                filename=f"enhanced_{file.filename}",
                headers={
                    "X-Original-SR": str(sr_stated),
                    "X-Detected-SR": str(sr_actual),
                    "X-Output-SR": str(sr_output),
                    "X-Method": "VoiceFixer",
                    "X-Device": self.device.upper(),
                    "X-Mode": str(voicefixer_mode),
                    "X-Repository": "https://github.com/haoheliu/voicefixer"
                }
            )

        except Exception as e:
            log.error(f"❌ Processing error: {e}")
            log.error("Full traceback:", exc_info=True)
            
            # Cleanup temp files
            for path in [TEMP_INPUT_PATH, TEMP_OUTPUT_PATH, TEMP_RESAMPLED_PATH]:
                try:
                    if path.exists():
                        os.remove(path)
                        log.info(f"🗑️ Cleaned up: {path}")
                except Exception as cleanup_err:
                    log.warning(f"⚠️ Cleanup failed for {path}: {cleanup_err}")
            
            raise Exception(f"Audio processing failed: {str(e)}")

    def get_model_info(self) -> dict:
        """Get VoiceFixer model information"""
        gpu_info = {}
        
        try:
            if torch.cuda.is_available():
                gpu_info = {
                    "gpu_name": torch.cuda.get_device_name(0),
                    "gpu_memory_gb": round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 2),
                    "cuda_version": torch.version.cuda
                }
        except:
            pass
        
        return {
            "model_name": "VoiceFixer",
            "version": "0.1.2",
            "repository": "https://github.com/haoheliu/voicefixer",
            "paper": "https://arxiv.org/abs/2109.13731",
            "device": self.device,
            "loaded": self.model_loaded,
            "available": VOICEFIXER_AVAILABLE,
            "capabilities": [
                "Audio denoising",
                "Bandwidth extension (up to 48kHz)",
                "Aliasing repair",
                "Quality restoration",
                "Speech enhancement"
            ],
            "supported_modes": {
                "0": "Denoising only",
                "1": "Denoise + 44.1kHz upsampling",
                "2": "Denoise + 48kHz upsampling"
            },
            "typical_processing_time": "10-30 seconds (CPU)",
            "model_size": "~200MB",
            "torch_version": torch.__version__,
            "gpu_info": gpu_info if gpu_info else "No GPU available"
        }

# ✅ Create singleton instance
voicefixer_service = VoiceFixerService()

# ✅ Keep backward compatibility alias (so old imports still work)
audiosr_service = voicefixer_service






















# # app/audio_sr/service.py
# import librosa
# import soundfile as sf
# import torch
# import logging
# import os
# import numpy as np
# from pathlib import Path
# from fastapi import UploadFile
# from fastapi.responses import FileResponse

# # ✅ Import from official AudioSR
# try:
#     from audiosr import build_model, super_resolution
#     AUDIOSR_AVAILABLE = True
# except ImportError as e:
#     logging.error(f"❌ AudioSR import failed: {e}")
#     AUDIOSR_AVAILABLE = False

# # Setup logging
# log = logging.getLogger(__name__)

# # --- Define paths for temporary files ---
# TEMP_DIR = Path("temp_audio")
# TEMP_DIR.mkdir(exist_ok=True)
# TEMP_INPUT_PATH = TEMP_DIR / "temp_input.wav"
# TEMP_OUTPUT_PATH = TEMP_DIR / "temp_output.wav"
# TEMP_RESAMPLED_PATH = TEMP_DIR / "temp_resampled.wav"

# class AudioSRService:
#     def __init__(self):
#         """Initializes the AudioSR service with official GitHub model."""
#         if not AUDIOSR_AVAILABLE:
#             log.error("❌ AudioSR is not available. Please install: pip install git+https://github.com/haoheliu/versatile_audio_super_resolution.git")
#             self.model = None
#             self.model_loaded = False
#             self.device = 'cpu'
#             return
        
#         self.model = None
#         self.model_loaded = False
        
#         # ✅ Auto-detect device
#         cuda_available = torch.cuda.is_available()
        
#         if cuda_available:
#             self.device = 'cuda'
#             try:
#                 gpu_name = torch.cuda.get_device_name(0)
#                 log.info(f"🎮 GPU detected: {gpu_name}")
#                 log.info(f"🚀 AudioSR will use CUDA acceleration!")
#             except Exception as e:
#                 log.warning(f"⚠️ CUDA available but error getting GPU info: {e}")
#                 self.device = 'cpu'
#         else:
#             self.device = 'cpu'
#             log.info(f"⚠️ No GPU detected - using CPU")
#             log.info(f"💡 To enable GPU: Update NVIDIA driver from http://www.nvidia.com/Download/index.aspx")
        
#         log.info(f"✅ AudioSRService initialized. Using device: {self.device}")

#     def load_model(self):
#         """
#         Loads the official AudioSR model from GitHub repository.
#         Model is cached after first download (~2GB).
#         """
#         if self.model_loaded:
#             log.info("AudioSR model is already loaded.")
#             return

#         if not AUDIOSR_AVAILABLE:
#             raise Exception("AudioSR is not installed. Please run: pip install git+https://github.com/haoheliu/versatile_audio_super_resolution.git")

#         try:
#             log.info("📦 Loading AudioSR model from official repository...")
#             if self.device == 'cuda':
#                 log.info("⚡ Loading model on GPU...")
#             else:
#                 log.info("⏳ Loading model on CPU (first time: 5-10 minutes)")
#                 log.info("💡 Model will be cached in ~/.cache/torch/hub/")
            
#             # ✅ Build model using official AudioSR
#             self.model = build_model(
#                 model_name="basic",
#                 device=self.device
#             )
            
#             self.model_loaded = True
#             log.info("✅ AudioSR model loaded successfully!")
#             log.info("📚 Model source: https://github.com/haoheliu/versatile_audio_super_resolution")
            
#             if self.device == 'cuda':
#                 try:
#                     gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
#                     log.info(f"📊 GPU Memory: {gpu_memory:.2f} GB")
#                 except:
#                     pass

#         except Exception as e:
#             log.error(f"❌ Failed to load AudioSR model: {e}")
#             log.error("Full error:", exc_info=True)
#             self.model_loaded = False
#             raise Exception(f"Model loading failed: {str(e)}")

#     def detect_actual_sample_rate(self, audio, stated_sr):
#         """
#         Analyze audio spectrum to detect actual bandwidth.
#         Returns the detected sample rate if aliasing is suspected.
#         """
#         log.info(f"🔍 Analyzing spectral content (stated SR: {stated_sr}Hz)...")
        
#         try:
#             fft = np.fft.rfft(audio)
#             freqs = np.fft.rfftfreq(len(audio), 1/stated_sr)
#             magnitude = np.abs(fft)
            
#             threshold = np.max(magnitude) * 0.01
#             significant_freqs = freqs[magnitude > threshold]
            
#             if len(significant_freqs) > 0:
#                 max_freq = np.max(significant_freqs)
#                 detected_sr = int(max_freq * 2.2)
                
#                 if detected_sr < stated_sr * 0.5:
#                     log.warning(f"⚠️ Aliasing detected!")
#                     log.info(f"   Stated SR: {stated_sr}Hz")
#                     log.info(f"   Max frequency content: {max_freq:.0f}Hz")
#                     log.info(f"   Detected actual SR: ~{detected_sr}Hz")
#                     return detected_sr
            
#             log.info(f"✅ No aliasing detected - audio appears genuine at {stated_sr}Hz")
#             return stated_sr
            
#         except Exception as e:
#             log.warning(f"⚠️ Spectrum analysis failed: {e}")
#             return stated_sr

#     async def process_audio(
#         self, 
#         file: UploadFile,
#         target_sr: int = 48000,
#         ddim_steps: int = 50,
#         guidance_scale: float = 3.5
#     ):
#         """
#         Process audio using official AudioSR with automatic aliasing detection.
#         """
#         if not self.model_loaded:
#             log.info("🔄 Model not loaded. Loading now...")
#             self.load_model()
        
#         if self.model is None:
#             raise Exception("AudioSR model failed to load. Check logs.")

#         try:
#             # 1. Save uploaded file
#             log.info(f"📥 Received: {file.filename}")
#             log.info(f"📥 Saving to: {TEMP_INPUT_PATH}")
            
#             content = await file.read()
#             with open(TEMP_INPUT_PATH, "wb") as f:
#                 f.write(content)
#             log.info(f"💾 Saved {len(content)} bytes")

#             # 2. Load audio
#             log.info("📊 Loading audio...")
#             y_audio, sr_stated = librosa.load(str(TEMP_INPUT_PATH), sr=None, mono=True)
#             duration = len(y_audio) / sr_stated
#             log.info(f"✅ Loaded: {sr_stated}Hz, {duration:.2f}s, {len(y_audio)} samples")

#             # 3. Detect aliasing
#             sr_actual = self.detect_actual_sample_rate(y_audio, sr_stated)
            
#             # 4. Handle aliased audio
#             if sr_actual < sr_stated * 0.8:
#                 log.info(f"🔧 Processing aliased audio:")
#                 log.info(f"   Step 1: Resample {sr_stated}Hz → {sr_actual}Hz")
#                 log.info(f"   Step 2: AI enhance {sr_actual}Hz → {target_sr}Hz")
                
#                 y_resampled = librosa.resample(y_audio, orig_sr=sr_stated, target_sr=sr_actual)
#                 sf.write(str(TEMP_RESAMPLED_PATH), y_resampled, sr_actual)
                
#                 input_audio = y_resampled
#                 input_sr = sr_actual
#             else:
#                 input_audio = y_audio
#                 input_sr = sr_stated
            
#             # 5. Check if enhancement needed
#             if input_sr >= target_sr:
#                 log.warning(f"⚠️ Input SR ({input_sr}Hz) >= Target SR ({target_sr}Hz)")
#                 log.info("📋 Returning original audio")
                
#                 return FileResponse(
#                     str(TEMP_INPUT_PATH),
#                     media_type="audio/wav",
#                     filename=f"original_{file.filename}",
#                     headers={
#                         "X-Sample-Rate": str(sr_stated),
#                         "X-Processing": "Skipped",
#                     }
#                 )

#             # 6. Run AudioSR
#             log.info(f"🚀 Running AudioSR on {self.device.upper()}...")
#             log.info(f"   Input: {input_sr}Hz → Target: {target_sr}Hz")
#             log.info(f"   Factor: {target_sr/input_sr:.1f}x")
#             log.info(f"   Steps: {ddim_steps}, Guidance: {guidance_scale}")
            
#             enhanced_audio = super_resolution(
#                 self.model,
#                 input_audio,
#                 input_sr,
#                 target_sr,
#                 guidance_scale=guidance_scale,
#                 ddim_steps=ddim_steps,
#                 seed=42
#             )
            
#             log.info(f"✅ Enhancement complete!")

#             # 7. Save
#             sf.write(str(TEMP_OUTPUT_PATH), enhanced_audio, target_sr)
            
#             if not TEMP_OUTPUT_PATH.exists():
#                 raise Exception("Failed to save enhanced audio")
            
#             log.info(f"✅ Saved {TEMP_OUTPUT_PATH.stat().st_size} bytes")

#             # 8. Return
#             return FileResponse(
#                 str(TEMP_OUTPUT_PATH),
#                 media_type="audio/wav",
#                 filename=f"enhanced_{file.filename}",
#                 headers={
#                     "X-Original-SR": str(sr_stated),
#                     "X-Detected-SR": str(sr_actual),
#                     "X-Output-SR": str(target_sr),
#                     "X-Method": "AudioSR (Official)",
#                     "X-Device": self.device.upper(),
#                 }
#             )

#         except Exception as e:
#             log.error(f"❌ Processing error: {e}")
#             log.error("Traceback:", exc_info=True)
            
#             for path in [TEMP_INPUT_PATH, TEMP_OUTPUT_PATH, TEMP_RESAMPLED_PATH]:
#                 try:
#                     if path.exists():
#                         os.remove(path)
#                 except:
#                     pass
            
#             raise Exception(f"Audio processing failed: {str(e)}")

#     def get_model_info(self) -> dict:
#         """Get model information"""
#         gpu_info = {}
        
#         try:
#             if torch.cuda.is_available():
#                 gpu_info = {
#                     "gpu_name": torch.cuda.get_device_name(0),
#                     "gpu_memory_gb": round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 2),
#                     "cuda_version": torch.version.cuda
#                 }
#         except:
#             pass
        
#         return {
#             "model_name": "AudioSR",
#             "repository": "https://github.com/haoheliu/versatile_audio_super_resolution",
#             "device": self.device,
#             "loaded": self.model_loaded,
#             "available": AUDIOSR_AVAILABLE,
#             "torch_version": torch.__version__,
#             "gpu_info": gpu_info if gpu_info else "No GPU available"
#         }

# # ✅ Create singleton
# audiosr_service = AudioSRService()





















# # app/audio_sr/service.py
# import librosa
# import soundfile as sf
# import torch
# import logging
# import os
# import numpy as np
# from pathlib import Path
# from fastapi import UploadFile
# from fastapi.responses import FileResponse

# # ✅ Import from official AudioSR
# try:
#     from audiosr import build_model, super_resolution
#     AUDIOSR_AVAILABLE = True
# except ImportError as e:
#     logging.error(f"❌ AudioSR import failed: {e}")
#     AUDIOSR_AVAILABLE = False

# # Setup logging
# log = logging.getLogger(__name__)

# # --- Define paths for temporary files ---
# TEMP_DIR = Path("temp_audio")
# TEMP_DIR.mkdir(exist_ok=True)
# TEMP_INPUT_PATH = TEMP_DIR / "temp_input.wav"
# TEMP_OUTPUT_PATH = TEMP_DIR / "temp_output.wav"
# TEMP_RESAMPLED_PATH = TEMP_DIR / "temp_resampled.wav"

# class AudioSRService:
#     def __init__(self):
#         """Initializes the AudioSR service with official GitHub model."""
#         if not AUDIOSR_AVAILABLE:
#             log.error("❌ AudioSR is not available. Please install: pip install git+https://github.com/haoheliu/versatile_audio_super_resolution.git")
#             self.model = None
#             self.model_loaded = False
#             self.device = 'cpu'
#             return
        
#         self.model = None
#         self.model_loaded = False
        
#         # ✅ Auto-detect device
#         cuda_available = torch.cuda.is_available()
        
#         if cuda_available:
#             self.device = 'cuda'
#             try:
#                 gpu_name = torch.cuda.get_device_name(0)
#                 log.info(f"🎮 GPU detected: {gpu_name}")
#                 log.info(f"🚀 AudioSR will use CUDA acceleration!")
#             except Exception as e:
#                 log.warning(f"⚠️ CUDA available but error getting GPU info: {e}")
#                 self.device = 'cpu'
#         else:
#             self.device = 'cpu'
#             log.info(f"⚠️ No GPU detected - using CPU")
#             log.info(f"💡 To enable GPU: Update NVIDIA driver from http://www.nvidia.com/Download/index.aspx")
        
#         log.info(f"✅ AudioSRService initialized. Using device: {self.device}")

#     def load_model(self):
#         """
#         Loads the official AudioSR model from GitHub repository.
#         Model is cached after first download (~2GB).
#         """
#         if self.model_loaded:
#             log.info("AudioSR model is already loaded.")
#             return

#         if not AUDIOSR_AVAILABLE:
#             raise Exception("AudioSR is not installed. Please run: pip install git+https://github.com/haoheliu/versatile_audio_super_resolution.git")

#         try:
#             log.info("📦 Loading AudioSR model from official repository...")
#             if self.device == 'cuda':
#                 log.info("⚡ Loading model on GPU...")
#             else:
#                 log.info("⏳ Loading model on CPU (first time: 5-10 minutes)")
#                 log.info("💡 Model will be cached in ~/.cache/torch/hub/")
            
#             # ✅ Build model using official AudioSR
#             self.model = build_model(
#                 model_name="basic",
#                 device=self.device
#             )
            
#             self.model_loaded = True
#             log.info("✅ AudioSR model loaded successfully!")
#             log.info("📚 Model source: https://github.com/haoheliu/versatile_audio_super_resolution")
            
#             if self.device == 'cuda':
#                 try:
#                     gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
#                     log.info(f"📊 GPU Memory: {gpu_memory:.2f} GB")
#                 except:
#                     pass

#         except Exception as e:
#             log.error(f"❌ Failed to load AudioSR model: {e}")
#             log.error("Full error:", exc_info=True)
#             self.model_loaded = False
#             raise Exception(f"Model loading failed: {str(e)}")

#     def detect_actual_sample_rate(self, audio, stated_sr):
#         """
#         Analyze audio spectrum to detect actual bandwidth.
#         Returns the detected sample rate if aliasing is suspected.
#         """
#         log.info(f"🔍 Analyzing spectral content (stated SR: {stated_sr}Hz)...")
        
#         try:
#             fft = np.fft.rfft(audio)
#             freqs = np.fft.rfftfreq(len(audio), 1/stated_sr)
#             magnitude = np.abs(fft)
            
#             threshold = np.max(magnitude) * 0.01
#             significant_freqs = freqs[magnitude > threshold]
            
#             if len(significant_freqs) > 0:
#                 max_freq = np.max(significant_freqs)
#                 detected_sr = int(max_freq * 2.2)
                
#                 if detected_sr < stated_sr * 0.5:
#                     log.warning(f"⚠️ Aliasing detected!")
#                     log.info(f"   Stated SR: {stated_sr}Hz")
#                     log.info(f"   Max frequency content: {max_freq:.0f}Hz")
#                     log.info(f"   Detected actual SR: ~{detected_sr}Hz")
#                     return detected_sr
            
#             log.info(f"✅ No aliasing detected - audio appears genuine at {stated_sr}Hz")
#             return stated_sr
            
#         except Exception as e:
#             log.warning(f"⚠️ Spectrum analysis failed: {e}")
#             return stated_sr

#     async def process_audio(
#         self, 
#         file: UploadFile,
#         target_sr: int = 48000,
#         ddim_steps: int = 50,
#         guidance_scale: float = 3.5
#     ):
#         """
#         Process audio using official AudioSR with automatic aliasing detection.
#         """
#         if not self.model_loaded:
#             log.info("🔄 Model not loaded. Loading now...")
#             self.load_model()
        
#         if self.model is None:
#             raise Exception("AudioSR model failed to load. Check logs.")

#         try:
#             # 1. Save uploaded file
#             log.info(f"📥 Received: {file.filename}")
#             log.info(f"📥 Saving to: {TEMP_INPUT_PATH}")
            
#             content = await file.read()
#             with open(TEMP_INPUT_PATH, "wb") as f:
#                 f.write(content)
#             log.info(f"💾 Saved {len(content)} bytes")

#             # 2. Load audio
#             log.info("📊 Loading audio...")
#             y_audio, sr_stated = librosa.load(str(TEMP_INPUT_PATH), sr=None, mono=True)
#             duration = len(y_audio) / sr_stated
#             log.info(f"✅ Loaded: {sr_stated}Hz, {duration:.2f}s, {len(y_audio)} samples")

#             # 3. Detect aliasing
#             sr_actual = self.detect_actual_sample_rate(y_audio, sr_stated)
            
#             # 4. Handle aliased audio
#             if sr_actual < sr_stated * 0.8:
#                 log.info(f"🔧 Processing aliased audio:")
#                 log.info(f"   Step 1: Resample {sr_stated}Hz → {sr_actual}Hz")
#                 log.info(f"   Step 2: AI enhance {sr_actual}Hz → {target_sr}Hz")
                
#                 y_resampled = librosa.resample(y_audio, orig_sr=sr_stated, target_sr=sr_actual)
#                 sf.write(str(TEMP_RESAMPLED_PATH), y_resampled, sr_actual)
                
#                 input_audio = y_resampled
#                 input_sr = sr_actual
#             else:
#                 input_audio = y_audio
#                 input_sr = sr_stated
            
#             # 5. Check if enhancement needed
#             if input_sr >= target_sr:
#                 log.warning(f"⚠️ Input SR ({input_sr}Hz) >= Target SR ({target_sr}Hz)")
#                 log.info("📋 Returning original audio")
                
#                 return FileResponse(
#                     str(TEMP_INPUT_PATH),
#                     media_type="audio/wav",
#                     filename=f"original_{file.filename}",
#                     headers={
#                         "X-Sample-Rate": str(sr_stated),
#                         "X-Processing": "Skipped",
#                     }
#                 )

#             # 6. Run AudioSR
#             log.info(f"🚀 Running AudioSR on {self.device.upper()}...")
#             log.info(f"   Input: {input_sr}Hz → Target: {target_sr}Hz")
#             log.info(f"   Factor: {target_sr/input_sr:.1f}x")
#             log.info(f"   Steps: {ddim_steps}, Guidance: {guidance_scale}")
            
#             enhanced_audio = super_resolution(
#                 self.model,
#                 input_audio,
#                 input_sr,
#                 target_sr,
#                 guidance_scale=guidance_scale,
#                 ddim_steps=ddim_steps,
#                 seed=42
#             )
            
#             log.info(f"✅ Enhancement complete!")

#             # 7. Save
#             sf.write(str(TEMP_OUTPUT_PATH), enhanced_audio, target_sr)
            
#             if not TEMP_OUTPUT_PATH.exists():
#                 raise Exception("Failed to save enhanced audio")
            
#             log.info(f"✅ Saved {TEMP_OUTPUT_PATH.stat().st_size} bytes")

#             # 8. Return
#             return FileResponse(
#                 str(TEMP_OUTPUT_PATH),
#                 media_type="audio/wav",
#                 filename=f"enhanced_{file.filename}",
#                 headers={
#                     "X-Original-SR": str(sr_stated),
#                     "X-Detected-SR": str(sr_actual),
#                     "X-Output-SR": str(target_sr),
#                     "X-Method": "AudioSR (Official)",
#                     "X-Device": self.device.upper(),
#                 }
#             )

#         except Exception as e:
#             log.error(f"❌ Processing error: {e}")
#             log.error("Traceback:", exc_info=True)
            
#             for path in [TEMP_INPUT_PATH, TEMP_OUTPUT_PATH, TEMP_RESAMPLED_PATH]:
#                 try:
#                     if path.exists():
#                         os.remove(path)
#                 except:
#                     pass
            
#             raise Exception(f"Audio processing failed: {str(e)}")

#     def get_model_info(self) -> dict:
#         """Get model information"""
#         gpu_info = {}
        
#         try:
#             if torch.cuda.is_available():
#                 gpu_info = {
#                     "gpu_name": torch.cuda.get_device_name(0),
#                     "gpu_memory_gb": round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 2),
#                     "cuda_version": torch.version.cuda
#                 }
#         except:
#             pass
        
#         return {
#             "model_name": "AudioSR",
#             "repository": "https://github.com/haoheliu/versatile_audio_super_resolution",
#             "device": self.device,
#             "loaded": self.model_loaded,
#             "available": AUDIOSR_AVAILABLE,
#             "torch_version": torch.__version__,
#             "gpu_info": gpu_info if gpu_info else "No GPU available"
#         }

# # ✅ Create singleton
# audiosr_service = AudioSRService()