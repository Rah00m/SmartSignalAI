// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useECG } from "./ecgContext";
// import "./home.css";

// function ECGHome() {
//   const navigate = useNavigate();
//   const {
//     selectedPatient,
//     setSelectedPatient,
//     selectedRecording,
//     setSelectedRecording,
//     length,
//     setLength,
//     offset,
//     setOffset,
//     patients,
//     setPatients,
//     recordings,
//     setRecordings,
//     ecgData,
//   } = useECG();

//   const [loadingPatients, setLoadingPatients] = useState(false);
//   const [loadingRecordings, setLoadingRecordings] = useState(false);
//   const [error, setError] = useState("");

//   // جلب جميع المرضى عند تحميل المكون
//   useEffect(() => {
//     const fetchPatients = async () => {
//       setLoadingPatients(true);
//       setError("");
//       console.log("🔍 Starting to fetch patients...");
//       try {
//         const apiUrl = `${import.meta.env.VITE_API_URL}/ecg/mode1/patients`;
//         console.log("📡 API URL:", apiUrl);

//         const res = await fetch(apiUrl);
//         console.log("📨 Response status:", res.status);

//         if (!res.ok) {
//           throw new Error(`HTTP error! status: ${res.status}`);
//         }

//         const json = await res.json();
//         console.log("📦 Response data:", json);

//         if (json.patients) {
//           console.log("✅ Patients found:", json.patients.length);
//           setPatients(json.patients);
//         } else if (json.error) {
//           setError(json.error);
//           console.error("❌ Error from API:", json.error);
//         } else {
//           setError("Unexpected response format from server");
//           console.error("❌ Unexpected response format:", json);
//         }
//       } catch (error) {
//         const errorMsg = `Failed to load patients: ${error.message}`;
//         setError(errorMsg);
//         console.error("💥 Fetch error:", error);
//       } finally {
//         setLoadingPatients(false);
//       }
//     };

//     fetchPatients();
//   }, [setPatients]);

//   // جلب التسجيلات عندما يتم اختيار مريض
//   useEffect(() => {
//     console.log("🔄 Selected patient changed:", selectedPatient);
//     if (!selectedPatient) {
//       setRecordings([]);
//       setSelectedRecording("");
//       return;
//     }

//     const fetchRecordings = async () => {
//       setLoadingRecordings(true);
//       setError("");
//       console.log("🔍 Fetching recordings for patient:", selectedPatient);
//       try {
//         const apiUrl = `${
//           import.meta.env.VITE_API_URL
//         }/ecg/mode1/records?patient=${selectedPatient}`;
//         console.log("📡 API URL:", apiUrl);

//         const res = await fetch(apiUrl);
//         console.log("📨 Response status:", res.status);

//         if (!res.ok) {
//           throw new Error(`HTTP error! status: ${res.status}`);
//         }

//         const json = await res.json();
//         console.log("📦 Response data:", json);

//         if (json.records) {
//           console.log("✅ Recordings found:", json.records.length);
//           const recs = json.records.map((r) => r.recording);
//           setRecordings(recs);
//         } else if (json.error) {
//           setError(json.error);
//           console.error("❌ Error from API:", json.error);
//           setRecordings([]);
//         }
//       } catch (error) {
//         const errorMsg = `Failed to load recordings: ${error.message}`;
//         setError(errorMsg);
//         console.error("💥 Fetch error:", error);
//         setRecordings([]);
//       } finally {
//         setLoadingRecordings(false);
//       }
//     };

//     fetchRecordings();
//   }, [selectedPatient, setRecordings, setSelectedRecording]);

//   // Navigate to Dashboard
//   const navigateToDashboard = () => {
//     if (!selectedPatient || !selectedRecording) {
//       alert("Please select both patient and recording before proceeding");
//       return;
//     }
//     navigate("/dashboard");
//   };

//   return (
//     <div className="home-container">
//       <div className="home-header">
//         <h1 className="home-title">SmartSignalAI</h1>
//         <h2 className="home-subtitle">Medical Signal Analysis System</h2>
//       </div>

//       {/* Error Display */}
//       {error && (
//         <div className="home-error-banner">
//           <span className="home-error-icon">❌</span>
//           <span className="home-error-text">{error}</span>
//           <button
//             className="home-error-close"
//             onClick={() => setError("")}
//           >
//             ✕
//           </button>
//         </div>
//       )}

//       <div className="home-content">
//         <div className="home-controls-panel">
//           <h3 className="home-controls-title">🎯 Patient Configuration</h3>

//           <div className="home-control-group">
//             <label className="home-control-label">👤 Patient</label>
//             <select
//               className="home-control-select"
//               value={selectedPatient || ""}
//               onChange={(e) => setSelectedPatient(e.target.value)}
//               disabled={loadingPatients}
//             >
//               <option value="">-- Select Patient --</option>
//               {patients && patients.map((patient) => (
//                 <option key={patient} value={patient}>
//                   {patient}
//                 </option>
//               ))}
//             </select>
//             {loadingPatients && (
//               <p className="home-loading-text">Loading patients...</p>
//             )}
//             {!loadingPatients && patients.length === 0 && (
//               <p className="home-error-text">No patients available</p>
//             )}
//           </div>

//           <div className="home-control-group">
//             <label className="home-control-label">🎙️ Recording</label>
//             <select
//               className="home-control-select"
//               value={selectedRecording || ""}
//               onChange={(e) => setSelectedRecording(e.target.value)}
//               disabled={!selectedPatient || loadingRecordings}
//             >
//               <option value="">-- Select Recording --</option>
//               {recordings && recordings.map((rec) => (
//                 <option key={rec} value={rec}>
//                   {rec}
//                 </option>
//               ))}
//             </select>
//             {loadingRecordings && (
//               <p className="home-loading-text">Loading recordings...</p>
//             )}
//             {selectedPatient && !loadingRecordings && recordings.length === 0 && (
//               <p className="home-error-text">No recordings available for this patient</p>
//             )}
//             {!selectedPatient && (
//               <p className="home-hint-text">Please select a patient first</p>
//             )}
//           </div>

//           <div className="home-settings-group">
//             <label className="home-setting-label">📏 Length</label>
//             <input
//               type="number"
//               className="home-setting-input"
//               value={length}
//               onChange={(e) => setLength(Number(e.target.value))}
//               min="100"
//               max="5000"
//               step="100"
//             />
//             <p className="home-hint-text">Number of data points (100-5000)</p>
//           </div>

//           <div className="home-settings-group">
//             <label className="home-setting-label">⏩ Offset</label>
//             <input
//               type="number"
//               className="home-setting-input"
//               value={offset}
//               onChange={(e) => setOffset(Number(e.target.value))}
//               min="0"
//               step="100"
//             />
//             <p className="home-hint-text">Starting point in the signal</p>
//           </div>

//           {/* معلومات الاختيار الحالي */}
//           {(selectedPatient || selectedRecording) && (
//             <div className="home-selection-info">
//               <h4 className="home-selection-title">Current Selection</h4>
//               <div className="home-selection-item">
//                 <span className="home-selection-label">Patient</span>
//                 <span className="home-selection-value">
//                   {selectedPatient || "Not selected"}
//                 </span>
//               </div>
//               <div className="home-selection-item">
//                 <span className="home-selection-label">Recording</span>
//                 <span className="home-selection-value">
//                   {selectedRecording || "Not selected"}
//                 </span>
//               </div>
//               <div className="home-selection-item">
//                 <span className="home-selection-label">Length</span>
//                 <span className="home-selection-value">{length} samples</span>
//               </div>
//               <div className="home-selection-item">
//                 <span className="home-selection-label">Offset</span>
//                 <span className="home-selection-value">{offset} samples</span>
//               </div>
//             </div>
//           )}

//           {/* Start Analysis Button */}
//           <button
//             className="home-start-button"
//             onClick={navigateToDashboard}
//             disabled={!selectedPatient || !selectedRecording}
//           >
//             🚀 Start ECG Analysis
//           </button>
//         </div>

