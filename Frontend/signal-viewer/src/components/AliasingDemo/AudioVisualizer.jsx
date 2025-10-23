import React, { useEffect, useRef } from 'react';
import { analyzeAudioBuffer } from '../../utils/audioProcessing';

const AudioVisualizer = ({ audioBuffer, samplingRate, isPlaying }) => {
  const timeCanvasRef = useRef(null);
  const freqCanvasRef = useRef(null);
  const spectrogramCanvasRef = useRef(null);

  useEffect(() => {
    if (!audioBuffer) return;
    drawWaveform();
    drawSpectrum();
    drawSpectrogram();
  }, [audioBuffer, samplingRate]);

  const drawWaveform = () => {
    const canvas = timeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    if (!audioBuffer) return;

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Draw grid
    ctx.strokeStyle = '#ffffff11';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (i * height) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw waveform with improved algorithm
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const index = i * step + j;
        if (index < data.length) {
          const value = data[index];
          if (value < min) min = value;
          if (value > max) max = value;
        }
      }

      const yMin = (1 - min) * amp;
      const yMax = (1 - max) * amp;

      if (i === 0) {
        ctx.moveTo(i, yMin);
      }
      ctx.lineTo(i, yMin);
      ctx.lineTo(i, yMax);
    }

    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(width, amp);
    ctx.stroke();

    // Add labels with better info
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('Time Domain (Waveform)', 10, 25);
    
    ctx.font = '12px monospace';
    ctx.fillText(`Sample Rate: ${samplingRate.toLocaleString()} Hz`, 10, height - 30);
    ctx.fillText(`Duration: ${audioBuffer.duration.toFixed(2)}s`, 10, height - 10);
    ctx.fillText(`Samples: ${audioBuffer.length.toLocaleString()}`, width - 200, height - 10);
  };

  const drawSpectrum = () => {
    const canvas = freqCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    if (!audioBuffer) return;

    const data = audioBuffer.getChannelData(0);
    const fftSize = 2048;
    const binCount = 512;
    const barWidth = width / binCount;

    // Take middle section of audio for analysis
    const startSample = Math.floor(data.length / 2);
    const chunk = data.slice(startSample, startSample + fftSize);

    // Simple frequency analysis (using absolute values as approximation)
    const maxFreq = samplingRate / 2; // Nyquist frequency
    
    for (let i = 0; i < binCount; i++) {
      const index = Math.floor((i / binCount) * chunk.length);
      const value = Math.abs(chunk[index] || 0);
      const barHeight = value * height * 5; // Amplify for visibility
      
      // Color based on frequency - red for low, yellow for mid, green for high
      const frequency = (i / binCount) * maxFreq;
      let color;
      if (frequency < maxFreq * 0.33) {
        color = '#ff6b6b'; // Red - low frequencies
      } else if (frequency < maxFreq * 0.66) {
        color = '#ffd93d'; // Yellow - mid frequencies
      } else {
        color = '#6bcf7f'; // Green - high frequencies
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }

    // Draw Nyquist frequency line
    const nyquist = samplingRate / 2;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw frequency markers
    const freqMarkers = [0, nyquist / 2, nyquist];
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    freqMarkers.forEach((freq, idx) => {
      const x = (idx / 2) * width;
      ctx.fillText(`${(freq / 1000).toFixed(1)}k`, x + 5, height - 5);
    });

    // Add labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('Frequency Domain (Spectrum)', 10, 25);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`← Nyquist: ${nyquist.toLocaleString()} Hz →`, width / 2 - 100, 50);
    
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.fillText('Frequencies above Nyquist will ALIAS down', 10, height - 25);
  };

  const drawSpectrogram = () => {
    const canvas = spectrogramCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    if (!audioBuffer) return;

    const data = audioBuffer.getChannelData(0);
    const nyquist = samplingRate / 2;

    // Draw frequency regions
    const regions = [
      { start: 0, end: 0.25, color: '#ff6b6b44', label: 'Bass (0-' + (nyquist * 0.25 / 1000).toFixed(1) + 'kHz)' },
      { start: 0.25, end: 0.5, color: '#ffd93d44', label: 'Mid (' + (nyquist * 0.25 / 1000).toFixed(1) + '-' + (nyquist * 0.5 / 1000).toFixed(1) + 'kHz)' },
      { start: 0.5, end: 0.75, color: '#6bcf7f44', label: 'High (' + (nyquist * 0.5 / 1000).toFixed(1) + '-' + (nyquist * 0.75 / 1000).toFixed(1) + 'kHz)' },
      { start: 0.75, end: 1.0, color: '#a78bfa44', label: 'Very High (' + (nyquist * 0.75 / 1000).toFixed(1) + '-' + (nyquist / 1000).toFixed(1) + 'kHz)' }
    ];

    regions.forEach(region => {
      ctx.fillStyle = region.color;
      ctx.fillRect(0, region.start * height, width, (region.end - region.start) * height);
      
      ctx.fillStyle = region.color.replace('44', 'ff');
      ctx.font = 'bold 12px monospace';
      ctx.fillText(region.label, 10, region.start * height + 20);
    });

    // Draw Nyquist limit line
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Add info
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Frequency Band Analysis', 10, 30);
    
    ctx.font = '13px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Nyquist Limit: ${nyquist.toLocaleString()} Hz`, width - 250, height - 10);
    
    // Add aliasing warning if needed
    if (samplingRate < 40000) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('⚠️ ALIASING ZONE - Frequencies fold back!', width / 2 - 200, height / 2);
    }
  };

  const stats = audioBuffer ? analyzeAudioBuffer(audioBuffer) : null;

  return (
    <div className="audio-visualizer">
      <div className="visualizer-panel">
        <canvas 
          ref={timeCanvasRef} 
          width={1000} 
          height={250}
          style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
        />
      </div>
      
      <div className="visualizer-panel">
        <canvas 
          ref={freqCanvasRef} 
          width={1000} 
          height={250}
          style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
        />
      </div>

      <div className="visualizer-panel">
        <canvas 
          ref={spectrogramCanvasRef} 
          width={1000} 
          height={200}
          style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
        />
      </div>

      {stats && (
        <div className="stats-panel">
          <h4>📊 Audio Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Sample Rate:</span>
              <span className="stat-value">{stats.sampleRate.toLocaleString()} Hz</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Nyquist Frequency:</span>
              <span className="stat-value">{stats.nyquistFrequency.toLocaleString()} Hz</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Duration:</span>
              <span className="stat-value">{stats.duration.toFixed(2)}s</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Samples:</span>
              <span className="stat-value">{stats.length.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Peak Amplitude:</span>
              <span className="stat-value">{(stats.peak * 100).toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">RMS Level:</span>
              <span className="stat-value">{(stats.rms * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="observation-panel">
        <h4>⚠️ What to Observe:</h4>
        <ul>
          <li><strong>44.1 kHz (CD Quality):</strong> Full frequency range, clear audio, Nyquist = 22.05 kHz</li>
          <li><strong>32 kHz:</strong> Nyquist = 16 kHz, slight high-frequency loss</li>
          <li><strong>16 kHz:</strong> Nyquist = 8 kHz, voice sounds muffled and deeper</li>
          <li><strong>8 kHz (Telephone):</strong> Nyquist = 4 kHz, severe aliasing, female → male voice</li>
        </ul>
        <p className="aliasing-explanation">
          <strong>Why female voices sound like male:</strong> Female voices have fundamental frequencies around 165-255 Hz with rich harmonics above 3-4 kHz. When sampling below Nyquist rate, these high harmonics "fold back" and appear as lower frequencies, making the voice sound deeper and more masculine.
        </p>
      </div>
    </div>
  );
};

export default AudioVisualizer;