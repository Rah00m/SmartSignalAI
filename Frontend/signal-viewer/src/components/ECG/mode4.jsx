// import React, { useState, useEffect } from "react";
// import Plot from "react-plotly.js";
// import { useNavigate } from "react-router-dom";
// import { useECG } from "./ecgContext";
// import "./mode4.css";

// function computeRecurrencePlot(signal1, signal2, threshold) {
//   const N = signal1.length;

//   const normalize = (arr) => {
//     const min = Math.min(...arr);
//     const max = Math.max(...arr);
//     const range = max - min;
//     if (range === 0) return arr.map(() => 0.5);
//     return arr.map((val) => (val - min) / range);
//   };

//   const norm1 = normalize(signal1);
//   const norm2 = normalize(signal2);

//   const matrix = Array(N)
//     .fill(null)
//     .map(() => Array(N).fill(0));

//   let similarCount = 0;

//   for (let i = 0; i < N; i++) {
//     for (let j = 0; j < N; j++) {
//       const dist = Math.abs(norm1[i] - norm2[j]);
//       matrix[i][j] = dist <= threshold ? 1 : 0;
//       if (matrix[i][j] === 1) similarCount++;
//     }
//   }

//   console.log(
//     `✅ Recurrence Plot: ${similarCount}/${N * N} similar points (${(
//       (similarCount / (N * N)) *
//       100
//     ).toFixed(1)}%)`
//   );

//   return matrix;
// }

// function computeAdaptiveThreshold(signal1, signal2) {
//   const mean1 = signal1.reduce((a, b) => a + b, 0) / signal1.length;
//   const mean2 = signal2.reduce((a, b) => a + b, 0) / signal2.length;

//   const variance1 =
//     signal1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / signal1.length;
//   const variance2 =
//     signal2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / signal2.length;

//   const std1 = Math.sqrt(variance1);
//   const std2 = Math.sqrt(variance2);

//   return ((std1 + std2) / 2) * 0.1;
// }

// export default function Mode4() {
//   const navigate = useNavigate();
//   const { selectedPatient, selectedRecording, length, offset } = useECG();

//   const [threshold, setThreshold] = useState(0.1);
//   const [windowSize, setWindowSize] = useState(200);
//   const [useAdaptive, setUseAdaptive] = useState(true);
//   const [channel1, setChannel1] = useState("i");
//   const [channel2, setChannel2] = useState("ii");
//   const [loading, setLoading] = useState(false);
//   const [signalsData, setSignalsData] = useState(null);
//   const [error, setError] = useState("");

//   const fetchSignals = async () => {
//     if (!selectedPatient || !selectedRecording) return;

//     setLoading(true);
//     setError("");

//     try {
//       const channelsParam = `${channel1},${channel2}`;

//       const apiUrl = `${
//         import.meta.env.VITE_API_URL
//       }/ecg/mode4/signal?patient=${selectedPatient}&recording=${selectedRecording}&channels=${channelsParam}&offset=${offset}&length=${length}`;

//       console.log("🔄 Fetching signals from:", apiUrl);

//       const response = await fetch(apiUrl);
//       const jsonData = await response.json();

//       if (response.ok && jsonData.signals) {
//         console.log("✅ Signals data received:", jsonData.signals);
//         console.log(
//           "📊 Channel 1 data length:",
//           jsonData.signals[channel1]?.length
//         );
//         console.log(
//           "📊 Channel 2 data length:",
//           jsonData.signals[channel2]?.length
//         );
//         setSignalsData(jsonData);
//       } else {
//         setError(jsonData.error || "Failed to fetch signals data");
//         setSignalsData(null);
//       }
//     } catch (error) {
//       console.error("💥 Error fetching signals:", error);
//       setError("Network error - Could not connect to server");
//       setSignalsData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedPatient && selectedRecording) {
//       fetchSignals();
//     }
//   }, [channel1, channel2, selectedPatient, selectedRecording, length, offset]);

