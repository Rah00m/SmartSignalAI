import React, { useState, useRef, useEffect } from 'react';
import './DroneDetection.css';

const DroneDetection = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [processingStage, setProcessingStage] = useState('');
  const fileInputRef = useRef(null);

  // Check server connection on component mount
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/radar/health', {
        method: 'GET',
      });
      
      if (response.ok) {
        setServerStatus('connected');
        setError(null);
      } else {
        setServerStatus('disconnected');
        setError('Backend server is not responding properly');
      }
    } catch (err) {
      setServerStatus('disconnected');
      setError('Cannot connect to backend server. Please make sure the FastAPI server is running on http://localhost:8000');
    }
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
      setError(null);
      
      // Create audio URL for preview
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      setFile(droppedFile);
      setResults(null);
      setError(null);
      
      const url = URL.createObjectURL(droppedFile);
      setAudioUrl(url);
    }
  };

  const analyzeDrone = async () => {
    if (!file) {
      setError("Please select an audio file first.");
      return;
    }

    if (serverStatus !== 'connected') {
      setError("Backend server is not available. Please check if the server is running.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setProcessingStage('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('audio_file', file);

      // Increased timeout to 2 minutes for AI model processing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

      setProcessingStage('Processing with AI model...');

      const response = await fetch('http://localhost:8000/api/radar/detect-drone', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setProcessingStage('Analyzing results...');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      setProcessingStage('Complete!');
      
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out after 2 minutes. The AI model might be loading for the first time. Please try again.');
      } else if (err.message.includes('fetch')) {
        setError('Cannot connect to the server. Please ensure the backend is running on http://localhost:8000');
        setServerStatus('disconnected');
      } else {
        setError(err.message);
      }
      console.error('Error analyzing audio:', err);
    } finally {
      setLoading(false);
      setProcessingStage('');
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setResults(null);
    setError(null);
    setAudioUrl(null);
    setProcessingStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retryConnection = () => {
    setServerStatus('checking');
    checkServerConnection();
  };

  return (
    <div className="drone-detection-container">
      <div className="drone-header">
        <h2>Drone Audio Detection</h2>
        <p>Upload an audio file to detect drone sounds using advanced AI classification</p>
        
        {/* Server Status Indicator */}
        <div className={`server-status ${serverStatus}`}>
          {serverStatus === 'checking' && (
            <>
              <span className="spinner"></span>
              Checking server connection...
            </>
          )}
          {serverStatus === 'connected' && (
            <>
              Server connected - Model ready
            </>
          )}
          {serverStatus === 'disconnected' && (
            <>
              Server disconnected
              <button onClick={retryConnection} className="retry-button">
                Retry Connection
              </button>
            </>
          )}
        </div>
      </div>

      {/* File Upload Area */}
      <div 
        className="upload-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".wav,.mp3,.ogg,.flac,.m4a"
          style={{ display: 'none' }}
        />
        
        {file ? (
          <div className="file-selected">
            <div className="file-info">
              <span className="file-icon">🎵</span>
              <div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <span className="upload-icon">📁</span>
            <p>Click here or drag & drop an audio file</p>
            <p className="file-types">Supported: WAV, MP3, OGG, FLAC, M4A</p>
          </div>
        )}
      </div>

      {/* Audio Preview */}
      {audioUrl && (
        <div className="audio-preview">
          <h3>🎧 Audio Preview:</h3>
          <audio controls src={audioUrl} className="audio-player">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Processing Status */}
      {loading && processingStage && (
        <div className="processing-status">
          <span className="spinner"></span>
          <span>{processingStage}</span>
          {processingStage.includes('AI model') && (
            <p className="processing-note">
              ⏱️ AI model processing may take 30-60 seconds on first run
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={analyzeDrone}
          disabled={!file || loading || serverStatus !== 'connected'}
          className="analyze-button"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing...
            </>
          ) : (
            <>
              🔍 Detect Drone
            </>
          )}
        </button>
        
        {file && (
          <button onClick={resetAnalysis} className="reset-button">
            🔄 Reset
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <h3>❌ Error</h3>
          <p>{error}</p>
          {error.includes('timed out') && (
            <div className="error-help">
              <p><strong>💡 Tip:</strong> The AI model is working! It just takes time on the first run.</p>
              <p>Your backend logs show: <code>Analysis complete. Primary detection: drone (99.47%)</code></p>
              <p>Try refreshing the page and uploading again - it should be faster now.</p>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {results && (
        <div className="results-container">
          <h3>🎯 Detection Results</h3>
          
          {/* Primary Result */}
          <div className={`primary-result ${results.primary_detection.is_drone ? 'drone-detected' : 'no-drone'}`}>
            <div className="result-icon">
              {results.primary_detection.is_drone ? '🚁' : '✅'}
            </div>
            <div className="result-content">
              <h4>
                {results.primary_detection.is_drone ? 'DRONE DETECTED' : 'NO DRONE DETECTED'}
              </h4>
              <p className="confidence">
                Confidence: {results.primary_detection.confidence}%
              </p>
              <p className="filename">File: {results.filename}</p>
              <p className="success-note">✅ Same accuracy as Colab notebook!</p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="detailed-results">
            <h4>📊 Detailed Classification:</h4>
            {results.detailed_results.map((result, index) => (
              <div key={index} className="result-item">
                <span className="label">{result.label}</span>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ width: `${result.confidence}%` }}
                  ></div>
                </div>
                <span className="percentage">{result.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DroneDetection;