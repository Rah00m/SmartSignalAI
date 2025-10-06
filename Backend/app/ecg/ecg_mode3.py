
from fastapi import APIRouter
import wfdb
import pandas as pd
import os

router = APIRouter()

BASE_PATH = r"E:\OneDrive\المستندات\SBE\DSP\SmartSignalAI\Backend\app\data\ptb-diagnostic-ecg-database-1.0.0"




def get_diagnosis(patient: str, recording: str):
    hea_path = os.path.join(BASE_PATH, patient, f"{recording}.hea")
    diagnosis_lines = []
    if os.path.exists(hea_path):
        with open(hea_path, "r", encoding="utf-8", errors="ignore") as f:
            capture = False
            for line in f:
                if line.startswith("# Diagnose:"):
                    capture = True
                    diagnosis_lines.append(line.strip("# ").strip())
                elif capture:
                    if line.startswith("#") and line.strip() != "#":
                        diagnosis_lines.append(line.strip("# ").strip())
                    else:
                        break
    else:
        return "Diagnosis file not found."
    
    return "\n".join(diagnosis_lines) if diagnosis_lines else "No diagnosis found."



@router.get("/signal")
def get_mode3_signal(
    patient: str,
    recording: str,
<<<<<<< HEAD
    channels: str,  
=======
    channels: str,  # Format: "i,ii,v1" etc.
>>>>>>> Zeyad
    offset: int = 0,
    length: int = 1000
):
    record_path = os.path.join(BASE_PATH, patient, recording)
    
    if not os.path.exists(record_path + ".dat"):
        return {"error": "Invalid recording path."}

    try:
        record = wfdb.rdrecord(record_path)
        df = pd.DataFrame(record.p_signal, columns=record.sig_name)

<<<<<<< HEAD
=======
        # تحويل القنوات إلى list
>>>>>>> Zeyad
        channels_list = [ch.strip().lower() for ch in channels.split(",")]
        
        if len(channels_list) != 3:
            return {"error": "Exactly 3 channels are required for Mode 3"}

<<<<<<< HEAD
=======
        # التحقق من صحة القنوات
>>>>>>> Zeyad
        invalid_channels = [ch for ch in channels_list if ch not in record.sig_name]
        if invalid_channels:
            return {"error": f"Invalid channel(s): {', '.join(invalid_channels)}. Available: {record.sig_name}"}

<<<<<<< HEAD
=======
        # التأكد من حدود offset و length
>>>>>>> Zeyad
        total_length = len(df)
        if offset >= total_length:
            return {"error": f"Offset {offset} exceeds signal length {total_length}"}
        
        end_index = min(offset + length, total_length)
        
<<<<<<< HEAD
=======
        # جلب بيانات القنوات الثلاثة
>>>>>>> Zeyad
        signals = {}
        for ch in channels_list:
            signals[ch] = df[ch][offset:end_index].tolist()

        diagnosis = get_diagnosis(patient, recording)

        return {
            "patient": patient,
            "recording": recording,
            "channels": channels_list,
            "offset": offset,
            "length": length,
            "signals": signals,
            "diagnosis": diagnosis
        }
        
    except Exception as e:
        return {"error": f"Error processing signal: {str(e)}"}