//   let recurrenceMatrix = [];
//   let plotData = [];
//   let plotLayout = {};
//   let signal1 = [];
//   let signal2 = [];

//   if (
//     signalsData &&
//     signalsData.signals &&
//     signalsData.signals[channel1] &&
//     signalsData.signals[channel2] &&
//     signalsData.signals[channel1].length > 0 &&
//     signalsData.signals[channel2].length > 0
//   ) {
//     signal1 = signalsData.signals[channel1].slice(0, windowSize);
//     signal2 = signalsData.signals[channel2].slice(0, windowSize);

//     console.log("🔍 Processing signals:", {
//       channel1,
//       channel2,
//       signal1Length: signal1.length,
//       signal2Length: signal2.length,
//       signal1Sample: signal1.slice(0, 5),
//       signal2Sample: signal2.slice(0, 5),
//     });

//     const minLength = Math.min(signal1.length, signal2.length);
//     const trimmedSignal1 = signal1.slice(0, minLength);
//     const trimmedSignal2 = signal2.slice(0, minLength);

//     const appliedThreshold = useAdaptive
//       ? computeAdaptiveThreshold(trimmedSignal1, trimmedSignal2)
//       : threshold;

//     console.log("🔄 Computing recurrence plot...");
//     console.log("Trimmed Signal 1 length:", trimmedSignal1.length);
//     console.log("Trimmed Signal 2 length:", trimmedSignal2.length);
//     console.log("Applied threshold:", appliedThreshold);

//     recurrenceMatrix = computeRecurrencePlot(
//       trimmedSignal1,
//       trimmedSignal2,
//       appliedThreshold
//     );

//     plotData = [
//       {
//         z: recurrenceMatrix,
//         type: "heatmap",
//         colorscale: [
//           [0, "black"],
//           [1, "white"],
//         ],
//         showscale: false,
//       },
//     ];

//     plotLayout = {
//       width: 600,
//       height: 600,
//       title: {
//         text: `Recurrence Plot: ${channel1.toUpperCase()} vs ${channel2.toUpperCase()}`,
//         font: { size: 18, color: "white" },
//       },
//       xaxis: {
//         title: {
//           text: `Time (${channel2.toUpperCase()})`,
//           font: { color: "white" },
//         },
//         tickfont: { color: "white" },
//         gridcolor: "#666",
//         showline: true,
//         linecolor: "white",
//       },
//       yaxis: {
//         title: {
//           text: `Time (${channel1.toUpperCase()})`,
//           font: { color: "white" },
//         },
//         tickfont: { color: "white" },
//         gridcolor: "#666",
//         showline: true,
//         linecolor: "white",
//       },
//       paper_bgcolor: "#1f2937",
//       plot_bgcolor: "#111827",
//       font: { color: "white" },
//       margin: { t: 60, r: 40, b: 60, l: 60 },
//     };
//   }

//   return (
//     <div className="mode4-container">
//       <div className="mode4-header">
//         <button className="mode4-back-button" onClick={() => navigate("/")}>
//           🏠 Back to Home
//         </button>
//         <h1 className="mode4-title">🔄 Mode 4 - Recurrence Plot</h1>
//       </div>

//       {/* معلومات المريض */}
//       <div className="mode4-patient-info">
//         <div className="mode4-patient-item">
//           <div className="mode4-patient-label">Patient</div>
//           <div className="mode4-patient-value">
//             {selectedPatient || "Not selected"}
//           </div>
//         </div>
//         <div className="mode4-patient-item">
//           <div className="mode4-patient-label">Recording</div>
//           <div className="mode4-patient-value">
//             {selectedRecording || "Not selected"}
//           </div>
//         </div>
//         <div className="mode4-patient-item">
//           <div className="mode4-patient-label">Length</div>
//           <div className="mode4-patient-value">{length} samples</div>
//         </div>
//         <div className="mode4-patient-item">
//           <div className="mode4-patient-label">Offset</div>
//           <div className="mode4-patient-value">{offset} samples</div>
//         </div>
//       </div>

