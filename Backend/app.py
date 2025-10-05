# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
from pathlib import Path

try:
    from tensorflow.keras.models import load_model
    TF_AVAILABLE = True
except Exception:
    TF_AVAILABLE = False

from model_utils import normalize_epoch, to_model_input

app = Flask(__name__)
CORS(app)

MODEL_PATH = Path("dataset_out")/"eeg_chbmit_model.h5"
model = None
if TF_AVAILABLE and MODEL_PATH.exists():
    model = load_model(str(MODEL_PATH))
    print("Loaded TF model:", MODEL_PATH)
else:
    print("TensorFlow model not loaded. Running fallback rule-based predictor.")

@app.route("/api/health")
def health():
    return jsonify({"status":"ok", "tf": TF_AVAILABLE, "model_exists": MODEL_PATH.exists()})

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    window = np.array(data.get("window"))
    if window.ndim != 2:
        return jsonify({"error":"window should be 2D array channels x samples"}), 400
    ep = normalize_epoch(window)
    if model is not None:
        X = to_model_input(ep, target_len=model.input_shape[1])
        X = np.expand_dims(X, axis=0).astype(np.float32)
        pred = model.predict(X)[0]
        label = int(pred.argmax())
        conf = float(pred.max())
        return jsonify({"label": "seizure" if label==1 else "normal", "confidence": conf})
    from scipy import signal
    sr = data.get("sr", 128)
    mean_sig = ep.mean(axis=0)
    f, t_spec, Sxx = signal.spectrogram(mean_sig, fs=sr, nperseg=128, noverlap=96)
    delta_idx = (f>=0.5)&(f<=4)
    alpha_idx = (f>8)&(f<=13)
    p_delta = Sxx[delta_idx].sum() if delta_idx.any() else 0.0
    p_alpha = Sxx[alpha_idx].sum() if alpha_idx.any() else 0.0
    if p_delta > 1.5 * (p_alpha + 1e-9):
        return jsonify({"label":"slowing", "confidence": min(0.99, float(p_delta/(p_alpha+1e-9)))})
    if np.std(mean_sig) > 50:
        return jsonify({"label":"seizure_like", "confidence":0.8})
    return jsonify({"label":"normal", "confidence":0.9})