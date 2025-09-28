import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode3.css";

export default function Mode3() {
  const navigate = useNavigate();
  const { selectedPatient, selectedRecording, length, offset } = useECG();

  const [channels, setChannels] = useState(["i", "ii", "v1"]);
  const [loading, setLoading] = useState(false);
  const [signalsData, setSignalsData] = useState(null);
  const [error, setError] = useState("");
  const [cycleLength, setCycleLength] = useState(200);

  // جلب بيانات القنوات الثلاثة
  const fetchSignals = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    setError("");

    try {
      const channelsParam = channels.join(",");
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode3/signal?patient=${selectedPatient}&recording=${selectedRecording}&channels=${channelsParam}&offset=${offset}&length=${length}`;

      console.log("🔄 Fetching signals for Mode 3:", apiUrl);

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.signals) {
        console.log("✅ Mode 3 signals received:", jsonData.signals);
        console.log("📊 Available channels:", Object.keys(jsonData.signals));
        setSignalsData(jsonData);
      } else {
        console.error("❌ API Error:", jsonData.error);
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

  // تحويل الإشارة إلى إحداثيات Polar (معدلة)
  const convertToPolar = (signal) => {
    if (!signal || signal.length === 0) {
      console.warn("⚠️ No signal data available");
      return [];
    }

    const N = Math.min(signal.length, cycleLength);
    const polarData = [];

    console.log(`🔄 Converting ${N} samples to polar coordinates`);

    // Normalize signal to range [0, 1] للجميع
    const minVal = Math.min(...signal);
    const maxVal = Math.max(...signal);
    const range = maxVal - minVal;

    console.log(
      `📊 Signal range: ${minVal.toFixed(4)} to ${maxVal.toFixed(
        4
      )} (range: ${range.toFixed(4)})`
    );

    for (let i = 0; i < N; i++) {
      const angle = (i / N) * 360; // 0 to 360 degrees
      const normalizedValue = range === 0 ? 0.5 : (signal[i] - minVal) / range;
      const radius = normalizedValue; // استخدام القيمة الطبيعية [0,1]

      polarData.push({
        theta: angle,
        r: radius,
        originalValue: signal[i],
        timeIndex: i,
      });
    }

    console.log(`✅ Polar conversion complete: ${polarData.length} points`);
    console.log("📐 Sample polar points:", polarData.slice(0, 3));
    return polarData;
  };

  // جلب البيانات عند التغيير
  useEffect(() => {
    if (selectedPatient && selectedRecording) {
      fetchSignals();
    }
  }, [channels, selectedPatient, selectedRecording, length, offset]);

  // تحديث قناة معينة
  const updateChannel = (index, value) => {
    const newChannels = [...channels];
    newChannels[index] = value;
    setChannels(newChannels);
  };

  // إعداد بيانات الرسم البياني
  let plotData = [];
  let plotLayout = {};

  if (signalsData && signalsData.signals) {
    console.log("📊 Signals data available for plotting:", signalsData.signals);

    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1"];

    plotData = channels.map((channel, index) => {
      const signal = signalsData.signals[channel] || [];
      console.log(`📈 Channel ${channel} data (first 5):`, signal.slice(0, 5));

      const polarData = convertToPolar(signal);

      return {
        r: polarData.map((point) => point.r),
        theta: polarData.map((point) => point.theta),
        mode: "lines+markers",
        type: "scatterpolar",
        name: channel.toUpperCase(),
        line: { color: colors[index], width: 2 },
        marker: { size: 4, color: colors[index] },
        hoverinfo: "text",
        text: polarData.map(
          (point) =>
            `Channel: ${channel.toUpperCase()}<br>Value: ${point.originalValue.toFixed(
              4
            )}<br>Time: ${point.timeIndex}`
        ),
        opacity: 0.8,
      };
    });

    console.log("🎨 Final plot data structure:", {
      dataLength: plotData.length,
      channelNames: plotData.map((d) => d.name),
      dataPoints: plotData.map((d) => d.r.length),
    });

    plotLayout = {
      title: {
        text: `Polar Graph - ${channels
          .map((ch) => ch.toUpperCase())
          .join(", ")}`,
        font: { size: 20, color: "white" },
      },
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 1], // مدى ثابت للقيم الطبيعية [0,1]
          color: "white",
          gridcolor: "#666",
          tickfont: { color: "white" },
          showline: true,
          linecolor: "white",
          ticks: "outside",
        },
        angularaxis: {
          rotation: 90,
          direction: "clockwise",
          color: "white",
          gridcolor: "#666",
          tickfont: { color: "white" },
          showline: true,
          linecolor: "white",
          ticks: "outside",
        },
        bgcolor: "#1f2937",
        domain: {
          x: [0, 0.9],
          y: [0, 1],
        },
      },
      showlegend: true,
      legend: {
        x: 1,
        y: 0.5,
        font: { color: "white" },
        bgcolor: "rgba(0,0,0,0.5)",
        bordercolor: "#666",
        orientation: "v",
      },
      paper_bgcolor: "#1f2937",
      plot_bgcolor: "#111827",
      width: 800,
      height: 600,
      margin: { t: 80, r: 120, b: 80, l: 80 },
      autosize: true,
    };
  }

  return (
    <div className="mode3-container">
      <div className="mode3-header">
        <button className="mode3-back-button" onClick={() => navigate("/")}>
          🏠 Back to Home
        </button>
        <h1 className="mode3-title">🌀 Mode 3 - Polar Graph Visualization</h1>
      </div>

      {/* معلومات المريض */}
      <div className="mode3-patient-info">
        <div className="mode3-patient-item">
          <div className="mode3-patient-label">Patient</div>
          <div className="mode3-patient-value">
            {selectedPatient || "Not selected"}
          </div>
        </div>
        <div className="mode3-patient-item">
          <div className="mode3-patient-label">Recording</div>
          <div className="mode3-patient-value">
            {selectedRecording || "Not selected"}
          </div>
        </div>
        <div className="mode3-patient-item">
          <div className="mode3-patient-label">Length</div>
          <div className="mode3-patient-value">{length} samples</div>
        </div>
        <div className="mode3-patient-item">
          <div className="mode3-patient-label">Offset</div>
          <div className="mode3-patient-value">{offset} samples</div>
        </div>
      </div>

      {(!selectedPatient || !selectedRecording) && (
        <div className="mode3-warning">
          ⚠️ Please select patient and recording from Home page
        </div>
      )}

      <div className="mode3-content">
        {/* لوحة التحكم */}
        <div className="mode3-controls-panel">
          <h3 className="mode3-controls-title">🎯 Channel Configuration</h3>

          {/* اختيار القنوات الثلاثة */}
          <div className="mode3-channel-selection">
            {[0, 1, 2].map((index) => (
              <div key={index} className="mode3-channel-group">
                <label className="mode3-channel-label">
                  Channel {index + 1}:
                </label>
                <select
                  className="mode3-channel-select"
                  value={channels[index]}
                  onChange={(e) => updateChannel(index, e.target.value)}
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
            ))}
          </div>

          {/* إعدادات Polar Graph */}
          <div className="mode3-settings-group">
            <label className="mode3-setting-label">📏 Cycle Length</label>
            <input
              type="number"
              min="50"
              max="5000"
              value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              className="mode3-setting-input"
            />
            <p className="mode3-hint-text">
              Samples per cardiac cycle (50-5000)
            </p>
          </div>

          {/* زر التحديث */}
          <button
            className="mode3-update-button"
            onClick={fetchSignals}
            disabled={!selectedPatient || !selectedRecording || loading}
          >
            {loading ? "🔄 Loading..." : "🌀 Update Polar Graph"}
          </button>

          {/* معلومات الإشارات */}
          {signalsData && signalsData.signals && (
            <div className="mode3-signal-info">
              <h4 className="mode3-signal-title">📊 Signal Information</h4>
              {channels.map((channel) => (
                <div key={channel} className="mode3-channel-info">
                  <span className="mode3-channel-name">
                    {channel.toUpperCase()}
                  </span>
                  <span className="mode3-channel-samples">
                    {signalsData.signals[channel]?.length || 0} samples
                  </span>
                </div>
              ))}

              {signalsData.diagnosis &&
                signalsData.diagnosis !== "No diagnosis found" && (
                  <div className="mode3-diagnosis-box">
                    <h4 className="mode3-diagnosis-title">🏥 Diagnosis</h4>
                    <p className="mode3-diagnosis-text">
                      {signalsData.diagnosis}
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* منطقة الرسم */}
        <div className="mode3-plot-container">
          {loading && (
            <div className="mode3-loading-container">
              <div className="mode3-spinner"></div>
              <p className="mode3-loading-text">Loading ECG signals...</p>
            </div>
          )}

          {error && (
            <div className="mode3-error-container">
              <p className="mode3-error-text">❌ {error}</p>
              <button className="mode3-retry-button" onClick={fetchSignals}>
                🔄 Retry
              </button>
            </div>
          )}

          {!selectedPatient || !selectedRecording ? (
            <div className="mode3-placeholder-container">
              <p className="mode3-placeholder-text">
                👈 Please select patient and recording from Home page
              </p>
            </div>
          ) : !signalsData || !signalsData.signals ? (
            <div className="mode3-placeholder-container">
              <p className="mode3-placeholder-text">
                📡 No signals data loaded
              </p>
              <p className="mode3-placeholder-text">
                Click "Update Polar Graph" to load data
              </p>
            </div>
          ) : (
            <div className="mode3-plot-wrapper">
              {plotData.length > 0 ? (
                <>
                  <Plot
                    data={plotData}
                    layout={plotLayout}
                    config={{
                      displayModeBar: true,
                      displaylogo: false,
                      responsive: true,
                      modeBarButtonsToRemove: [
                        "pan2d",
                        "select2d",
                        "lasso2d",
                        "autoScale2d",
                      ],
                    }}
                  />
                  <div className="mode3-explanation">
                    <h4 className="mode3-explanation-title">
                      🌀 How to read this Polar Graph:
                    </h4>
                    <ul className="mode3-explanation-list">
                      <li className="mode3-explanation-item">
                        <span className="mode3-explanation-strong">Angle</span>:
                        Time within cardiac cycle (0° to 360°)
                      </li>
                      <li className="mode3-explanation-item">
                        <span className="mode3-explanation-strong">Radius</span>
                        : Normalized signal amplitude (0 to 1)
                      </li>
                      <li className="mode3-explanation-item">
                        <span className="mode3-explanation-strong">
                          Each color
                        </span>
                        : Represents a different ECG channel
                      </li>
                      <li className="mode3-explanation-item">
                        <span className="mode3-explanation-strong">
                          Similar shapes
                        </span>
                        : Indicate consistent patterns across channels
                      </li>
                      <li className="mode3-explanation-item">
                        <span className="mode3-explanation-strong">
                          Different shapes
                        </span>
                        : Show channel-specific characteristics
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="mode3-error-container">
                  <p className="mode3-error-text">❌ No plot data available</p>
                  <p className="mode3-error-text">
                    Check console for debugging information
                  </p>
                  <button className="mode3-retry-button" onClick={fetchSignals}>
                    🔄 Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
