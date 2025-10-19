import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainHome.css';

const MainHome = () => {
  const navigate = useNavigate();

  return (
    <div className="main-home-container">
      <header className="main-home-header">
        <h1 className="main-home-title">🧠 SmartSignalAI</h1>
        <p className="main-home-subtitle">
          Digital Signal Processing & AI Analysis Platform
        </p>
        <div className="main-home-badges">
          <span className="main-badge">Task 1: Signal Analysis</span>
          <span className="main-badge main-badge-new">Task 2: Aliasing Demo 🆕</span>
        </div>
      </header>

      <div className="main-home-grid">
        {/* Card 1: Medical Signals */}
        <div 
          className="main-home-card medical-card"
          onClick={() => navigate('/medical')}
        >
          <div className="card-icon">M</div>
          <h2 className="card-title">Medical Signals</h2>
          <p className="card-description">
            Advanced signal processing for medical diagnostics and monitoring
          </p>
          <ul className="card-features">
            <li>• ECG signal analysis</li>
            <li>• Heart rate monitoring</li>
            <li>• Abnormal beat detection</li>
            <li>• Multiple visualization modes</li>
          </ul>
          <button className="card-button">
            Explore Medical →
          </button>
        </div>

        {/* Card 2: Audio Signals */}
        <div 
          className="main-home-card audio-card"
          onClick={() => navigate('/audio')}
        >
          <div className="card-icon">A</div>
          <h2 className="card-title">Audio Signals</h2>
          <p className="card-description">
            Audio signal processing and frequency analysis
          </p>
          <ul className="card-features">
            <li>• Car sound analysis</li>
            <li>• Frequency spectrum analysis</li>
            <li>• Noise reduction</li>
            <li>• Real-time processing</li>
          </ul>
          <button className="card-button">
            Explore Audio →
          </button>
        </div>

        {/* Card 3: Radar Signals */}
        <div 
          className="main-home-card radar-card"
          onClick={() => navigate('/radar')}
        >
          <div className="card-icon">R</div>
          <h2 className="card-title">Radar Signals</h2>
          <p className="card-description">
            Advanced radar signal processing and target detection
          </p>
          <ul className="card-features">
            <li>• Target detection</li>
            <li>• Signal filtering</li>
            <li>• Range-Doppler processing</li>
            <li>• Track visualization</li>
          </ul>
          <button className="card-button">
            Explore Radar →
          </button>
        </div>

        {/* Card 4: Aliasing Demo - TASK 2 (NEW) */}
        <div 
          className="main-home-card aliasing-card new-feature"
          onClick={() => navigate('/aliasing-demo')}
        >
          <div className="new-badge-corner">NEW!</div>
          <div className="card-icon">🎤</div>
          <h2 className="card-title">Aliasing Demo</h2>
          <p className="card-description">
            Interactive demonstration of aliasing effects on speech signals
          </p>
          <ul className="card-features">
            <li>• Real-time audio playback</li>
            <li>• Dynamic sampling control</li>
            <li>• Frequency spectrum analysis</li>
            <li>• Voice transformation demo</li>
          </ul>
          <button className="card-button card-button-special">
            🎙️ Launch Demo →
          </button>
        </div>
      </div>

      {/* Info Footer */}
      <footer className="main-home-footer">
        <div className="footer-content">
          <h3>📊 About This Platform</h3>
          <div className="footer-grid">
            <div className="footer-item">
              <strong>Task 1: Signal Analysis</strong>
              <p>Comprehensive signal processing for medical diagnostics (ECG), audio analysis, and radar signal detection.</p>
            </div>
            <div className="footer-item">
              <strong>Task 2: Aliasing Demonstration</strong>
              <p>Interactive exploration of aliasing effects on speech signals, demonstrating the Nyquist-Shannon sampling theorem.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainHome;