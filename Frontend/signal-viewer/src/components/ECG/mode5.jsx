import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode5.css";

export default function Mode5() {
  const navigate = useNavigate();
  const { selectedPatient, selectedRecording, ecgData, length, offset } =
    useECG();

  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [ecgDataLocal, setEcgDataLocal] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    console.log("🔄 ecgDataLocal updated:", ecgDataLocal);
    if (ecgDataLocal?.signals) {
      console.log("📈 Has ECG signals:", !!ecgDataLocal.signals);
      console.log(
        "🔢 ECG Channels count:",
        Object.keys(ecgDataLocal.signals).length
      );
      console.log("📊 ECG Channel names:", Object.keys(ecgDataLocal.signals));

      const firstChannel = Object.keys(ecgDataLocal.signals)[0];
      if (firstChannel) {
        console.log(
          "📋 First channel data sample:",
          ecgDataLocal.signals[firstChannel].slice(0, 5)
        );
      }
    }
  }, [ecgDataLocal]);

  const testAPIConnection = async () => {
    try {
      const testUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode1/all-signals?patient=${selectedPatient}&recording=${selectedRecording}&offset=${offset}&length=${length}`;

      console.log("🧪 Testing API with current parameters...");
      const response = await fetch(testUrl);
      const data = await response.json();

      console.log("🧪 API Test Result:", {
        status: response.status,
        hasSignals: !!data.signals,
        channels: data.signals ? Object.keys(data.signals) : [],
        channelCount: data.signals ? Object.keys(data.signals).length : 0,
        sampleData: data.signals ? data.signals.i?.slice(0, 3) : "none",
      });

      if (data.signals) {
        alert(
          `✅ API Test Successful! Found ${
            Object.keys(data.signals).length
          } channels`
        );

        console.log("💾 Auto-saving test data to state...");
        setEcgDataLocal({
          signals: data.signals,
          metadata: {
            patient: data.patient,
            recording: data.recording,
            diagnosis: data.diagnosis,
            available_channels: data.available_channels,
          },
        });
      } else {
        alert("❌ API Test Failed: No signals in response");
      }

      return data;
    } catch (error) {
      console.error("🧪 API Test Failed:", error);
      alert(`❌ API Test Error: ${error.message}`);
      return null;
    }
  };

  const loadAIModel = async () => {
    try {
      console.log("🔄 Loading AI Model...");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ecg/mode5/load-model`,
        {
          method: "POST",
        }
      );
      const result = await response.json();
      console.log("🤖 Model Load Result:", result);
      alert(result.message);

      checkModelStatus();
    } catch (error) {
      console.error("❌ Model load failed:", error);
      alert("Failed to load AI model: " + error.message);
    }
  };

  const testAIModel = async () => {
    try {
      console.log("🧪 Testing AI Model...");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ecg/mode5/test-model`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Model Test Result:", result);
      alert(result.message);
    } catch (error) {
      console.error("❌ Model test failed:", error);
      alert("Model test failed: " + error.message);
    }
  };

  const checkModelStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ecg/mode5/model-status`
      );
      const status = await response.json();
      console.log("📊 AI Model Status:", status);
      return status;
    } catch (error) {
      console.error("❌ Model status check failed:", error);
      return null;
    }
  };

  const loadECGDataDirectly = async () => {
    if (!selectedPatient || !selectedRecording) {
      setError("Please select patient and recording first");
      return;
    }

    setDataLoading(true);
    setError("");
    setEcgDataLocal(null);

    try {
      console.log("📡 Loading ECG data from API...", {
        patient: selectedPatient,
        recording: selectedRecording,
        offset: offset,
        length: length,
      });

      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode1/all-signals?patient=${selectedPatient}&recording=${selectedRecording}&offset=${offset}&length=${length}`;

      console.log("🌐 API URL:", apiUrl);

      const response = await fetch(apiUrl);
      console.log("📨 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Full API response received");

      if (data && data.signals && Object.keys(data.signals).length > 0) {
        console.log("✅ ECG signals found in response!");
        console.log("📊 Available ECG channels:", Object.keys(data.signals));

        const firstChannel = Object.keys(data.signals)[0];
        if (
          data.signals[firstChannel] &&
          data.signals[firstChannel].length > 0
        ) {
          console.log(
            "🔢 First channel samples:",
            data.signals[firstChannel].length
          );
          console.log(
            "📊 Sample data:",
            data.signals[firstChannel].slice(0, 5)
          );

          const newEcgData = {
            signals: data.signals,
            metadata: {
              patient: data.patient,
              recording: data.recording,
              diagnosis: data.diagnosis,
              available_channels: data.available_channels,
            },
          };

          console.log("💾 Setting ECG data to state:", newEcgData);
          setEcgDataLocal(newEcgData);

          console.log("🎉 ECG data saved to state successfully!");
        } else {
          throw new Error("ECG signals are empty");
        }
      } else {
        console.error("❌ No 'signals' found in response");
        console.log("🔍 Response structure:", Object.keys(data));
        throw new Error("No ECG signals found in API response");
      }
    } catch (error) {
      console.error("💥 Error loading ECG data:", error);
      setError(`Failed to load data: ${error.message}`);
      setEcgDataLocal(null);
    } finally {
      setDataLoading(false);
    }
  };

  const performComprehensiveAnalysis = async () => {
    const currentECGData = ecgData || ecgDataLocal;

    if (!currentECGData || !currentECGData.signals) {
      setError("No ECG data available. Please load data first.");
      return;
    }

    const ecgChannels = Object.keys(currentECGData.signals);
    if (ecgChannels.length === 0) {
      setError("No ECG channels found in the loaded data.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const requestData = {
        patient_info: {
          id: selectedPatient,
          // age: "52",
          // gender: "Male",
          // history: "No known cardiac history",
        },
        recording_data: {
          channels: ecgChannels.reduce((acc, channel) => {
            acc[channel] = {
              signal: currentECGData.signals[channel],
            };
            return acc;
          }, {}),
        },
      };

      console.log("🚀 Sending REAL ECG data for analysis...", {
        patient: selectedPatient,
        recording: selectedRecording,
        channels: ecgChannels,
        samples: ecgChannels.map((ch) => currentECGData.signals[ch].length),
      });

      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode5/comprehensive-analysis`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();

      if (jsonData.success) {
        console.log("✅ Analysis received:", jsonData);
        setAnalysisData(jsonData);

        if (
          jsonData.channel_analysis &&
          Object.keys(jsonData.channel_analysis).length > 0
        ) {
          const firstChannel = Object.keys(jsonData.channel_analysis)[0];
          setSelectedChannel(firstChannel);
          console.log("🎯 Selected channel:", firstChannel);
        }
      } else {
        throw new Error(jsonData.error || "Analysis failed");
      }
    } catch (error) {
      console.error("💥 Analysis error:", error);
      setError(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelSelect = (channelName) => {
    setSelectedChannel(channelName);
    console.log("🎯 Channel selected:", channelName);
  };

  const riskColors = {
    "Very High": "#ff6b6b",
    High: "#ffa726",
    Medium: "#ffd54f",
    Low: "#4caf50",
    None: "#66bb6a",
  };

  const riskBgColors = {
    "Very High": "rgba(255, 107, 107, 0.1)",
    High: "rgba(255, 167, 38, 0.1)",
    Medium: "rgba(255, 213, 79, 0.1)",
    Low: "rgba(76, 175, 80, 0.1)",
    None: "rgba(102, 187, 106, 0.1)",
  };

  const currentECGData = ecgData || ecgDataLocal;
  const hasECGSignals =
    currentECGData &&
    currentECGData.signals &&
    Object.keys(currentECGData.signals).length > 0;
  const ecgChannels = hasECGSignals ? Object.keys(currentECGData.signals) : [];
  const channelsCount = ecgChannels.length;
  const firstChannelSamples = hasECGSignals
    ? currentECGData.signals[ecgChannels[0]]?.length
    : 0;

  const selectedChannelAnalysis =
    selectedChannel && analysisData?.channel_analysis?.[selectedChannel];

  const forceLoadData = async () => {
    console.log("🔧 Force loading data...");
    await loadECGDataDirectly();
  };

  return (
    <div className="mode5-container">
      <div className="mode5-header">
        <button className="mode5-back-button" onClick={() => navigate("/")}>
          🏠 Back to Home
        </button>
        <h1 className="mode5-title">🧠 Mode 5 - AI Comprehensive Analysis</h1>
      </div>

      {/* معلومات المريض */}
      <div className="mode5-patient-info">
        <div className="mode5-patient-item">
          <div className="mode5-patient-label">Patient</div>
          <div className="mode5-patient-value">
            {selectedPatient || "Not selected"}
          </div>
        </div>
        <div className="mode5-patient-item">
          <div className="mode5-patient-label">Recording</div>
          <div className="mode5-patient-value">
            {selectedRecording || "Not selected"}
          </div>
        </div>
        <div className="mode5-patient-item">
          <div className="mode5-patient-label">Offset</div>
          <div className="mode5-patient-value">{offset}</div>
        </div>
        <div className="mode5-patient-item">
          <div className="mode5-patient-label">Length</div>
          <div className="mode5-patient-value">{length}</div>
        </div>
        <div className="mode5-patient-item">
          <div className="mode5-patient-label">ECG Signals</div>
          <div className="mode5-patient-value">
            {hasECGSignals ? "✅ Loaded" : "❌ Not loaded"}
            {ecgDataLocal && hasECGSignals && " (Direct)"}
            {dataLoading && " 🔄 Loading..."}
          </div>
        </div>
        <div className="mode5-patient-item">
          <div className="mode5-patient-label">ECG Channels</div>
          <div className="mode5-patient-value">
            {hasECGSignals ? `${channelsCount} channels` : "0 channels"}
            {ecgDataLocal && hasECGSignals && ` (From direct load)`}
          </div>
        </div>
      </div>

      {!selectedPatient || !selectedRecording ? (
        <div className="mode5-warning">
          ⚠️ Please select patient and recording from Home page first
        </div>
      ) : (
        <div className="mode5-content">
          {/* لوحة التحكم */}
          <div className="mode5-controls-panel">
            <h3 className="mode5-controls-title">🎯 Analysis Control</h3>

            <div className="mode5-debug-buttons">
              <button
                onClick={() => {
                  console.log("=== DEBUG ECG DATA ===");
                  console.log("currentECGData:", currentECGData);
                  console.log("hasECGSignals:", hasECGSignals);
                  console.log("ecgChannels:", ecgChannels);
                  console.log("channelsCount:", channelsCount);
                  console.log("firstChannelSamples:", firstChannelSamples);
                  console.log("ecgDataLocal:", ecgDataLocal);

                  if (hasECGSignals) {
                    console.log(
                      "📊 First channel data:",
                      currentECGData.signals[ecgChannels[0]]?.slice(0, 10)
                    );
                  }
                }}
                className="mode5-debug-button"
              >
                🔍 Debug ECG Data
              </button>

              <button
                onClick={testAPIConnection}
                className="mode5-test-api-button"
              >
                🧪 Test API Connection
              </button>

              <button onClick={loadAIModel} className="mode5-load-model-button">
                🤖 Load AI Model
              </button>
              <button onClick={testAIModel} className="mode5-test-model-button">
                🧪 Test AI Model
              </button>

              <button
                onClick={checkModelStatus}
                className="mode5-status-button"
              >
                📊 Check Status
              </button>

              <button
                onClick={forceLoadData}
                className="mode5-force-load-button"
              >
                🔧 Force Load Data
              </button>
            </div>

            {hasECGSignals ? (
              <div className="mode5-data-info success">
                <h4 className="mode5-data-title">
                  ✅ ECG Signals Loaded Successfully!
                </h4>
                <div className="mode5-channels-count">
                  <span className="mode5-data-label">ECG Channels:</span>
                  <span className="mode5-data-value success">
                    {channelsCount} channels
                  </span>
                </div>
                <div className="mode5-sample-count">
                  <span className="mode5-data-label">Samples:</span>
                  <span className="mode5-data-value">
                    {firstChannelSamples} per channel
                  </span>
                </div>
                <div className="mode5-channels-list-preview">
                  <strong>ECG Channels:</strong>
                  {ecgChannels.slice(0, 8).map((channel) => (
                    <span key={channel} className="mode5-channel-tag">
                      {channel}
                    </span>
                  ))}
                  {channelsCount > 8 && (
                    <span className="mode5-channel-tag-more">
                      +{channelsCount - 8} more
                    </span>
                  )}
                </div>
                <div className="mode5-data-preview">
                  <strong>Sample from {ecgChannels[0]}:</strong>
                  <code>
                    [
                    {currentECGData.signals[ecgChannels[0]]
                      ?.slice(0, 5)
                      .join(", ")}
                    ...]
                  </code>
                </div>
                <div className="mode5-data-source">
                  <span className="mode5-source-label">Source:</span>
                  <span className="mode5-source-value">
                    {ecgData ? "From Home Context" : "Direct API Load"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mode5-data-info">
                <h4 className="mode5-data-title">📊 Data Status</h4>
                <div className="mode5-data-warning">
                  ⚠️ No ECG signals loaded
                </div>
                <button
                  className="mode5-load-data-button"
                  onClick={loadECGDataDirectly}
                  disabled={dataLoading}
                >
                  {dataLoading ? (
                    <>
                      <div className="mode5-spinner-small"></div>
                      Loading ECG Signals...
                    </>
                  ) : (
                    "📥 Load ECG Data Directly"
                  )}
                </button>
                <p className="mode5-hint-text">
                  Load actual ECG signals from API for analysis
                </p>
                {error && <div className="mode5-error-small">❌ {error}</div>}
              </div>
            )}

            <div className="mode5-analysis-group">
              <button
                className="mode5-analyze-button"
                onClick={performComprehensiveAnalysis}
                disabled={!hasECGSignals || loading}
              >
                {loading ? (
                  <>
                    <div className="mode5-spinner-small"></div>
                    AI Analysis in Progress...
                  </>
                ) : (
                  <>🧠 Start AI Comprehensive Analysis</>
                )}
              </button>
              <p className="mode5-hint-text">
                {hasECGSignals
                  ? `Perform AI analysis on ${channelsCount} ECG channels`
                  : "Load ECG data first to enable analysis"}
              </p>
            </div>

            {/* التشخيص النهائي */}
            {analysisData?.final_diagnosis && (
              <div
                className="mode5-final-diagnosis"
                style={{
                  borderLeftColor:
                    riskColors[analysisData.final_diagnosis.severity],
                  backgroundColor:
                    riskBgColors[analysisData.final_diagnosis.severity],
                }}
              >
                <h4 className="mode5-diagnosis-title">🏥 Final Diagnosis</h4>
                <div className="mode5-diagnosis-main">
                  {analysisData.final_diagnosis.diagnosis_description}
                </div>
                <div className="mode5-diagnosis-details">
                  <div className="mode5-confidence">
                    <span className="mode5-detail-label">Confidence:</span>
                    <span className="mode5-detail-value">
                      {analysisData.final_diagnosis.confidence}%
                    </span>
                  </div>
                  <div className="mode5-agreement">
                    <span className="mode5-detail-label">
                      Channel Agreement:
                    </span>
                    <span className="mode5-detail-value">
                      {analysisData.final_diagnosis.agreement_ratio}%
                    </span>
                  </div>
                  <div className="mode5-severity">
                    <span className="mode5-detail-label">Risk Level:</span>
                    <span
                      className="mode5-detail-value"
                      style={{
                        color:
                          riskColors[analysisData.final_diagnosis.severity],
                      }}
                    >
                      {analysisData.final_diagnosis.severity}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* قائمة القنوات */}
            {analysisData?.channel_analysis && (
              <div className="mode5-channels-list">
                <h4 className="mode5-channels-title">📊 Channel Results</h4>
                {Object.entries(analysisData.channel_analysis).map(
                  ([channelName, channelData]) => (
                    <div
                      key={channelName}
                      className={`mode5-channel-item ${
                        selectedChannel === channelName ? "selected" : ""
                      }`}
                      onClick={() => handleChannelSelect(channelName)}
                      style={{
                        borderLeftColor: riskColors[channelData.risk_level],
                        backgroundColor:
                          selectedChannel === channelName
                            ? riskBgColors[channelData.risk_level]
                            : "transparent",
                      }}
                    >
                      <div className="mode5-channel-header">
                        <span className="mode5-channel-name">
                          {channelName}
                        </span>
                        <span
                          className="mode5-channel-confidence"
                          style={{ color: riskColors[channelData.risk_level] }}
                        >
                          {channelData.main_diagnosis?.confidence}%
                        </span>
                      </div>
                      <div className="mode5-channel-diagnosis">
                        {channelData.main_diagnosis?.diagnosis_description}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* التوصيات */}
            {analysisData?.summary?.priority_recommendations && (
              <div className="mode5-recommendations">
                <h4 className="mode5-recommendations-title">
                  💡 Priority Recommendations
                </h4>
                <div className="mode5-recommendations-list">
                  {analysisData.summary.priority_recommendations.map(
                    (rec, index) => (
                      <div key={index} className="mode5-recommendation-item">
                        <span className="mode5-recommendation-number">
                          {index + 1}.
                        </span>
                        <span className="mode5-recommendation-text">{rec}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* منطقة التفاصيل */}
          <div className="mode5-details-container">
            {dataLoading && (
              <div className="mode5-loading-container">
                <div className="mode5-spinner"></div>
                <p className="mode5-loading-text">Loading ECG Signals...</p>
                <p className="mode5-loading-subtext">
                  Fetching {length} samples from recording {selectedRecording}
                </p>
              </div>
            )}

            {loading && (
              <div className="mode5-loading-container">
                <div className="mode5-spinner"></div>
                <p className="mode5-loading-text">AI Analysis in Progress</p>
                <p className="mode5-loading-subtext">
                  Analyzing {channelsCount} ECG channels for cardiac
                  abnormalities
                </p>
              </div>
            )}

            {error && (
              <div className="mode5-error-container">
                <p className="mode5-error-text">❌ {error}</p>
                <div className="mode5-error-actions">
                  <button
                    className="mode5-retry-button"
                    onClick={loadECGDataDirectly}
                  >
                    🔄 Retry Loading Data
                  </button>
                  <button
                    className="mode5-force-retry-button"
                    onClick={forceLoadData}
                  >
                    🔧 Force Load
                  </button>
                </div>
              </div>
            )}

            {!hasECGSignals && !dataLoading && !loading ? (
              <div className="mode5-placeholder-container">
                <div className="mode5-placeholder-icon">📡</div>
                <p className="mode5-placeholder-text">
                  No ECG Signals Available
                </p>
                <p className="mode5-placeholder-subtext">
                  Click "Load ECG Data Directly" to load ECG signals for
                  analysis
                </p>
                <div className="mode5-placeholder-actions">
                  <button
                    className="mode5-test-api-btn"
                    onClick={testAPIConnection}
                  >
                    🧪 Test API Connection
                  </button>
                  <button
                    className="mode5-force-load-btn"
                    onClick={forceLoadData}
                  >
                    🔧 Force Load Data
                  </button>
                </div>
              </div>
            ) : hasECGSignals && !analysisData && !loading ? (
              <div className="mode5-ready-container">
                <div className="mode5-ready-icon">🧠</div>
                <p className="mode5-ready-text">Ready for AI Analysis</p>
                <p className="mode5-ready-subtext">
                  ECG signals loaded! Click to start comprehensive analysis
                </p>
                <div className="mode5-data-preview-large">
                  <h4>📋 ECG Data Ready for Analysis</h4>
                  <div className="mode5-preview-grid">
                    <div className="mode5-preview-item">
                      <span>Patient:</span>
                      <strong>{selectedPatient}</strong>
                    </div>
                    <div className="mode5-preview-item">
                      <span>Recording:</span>
                      <strong>{selectedRecording}</strong>
                    </div>
                    <div className="mode5-preview-item">
                      <span>ECG Channels:</span>
                      <strong>{channelsCount}</strong>
                    </div>
                    <div className="mode5-preview-item">
                      <span>Samples per Channel:</span>
                      <strong>{firstChannelSamples}</strong>
                    </div>
                    <div className="mode5-preview-item full-width">
                      <span>Available ECG Channels:</span>
                      <div className="mode5-channels-display">
                        {ecgChannels.map((channel) => (
                          <span key={channel} className="mode5-channel-badge">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : analysisData ? (
              <div className="mode5-analysis-results">
                {/* نتائج التحليل */}
                {selectedChannel && selectedChannelAnalysis ? (
                  <div className="mode5-channel-details">
                    <h3>📈 Detailed Analysis: {selectedChannel}</h3>

                    <div className="mode5-detail-section">
                      <h4>🏥 Main Diagnosis</h4>
                      <p>
                        {
                          selectedChannelAnalysis.main_diagnosis
                            ?.diagnosis_description
                        }
                      </p>
                      <div className="mode5-confidence-badge">
                        Confidence:{" "}
                        {selectedChannelAnalysis.main_diagnosis?.confidence}%
                      </div>
                    </div>

                    {selectedChannelAnalysis.secondary_findings && (
                      <div className="mode5-detail-section">
                        <h4>🔍 Secondary Findings</h4>
                        <ul>
                          {selectedChannelAnalysis.secondary_findings.map(
                            (finding) => (
                              <li key={finding}>{finding}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="mode5-detail-section">
                      <h4>⚠️ Risk Assessment</h4>
                      <div
                        className="mode5-risk-badge"
                        style={{
                          backgroundColor:
                            riskBgColors[selectedChannelAnalysis.risk_level],
                          color: riskColors[selectedChannelAnalysis.risk_level],
                          borderColor:
                            riskColors[selectedChannelAnalysis.risk_level],
                        }}
                      >
                        {selectedChannelAnalysis.risk_level}
                      </div>
                    </div>

                    {selectedChannelAnalysis.technical_quality && (
                      <div className="mode5-detail-section">
                        <h4>📊 Signal Quality</h4>
                        <p>{selectedChannelAnalysis.technical_quality}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mode5-overview">
                    <h3>📊 Analysis Overview</h3>
                    <p>
                      Select a channel from the left panel to view detailed
                      analysis
                    </p>

                    <div className="mode5-summary-stats">
                      <div className="mode5-stat">
                        <span className="mode5-stat-label">
                          Total Channels Analyzed:
                        </span>
                        <span className="mode5-stat-value">
                          {Object.keys(analysisData.channel_analysis).length}
                        </span>
                      </div>
                      <div className="mode5-stat">
                        <span className="mode5-stat-label">
                          Overall Confidence:
                        </span>
                        <span className="mode5-stat-value">
                          {analysisData.final_diagnosis.confidence}%
                        </span>
                      </div>
                      <div className="mode5-stat">
                        <span className="mode5-stat-label">
                          Channel Agreement:
                        </span>
                        <span className="mode5-stat-value">
                          {analysisData.final_diagnosis.agreement_ratio}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
