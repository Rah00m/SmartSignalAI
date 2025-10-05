# preprocess_and_epoch.py
# Usage:
# python preprocess_and_epoch.py --subject chb01 --edf_dir data --out_dir dataset_out --epoch_sec 10 --overlap 0.5 --max_files 6
import argparse
from pathlib import Path
import numpy as np
import mne
import os
import requests

BASE_URL = "https://physionet.org/files/chbmit/1.0.0"

def download_summary(subject):
    url = f"{BASE_URL}/{subject}/{subject}-summary.txt"
    r = requests.get(url)
    r.raise_for_status()
    return r.text

def parse_summary_text(text):
    lines = text.splitlines()
    mapping = {}
    cur_file = None
    for line in lines:
        line = line.strip()
        if line.startswith("File Name:"):
            cur_file = line.split(":",1)[1].strip()
            mapping[cur_file] = []
        if line.startswith("Seizure Start Time:") and cur_file:
            start = float(line.split(":",1)[1].strip())
            mapping[cur_file].append((start, None))
        if line.startswith("Seizure End Time:") and cur_file:
            end = float(line.split(":",1)[1].strip())
            if mapping[cur_file]:
                last = mapping[cur_file].pop()
                mapping[cur_file].append((last[0], end))
    return mapping

def epoch_file(edf_path, seizure_intervals, epoch_sec=10, overlap=0.5, picks=None, l_freq=1.0, h_freq=40.0):
    raw = mne.io.read_raw_edf(str(edf_path), preload=True, verbose=False)
    raw.pick_types(eeg=True)
    if picks:
        raw.pick_channels(picks)
    sf = raw.info['sfreq']
    raw.filter(l_freq, h_freq, fir_design='firwin', verbose=False)
    data = raw.get_data()  # (n_channels, n_samples)
    total_sec = data.shape[1] / sf
    step = epoch_sec * (1 - overlap)
    epochs = []
    labels = []
    t0 = 0.0
    while t0 + epoch_sec <= total_sec:
        s_idx = int(round(t0 * sf))
        e_idx = int(round((t0 + epoch_sec) * sf))
        epoch = data[:, s_idx:e_idx]
        lab = 0
        for (s, e) in seizure_intervals:
            if e is None:
                continue
            overlap_time = max(0, min(e, t0 + epoch_sec) - max(s, t0))
            if overlap_time >= 0.5 * epoch_sec:
                lab = 1
                break
        epochs.append(epoch.astype(np.float32))
        labels.append(lab)
        t0 += step
    if len(epochs) == 0:
        return np.zeros((0, data.shape[0], int(epoch_sec * sf)), dtype=np.float32), np.zeros((0,), dtype=np.int32)
    return np.stack(epochs), np.array(labels, dtype=np.int32)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--subject", required=True)
    p.add_argument("--edf_dir", default="data")
    p.add_argument("--out_dir", default="dataset_out")
    p.add_argument("--epoch_sec", type=float, default=10.0)
    p.add_argument("--overlap", type=float, default=0.5)
    p.add_argument("--max_files", type=int, default=6)
    args = p.parse_args()

    subject = args.subject
    edf_dir = Path(args.edf_dir)/subject
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    summary_txt = download_summary(subject)
    mapping = parse_summary_text(summary_txt)

    edf_files = sorted([p.name for p in edf_dir.glob("*.edf")])
    if not edf_files:
        raise RuntimeError(f"No EDF files found in {edf_dir}. Run download_chbmit.py first.")
    edf_files = edf_files[:args.max_files]

    all_epochs = []
    all_labels = []
    for fname in edf_files:
        intervals = mapping.get(fname, [])
        path = edf_dir/fname
        print("Processing", path, "seizures:", intervals)
        epochs, labels = epoch_file(path, intervals, epoch_sec=args.epoch_sec, overlap=args.overlap)
        if epochs.shape[0] > 0:
            all_epochs.append(epochs)
            all_labels.append(labels)

    if not all_epochs:
        raise RuntimeError("No epochs extracted. Check files and summary.")
    X = np.concatenate(all_epochs, axis=0)  # (n_epochs, n_ch, n_samples)
    y = np.concatenate(all_labels, axis=0)
    perm = np.random.permutation(len(X))
    X = X[perm]
    y = y[perm]

    np.save(out_dir/"X.npy", X)
    np.save(out_dir/"y.npy", y)
    print("Saved epochs to", out_dir, "X shape:", X.shape, "y shape:", y.shape)

if __name__ == "__main__":
    main()