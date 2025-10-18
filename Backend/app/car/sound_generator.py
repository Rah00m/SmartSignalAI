import numpy as np
from scipy.io.wavfile import write
import os
import tempfile

class CarSoundGenerator:
    def __init__(self):
        self.duration = 12.0
        self.fs = 44100
        self.speed_of_sound = 343
        self.closest_approach = 10
        self.drive = 4.0
        
    def generate_car_sound(self, velocity_kmh: float, frequency: float) -> str:
        """
        Generate a realistic car sound with Doppler effect - EXACTLY matching doppler_project.py
        """
        try:
            print(f"Starting sound generation: {velocity_kmh} km/h, {frequency} Hz")
            
            # Use the EXACT same variable names and values as your original
            f_source = frequency
            car_speed = velocity_kmh  # Don't convert - use directly as your original does
            drive = self.drive
            
            print(f"Using car_speed: {car_speed}, f_source: {f_source}")
            
            # --- Time and Position Calculation (EXACT copy from your original) ---
            t = np.linspace(0., self.duration, int(self.fs * self.duration))
            start_pos = -car_speed * (self.duration / 2)
            car_pos_x = start_pos + car_speed * t
            distance = np.sqrt(car_pos_x**2 + self.closest_approach**2)
            radial_velocity = (car_speed * car_pos_x) / distance
            f_observed = f_source * (self.speed_of_sound / (self.speed_of_sound - radial_velocity))

            # Calculate the fundamental phase (EXACT copy)
            phase = 2 * np.pi * np.cumsum(f_observed) / self.fs

            # --- Generate the basic tone with its harmonic (EXACT copy) ---
            signal_fundamental = 1.0 * np.sin(phase)
            signal_harmonic2 = 0.5 * np.sin(phase * 2)
            clean_signal = signal_fundamental + signal_harmonic2

            # --- Apply waveshaping for a gritty, realistic tone (EXACT copy) ---
            saturated_signal = np.tanh(clean_signal * drive)

            # --- Apply dynamic amplitude (volume) based on distance (EXACT copy) ---
            base_amplitude = 1.5
            dynamic_amplitude = base_amplitude / distance
            final_signal = saturated_signal * dynamic_amplitude

            # --- Normalize and Save the output (EXACT copy) ---
            signal_normalized = np.int16(final_signal / np.max(np.abs(final_signal)) * 32767)
            
            # Create temporary file with the exact same naming as your original
            temp_dir = tempfile.gettempdir()
            filename = f"doppler_saturated_tone.wav"  # Use same name as your original
            filepath = os.path.join(temp_dir, filename)
            
            # Save the audio file
            write(filepath, self.fs, signal_normalized)
            
            print(f"Successfully generated '{filename}' at {filepath}")
            print(f"File size: {os.path.getsize(filepath)} bytes")
            
            return filepath
            
        except Exception as e:
            print(f"ERROR in generate_car_sound: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise e