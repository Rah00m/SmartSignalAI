# train_and_save_model.py
# Usage: python train_and_save_model.py --data_dir dataset_out --epochs 15
import argparse
from pathlib import Path
import numpy as np
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from model_utils import to_model_input, normalize_epoch

def build_model(n_samples, n_channels, n_classes=2):
    inputs = keras.Input(shape=(n_samples, n_channels))
    x = layers.Conv1D(32, 7, padding='same', activation='relu')(inputs)
    x = layers.MaxPool1D(2)(x)
    x = layers.Conv1D(64, 5, padding='same', activation='relu')(x)
    x = layers.MaxPool1D(2)(x)
    x = layers.Conv1D(128, 3, padding='same', activation='relu')(x)
    x = layers.GlobalAveragePooling1D()(x)
    x = layers.Dense(64, activation='relu')(x)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(n_classes, activation='softmax')(x)
    model = keras.Model(inputs, outputs)
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    return model

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data_dir", default="dataset_out")
    p.add_argument("--epochs", type=int, default=15)
    p.add_argument("--batch", type=int, default=16)
    p.add_argument("--target_len", type=int, default=1280)  # e.g., 10s @ 128Hz
    args = p.parse_args()

    data_dir = Path(args.data_dir)
    X = np.load(data_dir/"X.npy")  # (n_epochs, n_ch, n_samples)
    y = np.load(data_dir/"y.npy")
    # preprocess: normalize and convert shape
    X_proc = []
    for i in range(len(X)):
        ep = normalize_epoch(X[i])
        arr = to_model_input(ep, target_len=args.target_len)
        X_proc.append(arr)
    X_proc = np.stack(X_proc)
    # train/test split
    X_train, X_test, y_train, y_test = train_test_split(X_proc, y, test_size=0.2, random_state=42, stratify=y)
    model = build_model(X_proc.shape[1], X_proc.shape[2], n_classes=2)
    model.summary()
    es = keras.callbacks.EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)
    model.fit(X_train, y_train, validation_split=0.15, epochs=args.epochs, batch_size=args.batch, callbacks=[es])
    loss, acc = model.evaluate(X_test, y_test, verbose=0)
    print("Test acc:", acc)
    model.save(data_dir/"eeg_chbmit_model.h5")
    print("Saved model to", data_dir/"eeg_chbmit_model.h5")