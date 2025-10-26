# 🧠 SmartSignalAI: Intelligent Multi-Signal Analysis & Visualization Platform

![SmartSignalAI Header]

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/9bb80741-61ef-4722-8143-5972b2807d69" />

**SmartSignalAI** is a full-stack web platform that combines advanced **signal visualization** with **AI-based analysis**.  
It empowers users to upload, explore, and interpret multi-domain signals — including **medical (ECG/EEG)**, **acoustic (Doppler & drone)**, and **RF (SAR)** — through an intuitive web interface integrated with deep learning models for real-time detection and classification.

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Core Functionalities](#core-functionalities)
- [Signal Processing & AI Integration](#signal-processing--ai-integration)
- [Visualization Modes](#visualization-modes)
- [Web Application Design](#web-application-design)
- [Sampling & Anti-Aliasing Effects](#sampling--anti-aliasing-effects)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Demo](#project-demo)
- [Contact](#contact)

---

## 🌟 About The Project

**SmartSignalAI** demonstrates how artificial intelligence and interactive web technologies can come together to make signal analysis more accessible and intelligent.  
The project supports **multi-signal visualization**, **AI-driven abnormality detection**, **acoustic feature estimation**, and **RF data interpretation**, offering a unified, responsive interface for researchers and engineers.

The system was designed with scalability and real-time interaction in mind, combining **React.js** for front-end visualization, **Node.js** for backend communication, and **Python (TensorFlow)** for machine learning inference.

---

## ⚡ Core Functionalities

- **Multi-Signal Support:** Handles acoustic, medical, and RF signal formats.  
- **AI-Based Analysis:** Detects abnormalities, estimates parameters, and classifies patterns.  
- **Interactive Visualization:** Supports zoom, pan, playback, and multiple graph modes.  
- **Signal Simulation:** Users can generate and analyze signals dynamically.  
- **Real-Time Feedback:** Provides instant AI predictions and visual insights.  
- **User Customization:** Control color maps, time spans, and displayed channels.  

---

## 🧠 Signal Processing & AI Integration

SmartSignalAI integrates advanced processing pipelines with machine learning models across different domains:

### 🔉 Acoustic Analysis
- Simulates **vehicle Doppler effect** sounds based on user-controlled velocity and frequency.  
- Analyzes uploaded real-world sounds to **estimate vehicle speed and horn frequency** using spectral features.  
- Includes a **drone detection AI model** trained on environmental audio data to classify the presence of drones in ambient sounds.  

### ❤️ Medical Signal Interpretation
- Visualizes **multi-channel ECG and EEG** signals.  
- Employs pre-trained AI models to **detect abnormalities** (e.g., arrhythmias or irregular brain activity) from multi-channel data.  
- Supports advanced visualization styles for temporal and spatial signal understanding.  
- Integrates 2D CNNs trained on recurrence or polar representations for visual-based classification.  

### 📡 RF (SAR) Signal Analysis
- Visualizes **Synthetic Aperture Radar (SAR)** backscatter intensity data.  
- Uses AI algorithms to estimate:
  - Target presence and surface roughness  
  - Terrain type classification  
  - Intensity range and reflection characteristics  
- Designed for remote sensing, surface mapping, and Earth observation applications.  

---

## 📊 Visualization Modes

SmartSignalAI provides several innovative graph types that help users explore signals intuitively:

- **Continuous-Time Viewer:** Real-time scrolling signal view with full control over speed, zoom, and pan.  
- **XOR Graph:** Overlays signal segments and cancels identical regions to highlight differences.  
- **Polar Graph:** Displays magnitude and time in a circular representation (cumulative or live).  
- **Recurrence Graph:** Generates 2D scatter plots between channels to visualize repeating patterns and correlations.  

Each visualization mode includes user controls for time segmentation, color maps, and channel selection — enabling deep signal exploration from multiple perspectives.

---

## 💡 Web Application Design

The platform is fully web-based and developed with modular architecture:
- **Frontend (React.js):** Provides a dynamic dashboard for file uploads, real-time plots, and AI predictions.  
- **Backend (Node.js + Express.js):** Manages data routing, model communication, and API endpoints.  
- **AI Engine (Python + TensorFlow):** Runs inference and processing tasks via REST API integration.  

This layered design ensures high responsiveness, minimal latency, and smooth AI inference without interrupting the visualization experience.

---

## 🎛️ Sampling & Anti-Aliasing Effects

SmartSignalAI integrates a **sampling frequency control slider**, allowing users to dynamically adjust sampling rates and observe how **under-sampling** and **aliasing** distort both the signal and the AI model’s predictions.

Additionally:
- Users can upload **human voice samples** to classify gender (male/female).  
- Under-sampling can intentionally degrade the quality for demonstration.  
- The system then applies **anti-aliasing algorithms** to recover the signal and restore the AI model’s original accuracy.

This feature bridges the theory of digital signal processing with practical AI performance evaluation.

---

## 🛠️ Technology Stack

| Layer | Tools & Libraries |
|-------|-------------------|
| **Frontend** | React.js, Tailwind CSS, Plotly.js, Chart.js |
| **Backend** | Node.js, Express.js, JWT |
| **AI & Processing** | Python, TensorFlow, Keras, Librosa, NumPy, SciPy |
| **Deployment** | Vercel (Frontend), Flask/Heroku (AI Backend) |

---

## 🚀 Getting Started

To get a local copy up and running:

### Prerequisites
- Node.js and npm  
- Python 3.8+  
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/Rah00m/SmartSignalAI.git
cd SmartSignalAI

# Frontend setup
cd frontend
npm install

# Backend setup
cd ../backend
npm install

# AI engine setup
cd ../ai_engine
pip install -r requirements.txt
