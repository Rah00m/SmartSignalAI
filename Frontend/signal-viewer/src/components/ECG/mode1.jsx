import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode1.css";

export default function Mode1() {
  const navigate = useNavigate();
  const {
    selectedPatient,
    selectedRecording,
    ecgData,
    setEcgData,
    length,
    setLength,
    offset,
    setOffset,
  } = useECG();

  const [channel, setChannel] = useState("I");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullSignalData, setFullSignalData] = useState(null);
  const [fullSignalLoading, setFullSignalLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [currentViewData, setCurrentViewData] = useState({ x: [], y: [] });

  const fetchFullSignal = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setFullSignalLoading(true);
    try {
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode1/full-signal?patient=${selectedPatient}&recording=${selectedRecording}&channel=${channel.toLowerCase()}`;

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.x && jsonData.y) {
        setFullSignalData(jsonData);

        const initialData = {
          x: jsonData.x.slice(0, length),
          y: jsonData.y.slice(0, length),
        };
        setCurrentViewData(initialData);
        setEcgData(initialData);
      } else {
        setFullSignalData(null);
        setCurrentViewData({ x: [], y: [] });
      }
    } catch (error) {
      setError("Network error - Could not connect to server: " + error.message);
      setFullSignalData(null);
      setCurrentViewData({ x: [], y: [] });
    } finally {
      setFullSignalLoading(false);
    }
  };

  const startPlayback = () => {
    if (!fullSignalData) return;
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    let interval;
    if (isPlaying && fullSignalData) {
      let currentIndex = length;

      interval = setInterval(() => {
        if (currentIndex >= fullSignalData.x.length) {
          currentIndex = length;
        }

        const newX = fullSignalData.x.slice(
          currentIndex - length,
          currentIndex
        );
        const newY = fullSignalData.y.slice(
          currentIndex - length,
          currentIndex
        );

        const newData = {
          x: newX,
          y: newY,
        };

        setCurrentViewData(newData);
        setEcgData(newData);
        setOffset(currentIndex - length);

        currentIndex += Math.floor(length / 10);
      }, playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, fullSignalData, length, playbackSpeed]);

  useEffect(() => {
    if (selectedPatient && selectedRecording) {
      fetchFullSignal();
    }
  }, [selectedPatient, selectedRecording, channel]);

  useEffect(() => {
    if (fullSignalData && !isPlaying) {
      const newData = {
        x: fullSignalData.x.slice(offset, offset + length),
        y: fullSignalData.y.slice(offset, offset + length),
      };
      setCurrentViewData(newData);
      setEcgData(newData);
    }
  }, [offset, length, fullSignalData, isPlaying]);

  return (
    <div className="mode1-container">
      <div className="mode1-header">
        <button className="mode1-back-button" onClick={() => navigate("/ecg")}>
          Back to Home
        </button>
        <h1 className="mode1-title">Mode 1 - Real-time ECG Monitor</h1>
      </div>

      <div className="mode1-patient-info">
        <div className="mode1-patient-item">
          <div className="mode1-patient-label">Patient</div>
          <div className="mode1-patient-value">
            {selectedPatient || "Not selected"}
          </div>
        </div>
        <div className="mode1-patient-item">
          <div className="mode1-patient-label">Recording</div>
          <div className="mode1-patient-value">
            {selectedRecording || "Not selected"}
          </div>
        </div>
        <div className="mode1-patient-item">
          <div className="mode1-patient-label">View Length</div>
          <div className="mode1-patient-value">{length} samples</div>
        </div>
        <div className="mode1-patient-item">
          <div className="mode1-patient-label">Status</div>
          <div className="mode1-patient-value">
            {isPlaying ? "▶️ Playing" : "⏸️ Paused"}
          </div>
        </div>
      </div>

      {(!selectedPatient || !selectedRecording) && (
        <div className="mode1-warning">
          Please select patient and recording from Home page
        </div>
      )}

      <div className="mode1-content">
        <div className="mode1-controls-panel">
          <h3 className="mode1-controls-title">Monitor Controls</h3>

          <div className="mode1-channel-group">
            <label className="mode1-channel-label">Channel</label>
            <select
              className="mode1-channel-select"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              disabled={!selectedPatient || !selectedRecording}
            >
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="aVR">aVR</option>
              <option value="aVL">aVL</option>
              <option value="aVF">aVF</option>
              <option value="V1">V1</option>
              <option value="V2">V2</option>
              <option value="V3">V3</option>
              <option value="V4">V4</option>
              <option value="V5">V5</option>
              <option value="V6">V6</option>
            </select>
          </div>

          <div className="mode1-settings-group">
            <label className="mode1-setting-label">Window Size</label>
            <input
              type="number"
              min="500"
              max="10000"
              step="100"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="mode1-setting-input"
              disabled={!selectedPatient || !selectedRecording || isPlaying}
            />
            <p className="mode1-hint-text">Samples per view (500-10000)</p>
          </div>

          <div className="mode1-playback-controls">
            <label className="mode1-setting-label">Scroll Speed</label>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="mode1-setting-input"
              disabled={!selectedPatient || !selectedRecording}
            >
              <option value={2000}>Slow</option>
              <option value={1000}>Normal</option>
              <option value={500}>Fast</option>
              <option value={200}>Very Fast</option>
            </select>
          </div>

          <div className="mode1-playback-buttons">
            <button
              className={`mode1-play-button ${isPlaying ? "playing" : ""}`}
              onClick={isPlaying ? stopPlayback : startPlayback}
              disabled={
                !selectedPatient || !selectedRecording || !fullSignalData
              }
            >
              {isPlaying ? "⏸️ Stop" : "▶️ Start Monitor"}
            </button>
          </div>

          {!isPlaying && (
            <div className="mode1-settings-group">
              <label className="mode1-setting-label">Manual Position</label>
              <input
                type="number"
                min="0"
                step="100"
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value))}
                className="mode1-setting-input"
                disabled={!selectedPatient || !selectedRecording}
              />
              <p className="mode1-hint-text">Start position in samples</p>
            </div>
          )}

          <button
            className="mode1-update-button"
            onClick={() => {
              setChannel("I");
              setLength(2000);
              setOffset(0);
              stopPlayback();
              if (fullSignalData) {
                const initialData = {
                  x: fullSignalData.x.slice(0, 2000),
                  y: fullSignalData.y.slice(0, 2000),
                };
                setCurrentViewData(initialData);
                setEcgData(initialData);
              }
            }}
            disabled={!selectedPatient || !selectedRecording}
            style={{
              background: "linear-gradient(45deg, #4facfe, #00f2fe)",
              marginTop: "10px",
            }}
          >
            Reset Monitor
          </button>

          {currentViewData && currentViewData.x.length > 0 && (
            <div className="mode1-signal-info">
              <h4 className="mode1-signal-title">Signal Information</h4>
              <div className="mode1-channel-info">
                <span className="mode1-channel-name">Channel</span>
                <span className="mode1-channel-samples">{channel}</span>
              </div>
              <div className="mode1-channel-info">
                <span className="mode1-channel-name">Data Points</span>
                <span className="mode1-channel-samples">
                  {currentViewData.y?.length || 0}
                </span>
              </div>
              <div className="mode1-channel-info">
                <span className="mode1-channel-name">Current Range</span>
                <span className="mode1-channel-samples">
                  {offset} - {offset + length}
                </span>
              </div>

              {fullSignalData && (
                <div className="mode1-channel-info">
                  <span className="mode1-channel-name">Total Signal</span>
                  <span className="mode1-channel-samples">
                    {fullSignalData.total_length} samples
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mode1-plot-container">
          {loading && (
            <div className="mode1-loading-container">
              <div className="mode1-spinner"></div>
              <p className="mode1-loading-text">Loading ECG data...</p>
            </div>
          )}

          {error && (
            <div className="mode1-error-container">
              <p className="mode1-error-text">{error}</p>
              <button className="mode1-retry-button" onClick={fetchFullSignal}>
                Retry
              </button>
            </div>
          )}

          {!selectedPatient || !selectedRecording ? (
            <div className="mode1-placeholder-container">
              <p className="mode1-placeholder-text">
                Please select patient and recording from Home page
              </p>
            </div>
          ) : currentViewData &&
            currentViewData.x &&
            currentViewData.y &&
            currentViewData.x.length > 0 &&
            currentViewData.y.length > 0 ? (
            <div className="mode1-plot-wrapper">
              <div className="mode1-detail-plot">
                <Plot
                  data={[
                    {
                      x: currentViewData.x,
                      y: currentViewData.y,
                      type: "scatter",
                      mode: "lines",
                      line: {
                        color: "#00ff88",
                        width: 2,
                      },
                      name: `Channel ${channel}`,
                    },
                  ]}
                  layout={{
                    width: "100%",
                    height: 500,
                    title: {
                      text: `ECG Monitor - ${selectedPatient} (${channel}) ${
                        isPlaying ? "▶️ LIVE" : "⏸️ PAUSED"
                      }`,
                      font: { color: "white", size: 18 },
                    },
                    xaxis: {
                      title: {
                        text: "Time (samples)",
                        font: { color: "white" },
                      },
                      gridcolor: "#666",
                      color: "white",
                      showline: true,
                      linecolor: "white",
                      range: [
                        currentViewData.x[0],
                        currentViewData.x[currentViewData.x.length - 1],
                      ],
                    },
                    yaxis: {
                      title: { text: "Voltage (mV)", font: { color: "white" } },
                      gridcolor: "#666",
                      color: "white",
                      showline: true,
                      linecolor: "white",
                    },
                    paper_bgcolor: "#1f2937",
                    plot_bgcolor: "#111827",
                    font: { color: "white" },
                    margin: { t: 60, r: 40, b: 60, l: 60 },
                    showlegend: true,
                    legend: {
                      x: 0,
                      y: 1,
                      bgcolor: "rgba(255,255,255,0.1)",
                      bordercolor: "rgba(255,255,255,0.2)",
                      font: { color: "white" },
                    },
                  }}
                  config={{
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
                    responsive: true,
                  }}
                />
              </div>

              <div className="mode1-explanation">
                <h4 className="mode1-explanation-title">
                  ECG Monitor Instructions:
                </h4>
                <ul className="mode1-explanation-list">
                  <li className="mode1-explanation-item">
                    <span className="mode1-explanation-strong">
                      Start Monitor
                    </span>
                    : Click to begin real-time streaming
                  </li>
                  <li className="mode1-explanation-item">
                    <span className="mode1-explanation-strong">
                      Window Size
                    </span>
                    : Adjust how many samples are visible at once
                  </li>
                  <li className="mode1-explanation-item">
                    <span className="mode1-explanation-strong">
                      Scroll Speed
                    </span>
                    : Control how fast the signal moves
                  </li>
                  <li className="mode1-explanation-item">
                    <span className="mode1-explanation-strong">
                      Green waveform
                    </span>
                    : Live ECG signal display
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="mode1-placeholder-container">
              <p className="mode1-placeholder-text">No ECG data to display</p>
              <p className="mode1-placeholder-text">
                {fullSignalLoading
                  ? "Loading full signal..."
                  : "Select patient and recording"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