//       {(!selectedPatient || !selectedRecording) && (
//         <div className="mode4-warning">
//           ⚠️ Please select patient and recording from Home page
//         </div>
//       )}

//       <div className="mode4-content">
//         {/* لوحة التحكم */}
//         <div className="mode4-controls-panel">
//           <h3 className="mode4-controls-title">🎯 Channel Configuration</h3>

//           {/* اختيار القنوات */}
//           <div className="mode4-channel-group">
//             <label className="mode4-channel-label">📡 Channel 1 (Y-axis)</label>
//             <select
//               className="mode4-channel-select"
//               value={channel1}
//               onChange={(e) => setChannel1(e.target.value)}
//               disabled={!selectedPatient || !selectedRecording}
//             >
//               <option value="i">I</option>
//               <option value="ii">II</option>
//               <option value="iii">III</option>
//               <option value="avr">aVR</option>
//               <option value="avl">aVL</option>
//               <option value="avf">aVF</option>
//               <option value="v1">V1</option>
//               <option value="v2">V2</option>
//               <option value="v3">V3</option>
//               <option value="v4">V4</option>
//               <option value="v5">V5</option>
//               <option value="v6">V6</option>
//             </select>
//           </div>

//           <div className="mode4-channel-group">
//             <label className="mode4-channel-label">📡 Channel 2 (X-axis)</label>
//             <select
//               className="mode4-channel-select"
//               value={channel2}
//               onChange={(e) => setChannel2(e.target.value)}
//               disabled={!selectedPatient || !selectedRecording}
//             >
//               <option value="i">I</option>
//               <option value="ii">II</option>
//               <option value="iii">III</option>
//               <option value="avr">aVR</option>
//               <option value="avl">aVL</option>
//               <option value="avf">aVF</option>
//               <option value="v1">V1</option>
//               <option value="v2">V2</option>
//               <option value="v3">V3</option>
//               <option value="v4">V4</option>
//               <option value="v5">V5</option>
//               <option value="v6">V6</option>
//             </select>
//           </div>

//           {/* إعدادات Recurrence Plot */}
//           <div className="mode4-settings-group">
//             <label className="mode4-setting-label">
//               <input
//                 type="checkbox"
//                 checked={useAdaptive}
//                 onChange={() => setUseAdaptive(!useAdaptive)}
//                 style={{ marginRight: "8px" }}
//               />
//               🔧 Use Adaptive Threshold
//             </label>
//           </div>

//           {/* التحكم في Threshold لو Manual */}
//           {!useAdaptive && (
//             <div className="mode4-settings-group">
//               <label className="mode4-setting-label">
//                 🎚️ Threshold: {threshold.toFixed(3)}
//               </label>
//               <input
//                 type="range"
//                 min="0"
//                 max="0.5"
//                 step="0.001"
//                 value={threshold}
//                 onChange={(e) => setThreshold(parseFloat(e.target.value))}
//                 className="mode4-setting-input"
//               />
//             </div>
//           )}

//           <div className="mode4-settings-group">
//             <label className="mode4-setting-label">📏 Window Size</label>
//             <input
//               type="number"
//               min="10"
//               max="500"
//               value={windowSize}
//               onChange={(e) => {
//                 let val = Number(e.target.value);
//                 if (val < 10) val = 10;
//                 if (val > 500) val = 500;
//                 setWindowSize(val);
//               }}
//               className="mode4-setting-input"
//             />
//             <p className="mode4-hint-text">
//               Number of samples to compare (10-500)
//             </p>
//           </div>

//           {/* زر إعادة جلب البيانات */}
//           <button
//             className="mode4-update-button"
//             onClick={fetchSignals}
//             disabled={!selectedPatient || !selectedRecording || loading}
//           >
//             {loading ? "🔄 Loading..." : "📥 Refresh Signals"}
//           </button>

