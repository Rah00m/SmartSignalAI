// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// import Mode1 from "./components/ECG/mode1";
// import Mode4 from "./components/ECG/mode4";
// import ECGHome from "./components/ECG/ecg_home"; // الصفحة الرئيسية
// import "./App.css"; // استيراد التنسيقات

// function App() {
//   const [signalData, setSignalData] = useState(null);

//   const handleDataFetched = (data) => {
//     setSignalData(data);
//     console.log("Data received from Mode1:", data);
//   };

//   return (
//     <Router>
//             <div className="app-header">
//         <h1 className="app-title">SmartSignalAI</h1>
//       </div>
//       <Routes>
//         {/* الصفحة الرئيسية */}
//         <Route path="/" element={<ECGHome />} />

//         {/* رابط Mode1: يحتوي على دالة استقبال البيانات */}
//         <Route path="/mode1" element={<Mode1 onDataFetched={handleDataFetched} />} />

//         {/* رابط Mode4: يعرض البيانات القادمة من Mode1 */}
//         <Route
//           path="/mode4"
//           element={
//             signalData ? (
//               <Mode4 signalData={signalData} />
//             ) : (
//               <p style={{ textAlign: "center", marginTop: "50px" }}>
//                 ⚠️ No ECG data available. Please fetch data from Mode 1 first.
//               </p>
//             )
//           }
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ECG Components (existing)
import Mode1 from "./components/ECG/mode1";
import Mode3 from "./components/ECG/mode3";
import Mode4 from "./components/ECG/mode4";

// New Main Components
import MainHome from "./components/MainHome";
import MedicalSignals from "./components/Medical/MedicalSignals";
import AudioSignals from "./components/Audio/AudioSignals";
import RadarSignals from "./components/Radar/RadarSignals"; // ✅ Now this will work

// ECG specific (keep for backward compatibility)
import ECGHome from "./components/ECG/ecg_home";
import { ECGProvider } from './components/ECG/ecgContext';

import "./App.css";

function App() {
  const [signalData, setSignalData] = useState(null);

  const handleDataFetched = (data) => {
    setSignalData(data);
    console.log("Data received:", data);
  };

  return (
    <ECGProvider>
      <Router>
        <div className="app-header">
          <h1 className="app-title">SmartSignalAI</h1>
        </div>
        <Routes>
          {/* Main Home Page */}
          <Route path="/" element={<MainHome />} />
          
          {/* Medical Signals Section */}
          <Route path="/medical" element={<MedicalSignals />} />
          <Route path="/medical/ecg" element={<ECGHome onDataFetched={handleDataFetched} />} />
          <Route path="/medical/ecg/mode1" element={<Mode1 onDataFetched={handleDataFetched} />} />
          <Route path="/medical/ecg/mode3" element={<Mode3 signalData={signalData} />} />
          <Route path="/medical/ecg/mode4" element={<Mode4 signalData={signalData} />} />
          
          {/* Audio Signals Section */}
          <Route path="/audio" element={<AudioSignals />} />
          
          {/* Radar Signals Section */}
          <Route path="/radar" element={<RadarSignals />} />
          
          {/* Legacy routes for backward compatibility */}
          <Route path="/ecg" element={<ECGHome onDataFetched={handleDataFetched} />} />
          <Route path="/mode1" element={<Mode1 onDataFetched={handleDataFetched} />} />
          <Route path="/mode3" element={<Mode3 signalData={signalData} />} />
          <Route path="/mode4" element={<Mode4 signalData={signalData} />} />
        </Routes>
      </Router>
    </ECGProvider>
  );
}

export default App;
