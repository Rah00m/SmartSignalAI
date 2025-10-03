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

  const fetchData = async () => {
    if (!selectedPatient || !selectedRecording) {
      setError("Please select both patient and recording from Home page");
      return;
    }

    setLoading(true);
    setError("");

    const lowerChannel = channel.toLowerCase();
    const apiUrl = `${
      import.meta.env.VITE_API_URL
    }/ecg/mode1/signal?patient=${selectedPatient}&recording=${selectedRecording}&channel=${lowerChannel}&offset=${offset}&length=${length}`;

    try {
      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.x && jsonData.y) {
        setEcgData(jsonData);
      } else {
        setError(jsonData.error || "Failed to fetch ECG data");
        setEcgData(null);
      }
    } catch (error) {
      console.error("Error fetching ECG data:", error);
      setError("Network error - Could not connect to server");
      setEcgData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatient && selectedRecording) {
      fetchData();
    }
  }, []);

  return (
    <div className="mode1-container">
      <div className="mode1-header">
        <button className="mode1-back-button" onClick={() => navigate("/")}>
          🏠 Back to Home
        </button>
        <h1 className="mode1-title">📊 Mode 1 - Signal Viewer</h1>
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
          <div className="mode1-patient-label">Length</div>
          <div className="mode1-patient-value">{length} samples</div>
        </div>
        <div className="mode1-patient-item">
          <div className="mode1-patient-label">Offset</div>
          <div className="mode1-patient-value">{offset} samples</div>
        </div>
      </div>

      {(!selectedPatient || !selectedRecording) && (
        <div className="mode1-warning">
          ⚠️ Please select patient and recording from Home page
        </div>
      )}

      <div className="mode1-content">
        <div className="mode1-controls-panel">
          <h3 className="mode1-controls-title">🎯 Signal Configuration</h3>

          <div className="mode1-channel-group">
            <label className="mode1-channel-label">📡 Channel</label>
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
            <label className="mode1-setting-label">📏 Length</label>
            <input
              type="number"
              min="100"
              max="5000"
              step="100"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="mode1-setting-input"
              disabled={!selectedPatient || !selectedRecording}
            />
            <p className="mode1-hint-text">Number of samples (100-5000)</p>
          </div>

          <div className="mode1-settings-group">
            <label className="mode1-setting-label">⏩ Offset</label>
            <input
              type="number"
              min="0"
              step="100"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              className="mode1-setting-input"
              disabled={!selectedPatient || !selectedRecording}
            />
            <p className="mode1-hint-text">Starting point in samples</p>
          </div>

          <button
            className="mode1-update-button"
            onClick={fetchData}
            disabled={!selectedPatient || !selectedRecording || loading}
          >
            {loading ? "🔄 Loading..." : "📥 Fetch ECG Data"}
          </button>

          <button
            className="mode1-update-button"
            onClick={() => {
              setChannel("I");
              setLength(200);
              setOffset(0);
            }}
            disabled={!selectedPatient || !selectedRecording}
            style={{
              background: "linear-gradient(45deg, #4facfe, #00f2fe)",
              marginTop: "10px",
            }}
          >
            🔄 Reset Settings
          </button>

          {ecgData && (
            <div className="mode1-signal-info">
              <h4 className="mode1-signal-title">📊 Signal Information</h4>
              <div className="mode1-channel-info">
                <span className="mode1-channel-name">Channel</span>
                <span className="mode1-channel-samples">{ecgData.channel}</span>
              </div>
              <div className="mode1-channel-info">
                <span className="mode1-channel-name">Data Points</span>
                <span className="mode1-channel-samples">
                  {ecgData.y?.length || 0}
                </span>
              </div>
              {ecgData.actual_length && (
                <div className="mode1-channel-info">
                  <span className="mode1-channel-name">Actual Length</span>
                  <span className="mode1-channel-samples">
                    {ecgData.actual_length}
                  </span>
                </div>
              )}

              {ecgData.diagnosis &&
                ecgData.diagnosis !== "No diagnosis found" && (
                  <div className="mode1-diagnosis-box">
                    <h4 className="mode1-diagnosis-title">🏥 Diagnosis</h4>
                    <p className="mode1-diagnosis-text">{ecgData.diagnosis}</p>
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
              <p className="mode1-error-text">❌ {error}</p>
              <button className="mode1-retry-button" onClick={fetchData}>
                🔄 Retry
              </button>
            </div>
          )}

          {!selectedPatient || !selectedRecording ? (
            <div className="mode1-placeholder-container">
              <p className="mode1-placeholder-text">
                👈 Please select patient and recording from Home page
              </p>
            </div>
          ) : ecgData &&
            ecgData.x &&
            ecgData.y &&
            ecgData.x.length > 0 &&
            ecgData.y.length > 0 ? (
            <div className="mode1-plot-wrapper">
              <Plot
                data={[
                  {
                    x: ecgData.x,
                    y: ecgData.y,
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
                    text: `ECG Signal - ${selectedPatient} (${channel})`,
                    font: { color: "white", size: 18 },
                  },
                  xaxis: {
                    title: { text: "Time (samples)", font: { color: "white" } },
                    gridcolor: "#666",
                    color: "white",
                    showline: true,
                    linecolor: "white",
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

              {/* تفسير الرسم */}
              <div className="mode1-explanation">
                <h4 className="mode1-explanation-title">
                  📈 How to read this ECG Signal:
                </h4>
                <ul className="mode1-explanation-list">
                  <li className="mode1-explanation-item">
                    <span className="mode1-explanation-strong">X-axis</span>:
                    Time in samples
                  </li>
                  <li className="mode1-explanation-item">
                    <span className="mode1-explanation-strong">Y-axis</span>:
                    Voltage in millivolts (mV)
                  </li>
                  <li className="mode1-explanation-item">
                    <span className="mode1-explanation-strong">Green line</span>
                    : Represents the ECG signal waveform
                  </li>
                  <li className="mode1-explanation-item">
                    <span className="mode1-explanation-strong">Peaks</span>:
                    Correspond to heartbeats (QRS complexes)
                  </li>
                  <li className="mode1-explanation-item">
                    <span className="mode1-explanation-strong">
                      Regular patterns
                    </span>
                    : Indicate normal heart rhythm
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="mode1-placeholder-container">
              <p className="mode1-placeholder-text">
                📈 No ECG data to display
              </p>
              <p className="mode1-placeholder-text">
                Click "Fetch ECG Data" to load the signal
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
