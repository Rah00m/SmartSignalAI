import numpy as np
from scipy.io import wavfile
from scipy import signal as sig
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import io
import base64
from typing import Dict


class CarSoundAnalyzer:
    def __init__(self):
        self.speed_of_sound = 343
        self.search_range_hz = 50
        
    def analyze_audio_file(self, file_path: str, f_source: float = 100) -> Dict:
        """
        Analyze uploaded audio file
        """
        try:
            print(f"Starting analysis of: {file_path}")
            
            # Load the audio file
            fs_loaded, signal_loaded = wavfile.read(file_path)
            
            if signal_loaded.ndim > 1:
                signal_loaded = signal_loaded[:, 0]
                
            print(f"Audio loaded: {len(signal_loaded)} samples at {fs_loaded} Hz")
            
            # Generate the three plots
            waveform_plot = self._generate_waveform_plot(signal_loaded, fs_loaded)
            spectrogram_plot = self._generate_spectrogram_plot(signal_loaded, fs_loaded)
            velocity_plot = self._generate_velocity_plot(signal_loaded, fs_loaded, f_source)
            
            print("All plots generated successfully")
            
            return {
                'success': True,
                'waveform_plot': waveform_plot,
                'spectrogram_plot': spectrogram_plot,
                'velocity_plot': velocity_plot
            }
            
        except Exception as e:
            print(f"ERROR in analyze_audio_file: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_waveform_plot(self, signal_loaded: np.ndarray, fs_loaded: int) -> str:
        """Generate waveform plot"""
        try:
            plt.figure(figsize=(12, 4))
            time_axis = np.arange(len(signal_loaded)) / fs_loaded
            plt.plot(time_axis, signal_loaded, color='steelblue')
            plt.xlabel('Time [sec]')
            plt.ylabel('Amplitude')
            plt.title('Waveform of the Loaded Audio Signal')
            plt.grid(True)
            plt.tight_layout()
            
            return self._plot_to_base64()
            
        except Exception as e:
            print(f"Error generating waveform plot: {e}")
            raise e
    
    def _generate_spectrogram_plot(self, signal_loaded: np.ndarray, fs_loaded: int) -> str:
        """Generate spectrogram"""
        try:
            # Compute Spectrogram
            f_spec, t_spec, Sxx = sig.spectrogram(signal_loaded, fs_loaded, nperseg=4096, noverlap=2048)
            
            # Plot Spectrogram
            plt.figure(figsize=(12, 7))
            plt.pcolormesh(t_spec, f_spec, 10 * np.log10(Sxx + 1e-9), shading='gouraud', cmap='viridis')
            plt.ylabel('Frequency [Hz]')
            plt.xlabel('Time [sec]')
            plt.title('Spectrogram of the Saturated Tone')
            plt.ylim(0, 1000)
            plt.colorbar(label='Intensity [dB]')
            plt.tight_layout()
            
            return self._plot_to_base64()
            
        except Exception as e:
            print(f"Error generating spectrogram: {e}")
            raise e
    
    def _generate_velocity_plot(self, signal_loaded: np.ndarray, fs_loaded: int, f_source: float) -> str:
        """Generate velocity plot"""
        try:
            # Compute Spectrogram
            f_spec, t_spec, Sxx = sig.spectrogram(signal_loaded, fs_loaded, nperseg=4096, noverlap=2048)
            
            # Extract Peak Frequency within a search window
            peak_frequencies = []
            max_power = np.max(Sxx)
            threshold = max_power * 0.005
            
            min_freq = f_source - self.search_range_hz
            max_freq = f_source + self.search_range_hz
            
            for i in range(Sxx.shape[1]):
                time_slice = Sxx[:, i]
                
                if np.max(time_slice) > threshold:
                    freq_indices_in_range = np.where((f_spec >= min_freq) & (f_spec <= max_freq))[0]
                    
                    if len(freq_indices_in_range) > 0:
                        slice_in_range = time_slice[freq_indices_in_range]
                        peak_index_in_slice = np.argmax(slice_in_range)
                        peak_index = freq_indices_in_range[peak_index_in_slice]
                        peak_frequencies.append(f_spec[peak_index])
                    else:
                        peak_frequencies.append(np.nan)
                else:
                    peak_frequencies.append(np.nan)
            
            peak_frequencies = np.array(peak_frequencies)
            
            # Calculate and Plot Estimated Velocity
            with np.errstate(divide='ignore', invalid='ignore'):
                estimated_velocity = self.speed_of_sound * (1 - f_source / peak_frequencies)
            
            plt.figure(figsize=(12, 7))
            plt.plot(t_spec, estimated_velocity, marker='o', linestyle='-')
            plt.xlabel('Time [sec]')
            plt.ylabel('Estimated Velocity [m/s]')
            plt.title('Estimated Car Velocity from Audio Signal (Corrected)')
            plt.grid(True)
            plt.tight_layout()
            
            return self._plot_to_base64()
            
        except Exception as e:
            print(f"Error generating velocity plot: {e}")
            raise e
    
    def _plot_to_base64(self) -> str:
        """Convert current matplotlib plot to base64 string"""
        try:
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight', facecolor='white')
            buffer.seek(0)
            plot_data = buffer.getvalue()
            buffer.close()
            plt.close()  # Important: close the figure to free memory
            
            return base64.b64encode(plot_data).decode()
            
        except Exception as e:
            print(f"Error converting plot to base64: {e}")
            raise e