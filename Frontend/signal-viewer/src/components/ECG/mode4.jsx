import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode4.css";

function computeRecurrencePlot(signal1, signal2, threshold) {
  const N = signal1.length;

  const normalize = (arr) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min;
    if (range === 0) return arr.map(() => 0.5);
    return arr.map((val) => (val - min) / range);
  };

  const norm1 = normalize(signal1);
  const norm2 = normalize(signal2);

  const matrix = Array(N)
    .fill(null)
    .map(() => Array(N).fill(0));

  let similarCount = 0;

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const dist = Math.abs(norm1[i] - norm2[j]);
      matrix[i][j] = dist <= threshold ? 1 : 0;
      if (matrix[i][j] === 1) similarCount++;
    }
  }

  console.log(
    `✅ Recurrence Plot: ${similarCount}/${N * N} similar points (${(
      (similarCount / (N * N)) *
      100
    ).toFixed(1)}%)`
  );

  return matrix;
}

function computeAdaptiveThreshold(signal1, signal2) {
  const mean1 = signal1.reduce((a, b) => a + b, 0) / signal1.length;
  const mean2 = signal2.reduce((a, b) => a + b, 0) / signal2.length;

  const variance1 =
    signal1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / signal1.length;
  const variance2 =
    signal2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / signal2.length;

  const std1 = Math.sqrt(variance1);
  const std2 = Math.sqrt(variance2);

  return ((std1 + std2) / 2) * 0.1;
}

