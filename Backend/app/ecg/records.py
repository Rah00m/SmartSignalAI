from fastapi import APIRouter
import os

router = APIRouter()

BASE_PATH = r"E:\OneDrive\المستندات\SBE\DSP\SmartSignalAI\Backend\app\data\ptb-diagnostic-ecg-database-1.0.0"

@router.get("/patients")
def list_patients():
    try:
        patients = [
            folder for folder in os.listdir(BASE_PATH)
            if os.path.isdir(os.path.join(BASE_PATH, folder)) and folder.startswith('patient')
        ]
        patients.sort()  
        return {"patients": patients}
    except Exception as e:
        return {"error": str(e)}


@router.get("/records")
def list_patient_records(patient: str):
 
    patient_path = os.path.join(BASE_PATH, patient)
    
    if not os.path.exists(patient_path):
        return {"error": "Invalid patient ID."}
    
    records = []
    try:
        for file in os.listdir(patient_path):
            if file.endswith(".hea"):
                recording = file.replace(".hea", "")
                xyz_path = os.path.join(patient_path, f"{recording}.xyz")
                records.append({
                    "recording": recording,
                    "has_xyz": os.path.exists(xyz_path)
                })
        
        records.sort(key=lambda x: x["recording"])
        
        return {
            "patient": patient,
            "records": records
        }
    except Exception as e:
        return {"error": f"Error reading patient records: {str(e)}"}