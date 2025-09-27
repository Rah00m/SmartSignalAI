
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
import Mode1 from "./components/ECG/mode1";
import ECGHome from "./components/ECG/ecg_home"; // الصفحة الرئيسية
import { ECGProvider } from './components/ECG/ecgContext'; // استيراد ECGProvider
import Mode4 from "./components/ECG/mode4";  // مثال مود آخر
import "./App.css"; // استيراد التنسيقات

function App() {
  const [signalData, setSignalData] = useState(null);

  const handleDataFetched = (data) => {
    setSignalData(data);
    console.log("Data received from Mode1:", data);
  };

  return (
    <ECGProvider> 
      <Router>
        <div className="app-header">
          <h1 className="app-title">SmartSignalAI</h1>
        </div>
        <Routes>
          {/* الصفحة الرئيسية */}
          <Route path="/" element={<ECGHome onDataFetched={handleDataFetched} />} />

          {/* رابط Mode1: يحتوي على دالة استقبال البيانات */}
          <Route path="/mode1" element={<Mode1 onDataFetched={handleDataFetched} />} />

          {/* روابط المودات الأخرى */}
          <Route path="/mode4" element={<Mode4 signalData={signalData} />} />
        </Routes>
      </Router>
    </ECGProvider>
  );
}

export default App;
