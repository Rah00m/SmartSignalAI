import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode2.css";

export default function Mode2() {
  const navigate = useNavigate();
  const { selectedPatient, selectedRecording } = useECG();

  const [channel, setChannel] = useState("ii");
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState("");
  const [threshold, setThreshold] = useState(0.05);
  const [selectedAbnormalBeat, setSelectedAbnormalBeat] = useState(null);

  const fetchAnalysis = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    setError("");
    setAnalysisData(null);
    setSelectedAbnormalBeat(null);

    try {
      const apiUrl = `http://127.0.0.1:8000/ecg/mode2/analyze-optimized?patient=${selectedPatient}&recording=${selectedRecording}&channel=${channel}&threshold=${threshold}&max_beats=100`;
      console.log("🔄 Fetching Mode 2 analysis:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();

      if (jsonData.analysis_summary) {
        console.log("✅ Mode 2 analysis received:", jsonData);

        if (jsonData.abnormal_beats) {
          const beatsWithSignal = jsonData.abnormal_beats.filter(
            (beat) =>
              beat.signal &&
              Array.isArray(beat.signal) &&
              beat.signal.length > 0
          );
          jsonData.abnormal_beats = beatsWithSignal;
          console.log(
            `✅ Filtered ${beatsWithSignal.length} beats with valid signal`
          );
        }

        setAnalysisData(jsonData);

        if (jsonData.abnormal_beats && jsonData.abnormal_beats.length > 0) {
          setSelectedAbnormalBeat(jsonData.abnormal_beats[0]);
        }
      } else {
        console.error("❌ API Error:", jsonData.error);
        setError(jsonData.error || "Invalid analysis data received");
      }
    } catch (error) {
      console.error("💥 Error fetching analysis:", error);
      setError(error.message || "Network error - Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const renderAbnormalBeatWithQRST = (beat) => {
    if (
      !beat ||
      !beat.signal ||
      !Array.isArray(beat.signal) ||
      beat.signal.length === 0
    ) {
      return (
        <div className="mode2-no-signal">
          <p>📭 No signal data available for this beat</p>
        </div>
      );
    }

    const signal = beat.signal;
    const xValues = Array.from({ length: signal.length }, (_, i) => i);
    const fiducialPoints = beat.fiducial_points || {};

    const plotData = [
      {
        x: xValues,
        y: signal,
        mode: "lines",
        type: "scatter",
        name: "ECG Signal",
        line: { color: "#FF6B6B", width: 3 },
        hoverinfo: "x+y",
      },
    ];

    const addPointIfExists = (pointKey, pointName, color, symbol, size) => {
      if (
        fiducialPoints[pointKey] !== undefined &&
        fiducialPoints[pointKey] !== null
      ) {
        const pointIndex = fiducialPoints[pointKey];
        if (pointIndex >= 0 && pointIndex < signal.length) {
          plotData.push({
            x: [pointIndex],
            y: [signal[pointIndex]],
            mode: "markers",
            name: pointName,
            marker: {
              color: color,
              size: size,
              symbol: symbol,
              line: { color: "white", width: 1 },
            },
            hoverinfo: "text",
            text: [
              `${pointName}: Sample ${pointIndex} (Value: ${signal[
                pointIndex
              ].toFixed(4)})`,
            ],
          });
          return true;
        }
      }
      return false;
    };

    addPointIfExists("Q_Point", "Q Point", "#4ECDC4", "circle", 8);
    addPointIfExists("R_Peak", "R Peak", "#FF6B6B", "star", 12);
    addPointIfExists("S_Point", "S Point", "#45B7D1", "circle", 8);
    addPointIfExists("T_Peak", "T Peak", "#FFA726", "diamond", 10);
    addPointIfExists("P_Peak", "P Peak", "#9C27B0", "circle", 8);

    const annotations = [];

    const addAnnotationIfExists = (pointKey, text, color, ayOffset) => {
      if (
        fiducialPoints[pointKey] !== undefined &&
        fiducialPoints[pointKey] !== null
      ) {
        const pointIndex = fiducialPoints[pointKey];
        if (pointIndex >= 0 && pointIndex < signal.length) {
          annotations.push({
            x: pointIndex,
            y: signal[pointIndex],
            text: text,
            showarrow: true,
            arrowhead: 7,
            ax: 0,
            ay: ayOffset,
            bgcolor: color,
            font: { color: "white", size: 12 },
            bordercolor: color,
            borderwidth: 2,
            borderpad: 4,
          });
        }
      }
    };

    addAnnotationIfExists("Q_Point", "Q", "#4ECDC4", -30);
    addAnnotationIfExists("R_Peak", "R", "#FF6B6B", -40);
    addAnnotationIfExists("S_Point", "S", "#45B7D1", 30);
    addAnnotationIfExists("T_Peak", "T", "#FFA726", -30);
    addAnnotationIfExists("P_Peak", "P", "#9C27B0", -35);

    const plotLayout = {
      title: {
        text: `🚨 Abnormal Beat #${beat.beat_index} - Difference: ${
          beat.difference_score?.toFixed(3) || "N/A"
        }`,
        font: { size: 18, color: "white" },
      },
      xaxis: {
        title: {
          text: "Time (samples)",
          font: { color: "white", size: 12 },
        },
        color: "white",
        gridcolor: "#444",
        showline: true,
        linecolor: "white",
        zeroline: false,
        showgrid: true,
      },
      yaxis: {
        title: {
          text: "Amplitude (normalized)",
          font: { color: "white", size: 12 },
        },
        color: "white",
        gridcolor: "#444",
        showline: true,
        linecolor: "white",
        zeroline: true,
        zerolinecolor: "#666",
        zerolinewidth: 1,
        showgrid: true,
      },
      paper_bgcolor: "#1f2937",
      plot_bgcolor: "#111827",
      width: 700,
      height: 500,
      margin: { t: 80, r: 50, b: 80, l: 80 },
      annotations: annotations,
      showlegend: true,
      legend: {
        x: 1.05,
        y: 1,
        font: { color: "white" },
        bgcolor: "rgba(0,0,0,0.5)",
        bordercolor: "#666",
        borderwidth: 1,
      },
      hovermode: "closest",
    };

    return (
      <div className="mode2-beat-with-qrst">
        <Plot
          data={plotData}
          layout={plotLayout}
          config={{
            displayModeBar: true,
            displaylogo: false,
            responsive: true,
            modeBarButtonsToRemove: ["pan2d", "select2d", "lasso2d"],
            displayModeBarButtons: {
              hoverClosestGl2d: true,
              hoverClosestCartesian: true,
            },
          }}
        />

        {/* مفتاح الألوان للنقاط الأساسية */}
        <div className="mode2-legend">
          <h4>🎯 Fiducial Points Legend:</h4>
          <div className="mode2-legend-items">
            <div className="mode2-legend-item">
              <span
                className="mode2-legend-color"
                style={{ backgroundColor: "#4ECDC4" }}
              ></span>
              <span>Q Point</span>
            </div>
            <div className="mode2-legend-item">
              <span
                className="mode2-legend-color"
                style={{ backgroundColor: "#FF6B6B" }}
              ></span>
              <span>R Peak</span>
            </div>
            <div className="mode2-legend-item">
              <span
                className="mode2-legend-color"
                style={{ backgroundColor: "#45B7D1" }}
              ></span>
              <span>S Point</span>
            </div>
            <div className="mode2-legend-item">
              <span
                className="mode2-legend-color"
                style={{ backgroundColor: "#FFA726" }}
              ></span>
              <span>T Peak</span>
            </div>
            <div className="mode2-legend-item">
              <span
                className="mode2-legend-color"
                style={{ backgroundColor: "#9C27B0" }}
              ></span>
              <span>P Peak</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderComparisonPlot = () => {
    if (
      !analysisData ||
      !analysisData.abnormal_beats ||
      analysisData.abnormal_beats.length === 0
    ) {
      return null;
    }

    const abnormalBeatsWithSignal = analysisData.abnormal_beats
      .filter(
        (beat) =>
          beat.signal && Array.isArray(beat.signal) && beat.signal.length > 0
      )
      .slice(0, 3);

    if (abnormalBeatsWithSignal.length === 0) {
      return (
        <div className="mode2-no-signal">
          <p>📭 No signal data available for comparison</p>
        </div>
      );
    }

    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA726", "#9C27B0"];

    const plotData = abnormalBeatsWithSignal.map((beat, index) => ({
      x: Array.from({ length: beat.signal.length }, (_, i) => i),
      y: beat.signal,
      mode: "lines",
      type: "scatter",
      name: `Beat #${beat.beat_index} (Diff: ${(
        beat.difference_score || 0
      ).toFixed(3)})`,
      line: {
        color: colors[index % colors.length],
        width: 2,
      },
    }));

    const plotLayout = {
      title: {
        text: "Abnormal Beats Comparison",
        font: { size: 16, color: "white" },
      },
      xaxis: {
        title: {
          text: "Time (samples)",
          font: { color: "white", size: 12 },
        },
        color: "white",
        gridcolor: "#444",
        showline: true,
        linecolor: "white",
      },
      yaxis: {
        title: {
          text: "Amplitude (normalized)",
          font: { color: "white", size: 12 },
        },
        color: "white",
        gridcolor: "#444",
        showline: true,
        linecolor: "white",
      },
      paper_bgcolor: "#1f2937",
      plot_bgcolor: "#111827",
      width: 600,
      height: 400,
      margin: { t: 60, r: 40, b: 60, l: 60 },
      showlegend: true,
      legend: {
        font: { color: "white" },
        bgcolor: "rgba(0,0,0,0.5)",
        bordercolor: "#666",
      },
    };

    return (
      <div className="mode2-comparison-plot">
        <Plot
          data={plotData}
          layout={plotLayout}
          config={{
            displayModeBar: true,
            displaylogo: false,
            responsive: true,
          }}
        />
      </div>
    );
  };

  useEffect(() => {
    if (selectedPatient && selectedRecording) {
      fetchAnalysis();
    }
  }, [channel, threshold, selectedPatient, selectedRecording]);

  useEffect(() => {
    setAnalysisData(null);
    setSelectedAbnormalBeat(null);
    setError("");
  }, [selectedPatient, selectedRecording]);

  return (
    <div className="mode2-container">
      <div className="mode2-header">
        <button
          className="mode2-back-button"
          onClick={() => navigate("/")}
          type="button"
        >
          🏠 Back to Home
        </button>
        <h1 className="mode2-title">🎯 Mode 2 - Abnormal Beat Detection</h1>
      </div>

      {/* معلومات المريض */}
      <div className="mode2-patient-info">
        <div className="mode2-patient-item">
          <div className="mode2-patient-label">Patient</div>
          <div className="mode2-patient-value">
            {selectedPatient || "Not selected"}
          </div>
        </div>
        <div className="mode2-patient-item">
          <div className="mode2-patient-label">Recording</div>
          <div className="mode2-patient-value">
            {selectedRecording || "Not selected"}
          </div>
        </div>
        <div className="mode2-patient-item">
          <div className="mode2-patient-label">Channel</div>
          <div className="mode2-patient-value">{channel.toUpperCase()}</div>
        </div>
      </div>

      {(!selectedPatient || !selectedRecording) && (
        <div className="mode2-warning">
          ⚠️ Please select patient and recording from Home page
        </div>
      )}

      <div className="mode2-content">
        {/* لوحة التحكم */}
        <div className="mode2-controls-panel">
          <h3 className="mode2-controls-title">🎯 Analysis Configuration</h3>

          {/* اختيار القناة */}
          <div className="mode2-setting-group">
            <label className="mode2-setting-label">📊 ECG Channel</label>
            <select
              className="mode2-setting-select"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              disabled={!selectedPatient || !selectedRecording || loading}
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

          {/* إعدادات الـ Threshold */}
          <div className="mode2-setting-group">
            <label className="mode2-setting-label">
              🎚️ Detection Threshold: {threshold}
            </label>
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="mode2-setting-slider"
              disabled={loading}
            />
            <div className="mode2-threshold-labels">
              <span>More Sensitive</span>
              <span>Less Sensitive</span>
            </div>
          </div>

          {/* زر التحديث */}
          <button
            className="mode2-update-button"
            onClick={fetchAnalysis}
            disabled={!selectedPatient || !selectedRecording || loading}
            type="button"
          >
            {loading ? (
              <>
                <span className="mode2-spinner-small"></span>
                Analyzing...
              </>
            ) : (
              "🎯 Detect Abnormal Beats"
            )}
          </button>

          {/* نتائج التحليل */}
          {analysisData && (
            <div className="mode2-results-info">
              <h4 className="mode2-results-title">📈 Analysis Results</h4>

              <div className="mode2-stats-grid">
                <div className="mode2-stat-item">
                  <div className="mode2-stat-label">Total Beats</div>
                  <div className="mode2-stat-value">
                    {analysisData.analysis_summary?.total_beats_analyzed || 0}
                  </div>
                </div>
                <div className="mode2-stat-item">
                  <div className="mode2-stat-label">Abnormal</div>
                  <div className="mode2-stat-value abnormal">
                    {analysisData.analysis_summary?.abnormal_beats_detected ||
                      0}
                  </div>
                </div>
                <div className="mode2-stat-item">
                  <div className="mode2-stat-label">Percentage</div>
                  <div className="mode2-stat-value percentage">
                    {analysisData.analysis_summary?.abnormality_percentage || 0}
                    %
                  </div>
                </div>
              </div>

              {/* قائمة النبضات الشاذة */}
              {analysisData.abnormal_beats &&
                analysisData.abnormal_beats.length > 0 && (
                  <div className="mode2-abnormal-list">
                    <h5 className="mode2-abnormal-title">
                      🚨 Abnormal Beats ({analysisData.abnormal_beats.length})
                    </h5>
                    <div className="mode2-abnormal-scroll">
                      {analysisData.abnormal_beats.map((beat) => (
                        <div
                          key={beat.beat_index}
                          className={`mode2-abnormal-item ${
                            selectedAbnormalBeat?.beat_index === beat.beat_index
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => setSelectedAbnormalBeat(beat)}
                        >
                          <span className="mode2-beat-number">
                            #{beat.beat_index}
                          </span>
                          <span className="mode2-beat-difference">
                            Diff: {(beat.difference_score || 0).toFixed(3)}
                          </span>
                          {beat.signal ? (
                            <span
                              className="mode2-beat-signal"
                              title="Has signal data"
                            >
                              📊
                            </span>
                          ) : (
                            <span
                              className="mode2-beat-no-signal"
                              title="No signal data"
                            >
                              📭
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* منطقة العرض */}
        <div className="mode2-display-container">
          {loading && (
            <div className="mode2-loading-container">
              <div className="mode2-spinner"></div>
              <p className="mode2-loading-text">Analyzing ECG beats...</p>
            </div>
          )}

          {error && (
            <div className="mode2-error-container">
              <p className="mode2-error-text">❌ {error}</p>
              <button
                className="mode2-retry-button"
                onClick={fetchAnalysis}
                type="button"
              >
                🔄 Retry Analysis
              </button>
            </div>
          )}

          {!selectedPatient || !selectedRecording ? (
            <div className="mode2-placeholder-container">
              <p className="mode2-placeholder-text">
                👈 Please select patient and recording from Home page
              </p>
            </div>
          ) : !analysisData ? (
            <div className="mode2-placeholder-container">
              <p className="mode2-placeholder-text">
                📡 No analysis data loaded
              </p>
              <p className="mode2-placeholder-subtext">
                Click "Detect Abnormal Beats" to start analysis
              </p>
            </div>
          ) : (
            <div className="mode2-display-content">
              {/* التقرير المختصر */}
              <div className="mode2-report-card">
                <h3 className="mode2-report-title">📋 Analysis Report</h3>
                <div className="mode2-report-content">
                  <p>
                    <strong>Patient:</strong> {analysisData.patient || "N/A"}
                  </p>
                  <p>
                    <strong>Recording:</strong>{" "}
                    {analysisData.recording || "N/A"}
                  </p>
                  <p>
                    <strong>Channel:</strong>{" "}
                    {(analysisData.channel || "N/A").toUpperCase()}
                  </p>
                  <p>
                    <strong>Abnormality Rate:</strong>{" "}
                    <span className="mode2-highlight">
                      {analysisData.analysis_summary?.abnormality_percentage ||
                        0}
                      %
                    </span>
                  </p>
                  <p>
                    <strong>Abnormal Beats:</strong>{" "}
                    <span className="mode2-highlight">
                      {analysisData.analysis_summary?.abnormal_beats_detected ||
                        0}{" "}
                      /{" "}
                      {analysisData.analysis_summary?.total_beats_analyzed || 0}
                    </span>
                  </p>
                  <p>
                    <strong>Algorithm:</strong>{" "}
                    {analysisData.algorithm_used || "N/A"}
                  </p>
                </div>
              </div>

              {/* النبضة الشاذة المحددة مع QRST */}
              {selectedAbnormalBeat && (
                <div className="mode2-beat-display">
                  <h3 className="mode2-beat-title">
                    Detailed Analysis - Beat #{selectedAbnormalBeat.beat_index}
                  </h3>
                  {renderAbnormalBeatWithQRST(selectedAbnormalBeat)}

                  {/* النقاط الأساسية */}
                  {selectedAbnormalBeat.fiducial_points &&
                    Object.keys(selectedAbnormalBeat.fiducial_points).length >
                      0 && (
                      <div className="mode2-fiducial-points">
                        <h4>📍 Fiducial Points Details</h4>
                        <div className="mode2-points-grid">
                          {Object.entries(
                            selectedAbnormalBeat.fiducial_points
                          ).map(([key, value]) => (
                            <div key={key} className="mode2-point-item">
                              <span className="mode2-point-name">{key}:</span>
                              <span className="mode2-point-value">
                                {typeof value === "number"
                                  ? `Sample ${value} (Value: ${
                                      selectedAbnormalBeat.signal?.[
                                        value
                                      ]?.toFixed(4) || "N/A"
                                    })`
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* مقارنة النبضات */}
              {analysisData.abnormal_beats &&
                analysisData.abnormal_beats.length > 1 && (
                  <div className="mode2-comparison">
                    <h3 className="mode2-comparison-title">
                      📊 Abnormal Beats Comparison
                    </h3>
                    {renderComparisonPlot()}
                  </div>
                )}

              {/* تفسير النتائج */}
              <div className="mode2-explanation">
                <h4 className="mode2-explanation-title">
                  🎯 How to interpret results:
                </h4>
                <ul className="mode2-explanation-list">
                  <li className="mode2-explanation-item">
                    <span className="mode2-explanation-strong">
                      Abnormal Beats
                    </span>
                    : Heartbeats that differ significantly from the patient's
                    normal pattern
                  </li>
                  <li className="mode2-explanation-item">
                    <span className="mode2-explanation-strong">
                      Difference Score
                    </span>
                    : How much the beat differs from the template (higher = more
                    abnormal)
                  </li>
                  <li className="mode2-explanation-item">
                    <span className="mode2-explanation-strong">
                      Fiducial Points
                    </span>
                    : Key landmarks in the ECG waveform (P, Q, R, S, T waves)
                  </li>
                  <li className="mode2-explanation-item">
                    <span className="mode2-explanation-strong">
                      Abnormality %
                    </span>
                    : Percentage of beats classified as abnormal in the
                    recording
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
