# 🧠 SmartSignalAI: A Full-Stack Platform for Signal Processing & AI

Welcome to **SmartSignalAI**, a comprehensive, full-stack application designed to explore, analyze, and apply AI to a wide variety of signal processing domains.

This platform integrates interactive modules for **Medical Signals (ECG/EEG)**, **Audio Signals**, and **Radar Signals**, bridging the gap between advanced **Digital Signal Processing (DSP)** and **AI-driven analysis**.

This project features:
1.  **A React Frontend:** An interactive dashboard and in-browser "lab" for real-time visualization, simulation, and analysis.
2.  **A Python (FastAPI) Backend:** An AI-powered service hosting multiple models for diagnosis (medical) and restoration (audio).

---

## 🚀 Core Modules

The application is organized into distinct modules, each targeting a specific signal-processing domain.



* 🩺 **Medical Signals:** Advanced processing for **ECG** (Electrocardiogram) and **EEG** (Electroencephalogram) signals for medical diagnostics and monitoring.
* 🎧 **Audio Signals:** Tools for audio processing, frequency analysis, noise reduction, and car sound analysis.
* 🛰️ **Radar Signals:** Advanced processing for radar data, including target detection, signal filtering, and Range-Doppler processing.
* 🎛️ **Aliasing Demo:** An interactive demonstrator (for audio) to explore, understand, and correct aliasing effects using AI.
<img width="1899" height="911" alt="Image" src="https://github.com/user-attachments/assets/52ccb6fd-01b7-4558-a9b6-68d3cf6bac7d" />
---

## 🩺 Deep Dive: Medical Signal Analysis (ECG)

The medical module provides a powerful dashboard for analyzing 12-lead ECG data. After selecting a patient and a recording, you have access to three primary analysis sections.

<img width="1918" height="912" alt="Image" src="https://github.com/user-attachments/assets/91287a30-0d39-4b31-ab32-7def2750e3b0" />

### A. Real-Time Monitor Dashboard

This is the main hub for ECG analysis, containing three integrated tools:

**1. 12-Lead Monitor**
A fully interactive 12-lead ECG monitor that allows:
* **Channel Selection:** Select all 12 channels or toggle specific leads (e.g., V1-V6, aVR, aVL) to focus the view.
* **Playback Controls:** Adjust the **Scroll Speed** and the **View Duration** (e.g., 10 seconds) of the visible signal.



**2. AI-Powered Analysis**
This section runs a pretrained AI model on the 12-lead data to provide a clinical diagnosis.
* **Final Diagnosis:** Displays the top-level finding (e.g., **Dysrhythmia**).
* **Confidence & Risk:** Provides a confidence score and risk level for the diagnosis.

<img width="1919" height="912" alt="Image" src="https://github.com/user-attachments/assets/a8108a43-ed73-489c-ac26-130d7bfc503d" />

**3. Sampling & Aliasing Controls**
A practical DSP lab built into the ECG monitor to demonstrate the Nyquist theorem on real medical data.
* **Downsampling:** A slider allows you to change the **Display Sampling Frequency** to simulate a lower-quality sensor.
* **Anti-Aliasing Filter:** A checkbox to **Apply Anti-Aliasing Filter** (a low-pass filter) *before* downsampling to correctly prevent distortion.
* **Demonstrate Aliasing Effect:** A toggle that shows the severe signal distortion (aliasing) that occurs when downsampling *without* the anti-aliasing filter.

<img width="1919" height="913" alt="Image" src="https://github.com/user-attachments/assets/0df98751-f366-41dd-9420-2f6428a11aee" />

### B. Polar Graph & Scatter Plot

This section provides advanced visualization tools for analyzing the relationships *between* ECG channels.

* **Polar Graph:** Visualizes the cardiac vector in a polar coordinate system. You can control the **Display Mode** (e.g., Fixed Time Window) and **Cycle Length**.
* **Scatter Plot:** Plots the signal values of two selected channels against each other (e.g., Lead I vs. Lead II) to show their correlation.

<img width="1919" height="914" alt="Image" src="https://github.com/user-attachments/assets/1364473b-ea57-4dc0-9603-08b9e572f832" />


### C. XOR Graph Viewer

A specialized tool for detecting subtle changes or anomalies in a single ECG channel over time.

* **Logic:** This graph plots the *difference* (XOR) between one signal chunk and the next. A flat line means the heartbeats are identical, while spikes indicate a change or arrhythmia.
* **Controls:** You can select the **ECG Channel**, adjust the **Time Chunk** size (how many seconds to compare), and set the **Similarity Threshold** to control sensitivity.
* **Cumulative View:** A second graph shows a cumulative sum of all differences, highlighting exactly *when* in the recording the most significant changes occurred.

<img width="1919" height="916" alt="Image" src="https://github.com/user-attachments/assets/265dc9cc-e442-4a54-9f8d-1106325faad4" />

---

## 🧠 Deep Dive: Medical Signal Analysis (EEG)

This module features a comprehensive **19-Channel EEG Multi-View Monitor**, offering a dynamic and interactive platform for analyzing electroencephalogram data, similar to the ECG monitoring section.

**Key Features:**

* **Live Monitoring:** A real-time dashboard displays EEG signals as they are processed, with controls to start, pause, and restart the live feed.
* **Feature & Channel Selection:** Easily load and select specific EEG feature files (like `.npy` files). You can then choose from a 19-channel grid (including Pz, Cz, F8, F7, etc.) to isolate and analyze specific signals.
<img width="1918" height="916" alt="Image" src="https://github.com/user-attachments/assets/52716668-7a04-4429-a1bc-a00f70f3bb94" />

* **Advanced Visualization Modes:**
    * **Real-time View:** A standard time-series plot to watch signal waveforms.
    * **Polar View:** An advanced plot that visualizes the signal's phase and magnitude, which is excellent for frequency and stability analysis.
<img width="1916" height="917" alt="Image" src="https://github.com/user-attachments/assets/767b2742-e56e-4c3e-a729-677bfd9abb94" />
<br/>
    * **XOR View:** A specialized view for feature analysis.
<img width="1919" height="911" alt="Image" src="https://github.com/user-attachments/assets/f90c643f-e1dc-4694-b11a-f5a51fc98e5f" />
<br/>
* **Sampling Frequency Control:** An interactive slider allows you to adjust the sampling frequency (from 16 Hz to 256 Hz) to instantly see its effect on the displayed signals, helping to demonstrate concepts like aliasing and signal fidelity.

---

## 🎧 Deep Dive: Audio Signal Analysis

This module offers a suite of tools for processing and analyzing various audio signals, including frequency analysis and noise reduction.



### 🔉 Acoustic Signal Analysis

#### Vehicle Doppler Effect

This module provides a dual-functionality tool for understanding the Doppler effect.

1.  **Sound Generation:**
    -   Users can input a **vehicle speed** (`v` in m/s) and a **base horn frequency** (`f` in Hz).
    -   The application generates a realistic audio clip simulating the sound of a car passing by, accurately modeling the frequency shift (Doppler effect).

2.  **Sound Analysis:**
    -   Users can upload a real audio file of a passing car.
    -   The application employs an AI model to analyze the recording and estimates the vehicle's **velocity** and the horn's original **frequency**.
    -   It displays three key plots: the **frequency spectrogram**, **amplitude vs. time**, and the estimated parameters.


---

## 🛰️ Deep Dive: Radar Signal Analysis

This module is designed for advanced radar signal processing, focusing on target detection and visualization.

#### 🚁 Drone Audio Detection

-   Upload any audio file (e.g., sounds from nature, other machinery).
-   A sophisticated AI classifier analyzes the audio's acoustic features.
-   The system provides a confident prediction on whether the sound contains a **drone**, distinguishing it from other ambient noises like birds or wind.

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/f72db75e-d680-461e-aa83-5587e08a578a" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/cab38e37-f3ab-463e-ba69-1da270b70660" />

### 📡 Radiofrequency (RF) Signal Analysis

#### SAR Backscatter Analysis

This module is designed to process and interpret Synthetic Aperture Radar (SAR) data.

-   **Data Loading:** Load real-world SAR backscatter profiles, such as data from the ICEYE satellite over the West Angelas Mine.
-   **Signal Visualization:** Displays the **Normalized Backscatter Intensity** against the **Range/Distance**, allowing for the identification of significant features in the terrain.
-   **Statistical Analysis:** The AI model automatically extracts key information from the SAR profile, including:
    -   **Target Detection:** Identifies if bright targets are present.
    -   **Surface Roughness:** Calculates a quantitative value for the terrain's roughness.
    -   **Terrain Classification:** Classifies the surface type (e.g., Homogeneous Surface).
    -   **Intensity Range:** Measures the dynamic range of the backscatter in dB.
    -   **Confidence Score:** Provides the model's confidence in its analysis.
**SAR Signal Upload & Visualization**
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/0adf0564-a4f9-449c-941c-b8e7521ea423" />


**SAR Analysis Results**
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/ae89b801-27fd-413f-8306-960b2cd8f32f" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/40c99c78-5dcb-49d7-b2fa-065de757336d" />
---

## 🎛️ Deep Dive: AI Anti-Aliasing & Audio Restoration Demo

This module provides an in-browser "lab" to explore and correct *audio* aliasing.

### 🧩 Step 1: The Main Interface

When you first load this module, you’ll see two panels side-by-side:

* **Left Panel (Simulator):** Create and explore aliasing effects.
* **Right Panel (Enhancer):** Upload and enhance your own audio files.

<img width="1366" height="768" alt="Main Interface" src="https://github.com/user-attachments/assets/4b2da582-7ad9-4529-bb6a-657e15e0d360" />

### 🎛️ Step 2: Simulating Aliasing (Left Panel)

* **Frequency Slider:** Move from 44.1 kHz (CD quality) to 8 kHz (telephone quality) to simulate real aliasing.
* **Nyquist Limit:** Displays the cutoff frequency (Sample Rate ÷ 2).
* **Select Audio Sample:** Choose between “Female Voice” and “Male Voice.”

<img width="1366" height="768" alt="AI Enhancement Button" src="https://github.com/user-attachments/assets/e3dc6265-af00-4d79-8e79-d74d5fd7eb2d" />

### 🧠 Step 3: Creating Your AI Training Dataset

Click **Download for AI Training** to save your distorted audio. This creates a pair for supervised learning:

* **Input (X):** `aliased_8000Hz_female.wav`
* **Target (Y):** `female-voice.wav`

### 🚀 Step 4: “Live” AI Restoration (Left Panel)

* **Enhance with AI:** Sends your distorted audio to the **FastAPI + VoiceFixer** backend.
* **Backend Processing:** AI performs audio super-resolution and high-frequency recovery.
* **Result:** The restored, 48 kHz audio is streamed back for playback.

<img width="1366" height="768" alt="Aliasing Controls" src="https://github.com/user-attachments/assets/fccf43ea-b4c4-469a-b06b-2f40b9048706" />

### 🔄 Step 5: The A/B Comparison (Right Panel)

The right panel provides an independent **upload-and-enhance tool** to compare "Original" vs. "Enhanced" audio directly.

---

## 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React.js, JavaScript (ES6+), Web Audio API, CSS3 |
| **Backend** | Python 3, FastAPI |
| **AI Models** | **ECG:** Custom-trained CNN for arrhythmia classification<br/>**Audio:** VoiceFixer (Audio Super-Resolution)<br/>**(Placeholder)** *Add EEG/Radar models here* |
| **Signal Processing** | Librosa (Python), Custom DSP (JS & Python) |


## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js & npm
-   Python 3.8+ & pip

### Installation

1.  **Clone the repo**
    ```sh
    git clone [https://github.com/your_username/SmartSignalAI.git](https://github.com/your_username/SmartSignalAI.git)
    ```
2.  **Install Frontend dependencies**
    ```sh
    cd SmartSignalAI/frontend
    npm install
    ```
3.  **Install Backend dependencies**
    ```sh
    cd ../backend
    pip install -r requirements.txt
    ```
4.  **Run the Backend Server**
    ```sh
    python app.py
    ```
5.  **Run the Frontend Development Server**
    ```sh
    # In the /frontend directory
    npm run dev
    ```

Task_2_repo
(https://github.com/Rah00m/SmartSignalAI.git)

## 🎥 Project Demo

[Watch the demo on Google Drive](https://drive.google.com/file/d/1iMNHWGTaI8RKim0jIsE05qOofzlQ24LT/view?usp=sharing](https://drive.google.com/drive/folders/1ylN-hL4yb55ZEAJIzW9zJcG-YnWvKPua?usp=sharing)

---

> 🩺 🎶 🛰️ *SmartSignalAI lets you see, hear, and understand signals — and how AI can be used to analyze them.*
