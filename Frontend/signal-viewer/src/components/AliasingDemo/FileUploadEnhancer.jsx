import React, { useState, useRef } from 'react';
import aiAntiAliasingService from '../../services/aiAntiAliasingService';
import './FileUploadEnhancer.css';

const FileUploadEnhancer = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [originalBuffer, setOriginalBuffer] = useState(null);
  const [enhancedBuffer, setEnhancedBuffer] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [isPlayingEnhanced, setIsPlayingEnhanced] = useState(false);
  
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const originalSourceRef = useRef(null);
  const enhancedSourceRef = useRef(null);

  // Initialize audio context
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(wav|mp3|flac|ogg)$/i)) {
      setError('Invalid file type. Please upload WAV, MP3, FLAC, or OGG files.');
      return;
    }

    setUploadedFile(file);
    setOriginalBuffer(null);
    setEnhancedBuffer(null);
    setError(null);
    setProgress('');
    console.log('📁 File selected:', file.name);
  };

  // Handle AI enhancement
  const handleEnhance = async () => {
    if (!uploadedFile) {
      setError('Please select an audio file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress('Starting enhancement...');

    try {
      const result = await aiAntiAliasingService.processAudioFile(
        uploadedFile,
        48000,
        (progressMsg) => setProgress(progressMsg)
      );

      setOriginalBuffer(result.originalBuffer);
      setEnhancedBuffer(result.enhancedBuffer);
      setProgress('✅ Enhancement complete! Click play buttons below.');
      console.log('✅ Enhancement successful');

    } catch (err) {
      console.error('❌ Enhancement error:', err);
      setError(err.message || 'Enhancement failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Play original audio
  const playOriginal = () => {
    if (!originalBuffer) return;

    stopAll();

    const audioContext = getAudioContext();
    const source = audioContext.createBufferSource();
    source.buffer = originalBuffer;
    source.connect(audioContext.destination);

    source.onended = () => {
      setIsPlayingOriginal(false);
      originalSourceRef.current = null;
    };

    source.start(0);
    originalSourceRef.current = source;
    setIsPlayingOriginal(true);
    console.log('▶️ Playing original audio');
  };

  // Play enhanced audio
  const playEnhanced = () => {
    if (!enhancedBuffer) return;

    stopAll();

    const audioContext = getAudioContext();
    const source = audioContext.createBufferSource();
    source.buffer = enhancedBuffer;
    source.connect(audioContext.destination);

    source.onended = () => {
      setIsPlayingEnhanced(false);
      enhancedSourceRef.current = null;
    };

    source.start(0);
    enhancedSourceRef.current = source;
    setIsPlayingEnhanced(true);
    console.log('▶️ Playing enhanced audio');
  };

  // Stop all playback
  const stopAll = () => {
    if (originalSourceRef.current) {
      try {
        originalSourceRef.current.stop();
      } catch (e) {}
      originalSourceRef.current = null;
    }
    if (enhancedSourceRef.current) {
      try {
        enhancedSourceRef.current.stop();
      } catch (e) {}
      enhancedSourceRef.current = null;
    }
    setIsPlayingOriginal(false);
    setIsPlayingEnhanced(false);
  };

  return (
    <div className="file-upload-enhancer">
      <div className="upload-header">
        <h2>🎧 Upload & Enhance Audio with AI</h2>
        <p>Upload an aliased audio file (8kHz, 16kHz) and enhance it to 48kHz</p>
      </div>

      {/* File Upload Section */}
      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/wav,audio/mp3,audio/flac,audio/ogg"
          onChange={handleFileSelect}
          className="file-input"
          id="audio-file-input"
        />
        <label htmlFor="audio-file-input" className="file-input-label">
          📁 Choose Audio File
        </label>
        
        {uploadedFile && (
          <div className="file-info">
            <p>✅ Selected: <strong>{uploadedFile.name}</strong></p>
            <p>📦 Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
          </div>
        )}
      </div>

      {/* Enhance Button */}
      <div className="enhance-section">
        <button
          onClick={handleEnhance}
          disabled={!uploadedFile || isProcessing}
          className="enhance-btn"
        >
          {isProcessing ? '⏳ Processing...' : '🤖 Enhance with AI'}
        </button>

        {progress && (
          <div className={`progress-message ${error ? 'error' : 'info'}`}>
            {progress}
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {isProcessing && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{progress}</p>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      {(originalBuffer || enhancedBuffer) && (
        <div className="playback-section">
          <h3>🎵 Compare Results</h3>
          
          <div className="playback-controls">
            {/* Original Audio */}
            <div className="audio-player">
              <h4>📉 Original (Aliased)</h4>
              {originalBuffer && (
                <div className="audio-info">
                  <p>Sample Rate: {originalBuffer.sampleRate} Hz</p>
                  <p>Duration: {originalBuffer.duration.toFixed(2)}s</p>
                </div>
              )}
              <button
                onClick={playOriginal}
                disabled={!originalBuffer || isPlayingOriginal}
                className="play-btn original"
              >
                {isPlayingOriginal ? '⏸️ Playing...' : '▶️ Play Original'}
              </button>
            </div>

            {/* Enhanced Audio */}
            <div className="audio-player">
              <h4>📈 Enhanced (AI)</h4>
              {enhancedBuffer && (
                <div className="audio-info">
                  <p>Sample Rate: {enhancedBuffer.sampleRate} Hz</p>
                  <p>Duration: {enhancedBuffer.duration.toFixed(2)}s</p>
                </div>
              )}
              <button
                onClick={playEnhanced}
                disabled={!enhancedBuffer || isPlayingEnhanced}
                className="play-btn enhanced"
              >
                {isPlayingEnhanced ? '⏸️ Playing...' : '▶️ Play Enhanced'}
              </button>
            </div>
          </div>

          <button onClick={stopAll} className="stop-btn">
            ⏹️ Stop All
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadEnhancer;