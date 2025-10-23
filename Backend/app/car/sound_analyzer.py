import numpy as np
from scipy.io import wavfile
from scipy import signal as sig
from scipy.optimize import curve_fit
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import io
import base64
from typing import Dict, Tuple


class CarSoundAnalyzer:
    """
    Analyzes car audio files generated with Doppler effect to extract velocity
    Matches the exact physics from CarSoundGenerator
    """
    
    def __init__(self):
        self.speed_of_sound = 343  # m/s
        self.closest_approach = 10  # meters (must match generator)
        self.duration = 12.0  # seconds (must match generator)
        
    def analyze_audio_file(self, file_path: str, f_source: float = None) -> Dict:
        """
        Complete analysis of car audio file
        
        Args:
            file_path: Path to audio file
            f_source: Source frequency in Hz (auto-detected if None)
            
        Returns:
            Dictionary with plots and statistics
        """
        try:
            print(f"\n{'='*70}")
            print(f"COMPLETE CAR AUDIO ANALYSIS")
            print(f"{'='*70}")
            print(f"File: {file_path}")
            
            # Load audio
            fs_loaded, signal_loaded = wavfile.read(file_path)
            
            if signal_loaded.ndim > 1:
                signal_loaded = signal_loaded[:, 0]
            
            print(f"Audio: {len(signal_loaded)} samples at {fs_loaded} Hz")
            print(f"Duration: {len(signal_loaded)/fs_loaded:.2f}s")
            
            # Auto-detect source frequency if not provided
            if f_source is None:
                f_source = self._detect_source_frequency(signal_loaded, fs_loaded)
                print(f"Auto-detected source frequency: {f_source:.1f} Hz")
            else:
                print(f"Using provided source frequency: {f_source:.1f} Hz")
            
            # Generate all plots and statistics
            waveform_plot, waveform_stats = self._generate_waveform_plot(
                signal_loaded, fs_loaded
            )
            
            spectrogram_plot, spectrogram_stats = self._generate_spectrogram_plot(
                signal_loaded, fs_loaded
            )
            
            velocity_plot, velocity_stats = self._generate_velocity_plot(
                signal_loaded, fs_loaded, f_source
            )
            
            print(f"{'='*70}")
            print(f"ANALYSIS COMPLETE")
            print(f"{'='*70}\n")
            
            return {
                'success': True,
                'waveform_plot': waveform_plot,
                'spectrogram_plot': spectrogram_plot,
                'velocity_plot': velocity_plot,
                'waveform_stats': self._convert_numpy_to_python(waveform_stats),
                'spectrogram_stats': self._convert_numpy_to_python(spectrogram_stats),
                'velocity_stats': self._convert_numpy_to_python(velocity_stats)
            }
            
        except Exception as e:
            print(f"ERROR: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return {
                'success': False,
                'error': str(e)
            }
    
    def _detect_source_frequency(self, signal: np.ndarray, fs: int) -> float:
        """Auto-detect source frequency from audio"""
        try:
            # Use overall spectrum to find dominant frequency
            f_spec, Pxx = sig.welch(signal, fs, nperseg=4096)
            
            # Look for peak in reasonable range (50-500 Hz for car sounds)
            freq_mask = (f_spec >= 50) & (f_spec <= 500)
            masked_freqs = f_spec[freq_mask]
            masked_power = Pxx[freq_mask]
            
            peak_idx = np.argmax(masked_power)
            detected_freq = masked_freqs[peak_idx]
            
            print(f"Frequency detection: peak at {detected_freq:.1f} Hz")
            return float(detected_freq)
            
        except Exception as e:
            print(f"Warning: Could not detect frequency, using 120 Hz default: {e}")
            return 120.0
    
    def _generate_waveform_plot(self, signal: np.ndarray, fs: int) -> Tuple[str, Dict]:
        """Generate waveform visualization"""
        try:
            plt.figure(figsize=(12, 4))
            time_axis = np.arange(len(signal)) / fs
            plt.plot(time_axis, signal, color='#3b82f6', linewidth=0.5, alpha=0.8)
            plt.xlabel('Time [sec]', fontsize=11, fontweight='bold')
            plt.ylabel('Amplitude', fontsize=11, fontweight='bold')
            plt.title('Waveform of the Loaded Audio Signal', fontsize=13, fontweight='bold')
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            
            stats = {
                'duration_seconds': round(time_axis[-1], 2),
                'max_amplitude': int(np.max(np.abs(signal))),
                'avg_amplitude': int(np.mean(np.abs(signal))),
                'dynamic_range': f"{int(np.min(signal))} to {int(np.max(signal))}"
            }
            
            return self._plot_to_base64(), stats
            
        except Exception as e:
            print(f"Error in waveform plot: {e}")
            raise
    
    def _generate_spectrogram_plot(self, signal: np.ndarray, fs: int) -> Tuple[str, Dict]:
        """Generate spectrogram visualization"""
        try:
            f_spec, t_spec, Sxx = sig.spectrogram(
                signal, fs, nperseg=4096, noverlap=3584
            )
            
            plt.figure(figsize=(12, 7))
            plt.pcolormesh(t_spec, f_spec, 10 * np.log10(Sxx + 1e-10), 
                          shading='gouraud', cmap='viridis')
            plt.ylabel('Frequency [Hz]', fontsize=11, fontweight='bold')
            plt.xlabel('Time [sec]', fontsize=11, fontweight='bold')
            plt.title('Spectrogram of the Saturated Tone', fontsize=13, fontweight='bold')
            plt.ylim(0, 1000)
            plt.colorbar(label='Intensity [dB]')
            plt.tight_layout()
            
            # Calculate statistics
            dominant_freqs = []
            for i in range(Sxx.shape[1]):
                if np.max(Sxx[:, i]) > 0:
                    peak_idx = np.argmax(Sxx[:, i])
                    dominant_freqs.append(f_spec[peak_idx])
            
            stats = {
                'dominant_frequency': round(np.mean(dominant_freqs), 1) if dominant_freqs else 0,
                'frequency_range': f"{int(np.min(dominant_freqs))}-{int(np.max(dominant_freqs))} Hz" if dominant_freqs else "N/A",
                'frequency_stability': 'stable' if np.std(dominant_freqs) < 20 else 'varying'
            }
            
            return self._plot_to_base64(), stats
            
        except Exception as e:
            print(f"Error in spectrogram plot: {e}")
            raise
    
    def _generate_velocity_plot(self, signal: np.ndarray, fs: int, f_source: float) -> Tuple[str, Dict]:
        """
        Generate velocity analysis using EXACT generator physics
        This extracts the constant car velocity from time-varying Doppler signal
        """
        try:
            print(f"\n{'='*70}")
            print(f"VELOCITY ANALYSIS")
            print(f"{'='*70}")
            print(f"Source frequency: {f_source:.1f} Hz")
            
            # Generate spectrogram
            f_spec, t_spec, Sxx = sig.spectrogram(
                signal, fs, nperseg=4096, noverlap=3584
            )
            
            # Extract time-varying frequency
            print("\nExtracting frequency vs time...")
            observed_frequencies = []
            time_points = []
            
            for i in range(Sxx.shape[1]):
                # Search range around source frequency
                freq_mask = (f_spec >= f_source * 0.6) & (f_spec <= f_source * 1.6)
                
                if np.sum(freq_mask) > 0:
                    freq_slice = f_spec[freq_mask]
                    power_slice = Sxx[freq_mask, i]
                    
                    # Find strongest peak
                    if np.max(power_slice) > np.percentile(Sxx[:, i], 90):
                        peak_idx = np.argmax(power_slice)
                        freq = freq_slice[peak_idx]
                        
                        if f_source * 0.7 <= freq <= f_source * 1.5:
                            observed_frequencies.append(freq)
                            time_points.append(t_spec[i])
            
            observed_frequencies = np.array(observed_frequencies)
            time_points = np.array(time_points)
            
            print(f"Extracted {len(observed_frequencies)} frequency points")
            print(f"Frequency range: {np.min(observed_frequencies):.1f} - {np.max(observed_frequencies):.1f} Hz")
            
            # Calculate radial velocities using Doppler formula
            # Generator uses: f_obs = f_src * c / (c - v_radial)
            # Solving for v_radial: v_radial = c * (1 - f_src/f_obs)
            c = self.speed_of_sound
            
            radial_velocities = []
            for f_obs in observed_frequencies:
                v_r = c * (1 - f_source / f_obs)
                radial_velocities.append(v_r)
            
            radial_velocities = np.array(radial_velocities)
            
            print(f"Radial velocity range: {np.min(radial_velocities):.2f} to {np.max(radial_velocities):.2f} m/s")
            
            # Now extract constant car velocity using generator's geometry
            # Generator: radial_velocity = (car_speed * car_pos_x) / distance
            # where: car_pos_x = -car_speed*6 + car_speed*t
            #        distance = sqrt(car_pos_x^2 + 10^2)
            
            # We can fit the observed radial velocities to the generator model
            car_velocity_estimate = self._fit_velocity_from_doppler(
                time_points, radial_velocities
            )
            
            print(f"\n{'*'*70}")
            print(f"ESTIMATED CAR VELOCITY: {car_velocity_estimate:.2f} m/s ({car_velocity_estimate*3.6:.1f} km/h)")
            print(f"{'*'*70}")
            
            # Generate plots
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))
            
            # Plot 1: Frequency vs Time
            ax1.plot(time_points, observed_frequencies, 'o-', color='#3b82f6', 
                    markersize=4, linewidth=2, alpha=0.7, label='Observed Frequency')
            ax1.axhline(y=f_source, color='#dc2626', linestyle='--', linewidth=2,
                       label=f'Source: {f_source:.1f} Hz', alpha=0.8)
            ax1.set_xlabel('Time [sec]', fontsize=11, fontweight='bold')
            ax1.set_ylabel('Frequency [Hz]', fontsize=11, fontweight='bold')
            ax1.set_title('Doppler Frequency Shift Over Time', fontsize=13, fontweight='bold')
            ax1.grid(True, alpha=0.3)
            ax1.legend(fontsize=10)
            
            # Plot 2: Radial Velocity vs Time
            ax2.plot(time_points, radial_velocities, 'o-', color='#10b981',
                    markersize=4, linewidth=2, alpha=0.7, label='Radial Velocity (from Doppler)')
            
            # Add theoretical curve
            t_theory = np.linspace(0, self.duration, 100)
            v_r_theory = self._theoretical_radial_velocity(t_theory, car_velocity_estimate)
            ax2.plot(t_theory, v_r_theory, '--', color='#f59e0b', linewidth=2,
                    label=f'Theory: v_car={car_velocity_estimate:.1f} m/s', alpha=0.8)
            
            ax2.axhline(y=0, color='gray', linestyle='-', linewidth=1, alpha=0.5)
            ax2.set_xlabel('Time [sec]', fontsize=11, fontweight='bold')
            ax2.set_ylabel('Radial Velocity [m/s]', fontsize=11, fontweight='bold')
            ax2.set_title(f'Radial Velocity: Car Speed = {car_velocity_estimate*3.6:.1f} km/h', 
                         fontsize=13, fontweight='bold')
            ax2.grid(True, alpha=0.3)
            ax2.legend(fontsize=10)
            
            plt.tight_layout()
            
            # Statistics
            max_freq = np.max(observed_frequencies)
            min_freq = np.min(observed_frequencies)
            
            # Determine primary motion
            if max_freq - f_source > f_source - min_freq:
                movement_trend = 'approaching'
            elif f_source - min_freq > max_freq - f_source:
                movement_trend = 'receding'
            else:
                movement_trend = 'passing by'
            
            stats = {
                'max_speed_ms': round(car_velocity_estimate, 2),
                'min_speed_ms': round(car_velocity_estimate, 2),
                'avg_speed_ms': round(car_velocity_estimate, 2),
                'max_speed_kmh': round(car_velocity_estimate * 3.6, 1),
                'min_speed_kmh': round(car_velocity_estimate * 3.6, 1),
                'avg_speed_kmh': round(car_velocity_estimate * 3.6, 1),
                'movement_trend': movement_trend,
                'max_radial_velocity_ms': round(np.max(np.abs(radial_velocities)), 2),
                'detected_frequency_hz': round(np.mean(observed_frequencies), 1),
                'source_frequency_hz': round(f_source, 1),
                'frequency_shift_hz': round(np.mean(observed_frequencies) - f_source, 1),
                'data_quality': 'high',
                'valid_data_points': len(observed_frequencies),
                'note': 'Physics-based extraction matching generator model'
            }
            
            return self._plot_to_base64(), stats
            
        except Exception as e:
            print(f"ERROR in velocity analysis: {e}")
            import traceback
            print(traceback.format_exc())
            
            # Fallback plot
            plt.figure(figsize=(12, 6))
            plt.text(0.5, 0.5, f'Velocity analysis failed\nError: {str(e)}',
                    ha='center', va='center', fontsize=12)
            plt.axis('off')
            
            return self._plot_to_base64(), {
                'avg_speed_kmh': 0.0,
                'max_speed_kmh': 0.0,
                'movement_trend': 'error',
                'data_quality': 'failed',
                'note': f'Analysis failed: {str(e)}'
            }
    
    def _fit_velocity_from_doppler(self, time_points: np.ndarray, 
                                   radial_velocities: np.ndarray) -> float:
        """
        Extract constant car velocity by fitting to generator's physics model
        
        Generator model:
            car_pos_x(t) = -car_speed * 6 + car_speed * t
            distance(t) = sqrt(car_pos_x^2 + 10^2)
            v_radial(t) = car_speed * car_pos_x / distance
        """
        try:
            def model(t, v_car):
                """Theoretical radial velocity for constant car speed"""
                car_pos_x = -v_car * (self.duration/2) + v_car * t
                distance = np.sqrt(car_pos_x**2 + self.closest_approach**2)
                v_radial = (v_car * car_pos_x) / distance
                return v_radial
            
            # Fit the model to data
            # Initial guess: use max radial velocity as starting point
            v_init = np.max(np.abs(radial_velocities)) * 1.2
            
            popt, _ = curve_fit(model, time_points, radial_velocities, 
                               p0=[v_init], bounds=(0, 200))
            
            car_velocity = popt[0]
            
            print(f"Curve fit result: v_car = {car_velocity:.2f} m/s")
            return car_velocity
            
        except Exception as e:
            print(f"Warning: Curve fit failed ({e}), using estimation method")
            
            # Fallback: use maximum radial velocity with geometry correction
            # At far distances, radial velocity ≈ car velocity
            max_v_r = np.max(np.abs(radial_velocities))
            
            # The max radial velocity occurs when car is far from closest approach
            # For generator geometry, this is approximately 0.95-0.99 of car speed
            car_velocity = max_v_r / 0.97
            
            print(f"Estimation method: v_car ≈ {car_velocity:.2f} m/s")
            return car_velocity
    
    def _theoretical_radial_velocity(self, t: np.ndarray, car_speed: float) -> np.ndarray:
        """Calculate theoretical radial velocity for given car speed"""
        car_pos_x = -car_speed * (self.duration/2) + car_speed * t
        distance = np.sqrt(car_pos_x**2 + self.closest_approach**2)
        v_radial = (car_speed * car_pos_x) / distance
        return v_radial
    
    def _convert_numpy_to_python(self, data_dict: Dict) -> Dict:
        """Convert numpy types to Python native types for JSON serialization"""
        converted = {}
        for key, value in data_dict.items():
            if isinstance(value, (np.float32, np.float64)):
                converted[key] = float(value)
            elif isinstance(value, (np.int32, np.int64)):
                converted[key] = int(value)
            elif isinstance(value, np.ndarray):
                converted[key] = value.tolist()
            else:
                converted[key] = value
        return converted
    
    def _plot_to_base64(self) -> str:
        """Convert current matplotlib plot to base64 string"""
        try:
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight', 
                       facecolor='white', edgecolor='none')
            buffer.seek(0)
            plot_data = buffer.getvalue()
            buffer.close()
            plt.close('all')  # Close all figures
            
            return base64.b64encode(plot_data).decode('utf-8')
            
        except Exception as e:
            print(f"Error converting plot to base64: {e}")
            return ""


# Usage example:
if __name__ == "__main__":
    analyzer = CarSoundAnalyzer()
    
    # Analyze a file
    result = analyzer.analyze_audio_file("test_audio.wav", f_source=120)
    
    if result['success']:
        print("Analysis successful!")
        print(f"Velocity: {result['velocity_stats']['avg_speed_kmh']} km/h")
    else:
        print(f"Analysis failed: {result['error']}")