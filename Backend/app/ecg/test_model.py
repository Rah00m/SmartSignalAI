# quick_model_test.py
import torch
from huggingface_hub import hf_hub_download
import traceback

def quick_test():
    try:
        print("Quick model test...")
        
        # تحميل الموديل مباشرة
        path = hf_hub_download("zackyabd/clinical-ecg-classifier", "ecg_model.pth")
        print(f"Downloaded: {path}")
        
        model = torch.load(path, map_location='cpu', weights_only=False)
        print(f"Loaded: {type(model)}")
        
        return True
    except Exception as e:
        print(f"Failed: {e}")
        print(traceback.format_exc())
        return False

quick_test()