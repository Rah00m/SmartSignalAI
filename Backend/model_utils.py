# model_utils.py
import numpy as np
from scipy import signal

def normalize_epoch(epoch):
    # epoch: (n_channels, n_samples)
    out = np.zeros_like(epoch)
    for i in range(epoch.shape[0]):
        ch = epoch[i]
        ch = (ch - ch.mean()) / (ch.std() + 1e-8)
        out[i] = ch
    return out

def to_model_input(epoch, target_len=None):
    # epoch: (n_channels, n_samples)
    if target_len is not None:
        n = epoch.shape[1]
        if n < target_len:
            pad = target_len - n
            epoch = np.pad(epoch, ((0,0),(0,pad)), mode='constant')
        else:
            epoch = epoch[:, :target_len]
    return np.transpose(epoch)  # (n_samples, n_channels)