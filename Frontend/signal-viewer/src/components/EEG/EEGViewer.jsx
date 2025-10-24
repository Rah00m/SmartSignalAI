import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import axios from "axios";
import "./EEGViewer.css";

const LABEL_MAP = {
  0: "Multiple Sclerosis (MS)",
  1: "Healthy Control (HC)",
  2: "Alzheimer's Disease (AD)",
  3: "Frontotemporal Dementia (FTD)",
  4: "Parkinson's Disease (PD)",
};

const CHANNEL_NAMES = [
  "Pz",
  "Cz",
  "Fz",
  "T6",
  "T5",
  "T4",
  "T3",
  "F8",
  "F7",
  "O2",
  "O1",
  "P4",
  "P3",
  "C4",
  "C3",
  "F4",
  "F3",
  "Fp2",
  "Fp1",
];

const FEATURE_COLORS = [
  "#00bcd4",
  "#ff7043",
  "#66bb6a",
  "#ab47bc",
  "#ffa726",
  "#29b6f6",
  "#ef5350",
  "#8d6e63",
  "#26a69a",
  "#7e57c2",
];

const LABEL_COLORS = {
  0: "#ff4444", // MS - Red
  1: "#44ff44", // HC - Green
  2: "#4444ff", // AD - Blue
  3: "#ffff44", // FTD - Yellow
  4: "#ff44ff", // PD - Magenta
};

const API_BASE_URL = "http://localhost:8000/eeg";

// Original sampling frequency of the EEG data
const ORIGINAL_SAMPLING_FREQ = 128;

