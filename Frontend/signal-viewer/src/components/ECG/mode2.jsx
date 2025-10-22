import React, { useState, useEffect, useCallback, useMemo } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode2.css";

// Constants
const CHANNEL_OPTIONS = [
  "i", "ii", "iii", "avr", "avl", "avf", "v1", "v2", "v3", "v4", "v5", "v6"
];

const FIDUCIAL_POINTS_CONFIG = {
  Q_Point: { name: "Q Point", color: "#4ECDC4", symbol: "circle", size: 8, ayOffset: -30 },
  R_Peak: { name: "R Peak", color: "#FF6B6B", symbol: "star", size: 12, ayOffset: -40 },
  S_Point: { name: "S Point", color: "#45B7D1", symbol: "circle", size: 8, ayOffset: 30 },
  T_Peak: { name: "T Peak", color: "#FFA726", symbol: "diamond", size: 10, ayOffset: -30 },
  P_Peak: { name: "P Peak", color: "#9C27B0", symbol: "circle", size: 8, ayOffset: -35 }
};

const PLOT_LAYOUT_BASE = {
  xaxis: {
    title: { text: "Time (samples)", font: { color: "white", size: 12 } },
    color: "white",
    gridcolor: "#444",
    showline: true,
    linecolor: "white",
    zeroline: false,
    showgrid: true,
  },
  yaxis: {
    title: { text: "Amplitude (normalized)", font: { color: "white", size: 12 } },
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

const PLOT_CONFIG = {
  displayModeBar: true,
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ["pan2d", "select2d", "lasso2d"],
  displayModeBarButtons: {
    hoverClosestGl2d: true,
    hoverClosestCartesian: true,
  },
};

export default function Mode2() {
  const navigate = useNavigate();
  const { selectedPatient, selectedRecording } = useECG();

  const [channel, setChannel] = useState("ii");
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState("");
  const [threshold, setThreshold] = useState(0.05);
  const [selectedAbnormalBeat, setSelectedAbnormalBeat] = useState(null);

  const hasValidSelection = useMemo(() => 
    selectedPatient && selectedRecording, 
    [selectedPatient, selectedRecording]
  );

  const filteredAbnormalBeats = useMemo(() => 
    analysisData?.abnormal_beats?.filter(beat => 
      beat.signal && Array.isArray(beat.signal) && beat.signal.length > 0
    ) || [], 
    [analysisData]
  );

  const fetchAnalysis = useCallback(async () => {
    if (!hasValidSelection) return;

    setLoading(true);
    setError("");
    setAnalysisData(null);
    setSelectedAbnormalBeat(null);

    try {
      const apiUrl = `http://127.0.0.1:8000/ecg/mode2/analyze-optimized?patient=${selectedPatient}&recording=${selectedRecording}&channel=${channel}&threshold=${threshold}&max_beats=100`;
      console.log("🔄 Fetching Mode 2 analysis:", apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const jsonData = await response.json();
      
      if (jsonData.analysis_summary) {
        console.log("✅ Mode 2 analysis received:", jsonData);
        
        if (jsonData.abnormal_beats) {
          jsonData.abnormal_beats = jsonData.abnormal_beats.filter(beat =>
            beat.signal && Array.isArray(beat.signal) && beat.signal.length > 0
          );
          console.log(`✅ Filtered ${jsonData.abnormal_beats.length} beats with valid signal`);
        }

        setAnalysisData(jsonData);
        if (jsonData.abnormal_beats?.length > 0) {
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
  }, [hasValidSelection, selectedPatient, selectedRecording, channel, threshold]);

  const renderAbnormalBeatWithQRST = useCallback((beat) => {
    if (!beat?.signal?.length) {
      return (
        <div className="mode2-no-signal">
          <p>📭 No signal data available for this beat</p>
        </div>
      );
    }

    const { signal, fiducial_points = {} } = beat;
    const xValues = Array.from({ length: signal.length }, (_, i) => i);

    const plotData = [{
      x: xValues,
      y: signal,
      mode: "lines",
      type: "scatter",
      name: "ECG Signal",
      line: { color: "#FF6B6B", width: 3 },
      hoverinfo: "x+y",
    }];

    const annotations = [];

    Object.entries(FIDUCIAL_POINTS_CONFIG).forEach(([pointKey, config]) => {
      const pointIndex = fiducial_points[pointKey];
      if (pointIndex == null || pointIndex < 0 || pointIndex >= signal.length) return;

      // Add point marker
      plotData.push({
        x: [pointIndex],
        y: [signal[pointIndex]],
        mode: "markers",
        name: config.name,
        marker: {
          color: config.color,
          size: config.size,
          symbol: config.symbol,
          line: { color: "white", width: 1 },
        },
        hoverinfo: "text",
        text: [`${config.name}: Sample ${pointIndex} (Value: ${signal[pointIndex].toFixed(4)})`],
      });

      // Add annotation
      annotations.push({
        x: pointIndex,
        y: signal[pointIndex],
        text: config.name.charAt(0),
        showarrow: true,
        arrowhead: 7,
        ax: 0,
        ay: config.ayOffset,
        bgcolor: config.color,
        font: { color: "white", size: 12 },
        bordercolor: config.color,
        borderwidth: 2,
        borderpad: 4,
      });
    });

    const plotLayout = {
      ...PLOT_LAYOUT_BASE,
      title: {
        text: `🚨 Abnormal Beat #${beat.beat_index} - Difference: ${(beat.difference_score || 0).toFixed(3)}`,
        font: { size: 18, color: "white" },
      },
      width: 700,
      height: 500,
      margin: { t: 80, r: 50, b: 80, l: 80 },
      annotations,
    };

    return (
      <div className="mode2-beat-with-qrst">
        <Plot data={plotData} layout={plotLayout} config={PLOT_CONFIG} />
        
        <FiducialPointsLegend />
      </div>
    );
  }, []);

  const renderComparisonPlot = useCallback(() => {
    if (!filteredAbnormalBeats.length) {
      return (
        <div className="mode2-no-signal">
          <p>📭 No signal data available for comparison</p>
        </div>
      );
    }

    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA726", "#9C27B0"];
    const beatsToCompare = filteredAbnormalBeats.slice(0, 3);

    const plotData = beatsToCompare.map((beat, index) => ({
      x: Array.from({ length: beat.signal.length }, (_, i) => i),
      y: beat.signal,
      mode: "lines",
      type: "scatter",
      name: `Beat #${beat.beat_index} (Diff: ${(beat.difference_score || 0).toFixed(3)})`,
      line: { color: colors[index % colors.length], width: 2 },
    }));

    const plotLayout = {
      ...PLOT_LAYOUT_BASE,
      title: { text: "Abnormal Beats Comparison", font: { size: 16, color: "white" } },
      width: 600,
      height: 400,
      margin: { t: 60, r: 40, b: 60, l: 60 },
    };

    return (
      <div className="mode2-comparison-plot">
        <Plot data={plotData} layout={plotLayout} config={PLOT_CONFIG} />
      </div>
    );
  }, [filteredAbnormalBeats]);

  // Component for Fiducial Points Legend
  const FiducialPointsLegend = useCallback(() => (
    <div className="mode2-legend">
      <h4>🎯 Fiducial Points Legend:</h4>
      <div className="mode2-legend-items">
        {Object.entries(FIDUCIAL_POINTS_CONFIG).map(([key, config]) => (
          <div key={key} className="mode2-legend-item">
            <span 
              className="mode2-legend-color" 
              style={{ backgroundColor: config.color }}
            />
            <span>{config.name}</span>
          </div>
        ))}
      </div>
    </div>
  ), []);

  // Component for Analysis Results
  const AnalysisResults = useCallback(() => {
    if (!analysisData) return null;

    const { analysis_summary } = analysisData;

    return (
      <div className="mode2-results-info">
        <h4 className="mode2-results-title">📈 Analysis Results</h4>
        
        <div className="mode2-stats-grid">
          <StatItem label="Total Beats" value={analysis_summary?.total_beats_analyzed || 0} />
          <StatItem label="Abnormal" value={analysis_summary?.abnormal_beats_detected || 0} className="abnormal" />
          <StatItem label="Percentage" value={`${analysis_summary?.abnormality_percentage || 0}%`} className="percentage" />
        </div>

        {filteredAbnormalBeats.length > 0 && (
          <AbnormalBeatsList 
            beats={filteredAbnormalBeats}
            selectedBeat={selectedAbnormalBeat}
            onSelectBeat={setSelectedAbnormalBeat}
          />
        )}
      </div>
    );
  }, [analysisData, filteredAbnormalBeats, selectedAbnormalBeat]);

  // Component for Report Card
  const ReportCard = useCallback(() => {
    if (!analysisData) return null;

    const { analysis_summary, patient, recording, channel: analysisChannel, algorithm_used } = analysisData;

    return (
      <div className="mode2-report-card">
        <h3 className="mode2-report-title">📋 Analysis Report</h3>
        <div className="mode2-report-content">
          <ReportItem label="Patient" value={patient || "N/A"} />
          <ReportItem label="Recording" value={recording || "N/A"} />
          <ReportItem label="Channel" value={(analysisChannel || "N/A").toUpperCase()} />
          <ReportItem 
            label="Abnormality Rate" 
            value={`${analysis_summary?.abnormality_percentage || 0}%`} 
            highlight 
          />
          <ReportItem 
            label="Abnormal Beats" 
            value={`${analysis_summary?.abnormal_beats_detected || 0} / ${analysis_summary?.total_beats_analyzed || 0}`} 
            highlight 
          />
          <ReportItem label="Algorithm" value={algorithm_used || "N/A"} />
        </div>
      </div>
    );
  }, [analysisData]);

  useEffect(() => {
    if (hasValidSelection) fetchAnalysis();
  }, [channel, threshold, hasValidSelection, fetchAnalysis]);

  useEffect(() => {
    setAnalysisData(null);
    setSelectedAbnormalBeat(null);
    setError("");
  }, [selectedPatient, selectedRecording]);

  return (
    <div className="mode2-container">
      {!hasValidSelection && (
        <div className="mode2-warning">
          ⚠️ Please select patient and recording from Home page
        </div>
      )}

      <div className="mode2-content">
        {/* Controls Panel */}
        <ControlsPanel
          channel={channel}
          setChannel={setChannel}
          threshold={threshold}
          setThreshold={setThreshold}
          loading={loading}
          hasValidSelection={hasValidSelection}
          onAnalyze={fetchAnalysis}
        >
          <AnalysisResults />
        </ControlsPanel>

        {/* Display Area */}
        <DisplayArea
          loading={loading}
          error={error}
          hasValidSelection={hasValidSelection}
          analysisData={analysisData}
          selectedAbnormalBeat={selectedAbnormalBeat}
          onRetry={fetchAnalysis}
          renderAbnormalBeatWithQRST={renderAbnormalBeatWithQRST}
          renderComparisonPlot={renderComparisonPlot}
        >
          <ReportCard />
        </DisplayArea>
      </div>
    </div>
  );
}

// Extracted Components
const StatItem = ({ label, value, className = "" }) => (
  <div className="mode2-stat-item">
    <div className="mode2-stat-label">{label}</div>
    <div className={`mode2-stat-value ${className}`}>{value}</div>
  </div>
);

const ReportItem = ({ label, value, highlight = false }) => (
  <p>
    <strong>{label}:</strong>{" "}
    <span className={highlight ? "mode2-highlight" : ""}>{value}</span>
  </p>
);

const AbnormalBeatsList = ({ beats, selectedBeat, onSelectBeat }) => (
  <div className="mode2-abnormal-list">
    <h5 className="mode2-abnormal-title">🚨 Abnormal Beats ({beats.length})</h5>
    <div className="mode2-abnormal-scroll">
      {beats.map(beat => (
        <div
          key={beat.beat_index}
          className={`mode2-abnormal-item ${
            selectedBeat?.beat_index === beat.beat_index ? "selected" : ""
          }`}
          onClick={() => onSelectBeat(beat)}
        >
          <span className="mode2-beat-number">#{beat.beat_index}</span>
          <span className="mode2-beat-difference">
            Diff: {(beat.difference_score || 0).toFixed(3)}
          </span>
          <span 
            className={beat.signal ? "mode2-beat-signal" : "mode2-beat-no-signal"}
            title={beat.signal ? "Has signal data" : "No signal data"}
          >
            {beat.signal ? "📊" : "📭"}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const ControlsPanel = ({ 
  channel, setChannel, threshold, setThreshold, loading, hasValidSelection, onAnalyze, children 
}) => (
  <div className="mode2-controls-panel">
    <h3 className="mode2-controls-title">🎯 Analysis Configuration</h3>

    <div className="mode2-setting-group">
      <label className="mode2-setting-label">📊 ECG Channel</label>
      <select
        className="mode2-setting-select"
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        disabled={!hasValidSelection || loading}
      >
        {CHANNEL_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
        ))}
      </select>
    </div>

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

    <button
      className="mode2-update-button"
      onClick={onAnalyze}
      disabled={!hasValidSelection || loading}
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

    {children}
  </div>
);

const DisplayArea = ({ 
  loading, error, hasValidSelection, analysisData, selectedAbnormalBeat, 
  onRetry, renderAbnormalBeatWithQRST, renderComparisonPlot, children 
}) => {
  if (loading) {
    return (
      <div className="mode2-display-container">
        <div className="mode2-loading-container">
          <div className="mode2-spinner"></div>
          <p className="mode2-loading-text">Analyzing ECG beats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mode2-display-container">
        <div className="mode2-error-container">
          <p className="mode2-error-text">❌ {error}</p>
          <button className="mode2-retry-button" onClick={onRetry} type="button">
            🔄 Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!hasValidSelection) {
    return (
      <div className="mode2-display-container">
        <div className="mode2-placeholder-container">
          <p className="mode2-placeholder-text">
            👈 Please select patient and recording from Home page
          </p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="mode2-display-container">
        <div className="mode2-placeholder-container">
          <p className="mode2-placeholder-text">📡 No analysis data loaded</p>
          <p className="mode2-placeholder-subtext">
            Click "Detect Abnormal Beats" to start analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mode2-display-container">
      <div className="mode2-display-content">
        {children}

        {selectedAbnormalBeat && (
          <div className="mode2-beat-display">
            <h3 className="mode2-beat-title">
              Detailed Analysis - Beat #{selectedAbnormalBeat.beat_index}
            </h3>
            {renderAbnormalBeatWithQRST(selectedAbnormalBeat)}

            {selectedAbnormalBeat.fiducial_points && (
              <FiducialPointsDetails beat={selectedAbnormalBeat} />
            )}
          </div>
        )}

        {analysisData.abnormal_beats?.length > 1 && (
          <div className="mode2-comparison">
            <h3 className="mode2-comparison-title">📊 Abnormal Beats Comparison</h3>
            {renderComparisonPlot()}
          </div>
        )}

        <ResultsExplanation />
      </div>
    </div>
  );
};

const FiducialPointsDetails = ({ beat }) => (
  <div className="mode2-fiducial-points">
    <h4>📍 Fiducial Points Details</h4>
    <div className="mode2-points-grid">
      {Object.entries(beat.fiducial_points).map(([key, value]) => (
        <div key={key} className="mode2-point-item">
          <span className="mode2-point-name">{key}:</span>
          <span className="mode2-point-value">
            {typeof value === "number" 
              ? `Sample ${value} (Value: ${beat.signal?.[value]?.toFixed(4) || "N/A"})`
              : String(value)
            }
          </span>
        </div>
      ))}
    </div>
  </div>
);

const ResultsExplanation = () => (
  <div className="mode2-explanation">
    <h4 className="mode2-explanation-title">🎯 How to interpret results:</h4>
    <ul className="mode2-explanation-list">
      <ExplanationItem 
        term="Abnormal Beats" 
        definition="Heartbeats that differ significantly from the patient's normal pattern" 
      />
      <ExplanationItem 
        term="Difference Score" 
        definition="How much the beat differs from the template (higher = more abnormal)" 
      />
      <ExplanationItem 
        term="Fiducial Points" 
        definition="Key landmarks in the ECG waveform (P, Q, R, S, T waves)" 
      />
      <ExplanationItem 
        term="Abnormality %" 
        definition="Percentage of beats classified as abnormal in the recording" 
      />
    </ul>
  </div>
);

const ExplanationItem = ({ term, definition }) => (
  <li className="mode2-explanation-item">
    <span className="mode2-explanation-strong">{term}</span>
    : {definition}
  </li>
);
