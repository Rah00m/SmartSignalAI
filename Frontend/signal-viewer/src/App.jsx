import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Mode1 from "./components/ECG/mode1";
import Mode3 from "./components/ECG/mode3";
import Mode2 from "./components/ECG/mode2";
import Mode4 from "./components/ECG/mode4";
import Mode5 from "./components/ECG/mode5";
import Mode6 from "./components/ECG/mode6";
import ECGHome from "./components/ECG/ecg_home";
import { ECGProvider } from "./components/ECG/ecgContext";
import "./App.css";

import MainHome from "./components/MainHome";
import MedicalSignals from "./components/Medical/MedicalSignals";
import AudioSignals from "./components/Audio/AudioSignals";
import RadarSignals from "./components/Radar/RadarSignals";

function App() {
  const [signalData, setSignalData] = useState(null);

  const handleDataFetched = (data) => {
    setSignalData(data);
    console.log("Data received from Mode1:", data);
    console.log("Data received:", data);
  };

  return (
    <ECGProvider>
      <Router>
        <div className="app-header">
          <h1 className="app-title">SmartSignalAI</h1>
        </div>
        <Routes>
          <Route path="/" element={<MainHome />} />
          <Route
            path="/mode1"
            element={<Mode1 onDataFetched={handleDataFetched} />}
          />
          <Route path="/mode2" element={<Mode2 signalData={signalData} />} />
          <Route path="/mode3" element={<Mode3 signalData={signalData} />} />
          <Route path="/mode4" element={<Mode4 signalData={signalData} />} />
          <Route path="/mode5" element={<Mode5 signalData={signalData} />} />
          <Route path="/mode6" element={<Mode6 signalData={signalData} />} />

          <Route path="/medical" element={<MedicalSignals />} />
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

          <Route path="/audio" element={<AudioSignals />} />
          <Route path="/radar" element={<RadarSignals />} />

          <Route
            path="/ecg"
            element={<ECGHome onDataFetched={handleDataFetched} />}
          />
        </Routes>
      </Router>
    </ECGProvider>
  );
}

export default App;
