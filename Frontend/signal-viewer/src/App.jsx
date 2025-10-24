import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ECGProvider } from "./components/ECG/ecgContext";
import "./App.css";

// Main Home
import MainHome from "./components/MainHome";

// Medical/ECG Components
import MedicalSignals from "./components/Medical/MedicalSignals";
import ECGHome from "./components/ECG/ecg_home";
import Dashboard from "./components/ECG/Dashboard";
import Mode1 from "./components/ECG/mode1";
import Mode3 from "./components/ECG/mode3";
import Mode4 from "./components/ECG/mode4";

// EEG Components
import EEGViewer from "./components/EEG/EEGViewer";

// Audio Components
import AudioSignals from "./components/Audio/AudioSignals";

// Radar Components
import RadarSignals from "./components/Radar/RadarSignals";

// Task 2: Aliasing Demo
import AliasingDemo from "./components/AliasingDemo/AliasingDemo";

function App() {
  const [signalData, setSignalData] = useState(null);

  const handleDataFetched = (data) => {
    setSignalData(data);
    console.log("Data received from ECG:", data);
  };

  return (
    <ECGProvider>
      <Router>
        <div className="app-header">
          <h1 className="app-title">SmartSignalAI</h1>
        </div>

        <div className="app-container">
          <Routes>
            {/* Main Home */}
            <Route path="/" element={<MainHome />} />

            {/* Medical Signals */}
            <Route path="/medical" element={<MedicalSignals />} />

            {/* ECG Routes */}
            <Route
              path="/medical/ecg"
              element={<ECGHome onDataFetched={handleDataFetched} />}
            />
            <Route
              path="/medical/ecg/mode1"
              element={<Mode1 onDataFetched={handleDataFetched} />}
            />
            <Route
              path="/medical/ecg/mode3"
              element={<Mode3 signalData={signalData} />}
            />
            <Route
              path="/medical/ecg/mode4"
              element={<Mode4 signalData={signalData} />}
            />
            <Route path="/medical/ecg/dashboard" element={<Dashboard />} />

            {/* EEG Routes */}
            <Route path="/medical/eeg" element={<EEGViewer />} />

            {/* Audio Signals */}
            <Route path="/audio" element={<AudioSignals />} />

            {/* Radar Signals */}
            <Route path="/radar" element={<RadarSignals />} />

            {/* Task 2: Aliasing Demo */}
            <Route path="/aliasing-demo" element={<AliasingDemo />} />

            {/* Legacy/fallback routes */}
            <Route
              path="/ecg"
              element={<ECGHome onDataFetched={handleDataFetched} />}
            />
          </Routes>
        </div>
      </Router>
    </ECGProvider>
  );
}

export default App;