//         {/* Analysis Features Preview */}
//         <div className="home-features-panel">
//           <h3 className="home-features-title">🔬 Analysis Features</h3>
//           <div className="home-features-grid">
//             <div className="home-feature-card">
//               <span className="home-feature-icon">📊</span>
//               <div className="home-feature-content">
//                 <h4>Real-time Monitor</h4>
//                 <p>View and analyze ECG signals in real-time with playback controls</p>
//               </div>
//             </div>

//             <div className="home-feature-card">
//               <span className="home-feature-icon">🔍</span>
//               <div className="home-feature-content">
//                 <h4>Abnormality Detection</h4>
//                 <p>Detect and analyze abnormal heartbeats automatically</p>
//               </div>
//             </div>

//             <div className="home-feature-card">
//               <span className="home-feature-icon">🛞</span>
//               <div className="home-feature-content">
//                 <h4>Polar Graph</h4>
//                 <p>Visualize ECG signals in polar coordinates for pattern analysis</p>
//               </div>
//             </div>

//             <div className="home-feature-card">
//               <span className="home-feature-icon">📈</span>
//               <div className="home-feature-content">
//                 <h4>Scatter Plot</h4>
//                 <p>Compare multiple ECG channels with scatter plot visualization</p>
//               </div>
//             </div>

//             <div className="home-feature-card">
//               <span className="home-feature-icon">🧠</span>
//               <div className="home-feature-content">
//                 <h4>AI Analysis</h4>
//                 <p>Advanced AI-powered ECG analysis and disease prediction</p>
//               </div>
//             </div>

//             <div className="home-feature-card">
//               <span className="home-feature-icon">🔄</span>
//               <div className="home-feature-content">
//                 <h4>XOR Graph</h4>
//                 <p>Signal comparison and pattern recognition using XOR operations</p>
//               </div>
//             </div>
//           </div>

//           {(!selectedPatient || !selectedRecording) && (
//             <div className="home-mode-hint">
//               <p>
//                 🔒 Please select a patient and recording to unlock the analysis dashboard
//               </p>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="home-data-status">
//         {selectedPatient && selectedRecording ? (
//           <div className="home-status-ready">
//             <span className="home-status-icon">✅</span>
//             <span className="home-status-text">
//               Ready to analyze: <strong>{selectedPatient}</strong> -{" "}
//               <strong>{selectedRecording}</strong>
//               <span className="home-status-details">
//                 Length: {length} samples | Offset: {offset} samples
//               </span>
//             </span>
//             <button className="home-go-button" onClick={navigateToDashboard}>
//               Go to Dashboard →
//             </button>
//           </div>
//         ) : (
//           <div className="home-status-waiting">
//             <span className="home-status-icon">⚠️</span>
//             <span className="home-status-text">
//               Please select a patient and recording to begin analysis
//             </span>
//           </div>
//         )}

//         {ecgData && (
//           <div className="home-ecg-data-info">
//             <span className="home-ecg-icon">📈</span>
//             <span className="home-ecg-text">
//               ECG data is loaded and ready for advanced analysis
//             </span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ECGHome;

import React, { useState, useEffect } from "react";
import { useECG } from "./ecgContext";
import { useNavigate } from "react-router-dom";
import Mode1 from "./Mode1";
import Mode2 from "./Mode2";
import Mode3 from "./Mode3";
import Mode4 from "./Mode4";
import Mode5 from "./Mode5";
import Mode6 from "./Mode6";
import "./home.css";