//           {/* معلومات الإشارات */}
//           {signalsData && signalsData.signals && (
//             <div className="mode4-signal-info">
//               <h4 className="mode4-signal-title">📊 Signal Information</h4>
//               <div className="mode4-channel-info">
//                 <span className="mode4-channel-name">
//                   {channel1.toUpperCase()}
//                 </span>
//                 <span className="mode4-channel-samples">
//                   {signalsData.signals[channel1]?.length || 0} samples
//                 </span>
//               </div>
//               <div className="mode4-channel-info">
//                 <span className="mode4-channel-name">
//                   {channel2.toUpperCase()}
//                 </span>
//                 <span className="mode4-channel-samples">
//                   {signalsData.signals[channel2]?.length || 0} samples
//                 </span>
//               </div>
//               {useAdaptive && signal1.length > 0 && signal2.length > 0 && (
//                 <div className="mode4-channel-info">
//                   <span className="mode4-channel-name">Adaptive Threshold</span>
//                   <span className="mode4-channel-samples">
//                     {computeAdaptiveThreshold(signal1, signal2).toFixed(4)}
//                   </span>
//                 </div>
//               )}

//               {signalsData.diagnosis &&
//                 signalsData.diagnosis !== "No diagnosis found" && (
//                   <div className="mode4-diagnosis-box">
//                     <h4 className="mode4-diagnosis-title">🏥 Diagnosis</h4>
//                     <p className="mode4-diagnosis-text">
//                       {signalsData.diagnosis}
//                     </p>
//                   </div>
//                 )}
//             </div>
//           )}
//         </div>

//         {/* منطقة الرسم */}
//         <div className="mode4-plot-container">
//           {loading && (
//             <div className="mode4-loading-container">
//               <div className="mode4-spinner"></div>
//               <p className="mode4-loading-text">Loading ECG signals...</p>
//             </div>
//           )}

//           {error && (
//             <div className="mode4-error-container">
//               <p className="mode4-error-text">❌ {error}</p>
//               <button className="mode4-retry-button" onClick={fetchSignals}>
//                 🔄 Retry
//               </button>
//             </div>
//           )}

//           {!selectedPatient || !selectedRecording ? (
//             <div className="mode4-placeholder-container">
//               <p className="mode4-placeholder-text">
//                 👈 Please select patient and recording from Home page
//               </p>
//               <p className="mode4-placeholder-text">
//                 Then choose two channels to compare
//               </p>
//             </div>
//           ) : !signalsData || !signalsData.signals ? (
//             <div className="mode4-placeholder-container">
//               <p className="mode4-placeholder-text">
//                 📡 No signals data loaded
//               </p>
//               <p className="mode4-placeholder-text">
//                 Click "Refresh Signals" to load data
//               </p>
//             </div>
//           ) : signalsData.signals[channel1] &&
//             signalsData.signals[channel2] &&
//             signalsData.signals[channel1].length > 0 &&
//             signalsData.signals[channel2].length > 0 ? (
//             <div className="mode4-plot-wrapper">
//               <Plot
//                 data={plotData}
//                 layout={plotLayout}
//                 config={{
//                   displayModeBar: true,
//                   displaylogo: false,
//                   modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
//                   responsive: true,
//                 }}
//               />

//               {/* تفسير الرسم */}
//               <div className="mode4-explanation">
//                 <h4 className="mode4-explanation-title">
//                   🔍 How to read this plot:
//                 </h4>
//                 <ul className="mode4-explanation-list">
//                   <li className="mode4-explanation-item">
//                     <span className="mode4-explanation-strong">White dots</span>{" "}
//                     show where the two signals are similar
//                   </li>
//                   <li className="mode4-explanation-item">
//                     <span className="mode4-explanation-strong">
//                       Black areas
//                     </span>{" "}
//                     show where they are different
//                   </li>
//                   <li className="mode4-explanation-item">
//                     <span className="mode4-explanation-strong">
//                       Diagonal patterns
//                     </span>{" "}
//                     indicate recurring patterns between channels
//                   </li>
//                   <li className="mode4-explanation-item">
//                     <span className="mode4-explanation-strong">Y-axis</span>:{" "}
//                     {channel1.toUpperCase()} signal
//                   </li>
//                   <li className="mode4-explanation-item">
//                     <span className="mode4-explanation-strong">X-axis</span>:{" "}
//                     {channel2.toUpperCase()} signal
//                   </li>
//                 </ul>
//               </div>
//             </div>
//           ) : (
//             <div className="mode4-placeholder-container">
//               <p className="mode4-placeholder-text">
//                 ❌ No valid signal data available for selected channels
//               </p>
//               <p className="mode4-placeholder-text">
//                 Available channels:{" "}
//                 {signalsData.channels
//                   ? signalsData.channels.join(", ")
//                   : "None"}
//               </p>
//               <p className="mode4-placeholder-text">
//                 Please check if the channels contain data and try different
//                 channels
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode4.css";

function createCumulativeScatterPlot(
  signal1,
  signal2,
  chunkSize,
  currentChunk
) {
  const startIndex = currentChunk * chunkSize;
  const endIndex = startIndex + chunkSize;

  const minLength = Math.min(signal1.length, signal2.length);
  const actualEndIndex = Math.min(endIndex, minLength);

  const scatterData = [];
  for (let i = 0; i < actualEndIndex; i++) {
    scatterData.push({
      x: signal2[i],
      y: signal1[i],
    });
  }

  console.log(
    `📊 Cumulative Scatter: ${scatterData.length} points (chunk ${
      currentChunk + 1
    })`
  );
  return scatterData;
}

function calculateCorrelation(signal1, signal2) {
  if (signal1.length !== signal2.length || signal1.length === 0) return 0;

  const n = signal1.length;
  const mean1 = signal1.reduce((a, b) => a + b, 0) / n;
  const mean2 = signal2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < n; i++) {
    numerator += (signal1[i] - mean1) * (signal2[i] - mean2);
    denom1 += Math.pow(signal1[i] - mean1, 2);
    denom2 += Math.pow(signal2[i] - mean2, 2);
  }

  if (denom1 === 0 || denom2 === 0) return 0;
  return numerator / Math.sqrt(denom1 * denom2);
}

