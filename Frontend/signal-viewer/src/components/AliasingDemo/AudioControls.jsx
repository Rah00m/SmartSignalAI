import React, { useState } from 'react';

const AudioControls = ({ 
  isPlaying, 
  onPlay, 
  onPause, 
  onStop, 
  audioFile, 
  onAudioFileChange,
  processedBuffer,  // NEW: Add processed buffer prop
  samplingRate      // NEW: Add sampling rate prop
}) => {
  const [selectedFile, setSelectedFile] = useState('female');

  const audioFiles = [
    { 
      id: 'female', 
      label: '👩 Female Voice', 
      file: '/assets/audio/female-voice.wav',
      description: 'High-pitched voice - shows aliasing effects clearly'
    },
    { 
      id: 'male', 
      label: '👨 Male Voice', 
      file: '/assets/audio/male-voice.wav',
      description: 'Lower-pitched voice - less affected by aliasing'
    },
    { 
      id: 'mixed', 
      label: '👥 Mixed Voices', 
      file: '/assets/audio/mixed-voices.wav',
      description: 'Both genders - compare the effects'
    }
  ];

  const handleFileChange = (fileId) => {
    setSelectedFile(fileId);
    const file = audioFiles.find(f => f.id === fileId);
    if (onAudioFileChange) {
      onAudioFileChange(file.file);
    }
  };

  /**
   * Download the processed (aliased) audio as WAV file
   */
  const handleDownloadAliased = () => {
    if (!processedBuffer) {
      alert('No processed audio available. Please wait for processing to complete.');
      return;
    }

    try {
      console.log('🎵 Preparing aliased audio for download...');
      
      // Convert AudioBuffer to WAV format
      const wavData = audioBufferToWav(processedBuffer);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aliased_${samplingRate}Hz_${selectedFile}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Downloaded: aliased_${samplingRate}Hz_${selectedFile}.wav`);
    } catch (error) {
      console.error('Error downloading audio:', error);
      alert('Failed to download audio file. Please try again.');
    }
  };

  /**
   * Convert AudioBuffer to WAV format
   */
  const audioBufferToWav = (audioBuffer) => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const bitsPerSample = 16;
    
    // Calculate buffer size
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    
    // Create WAV file buffer
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio data
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return buffer;
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const selectedFileInfo = audioFiles.find(f => f.id === selectedFile);

  return (
    <div className="audio-controls">
      <div className="file-selector">
        <h4>🎵 Select Audio Sample:</h4>
        <div className="file-buttons">
          {audioFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => handleFileChange(file.id)}
              className={`file-btn ${selectedFile === file.id ? 'selected' : ''}`}
              title={file.description}
            >
              {file.label}
            </button>
          ))}
        </div>
        {selectedFileInfo && (
          <p className="file-description">
            <small>{selectedFileInfo.description}</small>
          </p>
        )}
      </div>

      <div className="playback-controls">
        <button 
          onClick={onPlay} 
          disabled={isPlaying}
          className="control-btn play-btn"
          title="Play audio with current sampling rate"
        >
          ▶️ Play
        </button>
        <button 
          onClick={onPause} 
          disabled={!isPlaying}
          className="control-btn pause-btn"
          title="Pause playback"
        >
          ⏸️ Pause
        </button>
        {onStop && (
          <button 
            onClick={onStop}
            className="control-btn stop-btn"
            title="Stop playback"
          >
            ⏹️ Stop
          </button>
        )}
      </div>

      {/* NEW: Download Section */}
      <div className="download-section">
        <h4>💾 Download for AI Training:</h4>
        <button
          onClick={handleDownloadAliased}
          className="download-btn"
          disabled={!processedBuffer || samplingRate === 44100}
          title={samplingRate === 44100 ? 'No aliasing at 44.1kHz' : 'Download aliased audio for training'}
        >
          📥 Download Aliased Audio ({samplingRate}Hz)
        </button>
        <p className="download-info">
          <small>
            {samplingRate === 44100 
              ? 'Reduce sampling rate to enable download' 
              : `Download distorted audio for AI training. This will be your input (X) for the neural network.`
            }
          </small>
        </p>
      </div>

      <div className="info-panel">
        <div className="info-item">
          <span className="info-label">Status:</span>
          <span className={`info-value ${isPlaying ? 'playing' : 'paused'}`}>
            {isPlaying ? '🔊 Playing' : '⏸️ Paused'}
          </span>
        </div>
      </div>

      <div className="listening-guide">
        <h5>👂 What to Listen For:</h5>
        <ul>
          <li><strong>44.1 kHz:</strong> Crystal clear, natural voice quality</li>
          <li><strong>32 kHz:</strong> Slight loss of high frequencies</li>
          <li><strong>16 kHz:</strong> Voice sounds "muffled" and deeper</li>
          <li><strong>8 kHz:</strong> Heavy distortion, female voices sound like male</li>
        </ul>
        <div className="ai-training-note">
          <strong>🧠 For Part 3 (AI Training):</strong>
          <p>Download aliased versions at different sample rates (8kHz, 12kHz, 16kHz) along with the original 44.1kHz version. These pairs will be used to train your anti-aliasing neural network.</p>
        </div>
      </div>
    </div>
  );
};

export default AudioControls;