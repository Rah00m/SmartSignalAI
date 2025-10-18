// import { createContext, useState, useContext } from "react";

// const ECGContext = createContext();

// export const ECGProvider = ({ children }) => {
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [selectedRecording, setSelectedRecording] = useState(null);
//   const [ecgData, setEcgData] = useState(null);
//   const [length, setLength] = useState(200);
//   const [offset, setOffset] = useState(0);
//   const [patients, setPatients] = useState([]);
//   const [recordings, setRecordings] = useState([]);

//   return (
//     <ECGContext.Provider
//       value={{
//         //
//         selectedPatient,
//         selectedRecording,
//         ecgData,
//         length,
//         offset,
//         patients,
//         recordings,

//         // دوال التحديث
//         setSelectedPatient,
//         setSelectedRecording,
//         setEcgData,
//         setLength,
//         setOffset,
//         setPatients,
//         setRecordings,
//       }}
//     >
//       {children}
//     </ECGContext.Provider>
//   );
// };

// export const useECG = () => {
//   const context = useContext(ECGContext);
//   if (!context) {
//     throw new Error("useECG must be used within an ECGProvider");
//   }
//   return context;
// };

//
import React, { createContext, useContext, useState } from "react";

const ECGContext = createContext();

export function ECGProvider({ children }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [ecgData, setEcgData] = useState(null);
  const [length, setLength] = useState(2000);
  const [offset, setOffset] = useState(0);
  const [patients, setPatients] = useState([]); // ✅ Added patients state
  const [recordings, setRecordings] = useState([]); // ✅ Added recordings state

  const value = {
    selectedPatient,
    setSelectedPatient,
    selectedRecording,
    setSelectedRecording,
    ecgData,
    setEcgData,
    length,
    setLength,
    offset,
    setOffset,
    patients, // ✅ Added to context
    setPatients, // ✅ Added to context
    recordings, // ✅ Added to context
    setRecordings, // ✅ Added to context
  };

  return <ECGContext.Provider value={value}>{children}</ECGContext.Provider>;
}

export function useECG() {
  const context = useContext(ECGContext);
  if (!context) {
    throw new Error("useECG must be used within an ECGProvider");
  }
  return context;
}
