from fastapi import APIRouter
import wfdb
import pandas as pd
import numpy as np
import neurokit2 as nk
from scipy import signal
from scipy.spatial.distance import euclidean
from scipy.stats import pearsonr
import os
from typing import Dict, List, Any
import traceback

router = APIRouter()

BASE_PATH = r"E:\OneDrive\المستندات\SBE\DSP\SmartSignalAI\Backend\app\data\ptb-diagnostic-ecg-database-1.0.0"

class Mode2Processor:
    """معالج محسن لـ Mode 2 مع خوارزميات متقدمة"""
    
    def __init__(self):
        self.sampling_rate = 1000
        
    def load_signal(self, patient: str, recording: str, channel: str):
        try:
            record_path = os.path.join(BASE_PATH, patient, recording)
            print(f"📁 Loading signal from: {record_path}")
            
            record = wfdb.rdrecord(record_path)
            df = pd.DataFrame(record.p_signal, columns=record.sig_name)
            
            if channel not in record.sig_name:
                available_channels = record.sig_name
                raise ValueError(f"Channel {channel} not found. Available channels: {available_channels}")
                
            signal_data = df[channel].values
            print(f"✅ Signal loaded successfully - Length: {len(signal_data)}")
            return signal_data
            
        except Exception as e:
            print(f"❌ Error loading signal: {e}")
            raise
    
    def extract_heartbeats(self, ecg_signal: np.ndarray):
        """استخراج النبضات الفردية من إشارة ECG"""
        try:
            print(f"📊 Processing ECG signal of length: {len(ecg_signal)}")
            
            cleaned = nk.ecg_clean(ecg_signal, sampling_rate=self.sampling_rate)
            print(f"✅ Signal cleaned")
            
            _, rpeaks = nk.ecg_peaks(cleaned, sampling_rate=self.sampling_rate)
            rpeaks = rpeaks['ECG_R_Peaks']
            print(f"📍 R-peaks detected: {len(rpeaks)}")
            
            if len(rpeaks) < 2:
                print("❌ Not enough R-peaks found")
                return [], []
            
            beats = []
            for i in range(len(rpeaks) - 1):
                start = rpeaks[i] - int(0.3 * self.sampling_rate)  
                end = rpeaks[i] + int(0.5 * self.sampling_rate)    
                
                if start >= 0 and end < len(cleaned):
                    beat = cleaned[start:end]
                    if len(beat) > 200:
                        beats.append({
                            'index': i,
                            'signal': beat,
                            'r_peak': int(0.3 * self.sampling_rate),  
                            'start_idx': start,
                            'end_idx': end
                        })
            
            print(f"💓 Beats extracted: {len(beats)}")
            return beats, rpeaks
            
        except Exception as e:
            print(f"❌ Error in extract_heartbeats: {e}")
            print(traceback.format_exc())
            return [], []
    
    def detect_abnormal_beats_optimized(self, beats: List[Dict], threshold: float = 0.03):
        if len(beats) < 9:
            print(f"❌ Not enough beats. Need at least 9, got {len(beats)}")
            return []
        
        try:
            all_beats_normalized = [self.normalize_beat_preserve_variability(beat['signal']) for beat in beats]
            
            target_length = 800
            all_beats_resized = []
            
            for beat in all_beats_normalized:
                if len(beat) >= target_length:
                    resized_beat = beat[:target_length]
                else:
                    resized_beat = np.zeros(target_length)
                    resized_beat[:len(beat)] = beat
                all_beats_resized.append(resized_beat)
            
            print(f"📏 All beats resized to length: {target_length}")
            
            variability_scores = []
            
            for i, current_beat in enumerate(all_beats_resized):
                variabilities = []
                for j, other_beat in enumerate(all_beats_resized):
                    if i != j:
                        variability = euclidean(current_beat, other_beat)
                        variabilities.append(variability)
                
                avg_variability = float(np.mean(variabilities)) if variabilities else float('inf')
                variability_scores.append((i, avg_variability))
            
            variability_scores.sort(key=lambda x: x[1])
            
            template_indices = [int(idx) for idx, _ in variability_scores[:8]]
            template_beats = [all_beats_resized[idx] for idx in template_indices]
            template = np.mean(template_beats, axis=0)
            
            print(f"🎯 Template beats indices: {template_indices}")
            print(f"📊 Template variability range: {variability_scores[0][1]:.3f} to {variability_scores[7][1]:.3f}")
            
            all_differences = []
            difference_components_list = []
            
            for i, beat in enumerate(beats):
                if i in template_indices:
                    continue
                    
                current_beat = all_beats_resized[i]
                
                try:
                    correlation, _ = pearsonr(current_beat, template)
                    correlation_diff = 1.0 - max(correlation, 0)
                except:
                    correlation_diff = 1.0
                
                euclidean_diff = euclidean(current_beat, template) / len(current_beat)
                mean_abs_diff = float(np.mean(np.abs(current_beat - template)))
                st_t_diff = self.analyze_st_t_segments_improved(current_beat, template)
                
                weights = {
                    'correlation': 0.5,   
                    'euclidean': 0.3,      
                    'mean_abs': 0.1,       
                    'st_t': 0.1           
                }
                
                total_difference = (
                    weights['correlation'] * correlation_diff +
                    weights['euclidean'] * euclidean_diff +
                    weights['mean_abs'] * mean_abs_diff +
                    weights['st_t'] * st_t_diff
                )
                
                all_differences.append(total_difference)
                difference_components_list.append({
                    'beat': i,
                    'total': total_difference,
                    'correlation': correlation_diff,
                    'euclidean': euclidean_diff,
                    'mean_abs': mean_abs_diff,
                    'st_t': st_t_diff
                })
            
            if all_differences:
                avg_diff = np.mean(all_differences)
                std_diff = np.std(all_differences)
                max_diff = np.max(all_differences)
                min_diff = np.min(all_differences)
                
                print(f"📊 DIFFERENCE STATISTICS:")
                print(f"   - Average: {avg_diff:.4f}")
                print(f"   - Std Dev: {std_diff:.4f}")
                print(f"   - Maximum: {max_diff:.4f}")
                print(f"   - Minimum: {min_diff:.4f}")
                print(f"   - Requested Threshold: {threshold:.4f}")
                
                original_threshold = threshold
                if max_diff < threshold:
                    print(f"🚨 WARNING: All differences are below requested threshold!")
                    auto_threshold = max(0.015, max_diff * 0.7) 
                    print(f"   Using auto-adjusted threshold: {auto_threshold:.4f}")
                    threshold = auto_threshold
                elif avg_diff < threshold * 0.5:
                   
                    auto_threshold = max(0.02, avg_diff + std_diff)
                    print(f"   Adjusting threshold based on statistics: {auto_threshold:.4f}")
                    threshold = auto_threshold
                
                
                sorted_diffs = sorted(difference_components_list, key=lambda x: x['total'], reverse=True)
                print(f"🔝 TOP 5 DIFFERENCES:")
                for i, diff_info in enumerate(sorted_diffs[:5]):
                    print(f"   Beat {diff_info['beat']}: total={diff_info['total']:.4f}, "
                          f"corr={diff_info['correlation']:.4f}")
            
            
            abnormal_beats = []
            
            for i, beat in enumerate(beats):
                if i in template_indices:
                    continue
                    
                current_beat = all_beats_resized[i]
                
                try:
                    correlation, _ = pearsonr(current_beat, template)
                    correlation_diff = 1.0 - max(correlation, 0)
                except:
                    correlation_diff = 1.0
                
                euclidean_diff = euclidean(current_beat, template) / len(current_beat)
                mean_abs_diff = float(np.mean(np.abs(current_beat - template)))
                st_t_diff = self.analyze_st_t_segments_improved(current_beat, template)
                
                total_difference = (
                    0.5 * correlation_diff +
                    0.3 * euclidean_diff +
                    0.1 * mean_abs_diff + 
                    0.1 * st_t_diff
                )
                
                is_abnormal = total_difference > threshold
                
                if is_abnormal:
                    fiducial_points = self.extract_fiducial_points_improved(beat['signal'])
                    
                    abnormal_beats.append({
                        'beat_index': int(i),
                        'difference_score': float(total_difference),
                        'difference_components': {
                            'correlation_diff': float(correlation_diff),
                            'euclidean_diff': float(euclidean_diff),
                            'mean_abs_diff': float(mean_abs_diff),
                            'st_t_diff': float(st_t_diff)
                        },
                        'threshold_used': float(threshold),
                        'fiducial_points': fiducial_points,
                        'signal': beat['signal'].tolist()
                    })
            
            print(f"🚨 Final result: {len(abnormal_beats)} abnormal beats out of {len(beats)}")
            print(f"📈 Abnormality percentage: {(len(abnormal_beats)/len(beats))*100:.1f}%")
            
            return abnormal_beats
            
        except Exception as e:
            print(f"❌ Error in optimized detection: {e}")
            print(traceback.format_exc())
            return []
    
    def detect_abnormal_beats_aggressive(self, beats: List[Dict], threshold: float = 0.02):
        """خوارزمية عدوانية لاكتشاف النبضات الشاذة"""
        if len(beats) < 5:
            return []
        
        try:
            all_beats = [self.normalize_beat_preserve_variability(beat['signal']) for beat in beats]
            
            min_len = min(len(beat) for beat in all_beats)
            all_beats = [beat[:min_len] for beat in all_beats]
            
            template = np.mean(all_beats[:5], axis=0)
            
            abnormal_beats = []
            
            for i, beat in enumerate(beats):
                if i < 5:  
                    continue
                    
                current_beat = all_beats[i]
                
                try:
                    correlation, _ = pearsonr(current_beat, template)
                    difference = 1.0 - max(correlation, 0)
                except:
                    difference = 1.0
                
                if difference > threshold:
                    abnormal_beats.append({
                        'beat_index': i,
                        'difference_score': float(difference),
                        'signal': beat['signal'].tolist(),
                        'fiducial_points': self.extract_fiducial_points_improved(beat['signal'])
                    })
            
            return abnormal_beats
            
        except Exception as e:
            print(f"Error in aggressive detection: {e}")
            return []

    def analyze_st_t_segments_improved(self, beat: np.ndarray, template: np.ndarray):
        """تحليل محسن للـ ST-T segments"""
        try:
            length = len(beat)
            if length < 400:
                return 0.0
            
            r_peak_template = np.argmax(template)
            
            st_start = r_peak_template + 20  # 20ms بعد R peak
            st_end = r_peak_template + 80    # 80ms بعد R peak
            
            t_start = r_peak_template + 120  # 120ms بعد R peak
            t_end = r_peak_template + 200    # 200ms بعد R peak
            
            st_start = max(0, min(st_start, length-1))
            st_end = max(0, min(st_end, length-1))
            t_start = max(0, min(t_start, length-1))
            t_end = max(0, min(t_end, length-1))
            
            if st_end <= st_start or t_end <= t_start:
                return 0.0
            
            st_beat = beat[st_start:st_end]
            st_template = template[st_start:st_end]
            t_beat = beat[t_start:t_end]
            t_template = template[t_start:t_end]
            
            st_diff = np.mean(np.abs(st_beat - st_template)) / (np.max(st_template) - np.min(st_template) + 1e-6)
            t_diff = np.mean(np.abs(t_beat - t_template)) / (np.max(t_template) - np.min(t_template) + 1e-6)
            
            total_st_t_diff = (st_diff + t_diff) / 2.0
            
            return float(total_st_t_diff)
            
        except Exception as e:
            print(f"❌ Error in improved ST-T analysis: {e}")
            return 0.0
    
    def extract_fiducial_points_improved(self, beat_signal: np.ndarray):
        """استخراج محسن للنقاط الأساسية"""
        try:
            if len(beat_signal) < 400:
                return {}
                
            points = {}
            
            r_peak = int(np.argmax(beat_signal))
            points['R_Peak'] = r_peak
            points['R_Value'] = float(beat_signal[r_peak])
            
            p_region_start = max(0, r_peak - 150)  # 150ms قبل R
            p_region_end = max(0, r_peak - 50)     # 50ms قبل R
            
            if p_region_end > p_region_start:
                p_region = beat_signal[p_region_start:p_region_end]
                if len(p_region) > 10:
                    p_peak = int(np.argmax(p_region) + p_region_start)
                    points['P_Peak'] = p_peak
                    points['P_Value'] = float(beat_signal[p_peak])
            
            q_region = beat_signal[max(0, r_peak-50):r_peak]
            if len(q_region) > 5:
                q_point = int(np.argmin(q_region) + max(0, r_peak-50))
                points['Q_Point'] = q_point
                points['Q_Value'] = float(beat_signal[q_point])
            
            s_region = beat_signal[r_peak:min(len(beat_signal), r_peak+50)]
            if len(s_region) > 5:
                s_point = int(np.argmin(s_region) + r_peak)
                points['S_Point'] = s_point
                points['S_Value'] = float(beat_signal[s_point])
            
            t_region_start = min(len(beat_signal), r_peak + 100)  # 100ms بعد R
            t_region_end = min(len(beat_signal), r_peak + 300)    # 300ms بعد R
            
            if t_region_end > t_region_start:
                t_region = beat_signal[t_region_start:t_region_end]
                if len(t_region) > 10:
                    t_peak = int(np.argmax(t_region) + t_region_start)
                    points['T_Peak'] = t_peak
                    points['T_Value'] = float(beat_signal[t_peak])
            
            return points
            
        except Exception as e:
            print(f"❌ Error in improved fiducial points: {e}")
            return {}
    
    def normalize_beat_preserve_variability(self, beat_signal: np.ndarray):
        """تطبيع يحافظ على التباين بين النبضات"""
        try:
            if len(beat_signal) == 0:
                return np.array([])
                
            mean_val = np.mean(beat_signal)
            std_val = np.std(beat_signal)
            
            if std_val > 1e-6:
                normalized = (beat_signal - mean_val) / (3 * std_val)  
            else:
                normalized = beat_signal - mean_val
                
            return normalized
            
        except Exception as e:
            print(f"❌ Error in variability-preserving normalization: {e}")
            return beat_signal

