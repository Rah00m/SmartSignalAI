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

@router.get("/channels")
def get_channels(patient: str, recording: str):
    record_path = os.path.join(BASE_PATH, patient, recording)
    
    if not os.path.exists(record_path + ".dat"):
        return {"error": "Invalid recording path."}
    
    try:
        record = wfdb.rdrecord(record_path)
        return {"channels": record.sig_name}
    except Exception as e:
        return {"error": f"Error reading record: {str(e)}"}

@router.get("/signal")
def get_signal(
    patient: str, 
    recording: str, 
    channel: str = None,
    channels: str = None,
    offset: int = 0, 
    length: int = 3000
):
    record_path = os.path.join(BASE_PATH, patient, recording)
    
    if not os.path.exists(record_path + ".dat"):
        return {"error": "Invalid recording path."}

    try:
        record = wfdb.rdrecord(record_path)
        df = pd.DataFrame(record.p_signal, columns=record.sig_name)

        if channels:
            channels_list = [ch.strip() for ch in channels.split(",")]
        elif channel:
            channels_list = [channel]
        else:
            return {"error": "Either 'channel' or 'channels' parameter is required"}

        invalid_channels = [ch for ch in channels_list if ch not in record.sig_name]
        if invalid_channels:
            return {"error": f"Invalid channel(s): {', '.join(invalid_channels)}. Available: {record.sig_name}"}

        total_length = len(df)
        if offset >= total_length:
            return {"error": f"Offset {offset} exceeds signal length {total_length}"}
        
        end_index = min(offset + length, total_length)
        
        signals = {}
        
        for ch in channels_list:
            y = df[ch][offset:end_index].tolist()
            signals[ch] = y

        diagnosis = get_diagnosis(patient, recording)

        return {
            "patient": patient,
            "recording": recording,
            "channels": channels_list,
            "offset": offset,
            "length": length,
            "actual_length": len(y) if signals else 0,
            "diagnosis": diagnosis,
            "signals": signals
        }
        
    except Exception as e:
        return {"error": f"Error processing signal: {str(e)}"}