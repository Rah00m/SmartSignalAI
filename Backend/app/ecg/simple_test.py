# simple_model_test.py
import torch
from huggingface_hub import hf_hub_download

def simple_test():
    """اختبار بسيط لتحميل الموديل"""
    try:
        print("Trying to download model...")
        
        # جرب تحميل الموديل
        model_path = hf_hub_download(
            repo_id="zackyabd/clinical-ecg-classifier",
            filename="ecg_model.pth"
        )
        
        print(f"SUCCESS: Model downloaded to: {model_path}")
        
        # جرب تحميل الموديل في الذاكرة
        model = torch.load(model_path, map_location='cpu')
        print(f"SUCCESS: Model loaded. Type: {type(model)}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    simple_test()