@router.get("/analyze-optimized")
def analyze_ecg_mode2_optimized(
    patient: str,                  
    recording: str,                  
    channel: str,                   
    threshold: float = 0.025,        
    max_beats: int = 100             
):
    """تحليل محسن باستخدام الخوارزمية الجديدة - كل الـ parameters مطلوبة"""
    try:
        print(f"🔍 Starting OPTIMIZED Mode 2 analysis for {patient}/{recording}")
        print(f"🎯 Channel: {channel}, Threshold: {threshold}")
        print(f"⚙️ Parameters: threshold={threshold}, max_beats={max_beats}")
        
        processor = Mode2Processor()
        ecg_signal = processor.load_signal(patient, recording, channel)
        
        analysis_length = min(len(ecg_signal), max_beats * 1500)
        analysis_signal = ecg_signal[:analysis_length]
        
        print(f"📥 Signal loaded, analyzing {len(analysis_signal)} samples")
        
        beats, rpeaks = processor.extract_heartbeats(analysis_signal)
        
        if not beats:
            return {
                "error": "No heartbeats detected in the signal",
                "debug_info": {
                    "signal_length": int(len(analysis_signal)),
                    "r_peaks_found": int(len(rpeaks)),
                    "patient": patient,
                    "recording": recording,
                    "channel": channel
                }
            }
        
        print(f"💓 Total beats available: {len(beats)}")
        
        abnormal_beats = processor.detect_abnormal_beats_optimized(beats, threshold)
        
        if len(abnormal_beats) == 0:
            print("🔄 No abnormal beats found with optimized algorithm, trying aggressive approach...")
            aggressive_threshold = max(0.01, threshold * 0.3)  
            abnormal_beats = processor.detect_abnormal_beats_aggressive(beats, aggressive_threshold)
            print(f"🔍 Aggressive approach found: {len(abnormal_beats)} abnormal beats")
        
        normal_beats_count = len(beats) - len(abnormal_beats)
        abnormality_percentage = (len(abnormal_beats) / len(beats)) * 100 if beats else 0
        
        if abnormality_percentage < 5:
            abnormality_level = "LOW"
        elif abnormality_percentage < 15:
            abnormality_level = "MODERATE" 
        else:
            abnormality_level = "HIGH"
        
        actual_threshold = abnormal_beats[0]['threshold_used'] if abnormal_beats else threshold
        
        result = {
            "patient": patient,
            "recording": recording,
            "channel": channel,
            "analysis_summary": {
                "total_beats_analyzed": int(len(beats)),
                "normal_beats": int(normal_beats_count),
                "abnormal_beats_detected": int(len(abnormal_beats)),
                "abnormality_percentage": float(round(abnormality_percentage, 2)),
                "abnormality_level": abnormality_level,
                "r_peaks_detected": int(len(rpeaks))
            },
            "algorithm_used": "improved_variability_based_template",
            "parameters": {
                "requested_threshold": float(threshold),
                "actual_threshold_used": float(actual_threshold),
                "max_beats_analyzed": int(max_beats),
                "template_size": 8,
                "difference_method": "weighted_correlation_emphasis"
            },
            "abnormal_beats": abnormal_beats,
            "debug_info": {
                "signal_analysis_length": int(len(analysis_signal)),
                "minimum_beats_required": 9,
                "beats_available": int(len(beats)),
                "auto_threshold_adjusted": actual_threshold != threshold
            },
            "recommendations": {
                "for_healthy_patients": "Expected abnormality: 0-10%",
                "for_cardiac_patients": "Expected abnormality: 10-40%", 
                "suggested_threshold": "0.02-0.04 for optimal results"
            }
        }
        
        print(f"✅ OPTIMIZED Analysis completed - {len(abnormal_beats)} abnormal beats found ({abnormality_percentage:.1f}%)")
        print(f"📊 Abnormality level: {abnormality_level}")
        
        return result
        
    except Exception as e:
        error_msg = f"Error in optimized analysis: {str(e)}"
        print(f"❌ {error_msg}")
        print(traceback.format_exc())
        return {
            "error": error_msg,
            "patient": patient,
            "recording": recording,
            "channel": channel
        }

