
// import React, { useState, useEffect } from "react";
// import Plot from "react-plotly.js";
// import "./mode1.css";
// import { useNavigate } from "react-router-dom";

// export default function Mode1({ onDataFetched }) {
//     const navigate = useNavigate();
//   const [patients, setPatients] = useState([]);
//   const [selectedPatient, setSelectedPatient] = useState("");
//   const [recordings, setRecordings] = useState([]);
//   const [selectedRecording, setSelectedRecording] = useState("");

//   const [channel, setChannel] = useState("I");
//   const [length, setLength] = useState(200);
//   const [offset, setOffset] = useState(0);

//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // Get all patients on load
//   useEffect(() => {
//     const fetchPatients = async () => {
//       console.log("Fetching patients...");
//       try {
//         const res = await fetch(`${import.meta.env.VITE_API_URL}/ecg/mode1/patients`);
//         const json = await res.json();
//         console.log("Patients fetched:", json);
//         if (json.patients) {
//           setPatients(json.patients);
//           console.log("Patients state updated:", json.patients);
//         }
//       } catch (error) {
//         console.error("Error fetching patients:", error);
//       }
//     };

//     fetchPatients();
//   }, []);

//   // Get recordings when patient is selected
//   useEffect(() => {
//     if (!selectedPatient) {
//       console.log("No patient selected yet.");
//       setRecordings([]);
//       setSelectedRecording("");
//       return;
//     }

//     const fetchRecordings = async () => {
//       console.log(`Fetching recordings for patient: ${selectedPatient}`);
//       try {
//         const res = await fetch(`${import.meta.env.VITE_API_URL}/ecg/mode1/records?patient=${selectedPatient}`);
//         const json = await res.json();
//         console.log("Recordings fetched:", json);
//         if (json.records) {
//           const recs = json.records.map((r) => r.recording);
//           setRecordings(recs);
//           console.log("Recordings state updated:", recs);
//           setSelectedRecording("");
//         } else {
//           setRecordings([]);
//           setSelectedRecording("");
//           console.log("No recordings found for this patient.");
//         }
//       } catch (error) {
//         console.error("Error fetching recordings:", error);
//         setRecordings([]);
//         setSelectedRecording("");
//       }
//     };

//     fetchRecordings();
//   }, [selectedPatient]);

//   // Fetch ECG signal
//   const fetchData = async () => {
//     if (!selectedPatient || !selectedRecording) {
//       console.log("Patient or recording not selected, cannot fetch data.");
//       return;
//     }

//     setLoading(true);
//     setData(null);
//     console.log("Fetching ECG data...");

//     const lowerChannel = channel.toLowerCase();
//     const apiUrl = `${import.meta.env.VITE_API_URL}/ecg/mode1/signal?patient=${selectedPatient}&recording=${selectedRecording}&channel=${lowerChannel}&offset=${offset}&length=${length}`;

//     console.log("API URL:", apiUrl);

//     try {
//       const response = await fetch(apiUrl);
//       const jsonData = await response.json();

//       console.log("Raw response data:", jsonData);

//       if (!response.ok) {
//         console.error("Server responded with error:", jsonData);
//         setData(null);
//       } else {
//         setData(jsonData);
//         console.log("ECG data state updated.");
//          if (onDataFetched) {
//         onDataFetched(jsonData);
//       }
//       console.log("ECG data state updated and sent to parent.");
    
//       }
//     } catch (error) {
//       console.error("Error fetching ECG data:", error);
//       setData(null);
//     } finally {
//       setLoading(false);
//       console.log("Fetching ECG data finished.");
//     }
//   };

//   return (
//     <div className="mode1-container">
//             {/* Back Button */}
//       <button className="back-button" onClick={() => navigate("/")}>
//         Back
//       </button>
//       <h2 className="mode1-title">Signal Viewer</h2>

//       <div className="mode1-flex">
//         <div className="controls-container">
//           <div>
//             <label className="control-label">Patient:</label>
//             <select
//               className="control-select"
//               value={selectedPatient}
//               onChange={(e) => {
//                 setSelectedPatient(e.target.value);
//                 console.log("Selected patient changed to:", e.target.value);
//               }}
//             >
//               <option value="">-- Select Patient --</option>
//               {patients.map((patient) => (
//                 <option key={patient} value={patient}>
//                   {patient}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="control-label">Recording:</label>
//             <select
//               className="control-select"
//               value={selectedRecording}
//               onChange={(e) => {
//                 setSelectedRecording(e.target.value);
//                 console.log("Selected recording changed to:", e.target.value);
//               }}
//               disabled={!selectedPatient}
//             >
//               <option value="">-- Select Recording --</option>
//               {recordings.map((rec) => (
//                 <option key={rec} value={rec}>
//                   {rec}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="control-label">Channel:</label>
//             <select
//               className="control-select"
//               value={channel}
//               onChange={(e) => {
//                 setChannel(e.target.value);
//                 console.log("Selected channel changed to:", e.target.value);
//               }}
//             >
//               <option value="I">I</option>
//               <option value="II">II</option>
//               <option value="III">III</option>
//               <option value="aVR">aVR</option>
//               <option value="aVL">aVL</option>
//               <option value="aVF">aVF</option>
//               <option value="V1">V1</option>
//               <option value="V2">V2</option>
//               <option value="V3">V3</option>
//               <option value="V4">V4</option>
//               <option value="V5">V5</option>
//               <option value="V6">V6</option>
//             </select>
//           </div>

//           <div>
//             <label className="control-label">Length:</label>
//             <input
//               type="number"
//               className="control-input"
//               value={length}
//               onChange={(e) => {
//                 setLength(Number(e.target.value));
//                 console.log("Length changed to:", e.target.value);
//               }}
//             />
//           </div>

