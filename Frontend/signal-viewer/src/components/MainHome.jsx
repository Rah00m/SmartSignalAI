import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainHome.css';

const MainHome = () => {
  const navigate = useNavigate();

  const signalCategories = [
    {
      id: 'medical',
      title: 'Medical Signals',
      description: 'Signal viewer and analyser for Medical signals',
      icon: '❤️',
      features: [
        'ECG monitoring and analysis',
        'EEG signal processing',
        'Real-time medical data visualization',
        'Advanced filtering techniques'
      ],
      route: '/medical',
      gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
    },
    {
      id: 'audio',
      title: 'Audio Signals',
      description: 'Signal viewer and analyser for Car Audio signals',
      icon: '🔊',
      features: [
        'Car sound analysis',
        'Audio frequency analysis',
        'Noise reduction',
        'Real-time audio processing'
      ],
      route: '/audio',
      gradient: 'linear-gradient(135deg, #74b9ff, #0984e3)'
    },
    {
      id: 'radar',
      title: 'Radar Signals',
      description: 'Signal viewer and analyser for Radar signals',
      icon: '📡',
      features: [
        'Drone detection and tracking',
        'Submarine signal analysis',
        'SAR for earthquake detection',
        'Advanced radar processing'
      ],
      route: '/radar',
      gradient: 'linear-gradient(135deg, #00b894, #00a085)'
    }
    // Removed DSP Tasks card
  ];

  return (
    <div className="main-home">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Signal Viewer</h1>
          <p className="hero-description">
            Welcome to the Signal Viewer! This tool allows you to visualize and
            analyze signals in real-time. Choose from various signal types to
            explore their characteristics and behavior.
          </p>
        </div>
      </div>

      {/* Available Signal Types Section */}
      <div className="signal-types-section">
        <h2 className="section-title">Available Signal Types</h2>
        <div className="signal-grid">
          {signalCategories.map((category) => (
            <div
              key={category.id}
              className="signal-card"
              style={{ background: category.gradient }}
              onClick={() => navigate(category.route)}
            >
              <div className="signal-card-header">
                <div className="signal-icon">{category.icon}</div>
                <h3 className="signal-title">{category.title}</h3>
              </div>
              <p className="signal-description">{category.description}</p>
              
              <div className="key-features">
                <h4>⚡ Key Features:</h4>
                <ul className="features-list">
                  {category.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button className="explore-btn">
                Explore <span className="arrow">→</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="footer-section">
        <div className="footer-content">
          <div className="footer-column">
            <h3>SmartSignalAI</h3>
            <p>Advanced signal processing and analysis platform for multiple signal types.</p>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <div className="quick-links">
              <span onClick={() => navigate('/medical')}>Medical Signals</span>
              <span onClick={() => navigate('/audio')}>Audio Signals</span>
              <span onClick={() => navigate('/radar')}>Radar Signals</span>
            </div>
          </div>
          <div className="footer-column">
            <h4>Connect</h4>
            <div className="social-links">
              <span 
                onClick={() => window.open('https://github.com/Rah00m/SmartSignalAI', '_blank')}
                style={{ cursor: 'pointer' }}
              >
                🔗 GitHub
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainHome;