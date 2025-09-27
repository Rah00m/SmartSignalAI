// import React, { useState } from "react";
// import Plot from "react-plotly.js";
// import { useNavigate } from "react-router-dom";
// import { useECG } from "./ecgContext"; // استخدام useECG للوصول إلى البيانات من الـ Context

// // دالة لحساب Recurrence Plot
// function computeRecurrencePlot(signal, threshold) {
//   const N = signal.length;
//   const matrix = Array(N)
//     .fill(null)
//     .map(() => Array(N).fill(0));

//   for (let i = 0; i < N; i++) {
//     for (let j = 0; j < N; j++) {
//       const dist = Math.abs(signal[i] - signal[j]);
//       matrix[i][j] = dist < threshold ? 1 : 0;
//     }
//   }
//   return matrix;
// }

// export default function Mode4() {
//   const navigate = useNavigate();
//   const { ecgData } = useECG(); // استخدام البيانات من الـ Context
//   const [threshold, setThreshold] = useState(0.1);
//   const [windowSize, setWindowSize] = useState(200);

//   // التحقق من وجود بيانات
//   if (!ecgData || (!ecgData.y && !Array.isArray(ecgData))) {
//     return <p>No signal data to plot.</p>;
//   }

//   // استخراج جزء من الإشارة بناءً على windowSize
//   const signal = ecgData.y ? ecgData.y.slice(0, windowSize) : ecgData.slice(0, windowSize);

//   // حساب Recurrence Plot
//   const recurrenceMatrix = computeRecurrencePlot(signal, threshold);

//   return (
//     <div className="mode1-container">
//       <button className="back-button" onClick={() => navigate("/")}>
//         Back
//       </button>

//       <h2 className="mode1-title">Recurrence Plot Visualization</h2>

//       <div className="controls-container">
//         {/* التحكم في threshold */}
//         <div>
//           <label className="control-label">
//             Threshold: {threshold.toFixed(2)}
//             <input
//               type="range"
//               min="0"
//               max="1"
//               step="0.01"
//               value={threshold}
//               onChange={(e) => setThreshold(parseFloat(e.target.value))}
//               className="control-input"
//               style={{ marginTop: 5 }}
//             />
//           </label>
//         </div>

//         {/* التحكم في window size */}
//         <div>
//           <label className="control-label">
//             Window Size:
//             <input
//               type="number"
//               min="10"
//               max={ecgData.y ? ecgData.y.length : ecgData.length}
//               value={windowSize}
//               onChange={(e) => {
//                 let val = Number(e.target.value);
//                 if (val < 10) val = 10;
//                 if (val > (ecgData.y ? ecgData.y.length : ecgData.length))
//                   val = ecgData.y ? ecgData.y.length : ecgData.length;
//                 setWindowSize(val);
//               }}
//               className="control-input"
//               style={{ marginTop: 5 }}
//             />
//           </label>
//         </div>
//       </div>

//       {/* عرض الرسم البياني */}
//       <div className="plot-container">
//         <Plot
//           data={[
//             {
//               z: recurrenceMatrix,
//               type: "heatmap",
//               colorscale: "Greys",
//             },
//           ]}
//           layout={{
//             width: 600,
//             height: 600,
//             title: "Recurrence Plot",
//             xaxis: { title: "Time" },
//             yaxis: { title: "Time" },
//             paper_bgcolor: "#f8fafc",
//             plot_bgcolor: "#f8fafc",
//             font: { color: "black" },
//           }}
//           config={{ responsive: true }}
//         />
//       </div>
//     </div>
//   );
// }



// # This code generates a Recurrence Plot (RP) from an ECG signal segment.
// # 1. Selects a window of the ECG signal.
// # 2. Builds a recurrence matrix where each entry compares two samples (i, j).
// #    - If |x_i - x_j| < threshold → mark as 1 (similar, white dot).
// #    - Else → mark as 0 (not similar, black dot).
// # 3. Plots the recurrence matrix as a grayscale heatmap.
// #    - X-axis = time (sample i)
// #    - Y-axis = time (sample j)
// #    - Main diagonal is always white (each point is similar to itself).

import React, { useState } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";

// دالة لحساب Recurrence Plot
function computeRecurrencePlot(signal, threshold) {
  const N = signal.length;
  const matrix = Array(N)
    .fill(null)
    .map(() => Array(N).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const dist = Math.abs(signal[i] - signal[j]);
      matrix[i][j] = dist < threshold ? 1 : 0;
    }
  }
  return matrix;
}

// دالة تحسب Threshold أوتوماتيك من الإشارة
function computeAdaptiveThreshold(signal) {
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const variance =
    signal.reduce((a, b) => a + (b - mean) ** 2, 0) / signal.length;
  const stdDev = Math.sqrt(variance);

  return 0.1 * stdDev; // نخلي threshold = 10% من الانحراف المعياري
}

export default function Mode4() {
  const navigate = useNavigate();
  const { ecgData } = useECG();
  const [threshold, setThreshold] = useState(0.1);
  const [windowSize, setWindowSize] = useState(200);
  const [useAdaptive, setUseAdaptive] = useState(true);

  if (!ecgData || !Array.isArray(ecgData.y) || ecgData.y.length === 0) {
    return <p>No signal data to plot.</p>;
  }

  const signal = ecgData.y.slice(0, windowSize);

  // نحسب threshold حسب الاختيار
  const appliedThreshold = useAdaptive
    ? computeAdaptiveThreshold(signal)
    : threshold;

  const recurrenceMatrix = computeRecurrencePlot(signal, appliedThreshold);

  const plotData = [
    {
      z: recurrenceMatrix,
      type: "heatmap",
      colorscale: "Greys",
    },
  ];

  const plotLayout = {
    width: 600,
    height: 600,
    title: "Recurrence Plot",
    xaxis: { title: "Time (samples)" },
    yaxis: { title: "Time (samples)" },
    paper_bgcolor: "#f8fafc",
    plot_bgcolor: "#f8fafc",
    font: { color: "black" },
  };

  return (
    <div className="mode1-container">
      <button className="back-button" onClick={() => navigate("/")}>
        Back
      </button>

      <h2 className="mode1-title">Mode 4: Recurrence Plot Visualization</h2>

      <div className="mode1-flex">
        <div className="controls-container">
          {/* اختيار Adaptive أو Manual */}
          <div>
            <label>
              <input
                type="checkbox"
                checked={useAdaptive}
                onChange={() => setUseAdaptive(!useAdaptive)}
              />
              Use Adaptive Threshold
            </label>
          </div>

          {/* التحكم في Threshold لو Manual */}
          {!useAdaptive && (
            <div>
              <label className="control-label">
                Threshold: {threshold.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="control-input"
              />
            </div>
          )}

          <div>
            <label className="control-label">
              Window Size:
              <input
                type="number"
                min="10"
                max={ecgData.y.length}
                value={windowSize}
                onChange={(e) => {
                  let val = Number(e.target.value);
                  if (val < 10) val = 10;
                  if (val > ecgData.y.length) val = ecgData.y.length;
                  setWindowSize(val);
                }}
                className="control-input"
              />
            </label>
          </div>
        </div>

        <div className="plot-container">
          <Plot
            data={plotData}
            layout={plotLayout}
            config={{ responsive: true }}
          />
        </div>
      </div>
    </div>
  );
}
