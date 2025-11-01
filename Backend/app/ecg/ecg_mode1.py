# # from fastapi import APIRouter
# # import wfdb
# # import pandas as pd

# # router = APIRouter()

# # @router.get("/channels")
# # def get_channels():
# #     record = wfdb.rdrecord('100', pn_dir='mitdb')
# #     return {"channels": record.sig_name}


# # @router.get("/signal")
# # def get_signal(channel: str = "MLII", offset: int = 0, length: int = 3000):
# #     record = wfdb.rdrecord('100', pn_dir='mitdb')
# #     df = pd.DataFrame(record.p_signal, columns=record.sig_name)

# #     if channel not in df.columns:
# #         return {"error": f"Invalid channel name: {channel}"}

# #     y = df[channel][offset:offset+length].tolist()
# #     x = list(range(offset, offset + len(y)))

# #     return {
# #         "channel": channel,
# #         "offset": offset,
# #         "length": length,
# #         "x": x,
# #         "y": y
# #     }

# # # uvicorn app.main:app --reload
# # # http://127.0.0.1:8000/ecg/mode1/channels
# # # http://127.0.0.1:8000/ecg/mode1/signal?channel=MLII&offset=0&length=3000


# from fastapi import APIRouter
# import wfdb
# import pandas as pd
# import os

# router = APIRouter()

# BASE_PATH = r"E:\OneDrive\المستندات\SBE\DSP\SmartSignalAI\Backend\app\data\ptb-diagnostic-ecg-database-1.0.0"

# def get_diagnosis(patient: str, recording: str):
#     hea_path = os.path.join(BASE_PATH, patient, f"{recording}.hea")
#     diagnosis_lines = []
#     if os.path.exists(hea_path):
#         with open(hea_path, "r", encoding="utf-8", errors="ignore") as f:
#             capture = False
#             for line in f:
#                 if line.startswith("# Diagnose:"):
#                     capture = True
#                     diagnosis_lines.append(line.strip("# ").strip())
#                 elif capture:
#                     if line.startswith("#") and line.strip() != "#":
#                         diagnosis_lines.append(line.strip("# ").strip())
#                     else:
#                         break
#     else:
#         return "Diagnosis file not found."
    
#     return "\n".join(diagnosis_lines) if diagnosis_lines else "No diagnosis found."


# @router.get("/channels")
# def get_channels(patient: str, recording: str):
#     record_path = os.path.join(BASE_PATH, patient, recording)
#     record = wfdb.rdrecord(record_path)

#     return {"channels": record.sig_name}


# @router.get("/signal")
# def get_signal(patient: str, recording: str, channel: str, offset: int = 0, length: int = 3000):
#     record_path = os.path.join(BASE_PATH, patient, recording)
#     record = wfdb.rdrecord(record_path)

#     if channel not in record.sig_name:
#         return {"error": f"Invalid channel name: {channel}"}

#     df = pd.DataFrame(record.p_signal, columns=record.sig_name)
#     y = df[channel][offset:offset+length].tolist()
#     x = list(range(offset, offset + len(y)))

#     diagnosis = get_diagnosis(patient, recording)

#     return {
#         "patient": patient,
#         "recording": recording,
#         "channel": channel,
#         "offset": offset,
#         "length": length,
#         "diagnosis": diagnosis,
#         "x": x,
#         "y": y
#     }

# # مثال للروابط:
# # http://127.0.0.1:8000/ecg/mode1/signal?patient=patient001&recording=s0010_re&channel=i&offset=0&length=3000
# # http://127.0.0.1:8000/ecg/mode1/channels?patient=patient001&recording=s0010_re



# uvicorn app.main:app --reload

import os
import wfdb
import pandas as pd
import requests
from fastapi import APIRouter

router = APIRouter()

CACHE_PATH = r"E:\OneDrive\المستندات\SBE\DSP\SmartSignalAI\Backend\app\data\cache"

os.makedirs(CACHE_PATH, exist_ok=True)



def get_diagnosis(patient: str, recording: str):
    """
    Reads diagnosis text from local cache if available,
    otherwise downloads from PhysioNet and caches it.
    """
    patient_folder = os.path.join(CACHE_PATH, patient)
    hea_path = os.path.join(patient_folder, f"{recording}.hea")

    if os.path.exists(hea_path):
        with open(hea_path, "r", encoding="utf-8", errors="ignore") as f:
            return _extract_diagnosis_lines(f.readlines())

    base_url = f"https://physionet.org/files/ptbdb/1.0.0/{patient}/{recording}.hea"
    response = requests.get(base_url)
    if response.status_code == 200:
        os.makedirs(patient_folder, exist_ok=True)
        with open(hea_path, "w", encoding="utf-8") as f:
            f.write(response.text)
        return _extract_diagnosis_lines(response.text.split("\n"))
    else:
        return f"Error fetching diagnosis: status {response.status_code}"


