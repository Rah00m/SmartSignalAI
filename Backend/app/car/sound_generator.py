import numpy as np
from scipy.io.wavfile import write
import os
import tempfile

class CarSoundGenerator:
    def __init__(self):
        self.duration = 12.0
        self.fs = 44100
        self.speed_of_sound = 343  # m/s
        self.closest_approach = 10  # meters
        self.drive = 4.0
        
    def generate_car_sound(self, velocity_input: float, frequency: float) -> str:
        """
        Generate car sound with proper unit handling
        
        Args:
            velocity_input: Car velocity in m/s (as shown in UI)
            frequency: Source frequency in Hz
        """
        try:
            print(f"=== GENERATOR START ===")
            print(f"Input velocity: {velocity_input} m/s")
            print(f"Source frequency: {frequency} Hz")
            
            # Use the input velocity directly as m/s (correct physics)
            f_source = frequency
            car_speed = velocity_input  # This is in m/s
            
            print(f"Car speed (m/s): {car_speed}")
            print(f"Car speed (km/h): {car_speed * 3.6:.1f}")
            
            # Time array
            t = np.linspace(0., self.duration, int(self.fs * self.duration))
            
            # Car position over time (starting from left, moving right)
            start_pos = -car_speed * (self.duration / 2)
            car_pos_x = start_pos + car_speed * t
            
            # Distance from observer (at origin) to car
            distance = np.sqrt(car_pos_x**2 + self.closest_approach**2)
            
            # Radial velocity (component toward/away from observer)
            radial_velocity = (car_speed * car_pos_x) / distance
            
            print(f"Max radial velocity: {np.max(np.abs(radial_velocity)):.2f} m/s")
            print(f"Radial velocity range: {np.min(radial_velocity):.2f} to {np.max(radial_velocity):.2f} m/s")
            
            # Doppler-shifted frequency
            # Approaching (negative radial_velocity): frequency increases
            # Receding (positive radial_velocity): frequency decreases
            f_observed = f_source * (self.speed_of_sound / (self.speed_of_sound - radial_velocity))
            
            print(f"Frequency range: {np.min(f_observed):.1f} - {np.max(f_observed):.1f} Hz")
            print(f"Max frequency shift: {np.max(f_observed) - f_source:.1f} Hz")
            
            # Calculate phase
            phase = 2 * np.pi * np.cumsum(f_observed) / self.fs
            
            # Generate harmonics
            signal_fundamental = 1.0 * np.sin(phase)
            signal_harmonic2 = 0.5 * np.sin(phase * 2)
            clean_signal = signal_fundamental + signal_harmonic2
            
            # Apply saturation/distortion
            saturated_signal = np.tanh(clean_signal * self.drive)
            
            # Dynamic amplitude based on distance
            base_amplitude = 1.5
            dynamic_amplitude = base_amplitude / distance
            final_signal = saturated_signal * dynamic_amplitude
            
            # Normalize
            signal_normalized = np.int16(final_signal / np.max(np.abs(final_signal)) * 32767)
            
            # Save to temp file
            temp_dir = tempfile.gettempdir()
            filename = f"doppler_car_{int(car_speed*3.6)}kmh_{int(frequency)}hz.wav"
            filepath = os.path.join(temp_dir, filename)
            
            write(filepath, self.fs, signal_normalized)
            
            print(f"Generated file: {filename}")
            print(f"File size: {os.path.getsize(filepath)} bytes")
            print(f"=== GENERATOR END ===\n")
            
            return filepath
            
        except Exception as e:
            print(f"ERROR in generate_car_sound: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise e
