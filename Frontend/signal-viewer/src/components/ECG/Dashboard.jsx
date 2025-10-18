import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    selectedPatient,
    selectedRecording,
    ecgData,
    setEcgData,
    length,
    setLength,
    offset,
    setOffset,
  } = useECG();

  const [activeTab, setActiveTab] = useState("timeSeries");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mode 1 States
  const [mode1Channel, setMode1Channel] = useState("I");
  const [mode1FullSignal, setMode1FullSignal] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);

  // Mode 2 States
  const [mode2Channel, setMode2Channel] = useState("ii");
  const [mode2Analysis, setMode2Analysis] = useState(null);
  const [mode2Threshold, setMode2Threshold] = useState(0.05);

  // Mode 3 States
  const [mode3Channels, setMode3Channels] = useState(["i", "ii", "v1"]);
  const [mode3Signals, setMode3Signals] = useState(null);
  const [mode3CycleLength, setMode3CycleLength] = useState(200);

  // Mode 4 States
  const [mode4Channels, setMode4Channels] = useState({ channel1: "i", channel2: "ii" });
  const [mode4Signals, setMode4Signals] = useState(null);
  const [mode4ChunkSize, setMode4ChunkSize] = useState(500);

  // Mode 5 States
  const [mode5Analysis, setMode5Analysis] = useState(null);
  const [mode5Loading, setMode5Loading] = useState(false);

  // Mode 6 States
  const [mode6Channel, setMode6Channel] = useState("ii");
  const [mode6Data, setMode6Data] = useState(null);
  const [mode6TimeChunk, setMode6TimeChunk] = useState(2.0);

  // Mode 1 API Call (Real-time Monitor)
  const fetchMode1Data = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    try {
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode1/full-signal?patient=${selectedPatient}&recording=${selectedRecording}&channel=${mode1Channel.toLowerCase()}`;

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.x && jsonData.y) {
        setMode1FullSignal(jsonData);
        const initialData = {
          x: jsonData.x.slice(0, length),
          y: jsonData.y.slice(0, length),
        };
        setEcgData(initialData);
      } else {
        setError("Failed to load Mode 1 data");
      }
    } catch (error) {
      setError("Mode 1 error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mode 2 API Call (Abnormal Beat Detection)
  const fetchMode2Data = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    try {
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode2/analyze-optimized?patient=${selectedPatient}&recording=${selectedRecording}&channel=${mode2Channel}&threshold=${mode2Threshold}&max_beats=100`;

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.analysis_summary) {
        setMode2Analysis(jsonData);
      } else {
        setError("Failed to load Mode 2 analysis");
      }
    } catch (error) {
      setError("Mode 2 error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mode 3 API Call (Polar Graph)
  const fetchMode3Data = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    try {
      const channelsParam = mode3Channels.join(",");
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode3/signal?patient=${selectedPatient}&recording=${selectedRecording}&channels=${channelsParam}&offset=${offset}&length=${length}`;

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.signals) {
        setMode3Signals(jsonData);
      } else {
        setError("Failed to load Mode 3 signals");
      }
    } catch (error) {
      setError("Mode 3 error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mode 4 API Call (Recurrence/Scatter Plot)
  const fetchMode4Data = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    try {
      const channelsParam = `${mode4Channels.channel1},${mode4Channels.channel2}`;
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode4/signal?patient=${selectedPatient}&recording=${selectedRecording}&channels=${channelsParam}&offset=${offset}&length=${length}`;

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok && jsonData.signals) {
        setMode4Signals(jsonData);
      } else {
        setError("Failed to load Mode 4 signals");
      }
    } catch (error) {
      setError("Mode 4 error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mode 5 API Call (AI Analysis)
  const fetchMode5Data = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setMode5Loading(true);
    try {
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/ecg/mode5/comprehensive-analysis`;

      const requestData = {
        patient_info: {
          id: selectedPatient,
          recording: selectedRecording
        }
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setMode5Analysis(result);
      } else {
        setError("AI analysis failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      setError("Mode 5 error: " + error.message);
    } finally {
      setMode5Loading(false);
    }
  };

  // Mode 6 API Call (XOR Graph)
  const fetchMode6Data = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    try {
      const apiUrl = `http://127.0.0.1:8000/ecg/mode1/data?patient=${selectedPatient}&recording=${selectedRecording}&channel=${mode6Channel.toLowerCase()}`;

      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (jsonData.signal || jsonData.ecg_signal) {
        setMode6Data(jsonData);
      } else {
        // Try alternative endpoint
        await fetchMode6Alternative();
      }
    } catch (error) {
      console.error("Mode 6 error:", error);
      setError("Mode 6 error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMode6Alternative = async () => {
    try {
      const apiUrl = `http://127.0.0.1:8000/ecg/mode2/analyze-optimized?patient=${selectedPatient}&recording=${selectedRecording}&channel=${mode6Channel}&threshold=0.05&max_beats=50`;
      
      const response = await fetch(apiUrl);
      const jsonData = await response.json();
      
      if (jsonData.beat_data || jsonData.abnormal_beats) {
        setMode6Data(jsonData);
      }
    } catch (error) {
      console.error("Mode 6 alternative failed:", error);
    }
  };

  // Load data when tab changes or dependencies update
  useEffect(() => {
    if (!selectedPatient || !selectedRecording) return;

    switch (activeTab) {
      case "timeSeries":
        fetchMode1Data();
        break;
      case "abnormalBeats":
        fetchMode2Data();
        break;
      case "polarGraph":
        fetchMode3Data();
        break;
      case "recurrencePlot":
        fetchMode4Data();
        break;
      case "aiAnalysis":
        // Don't auto-fetch AI analysis
        break;
      case "xorGraph":
        fetchMode6Data();
        break;
    }
  }, [activeTab, selectedPatient, selectedRecording, mode1Channel, mode2Channel, mode2Threshold, mode3Channels, mode4Channels, mode6Channel]);

  // Render Mode 1 Content (Time Series)
  const renderTimeSeries = () => {
    if (!mode1FullSignal) {
      return <div className="no-data">No time series data loaded</div>;
    }

    const currentData = isPlaying ? ecgData : {
      x: mode1FullSignal.x.slice(offset, offset + length),
      y: mode1FullSignal.y.slice(offset, offset + length)
    };

    return (
      <div className="mode-content">
        <div className="mode-controls">
          <div className="control-group">
            <label>Channel:</label>
            <select value={mode1Channel} onChange={(e) => setMode1Channel(e.target.value)}>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="aVR">aVR</option>
              <option value="aVL">aVL</option>
              <option value="aVF">aVF</option>
              <option value="V1">V1</option>
              <option value="V2">V2</option>
              <option value="V3">V3</option>
              <option value="V4">V4</option>
              <option value="V5">V5</option>
              <option value="V6">V6</option>
            </select>
          </div>

          <div className="control-group">
            <button onClick={() => setIsPlaying(!isPlaying)} className="play-button">
              {isPlaying ? "⏸️ Stop" : "▶️ Play"}
            </button>
          </div>

          <div className="control-group">
            <label>Speed:</label>
            <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(Number(e.target.value))}>
              <option value={2000}>Slow</option>
              <option value={1000}>Normal</option>
              <option value={500}>Fast</option>
            </select>
          </div>
        </div>

        <Plot
          data={[{
            x: currentData.x,
            y: currentData.y,
            type: "scatter",
            mode: "lines",
            line: { color: "#00ff88", width: 2 }
          }]}
          layout={{
            title: `ECG Monitor - Channel ${mode1Channel}`,
            height: 400,
            paper_bgcolor: "#1f2937",
            plot_bgcolor: "#111827",
            font: { color: "white" },
            xaxis: { title: "Time (samples)", color: "white", gridcolor: "#666" },
            yaxis: { title: "Voltage (mV)", color: "white", gridcolor: "#666" }
          }}
          config={{ displayModeBar: true, responsive: true }}
        />
      </div>
    );
  };

  // Render Mode 2 Content (Abnormal Beats)
  const renderAbnormalBeats = () => {
    if (!mode2Analysis) {
      return <div className="no-data">No abnormal beat analysis data</div>;
    }

    return (
      <div className="mode-content">
        <div className="mode-controls">
          <div className="control-group">
            <label>Channel:</label>
            <select value={mode2Channel} onChange={(e) => setMode2Channel(e.target.value)}>
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

          <div className="control-group">
            <label>Threshold: {mode2Threshold}</label>
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={mode2Threshold}
              onChange={(e) => setMode2Threshold(parseFloat(e.target.value))}
            />
          </div>

          <button onClick={fetchMode2Data} className="refresh-button">
            🔄 Refresh Analysis
          </button>
        </div>

        <div className="analysis-results">
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Beats</h4>
              <div className="stat-value">{mode2Analysis.analysis_summary?.total_beats_analyzed || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Abnormal Beats</h4>
              <div className="stat-value abnormal">{mode2Analysis.analysis_summary?.abnormal_beats_detected || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Abnormality %</h4>
              <div className="stat-value">{mode2Analysis.analysis_summary?.abnormality_percentage || 0}%</div>
            </div>
          </div>

          {mode2Analysis.abnormal_beats && mode2Analysis.abnormal_beats.length > 0 && (
            <div className="abnormal-list">
              <h4>Detected Abnormal Beats</h4>
              <div className="beats-container">
                {mode2Analysis.abnormal_beats.slice(0, 5).map((beat, index) => (
                  <div key={beat.beat_index} className="beat-item">
                    <span>Beat #{beat.beat_index}</span>
                    <span>Diff: {(beat.difference_score || 0).toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Mode 3 Content (Polar Graph)
  const renderPolarGraph = () => {
    if (!mode3Signals?.signals) {
      return <div className="no-data">No polar graph data loaded</div>;
    }

    const polarData = mode3Channels.map((channel, index) => {
      const signal = mode3Signals.signals[channel] || [];
      const segment = signal.slice(0, mode3CycleLength);
      
      if (segment.length === 0) return null;

      const minVal = Math.min(...segment);
      const maxVal = Math.max(...segment);
      const range = maxVal - minVal;

      const polarPoints = segment.map((value, i) => {
        const normalized = range === 0 ? 0.5 : (value - minVal) / range;
        const angle = (i / segment.length) * 360;
        return { r: normalized, theta: angle };
      });

      const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1"];
      
      return {
        r: polarPoints.map(p => p.r),
        theta: polarPoints.map(p => p.theta),
        mode: "lines",
        type: "scatterpolar",
        name: `Channel ${channel.toUpperCase()}`,
        line: { color: colors[index % colors.length], width: 2 }
      };
    }).filter(Boolean);

    return (
      <div className="mode-content">
        <div className="mode-controls">
          <div className="control-group">
            <label>Channel 1:</label>
            <select value={mode3Channels[0]} onChange={(e) => setMode3Channels([e.target.value, mode3Channels[1], mode3Channels[2]])}>
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

          <div className="control-group">
            <label>Channel 2:</label>
            <select value={mode3Channels[1]} onChange={(e) => setMode3Channels([mode3Channels[0], e.target.value, mode3Channels[2]])}>
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

          <div className="control-group">
            <label>Channel 3:</label>
            <select value={mode3Channels[2]} onChange={(e) => setMode3Channels([mode3Channels[0], mode3Channels[1], e.target.value])}>
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

          <div className="control-group">
            <label>Cycle Length: {mode3CycleLength}</label>
            <input
              type="range"
              min="50"
              max="500"
              value={mode3CycleLength}
              onChange={(e) => setMode3CycleLength(Number(e.target.value))}
            />
          </div>
        </div>

        {polarData.length > 0 ? (
          <Plot
            data={polarData}
            layout={{
              title: "Polar Graph",
              polar: {
                radialaxis: { visible: true, range: [0, 1] },
                bgcolor: "#1f2937"
              },
              paper_bgcolor: "#1f2937",
              font: { color: "white" },
              height: 500,
              showlegend: true
            }}
            config={{ displayModeBar: true, responsive: true }}
          />
        ) : (
          <div className="no-data">No valid data for polar graph</div>
        )}
      </div>
    );
  };

  // Render Mode 4 Content (Recurrence/Scatter Plot)
  const renderRecurrencePlot = () => {
    if (!mode4Signals?.signals) {
      return <div className="no-data">No recurrence plot data loaded</div>;
    }

    const signal1 = mode4Signals.signals[mode4Channels.channel1] || [];
    const signal2 = mode4Signals.signals[mode4Channels.channel2] || [];

    if (signal1.length === 0 || signal2.length === 0) {
      return <div className="no-data">Insufficient data for selected channels</div>;
    }

    const scatterData = signal1.slice(0, mode4ChunkSize).map((_, index) => ({
      x: signal2[index] || 0,
      y: signal1[index] || 0
    }));

    return (
      <div className="mode-content">
        <div className="mode-controls">
          <div className="control-group">
            <label>Channel 1 (Y):</label>
            <select value={mode4Channels.channel1} onChange={(e) => setMode4Channels({...mode4Channels, channel1: e.target.value})}>
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

          <div className="control-group">
            <label>Channel 2 (X):</label>
            <select value={mode4Channels.channel2} onChange={(e) => setMode4Channels({...mode4Channels, channel2: e.target.value})}>
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

          <div className="control-group">
            <label>Chunk Size: {mode4ChunkSize}</label>
            <select value={mode4ChunkSize} onChange={(e) => setMode4ChunkSize(Number(e.target.value))}>
              <option value={100}>100 samples</option>
              <option value={500}>500 samples</option>
              <option value={1000}>1000 samples</option>
            </select>
          </div>
        </div>

        <Plot
          data={[{
            x: scatterData.map(d => d.x),
            y: scatterData.map(d => d.y),
            type: "scatter",
            mode: "markers",
            marker: {
              size: 4,
              color: "#FF6B6B",
              opacity: 0.6
            }
          }]}
          layout={{
            title: `Scatter Plot: ${mode4Channels.channel1.toUpperCase()} vs ${mode4Channels.channel2.toUpperCase()}`,
            height: 500,
            paper_bgcolor: "#1f2937",
            plot_bgcolor: "#111827",
            font: { color: "white" },
            xaxis: { title: `Channel ${mode4Channels.channel2.toUpperCase()}`, color: "white", gridcolor: "#666" },
            yaxis: { title: `Channel ${mode4Channels.channel1.toUpperCase()}`, color: "white", gridcolor: "#666" }
          }}
          config={{ displayModeBar: true, responsive: true }}
        />
      </div>
    );
  };

  // Render Mode 5 Content (AI Analysis)
  const renderAIAnalysis = () => {
    return (
      <div className="mode-content">
        <div className="mode-controls">
          <button 
            onClick={fetchMode5Data} 
            disabled={mode5Loading}
            className="ai-button"
          >
            {mode5Loading ? "🧠 Analyzing..." : "🤖 Run AI Comprehensive Analysis"}
          </button>
        </div>

        {mode5Analysis ? (
          <div className="ai-results">
            <div className="diagnosis-card">
              <h3>AI Diagnosis Results</h3>
              <div className="diagnosis-main">
                {mode5Analysis.final_diagnosis?.diagnosis_description || "No diagnosis available"}
              </div>
              <div className="confidence">
                Confidence: {mode5Analysis.final_diagnosis?.confidence || 0}%
              </div>
              
              {mode5Analysis.channel_analysis && (
                <div className="channel-analysis">
                  <h4>Channel-wise Analysis</h4>
                  {Object.entries(mode5Analysis.channel_analysis).map(([channel, analysis]) => (
                    <div key={channel} className="channel-result">
                      <strong>{channel.toUpperCase()}:</strong> {analysis.main_diagnosis?.diagnosis_description}
                      <span className="risk-level">({analysis.risk_level})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-data">
            <p>Click the button above to run AI comprehensive analysis</p>
          </div>
        )}
      </div>
    );
  };

  // Render Mode 6 Content (XOR Graph)
  const renderXORGraph = () => {
    return (
      <div className="mode-content">
        <div className="mode-controls">
          <div className="control-group">
            <label>Channel:</label>
            <select value={mode6Channel} onChange={(e) => setMode6Channel(e.target.value)}>
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

          <div className="control-group">
            <label>Time Chunk: {mode6TimeChunk}s</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={mode6TimeChunk}
              onChange={(e) => setMode6TimeChunk(parseFloat(e.target.value))}
            />
          </div>

          <button onClick={fetchMode6Data} className="refresh-button">
            🔄 Load XOR Data
          </button>
        </div>

        {mode6Data ? (
          <div className="xor-info">
            <h4>XOR Graph Data Loaded</h4>
            <p>Channel: {mode6Channel.toUpperCase()}</p>
            <p>Time Chunk: {mode6TimeChunk} seconds</p>
            <p>XOR analysis compares sequential time chunks to highlight signal differences.</p>
          </div>
        ) : (
          <div className="no-data">No XOR data loaded</div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <button className="back-button" onClick={() => navigate("/")}>
          🏠 Back to Home
        </button>
        <h1>ECG Analysis Dashboard</h1>
        <div className="patient-info">
          <span>Patient: <strong>{selectedPatient || "Not selected"}</strong></span>
          <span>Recording: <strong>{selectedRecording || "Not selected"}</strong></span>
        </div>
      </div>

      {/* Global Controls */}
      <div className="global-controls">
        <div className="control-group">
          <label>View Length: {length} samples</label>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label>Offset: {offset}</label>
          <input
            type="number"
            value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
            min="0"
          />
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {!selectedPatient || !selectedRecording ? (
        <div className="no-selection">
          <p>Please select a patient and recording from the home page</p>
        </div>
      ) : (
        <div className="dashboard-main">
          {/* Navigation Tabs */}
          <div className="dashboard-tabs">
            <button 
              className={`tab-button ${activeTab === "timeSeries" ? "active" : ""}`}
              onClick={() => setActiveTab("timeSeries")}
            >
              📊 Time Series
            </button>
            <button 
              className={`tab-button ${activeTab === "abnormalBeats" ? "active" : ""}`}
              onClick={() => setActiveTab("abnormalBeats")}
            >
              🎯 Abnormal Beats
            </button>
            <button 
              className={`tab-button ${activeTab === "polarGraph" ? "active" : ""}`}
              onClick={() => setActiveTab("polarGraph")}
            >
              🌀 Polar Graph
            </button>
            <button 
              className={`tab-button ${activeTab === "recurrencePlot" ? "active" : ""}`}
              onClick={() => setActiveTab("recurrencePlot")}
            >
              📈 Recurrence Plot
            </button>
            <button 
              className={`tab-button ${activeTab === "aiAnalysis" ? "active" : ""}`}
              onClick={() => setActiveTab("aiAnalysis")}
            >
              🧠 AI Analysis
            </button>
            <button 
              className={`tab-button ${activeTab === "xorGraph" ? "active" : ""}`}
              onClick={() => setActiveTab("xorGraph")}
            >
              🔄 XOR Graph
            </button>
          </div>

          {/* Content Area */}
          <div className="dashboard-content">
            <div className="mode-card">
              <div className="mode-header">
                <h2>
                  {activeTab === "timeSeries" && "📊 Real-time ECG Monitor"}
                  {activeTab === "abnormalBeats" && "🎯 Abnormal Beat Detection"}
                  {activeTab === "polarGraph" && "🌀 Polar Graph Visualization"}
                  {activeTab === "recurrencePlot" && "📈 Recurrence/Scatter Plot"}
                  {activeTab === "aiAnalysis" && "🧠 AI Comprehensive Analysis"}
                  {activeTab === "xorGraph" && "🔄 XOR Graph Analysis"}
                </h2>
                {loading && <div className="loading-indicator">🔄 Loading...</div>}
              </div>

              <div className="mode-body">
                {activeTab === "timeSeries" && renderTimeSeries()}
                {activeTab === "abnormalBeats" && renderAbnormalBeats()}
                {activeTab === "polarGraph" && renderPolarGraph()}
                {activeTab === "recurrencePlot" && renderRecurrencePlot()}
                {activeTab === "aiAnalysis" && renderAIAnalysis()}
                {activeTab === "xorGraph" && renderXORGraph()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}