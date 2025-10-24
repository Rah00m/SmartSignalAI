from fastapi import APIRouter, HTTPException
import numpy as np
import os
import re

# Create router instance - NOT a FastAPI app
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

# 19 channel indices to extract from 128 channels
# These correspond to standard EEG electrode positions
CHANNEL_INDICES = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 
    10, 11, 12, 13, 14, 15, 16, 17, 18
]

# Channel names for reference
CHANNEL_NAMES = [
    "Pz", "Cz", "Fz", "T6", "T5", "T4", "T3", "F8", "F7", "O2",
    "O1", "P4", "P3", "C4", "C3", "F4", "F3", "Fp2", "Fp1"
]

def extract_feature_number(filename: str) -> int:
    """Extract feature number from filename like feature_001.npy -> 1"""
    match = re.search(r'feature_(\d+)\.npy', filename)
    if match:
        return int(match.group(1))
    return None

def extract_19_channels(data: np.ndarray) -> np.ndarray:
    """
    Extract 19 channels from 128-channel EEG data
    Input shape: (samples, time_points, 128)
    Output shape: (samples, time_points, 19)
    """
    if data.ndim == 3 and data.shape[2] == 128:
        # Extract only the 19 specified channels
        extracted = data[:, :, CHANNEL_INDICES]
        print(f"📊 Extracted 19 channels from 128. New shape: {extracted.shape}")
        return extracted
    elif data.ndim == 3 and data.shape[2] == 19:
        # Already 19 channels
        print(f"📊 Data already has 19 channels. Shape: {data.shape}")
        return data
    else:
        print(f"⚠ Unexpected data shape: {data.shape}. Returning as-is.")
        return data

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
    try:
        feature_files = [f for f in os.listdir(DATA_PATH) if f.startswith("feature_") and f.endswith(".npy")]
        return {
            "message": "EEG API running (19-channel extraction)", 
            "endpoints": [
                "/eeg/features", 
                "/eeg/feature/{name}", 
                "/eeg/feature-info", 
                "/eeg/labels", 
                "/eeg/health"
            ],
            "data_path": DATA_PATH,
            "features_count": len(feature_files),
            "channels": 19,
            "channel_names": CHANNEL_NAMES
        }
    except:
        return {
            "message": "EEG API running (19-channel extraction)", 
            "endpoints": [
                "/eeg/features", 
                "/eeg/feature/{name}", 
                "/eeg/feature-info", 
                "/eeg/labels", 
                "/eeg/health"
            ],
            "data_path": DATA_PATH,
            "channels": 19
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
    """Get a specific EEG feature by filename (extracts 19 channels from 128)"""
    print(f"🔍 Loading EEG feature: {name}")
    fp = os.path.join(DATA_PATH, name)
    
    if not os.path.exists(fp):
        print(f"❌ EEG File not found: {fp}")
        raise HTTPException(status_code=404, detail=f"EEG file not found: {name}")

    try:
        # Load the numpy array
        data = np.load(fp)
        print(f"📊 Original EEG Feature {name} shape: {data.shape}")
        
        # Extract 19 channels from 128
        data_19ch = extract_19_channels(data)
        
        feature_number = extract_feature_number(name)
        print(f"📊 EEG Feature {name} -> number {feature_number}, final shape: {data_19ch.shape}")
        
        label = get_label_for_feature(feature_number) if feature_number is not None else None
        
        response = {
            "feature_name": name,
            "feature_number": feature_number,
            "shape": list(data_19ch.shape),
            "feature": data_19ch.tolist(),
            "label": label,
            "label_name": LABEL_MAP.get(label, "Unknown") if label is not None else None,
            "channels": 19,
            "channel_names": CHANNEL_NAMES
        }
        
        print(f"✅ Successfully loaded EEG feature {name} with 19 channels")
        return response
        
    except Exception as e:
        print(f"❌ Error loading EEG feature {name}: {e}")
        import traceback
        traceback.print_exc()
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
                "label_name": LABEL_MAP.get(label, "Unknown") if label is not None else None,
                "channels": 19
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
            "labels_shape": list(labels.shape) if labels is not None else None,
            "channels": 19,
            "channel_extraction": "Extracting 19 from 128 channels"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }