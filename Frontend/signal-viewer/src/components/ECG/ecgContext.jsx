import { createContext, useState, useContext, useEffect } from "react";

const ECGContext = createContext();

export const ECGProvider = ({ children }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [ecgData, setEcgData] = useState(null);
  const [length, setLength] = useState(200);
  const [offset, setOffset] = useState(0);
  const [patients, setPatients] = useState([]);
  const [recordings, setRecordings] = useState([]);

  // يمكن إضافة useEffect هنا لجلب المرضى تلقائياً إذا أردت
  // أو يمكن جلبهم من المكون Home كما في الكود أعلاه

  return (
    <ECGContext.Provider
      value={{
        // البيانات
        selectedPatient,
        selectedRecording,
        ecgData,
        length,
        offset,
        patients,
        recordings,

        // دوال التحديث
        setSelectedPatient,
        setSelectedRecording,
        setEcgData,
        setLength,
        setOffset,
        setPatients,
        setRecordings,
      }}
    >
      {children}
    </ECGContext.Provider>
  );
};

export const useECG = () => {
  const context = useContext(ECGContext);
  if (!context) {
    throw new Error("useECG must be used within an ECGProvider");
  }
  return context;
};