export default function Mode4() {
  const navigate = useNavigate();
  const { selectedPatient, selectedRecording, length, offset } = useECG();

  const [chunkSize, setChunkSize] = useState(500);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [colorMap, setColorMap] = useState("Viridis");
  const [pointSize, setPointSize] = useState(3);
  const [opacity, setOpacity] = useState(0.7);
  const [channel1, setChannel1] = useState("i");
  const [channel2, setChannel2] = useState("ii");
  const [loading, setLoading] = useState(false);
  const [signalsData, setSignalsData] = useState(null);
  const [error, setError] = useState("");

  const fetchSignals = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    setError("");
    setCurrentChunk(0);

    try {
      const channelsParam = `${channel1},${channel2}`;
      const effectiveLength = 2000;
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode4/signal?patient=${selectedPatient}&recording=${selectedRecording}&channels=${channelsParam}&offset=${offset}&length=${effectiveLength}`;
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

  let scatterData = [];
  let plotData = [];
  let plotLayout = {};
  let totalChunks = 0;
  let correlation = 0;

  if (
    signalsData &&
    signalsData.signals &&
    signalsData.signals[channel1] &&
    signalsData.signals[channel2] &&
    signalsData.signals[channel1].length > 0 &&
    signalsData.signals[channel2].length > 0
  ) {
    const signal1 = signalsData.signals[channel1];
    const signal2 = signalsData.signals[channel2];

    const minLength = Math.min(signal1.length, signal2.length);
    totalChunks = Math.ceil(minLength / chunkSize);

    const safeCurrentChunk = Math.min(currentChunk, totalChunks - 1);

    console.log("🔍 Creating scatter plot:", {
      channel1,
      channel2,
      signal1Length: signal1.length,
      signal2Length: signal2.length,
      chunkSize,
      currentChunk: safeCurrentChunk,
      totalChunks,
    });

    scatterData = createCumulativeScatterPlot(
      signal1,
      signal2,
      chunkSize,
      safeCurrentChunk
    );
    correlation = calculateCorrelation(
      signal1.slice(0, (safeCurrentChunk + 1) * chunkSize),
      signal2.slice(0, (safeCurrentChunk + 1) * chunkSize)
    );

    const colorScales = {
      Viridis: [
        [0, "#440154"],
        [0.2, "#31688e"],
        [0.4, "#35b779"],
        [0.6, "#90d743"],
        [0.8, "#fde725"],
        [1, "#fde725"],
      ],
      Plasma: [
        [0, "#0d0887"],
        [0.2, "#7e03a8"],
        [0.4, "#cc4778"],
        [0.6, "#ed7953"],
        [0.8, "#fb9f3a"],
        [1, "#f0f921"],
      ],
      Hot: [
        [0, "#000000"],
        [0.2, "#ff0000"],
        [0.5, "#ffff00"],
        [0.8, "#ffff80"],
        [1, "#ffffff"],
      ],
      Cool: [
        [0, "#00ffff"],
        [0.5, "#ff00ff"],
        [1, "#ffffff"],
      ],
      Rainbow: [
        [0, "#ff0000"],
        [0.2, "#ffff00"],
        [0.4, "#00ff00"],
        [0.6, "#00ffff"],
        [0.8, "#0000ff"],
        [1, "#ff00ff"],
      ],
    };

    plotData = [
      {
        x: scatterData.map((point) => point.x),
        y: scatterData.map((point) => point.y),
        type: "scatter",
        mode: "markers",
        marker: {
          size: pointSize,
          color: scatterData.map((_, index) => index),
          colorscale: colorScales[colorMap] || colorScales.Viridis,
          opacity: opacity,
          showscale: true,
          colorbar: {
            title: "Time Index",
            titleside: "right",
          },
        },
        name: `${channel1.toUpperCase()} vs ${channel2.toUpperCase()}`,
      },
    ];

    plotLayout = {
      width: 700,
      height: 600,
      title: {
        text: `Cumulative Scatter Plot: ${channel1.toUpperCase()} vs ${channel2.toUpperCase()}<br>Chunk ${
          safeCurrentChunk + 1
        }/${totalChunks} | Correlation: ${correlation.toFixed(3)}`,
        font: { size: 16, color: "white" },
      },
      xaxis: {
        title: {
          text: `Signal Value (${channel2.toUpperCase()})`,
          font: { color: "white" },
        },
        tickfont: { color: "white" },
        gridcolor: "#666",
        showline: true,
        linecolor: "white",
        zeroline: true,
        zerolinecolor: "#888",
      },
      yaxis: {
        title: {
          text: `Signal Value (${channel1.toUpperCase()})`,
          font: { color: "white" },
        },
        tickfont: { color: "white" },
        gridcolor: "#666",
        showline: true,
        linecolor: "white",
        zeroline: true,
        zerolinecolor: "#888",
      },
      paper_bgcolor: "#1f2937",
      plot_bgcolor: "#111827",
      font: { color: "white" },
      margin: { t: 80, r: 60, b: 60, l: 60 },
      showlegend: false,
    };
  }

  const handleNextChunk = () => {
    if (currentChunk < totalChunks - 1) {
      setCurrentChunk(currentChunk + 1);
    }
  };

  const handlePrevChunk = () => {
    if (currentChunk > 0) {
      setCurrentChunk(currentChunk - 1);
    }
  };

  const handleChunkSizeChange = (newSize) => {
    setChunkSize(newSize);
    setCurrentChunk(0);
  };

  return (
    <div className="mode4-container">
      <div className="mode4-header">
        <button className="mode4-back-button" onClick={() => navigate("/ecg")}>
          🏠 Back to Home
        </button>
        <h1 className="mode4-title">📊 Mode 4 - Cumulative Scatter Plot</h1>
      </div>

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
        <div className="mode4-controls-panel">
          <h3 className="mode4-controls-title">🎯 Channel Configuration</h3>

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

          <div className="mode4-settings-group">
            <label className="mode4-setting-label">🎨 Color Map</label>
            <select
              className="mode4-setting-select"
              value={colorMap}
              onChange={(e) => setColorMap(e.target.value)}
            >
              <option value="Viridis">Viridis</option>
              <option value="Plasma">Plasma</option>
              <option value="Hot">Hot</option>
              <option value="Cool">Cool</option>
              <option value="Rainbow">Rainbow</option>
            </select>
          </div>

          <div className="mode4-settings-group">
            <label className="mode4-setting-label">
              ⚪ Point Size: {pointSize}px
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={pointSize}
              onChange={(e) => setPointSize(parseFloat(e.target.value))}
              className="mode4-setting-input"
            />
          </div>

          <div className="mode4-settings-group">
            <label className="mode4-setting-label">
              🔍 Opacity: {opacity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="mode4-setting-input"
            />
          </div>

          <div className="mode4-settings-group">
            <label className="mode4-setting-label">⏱️ Chunk Size</label>
            <select
              className="mode4-setting-select"
              value={chunkSize}
              onChange={(e) => handleChunkSizeChange(Number(e.target.value))}
            >
              <option value={100}>100 samples</option>
              <option value={500}>500 samples</option>
              <option value={1500}>1500 samples</option>
              <option value={2000}>2000 samples</option>
            </select>
            <p className="mode4-hint-text">Data points per time chunk</p>
          </div>

          {totalChunks > 1 && (
            <div className="mode4-chunk-controls">
              <label className="mode4-setting-label">🔄 Time Chunks</label>
              <div className="mode4-chunk-buttons">
                <button
                  className="mode4-chunk-button"
                  onClick={handlePrevChunk}
                  disabled={currentChunk === 0}
                >
                  ◀ Previous
                </button>
                <span className="mode4-chunk-info">
                  {currentChunk + 1} / {totalChunks}
                </span>
                <button
                  className="mode4-chunk-button"
                  onClick={handleNextChunk}
                  disabled={currentChunk >= totalChunks - 1}
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}

          <button
            className="mode4-update-button"
            onClick={fetchSignals}
            disabled={!selectedPatient || !selectedRecording || loading}
          >
            {loading ? "🔄 Loading..." : "📥 Refresh Signals"}
          </button>

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
              <div className="mode4-channel-info">
                <span className="mode4-channel-name">Correlation</span>
                <span className="mode4-channel-samples">
                  {correlation.toFixed(4)}
                </span>
              </div>

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

              <div className="mode4-explanation">
                <h4 className="mode4-explanation-title">
                  🔍 How to read this plot:
                </h4>
                <ul className="mode4-explanation-list">
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">Each point</span>{" "}
                    represents simultaneous values from both channels
                  </li>
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">X-axis</span>:{" "}
                    {channel2.toUpperCase()} signal value
                  </li>
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">Y-axis</span>:{" "}
                    {channel1.toUpperCase()} signal value
                  </li>
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">Color</span>{" "}
                    shows temporal sequence (blue → yellow)
                  </li>
                  <li className="mode4-explanation-item">
                    <span className="mode4-explanation-strong">
                      Correlation
                    </span>
                    : {correlation.toFixed(3)} - measures relationship strength
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
