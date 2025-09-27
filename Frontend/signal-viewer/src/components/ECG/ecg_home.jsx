import { useNavigate } from "react-router-dom";
import { useECG } from './ecgContext'; // استيراد useECG للوصول للبيانات من Context
import "../../App.css"; // استيراد التنسيقات العامة

function ECGHome() {
  const { ecgData } = useECG(); // استخدام useECG للوصول إلى بيانات ECG من Context
  const navigate = useNavigate(); // لتفعيل التنقل

  // طباعة بيانات ECG في الكونسول
  console.log("ECG Data in Home:", ecgData);

  // دالة التنقل إلى مود معين
  const navigateToMode = (mode) => {
    navigate(mode);
  };

  return (
    <div className="home-container">
      <h1 className="app-title">SmartSignalAI</h1>
      <div className="buttons-container">
        <button
          className="nav-button"
          onClick={() => navigateToMode("/mode1")}
        >
          Mode 1 - Signal Viewer
        </button>
        <button
          className="nav-button"
          onClick={() => navigateToMode("/mode2")}
        >
          Mode 2 - Example Mode
        </button>
        <button
          className="nav-button"
          onClick={() => navigateToMode("/mode3")}
        >
          Mode 3 - Another Mode
        </button>
        <button
          className="nav-button"
          onClick={() => navigateToMode("/mode4")}
        >
          Mode 4 - Recurrence Plot
        </button>
        <button
          className="nav-button"
          onClick={() => navigateToMode("/mode5")}
        >
          Mode 5 - Additional Mode
        </button>
      </div>
      
      {/* عرض بيانات ECG إذا كانت موجودة */}
      {ecgData && ecgData.x && ecgData.y && ecgData.x.length > 0 && ecgData.y.length > 0 ? (
        <div className="signal-display">
          <p>ECG Data is ready and stored!</p>
        </div>
      ) : (
        <p>No ECG data yet. Please fetch data from Mode 1.</p>
      )}
    </div>
  );
}

export default ECGHome;
