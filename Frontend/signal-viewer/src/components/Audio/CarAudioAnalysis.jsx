import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CarAudioAnalysis.css";

const CarAudioAnalysis = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("generate");
  const [velocity, setVelocity] = useState("");
  const [frequency, setFrequency] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // API base URL - adjust this according to your backend setup
  const API_BASE_URL = "http://localhost:8000/api/car";

  // Test backend connection on component mount
  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log("Backend connection successful:", data);
      } else {
        console.error("Backend health check failed:", response.status);
      }
    } catch (error) {
      console.error("Backend connection failed:", error);
      setError(
        "Cannot connect to backend server. Please ensure the server is running on http://localhost:8000"
      );
    }
  };

  const generateCarSound = async () => {
    if (!velocity || !frequency) {
      setError("Please enter both velocity and frequency values");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log("Sending request to:", `${API_BASE_URL}/generate-sound`);
      console.log("Request data:", {
        velocity: parseFloat(velocity),
        frequency: parseFloat(frequency),
      });

      const response = await fetch(`${API_BASE_URL}/generate-sound`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          velocity: parseFloat(velocity),
          frequency: parseFloat(frequency),
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.detail || errorData.message || "Unknown error";
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      console.log("Audio blob size:", audioBlob.size);

      const audioUrl = URL.createObjectURL(audioBlob);
      setGeneratedAudio(audioUrl);

      // Auto-play the generated sound
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current
          .play()
          .catch((e) => console.log("Auto-play prevented:", e));
      }
    } catch (error) {
      console.error("Error generating car sound:", error);
      setError(`Error generating car sound: ${error.message}`);
    }

    setIsGenerating(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      setUploadedFile(file);
      analyzeAudioFile(file);
    } else {
      setError("Please upload a valid audio file");
    }
  };

  const analyzeAudioFile = async (file) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("expected_frequency", frequency || "100");

      console.log("Uploading file:", file.name);

      const response = await fetch(`${API_BASE_URL}/analyze-sound`, {
        method: "POST",
        body: formData,
      });

      console.log("Analysis response status:", response.status);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.detail || errorData.message || "Unknown error";
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const results = await response.json();
      console.log("Analysis results:", results);

      if (!results.success) {
        throw new Error(results.error || "Analysis failed");
      }

      setAnalysisResults(results);
    } catch (error) {
      console.error("Error analyzing audio:", error);
      setError(`Error analyzing audio file: ${error.message}`);
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="car-audio-page">
      {/* Hidden audio element for playing generated sounds */}
      <audio ref={audioRef} controls style={{ display: "none" }} />

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>🔊 Advanced Audio Analysis</span>
          </div>
          <h1 className="hero-title">
            Car Audio <span className="hero-title-accent">Intelligence</span>
          </h1>
          <p className="hero-description">
            Generate realistic car sounds or analyze existing audio files to
            extract velocity and frequency characteristics using advanced signal
            processing algorithms.
          </p>
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="error-close">
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === "generate" ? "active" : ""}`}
            onClick={() => setActiveTab("generate")}
          >
            <span className="tab-icon">🎵</span>
            Generate Car Sound
          </button>
          <button
            className={`tab-btn ${activeTab === "analyze" ? "active" : ""}`}
            onClick={() => setActiveTab("analyze")}
          >
            <span className="tab-icon">📊</span>
            Analyze Audio File
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="content-container">
        {activeTab === "generate" && (
          <div className="generate-section">
            <div className="section-card">
              <h2 className="section-title">🎵 Generate Car Sound</h2>
              <p className="section-description">
                Enter velocity and frequency parameters to generate a realistic
                car engine sound with Doppler effect
              </p>

              <div className="input-grid">
                <div className="input-group">
                  <label htmlFor="velocity" className="input-label">
                    🚗 Car Speed (m/s)
                  </label>
                  <input
                    type="number"
                    id="velocity"
                    className="modern-input"
                    placeholder="Enter car speed (20-100)"
                    value={velocity}
                    onChange={(e) => setVelocity(e.target.value)}
                    min="0"
                    max="100"
                  />
                  <div className="input-hint">
                    Example: 45 m/s (your original value)
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="frequency" className="input-label">
                    🎼 Base Frequency (Hz)
                  </label>
                  <input
                    type="number"
                    id="frequency"
                    className="modern-input"
                    placeholder="Enter frequency (100-1000)"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    min="20"
                    max="1000"
                  />
                  <div className="input-hint">
                    Engine base frequency: 0-300 Hz
                  </div>
                </div>
              </div>

              <button
                className={`generate-btn ${isGenerating ? "loading" : ""}`}
                onClick={generateCarSound}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generating Sound...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🎵</span>
                    Generate Car Sound
                  </>
                )}
              </button>

              {generatedAudio && (
                <div className="success-message">
                  <span className="success-icon">✅</span>
                  Car sound generated successfully!
                  <div className="audio-controls">
                    <audio
                      controls
                      src={generatedAudio}
                      style={{ marginTop: "10px", width: "100%" }}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "analyze" && (
          <div className="analyze-section">
            <div className="section-card">
              <h2 className="section-title">📊 Analyze Audio File</h2>
              <p className="section-description">
                Upload a car audio file to extract velocity and frequency
                information using Doppler effect analysis
              </p>

              <div
                className={`upload-area ${uploadedFile ? "has-file" : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="audio/*"
                  style={{ display: "none" }}
                />

                {!uploadedFile ? (
                  <div className="upload-content">
                    <div className="upload-icon">📁</div>
                    <h3>Drop your audio file here</h3>
                    <p>or click to browse</p>
                    <div className="supported-formats">
                      Supported: MP3, WAV, M4A, OGG, FLAC
                    </div>
                  </div>
                ) : (
                  <div className="file-info">
                    <div className="file-icon">🎵</div>
                    <div className="file-details">
                      <h4>{uploadedFile.name}</h4>
                      <p>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="file-status">
                      {isAnalyzing ? "🔄 Analyzing..." : "✅ Ready"}
                    </div>
                  </div>
                )}
              </div>

              {isAnalyzing && (
                <div className="analysis-progress">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                  <p>
                    Analyzing audio file using Doppler effect algorithms... This
                    may take a few moments.
                  </p>
                </div>
              )}

              {analysisResults && (
                <>
                  <div className="plot-section">
                    <div className="plot-header">
                      <h3>📊 Waveform of the Loaded Audio Signal</h3>
                      <div className="stats-badge">
                        <div className="stat-item">
                          <span className="stat-label">Duration:</span>
                          <span className="stat-value">
                            {analysisResults.waveform_stats.duration_seconds}s
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Max Amplitude:</span>
                          <span className="stat-value">
                            {analysisResults.waveform_stats.max_amplitude}
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Dynamic Range:</span>
                          <span className="stat-value">
                            {analysisResults.waveform_stats.dynamic_range}
                          </span>
                        </div>
                      </div>
                    </div>
                    <img
                      src={`data:image/png;base64,${analysisResults.waveform_plot}`}
                      alt="Waveform Plot"
                      className="plot-image"
                    />
                  </div>

                  <div className="plot-section">
                    <div className="plot-header">
                      <h3>🌈 Spectrogram of the Saturated Tone</h3>
                      <div className="stats-badge">
                        <div className="stat-item">
                          <span className="stat-label">Dominant Freq:</span>
                          <span className="stat-value">
                            {
                              analysisResults.spectrogram_stats
                                .dominant_frequency
                            }{" "}
                            Hz
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Freq Range:</span>
                          <span className="stat-value">
                            {analysisResults.spectrogram_stats.frequency_range}
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Stability:</span>
                          <span className="stat-value">
                            {
                              analysisResults.spectrogram_stats
                                .frequency_stability
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <img
                      src={`data:image/png;base64,${analysisResults.spectrogram_plot}`}
                      alt="Spectrogram Plot"
                      className="plot-image"
                    />
                  </div>

                  <div className="plot-section">
                    <div className="plot-header">
                      <h3>🚗 Estimated Car Velocity from Audio Signal</h3>
                      <div className="stats-badge">
                        <div className="stat-item">
                          <span className="stat-label">Max Speed:</span>
                          <span className="stat-value">
                            {analysisResults.velocity_stats.max_speed_kmh} km/h
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Avg Speed:</span>
                          <span className="stat-value">
                            {analysisResults.velocity_stats.avg_speed_kmh} km/h
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Movement:</span>
                          <span className="stat-value">
                            {analysisResults.velocity_stats.movement_trend}
                          </span>
                        </div>
                      </div>
                    </div>
                    <img
                      src={`data:image/png;base64,${analysisResults.velocity_plot}`}
                      alt="Velocity Plot"
                      className="plot-image"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarAudioAnalysis;
