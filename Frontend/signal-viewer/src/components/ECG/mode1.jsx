import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import "./mode1.css";

export default function Mode1() {
  const [channel, setChannel] = useState("MLII");
  const [length, setLength] = useState(200);
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setData(null); // إفراغ البيانات السابقة
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/ecg/mode1/signal?channel=${channel}&offset=${offset}&length=${length}`;
      const response = await fetch(apiUrl);
      const jsonData = await response.json();
      setData(jsonData);
      localStorage.setItem("lastFetch", JSON.stringify({ channel, length, offset }));
    } catch (error) {
      console.error("Error fetching ECG data:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const lastFetch = JSON.parse(localStorage.getItem("lastFetch"));
    if (lastFetch) {
      setChannel(lastFetch.channel);
      setLength(lastFetch.length);
      setOffset(lastFetch.offset);
      fetchData();
    }
  }, []);

  return (
    <div className="mode1-container">
      <h2 className="mode1-title">Signal Viewer</h2>

      <div className="mode1-flex">
        <div className="controls-container">
          <div>
            <label className="control-label">Channel:</label>
            <select
              className="control-select"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="MLII">MLII</option>
              <option value="V5">V5</option>
            </select>
          </div>

          <div>
            <label className="control-label">Length:</label>
            <input
              type="number"
              className="control-input"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="control-label">Offset:</label>
            <input
              type="number"
              className="control-input"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
            />
          </div>

          <button className="control-button" onClick={fetchData}>
            Fetch ECG
          </button>
        </div>

        <div className="plot-container">
          {loading && <p className="mode1-loading">Loading ECG data...</p>}

          {data && data.x && data.y && data.x.length && data.y.length ? (
            <Plot
              data={[{
                x: data.x,
                y: data.y,
                type: "scatter",
                mode: "lines",
                line: { color: "red" },
              }]}
              layout={{
                width: "100%",
                height: 400,
                title: `ECG Signal (${channel})`,
                xaxis: { title: "Time" },
                yaxis: { title: "Voltage (mV)" },
                paper_bgcolor: "#1e3a8a",
                plot_bgcolor: "#1e3a8a",
                font: { color: "white" },
              }}
            />
          ) : (
            <p className="mode1-loading">No valid ECG data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
