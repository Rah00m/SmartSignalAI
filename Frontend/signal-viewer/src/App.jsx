import React, { useEffect, useState } from "react";
import Mode1 from "./components/ECG/mode1";
import "./App.css";

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl =
      import.meta.env.VITE_API_URL +
      "/ecg/mode1/signal?channel=MLII&offset=0&length=500";

    const fetchData = async () => {
      try {
        const response = await fetch(apiUrl);
        const jsonData = await response.json();
        console.log("Fetched Data from API:", jsonData); 
        setData(jsonData);
      } catch (error) {
        console.error("Error fetching ECG data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading ECG data...</p>;
  if (!data) return <p>No data available.</p>;

  const signalData = Array.isArray(data) ? data[0] : data;

  return (
    <>
      {/* Header فوق الصفحة */}
      <header className="app-header">
        <h1 className="app-title">SmartSignalAI</h1>
      </header>

      {/* باقي محتوى الصفحة */}
      <div className="app-container p-6">
        <Mode1 data={signalData} />
      </div>
    </>
  );
}

export default App;
