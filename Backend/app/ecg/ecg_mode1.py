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





from fastapi import APIRouter
import wfdb
import pandas as pd
import os

# إنشاء router جديد
router = APIRouter()

# المسار الأساسي للبيانات
BASE_PATH = r"E:\OneDrive\المستندات\SBE\DSP\SmartSignalAI\Backend\app\data\ptb-diagnostic-ecg-database-1.0.0"

# دالة لجلب التشخيص
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
    """
    دالة لاسترجاع قائمة القنوات (Channels) المتاحة للـ recording المحدد.
    """
    record_path = os.path.join(BASE_PATH, patient, recording)
    
    if not os.path.exists(record_path + ".dat"):
        return {"error": "Invalid recording path."}
    
    try:
        record = wfdb.rdrecord(record_path)  
        return {"channels": record.sig_name}
    except Exception as e:
        return {"error": f"Error reading record: {str(e)}"}


@router.get("/signal")
def get_signal(patient: str, recording: str, channel: str, offset: int = 0, length: int = 3000):
    """
    دالة لاسترجاع إشارة ECG من قناة معينة.
    """
    record_path = os.path.join(BASE_PATH, patient, recording)
    
    if not os.path.exists(record_path + ".dat"):
        return {"error": "Invalid recording path."}

    try:
        record = wfdb.rdrecord(record_path) 

        if channel not in record.sig_name:
            return {"error": f"Invalid channel name: {channel}. Available channels: {record.sig_name}"}

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


@router.get("/all-signals")
def get_all_signals(patient: str, recording: str, offset: int = 0, length: int = 1000):
    """
    دالة لاسترجاع جميع إشارات الـ ECG لكل القنوات مرة واحدة
    """
    record_path = os.path.join(BASE_PATH, patient, recording)
    
    if not os.path.exists(record_path + ".dat"):
        return {"error": "Invalid recording path."}

    try:
        record = wfdb.rdrecord(record_path)
        
        signals = {}
        df = pd.DataFrame(record.p_signal, columns=record.sig_name)
        
        total_length = len(df)
        if offset >= total_length:
            return {"error": f"Offset {offset} exceeds signal length {total_length}"}
        
        end_index = min(offset + length, total_length)
        
        for channel in record.sig_name:
            signals[channel] = df[channel][offset:end_index].tolist()
        
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