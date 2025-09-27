// ecgContext.js
import { createContext, useState, useContext } from 'react';

// إنشاء Context
const ECGContext = createContext();

// إنشاء Provider لتمرير البيانات عبر المكونات
export const ECGProvider = ({ children }) => {
  const [selectedPatient, setSelectedPatient] = useState(null); // مريض مختار
  const [selectedRecording, setSelectedRecording] = useState(null); // تسجيل ECG مختار
  const [ecgData, setEcgData] = useState(null); // بيانات ECG

  return (
    <ECGContext.Provider value={{
      selectedPatient,
      setSelectedPatient,
      selectedRecording,
      setSelectedRecording,
      ecgData,
      setEcgData
    }}>
      {children}
    </ECGContext.Provider>
  );
};

// استخدام Context في المكونات
export const useECG = () => useContext(ECGContext);
