import React from "react";
import { useNavigate } from "react-router-dom";
import "./MedicalSignals.css";

const MedicalSignals = () => {
  const navigate = useNavigate();

  const medicalSignalTypes = [
    {
      id: "ecg",
      title: "ECG",
      description: "Signal viewer and analyser for ECG signals",
      icon: "❤️",
      features: [
        "Real-time ECG monitoring",
        "User-friendly interface",
        "Data visualization",
        "Advanced signal processing",
      ],
      route: "/medical/ecg",
      gradient: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
      color: "#ff6b6b",
    },
    {
      id: "eeg",
      title: "EEG",
      description: "Signal viewer and analyser for EEG signals",
      icon: "🧠",
      features: [
        "Real-time EEG monitoring",
        "User-friendly interface",
        "Data visualization",
        "Brain activity analysis",
      ],
      route: "/medical/eeg",
      gradient: "linear-gradient(135deg, #a29bfe, #6c5ce7)",
      color: "#a29bfe",
    },
  ];

  return (
    <div className="medical-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🏥 Medical Signal Processing</div>
          <h1 className="hero-title">
            SmartSignal<span className="hero-title-accent">AI</span> Medical
          </h1>
          <p className="hero-description">
            Comprehensive medical signal analysis tools for ECG and EEG
            monitoring. Advanced algorithms for real-time processing and
            visualization.
          </p>
          <button className="back-btn" onClick={() => navigate("/")}>
            🏠 Back to Home
          </button>
        </div>
      </div>

      {/* Signal Types Section */}
      <div className="content-container">
        <div className="section-card">
          <h2 className="section-title">Available Medical Signal Types</h2>
          <p className="section-description">
            Choose from our advanced medical signal analysis tools
          </p>

          <div className="signal-grid">
            {medicalSignalTypes.map((signal) => (
              <div
                key={signal.id}
                className="signal-card"
                style={{
                  background: signal.gradient,
                  borderColor: signal.color,
                }}
                onClick={() => navigate(signal.route)}
              >
                <div className="signal-card-header">
                  <div
                    className="signal-icon"
                    style={{
                      background: `rgba(255, 255, 255, 0.2)`,
                      border: `2px solid rgba(255, 255, 255, 0.3)`,
                    }}
                  >
                    {signal.icon}
                  </div>
                  <h3 className="signal-title">{signal.title}</h3>
                </div>
                <p className="signal-description">{signal.description}</p>

                <div className="key-features">
                  <h4>⚡ Key Features:</h4>
                  <ul className="features-list">
                    {signal.features.map((feature, index) => (
                      <li key={index} className="feature-item">
                        <span className="feature-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className="explore-btn"
                  style={{
                    background: `rgba(255, 255, 255, 0.2)`,
                    border: `1px solid rgba(255, 255, 255, 0.3)`,
                  }}
                >
                  Explore <span className="arrow">→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalSignals;