export default function Mode4() {
  const navigate = useNavigate();
  const { selectedPatient, selectedRecording, length, offset } = useECG();

  const [threshold, setThreshold] = useState(0.1);
  const [windowSize, setWindowSize] = useState(200);
  const [useAdaptive, setUseAdaptive] = useState(true);
  const [channel1, setChannel1] = useState("i");
  const [channel2, setChannel2] = useState("ii");
  const [loading, setLoading] = useState(false);
  const [signalsData, setSignalsData] = useState(null);
  const [error, setError] = useState("");

  const fetchSignals = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    setError("");

    try {
      const channelsParam = `${channel1},${channel2}`;

      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode4/signal?patient=${selectedPatient}&recording=${selectedRecording}&channels=${channelsParam}&offset=${offset}&length=${length}`;

      console.log("🔄 Fetching signals from:", apiUrl);

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.signals) {
        console.log("✅ Signals data received:", jsonData.signals);
        console.log(
          "📊 Channel 1 data length:",
          jsonData.signals[channel1]?.length
        );
        console.log(
          "📊 Channel 2 data length:",
          jsonData.signals[channel2]?.length
        );
        setSignalsData(jsonData);
      } else {
        setError(jsonData.error || "Failed to fetch signals data");
        setSignalsData(null);
      }
    } catch (error) {
      console.error("💥 Error fetching signals:", error);
      setError("Network error - Could not connect to server");
      setSignalsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatient && selectedRecording) {
      fetchSignals();
    }
  }, [channel1, channel2, selectedPatient, selectedRecording, length, offset]);

  let recurrenceMatrix = [];
  let plotData = [];
  let plotLayout = {};
  let signal1 = [];
  let signal2 = [];

  if (
    signalsData &&
    signalsData.signals &&
    signalsData.signals[channel1] &&
    signalsData.signals[channel2] &&
    signalsData.signals[channel1].length > 0 &&
    signalsData.signals[channel2].length > 0
  ) {
    signal1 = signalsData.signals[channel1].slice(0, windowSize);
    signal2 = signalsData.signals[channel2].slice(0, windowSize);

    console.log("🔍 Processing signals:", {
      channel1,
      channel2,
      signal1Length: signal1.length,
      signal2Length: signal2.length,
      signal1Sample: signal1.slice(0, 5),
      signal2Sample: signal2.slice(0, 5),
    });

    const minLength = Math.min(signal1.length, signal2.length);
    const trimmedSignal1 = signal1.slice(0, minLength);
    const trimmedSignal2 = signal2.slice(0, minLength);

    const appliedThreshold = useAdaptive
      ? computeAdaptiveThreshold(trimmedSignal1, trimmedSignal2)
      : threshold;

    console.log("🔄 Computing recurrence plot...");
    console.log("Trimmed Signal 1 length:", trimmedSignal1.length);
    console.log("Trimmed Signal 2 length:", trimmedSignal2.length);
    console.log("Applied threshold:", appliedThreshold);

    recurrenceMatrix = computeRecurrencePlot(
      trimmedSignal1,
      trimmedSignal2,
      appliedThreshold
    );

    plotData = [
      {
        z: recurrenceMatrix,
        type: "heatmap",
        colorscale: [
          [0, "black"],
          [1, "white"],
        ],
        showscale: false,
      },
    ];

    plotLayout = {
      width: 600,
      height: 600,
      title: {
        text: `Recurrence Plot: ${channel1.toUpperCase()} vs ${channel2.toUpperCase()}`,
        font: { size: 18, color: "white" },
      },
      xaxis: {
        title: {
          text: `Time (${channel2.toUpperCase()})`,
          font: { color: "white" },
        },
        tickfont: { color: "white" },
        gridcolor: "#666",
        showline: true,
        linecolor: "white",
      },
      yaxis: {
        title: {
          text: `Time (${channel1.toUpperCase()})`,
          font: { color: "white" },
        },
        tickfont: { color: "white" },
        gridcolor: "#666",
        showline: true,
        linecolor: "white",
      },
      paper_bgcolor: "#1f2937",
      plot_bgcolor: "#111827",
      font: { color: "white" },
      margin: { t: 60, r: 40, b: 60, l: 60 },
    };
  }

  return (
    <div className="mode4-container">
      <div className="mode4-header">
        <button className="mode4-back-button" onClick={() => navigate("/")}>
          🏠 Back to Home
        </button>
        <h1 className="mode4-title">🔄 Mode 4 - Recurrence Plot</h1>
      </div>

      {/* معلومات المريض */}
      <div className="mode4-patient-info">
        <div className="mode4-patient-item">
          <div className="mode4-patient-label">Patient</div>
          <div className="mode4-patient-value">
            {selectedPatient || "Not selected"}
          </div>
        </div>
        <div className="mode4-patient-item">
          <div className="mode4-patient-label">Recording</div>
          <div className="mode4-patient-value">
            {selectedRecording || "Not selected"}
          </div>
        </div>
        <div className="mode4-patient-item">
          <div className="mode4-patient-label">Length</div>
          <div className="mode4-patient-value">{length} samples</div>
        </div>
        <div className="mode4-patient-item">
          <div className="mode4-patient-label">Offset</div>
          <div className="mode4-patient-value">{offset} samples</div>
        </div>
      </div>

      {(!selectedPatient || !selectedRecording) && (
        <div className="mode4-warning">
          ⚠️ Please select patient and recording from Home page
        </div>
      )}

      <div className="mode4-content">
        {/* لوحة التحكم */}
        <div className="mode4-controls-panel">
          <h3 className="mode4-controls-title">🎯 Channel Configuration</h3>

          {/* اختيار القنوات */}
          <div className="mode4-channel-group">
            <label className="mode4-channel-label">📡 Channel 1 (Y-axis)</label>
            <select
              className="mode4-channel-select"
              value={channel1}
              onChange={(e) => setChannel1(e.target.value)}
              disabled={!selectedPatient || !selectedRecording}
            >
              <option value="i">I</option>
              <option value="ii">II</option>
              <option value="iii">III</option>
              <option value="avr">aVR</option>
              <option value="avl">aVL</option>
              <option value="avf">aVF</option>
              <option value="v1">V1</option>
              <option value="v2">V2</option>
              <option value="v3">V3</option>
              <option value="v4">V4</option>
              <option value="v5">V5</option>
              <option value="v6">V6</option>
            </select>
          </div>

          <div className="mode4-channel-group">
            <label className="mode4-channel-label">📡 Channel 2 (X-axis)</label>
            <select
              className="mode4-channel-select"
              value={channel2}
              onChange={(e) => setChannel2(e.target.value)}
              disabled={!selectedPatient || !selectedRecording}
            >
              <option value="i">I</option>
              <option value="ii">II</option>
              <option value="iii">III</option>
              <option value="avr">aVR</option>
              <option value="avl">aVL</option>
              <option value="avf">aVF</option>
              <option value="v1">V1</option>
              <option value="v2">V2</option>
              <option value="v3">V3</option>
              <option value="v4">V4</option>
              <option value="v5">V5</option>
              <option value="v6">V6</option>
            </select>
          </div>

          {/* إعدادات Recurrence Plot */}
          <div className="mode4-settings-group">
            <label className="mode4-setting-label">
              <input
                type="checkbox"
                checked={useAdaptive}
                onChange={() => setUseAdaptive(!useAdaptive)}
                style={{ marginRight: "8px" }}
              />
              🔧 Use Adaptive Threshold
            </label>
          </div>

          {/* التحكم في Threshold لو Manual */}
          {!useAdaptive && (
            <div className="mode4-settings-group">
              <label className="mode4-setting-label">
                🎚️ Threshold: {threshold.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.001"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="mode4-setting-input"
              />
            </div>
          )}

          <div className="mode4-settings-group">
            <label className="mode4-setting-label">📏 Window Size</label>
            <input
              type="number"
              min="10"
              max="500"
              value={windowSize}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val < 10) val = 10;
                if (val > 500) val = 500;
                setWindowSize(val);
              }}
              className="mode4-setting-input"
            />
            <p className="mode4-hint-text">
              Number of samples to compare (10-500)
            </p>
          </div>

          {/* زر إعادة جلب البيانات */}
          <button
            className="mode4-update-button"
            onClick={fetchSignals}
            disabled={!selectedPatient || !selectedRecording || loading}
          >
            {loading ? "🔄 Loading..." : "📥 Refresh Signals"}
          </button>

          {/* معلومات الإشارات */}
          {signalsData && signalsData.signals && (
            <div className="mode4-signal-info">
              <h4 className="mode4-signal-title">📊 Signal Information</h4>
              <div className="mode4-channel-info">
                <span className="mode4-channel-name">
                  {channel1.toUpperCase()}
                </span>
                <span className="mode4-channel-samples">
                  {signalsData.signals[channel1]?.length || 0} samples
                </span>
              </div>
              <div className="mode4-channel-info">
                <span className="mode4-channel-name">
                  {channel2.toUpperCase()}
                </span>
                <span className="mode4-channel-samples">
                  {signalsData.signals[channel2]?.length || 0} samples
                </span>
              </div>
              {useAdaptive && signal1.length > 0 && signal2.length > 0 && (
                <div className="mode4-channel-info">
                  <span className="mode4-channel-name">Adaptive Threshold</span>
                  <span className="mode4-channel-samples">
                    {computeAdaptiveThreshold(signal1, signal2).toFixed(4)}
                  </span>
                </div>
              )}

              {signalsData.diagnosis &&
                signalsData.diagnosis !== "No diagnosis found" && (
                  <div className="mode4-diagnosis-box">
                    <h4 className="mode4-diagnosis-title">🏥 Diagnosis</h4>
                    <p className="mode4-diagnosis-text">
                      {signalsData.diagnosis}
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* منطقة الرسم */}
        <div className="mode4-plot-container">
          {loading && (
            <div className="mode4-loading-container">
              <div className="mode4-spinner"></div>
              <p className="mode4-loading-text">Loading ECG signals...</p>
            </div>
          )}

          {error && (
            <div className="mode4-error-container">
              <p className="mode4-error-text">❌ {error}</p>
              <button className="mode4-retry-button" onClick={fetchSignals}>
                🔄 Retry
              </button>
            </div>
          )}

          {!selectedPatient || !selectedRecording ? (
            <div className="mode4-placeholder-container">
              <p className="mode4-placeholder-text">
                👈 Please select patient and recording from Home page
              </p>
              <p className="mode4-placeholder-text">
                Then choose two channels to compare
              </p>
            </div>
          ) : !signalsData || !signalsData.signals ? (
            <div className="mode4-placeholder-container">
              <p className="mode4-placeholder-text">
                📡 No signals data loaded
              </p>
              <p className="mode4-placeholder-text">
                Click "Refresh Signals" to load data
              </p>
            </div>
          ) : signalsData.signals[channel1] &&
            signalsData.signals[channel2] &&
            signalsData.signals[channel1].length > 0 &&
            signalsData.signals[channel2].length > 0 ? (
            <div className="mode4-plot-wrapper">
              <Plot
                data={plotData}
                layout={plotLayout}
                config={{
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
                  responsive: true,
                }}
              />

              {/* تفسير الرسم */}
              <div className="mode4-explanation">
                <h4 className="mode4-explanation-title">
                  🔍 How to read this plot:
                </h4>
                <ul className="mode4-explanation-list">
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">White dots</span>{" "}
                    show where the two signals are similar
                  </li>
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">
                      Black areas
                    </span>{" "}
                    show where they are different
                  </li>
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">
                      Diagonal patterns
                    </span>{" "}
                    indicate recurring patterns between channels
                  </li>
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">Y-axis</span>:{" "}
                    {channel1.toUpperCase()} signal
                  </li>
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">X-axis</span>:{" "}
                    {channel2.toUpperCase()} signal
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="mode4-placeholder-container">
              <p className="mode4-placeholder-text">
                ❌ No valid signal data available for selected channels
              </p>
              <p className="mode4-placeholder-text">
                Available channels:{" "}
                {signalsData.channels
                  ? signalsData.channels.join(", ")
                  : "None"}
              </p>
              <p className="mode4-placeholder-text">
                Please check if the channels contain data and try different
                channels
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
