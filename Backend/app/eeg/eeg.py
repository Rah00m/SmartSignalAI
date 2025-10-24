from fastapi import APIRouter, HTTPException
import numpy as np
import os
import re

# Create router instance for modular FastAPI app
eeg_router = APIRouter()

# Use your absolute path
DATA_PATH = r"E:\OneDrive\المستندات\SBE\DSP\SmartSignalAI\Backend\app\data\EEGData"
print(f"📂 EEG Data path: {DATA_PATH}")

# Check if data directory exists
if not os.path.exists(DATA_PATH):
    print(f"❌ ERROR: EEG Data directory not found at {DATA_PATH}")
    print("Please verify the path exists")
else:
    print(f"✅ EEG Data directory found at {DATA_PATH}")
    files = os.listdir(DATA_PATH)
    print(f"📁 Files in EEG data directory: {len(files)} files")

# Load labels
LABELS_PATH = os.path.join(DATA_PATH, "label.npy")
labels = None
if os.path.exists(LABELS_PATH):
    labels = np.load(LABELS_PATH)
    print(f"✅ Loaded EEG labels with shape: {labels.shape}")
    print(f"EEG Labels preview: {labels[:5] if len(labels) > 5 else labels}")
else:
    print(f"❌ EEG Labels file not found at {LABELS_PATH}")

# Label mapping
LABEL_MAP = {
    0: "Multiple Sclerosis (MS)",
    1: "Healthy Control (HC)", 
    2: "Alzheimer's Disease (AD)",
    3: "Frontotemporal Dementia (FTD)",
    4: "Parkinson's Disease (PD)"
}

def extract_feature_number(filename: str) -> int:
    """Extract feature number from filename like feature_001.npy -> 1"""
    match = re.search(r'feature_(\d+)\.npy', filename)
    if match:
        return int(match.group(1))
    return None

def get_label_for_feature(feature_number: int):
    """Get label for a specific feature number"""
    if labels is None:
        print(f"⚠ No labels file loaded for EEG feature {feature_number}")
        return None
        
    print(f"🔍 Looking for label for EEG feature {feature_number}, labels shape: {labels.shape}")
    
    # If labels is 1D array [label1, label2, ...]
    if labels.ndim == 1:
        print(f"📊 EEG Labels is 1D array, length: {len(labels)}")
        if feature_number < len(labels):
            label = int(labels[feature_number])
            print(f"✅ Found label {label} for EEG feature {feature_number} (1D array)")
            return label
        else:
            print(f"❌ EEG Feature number {feature_number} out of range for labels (max: {len(labels)-1})")
    
    # If labels is 2D array [[label1, idx1], [label2, idx2], ...]
    elif labels.ndim == 2:
        print(f"📊 EEG Labels is 2D array, shape: {labels.shape}")
        # Try to find matching feature index in second column
        for i in range(len(labels)):
            if len(labels[i]) >= 2:
                if int(labels[i][1]) == feature_number:
                    label = int(labels[i][0])
                    print(f"✅ Found label {label} for EEG feature {feature_number} (2D array match)")
                    return label
        
        # Fallback: use row index if no exact match found
        if feature_number < len(labels):
            label = int(labels[feature_number][0])
            print(f"✅ Found label {label} for EEG feature {feature_number} (2D array fallback)")
            return label
        else:
            print(f"❌ EEG Feature number {feature_number} out of range for labels (max: {len(labels)-1})")
    
    print(f"❌ No label found for EEG feature {feature_number}")
    return None

@eeg_router.get("/")
async def eeg_home():
    """EEG root endpoint with API information"""
    feature_files = [f for f in os.listdir(DATA_PATH) if f.startswith("feature_") and f.endswith(".npy")]
    return {
        "message": "EEG API running", 
        "endpoints": [
            "/eeg/features", 
            "/eeg/feature/{name}", 
            "/eeg/feature-info", 
            "/eeg/labels", 
            "/eeg/health"
        ],
        "data_path": DATA_PATH,
        "features_count": len(feature_files)
    }

@eeg_router.get("/features")
async def list_eeg_features():
    """List all available EEG feature files"""
    try:
        files = sorted([f for f in os.listdir(DATA_PATH)
                        if f.startswith("feature_") and f.endswith(".npy")])
        print(f"📁 Found {len(files)} EEG feature files")
        return files
    except Exception as e:
        print(f"❌ Error listing EEG features: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@eeg_router.get("/feature/{name}")
async def get_eeg_feature(name: str):
    """Get a specific EEG feature by filename"""
    print(f"🔍 Loading EEG feature: {name}")
    fp = os.path.join(DATA_PATH, name)
    
    if not os.path.exists(fp):
        print(f"❌ EEG File not found: {fp}")
        raise HTTPException(status_code=404, detail=f"EEG file not found: {name}")

    try:
        data = np.load(fp)
        feature_number = extract_feature_number(name)
        print(f"📊 EEG Feature {name} -> number {feature_number}, shape: {data.shape}")
        
        label = get_label_for_feature(feature_number) if feature_number is not None else None
        
        response = {
            "feature_name": name,
            "feature_number": feature_number,
            "shape": list(data.shape),
            "feature": data.tolist(),
            "label": label,
            "label_name": LABEL_MAP.get(label, "Unknown") if label is not None else None
        }
        
        print(f"✅ Successfully loaded EEG feature {name}")
        return response
        
    except Exception as e:
        print(f"❌ Error loading EEG feature {name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@eeg_router.get("/labels")
async def get_all_eeg_labels():
    """Get all EEG labels with their mappings"""
    return {
        "label_mapping": LABEL_MAP,
        "total_labels": len(labels) if labels is not None else 0,
        "labels_preview": labels[:5].tolist() if labels is not None and len(labels) > 0 else []
    }

@eeg_router.get("/feature-info")
async def get_all_eeg_features_info():
    """Get information for all EEG features including labels"""
    try:
        files = sorted([f for f in os.listdir(DATA_PATH)
                        if f.startswith("feature_") and f.endswith(".npy")])
        print(f"📁 Generating info for {len(files)} EEG features")
        
        features_info = []
        for file in files:
            feature_number = extract_feature_number(file)
            label = get_label_for_feature(feature_number) if feature_number is not None else None
            
            features_info.append({
                "filename": file,
                "feature_number": feature_number,
                "label": label,
                "label_name": LABEL_MAP.get(label, "Unknown") if label is not None else None
            })
        
        print(f"✅ Generated info for {len(features_info)} EEG features")
        return features_info
        
    except Exception as e:
        print(f"❌ Error generating EEG feature info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@eeg_router.get("/health")
async def eeg_health_check():
    """EEG health check endpoint"""
    try:
        features_count = len([f for f in os.listdir(DATA_PATH) if f.startswith("feature_") and f.endswith(".npy")])
        return {
            "status": "healthy",
            "data_directory": DATA_PATH,
            "features_available": features_count,
            "labels_loaded": labels is not None,
            "labels_shape": list(labels.shape) if labels is not None else None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }