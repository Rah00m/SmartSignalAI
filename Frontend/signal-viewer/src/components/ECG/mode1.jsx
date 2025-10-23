import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode1.css";

// Reusable ECG Plot Component to reduce code repetition
const ECGPlot = React.memo(
  ({
    channels,
    groupTitle,
    patient,
    recording,
    getPlotData,
    getPlotLayout,
  }) => (
    <div className="mode1-plot-group">
      <div className="mode1-detail-plot">
        <Plot
          data={getPlotData(channels)}
          layout={getPlotLayout(channels, groupTitle)}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
            responsive: true,
            toImageButtonOptions: {
              format: "png",
              filename: `ecg_${patient}_${recording}_${groupTitle
                .toLowerCase()
                .replace(" ", "_")}`,
            },
          }}
        />
      </div>
    </div>
  )
);

// Reusable Channel Checkbox Component
const ChannelCheckbox = React.memo(
  ({ channel, isSelected, isLoading, channelColors, onToggle, disabled }) => (
    <label
      className={`mode1-channel-checkbox ${isSelected ? "selected" : ""} ${
        isLoading ? "loading" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(channel)}
        disabled={disabled}
      />
      <span
        className="mode1-channel-color"
        style={{ backgroundColor: channelColors[channel] }}
      ></span>
      {channel}
      {isLoading && <span className="mode1-channel-loading">⏳</span>}
    </label>
  )
);

export default function Mode1() {
  const navigate = useNavigate();
  const {
    selectedPatient,
    selectedRecording,
    ecgData,
    setEcgData,
    offset,
    setOffset,
  } = useECG();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [currentViewData, setCurrentViewData] = useState({});
  const [estimationLoading, setEstimationLoading] = useState(false);
  const [estimationData, setEstimationData] = useState(null);
  const [showEstimationResults, setShowEstimationResults] = useState(false);

  // Channel selection and UI
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [channelData, setChannelData] = useState({});
  const [loadingChannels, setLoadingChannels] = useState({});
  const [channelGroups, setChannelGroups] = useState({
    group1: [],
    group2: [],
  });
  const [activeTab, setActiveTab] = useState("monitor");

  // Sampling states
  const [originalSamplingFrequency] = useState(1000);
  const [displaySamplingFrequency, setDisplaySamplingFrequency] =
    useState(1000);
  const [displayInSeconds, setDisplayInSeconds] = useState(true);
  const [applyAntiAliasingFilter, setApplyAntiAliasingFilter] = useState(true);
  const [showAliasingEffect, setShowAliasingEffect] = useState(false);

  // View duration in seconds
  const [viewDuration, setViewDuration] = useState(10);

  // Refs for playback
  const playbackIntervalRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Constants
  const standardChannels = useMemo(
    () => [
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
    ],
    []
  );

  const channelMappings = useMemo(
    () => ({
      I: ["i", "I"],
      II: ["ii", "II"],
      III: ["iii", "III"],
      aVR: ["avr", "avr", "VR"],
      aVL: ["avl", "avl", "VL"],
      aVF: ["avf", "avf", "VF"],
      V1: ["v1", "V1"],
      V2: ["v2", "V2"],
      V3: ["v3", "V3"],
      V4: ["v4", "V4"],
      V5: ["v5", "V5"],
      V6: ["v6", "V6"],
    }),
    []
  );

  const channelColors = useMemo(
    () => ({
      I: "#00ff88",
      II: "#4ECDC4",
      III: "#FF6B6B",
      aVR: "#45B7D1",
      aVL: "#FFA726",
      aVF: "#9C27B0",
      V1: "#66BB6A",
      V2: "#AB47BC",
      V3: "#26C6DA",
      V4: "#FFCA28",
      V5: "#5C6BC0",
      V6: "#EC407A",
    }),
    []
  );

  const riskColors = useMemo(
    () => ({
      "Very High": "#ff6b6b",
      High: "#ffa726",
      Medium: "#ffd54f",
      Low: "#4caf50",
      None: "#66bb6a",
    }),
    []
  );

  const riskBgColors = useMemo(
    () => ({
      "Very High": "rgba(255, 107, 107, 0.1)",
      High: "rgba(255, 167, 38, 0.1)",
      Medium: "rgba(255, 213, 79, 0.1)",
      Low: "rgba(76, 175, 80, 0.1)",
      None: "rgba(102, 187, 106, 0.1)",
    }),
    []
  );

  // Derived values
  const length = useMemo(
    () => Math.round(viewDuration * displaySamplingFrequency),
    [viewDuration, displaySamplingFrequency]
  );

  const loadedChannelsCount = useMemo(
    () =>
      Object.keys(currentViewData).filter(
        (channel) => currentViewData[channel]?.x?.length > 0
      ).length,
    [currentViewData]
  );

  const totalLoading = useMemo(
    () => Object.values(loadingChannels).some((loading) => loading),
    [loadingChannels]
  );

  // Signal processing utilities
  const lowPassFilter = useCallback((signal, originalFreq, targetFreq) => {
    if (targetFreq >= originalFreq) return signal;

    const nyquistFreq = targetFreq / 2;
    const cutoffFreq = nyquistFreq * 0.8;
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const dt = 1.0 / originalFreq;
    const alpha = dt / (rc + dt);

    const filtered = new Array(signal.length);
    filtered[0] = signal[0];

    for (let i = 1; i < signal.length; i++) {
      filtered[i] = filtered[i - 1] + alpha * (signal[i] - filtered[i - 1]);
    }

    return filtered;
  }, []);

  const downsampleSignal = useCallback(
    (signal, originalFreq, targetFreq, applyFilter = true) => {
      if (targetFreq >= originalFreq) {
        return {
          downsampledSignal: signal,
          downsampledIndices: signal.map((_, i) => i),
          ratio: 1,
        };
      }

      const ratio = Math.floor(originalFreq / targetFreq);
      const signalToDownsample = applyFilter
        ? lowPassFilter(signal, originalFreq, targetFreq)
        : signal;

      const downsampledSignal = [];
      const downsampledIndices = [];

      for (let i = 0; i < signalToDownsample.length; i += ratio) {
        if (i < signalToDownsample.length) {
          downsampledSignal.push(signalToDownsample[i]);
          downsampledIndices.push(i);
        }
      }

      return {
        downsampledSignal,
        downsampledIndices,
        ratio,
      };
    },
    [lowPassFilter]
  );

  const demonstrateAliasing = useCallback(
    (signal, originalFreq, targetFreq) => {
      return downsampleSignal(signal, originalFreq, targetFreq, false);
    },
    [downsampleSignal]
  );

  const normalizeSignal = useCallback((signal) => {
    if (!signal?.length) return signal;
    const min = Math.min(...signal);
    const max = Math.max(...signal);
    const range = max - min;
    if (range === 0) return signal.map(() => 0);
    return signal.map((value) => ((value - min) / range) * 2 - 1);
  }, []);

  const calculateOptimalSpacing = useCallback((signalsData, channels) => {
    if (!signalsData || !channels.length) return 4.0;

    const amplitudes = channels.map((channel) => {
      if (!signalsData[channel]?.y) return 0;
      const signal = signalsData[channel].y;
      const min = Math.min(...signal);
      const max = Math.max(...signal);
      return Math.abs(max - min);
    });

    const maxAmplitude = Math.max(...amplitudes);

    // حساب المسافة بناءً على السعة مع حد أدنى وأقصى مناسب
    let spacing = Math.max(3.5, maxAmplitude * 1.5);

    spacing = Math.min(spacing, 8.0);

    console.log("📏 CALCULATED SPACING:", {
      channels: channels.length,
      maxAmplitude,
      calculatedSpacing: spacing,
      amplitudes,
    });

    return spacing;
  }, []);

  // Channel mapping utilities
  const mapChannelName = useCallback(
    (backendName) => {
      const lowerName = backendName.toLowerCase();
      for (const [standardName, variations] of Object.entries(
        channelMappings
      )) {
        if (
          variations.includes(lowerName) ||
          variations.includes(backendName)
        ) {
          return standardName;
        }
      }
      return (
        backendName.charAt(0).toUpperCase() + backendName.slice(1).toLowerCase()
      );
    },
    [channelMappings]
  );

  const findBackendChannel = useCallback(
    (standardChannel) => {
      const variations = channelMappings[standardChannel];
      return variations?.[0] || standardChannel.toLowerCase();
    },
    [channelMappings]
  );

  // Reset functions
  const resetAIData = useCallback(() => {
    setEstimationData(null);
    setShowEstimationResults(false);
    setError("");
  }, []);

  const resetMonitor = useCallback(() => {
    setViewDuration(10);
    setOffset(0);
    stopPlayback();
    setShowEstimationResults(false);
    setEstimationData(null);
    setActiveTab("monitor");
  }, [setOffset]);

  // Signal processing for display
  const processSignalForDisplay = useCallback(
    (xData, yData, currentOffset = 0) => {
      const originalFreq = originalSamplingFrequency;
      const targetFreq = displaySamplingFrequency;

      if (!xData || !yData || xData.length === 0 || yData.length === 0) {
        return { x: [], y: [] };
      }

      const startIndex = currentOffset;
      const endIndex = Math.min(currentOffset + length, yData.length);
      const slicedYData = yData.slice(startIndex, endIndex);

      console.log("🔍 DEBUG SAMPLING:", {
        originalFreq,
        targetFreq,
        originalLength: slicedYData.length,
        expectedDownsampledLength: Math.floor(
          slicedYData.length / (originalFreq / targetFreq)
        ),
        applyAntiAliasingFilter,
        showAliasingEffect,
      });

      if (targetFreq < originalFreq) {
        let result;

        if (showAliasingEffect) {
          console.log("🎯 ALIASING MODE: Downsampling WITHOUT filter");
          result = demonstrateAliasing(slicedYData, originalFreq, targetFreq);
        } else {
          console.log(
            "🎯 NORMAL MODE: Downsampling WITH filter:",
            applyAntiAliasingFilter
          );
          result = downsampleSignal(
            slicedYData,
            originalFreq,
            targetFreq,
            applyAntiAliasingFilter
          );
        }

        console.log("📊 DOWNsampling RESULT:", {
          originalPoints: slicedYData.length,
          downsampledPoints: result.downsampledSignal.length,
          ratio: result.ratio,
        });

        const processedXData = displayInSeconds
          ? Array.from(
              { length: result.downsampledSignal.length },
              (_, i) => currentOffset / originalFreq + i / targetFreq
            )
          : result.downsampledIndices.map((idx) => idx + currentOffset);

        return { x: processedXData, y: result.downsampledSignal };
      }

      const processedXData = displayInSeconds
        ? Array.from(
            { length: slicedYData.length },
            (_, i) => currentOffset / originalFreq + i / originalFreq
          )
        : Array.from(
            { length: slicedYData.length },
            (_, i) => i + currentOffset
          );

      return { x: processedXData, y: slicedYData };
    },
    [
      originalSamplingFrequency,
      displaySamplingFrequency,
      displayInSeconds,
      length,
      downsampleSignal,
      applyAntiAliasingFilter,
      showAliasingEffect,
      demonstrateAliasing,
    ]
  );

  // Channel data management
  const processChannelData = useCallback(
    (channel, data, currentOffset = 0) => {
      const processedData = processSignalForDisplay(
        data.x,
        data.y,
        currentOffset
      );
      return {
        x: processedData.x,
        y: normalizeSignal(processedData.y),
        originalData: data,
      };
    },
    [processSignalForDisplay, normalizeSignal]
  );

  const fetchChannelData = useCallback(
    async (channel) => {
      setLoadingChannels((prev) => ({ ...prev, [channel]: true }));

      try {
        const backendChannelName = findBackendChannel(channel);
        const apiUrl = `${
          import.meta.env.VITE_API_URL
        }/ecg/mode1/full-signal?patient=${selectedPatient}&recording=${selectedRecording}&channel=${backendChannelName}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data.x || !data.y) throw new Error("Invalid data format");

        const channelProcessedData = processChannelData(channel, data, offset);

        setChannelData((prev) => ({
          ...prev,
          [channel]: channelProcessedData,
        }));
      } catch (error) {
        console.error(`Error loading channel ${channel}:`, error);
        setError(`Failed to load channel ${channel}: ${error.message}`);
        setSelectedChannels((prev) => prev.filter((ch) => ch !== channel));
      } finally {
        setLoadingChannels((prev) => ({ ...prev, [channel]: false }));
      }
    },
    [
      selectedPatient,
      selectedRecording,
      findBackendChannel,
      processChannelData,
      offset,
    ]
  );

  const handleChannelToggle = useCallback(
    async (channel) => {
      if (selectedChannels.includes(channel)) {
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
    },
    [selectedChannels, fetchChannelData]
  );

  const handleSelectAllChannels = useCallback(() => {
    standardChannels.forEach((channel) => {
      if (!selectedChannels.includes(channel)) {
        handleChannelToggle(channel);
      }
    });
  }, [standardChannels, selectedChannels, handleChannelToggle]);

  const handleDeselectAllChannels = useCallback(() => {
    setSelectedChannels([]);
    setChannelData({});
  }, []);

  // Channel grouping
  useEffect(() => {
    if (selectedChannels.length > 0) {
      const limbLeads = ["I", "II", "III", "aVR", "aVL", "aVF"];
      const precordialLeads = ["V1", "V2", "V3", "V4", "V5", "V6"];

      setChannelGroups({
        group1: selectedChannels.filter((ch) => limbLeads.includes(ch)),
        group2: selectedChannels.filter((ch) => precordialLeads.includes(ch)),
      });
    } else {
      setChannelGroups({ group1: [], group2: [] });
    }
  }, [selectedChannels]);

  // Playback logic
  const startPlayback = useCallback(() => {
    if (selectedChannels.length === 0 || isPlayingRef.current) return;

    console.log("🎬 Starting playback", {
      offset,
      length,
      channels: selectedChannels.length,
      viewDuration,
    });

    setIsPlaying(true);
    isPlayingRef.current = true;

    playbackIntervalRef.current = setInterval(() => {
      setOffset((prevOffset) => {
        const stepSize = Math.max(1, Math.floor(displaySamplingFrequency / 10));
        const newOffset = prevOffset + stepSize;

        const firstChannel = selectedChannels[0];
        const channelLength =
          channelData[firstChannel]?.originalData?.y?.length || 0;
        const maxOffset = Math.max(0, channelLength - length);

        if (newOffset >= maxOffset) {
          console.log("🔄 Reached end, resetting to start");
          return 0;
        }

        console.log("📈 Moving playback", {
          prevOffset,
          newOffset,
          stepSize,
          currentTime: (newOffset / originalSamplingFrequency).toFixed(2) + "s",
        });
        return newOffset;
      });
    }, playbackSpeed);
  }, [
    selectedChannels.length,
    length,
    playbackSpeed,
    setOffset,
    channelData,
    displaySamplingFrequency,
    originalSamplingFrequency,
  ]);

  const stopPlayback = useCallback(() => {
    console.log("⏹️ Stopping playback");
    setIsPlaying(false);
    isPlayingRef.current = false;

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  // Update view data when offset changes
  useEffect(() => {
    if (selectedChannels.length > 0) {
      console.log("🔄 Updating view data", {
        offset,
        isPlaying,
        channels: selectedChannels.length,
      });

      const newViewData = {};

      selectedChannels.forEach((channel) => {
        if (channelData[channel]?.originalData) {
          const originalData = channelData[channel].originalData;
          const processedData = processSignalForDisplay(
            originalData.x,
            originalData.y,
            offset
          );

          newViewData[channel] = {
            x: processedData.x,
            y: normalizeSignal(processedData.y),
          };
        }
      });

      setCurrentViewData(newViewData);
      setEcgData((prev) => ({ ...prev, viewData: newViewData }));
    }
  }, [
    offset,
    viewDuration,
    channelData,
    selectedChannels,
    processSignalForDisplay,
    normalizeSignal,
    setEcgData,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // Reset when patient/recording changes
  useEffect(() => {
    if (selectedPatient && selectedRecording) {
      console.log("🔄 Resetting for new patient/recording");
      stopPlayback();
      setSelectedChannels([]);
      setChannelData({});
      setCurrentViewData({});
      setOffset(0);
    }
  }, [selectedPatient, selectedRecording, stopPlayback, setOffset]);

  // AI Analysis
  const performAIEstimation = useCallback(async () => {
    if (selectedChannels.length === 0) {
      setError("Please select at least one channel for analysis");
      return;
    }

    setEstimationLoading(true);
    setError("");
    setShowEstimationResults(false);
    setActiveTab("analysis");

    try {
      const loadResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/ecg/mode5/load-model`,
        { method: "POST" }
      );
      const loadResult = await loadResponse.json();
      if (!loadResult.success)
        throw new Error(`Failed to load AI model: ${loadResult.message}`);

      const statusResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/ecg/mode5/model-status`
      );
      const status = await statusResponse.json();
      if (!status.model_loaded) throw new Error("AI model failed to load");

      const requestData = {
        patient_info: {
          id: selectedPatient,
          age: "52",
          gender: "Male",
          history: "No known cardiac history",
        },
        recording_data: {
          channels: {},
          sampling_frequency: displaySamplingFrequency,
        },
      };

      selectedChannels.forEach((channel) => {
        if (channelData[channel]?.originalData) {
          const backendChannel = findBackendChannel(channel);
          const originalData = channelData[channel].originalData;
          const processedData = processSignalForDisplay(
            originalData.x,
            originalData.y
          );

          requestData.recording_data.channels[backendChannel] = {
            signal: processedData.y,
          };
        }
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ecg/mode5/comprehensive-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const jsonData = await response.json();

      if (jsonData.success) {
        const mappedChannelAnalysis = {};
        if (jsonData.channel_analysis) {
          Object.entries(jsonData.channel_analysis).forEach(
            ([backendChannel, analysis]) => {
              mappedChannelAnalysis[mapChannelName(backendChannel)] = analysis;
            }
          );
        }

        const finalData = {
          ...jsonData,
          channel_analysis: mappedChannelAnalysis,
        };
        setEstimationData(finalData);
        setShowEstimationResults(true);

        setEcgData({
          ...ecgData,
          analysis: finalData,
          metadata: {
            ...ecgData?.metadata,
            last_analysis: new Date().toISOString(),
            analysis_id: finalData.analysis_id,
          },
        });
      } else {
        throw new Error(
          jsonData.error || "Analysis completed but returned no results"
        );
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setError(`AI Analysis Failed: ${error.message}`);
    } finally {
      setEstimationLoading(false);
    }
  }, [
    selectedChannels,
    selectedPatient,
    displaySamplingFrequency,
    channelData,
    findBackendChannel,
    processSignalForDisplay,
    mapChannelName,
    setEcgData,
    ecgData,
  ]);

  // Plot configuration
  const getPlotDataForGroup = useCallback(
    (channels) => {
      const displayChannels = channels.filter(
        (channel) => currentViewData[channel]?.x?.length > 0
      );
      if (displayChannels.length === 0) return [];

      displayChannels.forEach((channel) => {
        console.log(`📈 CHANNEL ${channel} DATA:`, {
          points: currentViewData[channel].x.length,
          amplitudeRange: {
            min: Math.min(...currentViewData[channel].y),
            max: Math.max(...currentViewData[channel].y),
          },
          samplingMode: showAliasingEffect
            ? "ALIASING"
            : applyAntiAliasingFilter
            ? "FILTERED"
            : "DOWNSAMPLED",
        });
      });

      const optimalSpacing = calculateOptimalSpacing(
        currentViewData,
        displayChannels
      );

      return displayChannels.map((channel, index) => {
        // تطبيق إزاحة رأسية مناسبة
        const verticalOffset =
          (displayChannels.length - 1 - index) * optimalSpacing;
        const yData = currentViewData[channel].y.map((y) => y + verticalOffset);

        let lineStyle;
        if (showAliasingEffect) {
          lineStyle = {
            color: "#ff6b6b",
            width: 2,
            shape: "linear",
            dash: "dash",
          };
        } else if (
          applyAntiAliasingFilter &&
          displaySamplingFrequency < originalSamplingFrequency
        ) {
          lineStyle = {
            color: "#4ECDC4",
            width: 1.5,
            shape: "linear",
            dash: "solid",
          };
        } else if (displaySamplingFrequency < originalSamplingFrequency) {
          lineStyle = {
            color: "#FFA726",
            width: 1.5,
            shape: "linear",
            dash: "solid",
          };
        } else {
          lineStyle = {
            color: channelColors[channel] || "#ffffff",
            width: 1.3,
            shape: "linear",
            dash: "solid",
          };
        }

        return {
          x: currentViewData[channel].x,
          y: yData,
          type: "scatter",
          mode: "lines",
          line: lineStyle,
          name: channel,
          showlegend: false,
          hovertemplate: `<b>${channel}</b><br>Time: %{x:.3f}s<br>Amplitude: %{y:.2f}<br><extra></extra>`,
        };
      });
    },
    [
      currentViewData,
      calculateOptimalSpacing,
      showAliasingEffect,
      applyAntiAliasingFilter,
      displaySamplingFrequency,
      originalSamplingFrequency,
      channelColors,
    ]
  );
  const getPlotLayoutForGroup = useCallback(
    (channels, groupTitle) => {
      const displayChannels = channels.filter(
        (channel) => currentViewData[channel]?.x?.length > 0
      );

      if (displayChannels.length === 0) {
        return {
          title: {
            text: `${groupTitle} - No Data`,
            font: { color: "white", size: 16 },
          },
          paper_bgcolor: "#0a0a0a",
          plot_bgcolor: "#0a0a0a",
          height: 400,
        };
      }

      const optimalSpacing = calculateOptimalSpacing(
        currentViewData,
        displayChannels
      );

      // حساب المدى الرأسي بشكل صحيح
      const yAxisRange = [
        -optimalSpacing * 0.5,
        displayChannels.length * optimalSpacing + optimalSpacing * 0.5,
      ];

      // وضع التسميات في منتصف كل قناة
      const yTicks = displayChannels.map((channel, index) => ({
        tickval: (displayChannels.length - 1 - index) * optimalSpacing,
        ticktext: channel,
      }));

      const dynamicHeight = Math.max(400, displayChannels.length * 100);
      const isDownsampled =
        displaySamplingFrequency < originalSamplingFrequency;
      const baseTitle = `${groupTitle} • ${displayChannels.length} ch`;

      let statusInfo = "",
        titleColor = "white";

      if (showAliasingEffect && isDownsampled) {
        statusInfo = " • ⚠️ ALIASING (No Filter)";
        titleColor = "#ff6b6b";
      } else if (applyAntiAliasingFilter && isDownsampled) {
        statusInfo = " • 🔄 FILTERED";
        titleColor = "#4ECDC4";
      } else if (isDownsampled) {
        statusInfo = " • ⬇️ DOWNSAMPLED";
        titleColor = "#FFA726";
      }

      const annotations = [
        ...displayChannels.map((channel, index) => ({
          x: -0.02,
          y: (displayChannels.length - 1 - index) * optimalSpacing,
          xref: "paper",
          yref: "y",
          text: channel,
          showarrow: false,
          xanchor: "right",
          yanchor: "middle",
          font: {
            color: channelColors[channel] || "#ffffff",
            size: 10,
            weight: "bold",
          },
        })),
        {
          x: 0.02,
          y: 0.98,
          xref: "paper",
          yref: "paper",
          xanchor: "left",
          yanchor: "top",
          text: `${(offset / originalSamplingFrequency).toFixed(1)}s - ${(
            (offset + length) /
            originalSamplingFrequency
          ).toFixed(1)}s`,
          showarrow: false,
          font: { color: "#00ff88", size: 11 },
          bgcolor: "rgba(0, 0, 0, 0.7)",
        },
        {
          x: 0.98,
          y: 0.02,
          xref: "paper",
          yref: "paper",
          xanchor: "right",
          yanchor: "bottom",
          text: isPlaying ? "▶️ LIVE" : "⏸️ PAUSED",
          showarrow: false,
          font: { color: isPlaying ? "#00ff88" : "#ff6b6b", size: 12 },
          bgcolor: "rgba(0, 0, 0, 0.7)",
        },
        ...(showAliasingEffect && isDownsampled
          ? [
              {
                x: 0.5,
                y: 0.95,
                xref: "paper",
                yref: "paper",
                xanchor: "center",
                yanchor: "top",
                text: `⚠️ Aliasing: Frequencies above ${
                  displaySamplingFrequency / 2
                }Hz are folding back`,
                showarrow: false,
                font: { color: "#ff6b6b", size: 11, weight: "bold" },
                bgcolor: "rgba(255, 107, 107, 0.2)",
                bordercolor: "#ff6b6b",
                borderwidth: 1,
                borderpad: 6,
              },
            ]
          : []),
      ];

      return {
        title: {
          text: `${baseTitle}${statusInfo}`,
          font: { color: titleColor, size: 14 },
        },
        height: dynamicHeight,
        showlegend: false,
        paper_bgcolor: "#0a0a0a",
        plot_bgcolor: "#0a0a0a",
        font: { color: "white" },
        margin: { t: 50, r: 30, b: 50, l: 70 },
        hovermode: "closest",
        xaxis: {
          title: {
            text: displayInSeconds ? "Time (seconds)" : "Samples",
            font: { color: "white", size: 10 },
          },
          gridcolor: "#1a1a1a",
          zerolinecolor: "#2a2a2a",
          color: "white",
          showgrid: true,
          showline: false,
          tickfont: { size: 9 },
        },
        yaxis: {
          title: { text: "", font: { color: "white", size: 10 } },
          range: yAxisRange,
          tickvals: yTicks.map((tick) => tick.tickval),
          ticktext: yTicks.map((tick) => tick.ticktext),
          gridcolor: "#1a1a1a",
          zerolinecolor: "#2a2a2a",
          color: "white",
          showgrid: false,
          showline: false,
          tickfont: { size: 10, weight: "bold" },
          side: "left",
        },
        annotations,
      };
    },
    [
      currentViewData,
      calculateOptimalSpacing,
      displaySamplingFrequency,
      originalSamplingFrequency,
      showAliasingEffect,
      applyAntiAliasingFilter,
      channelColors,
      isPlaying,
      displayInSeconds,
      offset,
      length,
    ]
  );
  // Render functions
  const renderHeader = () => (
    <div className="mode1-header">
      <button className="mode1-back-button" onClick={() => navigate("/ecg")}>
        ← Back to Dashboard
      </button>
      <div className="mode1-header-content">
        <div className="mode1-header-main">
          <h1 className="mode1-title">12-Lead ECG Monitor</h1>
          <div className="mode1-subtitle">
            Real-time cardiac signal visualization and analysis
          </div>
        </div>
        <div className="mode1-stats-panel">
          <div className="mode1-stat-group">
            <div className="mode1-stat-item">
              <span className="mode1-stat-label">Original</span>
              <div className="mode1-stat-value primary">
                {originalSamplingFrequency} Hz
              </div>
            </div>
            <div className="mode1-stat-item">
              <span className="mode1-stat-label">Display</span>
              <div className="mode1-stat-value secondary">
                {displaySamplingFrequency} Hz
              </div>
            </div>
            <div className="mode1-stat-item">
              <span className="mode1-stat-label">Duration</span>
              <div className="mode1-stat-value accent">
                {viewDuration.toFixed(1)}s
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="mode1-tabs">
      {["monitor", "analysis", "sampling"].map((tab) => (
        <button
          key={tab}
          className={`mode1-tab ${activeTab === tab ? "active" : ""}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab === "monitor" && "📊 Monitor"}
          {tab === "analysis" && "🧠 Analysis"}
          {tab === "sampling" && "📡 Sampling"}
        </button>
      ))}
    </div>
  );

  const renderMonitorTab = () => (
    <>
      <div className="mode1-controls-section">
        <h3 className="mode1-section-title">Channel Selection</h3>
        <div className="mode1-channels-buttons">
          <button
            className="mode1-channel-button primary"
            onClick={handleSelectAllChannels}
            disabled={!selectedPatient || !selectedRecording || totalLoading}
          >
            Select All
          </button>
          <button
            className="mode1-channel-button secondary"
            onClick={handleDeselectAllChannels}
            disabled={!selectedPatient || !selectedRecording}
          >
            Deselect All
          </button>
        </div>
        <div className="mode1-channels-grid">
          {standardChannels.map((channel) => (
            <ChannelCheckbox
              key={channel}
              channel={channel}
              isSelected={selectedChannels.includes(channel)}
              isLoading={loadingChannels[channel]}
              channelColors={channelColors}
              onToggle={handleChannelToggle}
              disabled={
                !selectedPatient ||
                !selectedRecording ||
                loadingChannels[channel]
              }
            />
          ))}
        </div>
        <div className="mode1-selection-summary">
          {selectedChannels.length} channels selected
          {totalLoading && " • Loading..."}
        </div>
      </div>

      <div className="mode1-controls-section">
        <h3 className="mode1-section-title">Display Settings</h3>
        <div className="mode1-settings-group">
          <label className="mode1-setting-label">View Duration</label>
          <input
            type="number"
            min="1"
            max="30"
            step="0.5"
            value={viewDuration}
            onChange={(e) => setViewDuration(Number(e.target.value))}
            className="mode1-setting-input"
            disabled={!selectedPatient || !selectedRecording || isPlaying}
          />
          <p className="mode1-hint-text">
            Duration of visible data in seconds (1-30s)
          </p>
        </div>

        {!isPlaying && (
          <div className="mode1-settings-group">
            <label className="mode1-setting-label">Start Time</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={
                displayInSeconds
                  ? (offset / originalSamplingFrequency).toFixed(1)
                  : offset
              }
              onChange={(e) => {
                const value = Number(e.target.value);
                setOffset(
                  displayInSeconds
                    ? Math.round(value * originalSamplingFrequency)
                    : value
                );
              }}
              className="mode1-setting-input"
              disabled={!selectedPatient || !selectedRecording}
            />
            <p className="mode1-hint-text">
              Start position in {displayInSeconds ? "seconds" : "samples"}
            </p>
          </div>
        )}
      </div>

      <div className="mode1-controls-section">
        <h3 className="mode1-section-title">Playback Controls</h3>
        <div className="mode1-settings-group">
          <label className="mode1-setting-label">Scroll Speed</label>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="mode1-setting-input"
            disabled={!selectedPatient || !selectedRecording}
          >
            <option value={2000}>Very Slow</option>
            <option value={1500}>Slow</option>
            <option value={1000}>Normal</option>
            <option value={500}>Fast</option>
            <option value={250}>Very Fast</option>
          </select>
        </div>

        <div className="mode1-playback-buttons">
          <button
            className={`mode1-play-button ${isPlaying ? "playing" : ""}`}
            onClick={isPlaying ? stopPlayback : startPlayback}
            disabled={
              !selectedPatient ||
              !selectedRecording ||
              selectedChannels.length === 0
            }
          >
            {isPlaying ? "⏸️ Stop Playback" : "▶️ Start Playback"}
          </button>
        </div>
      </div>
    </>
  );

  const renderSamplingTab = () => (
    <div className="mode1-controls-section">
      <h3 className="mode1-section-title">Sampling & Aliasing Controls</h3>

      <div className="mode1-settings-group">
        <label className="mode1-setting-label">
          Original Sampling Frequency
        </label>
        <div className="mode1-frequency-display">
          <strong>{originalSamplingFrequency} Hz</strong>
          <span className="mode1-hint-text">PTB Database Standard</span>
        </div>
      </div>

      <div className="mode1-settings-group">
        <label className="mode1-setting-label">
          Display Sampling Frequency:{" "}
          <strong>{displaySamplingFrequency} Hz</strong>
        </label>
        {/* Added Slider Here */}
        <input
          type="range"
          min="25"
          max="1000"
          step="25"
          value={displaySamplingFrequency}
          onChange={(e) => setDisplaySamplingFrequency(Number(e.target.value))}
          className="mode1-slider"
        />
        <div className="mode1-slider-labels">
          <span>25 Hz</span>
          <span>1000 Hz</span>
        </div>
        <p className="mode1-hint-text">
          Nyquist Frequency: {displaySamplingFrequency / 2} Hz
        </p>
      </div>

      <div className="mode1-settings-group">
        <label className="mode1-setting-label">
          <input
            type="checkbox"
            checked={applyAntiAliasingFilter}
            onChange={(e) => {
              setApplyAntiAliasingFilter(e.target.checked);
              if (e.target.checked) setShowAliasingEffect(false);
            }}
            className="mode1-checkbox"
            disabled={showAliasingEffect}
          />
          Apply Anti-Aliasing Filter
        </label>
        <p className="mode1-hint-text">
          Applies low-pass filter before downsampling to prevent aliasing
        </p>
      </div>

      <div className="mode1-settings-group">
        <label className="mode1-setting-label">
          <input
            type="checkbox"
            checked={showAliasingEffect}
            onChange={(e) => {
              setShowAliasingEffect(e.target.checked);
              if (e.target.checked) setApplyAntiAliasingFilter(false);
            }}
            className="mode1-checkbox"
          />
          Demonstrate Aliasing Effect
        </label>
        <p className="mode1-hint-text">
          Shows signal distortion when undersampled without anti-aliasing filter
        </p>
      </div>
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="mode1-controls-section">
      <h3 className="mode1-section-title">AI Analysis</h3>

      <div className="mode1-estimation-group">
        <button
          className="mode1-estimation-button"
          onClick={performAIEstimation}
          disabled={
            !selectedPatient ||
            !selectedRecording ||
            estimationLoading ||
            selectedChannels.length === 0
          }
        >
          {estimationLoading ? (
            <>
              <div className="mode1-spinner-small"></div>
              AI Analysis in Progress...
            </>
          ) : (
            <>🧠 Start AI Analysis</>
          )}
        </button>
        <p className="mode1-hint-text">
          Advanced cardiac analysis using {selectedChannels.length} selected
          channels
        </p>
      </div>

      {showEstimationResults && estimationData && (
        <div className="mode1-estimation-results">
          {estimationData.final_diagnosis && (
            <div
              className="mode1-diagnosis-card"
              style={{
                borderLeftColor:
                  riskColors[estimationData.final_diagnosis.severity],
                backgroundColor:
                  riskBgColors[estimationData.final_diagnosis.severity],
              }}
            >
              <h5>🏥 Final Diagnosis</h5>
              <div className="mode1-diagnosis-main">
                {estimationData.final_diagnosis.diagnosis_description}
              </div>
              <div className="mode1-diagnosis-details">
                <div className="mode1-detail-item">
                  <span>Confidence:</span>
                  <strong>{estimationData.final_diagnosis.confidence}%</strong>
                </div>
                <div className="mode1-detail-item">
                  <span>Risk Level:</span>
                  <strong
                    style={{
                      color:
                        riskColors[estimationData.final_diagnosis.severity],
                    }}
                  >
                    {estimationData.final_diagnosis.severity}
                  </strong>
                </div>
                <div className="mode1-detail-item">
                  <span>Analysis ID:</span>
                  <code>{estimationData.analysis_id}</code>
                </div>
              </div>
            </div>
          )}

          {estimationData.channel_analysis && (
            <div className="mode1-channels-summary">
              <h5>📊 Channel Analysis</h5>
              <div className="mode1-channels-grid compact">
                {Object.entries(estimationData.channel_analysis).map(
                  ([channel, analysis]) => (
                    <div
                      key={channel}
                      className="mode1-channel-result"
                      style={{ borderColor: riskColors[analysis.risk_level] }}
                    >
                      <div className="mode1-channel-header">
                        <span className="mode1-channel-name">{channel}</span>
                        <span
                          className="mode1-channel-risk"
                          style={{ color: riskColors[analysis.risk_level] }}
                        >
                          {analysis.risk_level}
                        </span>
                      </div>
                      <div className="mode1-channel-diagnosis">
                        {analysis.main_diagnosis?.diagnosis_description}
                      </div>
                      <div className="mode1-channel-confidence">
                        Confidence: {analysis.main_diagnosis?.confidence}%
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {estimationData.summary?.priority_recommendations && (
            <div className="mode1-recommendations">
              <h5>💡 Recommendations</h5>
              <div className="mode1-recommendations-list">
                {estimationData.summary.priority_recommendations
                  .slice(0, 3)
                  .map((rec, index) => (
                    <div key={index} className="mode1-recommendation-item">
                      {rec}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPlots = () => {
    if (totalLoading) {
      return (
        <div className="mode1-loading-container">
          <div className="mode1-spinner"></div>
          <p className="mode1-loading-text">Loading ECG Channels...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mode1-error-container">
          <p className="mode1-error-text">{error}</p>
        </div>
      );
    }

    if (!selectedPatient || !selectedRecording) {
      return (
        <div className="mode1-placeholder-container">
          <p className="mode1-placeholder-text">
            Please select patient and recording from Home page
          </p>
        </div>
      );
    }

    if (selectedChannels.length === 0) {
      return (
        <div className="mode1-placeholder-container">
          <p className="mode1-placeholder-text">
            Please select channels to display ECG signals
          </p>
        </div>
      );
    }

    if (loadedChannelsCount === 0) {
      return (
        <div className="mode1-placeholder-container">
          <p className="mode1-placeholder-text">
            No ECG data to display for selected channels
          </p>
        </div>
      );
    }

    return (
      <div className="mode1-dual-plots">
        <ECGPlot
          channels={channelGroups.group1}
          groupTitle="ECG Group 1"
          patient={selectedPatient}
          recording={selectedRecording}
          getPlotData={getPlotDataForGroup}
          getPlotLayout={getPlotLayoutForGroup}
        />
        <ECGPlot
          channels={channelGroups.group2}
          groupTitle="ECG Group 2"
          patient={selectedPatient}
          recording={selectedRecording}
          getPlotData={getPlotDataForGroup}
          getPlotLayout={getPlotLayoutForGroup}
        />
      </div>
    );
  };

  return (
    <div className="mode1-container">
      {renderHeader()}
      <div className="mode1-content">
        <div className="mode1-controls-panel">
          {renderTabs()}
          {activeTab === "monitor" && renderMonitorTab()}
          {activeTab === "sampling" && renderSamplingTab()}
          {activeTab === "analysis" && renderAnalysisTab()}
          <div className="mode1-controls-section">
            <button
              className="mode1-update-button"
              onClick={resetMonitor}
              disabled={!selectedPatient || !selectedRecording}
            >
              🔄 Reset Monitor
            </button>
          </div>
        </div>
        <div className="mode1-plot-container">{renderPlots()}</div>
      </div>
    </div>
  );
}
