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
  const [displayMode, setDisplayMode] = useState("fixed");
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchSignals = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    setError("");
    setCurrentTimeIndex(0);
    setIsPlaying(false);

    try {
      const channelsParam = channels.join(",");
      const effectiveLength = 2000;

      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode3/signal?patient=${selectedPatient}&recording=${selectedRecording}&channels=${channelsParam}&offset=${offset}&length=${effectiveLength}`;

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.signals) {
        setSignalsData(jsonData);
      } else {
        setError(jsonData.error || "Failed to fetch signals data");
        setSignalsData(null);
      }
    } catch (error) {
      setError("Network error - Could not connect to server: " + error.message);
      setSignalsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;

    if (isPlaying && displayMode === "moving" && signalsData) {
      intervalId = setInterval(() => {
        setCurrentTimeIndex((prev) => {
          const maxTimeIndex =
            Math.max(
              ...channels.map((ch) => signalsData.signals[ch]?.length || 0)
            ) - cycleLength;

          if (prev >= maxTimeIndex) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, animationSpeed);
    }

    if (isPlaying && displayMode === "cumulative" && signalsData) {
      intervalId = setInterval(() => {
        setCurrentTimeIndex((prev) => {
          const maxTimeIndex = Math.max(
            ...channels.map((ch) => signalsData.signals[ch]?.length || 0)
          );

          if (prev >= maxTimeIndex) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 10;
        });
      }, animationSpeed);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    isPlaying,
    displayMode,
    animationSpeed,
    signalsData,
    channels,
    cycleLength,
  ]);

  const convertToPolar = (signal, timeIndex = 0) => {
    if (!signal || signal.length === 0) {
      return [];
    }

    let startIndex, endIndex;

    if (displayMode === "moving") {
      startIndex = timeIndex;
      endIndex = Math.min(startIndex + cycleLength, signal.length);
    } else if (displayMode === "cumulative") {
      startIndex = 0;
      endIndex = Math.min(timeIndex + cycleLength, signal.length);
    } else {
      startIndex = 0;
      endIndex = Math.min(cycleLength, signal.length);
    }

    const polarData = [];
    const signalSegment = signal.slice(startIndex, endIndex);

    const minVal = Math.min(...signalSegment);
    const maxVal = Math.max(...signalSegment);
    const range = maxVal - minVal;

    for (let i = 0; i < signalSegment.length; i++) {
      let angle = (i / signalSegment.length) * 360;

      if (displayMode === "cumulative") {
        const cycleIndex = Math.floor(i / cycleLength);
        const positionInCycle = i % cycleLength;
        angle = (positionInCycle / cycleLength) * 360 + cycleIndex * 360;
      }

      const normalizedValue =
        range === 0 ? 0.5 : (signalSegment[i] - minVal) / range;
      const radius = normalizedValue;

      polarData.push({
        theta: angle,
        r: radius,
        originalValue: signalSegment[i],
        timeIndex: startIndex + i,
        globalTimeIndex: timeIndex + i,
      });
    }

    return polarData;
  };

  useEffect(() => {
    if (selectedPatient && selectedRecording) {
      fetchSignals();
    }
  }, [channels, selectedPatient, selectedRecording, length, offset]);

  const updateChannel = (index, value) => {
    const newChannels = [...channels];
    newChannels[index] = value;
    setChannels(newChannels);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTimeIndex(0);
    setIsPlaying(false);
  };

  const handleTimeIndexChange = (newIndex) => {
    setCurrentTimeIndex(newIndex);
    setIsPlaying(false);
  };

  let plotData = [];
  let plotLayout = {};

  if (signalsData && signalsData.signals) {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1"];

    plotData = channels.map((channel, index) => {
      const signal = signalsData.signals[channel] || [];
      const polarData = convertToPolar(signal, currentTimeIndex);

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
            )}<br>Time: ${point.timeIndex}${
              displayMode === "cumulative"
                ? `<br>Cycle: ${
                    Math.floor(point.globalTimeIndex / cycleLength) + 1
                  }`
                : ""
            }`
        ),
        opacity: 0.8,
      };
    });

    plotLayout = {
      title: {
        text: `Polar Graph - ${channels
          .map((ch) => ch.toUpperCase())
          .join(", ")}<br>Mode: ${displayMode} ${isPlaying ? "▶️" : "⏸️"}`,
        font: { size: 18, color: "white" },
      },
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 1],
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
      margin: { t: 100, r: 120, b: 80, l: 80 },
      autosize: true,
    };
  }

  return (
    <div className="mode3-container">
      <div className="mode3-header">
        <button className="mode3-back-button" onClick={() => navigate("/ecg")}>
          🏠 Back to Home
        </button>
        <h1 className="mode3-title">🌀 Mode 3 - Polar Graph Visualization</h1>
      </div>

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
        <div className="mode3-controls-panel">
          <h3 className="mode3-controls-title">🎯 Channel Configuration</h3>

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

          <div className="mode3-settings-group">
            <label className="mode3-setting-label">📊 Display Mode</label>
            <select
              className="mode3-setting-select"
              value={displayMode}
              onChange={(e) => {
                setDisplayMode(e.target.value);
                setIsPlaying(false);
                setCurrentTimeIndex(0);
              }}
            >
              <option value="fixed">Fixed Time Window</option>
              <option value="cumulative">Cumulative Plot</option>
              <option value="moving">Moving Window</option>
            </select>
            <p className="mode3-hint-text">
              {displayMode === "fixed" && "Static display of one cycle"}
              {displayMode === "cumulative" && "Accumulates cycles over time"}
              {displayMode === "moving" && "Moving window through signal"}
            </p>
          </div>

          {(displayMode === "moving" || displayMode === "cumulative") && (
            <div className="mode3-settings-group">
              <label className="mode3-setting-label">
                ⏱️ Time Index: {currentTimeIndex}
              </label>
              <input
                type="range"
                min="0"
                max={
                  displayMode === "moving"
                    ? Math.max(
                        0,
                        (signalsData?.signals[channels[0]]?.length || 0) -
                          cycleLength
                      )
                    : Math.max(
                        0,
                        signalsData?.signals[channels[0]]?.length || 0
                      )
                }
                value={currentTimeIndex}
                onChange={(e) => handleTimeIndexChange(Number(e.target.value))}
                className="mode3-setting-input"
                disabled={isPlaying}
              />
              <div className="mode3-animation-controls">
                <button
                  className="mode3-control-button"
                  onClick={handlePlayPause}
                  disabled={!signalsData}
                >
                  {isPlaying ? "⏸️ Pause" : "▶️ Play"}
                </button>
                <button
                  className="mode3-control-button"
                  onClick={handleReset}
                  disabled={!signalsData}
                >
                  🔄 Reset
                </button>
              </div>
            </div>
          )}

          {displayMode === "moving" && (
            <div className="mode3-settings-group">
              <label className="mode3-setting-label">
                🚀 Speed: {animationSpeed}ms
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                className="mode3-setting-input"
              />
            </div>
          )}

          <div className="mode3-settings-group">
            <label className="mode3-setting-label">📏 Cycle Length</label>
            <input
              type="number"
              min="50"
              max="5000"
              value={cycleLength}
              onChange={(e) => {
                setCycleLength(Number(e.target.value));
                setCurrentTimeIndex(0);
              }}
              className="mode3-setting-input"
            />
            <p className="mode3-hint-text">
              Samples per cardiac cycle (50-5000)
            </p>
          </div>

          <button
            className="mode3-update-button"
            onClick={fetchSignals}
            disabled={!selectedPatient || !selectedRecording || loading}
          >
            {loading ? "🔄 Loading..." : "🌀 Update Polar Graph"}
          </button>

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
                          Display Mode
                        </span>
                        :{" "}
                        {displayMode === "fixed" &&
                          "Fixed window shows one cycle"}
                        {displayMode === "cumulative" &&
                          "Cumulative shows multiple cycles overlapping"}
                        {displayMode === "moving" &&
                          "Moving window slides through signal"}
                      </li>
                      <li className="mode3-explanation-item">
                        <span className="mode3-explanation-strong">
                          Each color
                        </span>
                        : Represents a different ECG channel
                      </li>
                      {(displayMode === "moving" ||
                        displayMode === "cumulative") && (
                        <li className="mode3-explanation-item">
                          <span className="mode3-explanation-strong">
                            Current Position
                          </span>
                          : {currentTimeIndex} samples
                          {isPlaying && " (Playing)"}
                        </li>
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="mode3-error-container">
                  <p className="mode3-error-text">❌ No plot data available</p>
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