export default function EEGViewer() {
  const [available, setAvailable] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [selected, setSelected] = useState([]);
  const [featureData, setFeatureData] = useState({});
  const [playing, setPlaying] = useState(true);
  const [globalStep, setGlobalStep] = useState(0);
  const [activeTab, setActiveTab] = useState("realtime");
  const [featuresInfo, setFeaturesInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signalBuffer, setSignalBuffer] = useState({});
  const [detectionResults, setDetectionResults] = useState([]);
  const [polarAngle, setPolarAngle] = useState(0);
  const timerRef = useRef(null);
  const [selectedChannel, setSelectedChannel] = useState(0);
  const [xorCompleted, setXorCompleted] = useState({});
  const [xorDisplayBuffer, setXorDisplayBuffer] = useState({});
  const [xorTimeChunk, setXorTimeChunk] = useState(32);
  const [samplingFrequency, setSamplingFrequency] = useState(128);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Dynamic settings based on sampling frequency
  const getDynamicSettings = () => {
    // Calculate the downsampling ratio
    const downsampleRatio = Math.max(
      1,
      Math.floor(ORIGINAL_SAMPLING_FREQ / samplingFrequency)
    );

    // Calculate effective interval based on desired sampling frequency
    const baseInterval = 1000 / samplingFrequency;
    const speedMultiplier = 1 / playbackSpeed;

    return {
      PLAY_INTERVAL_MS: Math.max(16, baseInterval * speedMultiplier),
      WINDOW_POINTS: Math.min(512, Math.floor(samplingFrequency * 4)), // 4 seconds of data
      SCROLL_SPEED: Math.max(1, Math.floor(playbackSpeed)),
      POLAR_UPDATE_MS: Math.max(100, 500 / playbackSpeed),
      DOWNSAMPLE_RATIO: downsampleRatio,
      EFFECTIVE_SAMPLING_FREQ: samplingFrequency,
    };
  };

  const OFFSET_PER_CHANNEL = 0.5;

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return true;
    } catch (err) {
      setError(
        `Cannot connect to backend at ${API_BASE_URL}. Make sure the server is running.`
      );
      return false;
    }
  };

  // Fetch available features and their info
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const isConnected = await testBackendConnection();
      if (!isConnected) {
        setLoading(false);
        return;
      }

      try {
        const featuresRes = await axios.get(`${API_BASE_URL}/features`);
        if (!featuresRes.data || !Array.isArray(featuresRes.data)) {
          throw new Error("Invalid features response format");
        }

        setAvailable(featuresRes.data);

        try {
          const infoRes = await axios.get(`${API_BASE_URL}/feature-info`);
          setFeaturesInfo(infoRes.data || []);
        } catch (infoErr) {
          const basicInfo = featuresRes.data.map((filename) => ({
            filename,
            feature_number: extractFeatureNumber(filename),
            label: null,
            label_name: "Unknown",
          }));
          setFeaturesInfo(basicInfo);
        }
      } catch (err) {
        setError(`Failed to load features: ${err.message}`);
        setAvailable([]);
        setFeaturesInfo([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extract feature number from filename
  const extractFeatureNumber = (filename) => {
    const match = filename.match(/feature_(\d+)\.npy/);
    return match ? parseInt(match[1]) : null;
  };

  // Get feature info by filename
  const getFeatureInfo = (filename) => {
    const info = featuresInfo.find((info) => info.filename === filename);
    return (
      info || {
        filename,
        feature_number: extractFeatureNumber(filename),
        label: null,
        label_name: "Unknown",
      }
    );
  };

  // Add detection result when feature is selected
  const addDetectionResult = (featureName, label, labelName) => {
    const newResult = {
      featureName,
      label,
      labelName,
      timestamp: new Date().toLocaleTimeString(),
    };

    setDetectionResults((prev) => {
      const filtered = prev.filter(
        (result) => result.featureName !== featureName
      );
      return [...filtered, newResult];
    });
  };

  // Remove detection result when feature is deselected
  const removeDetectionResult = (featureName) => {
    setDetectionResults((prev) =>
      prev.filter((result) => result.featureName !== featureName)
    );
  };

  // Clear all detection results
  const clearAllDetectionResults = () => {
    setDetectionResults([]);
  };

  // Downsample data based on desired sampling frequency
  const downsampleData = (data, originalFreq, targetFreq) => {
    if (targetFreq >= originalFreq) return data;

    const downsampleRatio = Math.floor(originalFreq / targetFreq);
    const downsampled = [];

    for (let i = 0; i < data.length; i += downsampleRatio) {
      if (i < data.length) {
        downsampled.push(data[i]);
      }
    }

    return downsampled;
  };

  // Toggle feature selection
  const toggleFeature = async (name) => {
    if (selected.includes(name)) {
      setSelected(selected.filter((x) => x !== name));
      removeDetectionResult(name);
      // Clear buffers when deselected
      setSignalBuffer((prev) => {
        const newBuffer = { ...prev };
        delete newBuffer[name];
        return newBuffer;
      });
      setXorCompleted((prev) => {
        const newCompleted = { ...prev };
        delete newCompleted[name];
        return newCompleted;
      });
      setXorDisplayBuffer((prev) => {
        const newDisplay = { ...prev };
        delete newDisplay[name];
        return newDisplay;
      });
      return;
    }

    // Load feature data if not loaded
    if (!featureData[name]) {
      try {
        const res = await axios.get(`${API_BASE_URL}/feature/${name}`);
        const payload = res.data;
        const arr = payload.feature;

        if (!Array.isArray(arr) || arr.length === 0) {
          alert("Feature empty or invalid format");
          return;
        }

        const numSamples = arr.length;
        const numPoints = arr[0].length;
        const numChannels = Array.isArray(arr[0][0]) ? arr[0][0].length : 1;

        // Build flattened channels
        const flattened = Array.from({ length: numChannels }, () => []);
        for (let s = 0; s < numSamples; s++) {
          for (let t = 0; t < numPoints; t++) {
            for (let ch = 0; ch < numChannels; ch++) {
              flattened[ch].push(arr[s][t][ch]);
            }
          }
        }

        // Normalize each channel
        const normFlattened = flattened.map((chArr) => {
          const min = Math.min(...chArr);
          const max = Math.max(...chArr);
          const span = max - min || 1;
          return chArr.map((v) => (v - min) / span);
        });

        // Apply downsampling based on current sampling frequency setting
        const downsampledFlattened = normFlattened.map((channelData) =>
          downsampleData(channelData, ORIGINAL_SAMPLING_FREQ, samplingFrequency)
        );

        const featureInfo = {
          flattened: downsampledFlattened,
          originalFlattened: normFlattened, // Keep original for when sampling freq changes
          numSamples,
          numPoints,
          numChannels,
          label: payload.label,
          labelName: payload.label_name,
          featureNumber: payload.feature_number,
          currentIndex: 0,
        };

        setFeatureData((prev) => ({
          ...prev,
          [name]: featureInfo,
        }));

        // Initialize signal buffer with zeros
        const settings = getDynamicSettings();
        const initialBuffer = {};
        for (let ch = 0; ch < numChannels; ch++) {
          initialBuffer[ch] = new Array(settings.WINDOW_POINTS).fill(0);
        }
        setSignalBuffer((prev) => ({
          ...prev,
          [name]: initialBuffer,
        }));

        // Add detection result
        addDetectionResult(name, payload.label, payload.label_name);
      } catch (err) {
        alert(`Failed to load feature ${name}: ${err.message}`);
        return;
      }
    } else {
      // Feature already loaded, just add detection result
      const info = featureData[name];
      addDetectionResult(name, info.label, info.labelName);
    }

    setSelected((prev) => [...prev, name]);
  };

  // Update signal buffers for live display with proper downsampling
  useEffect(() => {
    if (!playing || selected.length === 0) return;

    const settings = getDynamicSettings();
    let interval;

    if (activeTab === "polar") {
      interval = settings.POLAR_UPDATE_MS;
    } else if (activeTab === "xor") {
      interval = settings.PLAY_INTERVAL_MS * 2;
    } else {
      interval = settings.PLAY_INTERVAL_MS;
    }

    const updateBuffers = () => {
      if (activeTab === "polar") {
        setPolarAngle((prev) => (prev + 15 * playbackSpeed) % 360);
      } else if (activeTab === "xor") {
        // XOR mode logic
        setSignalBuffer((prevBuffer) => {
          const newBuffer = { ...prevBuffer };
          let anyCompleted = false;

          selected.forEach((name) => {
            const info = featureData[name];
            if (!info || !newBuffer[name] || xorCompleted[name]) return;

            const { flattened, numChannels, currentIndex } = info;
            const channelIndex = Math.min(selectedChannel, numChannels - 1);

            if (currentIndex >= flattened[channelIndex].length) {
              setXorCompleted((prev) => ({ ...prev, [name]: true }));
              setXorDisplayBuffer((prev) => ({
                ...prev,
                [name]: newBuffer[name],
              }));
              anyCompleted = true;
              return;
            }

            const updatedBuffer = { ...newBuffer[name] };
            let currentBuffer = [...updatedBuffer[channelIndex]];

            const scrollSpeed = settings.SCROLL_SPEED;
            const newDataPoints = [];
            for (let i = 0; i < scrollSpeed; i++) {
              const dataIndex =
                (currentIndex + i) % flattened[channelIndex].length;
              if (dataIndex < flattened[channelIndex].length) {
                newDataPoints.push(flattened[channelIndex][dataIndex]);
              }
            }

            // XOR operation
            for (let i = 0; i < newDataPoints.length; i++) {
              const bufferIndex =
                currentBuffer.length - newDataPoints.length + i;
              if (bufferIndex >= 0 && bufferIndex < currentBuffer.length) {
                const existingValue = currentBuffer[bufferIndex];
                const newValue = newDataPoints[i];

                const similarityThreshold =
                  xorTimeChunk === 10 ? 0.05 : xorTimeChunk === 32 ? 0.1 : 0.2;
                const difference = Math.abs(existingValue - newValue);

                if (difference > similarityThreshold) {
                  currentBuffer[bufferIndex] = Math.min(
                    1,
                    existingValue + difference * 0.5
                  );
                }
              }
            }

            currentBuffer.splice(0, scrollSpeed);
            currentBuffer = [
              ...currentBuffer,
              ...new Array(scrollSpeed).fill(0),
            ];

            updatedBuffer[channelIndex] = currentBuffer;
            newBuffer[name] = updatedBuffer;

            if (!anyCompleted) {
              setFeatureData((prev) => ({
                ...prev,
                [name]: {
                  ...prev[name],
                  currentIndex: Math.min(
                    currentIndex + scrollSpeed,
                    flattened[channelIndex].length
                  ),
                },
              }));
            }
          });

          return newBuffer;
        });
      } else {
        // Real-time mode with proper downsampling
        setSignalBuffer((prevBuffer) => {
          const newBuffer = { ...prevBuffer };
          const scrollSpeed = settings.SCROLL_SPEED;

          selected.forEach((name) => {
            const info = featureData[name];
            if (!info || !newBuffer[name]) return;

            const { flattened, currentIndex } = info;
            const updatedBuffer = { ...newBuffer[name] };

            for (let ch = 0; ch < info.numChannels; ch++) {
              const currentBuffer = [...updatedBuffer[ch]];
              currentBuffer.splice(0, scrollSpeed);

              const newDataPoints = [];
              for (let i = 0; i < scrollSpeed; i++) {
                const dataIndex = (currentIndex + i) % flattened[ch].length;
                newDataPoints.push(flattened[ch][dataIndex]);
              }

              updatedBuffer[ch] = [...currentBuffer, ...newDataPoints];
            }

            newBuffer[name] = updatedBuffer;

            setFeatureData((prev) => ({
              ...prev,
              [name]: {
                ...prev[name],
                currentIndex:
                  (currentIndex + scrollSpeed) % flattened[0].length,
              },
            }));
          });

          return newBuffer;
        });
      }

      setGlobalStep((prev) => prev + 1);
    };

    timerRef.current = setInterval(updateBuffers, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    playing,
    selected,
    featureData,
    activeTab,
    xorCompleted,
    selectedChannel,
    xorTimeChunk,
    samplingFrequency,
    playbackSpeed,
  ]);

  // Update downsampling when sampling frequency changes
  useEffect(() => {
    if (selected.length === 0) return;

    setFeatureData((prev) => {
      const newData = { ...prev };

      Object.keys(newData).forEach((name) => {
        const info = newData[name];
        if (info && info.originalFlattened) {
          // Re-apply downsampling with new frequency
          const downsampledFlattened = info.originalFlattened.map(
            (channelData) =>
              downsampleData(
                channelData,
                ORIGINAL_SAMPLING_FREQ,
                samplingFrequency
              )
          );

          newData[name] = {
            ...info,
            flattened: downsampledFlattened,
            currentIndex: 0, // Reset playback position
          };
        }
      });

      return newData;
    });

    // Reset buffers
    setSignalBuffer((prev) => {
      const newBuffer = { ...prev };
      const settings = getDynamicSettings();

      Object.keys(newBuffer).forEach((name) => {
        const info = featureData[name];
        if (info) {
          const resetBuffer = {};
          for (let ch = 0; ch < info.numChannels; ch++) {
            resetBuffer[ch] = new Array(settings.WINDOW_POINTS).fill(0);
          }
          newBuffer[name] = resetBuffer;
        }
      });

      return newBuffer;
    });

    setXorCompleted({});
    setXorDisplayBuffer({});
  }, [samplingFrequency]);

  // Select All / Deselect All
  const selectAll = async () => {
    if (available.length === 0) {
      alert("No features available to select");
      return;
    }

    for (const feature of available) {
      if (!featureData[feature]) {
        await toggleFeature(feature);
      } else {
        setSelected((prev) => [...prev, feature]);
        const info = featureData[feature];
        addDetectionResult(feature, info.label, info.labelName);
      }
    }
  };

  const deselectAll = () => {
    setSelected([]);
    setSignalBuffer({});
    setXorCompleted({});
    setXorDisplayBuffer({});
    clearAllDetectionResults();
  };

  const restart = () => {
    const settings = getDynamicSettings();

    setSignalBuffer((prev) => {
      const newBuffer = { ...prev };
      Object.keys(newBuffer).forEach((name) => {
        const info = featureData[name];
        if (info) {
          const resetBuffer = {};
          for (let ch = 0; ch < info.numChannels; ch++) {
            resetBuffer[ch] = new Array(settings.WINDOW_POINTS).fill(0);
          }
          newBuffer[name] = resetBuffer;
        }
      });
      return newBuffer;
    });

    setFeatureData((prev) => {
      const newData = { ...prev };
      Object.keys(newData).forEach((name) => {
        newData[name] = {
          ...newData[name],
          currentIndex: 0,
        };
      });
      return newData;
    });

    setXorCompleted({});
    setXorDisplayBuffer({});
    setPolarAngle(0);
    setGlobalStep(0);
    setPlaying(true);
  };

  // Build traces for real-time plot
  const buildRealtimeTraces = () => {
    const traces = [];
    let featureGroupOffset = 0;

    selected.forEach((name, fIdx) => {
      const info = featureData[name];
      const buffer = signalBuffer[name];

      if (!info || !buffer) return;

      const { numChannels } = info;
      const settings = getDynamicSettings();

      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = buffer[ch] || [];

        const offset = ch * OFFSET_PER_CHANNEL + featureGroupOffset;
        const yOffset = channelData.map((v) => v + offset);

        const xValues = Array.from(
          { length: settings.WINDOW_POINTS },
          (_, i) => i
        );

        traces.push({
          x: xValues,
          y: yOffset,
          mode: "lines",
          line: {
            color: FEATURE_COLORS[fIdx % FEATURE_COLORS.length],
            width: 1.5,
            shape: "linear",
          },
          hoverinfo: "none",
          name: `${name} - ${CHANNEL_NAMES[ch] || `Ch ${ch + 1}`}`,
          showlegend: false,
        });

        traces.push({
          x: [0],
          y: [offset + 0.5],
          mode: "text",
          text: [CHANNEL_NAMES[ch] || `Ch ${ch + 1}`],
          textposition: "middle right",
          showlegend: false,
          hoverinfo: "none",
          textfont: {
            color: FEATURE_COLORS[fIdx % FEATURE_COLORS.length],
            size: 10,
          },
        });
      }

      traces.push({
        x: [settings.WINDOW_POINTS - 10],
        y: [featureGroupOffset + (numChannels * OFFSET_PER_CHANNEL) / 2],
        mode: "text",
        text: [`${name}`],
        textposition: "middle left",
        showlegend: false,
        hoverinfo: "none",
        textfont: {
          color: FEATURE_COLORS[fIdx % FEATURE_COLORS.length],
          size: 10,
        },
      });

      featureGroupOffset += numChannels * OFFSET_PER_CHANNEL + 3;
    });

    return traces;
  };

  // Build traces for Polar plot (multiple features, single channel)
  const buildPolarTraces = () => {
    const traces = [];

    if (selected.length === 0) return traces;

    const channelIndex = Math.min(selectedChannel, CHANNEL_NAMES.length - 1);

    // Create spiral for each selected feature
    selected.forEach((name, fIdx) => {
      const info = featureData[name];
      if (!info) return;

      const { flattened, numChannels } = info;

      // Skip if selected channel doesn't exist in this feature
      if (channelIndex >= numChannels) return;

      // Calculate spiral data points for the selected channel
      const spiralPoints = 180;
      const maxRadius = 0.8;
      const spiralData = [];

      for (let i = 0; i < spiralPoints; i++) {
        const angle = (polarAngle + i * 2) % 360;
        const radius = (i / spiralPoints) * maxRadius;

        const dataIndex =
          Math.floor((angle / 360) * flattened[channelIndex].length) %
          flattened[channelIndex].length;
        const signalValue = flattened[channelIndex][dataIndex];

        // Adjust radius based on signal value and feature index for separation
        const adjustedRadius = radius + signalValue * 0.2 + fIdx * 0.1;

        spiralData.push({
          angle: angle,
          radius: adjustedRadius,
          signalValue: signalValue,
        });
      }

      const r = spiralData.map((point) => point.radius);
      const theta = spiralData.map((point) => point.angle);

      // Spiral trace for this feature
      traces.push({
        type: "scatterpolar",
        r: r,
        theta: theta,
        mode: "lines",
        line: {
          color: FEATURE_COLORS[fIdx % FEATURE_COLORS.length],
          width: 3,
          shape: "spline",
        },
        hoverinfo: "none",
        name: `${name} - ${CHANNEL_NAMES[channelIndex]}`,
        showlegend: true,
      });

      // Add current position marker for this feature
      const currentAngle = polarAngle;
      const currentRadius = spiralData[0]?.radius || 0;

      traces.push({
        type: "scatterpolar",
        r: [currentRadius],
        theta: [currentAngle],
        mode: "markers",
        marker: {
          color: FEATURE_COLORS[fIdx % FEATURE_COLORS.length],
          size: 8,
          symbol: "circle",
          line: { color: "white", width: 2 },
        },
        hoverinfo: "none",
        name: `${name} Current`,
        showlegend: false,
      });
    });

    // Add channel label at the outer edge
    const labelRadius = 1.05;
    traces.push({
      type: "scatterpolar",
      r: [labelRadius],
      theta: [0],
      mode: "text",
      text: [`${CHANNEL_NAMES[channelIndex]}`],
      textfont: {
        color: "#ffffff",
        size: 16,
        family: "Arial, sans-serif",
        weight: "bold",
      },
      hoverinfo: "none",
      showlegend: false,
    });

    // Add radial grid lines
    for (let i = 0.2; i <= 1; i += 0.2) {
      traces.push({
        type: "scatterpolar",
        r: Array(37).fill(i),
        theta: Array.from({ length: 37 }, (_, i) => i * 10),
        mode: "lines",
        line: { color: "rgba(255,255,255,0.15)", width: 1, dash: "dot" },
        hoverinfo: "none",
        showlegend: false,
      });
    }

    // Add angular grid lines
    for (let angle = 0; angle < 360; angle += 45) {
      traces.push({
        type: "scatterpolar",
        r: [0, 1],
        theta: [angle, angle],
        mode: "lines",
        line: { color: "rgba(255,255,255,0.15)", width: 1, dash: "dot" },
        hoverinfo: "none",
        showlegend: false,
      });
    }

    return traces;
  };

  // Build traces for XOR plot (single channel, multiple features)
  const buildXORTraces = () => {
    const traces = [];

    if (selected.length === 0) return traces;

    const channelIndex = Math.min(selectedChannel, CHANNEL_NAMES.length - 1);
    const settings = getDynamicSettings();

    // Create XOR display for each selected feature
    selected.forEach((name, fIdx) => {
      const info = featureData[name];
      if (!info) return;

      const { flattened, numChannels, label, currentIndex } = info;

      // Skip if selected channel doesn't exist in this feature
      if (channelIndex >= numChannels) return;

      const isCompleted = xorCompleted[name];
      const displayData = isCompleted
        ? xorDisplayBuffer[name]
        : signalBuffer[name];

      if (!displayData) return;

      const channelData =
        displayData[channelIndex] || new Array(settings.WINDOW_POINTS).fill(0);

      // Apply vertical offset for each feature to separate them
      const offset = fIdx * 2;

      traces.push({
        x: Array.from({ length: settings.WINDOW_POINTS }, (_, i) => i),
        y: channelData.map((v) => v + offset),
        mode: "lines",
        line: {
          color: isCompleted
            ? "#00ff00"
            : FEATURE_COLORS[fIdx % FEATURE_COLORS.length],
          width: isCompleted ? 4 : 3,
          shape: "linear",
        },
        hoverinfo: "none",
        name: `${name} - ${CHANNEL_NAMES[channelIndex]} ${
          isCompleted ? "(COMPLETED)" : "(XOR)"
        }`,
        showlegend: true,
      });

      // Add channel and feature label
      traces.push({
        x: [0],
        y: [offset + 0.5],
        mode: "text",
        text: [`${name} - ${CHANNEL_NAMES[channelIndex]}`],
        textposition: "middle right",
        showlegend: false,
        hoverinfo: "none",
        textfont: {
          color: isCompleted
            ? "#00ff00"
            : FEATURE_COLORS[fIdx % FEATURE_COLORS.length],
          size: 10,
          weight: "bold",
        },
      });

      if (isCompleted) {
        traces.push({
          x: [settings.WINDOW_POINTS / 2],
          y: [offset + 1.2],
          mode: "text",
          text: [`✓ ${LABEL_MAP[label] || "Unknown"}`],
          textposition: "middle center",
          showlegend: false,
          hoverinfo: "none",
          textfont: {
            color: "#00ff00",
            size: 12,
            weight: "bold",
          },
        });
      } else {
        const progress = Math.min(
          100,
          Math.floor((currentIndex / flattened[channelIndex].length) * 100)
        );
        traces.push({
          x: [settings.WINDOW_POINTS - 10],
          y: [offset + 1.2],
          mode: "text",
          text: [`${progress}%`],
          textposition: "middle left",
          showlegend: false,
          hoverinfo: "none",
          textfont: {
            color: FEATURE_COLORS[fIdx % FEATURE_COLORS.length],
            size: 10,
          },
        });
      }
    });

    return traces;
  };

  // Get traces based on active tab
  const getTraces = () => {
    switch (activeTab) {
      case "realtime":
        return buildRealtimeTraces();
      case "polar":
        return buildPolarTraces();
      case "xor":
        return buildXORTraces();
      default:
        return buildRealtimeTraces();
    }
  };

  // Get layout based on active tab
  const getLayout = () => {
    const settings = getDynamicSettings();
    const baseLayout = {
      height: 500,
      margin: { t: 60, l: 80, r: 80, b: 40 },
      plot_bgcolor: "#000000",
      paper_bgcolor: "#071421",
      font: { color: "#dff6ff" },
      showlegend: activeTab === "polar" || activeTab === "xor",
    };

    switch (activeTab) {
      case "realtime":
        return {
          ...baseLayout,
          title: {
            text: `🏥 EEG Live Monitor - ${settings.EFFECTIVE_SAMPLING_FREQ}Hz Display`,
            font: { color: "#e6f7ff", size: 20 },
          },
          xaxis: {
            title: "Time →",
            color: "#cfe8ff",
            showgrid: true,
            gridcolor: "rgba(255,255,255,0.1)",
            range: playing ? [0, settings.WINDOW_POINTS] : undefined,
            fixedrange: playing,
          },
          yaxis: {
            showticklabels: false,
            showgrid: true,
            gridcolor: "rgba(255,255,255,0.05)",
            fixedrange: playing,
          },
        };

      case "polar":
        return {
          ...baseLayout,
          title: {
            text: `🧭 ${CHANNEL_NAMES[selectedChannel]} Polar View - ${selected.length} Features`,
            font: { color: "#e6f7ff", size: 18 },
          },
          polar: {
            bgcolor: "#000000",
            radialaxis: {
              visible: true,
              range: [0, 1 + selected.length * 0.1],
              color: "#cfe8ff",
              gridcolor: "rgba(255,255,255,0.3)",
              tickfont: { color: "#cfe8ff" },
              ticks: "outside",
            },
            angularaxis: {
              color: "#cfe8ff",
              gridcolor: "rgba(255,255,255,0.3)",
              rotation: 90,
              direction: "clockwise",
              tickmode: "array",
              tickvals: [0, 45, 90, 135, 180, 225, 270, 315],
              ticktext: [
                "0°",
                "45°",
                "90°",
                "135°",
                "180°",
                "225°",
                "270°",
                "315°",
              ],
            },
            domain: {
              x: [0.1, 0.9],
              y: [0.1, 0.9],
            },
          },
          showlegend: true,
          legend: {
            x: 1,
            y: 1,
            bgcolor: "rgba(0,0,0,0.7)",
            bordercolor: "#00e6ff",
            borderwidth: 1,
            font: { color: "white" },
          },
        };

      case "xor":
        return {
          ...baseLayout,
          title: {
            text: `⚡ ${CHANNEL_NAMES[selectedChannel]} XOR Analysis - ${selected.length} Features`,
            font: { color: "#e6f7ff", size: 18 },
          },
          xaxis: {
            title: "Time Window",
            color: "#cfe8ff",
            showgrid: true,
            gridcolor: "rgba(255,255,255,0.1)",
            fixedrange: playing,
            range: [0, settings.WINDOW_POINTS],
          },
          yaxis: {
            showticklabels: false,
            showgrid: true,
            gridcolor: "rgba(255,255,255,0.05)",
            fixedrange: playing,
            title: "Accumulated Differences",
          },
          showlegend: true,
          legend: {
            x: 1,
            y: 1,
            bgcolor: "rgba(0,0,0,0.7)",
            bordercolor: "#00e6ff",
            borderwidth: 1,
            font: { color: "white" },
          },
        };

      default:
        return baseLayout;
    }
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: playing ? ["pan2d", "zoom2d", "autoScale2d"] : [],
    displaylogo: false,
    toImageButtonOptions: { format: "png", scale: 2 },
  };

  const settings = getDynamicSettings();

  return (
    <div className="monitor-root">
      <div className="topbar">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "realtime" ? "active" : ""}`}
            onClick={() => setActiveTab("realtime")}
          >
            🏥 Real-time
          </button>
          <button
            className={`tab ${activeTab === "polar" ? "active" : ""}`}
            onClick={() => setActiveTab("polar")}
          >
            🧭 Polar View
          </button>
          <button
            className={`tab ${activeTab === "xor" ? "active" : ""}`}
            onClick={() => setActiveTab("xor")}
          >
            ⚡ XOR View
          </button>
        </div>
        <div className="header-title">19-Channel EEG Multi-View Monitor</div>
        <div className="top-right-info">
          <div className="info-pill">📊 Features: {available.length}</div>
          <div className="info-pill">🎯 Selected: {selected.length}</div>
          <div className="info-pill">⚡ {playing ? "LIVE" : "PAUSED"}</div>
        </div>
      </div>

      <div className="content">
        <aside className="sidebar">
          <div className="sidebar-card">
            <h3> Monitor Controls</h3>

            {error && (
              <div className="error-banner">
                <div className="error-icon">⚠️</div>
                <div className="error-message">{error}</div>
              </div>
            )}

            {loading && (
              <div className="loading-message">Loading features...</div>
            )}

            {/* XOR Controls */}
            {activeTab === "xor" && (
              <div className="xor-controls">
                <h4>⚡ XOR Analysis Settings</h4>
                <div className="control-group">
                  <label>Similarity Threshold:</label>
                  <select
                    value={xorTimeChunk}
                    onChange={(e) => setXorTimeChunk(parseInt(e.target.value))}
                  >
                    <option value={10}>Low (0.05)</option>
                    <option value={32}>Medium (0.1)</option>
                    <option value={64}>High (0.2)</option>
                  </select>
                </div>

                <div className="control-info">
                  Similar signals erase each other. Process stops when data is
                  exhausted.
                </div>
                <div className="completion-status">
                  {selected.filter((name) => xorCompleted[name]).length > 0 && (
                    <div className="completed-count">
                      ✅ {selected.filter((name) => xorCompleted[name]).length}{" "}
                      analysis completed
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="feature-controls">
              <button
                className="small-btn"
                onClick={selectAll}
                disabled={available.length === 0}
              >
                📥 Select All
              </button>
              <button className="small-btn" onClick={deselectAll}>
                🗑️ Deselect All
              </button>
            </div>

            <div className="dropdown-wrapper">
              <div
                className="dropdown-toggler"
                onClick={() => setOpenDropdown(!openDropdown)}
              >
                <span>{openDropdown ? "▼ " : "▶ "} Select EEG Signals</span>
                <span className="caret">{selected.length} active</span>
              </div>

              {openDropdown && (
                <div className="dropdown-list">
                  {available.length === 0 ? (
                    <div className="no-features-message">
                      {loading ? "Loading..." : "No EEG signals available"}
                    </div>
                  ) : (
                    available.map((f) => {
                      const checked = selected.includes(f);

                      return (
                        <label key={f} className="dropdown-item">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFeature(f)}
                            disabled={loading}
                          />
                          <span className="fname">{f}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="controls-row">
              <button
                className={`primary-btn ${playing ? "active" : ""}`}
                onClick={() => setPlaying(true)}
                disabled={selected.length === 0}
              >
                ▶️ Start Live
              </button>
              <button className="primary-btn" onClick={() => setPlaying(false)}>
                ⏸ Pause
              </button>
              <button className="primary-btn" onClick={restart}>
                🔄 Restart
              </button>
            </div>

            <div className="zoom-notice">
              {!playing && (
                <div className="notice-message">
                  🔍 <strong>Zoom Enabled:</strong> Use plot controls to zoom
                  and pan while paused
                </div>
              )}
            </div>

            {/* Channel Selector for Polar and XOR Modes */}
            {(activeTab === "polar" || activeTab === "xor") &&
              selected.length > 0 && (
                <div className="channel-selector">
                  <h4> Channel Selection</h4>
                  <div className="channel-selector-grid">
                    {CHANNEL_NAMES.slice(
                      0,
                      featureData[selected[0]]?.numChannels || 19
                    ).map((channel, index) => (
                      <button
                        key={channel}
                        className={`channel-btn ${
                          selectedChannel === index ? "active" : ""
                        }`}
                        onClick={() => setSelectedChannel(index)}
                        disabled={!selected.length}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                  <div className="current-channel">
                    Selected: <strong>{CHANNEL_NAMES[selectedChannel]}</strong>
                  </div>
                </div>
              )}

            <div className="selected-summary">
              <h4> Active Signals ({selected.length})</h4>
              {selected.length === 0 && (
                <div className="muted">No signals selected</div>
              )}
              {selected.map((name, i) => {
                const info = featureData[name];

                return (
                  <div key={name} className="selected-row">
                    <div
                      className="color-box"
                      style={{
                        background: FEATURE_COLORS[i % FEATURE_COLORS.length],
                      }}
                    />
                    <div className="sel-text">
                      <div className="sel-name">{name}</div>
                      <div className="sel-meta">
                        {info ? `${info.numChannels} channels` : "loading..."}
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() =>
                        setSelected(selected.filter((x) => x !== name))
                      }
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
        <main className="viewer-area">
          <div className="viewer-card hospital-monitor">
            {selected.length > 0 ? (
              <div className="monitor-container">
                <Plot
                  data={getTraces()}
                  layout={getLayout()}
                  config={config}
                  style={{ width: "100%" }}
                />

                {/* Frequency Controls - Directly under viewer */}
                <div className="frequency-controls">
                  <div className="control-section">
                    <h4>🎚️ Sampling Frequency Control</h4>

                    <div className="slider-group">
                      <div className="slider-header">
                        <span>
                          Sampling Frequency:{" "}
                          <strong>{samplingFrequency} Hz</strong>
                        </span>
                        <span className="slider-value">
                          {samplingFrequency} Hz
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="256"
                        value={samplingFrequency}
                        onChange={(e) =>
                          setSamplingFrequency(parseInt(e.target.value))
                        }
                        className="frequency-slider"
                      />
                      <div className="slider-ticks">
                        <span>1Hz</span>
                        <span>64Hz</span>
                        <span>128Hz</span>
                        <span>192Hz</span>
                        <span>256Hz</span>
                      </div>
                    </div>

                    <div className="slider-group">
                      <div className="slider-header">
                        <span>
                          Playback Speed:{" "}
                          <strong>{playbackSpeed.toFixed(1)}x</strong>
                        </span>
                        <span className="slider-value">
                          {playbackSpeed.toFixed(1)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={playbackSpeed}
                        onChange={(e) =>
                          setPlaybackSpeed(parseFloat(e.target.value))
                        }
                        className="speed-slider"
                      />
                      <div className="slider-ticks">
                        <span>0.1x</span>
                        <span>1x</span>
                        <span>2x</span>
                        <span>3x</span>
                        <span>5x</span>
                      </div>
                    </div>

                    <div className="frequency-info">
                      <div className="info-item">
                        <span>Original Sampling:</span>
                        <strong>128 Hz</strong>
                      </div>
                      <div className="info-item">
                        <span>Effective Rate:</span>
                        <strong>
                          {(samplingFrequency * playbackSpeed).toFixed(1)} Hz
                        </strong>
                      </div>
                      <div className="info-item">
                        <span>Window Duration:</span>
                        <strong>
                          {(
                            getDynamicSettings().WINDOW_POINTS /
                            samplingFrequency
                          ).toFixed(1)}
                          s
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="monitor-status">
                  <div className="status-item">
                    <span>📡 Status:</span>
                    <span className={playing ? "status-live" : "status-paused"}>
                      {playing ? "LIVE" : "PAUSED"}
                    </span>
                  </div>
                  <div className="status-item">
                    <span>⏱️ Sampling:</span>
                    <span>{samplingFrequency} Hz</span>
                  </div>
                  <div className="status-item">
                    <span>🎯 Speed:</span>
                    <span>{playbackSpeed.toFixed(1)}x</span>
                  </div>
                  <div className="status-item">
                    <span>⚡ Effective:</span>
                    <span>
                      {(samplingFrequency * playbackSpeed).toFixed(0)} Hz
                    </span>
                  </div>
                  {activeTab === "polar" && (
                    <div className="status-item">
                      <span>📐 Angle:</span>
                      <span>{polarAngle}°</span>
                    </div>
                  )}
                  {activeTab === "xor" && selected.length > 0 && (
                    <div className="status-item">
                      <span>📊 Progress:</span>
                      <span>
                        {xorCompleted[selected[0]]
                          ? "COMPLETED"
                          : `${Math.min(
                              100,
                              Math.floor(
                                (featureData[selected[0]]?.currentIndex /
                                  featureData[selected[0]]?.flattened[
                                    selectedChannel
                                  ]?.length) *
                                  100
                              )
                            )}%`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-data-message">
                <div className="monitor-placeholder">
                  <h3>🏥 EEG Monitor Ready</h3>
                  <p>
                    Select EEG signals from the sidebar to begin live
                    monitoring.
                  </p>
                  <div className="monitor-grid"></div>
                </div>
              </div>
            )}

            {/* Detection Results Panel - Only shown when features are selected */}
            {selected.length > 0 && detectionResults.length > 0 && (
              <div className="detection-results-panel">
                <div className="panel-header">
                  <h4>🧠 AI Detection Results</h4>
                  <div className="panel-subtitle">
                    Real-time condition analysis
                  </div>
                </div>
                <div className="results-list">
                  {detectionResults.map((result, index) => (
                    <div key={result.featureName} className="result-item">
                      <div className="result-header">
                        <span className="feature-name">
                          {result.featureName}
                        </span>
                        <span className="timestamp">{result.timestamp}</span>
                      </div>
                      <div className="result-details">
                        <div className="detection-text">
                          The detection for "
                          <strong>{result.featureName}</strong>" is:
                          <span
                            className="condition-badge"
                            style={{
                              backgroundColor: LABEL_COLORS[result.label],
                            }}
                          >
                            {result.labelName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
