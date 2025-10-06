import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./home.css";

function ECGHome() {
  const navigate = useNavigate();
  const {
    selectedPatient,
    setSelectedPatient,
    selectedRecording,
    setSelectedRecording,
    length,
    setLength,
    offset,
    setOffset,
    patients,
    setPatients,
    recordings,
    setRecordings,
    ecgData,
  } = useECG();

  // جلب جميع المرضى عند تحميل المكون
  useEffect(() => {
    const fetchPatients = async () => {
      console.log("🔍 Starting to fetch patients...");
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL}/ecg/mode1/patients`;
        console.log("📡 API URL:", apiUrl);

        const res = await fetch(apiUrl);
        console.log("📨 Response status:", res.status);

        const json = await res.json();
        console.log("📦 Response data:", json);

        if (json.patients) {
          console.log("✅ Patients found:", json.patients.length);
          setPatients(json.patients);
        } else if (json.error) {
          console.error("❌ Error from API:", json.error);
        } else {
          console.error("❌ Unexpected response format:", json);
        }
      } catch (error) {
        console.error("💥 Fetch error:", error);
      }
    };

    fetchPatients();
  }, []);

  // جلب التسجيلات عندما يتم اختيار مريض
  useEffect(() => {
    console.log("🔄 Selected patient changed:", selectedPatient);
    if (!selectedPatient) {
      setRecordings([]);
      setSelectedRecording("");
      return;
    }

    const fetchRecordings = async () => {
      console.log("🔍 Fetching recordings for patient:", selectedPatient);
      try {
        const apiUrl = `${
          import.meta.env.VITE_API_URL
        }/ecg/mode1/records?patient=${selectedPatient}`;
        console.log("📡 API URL:", apiUrl);

        const res = await fetch(apiUrl);
        console.log("📨 Response status:", res.status);

        const json = await res.json();
        console.log("📦 Response data:", json);

        if (json.records) {
          console.log("✅ Recordings found:", json.records.length);
          const recs = json.records.map((r) => r.recording);
          setRecordings(recs);
        } else if (json.error) {
          console.error("❌ Error from API:", json.error);
          setRecordings([]);
        }
      } catch (error) {
        console.error("💥 Fetch error:", error);
        setRecordings([]);
      }
    };

    fetchRecordings();
  }, [selectedPatient]);

  const navigateToMode = (mode) => {
    if (!selectedPatient || !selectedRecording) {
      alert("Please select both patient and recording before proceeding");
      return;
    }
    navigate(mode);
  };

  return (

    <div className="home-container">
      <button className="back-button" onClick={() => navigate("/")}>
          Back to Home
        </button>
      <div className="home-header">
        
        <h1 className="home-title">SmartSignalAI</h1>

        <h2 className="home-subtitle">Medical Signal Analysis System</h2>
      </div>


      <div className="home-content">

        <div className="home-controls-panel">
          <h3 className="home-controls-title">🎯 Patient Configuration</h3>

          <div className="home-control-group">
            <label className="home-control-label">👤 Patient</label>
            <select
              className="home-control-select"
              value={selectedPatient || ""}
              onChange={(e) => setSelectedPatient(e.target.value)}
            >
              <option value="">-- Select Patient --</option>
              {patients.map((patient) => (
                <option key={patient} value={patient}>
                  {patient}
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="home-loading-text">Loading patients...</p>
            )}
          </div>

          <div className="home-control-group">
            <label className="home-control-label">🎙️ Recording</label>
            <select
              className="home-control-select"
              value={selectedRecording || ""}
              onChange={(e) => setSelectedRecording(e.target.value)}
              disabled={!selectedPatient}
            >
              <option value="">-- Select Recording --</option>
              {recordings.map((rec) => (
                <option key={rec} value={rec}>
                  {rec}
                </option>
              ))}
            </select>
            {selectedPatient && recordings.length === 0 && (
              <p className="home-loading-text">Loading recordings...</p>
            )}
            {!selectedPatient && (
              <p className="home-hint-text">Please select a patient first</p>
            )}
          </div>

          <div className="home-settings-group">
            <label className="home-setting-label">📏 Length</label>
            <input
              type="number"
              className="home-setting-input"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              min="100"
              max="5000"
              step="100"
            />
            <p className="home-hint-text">Number of data points (100-5000)</p>
          </div>

          <div className="home-settings-group">
            <label className="home-setting-label">⏩ Offset</label>
            <input
              type="number"
              className="home-setting-input"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              min="0"
              step="100"
            />
            <p className="home-hint-text">Starting point in the signal</p>
          </div>

          {/* معلومات الاختيار الحالي */}
          {(selectedPatient || selectedRecording) && (
            <div className="home-selection-info">
              <h4 className="home-selection-title">Current Selection</h4>
              <div className="home-selection-item">
                <span className="home-selection-label">Patient</span>
                <span className="home-selection-value">
                  {selectedPatient || "Not selected"}
                </span>
              </div>
              <div className="home-selection-item">
                <span className="home-selection-label">Recording</span>
                <span className="home-selection-value">
                  {selectedRecording || "Not selected"}
                </span>
              </div>
              <div className="home-selection-item">
                <span className="home-selection-label">Length</span>
                <span className="home-selection-value">{length} samples</span>
              </div>
              <div className="home-selection-item">
                <span className="home-selection-label">Offset</span>
                <span className="home-selection-value">{offset} samples</span>
              </div>
            </div>
          )}
        </div>

        {/* حاوية اختيار المودات على اليمين */}
        <div className="home-modes-panel">
          <h3 className="home-modes-title">🔬 Analysis Modes</h3>

          <div className="home-modes-grid">
            <button
              className="home-mode-button mode1-btn"
              onClick={() => navigateToMode("/mode1")}
              disabled={!selectedPatient || !selectedRecording}
            >
              <span className="home-mode-icon">📊</span>
              <span className="home-mode-text">
                <span className="home-mode-name">Mode 1 - Signal Viewer</span>
                <span className="home-mode-description">
                  View raw ECG signals
                </span>
              </span>
            </button>

            <button
              className="home-mode-button mode2-btn"
              onClick={() => navigateToMode("/mode2")}
              disabled={!selectedPatient || !selectedRecording}
            >
              <span className="home-mode-icon">🔍</span>
              <span className="home-mode-text">
                <span className="home-mode-name">
                  Mode 2 - Abnormality Detection
                </span>
                <span className="home-mode-description">
                  Detect abnormal heartbeats
                </span>
              </span>
            </button>

            <button
              className="home-mode-button mode3-btn"
              onClick={() => navigateToMode("/mode3")}
              disabled={!selectedPatient || !selectedRecording}
            >
              <span className="home-mode-icon">🛞</span>
              <span className="home-mode-text">
                <span className="home-mode-name">Mode 3 - Polar Graph</span>
                <span className="home-mode-description">
                  Visualize signal in polar coordinates
                </span>
              </span>
            </button>

            <button
              className="home-mode-button mode4-btn"
              onClick={() => navigateToMode("/mode4")}
              disabled={!selectedPatient || !selectedRecording}
            >
              <span className="home-mode-icon">🔄</span>
              <span className="home-mode-text">
                <span className="home-mode-name">Mode 4 - Recurrence Plot</span>
                <span className="home-mode-description">
                  Analyze signal recurrence patterns
                </span>
              </span>
            </button>

            <button
              className="home-mode-button mode5-btn"
              onClick={() => navigateToMode("/mode5")}
              disabled={!selectedPatient || !selectedRecording}
            >
              <span className="home-mode-icon">🧠</span>
              <span className="home-mode-text">
                <span className="home-mode-name">
                  Mode 5 - Disease Prediction
                </span>
                <span className="home-mode-description">
                  Predict Disease from ECG channels analysis
                </span>
              </span>
            </button>
            <button
              className="home-mode-button mode6-btn"
              onClick={() => navigateToMode("/mode6")}
              disabled={!selectedPatient || !selectedRecording}
            >
              <span className="home-mode-icon">📈</span>
              <span className="home-mode-text">
                <span className="home-mode-name">Mode 6 - Xor graph</span>
                <span className="home-mode-description">
                  Xor graph for signal analysis
                </span>
              </span>
            </button>
          </div>

          {(!selectedPatient || !selectedRecording) && (
            <div className="home-mode-hint">
              <p>
                🔒 Please select a patient and recording to unlock all modes
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="home-data-status">
        {selectedPatient && selectedRecording ? (
          <div className="home-status-ready">
            <span className="home-status-icon">✅</span>
            <span className="home-status-text">
              Ready to analyze: <strong>{selectedPatient}</strong> -{" "}
              <strong>{selectedRecording}</strong>
              <span className="home-status-details">
                Length: {length} samples | Offset: {offset} samples
              </span>
            </span>
          </div>
        ) : (
          <div className="home-status-waiting">
            <span className="home-status-icon">⚠️</span>
            <span className="home-status-text">
              Please select a patient and recording to begin analysis
            </span>
          </div>
        )}

        {ecgData && (
          <div className="home-ecg-data-info">
            <span className="home-ecg-icon">📈</span>
            <span className="home-ecg-text">
              ECG data is loaded and ready for advanced analysis
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ECGHome;
