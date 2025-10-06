import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DroneDetection from "./DroneDetection";
import RadioFrequency from "./RadioFrequency";
import "./RadarSignals.css";

const RadarSignals = () => {
  const [activeTab, setActiveTab] = useState("drone");
  const navigate = useNavigate();

  return (
    <div className="radar-signals-container">
      {/* Header */}
      <div className="radar-header">
        <h1>🛰️ Radar Signal Processing</h1>
        <p>Advanced radar signal analysis and detection systems</p>
      </div>

      {/* Navigation Tabs */}
      <div className="radar-tabs">
        <button
          className="back-button"
          onClick={() => navigate("/")}
          type="button"
        >
          🏠 Back to Home
        </button>
        <button
          className={`radar-tab ${activeTab === "drone" ? "active" : ""}`}
          onClick={() => setActiveTab("drone")}
        >
          🚁 Drone Detection
        </button>
        <button
          className={`radar-tab ${activeTab === "rf" ? "active" : ""}`}
          onClick={() => setActiveTab("rf")}
        >
          📡 RF Signals Viewer
        </button>
      </div>

      {/* Content */}
      <div className="radar-content">
        {activeTab === "drone" && <DroneDetection />}
        {activeTab === "rf" && <RadioFrequency />}
      </div>
    </div>
  );
};

export default RadarSignals;