@router.get("/analyze-comprehensive")
def analyze_ecg_comprehensive(
    patient: str,          
    recording: str,        
    channel: str           
):
    try:
        processor = Mode2Processor()
        ecg_signal = processor.load_signal(patient, recording, channel)
        beats, rpeaks = processor.extract_heartbeats(ecg_signal[:30000])
        
        if len(beats) < 5:
            return {
                "error": f"Not enough beats for comprehensive analysis. Got {len(beats)}",
                "patient": patient,
                "recording": recording,
                "channel": channel
            }
        
        thresholds = [0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04, 0.05, 0.06]
        results = {}
        
        for threshold in thresholds:
            abnormal_count = len(processor.detect_abnormal_beats_optimized(beats, threshold))
            percentage = (abnormal_count / len(beats)) * 100 if beats else 0
            
            results[f"threshold_{threshold:.3f}"] = {
                "abnormal_beats": int(abnormal_count),
                "abnormality_percentage": float(round(percentage, 2))
            }
        
        optimal_threshold = 0.025  
        
        return {
            "patient": patient,
            "recording": recording, 
            "channel": channel,
            "total_beats": int(len(beats)),
            "comprehensive_analysis": results,
            "optimal_threshold": optimal_threshold,
            "recommendation": f"Use threshold {optimal_threshold} for balanced sensitivity and specificity"
        }
        
    except Exception as e:
        return {
            "error": f"Error in comprehensive analysis: {str(e)}",
            "patient": patient,
            "recording": recording,
            "channel": channel
        }

@router.get("/available-recordings")
def get_available_recordings(patient: str):
    try:
        patient_path = os.path.join(BASE_PATH, patient)
        if not os.path.exists(patient_path):
            return {
                "error": f"Patient {patient} not found",
                "available_patients": os.listdir(BASE_PATH)[:10]  
            }
        
        recordings = [f for f in os.listdir(patient_path) if f.endswith('.dat')]
        recording_names = [f.replace('.dat', '') for f in recordings]
        
        return {
            "patient": patient,
            "available_recordings": recording_names,
            "total_recordings": len(recording_names)
        }
        
    except Exception as e:
        return {"error": f"Error getting recordings: {str(e)}"}

@router.get("/available-channels")
def get_available_channels(patient: str, recording: str):
    try:
        record_path = os.path.join(BASE_PATH, patient, recording)
        record = wfdb.rdrecord(record_path)
        
        return {
            "patient": patient,
            "recording": recording,
            "available_channels": record.sig_name,
            "sampling_rate": record.fs,
            "signal_length": len(record.p_signal)
        }
        
    except Exception as e:
        return {"error": f"Error getting channels: {str(e)}"}
