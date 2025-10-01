import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../MainHome.css';

const RadarSignals = () => {
  const navigate = useNavigate();

  const radarTypes = [
    {
      id: 'drone',
      title: 'Drone Detection',
      description: 'Advanced radar systems for drone detection and tracking',
      icon: '🚁',
      features: [
        'Real-time drone tracking',
        'Multi-target detection',
        'Flight pattern analysis',
        'Threat assessment'
      ],
      gradient: 'linear-gradient(135deg, #00b894, #00a085)'
    },
    {
      id: 'submarine',
      title: 'Submarine Detection',
      description: 'Underwater radar systems for submarine detection',
      icon: '🚢',
      features: [
        'Sonar signal processing',
        'Underwater tracking',
        'Deep sea monitoring',
        'Advanced filtering'
      ],
      gradient: 'linear-gradient(135deg, #0984e3, #74b9ff)'
    },
    {
      id: 'sar',
      title: 'SAR Earthquake Detection',
      description: 'Synthetic Aperture Radar for earthquake monitoring',
      icon: '🌍',
      features: [
        'Ground displacement detection',
        'Seismic activity monitoring',
        'Geological analysis',
        'Early warning systems'
      ],
      gradient: 'linear-gradient(135deg, #e17055, #d63031)'
    }
  ];

  return (
    <div className="main-home">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Radar Signals</h1>
          <p className="hero-description">
            Advanced radar signal processing for surveillance, detection, and monitoring applications.
            From drone tracking to earthquake detection using cutting-edge radar technology.
          </p>
          <button 
            className="back-btn"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>
      </div>

      <div className="signal-types-section">
        <h2 className="section-title">Radar Applications</h2>
        <div className="signal-grid">
          {radarTypes.map((radar) => (
            <div
              key={radar.id}
              className="signal-card"
              style={{ background: radar.gradient }}
            >
              <div className="signal-card-header">
                <div className="signal-icon">{radar.icon}</div>
                <h3 className="signal-title">{radar.title}</h3>
              </div>
              <p className="signal-description">{radar.description}</p>
              
              <div className="key-features">
                <h4>⚡ Key Features:</h4>
                <ul className="features-list">
                  {radar.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button className="explore-btn">
                Coming Soon <span className="arrow">⏳</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RadarSignals;