[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Edij74kj)

# 🧠 SmartSignalAI: Advanced Signal Viewer & Processor

![SmartSignalAI Header]

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/9bb80741-61ef-4722-8143-5972b2807d69" />


**SmartSignalAI** is a powerful, web-based platform for visualizing and analyzing a diverse range of signals. Leveraging advanced signal processing techniques and pre-trained AI models, this tool provides insightful analysis for acoustic, radiofrequency (RF), and medical signals.

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#-key-features)
- [Modules in Detail](#-modules-in-detail)
  - [Acoustic Signal Analysis](#-acoustic-signal-analysis)
  - [Radiofrequency (RF) Signal Analysis](#-radiofrequency-rf-signal-analysis)
  - [Medical Signal Analysis](#-medical-signal-analysis)
- [📸 Screenshots](#-screenshots)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Getting Started](#-getting-started)
- [License](#-license)
- [Contact](#-contact)

---

## 🌟 About The Project

The goal of SmartSignalAI is to provide an intuitive yet powerful interface for engineers, researchers, and enthusiasts to interact with complex signal data. From simulating the Doppler effect in passing cars to detecting drones and analyzing real satellite radar data, this project showcases the practical applications of AI in signal processing.

---

## ✨ Key Features

-   **Multi-Signal Support:** Analyze Acoustic, RF (SAR), and Medical (ECG/EEG) signals.
-   **AI-Powered Insights:** Utilizes pre-trained models for detection, classification, and parameter estimation.
-   **Interactive Visualizations:** Offers dynamic plots and graphs for comprehensive data exploration.
-   **Signal Generation:** Synthesize signals based on user-defined physical parameters.
-   **User-Friendly Interface:** A clean, modern web UI for easy file uploads and analysis.

---

## 🔬 Modules in Detail

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

#### 🚁 Drone Audio Detection

-   Upload any audio file (e.g., sounds from nature, other machinery).
-   A sophisticated AI classifier analyzes the audio's acoustic features.
-   The system provides a confident prediction on whether the sound contains a **drone**, distinguishing it from other ambient noises like birds or wind.

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

### ❤️‍🩹 Medical Signal Analysis

#### ECG & EEG Viewer

This module is a comprehensive tool for medical signal interpretation.

-   **AI-Powered Diagnosis:** Upon loading a multi-channel ECG or EEG file, a pre-trained AI model instantly classifies the signal as **normal** or **abnormal**, identifying the specific type of abnormality (from four distinct pre-defined types).
-   **Advanced Visualization Modes:**
    -   **Continuous Viewer:** A standard scrolling view with controls for play/pause, speed, pan, and zoom.
    -   **XOR Graph:** Overlays signal chunks to highlight variations; identical segments cancel each other out, making differences immediately apparent.
    -   **Polar Graph:** Maps signal magnitude (`r`) and time (`θ`) onto a polar plot, available in both cumulative and real-time modes.
    -   **Recurrence Graph:** Creates a cumulative scatter plot for any two selected channels (`chX`, `chY`) to reveal recurring patterns.
-   **2D Model Classification:** Utilizes a 2D representation (e.g., from the Recurrence or Polar graph) to train a separate vision-based model for abnormality classification, offering a multi-modal approach to diagnosis.

---

## 📸 Screenshots of the functionalities

### Acoustic Signal Processing

**Doppler Effect - Sound Generation & Analysis**
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/8441fe76-3f53-4ceb-9d0c-d693d02fcf8c" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/149ccbd8-1f8d-42bb-8dc0-8cb8cb10a75f" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/a7f418d5-c12b-4de1-b7e0-2d09a9923538" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/3fe6e062-e4dd-40df-befd-f147ee22e25c" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/55abf13d-f90a-41ec-940b-10647007e757" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/4184e60a-5805-4f3d-9420-2e8791757f64" />


**Drone Audio Detection**
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/f72db75e-d680-461e-aa83-5587e08a578a" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/cab38e37-f3ab-463e-ba69-1da270b70660" />

### RF Signal Processing

**SAR Signal Upload & Visualization**
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/0adf0564-a4f9-449c-941c-b8e7521ea423" />


**SAR Analysis Results**
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/ae89b801-27fd-413f-8306-960b2cd8f32f" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/40c99c78-5dcb-49d7-b2fa-065de757336d" />


### Medical Signal Processing

**ECG/EEG Abnormality Detection**
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/ee1e0fc7-3b3e-4ce7-b2e7-d650fa917133" />


---

## 🛠️ Technology Stack

-   **Frontend:** SvelteKit, Vite, Chart.js, Tailwind CSS
-   **Backend:** Python (Flask / FastAPI)
-   **AI & Signal Processing:** TensorFlow, Keras, Librosa, NumPy, SciPy
-   **Deployment:** Vercel / Netlify (Frontend), Heroku / DigitalOcean (Backend)

---

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

Task_1_repo
(https://github.com/Rah00m/SmartSignalAI.git)



