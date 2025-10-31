# test_download_model.py
import os
import torch
from audiosr import build_model

# Create models directory
os.makedirs("models", exist_ok=True)

print("📦 Downloading AudioSR pre-trained model...")
print("⏳ This will download ~2GB of model weights")

# Download and cache the model
try:
    model = build_model(model_name="basic", device="cpu")
    print("✅ Model downloaded and cached successfully!")
    print(f"📂 Model cached in: {torch.hub.get_dir()}")
except Exception as e:
    print(f"❌ Error: {e}")