def _extract_diagnosis_lines(lines):
    """Helper function to parse diagnosis lines from .hea text."""
    diagnosis_lines = []
    capture = False
    for line in lines:
        if line.startswith("# Diagnose:"):
            capture = True
            diagnosis_lines.append(line.strip("# ").strip())
        elif capture:
            if line.startswith("#") and line.strip() != "#":
                diagnosis_lines.append(line.strip("# ").strip())
            else:
                break
    return "\n".join(diagnosis_lines) if diagnosis_lines else "No diagnosis found."



def load_record(patient: str, recording: str):
    """
    Loads a WFDB record from local cache if available,
    otherwise downloads it from PhysioNet and caches it.
    """
    patient_folder = os.path.join(CACHE_PATH, patient)
    os.makedirs(patient_folder, exist_ok=True)

    local_record_path = os.path.join(patient_folder, recording)
    dat_path = local_record_path + ".dat"
    hea_path = local_record_path + ".hea"

    if os.path.exists(dat_path) and os.path.exists(hea_path):
        return wfdb.rdrecord(local_record_path)

    print(f"📥 Downloading {recording} for {patient} from PhysioNet...")
    record = wfdb.rdrecord(recording, pn_dir=f"ptbdb/1.0.0/{patient}")
    wfdb.wrsamp(local_record_path, fs=record.fs, units=record.units,
                sig_name=record.sig_name, p_signal=record.p_signal)

    print(f"✅ Cached: {local_record_path}")
    return record



@router.get("/channels")
def get_channels(patient: str, recording: str):
    try:
        record = load_record(patient, recording)
        return {"channels": record.sig_name}
    except Exception as e:
        return {"error": f"Error reading record: {str(e)}"}



@router.get("/signal")
def get_signal(patient: str, recording: str, channel: str, offset: int = 0, length: int = 3000):
    try:
        record = load_record(patient, recording)
        if channel not in record.sig_name:
            return {"error": f"Invalid channel name: {channel}. Available: {record.sig_name}"}

        df = pd.DataFrame(record.p_signal, columns=record.sig_name)
        total_length = len(df)
        if offset >= total_length:
            return {"error": f"Offset {offset} exceeds signal length {total_length}"}

        end_index = min(offset + length, total_length)
        y = df[channel][offset:end_index].tolist()
        x = list(range(offset, offset + len(y)))

        diagnosis = get_diagnosis(patient, recording)

        return {
            "patient": patient,
            "recording": recording,
            "channel": channel,
            "offset": offset,
            "length": length,
            "actual_length": len(y),
            "diagnosis": diagnosis,
            "x": x,
            "y": y
        }

    except Exception as e:
        return {"error": f"Error processing signal: {str(e)}"}


@router.get("/full-signal")
def get_full_signal(patient: str, recording: str, channel: str):
    try:
        record = load_record(patient, recording)

        if channel not in record.sig_name:
            return {"error": f"Invalid channel: {channel}. Available: {record.sig_name}"}

        df = pd.DataFrame(record.p_signal, columns=record.sig_name)
        y = df[channel].tolist()
        x = list(range(len(y)))

        diagnosis = get_diagnosis(patient, recording)

        return {
            "patient": patient,
            "recording": recording,
            "channel": channel,
            "total_length": len(y),
            "diagnosis": diagnosis,
            "x": x,
            "y": y
        }

    except Exception as e:
        return {"error": f"Error processing full signal: {str(e)}"}



@router.get("/all-signals")
def get_all_signals(patient: str, recording: str, offset: int = 0, length: int = 1000):
    try:
        record = load_record(patient, recording)
        df = pd.DataFrame(record.p_signal, columns=record.sig_name)

        total_length = len(df)
        if offset >= total_length:
            return {"error": f"Offset {offset} exceeds signal length {total_length}"}

        end_index = min(offset + length, total_length)
        signals = {ch: df[ch][offset:end_index].tolist() for ch in record.sig_name}
        diagnosis = get_diagnosis(patient, recording)

        return {
            "patient": patient,
            "recording": recording,
            "offset": offset,
            "length": length,
            "actual_length": end_index - offset,
            "diagnosis": diagnosis,
            "signals": signals,
            "available_channels": record.sig_name
        }

    except Exception as e:
        return {"error": f"Error processing signals: {str(e)}"}
