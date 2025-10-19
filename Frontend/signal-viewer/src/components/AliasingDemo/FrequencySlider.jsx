import React from 'react';
import './FrequencySlider.css';

const FrequencySlider = ({ frequency, onFrequencyChange }) => {
  const presets = [
    { label: 'CD Quality', value: 44100, description: '44.1 kHz - Standard audio quality' },
    { label: 'High', value: 32000, description: '32 kHz - Good quality' },
    { label: 'Medium', value: 16000, description: '16 kHz - Noticeable aliasing' },
    { label: 'Low', value: 8000, description: '8 kHz - Heavy aliasing' }
  ];

  const nyquistFrequency = frequency / 2;
  const isAliasing = frequency < 40000;

  const handleSliderChange = (e) => {
    const newFreq = parseInt(e.target.value);
    console.log('Slider changed to:', newFreq);
    onFrequencyChange(newFreq);
  };

  const handlePresetClick = (value) => {
    console.log('Preset clicked:', value);
    onFrequencyChange(value);
  };

  // Determine aliasing level
  let aliasingLevel = 'None';
  let aliasingClass = 'good';
  let aliasingMessage = 'High quality audio - No aliasing detected';
  
  if (frequency < 16000) {
    aliasingLevel = 'High';
    aliasingClass = 'danger';
    aliasingMessage = 'Severe aliasing - Female voices sound like male';
  } else if (frequency < 32000) {
    aliasingLevel = 'Medium';
    aliasingClass = 'warning';
    aliasingMessage = 'Moderate aliasing - Voice sounds muffled and deeper';
  } else if (frequency < 40000) {
    aliasingLevel = 'Low';
    aliasingClass = 'caution';
    aliasingMessage = 'Slight aliasing - Some high frequency loss';
  }

  return (
    <div className="frequency-slider-container">
      <div className="slider-header">
        <h3>Sampling Frequency Control</h3>
        <div className="current-rate">
          <div className="rate-display">
            <span className="rate-value">{frequency.toLocaleString()} Hz</span>
            <span className="rate-label">Current Sampling Rate</span>
          </div>
          <div className="nyquist-display">
            <span className="nyquist-value">Nyquist: {nyquistFrequency.toLocaleString()} Hz</span>
            <span className="nyquist-label">Max Reproducible Frequency</span>
          </div>
        </div>
      </div>

      <div className="slider-wrapper">
        <div className="slider-track">
          <input
            type="range"
            min="8000"
            max="44100"
            step="100"
            value={frequency}
            onChange={handleSliderChange}
            className="frequency-slider"
          />
          <div 
            className="slider-fill" 
            style={{ width: `${((frequency - 8000) / (44100 - 8000)) * 100}%` }}
          />
        </div>
        <div className="slider-labels">
          <span className="label-min">8 kHz<br/><small>Telephone</small></span>
          <span className="label-mid">26 kHz<br/><small>FM Radio</small></span>
          <span className="label-max">44.1 kHz<br/><small>CD Quality</small></span>
        </div>
      </div>

      <div className="preset-buttons">
        <h4>Quick Presets:</h4>
        <div className="preset-grid">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={`preset-btn ${frequency === preset.value ? 'active' : ''}`}
              title={preset.description}
            >
              <span className="preset-label">{preset.label}</span>
              <span className="preset-freq">{(preset.value / 1000).toFixed(1)} kHz</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`aliasing-indicator ${aliasingClass}`}>
        <div className="indicator-header">
          <span className="indicator-icon">
            {aliasingClass === 'good' ? '✅' : aliasingClass === 'caution' ? '⚠️' : '🚨'}
          </span>
          <strong>Aliasing Level: {aliasingLevel}</strong>
        </div>
        <p className="indicator-message">{aliasingMessage}</p>
        <div className="indicator-bar">
          <div 
            className={`bar-fill ${aliasingClass}`}
            style={{ 
              width: aliasingClass === 'danger' ? '90%' : 
                     aliasingClass === 'warning' ? '60%' : 
                     aliasingClass === 'caution' ? '30%' : '0%' 
            }}
          />
        </div>
      </div>

      <div className="frequency-info">
        <h4>📊 Current Settings:</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🎚️</span>
            <div className="info-content">
              <strong>Sample Rate</strong>
              <span>{frequency.toLocaleString()} Hz</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📈</span>
            <div className="info-content">
              <strong>Nyquist Limit</strong>
              <span>{nyquistFrequency.toLocaleString()} Hz</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">⚡</span>
            <div className="info-content">
              <strong>Quality</strong>
              <span>{frequency >= 44100 ? 'CD' : frequency >= 32000 ? 'High' : frequency >= 16000 ? 'Medium' : 'Low'}</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🔊</span>
            <div className="info-content">
              <strong>Status</strong>
              <span>{isAliasing ? 'Aliasing' : 'Clear'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrequencySlider;