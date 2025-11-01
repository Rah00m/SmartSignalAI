import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DroneDetection from "./DroneDetection";
import RadioFrequency from "./RadioFrequency";
import "./RadarSignals.css";

const RadarSignals = () => {
  const [activeTab, setActiveTab] = useState("drone");
  const navigate = useNavigate();

  return (
    <div className="radar-page">
      {/* Hero Section - نفس تصميم الأوديو */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🛰️ Advanced Radar Processing</div>
          <h1 className="hero-title">
            SmartSignal<span className="hero-title-accent">AI</span> Radar
          </h1>
          <p className="hero-description">
            Advanced radar signal analysis and detection systems with real-time
            processing
          </p>
          <button className="back-btn" onClick={() => navigate("/")}>
            🏠 Back to Home
          </button>
        </div>
      </div>

      {/* Tabs Navigation - نفس تصميم الأوديو */}
      <div className="tabs-container">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === "drone" ? "active" : ""}`}
            onClick={() => setActiveTab("drone")}
          >
            <span className="tab-icon">🚁</span>
            Drone Detection
          </button>
          <button
            className={`tab-btn ${activeTab === "rf" ? "active" : ""}`}
            onClick={() => setActiveTab("rf")}
          >
            <span className="tab-icon">📡</span>
            RF Signals Viewer
          </button>
        </div>
      </div>

      {/* Content Container - نفس تصميم الأوديو */}
      <div className="content-container">
        <div className="section-card">
          <div className="radar-content">
            {activeTab === "drone" && <DroneDetection />}
            {activeTab === "rf" && <RadioFrequency />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarSignals;