function ECGHome() {
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
  } = useECG();

  const [activeTab, setActiveTab] = useState("mode1");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch patients
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

  // Fetch recordings when patient changes
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

  // Render the active mode component
  const renderActiveMode = () => {
    if (!selectedPatient || !selectedRecording) {
      return (
        <div className="no-selection-message">
          <div className="selection-icon">📊</div>
          <h3>Please Select Patient and Recording</h3>
          <p>
            Choose a patient and recording from the controls above to start
            analysis
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case "mode1":
        return <Mode1 />;
      case "mode2":
        return <Mode2 />;
      case "mode3":
        return <Mode3 />;
      case "mode4":
        return <Mode4 />;
      case "mode6":
        return <Mode6 />;
      default:
        return <Mode1 />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">SmartSignalAI</h1>
        <h2 className="dashboard-subtitle">
          Medical Signal Analysis Dashboard
        </h2>
      </div>
      <button
        className="back-button"
        onClick={() => navigate("/")}
        type="button"
      >
        🏠 Back to Home
      </button>
      {/* Patient Selection Controls */}
      <div className="dashboard-controls-panel">
        <div className="controls-grid">
          <div className="control-group">
            <label className="control-label">👤 Patient</label>
            <select
              className="control-select"
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
              <p className="loading-text">Loading patients...</p>
            )}
          </div>

          <div className="control-group">
            <label className="control-label">🎙️ Recording</label>
            <select
              className="control-select"
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
              <p className="loading-text">Loading recordings...</p>
            )}
            {!selectedPatient && (
              <p className="hint-text">Select a patient first</p>
            )}
          </div>

          {/* <div className="control-group">
            <label className="control-label">📏 View Length</label>
            <input
              type="number"
              className="control-input"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              min="100"
              max="5000"
              step="100"
            />
            <p className="hint-text">{length} samples</p>
          </div> */}
          {/* 
          <div className="control-group">
            <label className="control-label">⏩ Offset</label>
            <input
              type="number"
              className="control-input"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              min="0"
              step="100"
            />
            <p className="hint-text">{offset} samples</p>
          </div> */}
        </div>

        {/* Current Selection Info */}
        {(selectedPatient || selectedRecording) && (
          <div className="selection-info">
            <h4 className="selection-title">Current Selection</h4>
            <div className="selection-grid">
              <div className="selection-item">
                <span className="selection-label">Patient:</span>
                <span className="selection-value">{selectedPatient}</span>
              </div>
              <div className="selection-item">
                <span className="selection-label">Recording:</span>
                <span className="selection-value">{selectedRecording}</span>
              </div>
              <div className="selection-item">
                <span className="selection-label">Length:</span>
                <span className="selection-value">{length} samples</span>
              </div>
              <div className="selection-item">
                <span className="selection-label">Offset:</span>
                <span className="selection-value">{offset} samples</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "mode1" ? "active" : ""}`}
          onClick={() => setActiveTab("mode1")}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-text">Real-time Monitor</span>
        </button>

        <button
          className={`tab-button ${activeTab === "mode2" ? "active" : ""}`}
          onClick={() => setActiveTab("mode2")}
        >
          <span className="tab-icon">🎯</span>
          <span className="tab-text">Abnormal Beats</span>
        </button>

        <button
          className={`tab-button ${activeTab === "mode3" ? "active" : ""}`}
          onClick={() => setActiveTab("mode3")}
        >
          <span className="tab-icon">🌀</span>
          <span className="tab-text">Polar Graph</span>
        </button>

        <button
          className={`tab-button ${activeTab === "mode6" ? "active" : ""}`}
          onClick={() => setActiveTab("mode6")}
        >
          <span className="tab-icon">🔄</span>
          <span className="tab-text">XOR Graph</span>
        </button>
      </div>

      {/* Mode Content Area */}
      <div className="dashboard-content">
        <div className="mode-container">{renderActiveMode()}</div>
      </div>

      {/* Status Bar */}
      <div className="dashboard-status">
        {selectedPatient && selectedRecording ? (
          <div className="status-ready">
            <span className="status-icon">✅</span>
            <span className="status-text">
              Ready: <strong>{selectedPatient}</strong> -{" "}
              <strong>{selectedRecording}</strong>
            </span>
          </div>
        ) : (
          <div className="status-waiting">
            <span className="status-icon">⏳</span>
            <span className="status-text">
              Waiting for patient and recording selection
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ECGHome;
