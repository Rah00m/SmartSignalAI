import React, { useState, useEffect, useMemo } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode3.css";

export default function CombinedMode() {
  const navigate = useNavigate();
  const { selectedPatient, selectedRecording } = useECG();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Channel selection and data
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [channelData, setChannelData] = useState({});
  const [loadingChannels, setLoadingChannels] = useState({});

  // Polar Graph States
  const [polarCycleLength, setPolarCycleLength] = useState(200);
  const [polarDisplayMode, setPolarDisplayMode] = useState("fixed");
  const [polarCurrentTimeIndex, setPolarCurrentTimeIndex] = useState(0);
  const [polarAnimationSpeed, setPolarAnimationSpeed] = useState(1000);
  const [polarIsPlaying, setPolarIsPlaying] = useState(false);

  // Scatter Plot States
  const [selectedScatterChannels, setSelectedScatterChannels] = useState({
    channel1: "I",
    channel2: "II",
  });
  const [scatterChunkSize, setScatterChunkSize] = useState(500);
  const [scatterCurrentChunk, setScatterCurrentChunk] = useState(0);
  const [scatterSignalsData, setScatterSignalsData] = useState(null);
  const [scatterLoading, setScatterLoading] = useState(false);

  // Available channels
  const availableChannels = [
    "I",
    "II",
    "III",
    "aVR",
    "aVL",
    "aVF",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
  ];

  // Channel mapping
  const channelMappings = {
    I: { backend: "i", display: "I" },
    II: { backend: "ii", display: "II" },
    III: { backend: "iii", display: "III" },
    aVR: { backend: "avr", display: "aVR" },
    aVL: { backend: "avl", display: "aVL" },
    aVF: { backend: "avf", display: "aVF" },
    V1: { backend: "v1", display: "V1" },
    V2: { backend: "v2", display: "V2" },
    V3: { backend: "v3", display: "V3" },
    V4: { backend: "v4", display: "V4" },
    V5: { backend: "v5", display: "V5" },
    V6: { backend: "v6", display: "V6" },
  };

  const channelColors = {
    I: "#FF6B6B",
    II: "#4ECDC4",
    III: "#45B7D1",
    aVR: "#FFA726",
    aVL: "#9C27B0",
    aVF: "#66BB6A",
    V1: "#AB47BC",
    V2: "#26C6DA",
    V3: "#FFCA28",
    V4: "#5C6BC0",
    V5: "#EC407A",
    V6: "#00ff88",
  };

  // =========================================================================
  // POLAR GRAPH ANIMATION FUNCTIONS
  // =========================================================================
  useEffect(() => {
    let intervalId;

    if (polarIsPlaying && selectedChannels.length > 0) {
      intervalId = setInterval(() => {
        setPolarCurrentTimeIndex((prev) => {
          let maxTimeIndex;

          if (polarDisplayMode === "moving") {
            maxTimeIndex = Math.max(
              ...selectedChannels.map((ch) => {
                const signal = channelData[ch]?.y || [];
                return Math.max(0, signal.length - polarCycleLength);
              })
            );
          } else if (polarDisplayMode === "cumulative") {
            maxTimeIndex = Math.max(
              ...selectedChannels.map((ch) => channelData[ch]?.y?.length || 0)
            );
          } else {
            maxTimeIndex = 0;
          }

          if (prev >= maxTimeIndex) {
            setPolarIsPlaying(false);
            return 0;
          }

          // استخدام stepSize مناسب لكل mode
          const stepSize =
            polarDisplayMode === "cumulative"
              ? Math.max(10, Math.floor(polarCycleLength / 10)) // 10% من الـ cycle للتراكم
              : 1;

          return prev + stepSize;
        });
      }, polarAnimationSpeed);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    polarIsPlaying,
    polarDisplayMode,
    polarAnimationSpeed,
    selectedChannels,
    channelData,
    polarCycleLength,
  ]);

  // =========================================================================
  // POLAR CONVERSION FUNCTION (المصححة تماماً)
  // =========================================================================
  const convertToPolar = (signal, timeIndex = 0) => {
    if (!signal || signal.length === 0) return [];

    let startIndex, endIndex;

    if (polarDisplayMode === "moving") {
      startIndex = timeIndex;
      endIndex = Math.min(startIndex + polarCycleLength, signal.length);
    } else if (polarDisplayMode === "cumulative") {
      // التصحيح: نأخذ كل البيانات من البداية حتى النقطة الحالية
      startIndex = 0;
      endIndex = Math.min(timeIndex, signal.length);
    } else {
      // fixed
      startIndex = 0;
      endIndex = Math.min(polarCycleLength, signal.length);
    }

    const signalSegment = signal.slice(startIndex, endIndex);
    if (signalSegment.length === 0) return [];

    // تطبيع بناءً على الإشارة الكاملة (مهم للـ cumulative)
    const minVal = Math.min(...signalSegment);
    const maxVal = Math.max(...signalSegment);
    const range = maxVal - minVal || 1;

    const polarData = [];

    for (let i = 0; i < signalSegment.length; i++) {
      let angle;

      if (polarDisplayMode === "cumulative") {
        // في الـ cumulative، كل cycle يأخذ دائرة كاملة
        const cycleNumber = Math.floor(i / polarCycleLength);
        const positionInCycle = i % polarCycleLength;
        angle = (positionInCycle / polarCycleLength) * 360;
        // إزاحة كل cycle بزاوية إضافية لمنع التداخل
        angle += cycleNumber * 5; // إزاحة بسيطة لكل cycle
      } else {
        // moving و fixed يستخدمان الزوايا العادية
        angle = (i / signalSegment.length) * 360;
      }

      const normalizedValue = (signalSegment[i] - minVal) / range;

      polarData.push({
        theta: angle,
        r: normalizedValue,
        originalValue: signalSegment[i],
        timeIndex: startIndex + i,
        cycle:
          polarDisplayMode === "cumulative"
            ? Math.floor(i / polarCycleLength) + 1
            : 1,
      });
    }

    return polarData;
  };

  // =========================================================================
  // POLAR CONTROL HANDLERS
  // =========================================================================
  const handlePolarPlayPause = () => {
    setPolarIsPlaying(!polarIsPlaying);
  };

  const handlePolarReset = () => {
    setPolarCurrentTimeIndex(0);
    setPolarIsPlaying(false);
  };

  const handlePolarTimeIndexChange = (newIndex) => {
    setPolarCurrentTimeIndex(newIndex);
    setPolarIsPlaying(false);
  };

  // =========================================================================
  // CHANNEL SELECTION HANDLERS
  // =========================================================================
  const handleChannelToggle = async (channel) => {
    const isSelected = selectedChannels.includes(channel);

    if (isSelected) {
      setSelectedChannels((prev) => prev.filter((ch) => ch !== channel));
      setChannelData((prev) => {
        const newData = { ...prev };
        delete newData[channel];
        return newData;
      });
    } else {
      setSelectedChannels((prev) => [...prev, channel]);
      await fetchChannelData(channel);
    }
  };

  const handleSelectAllChannels = () => {
    availableChannels.forEach((channel) => {
      if (!selectedChannels.includes(channel)) {
        handleChannelToggle(channel);
      }
    });
  };

  const handleDeselectAllChannels = () => {
    setSelectedChannels([]);
    setChannelData({});
    setPolarCurrentTimeIndex(0);
    setPolarIsPlaying(false);
  };

  // =========================================================================
  // DATA FETCHING
  // =========================================================================
  const fetchChannelData = async (channel) => {
    setLoadingChannels((prev) => ({ ...prev, [channel]: true }));

    try {
      const backendChannelName = getBackendChannel(channel);
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode1/full-signal?patient=${selectedPatient}&recording=${selectedRecording}&channel=${backendChannelName}`;

      console.log(`📡 Fetching full signal for ${channel}...`);

      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();

        if (data.x && data.y && data.y.length > 0) {
          console.log(`✅ ${channel}: Loaded ${data.y.length} samples`);

          const displayData = {
            x: data.x,
            y: data.y,
            fullLength: data.y.length,
          };

          setChannelData((prev) => ({
            ...prev,
            [channel]: displayData,
          }));
        } else {
          throw new Error("Invalid or empty data format");
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`💥 Error loading channel ${channel}:`, error);
      setError(`Failed to load channel ${channel}: ${error.message}`);
      setSelectedChannels((prev) => prev.filter((ch) => ch !== channel));
    } finally {
      setLoadingChannels((prev) => ({ ...prev, [channel]: false }));
    }
  };

  const fetchScatterSignals = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setScatterLoading(true);
    setError("");

    try {
      const backendChannel1 = getBackendChannel(
        selectedScatterChannels.channel1
      );
      const backendChannel2 = getBackendChannel(
        selectedScatterChannels.channel2
      );

      const channelsParam = `${backendChannel1},${backendChannel2}`;
      const effectiveLength = 2000;

      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode4/signal?patient=${selectedPatient}&recording=${selectedRecording}&channels=${channelsParam}&offset=0&length=${effectiveLength}`;

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.signals) {
        setScatterSignalsData(jsonData);
      } else {
        const errorMsg =
          jsonData.error || "Failed to fetch scatter signals data";
        setError(errorMsg);
        setScatterSignalsData(null);
      }
    } catch (error) {
      setError("Network error - Could not connect to server: " + error.message);
      setScatterSignalsData(null);
    } finally {
      setScatterLoading(false);
    }
  };

  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================
  const getBackendChannel = (displayChannel) => {
    const mapping = channelMappings[displayChannel];
    return mapping ? mapping.backend : displayChannel.toLowerCase();
  };

  const handleScatterChannelChange = (channel, axis) => {
    const newScatterChannels = {
      ...selectedScatterChannels,
      [axis]: channel,
    };
    setSelectedScatterChannels(newScatterChannels);
  };

  // =========================================================================
  // SCATTER PLOT FUNCTIONS
  // =========================================================================
  const createCumulativeScatterPlot = (
    signal1,
    signal2,
    chunkSize,
    currentChunk
  ) => {
    const minLength = Math.min(signal1.length, signal2.length);
    const endIndex = Math.min((currentChunk + 1) * chunkSize, minLength);

    const scatterData = [];
    for (let i = 0; i < endIndex; i++) {
      scatterData.push({
        x: signal2[i],
        y: signal1[i],
        index: i,
      });
    }

    return scatterData;
  };

  const calculateCorrelation = (signal1, signal2) => {
    const minLength = Math.min(signal1.length, signal2.length);
    if (minLength === 0) return 0;

    const s1 = signal1.slice(0, minLength);
    const s2 = signal2.slice(0, minLength);

    const mean1 = s1.reduce((a, b) => a + b, 0) / minLength;
    const mean2 = s2.reduce((a, b) => a + b, 0) / minLength;

    let numerator = 0,
      denom1 = 0,
      denom2 = 0;

    for (let i = 0; i < minLength; i++) {
      numerator += (s1[i] - mean1) * (s2[i] - mean2);
      denom1 += Math.pow(s1[i] - mean1, 2);
      denom2 += Math.pow(s2[i] - mean2, 2);
    }

    return denom1 === 0 || denom2 === 0
      ? 0
      : numerator / Math.sqrt(denom1 * denom2);
  };

  // =========================================================================
  // SCATTER CONTROL HANDLERS
  // =========================================================================
  const handleScatterNextChunk = () => {
    if (scatterCurrentChunk < scatterTotalChunks - 1) {
      setScatterCurrentChunk(scatterCurrentChunk + 1);
    }
  };

  const handleScatterPrevChunk = () => {
    if (scatterCurrentChunk > 0) {
      setScatterCurrentChunk(scatterCurrentChunk - 1);
    }
  };

  const handleFirstChunk = () => {
    setScatterCurrentChunk(0);
  };

  const handleLastChunk = () => {
    setScatterCurrentChunk(scatterTotalChunks - 1);
  };

  const handleChunkSizeChange = (newSize) => {
    setScatterChunkSize(newSize);
    setScatterCurrentChunk(0);
  };

  // =========================================================================
  // EFFECTS
  // =========================================================================
  useEffect(() => {
    if (selectedPatient && selectedRecording) {
      setSelectedChannels([]);
      setChannelData({});
      setScatterSignalsData(null);
      setError("");
      setPolarCurrentTimeIndex(0);
      setPolarIsPlaying(false);
    }
  }, [selectedPatient, selectedRecording]);

  useEffect(() => {
    if (selectedPatient && selectedRecording) {
      fetchScatterSignals();
    }
  }, [selectedScatterChannels, selectedPatient, selectedRecording]);

  // =========================================================================
  // PLOT DATA GENERATION
  // =========================================================================

  // Polar Graph Data
  const polarPlotData = useMemo(() => {
    if (
      selectedChannels.length === 0 ||
      Object.keys(channelData).length === 0
    ) {
      return [];
    }

    return selectedChannels
      .map((channel) => {
        const signal = channelData[channel]?.y || [];
        if (signal.length === 0) return null;

        const polarData = convertToPolar(signal, polarCurrentTimeIndex);
        if (polarData.length === 0) return null;

        return {
          r: polarData.map((point) => point.r),
          theta: polarData.map((point) => point.theta),
          mode: "lines+markers",
          type: "scatterpolar",
          name: channel,
          line: {
            color: channelColors[channel] || "#FF6B6B",
            width: 2,
          },
          marker: {
            size: 4,
            color: channelColors[channel] || "#FF6B6B",
          },
          hoverinfo: "text",
          text: polarData.map(
            (point) =>
              `Channel: ${channel}<br>Value: ${point.originalValue.toFixed(
                4
              )}<br>Time: ${point.timeIndex}${
                polarDisplayMode === "cumulative"
                  ? `<br>Cycle: ${point.cycle}`
                  : ""
              }`
          ),
          opacity: 0.8,
        };
      })
      .filter(Boolean);
  }, [
    selectedChannels,
    channelData,
    polarCurrentTimeIndex,
    polarDisplayMode,
    polarCycleLength,
  ]);

  // Polar Layout
  const polarPlotLayout = useMemo(() => {
    if (polarPlotData.length === 0) return {};

    let maxTimeIndex = 0;
    if (polarDisplayMode === "moving") {
      maxTimeIndex = Math.max(
        ...selectedChannels.map((ch) => {
          const signal = channelData[ch]?.y || [];
          return Math.max(0, signal.length - polarCycleLength);
        })
      );
    } else if (polarDisplayMode === "cumulative") {
      maxTimeIndex = Math.max(
        ...selectedChannels.map((ch) => channelData[ch]?.y?.length || 0)
      );
    }

    return {
      title: {
        text: `🌀 Polar Graph - Mode: ${polarDisplayMode} ${
          polarIsPlaying ? "▶️" : "⏸️"
        }<br><sub>Cycle: ${polarCycleLength} | Time: ${polarCurrentTimeIndex}/${maxTimeIndex}</sub>`,
        font: { size: 14, color: "white" },
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
      },
      showlegend: true,
      legend: {
        x: 1.1,
        y: 0.5,
        font: { color: "white" },
        bgcolor: "rgba(0,0,0,0.5)",
      },
      paper_bgcolor: "#1f2937",
      plot_bgcolor: "#111827",
      width: 500,
      height: 450,
      margin: { t: 80, r: 150, b: 60, l: 60 },
      autosize: true,
    };
  }, [
    polarPlotData,
    polarDisplayMode,
    polarIsPlaying,
    polarCycleLength,
    polarCurrentTimeIndex,
    selectedChannels,
    channelData,
  ]);

  // Scatter Plot Data
  const scatterPlotData = useMemo(() => {
    if (!scatterSignalsData?.signals) return [];

    const backendChannel1 = getBackendChannel(selectedScatterChannels.channel1);
    const backendChannel2 = getBackendChannel(selectedScatterChannels.channel2);

    const signal1 = scatterSignalsData.signals[backendChannel1] || [];
    const signal2 = scatterSignalsData.signals[backendChannel2] || [];

    if (signal1.length === 0 || signal2.length === 0) return [];

    const minLength = Math.min(signal1.length, signal2.length);
    const scatterTotalChunks = Math.ceil(minLength / scatterChunkSize);
    const safeCurrentChunk = Math.min(
      scatterCurrentChunk,
      scatterTotalChunks - 1
    );

    const rawScatterData = createCumulativeScatterPlot(
      signal1,
      signal2,
      scatterChunkSize,
      safeCurrentChunk
    );

    const validData = rawScatterData.filter(
      (point) =>
        point.x !== undefined &&
        point.y !== undefined &&
        !isNaN(point.x) &&
        !isNaN(point.y)
    );

    if (validData.length === 0) return [];

    return [
      {
        x: validData.map((point) => point.x),
        y: validData.map((point) => point.y),
        type: "scatter",
        mode: "markers",
        marker: {
          size: 4,
          color: validData.map((_, index) => index),
          colorscale: "Viridis",
          opacity: 0.7,
          showscale: true,
          colorbar: {
            title: "Time Index",
            titleside: "right",
            tickfont: { color: "white" },
            titlefont: { color: "white" },
          },
        },
        name: `${selectedScatterChannels.channel1} vs ${selectedScatterChannels.channel2}`,
      },
    ];
  }, [
    scatterSignalsData,
    selectedScatterChannels,
    scatterChunkSize,
    scatterCurrentChunk,
  ]);

  // Scatter Layout و correlation
  const { scatterPlotLayout, scatterTotalChunks, correlation } = useMemo(() => {
    if (scatterPlotData.length === 0) {
      return { scatterPlotLayout: {}, scatterTotalChunks: 0, correlation: 0 };
    }

    const backendChannel1 = getBackendChannel(selectedScatterChannels.channel1);
    const backendChannel2 = getBackendChannel(selectedScatterChannels.channel2);
    const signal1 = scatterSignalsData?.signals[backendChannel1] || [];
    const signal2 = scatterSignalsData?.signals[backendChannel2] || [];

    const minLength = Math.min(signal1.length, signal2.length);
    const totalChunks = Math.ceil(minLength / scatterChunkSize);
    const safeCurrentChunk = Math.min(scatterCurrentChunk, totalChunks - 1);

    const correlationValue = calculateCorrelation(
      signal1.slice(0, (safeCurrentChunk + 1) * scatterChunkSize),
      signal2.slice(0, (safeCurrentChunk + 1) * scatterChunkSize)
    );

    const layout = {
      width: 500,
      height: 450,
      title: {
        text: `📊 ${selectedScatterChannels.channel1} vs ${
          selectedScatterChannels.channel2
        }<br>Chunk ${
          safeCurrentChunk + 1
        }/${totalChunks} | Correlation: ${correlationValue.toFixed(3)}`,
        font: { size: 14, color: "white" },
      },
      xaxis: {
        title: {
          text: `Signal Value (${selectedScatterChannels.channel2})`,
          font: { color: "white" },
        },
        tickfont: { color: "white" },
        gridcolor: "#666",
      },
      yaxis: {
        title: {
          text: `Signal Value (${selectedScatterChannels.channel1})`,
          font: { color: "white" },
        },
        tickfont: { color: "white" },
        gridcolor: "#666",
      },
      paper_bgcolor: "#1f2937",
      plot_bgcolor: "#111827",
      margin: { t: 80, r: 80, b: 80, l: 80 },
    };

    return {
      scatterPlotLayout: layout,
      scatterTotalChunks: totalChunks,
      correlation: correlationValue,
    };
  }, [
    scatterPlotData,
    selectedScatterChannels,
    scatterSignalsData,
    scatterChunkSize,
    scatterCurrentChunk,
  ]);

  // Loading states
  const totalLoading = Object.values(loadingChannels).some(
    (loading) => loading
  );

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="combined-container">
      <div className="combined-header">
       
        <h1 className="combined-title">
          🌀📊 Combined Mode - Polar & Scatter Plots
        </h1>
      </div>

      {(!selectedPatient || !selectedRecording) && (
        <div className="combined-warning">
          ⚠️ Please select patient and recording from Home page
        </div>
      )}

      <div className="combined-content">
        {/* Controls Panel */}
        <div className="combined-controls-panel">
          <h3 className="combined-controls-title">🎯 Controls Panel</h3>

          {/* Polar Graph Channel Selection */}
          <div className="combined-channel-section">
            <h4 className="combined-section-title">
              🌀 Polar Graph Channels ({selectedChannels.length} selected)
            </h4>
            <div className="combined-channel-buttons">
              <button
                className="combined-channel-button primary"
                onClick={handleSelectAllChannels}
                disabled={
                  !selectedPatient || !selectedRecording || totalLoading
                }
              >
                Select All
              </button>
              <button
                className="combined-channel-button secondary"
                onClick={handleDeselectAllChannels}
                disabled={!selectedPatient || !selectedRecording}
              >
                Deselect All
              </button>
            </div>
            <div className="combined-checkbox-grid">
              {availableChannels.map((channel) => {
                const isSelected = selectedChannels.includes(channel);
                const isLoading = loadingChannels[channel];
                const isLoaded = !!channelData[channel];

                return (
                  <label
                    key={channel}
                    className={`combined-checkbox-label ${
                      isSelected ? "selected" : ""
                    } ${isLoading ? "loading" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleChannelToggle(channel)}
                      disabled={
                        !selectedPatient || !selectedRecording || isLoading
                      }
                      className="combined-checkbox"
                    />
                    <span
                      className="combined-channel-color"
                      style={{ backgroundColor: channelColors[channel] }}
                    ></span>
                    <span className="combined-checkbox-text">{channel}</span>
                    {isLoading && (
                      <span className="combined-channel-loading">⏳</span>
                    )}
                    {isLoaded && !isLoading && (
                      <span className="combined-channel-loaded">✅</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Polar Graph Settings */}
          <div className="combined-settings-section">
            <h4 className="combined-section-title">🌀 Polar Graph Settings</h4>

            <div className="combined-settings-group">
              <label className="combined-setting-label">📊 Display Mode</label>
              <select
                className="combined-setting-select"
                value={polarDisplayMode}
                onChange={(e) => {
                  setPolarDisplayMode(e.target.value);
                  setPolarIsPlaying(false);
                  setPolarCurrentTimeIndex(0);
                }}
                disabled={selectedChannels.length === 0}
              >
                <option value="fixed">Fixed Time Window</option>
                <option value="cumulative">Cumulative Plot</option>
                <option value="moving">Moving Window</option>
              </select>
              <p className="combined-hint-text">
                {polarDisplayMode === "fixed" && "Static display of one cycle"}
                {polarDisplayMode === "cumulative" &&
                  "Accumulates cycles over time"}
                {polarDisplayMode === "moving" &&
                  "Moving window through signal"}
              </p>
            </div>

            {(polarDisplayMode === "moving" ||
              polarDisplayMode === "cumulative") && (
              <div className="combined-settings-group">
                <label className="combined-setting-label">
                  ⏱️ Time Index: {polarCurrentTimeIndex}
                </label>
                <input
                  type="range"
                  min="0"
                  max={
                    polarDisplayMode === "moving"
                      ? Math.max(
                          0,
                          Math.max(
                            ...selectedChannels.map((ch) => {
                              const signal = channelData[ch]?.y || [];
                              return signal.length - polarCycleLength;
                            })
                          ) || 0
                        )
                      : Math.max(
                          0,
                          Math.max(
                            ...selectedChannels.map(
                              (ch) => channelData[ch]?.y?.length || 0
                            )
                          ) || 0
                        )
                  }
                  value={polarCurrentTimeIndex}
                  onChange={(e) =>
                    handlePolarTimeIndexChange(Number(e.target.value))
                  }
                  className="combined-setting-input"
                  disabled={polarIsPlaying || selectedChannels.length === 0}
                />
                <div className="combined-animation-controls">
                  <button
                    className="combined-control-button"
                    onClick={handlePolarPlayPause}
                    disabled={selectedChannels.length === 0}
                  >
                    {polarIsPlaying ? "⏸️ Pause" : "▶️ Play"}
                  </button>
                  <button
                    className="combined-control-button"
                    onClick={handlePolarReset}
                    disabled={selectedChannels.length === 0}
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            )}

            {polarDisplayMode === "moving" && (
              <div className="combined-settings-group">
                <label className="combined-setting-label">
                  🚀 Speed: {polarAnimationSpeed}ms
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={polarAnimationSpeed}
                  onChange={(e) =>
                    setPolarAnimationSpeed(Number(e.target.value))
                  }
                  className="combined-setting-input"
                />
              </div>
            )}

            <div className="combined-settings-group">
              <label className="combined-setting-label">📏 Cycle Length</label>
              <input
                type="number"
                min="50"
                max="5000"
                value={polarCycleLength}
                onChange={(e) => {
                  setPolarCycleLength(Number(e.target.value));
                  setPolarCurrentTimeIndex(0);
                }}
                className="combined-setting-input"
                disabled={selectedChannels.length === 0}
              />
              <p className="combined-hint-text">
                Samples per cardiac cycle (50-5000)
              </p>
            </div>
          </div>

          {/* Scatter Plot Settings */}
          <div className="combined-settings-section">
            <h4 className="combined-section-title">📊 Scatter Plot Settings</h4>

            <div className="combined-scatter-selection">
              <div className="combined-axis-selection">
                <label className="combined-axis-label">
                  Y-Axis (Channel 1):
                </label>
                <select
                  className="combined-channel-select"
                  value={selectedScatterChannels.channel1}
                  onChange={(e) =>
                    handleScatterChannelChange(e.target.value, "channel1")
                  }
                  disabled={!selectedPatient || !selectedRecording}
                >
                  {availableChannels.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="combined-axis-selection">
                <label className="combined-axis-label">
                  X-Axis (Channel 2):
                </label>
                <select
                  className="combined-channel-select"
                  value={selectedScatterChannels.channel2}
                  onChange={(e) =>
                    handleScatterChannelChange(e.target.value, "channel2")
                  }
                  disabled={!selectedPatient || !selectedRecording}
                >
                  {availableChannels.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="combined-update-button"
              onClick={fetchScatterSignals}
              disabled={
                !selectedPatient || !selectedRecording || scatterLoading
              }
            >
              {scatterLoading ? "🔄 Loading..." : "📊 Update Scatter Plot"}
            </button>

            <div className="combined-settings-group">
              <label className="combined-setting-label">⏱️ Chunk Size</label>
              <select
                className="combined-setting-select"
                value={scatterChunkSize}
                onChange={(e) => handleChunkSizeChange(Number(e.target.value))}
              >
                <option value={100}>100 samples</option>
                <option value={500}>500 samples</option>
                <option value={1000}>1000 samples</option>
                <option value={1500}>1500 samples</option>
                <option value={2000}>2000 samples</option>
              </select>
            </div>

            {scatterTotalChunks > 1 && (
              <div className="combined-settings-group">
                <label className="combined-setting-label">🔄 Time Chunks</label>
                <div className="combined-chunk-controls">
                  <button
                    className="combined-chunk-button"
                    onClick={handleScatterPrevChunk}
                    disabled={scatterCurrentChunk === 0 || !scatterSignalsData}
                  >
                    ◀ Previous
                  </button>
                  <span className="combined-chunk-info">
                    {scatterCurrentChunk + 1} / {scatterTotalChunks}
                  </span>
                  <button
                    className="combined-chunk-button"
                    onClick={handleScatterNextChunk}
                    disabled={
                      scatterCurrentChunk >= scatterTotalChunks - 1 ||
                      !scatterSignalsData
                    }
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Plots Panel */}
        <div className="combined-plots-panel">
          {(totalLoading || scatterLoading) && (
            <div className="combined-loading-container">
              <div className="combined-spinner"></div>
              <p className="combined-loading-text">Loading ECG data...</p>
            </div>
          )}

          {error && (
            <div className="combined-error-container">
              <p className="combined-error-text">❌ {error}</p>
            </div>
          )}

          {!selectedPatient || !selectedRecording ? (
            <div className="combined-placeholder-container">
              <p className="combined-placeholder-text">
                👈 Please select patient and recording from Home page
              </p>
            </div>
          ) : (
            <div className="combined-plots-grid">
              {/* Polar Graph */}
              <div className="combined-plot-container">
                <h3 className="combined-plot-title">🌀 Polar Graph</h3>
                {polarPlotData.length > 0 ? (
                  <Plot
                    data={polarPlotData}
                    layout={polarPlotLayout}
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
                ) : (
                  <div className="combined-plot-placeholder">
                    {selectedChannels.length === 0
                      ? "Please select channels to display Polar Graph"
                      : "Loading data..."}
                  </div>
                )}
              </div>

              {/* Scatter Plot */}
              <div className="combined-plot-container">
                <h3 className="combined-plot-title">📊 Scatter Plot</h3>
                {scatterPlotData.length > 0 ? (
                  <Plot
                    data={scatterPlotData}
                    layout={scatterPlotLayout}
                    config={{
                      displayModeBar: true,
                      displaylogo: false,
                      modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
                      responsive: true,
                    }}
                  />
                ) : (
                  <div className="combined-plot-placeholder">
                    {!scatterSignalsData
                      ? "Click 'Update Scatter Plot' to load data"
                      : "No data available for scatter plot"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
