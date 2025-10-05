import React, { useState, useEffect, useRef } from "react";
import Plot from "react-plotly.js";
import { useNavigate } from "react-router-dom";
import { useECG } from "./ecgContext";
import "./mode6.css";

export default function Mode6() {
  const navigate = useNavigate();
  const { selectedPatient, selectedRecording } = useECG();

  const [channels, setChannels] = useState(["ii"]);
  const [loading, setLoading] = useState(false);
  const [ecgData, setEcgData] = useState(null);
  const [error, setError] = useState("");
  const [timeChunk, setTimeChunk] = useState(2.0); // seconds
  const [speed, setSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [xorData, setXorData] = useState([]);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.1);

  const playIntervalRef = useRef(null);

  // جلب بيانات ECG باستخدام endpoint موجود
  const fetchECGData = async () => {
    if (!selectedPatient || !selectedRecording) return;

    setLoading(true);
    setError("");
    setEcgData(null);
    setXorData([]);
    setCurrentTime(0);
    setIsPlaying(false);

    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }

    try {
      const apiUrl = `http://127.0.0.1:8000/ecg/mode1/data?patient=${selectedPatient}&recording=${selectedRecording}&channel=${channels[0]}`;
      console.log("🔄 Fetching ECG data for XOR:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();

      if (jsonData.signal || jsonData.ecg_signal) {
        console.log("✅ ECG data received for XOR");

        const processedData = processECGData(jsonData, channels[0]);
        setEcgData(processedData);
        initializeXOR(processedData);
      } else {
        await tryMode2Data();
      }
    } catch (error) {
      console.error("💥 Error fetching ECG data:", error);
      await tryMode2Data();
    }
  };

  // محاولة جلب البيانات من Mode 2
  const tryMode2Data = async () => {
    try {
      const apiUrl = `http://127.0.0.1:8000/ecg/mode2/analyze-optimized?patient=${selectedPatient}&recording=${selectedRecording}&channel=${channels[0]}&threshold=0.05&max_beats=100`;
      console.log("🔄 Trying Mode 2 data:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Mode 2 also failed with status: ${response.status}`);
      }

      const jsonData = await response.json();

      if (jsonData.beat_data || jsonData.abnormal_beats) {
        console.log("✅ Using Mode 2 data for XOR");
        const processedData = processMode2Data(jsonData, channels[0]);
        setEcgData(processedData);
        initializeXOR(processedData);
      } else {
        setError("No valid ECG data found in either mode");
      }
    } catch (error) {
      setError(`Both modes failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // معالجة بيانات Mode 1
  const processECGData = (data, channel) => {
    const signal = data.signal || data.ecg_signal || [];
    const samplingRate = data.sampling_rate || 360;

    return {
      signals: [signal],
      channels: [channel],
      sampling_rate: samplingRate,
      duration: signal.length / samplingRate,
      original_data: data,
    };
  };

  // معالجة بيانات Mode 2
  const processMode2Data = (data, channel) => {
    const allBeats = [
      ...(data.beat_data?.normal_beats || []),
      ...(data.abnormal_beats || []),
    ].sort((a, b) => a.beat_index - b.beat_index);

    let combinedSignal = [];
    allBeats.forEach((beat) => {
      if (beat.signal && Array.isArray(beat.signal)) {
        combinedSignal = [...combinedSignal, ...beat.signal];
      }
    });

    const samplingRate = 360;

    return {
      signals: [combinedSignal],
      channels: [channel],
      sampling_rate: samplingRate,
      duration: combinedSignal.length / samplingRate,
      original_data: data,
      beats: allBeats,
    };
  };

  // إنشاء بيانات محاكاة
  const createMockData = () => {
    const samplingRate = 360;
    const duration = 30;
    const signalLength = duration * samplingRate;

    const mockSignal = [];
    for (let i = 0; i < signalLength; i++) {
      const t = i / samplingRate;

      // نبضات قلب منتظمة مع بعض الاختلافات العشوائية
      const baseHeartbeat =
        Math.sin(2 * Math.PI * 1.2 * t) *
          Math.exp(-Math.pow((t % 0.8) - 0.3, 2) * 100) +
        Math.sin(2 * Math.PI * 0.5 * t) *
          0.3 *
          Math.exp(-Math.pow((t % 0.8) - 0.6, 2) * 50);

      // نضيف اختلافات عشوائية كل 5 ثواني
      const variation =
        i % (5 * samplingRate) < 0.5 * samplingRate
          ? Math.random() * 0.8 - 0.4
          : 0;

      mockSignal.push(baseHeartbeat + variation);
    }

    return {
      signals: [mockSignal],
      channels: channels,
      sampling_rate: samplingRate,
      duration: duration,
      is_mock: true,
    };
  };

  // تهيئة بيانات XOR
  const initializeXOR = (data) => {
    const samplingRate = data.sampling_rate;
    const chunkSamples = Math.floor(timeChunk * samplingRate);

    if (
      !data.signals ||
      data.signals.length === 0 ||
      data.signals[0].length === 0
    ) {
      setError("No signal data available");
      return;
    }

    const signal = data.signals[0];
    const chunks = [];

    for (let i = 0; i < signal.length; i += chunkSamples) {
      const chunk = {
        startIndex: i,
        endIndex: i + chunkSamples,
        startTime: i / samplingRate,
        endTime: (i + chunkSamples) / samplingRate,
        data: [signal.slice(i, i + chunkSamples)],
      };

      if (chunk.data[0].length > 0) {
        chunks.push(chunk);
      }
    }

    console.log(`✅ Created ${chunks.length} chunks of ${timeChunk}s each`);
    setXorData(chunks);
    setCurrentTime(0);
  };

  // تطبيق XOR بصورة بسيطة وواضحة
  const applyXOR = (chunks, currentIndex) => {
    if (chunks.length === 0 || currentIndex < 1) return [];

    const currentChunk = chunks[currentIndex];
    const previousChunk = chunks[currentIndex - 1];

    const xorResult = currentChunk.data.map((channelData, channelIdx) => {
      const prevChannelData = previousChunk.data[channelIdx] || [];
      const minLength = Math.min(channelData.length, prevChannelData.length);

      const result = [];
      let differentPoints = 0;

      for (let i = 0; i < minLength; i++) {
        const currentVal = channelData[i];
        const prevVal = prevChannelData[i];

        if (Math.abs(currentVal - prevVal) < similarityThreshold) {
          result.push(0); // متشابهة → تختفي
        } else {
          result.push(currentVal); // مختلفة → تظهر
          differentPoints++;
        }
      }

      console.log(
        `🔍 Chunk ${currentIndex}: ${differentPoints}/${minLength} points different`
      );

      return result;
    });

    return xorResult;
  };

  // تشغيل/إيقاف العرض
  const togglePlay = () => {
    if (!ecgData || xorData.length === 0) return;

    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const intervalTime = 1000 / speed;

      playIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const nextTime = prev + 1;
          if (nextTime >= xorData.length) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return nextTime;
        });
      }, intervalTime);
    }
  };

  // استخدام بيانات محاكاة
  const useMockData = () => {
    setLoading(true);
    setTimeout(() => {
      const mockData = createMockData();
      setEcgData(mockData);
      initializeXOR(mockData);
      setLoading(false);
      console.log("✅ Using mock ECG data for demonstration");
    }, 1000);
  };

  // رسم XOR Viewer
  const renderXORViewer = () => {
    if (!ecgData || xorData.length === 0 || currentTime >= xorData.length) {
      return (
        <div className="mode6-no-data">
          <p>📭 No XOR data available</p>
        </div>
      );
    }

    const samplingRate = ecgData.sampling_rate;
    const currentChunk = xorData[currentTime];

    const plotData = [];

    if (currentTime > 0) {
      const xorResult = applyXOR(xorData, currentTime);

      xorResult.forEach((channelXOR, channelIdx) => {
        const xValues = Array.from(
          { length: channelXOR.length },
          (_, i) => currentChunk.startTime + i / samplingRate
        );

        const differentPoints = channelXOR.filter((val) => val !== 0).length;
        const totalPoints = channelXOR.length;
        const similarityPercent = (
          ((totalPoints - differentPoints) / totalPoints) *
          100
        ).toFixed(1);

        plotData.push({
          x: xValues,
          y: channelXOR,
          mode: "lines",
          type: "scatter",
          name: `🚨 XOR Result (${similarityPercent}% similar)`,
          line: {
            color: "#FF0000",
            width: 4,
          },
        });
      });
    }

    currentChunk.data.forEach((channelData, channelIdx) => {
      const xValues = Array.from(
        { length: channelData.length },
        (_, i) => currentChunk.startTime + i / samplingRate
      );

      plotData.push({
        x: xValues,
        y: channelData,
        mode: "lines",
        type: "scatter",
        name: `📊 Current Signal`,
        line: {
          color: "#00FF00",
          width: 1,
          dash: "dot",
        },
        opacity: 0.3,
      });
    });

    const plotLayout = {
      title: {
        text: `🔄 XOR Graph - Chunk ${currentTime + 1}/${
          xorData.length
        } (${timeChunk}s each)`,
        font: { size: 16, color: "white" },
      },
      xaxis: {
        title: { text: "Time (seconds)", font: { color: "white" } },
        color: "white",
        gridcolor: "#444",
        showline: true,
        linecolor: "white",
        range: [currentChunk.startTime, currentChunk.endTime],
      },
      yaxis: {
        title: { text: "Amplitude (mV)", font: { color: "white" } },
        color: "white",
        gridcolor: "#444",
        showline: true,
        linecolor: "white",
      },
      paper_bgcolor: "#1f2937",
      plot_bgcolor: "#111827",
      width: 800,
      height: 500,
      margin: { t: 60, r: 40, b: 80, l: 80 },
      showlegend: true,
      legend: {
        font: { color: "white" },
        bgcolor: "rgba(0,0,0,0.5)",
        bordercolor: "#666",
      },
    };

    return (
      <div className="mode6-xor-viewer">
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

  // رسم Cumulative XOR
  const renderCumulativeXOR = () => {
    if (!ecgData || xorData.length === 0) {
      return null;
    }

    const samplingRate = ecgData.sampling_rate;
    const allXORData = [];

    for (let i = 1; i <= Math.min(currentTime, xorData.length - 1); i++) {
      const xorResult = applyXOR(xorData, i);
      const chunk = xorData[i];

      xorResult.forEach((channelXOR, channelIdx) => {
        const xValues = Array.from(
          { length: channelXOR.length },
          (_, j) => chunk.startTime + j / samplingRate
        );

        const differentPoints = channelXOR.filter((val) => val !== 0).length;

        if (differentPoints > 0) {
          allXORData.push({
            x: xValues,
            y: channelXOR,
            mode: "lines",
            type: "scatter",
            name: `Chunk ${i}`,
            line: {
              color: "#FF6B6B",
              width: 2,
            },
            opacity: 0.6,
            showlegend: false,
          });
        }
      });
    }

    if (allXORData.length === 0) {
      return (
        <div className="mode6-no-data">
          <p>📊 No different segments found yet</p>
          <p className="mode6-hint">
            Different segments will appear here as XOR progresses
          </p>
        </div>
      );
    }

    const plotLayout = {
      title: {
        text: `📊 Cumulative XOR - ${allXORData.length} Different Segments`,
        font: { size: 16, color: "white" },
      },
      xaxis: {
        title: { text: "Time (seconds)", font: { color: "white" } },
        color: "white",
        gridcolor: "#444",
        showline: true,
        linecolor: "white",
      },
      yaxis: {
        title: { text: "Amplitude (mV)", font: { color: "white" } },
        color: "white",
        gridcolor: "#444",
        showline: true,
        linecolor: "white",
      },
      paper_bgcolor: "#1f2937",
      plot_bgcolor: "#111827",
      width: 800,
      height: 400,
      margin: { t: 60, r: 40, b: 80, l: 80 },
      showlegend: false,
    };

    return (
      <div className="mode6-cumulative-xor">
        <Plot
          data={allXORData}
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
    if (ecgData) {
      initializeXOR(ecgData);
    }
  }, [timeChunk]);

  useEffect(() => {
    if (ecgData && xorData.length > 0) {
      const reprocessedData = processECGData(
        ecgData.original_data || ecgData,
        channels[0]
      );
      setEcgData(reprocessedData);
      initializeXOR(reprocessedData);
    }
  }, [similarityThreshold]);

  useEffect(() => {
    if (isPlaying && playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      const intervalTime = 1000 / speed;
      playIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const nextTime = prev + 1;
          if (nextTime >= xorData.length) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return nextTime;
        });
      }, intervalTime);
    }
  }, [speed]);

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="mode6-container">
      <div className="mode6-header">
        <button className="mode6-back-button" onClick={() => navigate("/")}>
          🏠 Back to Home
        </button>
        <h1 className="mode6-title">🔄 XOR Graph - ECG Signal Viewer</h1>
        <p className="mode6-subtitle">
          Visualize ECG with XOR-based chunk comparison
        </p>
      </div>

      <div className="mode6-patient-info">
        <div className="mode6-patient-item">
          <div className="mode6-patient-label">Patient</div>
          <div className="mode6-patient-value">
            {selectedPatient || "Not selected"}
          </div>
        </div>
        <div className="mode6-patient-item">
          <div className="mode6-patient-label">Recording</div>
          <div className="mode6-patient-value">
            {selectedRecording || "Not selected"}
          </div>
        </div>
        <div className="mode6-patient-item">
          <div className="mode6-patient-label">Channel</div>
          <div className="mode6-patient-value">
            {channels.map((c) => c.toUpperCase()).join(", ")}
          </div>
        </div>
      </div>

      {(!selectedPatient || !selectedRecording) && (
        <div className="mode6-warning">
          ⚠️ Please select patient and recording from Home page
        </div>
      )}

      <div className="mode6-content">
        <div className="mode6-controls-panel">
          <h3 className="mode6-controls-title">🎮 XOR Viewer Controls</h3>

          <div className="mode6-setting-group">
            <label className="mode6-setting-label">📊 ECG Channel</label>
            <select
              className="mode6-setting-select"
              value={channels[0]}
              onChange={(e) => setChannels([e.target.value])}
              disabled={loading}
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

          <div className="mode6-setting-group">
            <label className="mode6-setting-label">
              ⏱️ Time Chunk: {timeChunk}s
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={timeChunk}
              onChange={(e) => setTimeChunk(parseFloat(e.target.value))}
              className="mode6-setting-slider"
              disabled={loading || isPlaying}
            />
            <div className="mode6-labels">
              <span>Short</span>
              <span>Long</span>
            </div>
          </div>

          <div className="mode6-setting-group">
            <label className="mode6-setting-label">
              🎚️ Similarity Threshold: {similarityThreshold.toFixed(3)}
            </label>
            <input
              type="range"
              min="0.005"
              max="0.1"
              step="0.005"
              value={similarityThreshold}
              onChange={(e) =>
                setSimilarityThreshold(parseFloat(e.target.value))
              }
              className="mode6-setting-slider"
              disabled={loading}
            />
            <div className="mode6-labels">
              <span>More Sensitive</span>
              <span>Less Sensitive</span>
            </div>
            <p className="mode6-hint">Lower = More differences detected</p>
          </div>

          <div className="mode6-setting-group">
            <label className="mode6-setting-label">
              ⚡ Playback Speed: {speed}x
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="mode6-setting-slider"
              disabled={!isPlaying}
            />
          </div>

          <div className="mode6-control-buttons">
            <button
              className="mode6-load-button"
              onClick={fetchECGData}
              disabled={!selectedPatient || !selectedRecording || loading}
            >
              {loading ? "🔄 Loading..." : "📥 Load Real ECG Data"}
            </button>

            <button
              className={`mode6-play-button ${isPlaying ? "playing" : ""}`}
              onClick={togglePlay}
              disabled={!ecgData || xorData.length === 0}
            >
              {isPlaying ? "⏸️ Pause" : "▶️ Play XOR"}
            </button>

            <button
              className="mode6-reset-button"
              onClick={() => setCurrentTime(0)}
              disabled={!ecgData || isPlaying}
            >
              🔄 Reset
            </button>
          </div>

          {ecgData && (
            <div className="mode6-info-panel">
              <h4>📈 Signal Info</h4>
              <p>Sampling Rate: {ecgData.sampling_rate} Hz</p>
              <p>Total Duration: {ecgData.duration?.toFixed(1)}s</p>
              <p>Chunks: {xorData.length}</p>
              <p>
                Current: {currentTime + 1}/{xorData.length}
              </p>
              {ecgData.is_mock && <p>🎭 Using Demo Data</p>}
            </div>
          )}
        </div>

        <div className="mode6-display-container">
          {loading && (
            <div className="mode6-loading-container">
              <div className="mode6-spinner"></div>
              <p className="mode6-loading-text">Loading ECG data...</p>
            </div>
          )}

          {error && (
            <div className="mode6-error-container">
              <p className="mode6-error-text">❌ {error}</p>
              <div className="mode6-error-buttons">
                <button className="mode6-retry-button" onClick={fetchECGData}>
                  🔄 Retry Real Data
                </button>
              </div>
            </div>
          )}

          {!selectedPatient || !selectedRecording ? (
            <div className="mode6-placeholder-container">
              <p className="mode6-placeholder-text">
                👈 Please select patient and recording from Home page
              </p>
            </div>
          ) : !ecgData ? (
            <div className="mode6-placeholder-container">
              <p className="mode6-placeholder-text">📡 No ECG data loaded</p>
            </div>
          ) : (
            <div className="mode6-display-content">
              <div className="mode6-xor-section">
                <h3 className="mode6-section-title">🔄 XOR Graph Viewer</h3>
                {renderXORViewer()}

                <div className="mode6-progress-section">
                  <input
                    type="range"
                    min="0"
                    max={xorData.length - 1}
                    value={currentTime}
                    onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                    className="mode6-progress-slider"
                    disabled={isPlaying}
                  />
                  <div className="mode6-progress-labels">
                    <span>Start: 0s</span>
                    <span>
                      Current:{" "}
                      {(currentTime * timeChunk + timeChunk / 2).toFixed(1)}s
                    </span>
                    <span>End: {(xorData.length * timeChunk).toFixed(1)}s</span>
                  </div>
                </div>
              </div>

              <div className="mode6-cumulative-section">
                <h3 className="mode6-section-title">📊 Cumulative XOR View</h3>
                {renderCumulativeXOR()}
              </div>

              <div className="mode6-explanation">
                <h4>🔍 How XOR Graph Works:</h4>
                <ul>
                  <li>
                    ✅ <strong>Signal divided</strong> into time chunks (
                    {timeChunk}s each)
                  </li>
                  <li>
                    ✅ <strong>Each chunk</strong> is compared to previous one
                  </li>
                  <li>
                    ✅ <strong>Identical parts</strong> erase each other (become
                    zero)
                  </li>
                  <li>
                    ✅ <strong>Different parts</strong> remain visible as red
                    lines
                  </li>
                  <li>
                    🎯 <strong>Result</strong>: Only changing patterns are
                    displayed
                  </li>
                  <li>
                    💡 <strong>Tip</strong>: Use smaller chunks and lower
                    threshold for more sensitivity
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