//           <div>
//             <label className="control-label">Offset:</label>
//             <input
//               type="number"
//               className="control-input"
//               value={offset}
//               onChange={(e) => {
//                 setOffset(Number(e.target.value));
//                 console.log("Offset changed to:", e.target.value);
//               }}
//             />
//           </div>

//           <button
//             className="control-button"
//             onClick={fetchData}
//             disabled={!selectedPatient || !selectedRecording}
//           >
//             Fetch ECG
//           </button>
//         </div>

//         <div className="plot-container">
//           {loading && <p className="mode1-loading">Loading ECG data...</p>}

//           {data && data.x && data.y && data.x.length > 0 && data.y.length > 0 ? (
//             <Plot
//               data={[
//                 {
//                   x: data.x,
//                   y: data.y,
//                   type: "scatter",
//                   mode: "lines",
//                   line: { color: "red" },
//                 },
//               ]}
//               layout={{
//                 width: "100%",
//                 height: 400,
//                 title: `ECG Signal (${channel})`,
//                 xaxis: { title: "Time" },
//                 yaxis: { title: "Voltage (mV)" },
//                 paper_bgcolor: "#1e3a8a",
//                 plot_bgcolor: "#1e3a8a",
//                 font: { color: "white" },
//               }}
//             />
//           ) : (
//             !loading && <p className="mode1-loading">No valid ECG data available.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { useNavigate } from 'react-router-dom';
import { useECG } from './ecgContext'; // استيراد useECG
import './mode1.css';

export default function Mode1() {
  const navigate = useNavigate();
  const { selectedPatient, setSelectedPatient, selectedRecording, setSelectedRecording, ecgData, setEcgData } = useECG(); // استخدام useECG
  const [patients, setPatients] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [channel, setChannel] = useState("I");
  const [length, setLength] = useState(200);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  // جلب جميع المرضى عند تحميل المكون
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/ecg/mode1/patients`);
        const json = await res.json();
        if (json.patients) {
          setPatients(json.patients);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, []);

  // جلب التسجيلات عندما يتم اختيار مريض
  useEffect(() => {
    if (!selectedPatient) {
      setRecordings([]);
      setSelectedRecording("");
      return;
    }

    const fetchRecordings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/ecg/mode1/records?patient=${selectedPatient}`);
        const json = await res.json();
        if (json.records) {
          const recs = json.records.map((r) => r.recording);
          setRecordings(recs);
        }
      } catch (error) {
        console.error("Error fetching recordings:", error);
      }
    };

    fetchRecordings();
  }, [selectedPatient]);

  // جلب بيانات ECG
  const fetchData = async () => {
    if (!selectedPatient || !selectedRecording) {
      return;
    }

    setLoading(true);
    const lowerChannel = channel.toLowerCase();
    const apiUrl = `${import.meta.env.VITE_API_URL}/ecg/mode1/signal?patient=${selectedPatient}&recording=${selectedRecording}&channel=${lowerChannel}&offset=${offset}&length=${length}`;

    try {
      const response = await fetch(apiUrl);
      const jsonData = await response.json();

      if (response.ok) {
        setEcgData(jsonData); // حفظ البيانات في Context
      } else {
        setEcgData(null); // في حال فشل الطلب
      }
    } catch (error) {
      console.error("Error fetching ECG data:", error);
      setEcgData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mode1-container">
      {/* زر العودة */}
      <button className="back-button" onClick={() => navigate("/")}>
        Back
      </button>
      <h2 className="mode1-title">Signal Viewer</h2>

      <div className="mode1-flex">
        <div className="controls-container">
          {/* اختيار المريض */}
          <div>
            <label className="control-label">Patient:</label>
            <select
              className="control-select"
              value={selectedPatient || ""}
              onChange={(e) => setSelectedPatient(e.target.value)}
            >
              <option value="">-- Select Patient --</option>
              {patients.map((patient) => (
                <option key={patient} value={patient}>
                  {patient}
                </option>
              ))}
            </select>
          </div>

          {/* اختيار التسجيل */}
          <div>
            <label className="control-label">Recording:</label>
            <select
              className="control-select"
              value={selectedRecording || ""}
              onChange={(e) => setSelectedRecording(e.target.value)}
              disabled={!selectedPatient}
            >
              <option value="">-- Select Recording --</option>
              {recordings.map((rec) => (
                <option key={rec} value={rec}>
                  {rec}
                </option>
              ))}
            </select>
          </div>

          {/* اختيار القناة */}
          <div>
            <label className="control-label">Channel:</label>
            <select
              className="control-select"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
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

          {/* اختيار طول البيانات */}
          <div>
            <label className="control-label">Length:</label>
            <input
              type="number"
              className="control-input"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
            />
          </div>

          {/* اختيار الإزاحة */}
          <div>
            <label className="control-label">Offset:</label>
            <input
              type="number"
              className="control-input"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
            />
          </div>

          {/* زر جلب بيانات ECG */}
          <button
            className="control-button"
            onClick={fetchData}
            disabled={!selectedPatient || !selectedRecording}
          >
            Fetch ECG
          </button>
        </div>

        {/* عرض الرسم البياني */}
        <div className="plot-container">
          {loading && <p className="mode1-loading">Loading ECG data...</p>}
          {ecgData && ecgData.x && ecgData.y && ecgData.x.length > 0 && ecgData.y.length > 0 ? (
            <Plot
              data={[{ x: ecgData.x, y: ecgData.y, type: "scatter", mode: "lines", line: { color: "red" } }]}
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
            !loading && <p className="mode1-loading">No valid ECG data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
