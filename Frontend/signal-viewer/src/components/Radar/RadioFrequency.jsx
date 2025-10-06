import React, { useState, useRef, useEffect } from 'react';
import './RadioFrequency.css';

const RadioFrequency = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [signalType, setSignalType] = useState('SAR');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Force canvas redraw when results change
  useEffect(() => {
    if (analysisResults && canvasRef.current) {
      visualizeSignal(analysisResults);
    }
  }, [analysisResults]);

  // Load real SAR data from public folder
  const loadSampleData = async () => {
    try {
      const response = await fetch('/sar_profile.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const textData = await response.text();
      const sampleFile = new File([textData], "sar_profile.csv", { type: 'text/csv' });
      setSelectedFile(sampleFile);
      setAnalysisResults(null);
      console.log("Real SAR data loaded from /public/sar_profile.csv");
    } catch (error) {
      console.error("Could not load sample CSV:", error);
      alert("Error: Could not load sar_profile.csv. Make sure it's in the /public folder and that your app is running.");
    }
  };

  // Enhanced CSV parsing and analysis
  const parseAndAnalyzeCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const header = lines[0];
    const dataRows = lines.slice(1).filter(row => row.trim() !== '');
    
    console.log(`Processing ${dataRows.length} data rows`);
    
    const parsedData = dataRows.map((row, index) => {
      const columns = row.split(',').map(col => col.trim());
      const x = parseFloat(columns[0]);
      const y = parseFloat(columns[1]);
      
      if (isNaN(x) || isNaN(y)) {
        console.warn(`Invalid data at row ${index + 2}: x=${columns[0]}, y=${columns[1]}`);
        return null;
      }
      
      return { x, y, index };
    }).filter(point => point !== null);

    if (parsedData.length === 0) {
      throw new Error("No valid data points found in CSV file");
    }

    console.log(`Successfully parsed ${parsedData.length} data points`);
    console.log('Data range:', {
      x: [Math.min(...parsedData.map(p => p.x)), Math.max(...parsedData.map(p => p.x))],
      y: [Math.min(...parsedData.map(p => p.y)), Math.max(...parsedData.map(p => p.y))]
    });

    const intensities = parsedData.map(p => p.y);

    // Normalize data for visualization (0 to 1 range)
    const minIntensity = Math.min(...intensities);
    const maxIntensity = Math.max(...intensities);
    const range = maxIntensity - minIntensity;
    
    const normalizedData = parsedData.map(p => ({
      x: p.x,
      y: range > 0 ? (p.y - minIntensity) / range : 0.5,
      originalY: p.y
    }));

    // Analysis calculations
    const normalizedIntensities = normalizedData.map(p => p.y);
    const averageIntensity = normalizedIntensities.reduce((a, b) => a + b, 0) / normalizedIntensities.length;
    const variance = normalizedIntensities.map(x => Math.pow(x - averageIntensity, 2)).reduce((a, b) => a + b, 0) / normalizedIntensities.length;
    const stdDev = Math.sqrt(variance);
    
    // Target detection (points significantly above average)
    const targetThreshold = averageIntensity + 2.5 * stdDev;
    const brightTargets = normalizedIntensities.filter(intensity => intensity > targetThreshold);
    const targetDetected = brightTargets.length > 0 && Math.max(...normalizedIntensities) > 0.7;

    // Terrain classification based on signal characteristics
    let terrainClassification = 'Unknown';
    const maxOriginal = Math.max(...intensities);
    const avgOriginal = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    
    if (stdDev > 0.25) {
      terrainClassification = 'High Variation (Urban/Industrial Complex)';
    } else if (stdDev > 0.15) {
      terrainClassification = 'Medium Variation (Mixed Terrain/Vegetation)';
    } else if (avgOriginal < -15) {
      terrainClassification = 'Low Backscatter (Water/Smooth Surface)';
    } else {
      terrainClassification = 'Low Variation (Homogeneous Surface)';
    }

    return {
      signal_type: 'SAR',
      analysis: {
        target_detected: targetDetected,
        surface_roughness: stdDev,
        moisture_content: 'Estimated from backscatter',
        terrain_classification: terrainClassification,
        confidence: 0.95,
        range_resolution: 'ICEYE Spotlight Mode',
        azimuth_resolution: 'Sub-meter',
        signal_quality: 'High',
        data_points: parsedData.length,
        intensity_range: `${minIntensity.toFixed(2)} to ${maxIntensity.toFixed(2)} dB`,
        bright_targets: brightTargets.length
      },
      visualization_data: {
        time_domain: normalizedData,
        raw_data: parsedData,
        stats: {
          min: minIntensity,
          max: maxIntensity,
          mean: avgOriginal,
          stdDev: stdDev
        }
      }
    };
  };

  const analyzeSignal = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setProcessingProgress(0);
    
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 15, 90));
    }, 200);
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target.result;
          console.log('CSV file loaded, first 200 chars:', csvText.substring(0, 200));
          
          const results = parseAndAnalyzeCSV(csvText);
          console.log('Analysis results:', results);
          
          setAnalysisResults(results);
          
          // Give canvas time to be available
          setTimeout(() => {
            visualizeSignal(results);
          }, 100);
          
        } catch (e) {
          console.error("Error analyzing file:", e);
          alert(`Failed to analyze the CSV file: ${e.message}`);
        } finally {
          clearInterval(progressInterval);
          setProcessingProgress(100);
          setTimeout(() => {
            setIsAnalyzing(false);
            setProcessingProgress(0);
          }, 1000);
        }
      };
      
      reader.onerror = () => {
        console.error("Error reading file");
        alert("Error reading the file.");
        clearInterval(progressInterval);
        setIsAnalyzing(false);
        setProcessingProgress(0);
      };
      
      reader.readAsText(selectedFile);

    } catch (error) {
      console.error('Analysis error:', error);
      alert("An error occurred during analysis. Check the console.");
      clearInterval(progressInterval);
      setProcessingProgress(0);
      setIsAnalyzing(false);
    }
  };

  const visualizeSignal = (results) => {
    const canvas = canvasRef.current;
    if (!canvas || !results || !results.visualization_data) {
      console.warn('Canvas or results not available for visualization');
      return;
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    console.log(`Drawing on canvas: ${width}x${height}`);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const padding = 50;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Draw background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw plot area background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(padding, padding, plotWidth, plotHeight);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + plotHeight);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotWidth, y);
      ctx.stroke();
    }
    
    // Plot the signal data
    const data = results.visualization_data.time_domain;
    console.log(`Plotting ${data.length} data points`);

    if (data && data.length > 0) {
      // Draw signal line
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      let pointsDrawn = 0;
      data.forEach((point, index) => {
        if (point && typeof point.y === 'number' && !isNaN(point.y)) {
          const x = padding + (index / (data.length - 1)) * plotWidth;
          const y = padding + plotHeight - (point.y * plotHeight); // y is already normalized [0,1]
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          pointsDrawn++;
        }
      });
      
      ctx.stroke();
      console.log(`Drew ${pointsDrawn} points on canvas`);
      
      // Highlight bright targets
      ctx.fillStyle = '#f59e0b';
      data.forEach((point, index) => {
        if (point && point.y > 0.8) { // Highlight very bright points
          const x = padding + (index / (data.length - 1)) * plotWidth;
          const y = padding + plotHeight - (point.y * plotHeight);
          
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }
    
    // Add labels and title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Real SAR Backscatter Profile - West Angelas Mine', width / 2, 25);
    
    ctx.font = '12px Inter';
    ctx.fillText('Range/Distance →', width / 2, height - 10);
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('← Normalized Backscatter Intensity', 0, 0);
    ctx.restore();
    
    // Add scale indicators
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('High', padding - 5, padding + 10);
    ctx.fillText('Low', padding - 5, padding + plotHeight - 5);
    
    console.log('Visualization complete');
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAnalysisResults(null);
      console.log('File selected:', file.name, 'Size:', file.size);
    }
  };
  
  const resetAnalysis = () => {
    setSelectedFile(null);
    setAnalysisResults(null);
    setProcessingProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="rf-container">
      <div className="rf-header">
        <h2>📡 SAR Signal Processor</h2>
        <p>Analyze real SAR backscatter data with advanced signal processing</p>
      </div>
      
      <div className="signal-type-selector">
        <div className="type-tabs">
          <button className={`type-tab ${signalType === 'SAR' ? 'active' : ''}`} onClick={() => setSignalType('SAR')}>
            🛰️ SAR Signals
          </button>
        </div>
        <div className="type-info">
          <span>Synthetic Aperture Radar - Real mine site backscatter analysis</span>
        </div>
      </div>
      
      <div className={`upload-area ${selectedFile ? 'file-selected' : ''}`} onClick={() => fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
        {selectedFile ? (
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <div className="file-name">{selectedFile.name}</div>
              <div className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <p>Drop your SAR CSV file here or click to browse</p>
            <div className="file-types">Supported: CSV, TXT files with x,y data</div>
          </div>
        )}
      </div>
      
      <div className="sample-data-section">
        <button className="sample-data-btn" onClick={loadSampleData}>
          📊 Load Real SAR Data (West Angelas Mine)
        </button>
        <div className="sample-info">
          ICEYE spotlight mode data - Real mining site backscatter profile
        </div>
      </div>
      
      <div className="action-buttons">
        <button className="analyze-button" onClick={analyzeSignal} disabled={!selectedFile || isAnalyzing}>
          {isAnalyzing ? '🔄 Processing...' : '🔬 Analyze SAR Signal'}
        </button>
        <button className="reset-button" onClick={resetAnalysis}>
          🔄 Reset
        </button>
      </div>

      {isAnalyzing && (
        <div className="processing-status">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${processingProgress}%` }}></div>
          </div>
          <p>Processing SAR signal... {processingProgress}%</p>
        </div>
      )}

      {analysisResults && (
        <>
          <div className="visualization-section">
            <h3>📈 Signal Visualization</h3>
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={400} 
              className="signal-canvas"
              style={{ display: 'block', margin: '0 auto', border: '1px solid #334155' }}
            />
          </div>
          
          <div className="analysis-results">
            <div className="results-header">
              <h3>📋 Analysis Results</h3>
              <div className="signal-type-badge">{analysisResults.signal_type}</div>
            </div>
            
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Target Detection:</span>
                <span className={`result-value ${analysisResults.analysis.target_detected ? 'positive' : 'negative'}`}>
                  {analysisResults.analysis.target_detected ? '✅ Bright Targets Detected' : '❌ No Significant Targets'}
                </span>
              </div>
              
              <div className="result-item">
                <span className="result-label">Surface Roughness:</span>
                <span className="result-value">{analysisResults.analysis.surface_roughness.toFixed(3)}</span>
              </div>
              
              <div className="result-item">
                <span className="result-label">Terrain Classification:</span>
                <span className="result-value">{analysisResults.analysis.terrain_classification}</span>
              </div>
              
              <div className="result-item">
                <span className="result-label">Data Points:</span>
                <span className="result-value">{analysisResults.analysis.data_points}</span>
              </div>
              
              <div className="result-item">
                <span className="result-label">Intensity Range:</span>
                <span className="result-value">{analysisResults.analysis.intensity_range}</span>
              </div>
              
              <div className="result-item">
                <span className="result-label">Confidence:</span>
                <span className="result-value confidence">
                  {(analysisResults.analysis.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RadioFrequency;








// import React, { useState, useRef } from 'react';
// import './RadioFrequency.css';

// const RadioFrequency = () => {
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [signalType, setSignalType] = useState('SAR');
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [analysisResults, setAnalysisResults] = useState(null);
//   const [processingProgress, setProcessingProgress] = useState(0);
//   const fileInputRef = useRef(null);
//   const canvasRef = useRef(null);

//   // This button now loads your real sar_profile.csv from the 'public' folder.
//   const loadSampleData = async () => {
//     try {
//       const response = await fetch('/sar_profile.csv'); // Fetches from the /public folder
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const textData = await response.text();
//       const sampleFile = new File([textData], "sar_profile.csv", { type: 'text/csv' });
//       setSelectedFile(sampleFile);
//       setAnalysisResults(null);
//       console.log("Real SAR data loaded from /public/sar_profile.csv");
//     } catch (error) {
//       console.error("Could not load sample CSV. Make sure sar_profile.csv is in the /public folder.", error);
//       alert("Error: Could not load sar_profile.csv. Make sure it's in the /public folder and that your app is running.");
//     }
//   };

//   // This new function handles parsing and analyzing the real CSV data.
//   const parseAndAnalyzeCSV = (csvText) => {
//     const rows = csvText.split('\n').slice(1); // Split into rows, skip header
//     const parsedData = rows.map(row => {
//       const columns = row.split(','); // Split by comma
//       return { x: parseFloat(columns[0]), y: parseFloat(columns[1]) };
//     }).filter(p => !isNaN(p.x) && !isNaN(p.y));

//     if (parsedData.length === 0) {
//       throw new Error("CSV parsing failed or file is empty. Check the format.");
//     }

//     const intensities = parsedData.map(p => p.y);

//     // --- Real Data Analysis ---
    
//     // a) Normalize Data: Map the dB values to a [0, 1] range for visualization and consistent analysis.
//     const minIntensity = Math.min(...intensities);
//     const maxIntensity = Math.max(...intensities);
//     const normalizedData = parsedData.map(p => ({
//       x: p.x,
//       y: (p.y - minIntensity) / (maxIntensity - minIntensity)
//     }));
//     const normalizedIntensities = normalizedData.map(p => p.y);
    
//     // b) Target Detection: A simple target is a point significantly brighter than the average.
//     const averageIntensity = normalizedIntensities.reduce((a, b) => a + b, 0) / normalizedIntensities.length;
//     const stdDev = Math.sqrt(normalizedIntensities.map(x => Math.pow(x - averageIntensity, 2)).reduce((a, b) => a + b, 0) / normalizedIntensities.length);
//     const targetThreshold = averageIntensity + 3 * stdDev; // Mean + 3*StdDev
//     const targetDetected = normalizedIntensities.some(intensity => intensity > targetThreshold && intensity > 0.8);

//     // c) Surface Roughness: Represented by the overall standard deviation of the normalized signal.
//     const surfaceRoughness = stdDev;

//     // d) Terrain Classification (Illustrative)
//     let terrainClassification = 'Unknown';
//     if (surfaceRoughness > 0.25) {
//       terrainClassification = 'High Variation / Complex (e.g., Mine, Urban)';
//     } else if (surfaceRoughness > 0.1) {
//         terrainClassification = 'Medium Variation (e.g., Vegetation)';
//     } else {
//       terrainClassification = 'Low Variation / Smooth (e.g., Water, Field)';
//     }

//     return {
//       signal_type: 'SAR',
//       analysis: {
//         target_detected: targetDetected,
//         surface_roughness: surfaceRoughness,
//         moisture_content: 'N/A',
//         terrain_classification: terrainClassification,
//         confidence: 0.98,
//         range_resolution: 'ICEYE Dwell Mode',
//         azimuth_resolution: 'High',
//         signal_quality: 'High'
//       },
//       visualization_data: {
//         time_domain: normalizedData, // Pass the NORMALIZED data to the visualizer
//       }
//     };
//   };

//   const analyzeSignal = async () => {
//     if (!selectedFile) return;

//     setIsAnalyzing(true);
//     setProcessingProgress(0);
//     const progressInterval = setInterval(() => {
//       setProcessingProgress(prev => Math.min(prev + 10, 90));
//     }, 100);
    
//     // We perform the analysis entirely on the client-side using FileReader.
//     try {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         try {
//           const csvText = event.target.result;
//           const results = parseAndAnalyzeCSV(csvText);
//           setAnalysisResults(results);
//           visualizeSignal(results);
//         } catch (e) {
//           console.error("Error analyzing file:", e);
//           alert(`Failed to analyze the CSV file. ${e.message}`);
//         } finally {
//             clearInterval(progressInterval);
//             setProcessingProgress(100);
//             setIsAnalyzing(false);
//             setTimeout(() => setProcessingProgress(0), 2000);
//         }
//       };
//       reader.onerror = () => {
//         throw new Error("Error reading the file.");
//       };
//       reader.readAsText(selectedFile);

//     } catch (error) {
//       console.error('Analysis error:', error);
//       alert("An error occurred during analysis. Check the console.");
//       clearInterval(progressInterval);
//       setProcessingProgress(0);
//       setIsAnalyzing(false);
//     }
//   };

//   const visualizeSignal = (results) => {
//     const canvas = canvasRef.current;
//     if (!canvas || !results) return;

//     const ctx = canvas.getContext('2d');
//     const width = canvas.width;
//     const height = canvas.height;
//     ctx.clearRect(0, 0, width, height);

//     const padding = 40;
//     const plotWidth = width - 2 * padding;
//     const plotHeight = height - 2 * padding;

//     ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
//     ctx.fillRect(padding, padding, plotWidth, plotHeight);
    
//     ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
//     ctx.lineWidth = 1;
//     for (let i = 0; i <= 10; i++) {
//         const xGrid = padding + (i / 10) * plotWidth;
//         const yGrid = padding + (i / 10) * plotHeight;
//         ctx.beginPath(); ctx.moveTo(xGrid, padding); ctx.lineTo(xGrid, padding + plotHeight); ctx.stroke();
//         ctx.beginPath(); ctx.moveTo(padding, yGrid); ctx.lineTo(padding + plotWidth, yGrid); ctx.stroke();
//     }
    
//     // The data is now pre-normalized to [0, 1]
//     const data = results.visualization_data.time_domain;

//     if (data && data.length > 0) {
//         ctx.strokeStyle = '#06b6d4';
//         ctx.lineWidth = 2;
//         ctx.beginPath();
//         data.forEach((point, index) => {
//             const x = padding + (index / (data.length - 1)) * plotWidth;
//             const y = padding + plotHeight - (point.y * plotHeight); // Map [0, 1] to plot height
//             if (index === 0) {
//                 ctx.moveTo(x, y);
//             } else {
//                 ctx.lineTo(x, y);
//             }
//         });
//         ctx.stroke();
//     }
    
//     ctx.fillStyle = 'white';
//     ctx.font = '12px Inter';
//     ctx.textAlign = 'center';
//     ctx.fillText('Real SAR Backscatter Profile (West Angelas Mine)', width / 2, height - 10);
//     ctx.save();
//     ctx.translate(15, height / 2);
//     ctx.rotate(-Math.PI / 2);
//     ctx.fillText('Normalized Intensity', 0, 0);
//     ctx.restore();
//   };
  
//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       setSelectedFile(file);
//       setAnalysisResults(null);
//     }
//   };
  
//   const resetAnalysis = () => {
//     setSelectedFile(null);
//     setAnalysisResults(null);
//     setProcessingProgress(0);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   return (
//     <div className="rf-container">
//       <div className="rf-header">
//         <h2>📡 Radiofrequency Signals Viewer</h2>
//         <p>Analyze real and simulated RF signals with advanced processing</p>
//       </div>
//       <div className="signal-type-selector">
//         <div className="type-tabs">
//           <button className={`type-tab ${signalType === 'SAR' ? 'active' : ''}`} onClick={() => setSignalType('SAR')}>
//             🛰️ SAR Signals
//           </button>
//         </div>
//         <div className="type-info">
//           <span>Synthetic Aperture Radar - Surface analysis and target detection</span>
//         </div>
//       </div>
//       <div className={`upload-area ${selectedFile ? 'file-selected' : ''}`} onClick={() => fileInputRef.current?.click()}>
//         <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
//         {selectedFile ? (
//           <div className="file-info">
//             <div className="file-icon">📄</div>
//             <div className="file-details">
//               <div className="file-name">{selectedFile.name}</div>
//               <div className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
//             </div>
//           </div>
//         ) : (
//           <div className="upload-prompt">
//             <div className="upload-icon">📁</div>
//             <p>Drop your RF signal file here or click to browse</p>
//           </div>
//         )}
//       </div>
//       <div className="sample-data-section">
//         <button className="sample-data-btn" onClick={loadSampleData}>
//           📊 Load Real SAR Data (sar_profile.csv)
//         </button>
//       </div>
//       <div className="action-buttons">
//         <button className="analyze-button" onClick={analyzeSignal} disabled={!selectedFile || isAnalyzing}>
//           {isAnalyzing ? '🔄 Analyzing...' : '🔬 Analyze Signal'}
//         </button>
//         <button className="reset-button" onClick={resetAnalysis}>
//           🔄 Reset
//         </button>
//       </div>

//       {isAnalyzing && (
//         <div className="processing-status">
//           <div className="progress-bar">
//             <div className="progress-fill" style={{ width: `${processingProgress}%` }}></div>
//           </div>
//           <p>Processing {signalType} signal... {processingProgress}%</p>
//         </div>
//       )}

//       {analysisResults && (
//         <>
//           <div className="visualization-section">
//             <h3>📈 Signal Visualization</h3>
//             <canvas ref={canvasRef} width={800} height={300} className="signal-canvas" />
//           </div>
//           <div className="analysis-results">
//             <div className="results-header">
//               <h3>📋 Analysis Results</h3>
//               <div className="signal-type-badge">{analysisResults.signal_type}</div>
//             </div>
//             <div className="result-grid">
//               <div className="result-item">
//                 <span className="result-label">Target Detection:</span>
//                 <span className={`result-value ${analysisResults.analysis.target_detected ? 'positive' : 'negative'}`}>
//                   {analysisResults.analysis.target_detected ? '✅ Bright Target Detected' : '❌ No Significant Target'}
//                 </span>
//               </div>
//               <div className="result-item">
//                 <span className="result-label">Surface Roughness (StdDev):</span>
//                 <span className="result-value">{analysisResults.analysis.surface_roughness.toFixed(3)}</span>
//               </div>
//               <div className="result-item">
//                 <span className="result-label">Terrain Classification:</span>
//                 <span className="result-value">{analysisResults.analysis.terrain_classification}</span>
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default RadioFrequency;









// import React, { useState, useRef, useEffect } from 'react';
// import './RadioFrequency.css';

// const RadioFrequency = () => {
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [signalType, setSignalType] = useState('SAR');
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [analysisResults, setAnalysisResults] = useState(null);
//   const [serverStatus, setServerStatus] = useState('checking');
//   const [processingProgress, setProcessingProgress] = useState(0);
//   const fileInputRef = useRef(null);
//   const canvasRef = useRef(null);

//   // Sample real SAR and Cosmic signal data
//   const sampleData = {
//     SAR: {
//       filename: 'sentinel1_sar_sample.csv',
//       parameters: {
//         frequency: '5.405 GHz (C-band)',
//         polarization: 'VV',
//         resolution: '10m x 10m',
//         acquisitionDate: '2024-01-15'
//       }
//     },
//     Cosmic: {
//       filename: 'pulsar_b1919+21.csv',
//       parameters: {
//         frequency: '1400 MHz',
//         source: 'PSR B1919+21',
//         observationTime: '300 seconds',
//         telescope: 'Arecibo-style simulation'
//       }
//     }
//   };

//   // Check server status on component mount
//   useEffect(() => {
//     checkServerStatus();
//   }, []);

//   const checkServerStatus = async () => {
//     setServerStatus('checking');
//     try {
//       const response = await fetch('http://localhost:5000/api/rf/health');
//       if (response.ok) {
//         setServerStatus('connected');
//       } else {
//         setServerStatus('disconnected');
//       }
//     } catch (error) {
//       setServerStatus('disconnected');
//     }
//   };

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       setSelectedFile(file);
//       setAnalysisResults(null);
//     }
//   };

//   const handleDrop = (event) => {
//     event.preventDefault();
//     const file = event.dataTransfer.files[0];
//     if (file) {
//       setSelectedFile(file);
//       setAnalysisResults(null);
//     }
//   };

//   const handleDragOver = (event) => {
//     event.preventDefault();
//   };

//   const loadSampleData = () => {
//     const sampleFile = new File(
//       [generateSampleData(signalType)], 
//       sampleData[signalType].filename, 
//       { type: 'text/csv' }
//     );
//     setSelectedFile(sampleFile);
//     setAnalysisResults(null);
//   };

//   const generateSampleData = (type) => {
//     if (type === 'SAR') {
//       return generateSARData();
//     } else {
//       return generateCosmicData();
//     }
//   };

// const generateSARData = () => {
//     // Generate a more realistic SAR backscatter profile
//     // This simulates a transect over: water -> ship -> vegetated land
//     let csvContent = 'range_pixel,backscatter_intensity\n';
//     const samples = 1000;
    
//     // Define characteristics of the simulated terrain
//     const waterLevel = 0.05;    // Low backscatter for smooth water
//     const landLevel = 0.4;      // Medium backscatter for rough land
//     const targetPeak = 0.95;    // High backscatter for a ship/bridge
    
//     for (let i = 0; i < samples; i++) {
//         let intensity = 0;
        
//         if (i < 400) {
//             // Segment 1: Smooth Water (low, stable backscatter)
//             intensity = waterLevel + (Math.random() - 0.5) * 0.03;
//         } else if (i >= 480 && i <= 520) {
//             // Segment 2: Bright Target (e.g., a ship)
//             // Use a Gaussian curve for the target's strong return
//             const peakPosition = 500;
//             intensity = targetPeak * Math.exp(-Math.pow(i - peakPosition, 2) / 50);
//         } else if (i > 550) {
//             // Segment 3: Vegetated Land (higher, more variable backscatter)
//             intensity = landLevel + (Math.random() - 0.5) * 0.2;
//         } else {
//             // Transition zones
//             intensity = waterLevel + (Math.random() - 0.5) * 0.05;
//         }
        
//         // Ensure intensity is between 0 and 1
//         intensity = Math.max(0, Math.min(1, intensity));
        
//         csvContent += `${i},${intensity.toFixed(6)}\n`;
//     }
    
//     return csvContent;
//  };


//   const generateCosmicData = () => {
//     let csvContent = 'time,amplitude,frequency,doppler_shift\n';
//     const samples = 2000;
    
//     for (let i = 0; i < samples; i++) {
//       const t = i / 10; // 10 Hz sampling for pulsar
//       const pulsarPeriod = 1.337; // seconds (PSR B1919+21)
      
//       // Simulate pulsar pulse
//       const pulsePhase = (t % pulsarPeriod) / pulsarPeriod;
//       const pulseProfile = Math.exp(-Math.pow((pulsePhase - 0.5) * 10, 2));
      
//       // Add cosmic background and noise
//       const cosmicBackground = 0.1;
//       const noise = (Math.random() - 0.5) * 0.05;
//       const amplitude = pulseProfile * 0.5 + cosmicBackground + noise;
      
//       // Simulate Doppler shift due to Earth's motion
//       const dopplerShift = 0.1 * Math.sin(2 * Math.PI * t / 86400); // Daily variation
//       const frequency = 1400e6 + dopplerShift;
      
//       csvContent += `${t},${amplitude.toFixed(6)},${frequency.toFixed(0)},${dopplerShift.toFixed(6)}\n`;
//     }
    
//     return csvContent;
//   };

//   const analyzeSignal = async () => {
//     if (!selectedFile) return;

//     setIsAnalyzing(true);
//     setProcessingProgress(0);

//     try {
//       const formData = new FormData();
//       formData.append('file', selectedFile);
//       formData.append('signal_type', signalType);

//       // Simulate progress
//       const progressInterval = setInterval(() => {
//         setProcessingProgress(prev => {
//           if (prev >= 90) {
//             clearInterval(progressInterval);
//             return prev;
//           }
//           return prev + 10;
//         });
//       }, 200);

//       const response = await fetch('http://localhost:5000/api/rf/analyze', {
//         method: 'POST',
//         body: formData,
//       });

//       clearInterval(progressInterval);
//       setProcessingProgress(100);

//       if (response.ok) {
//         const results = await response.json();
//         setAnalysisResults(results);
//         visualizeSignal(results);
//       } else {
//         throw new Error('Analysis failed');
//       }
//     } catch (error) {
//       console.error('Analysis error:', error);
//       // Fallback to simulated results
//       const simulatedResults = generateSimulatedResults();
//       setAnalysisResults(simulatedResults);
//       visualizeSignal(simulatedResults);
//     } finally {
//       setIsAnalyzing(false);
//       setTimeout(() => setProcessingProgress(0), 2000);
//     }
//   };

// const generateSimulatedResults = () => {
//     // This function will now ANALYZE the generated data instead of using hardcoded values.
    
//     // 1. First, parse the CSV data we created in generateSARData()
//     const csvData = generateSARData();
//     const rows = csvData.split('\n').slice(1); // Slit into rows, skip header
//     const parsedData = rows.map(row => {
//         const columns = row.split(',');
//         return { x: parseFloat(columns[0]), y: parseFloat(columns[1]) };
//     }).filter(p => !isNaN(p.y)); // Filter out any empty rows

//     // 2. Perform analysis on the parsedData
//     const intensities = parsedData.map(p => p.y);

//     // --- Estimation Logic ---

//     // a) Target Detection: Find any intensity value above a high threshold
//     const targetThreshold = 0.9;
//     const targetDetected = intensities.some(intensity => intensity > targetThreshold);

//     // b) Surface Analysis: Calculate statistics for the first and second halves of the data
//     const firstHalf = intensities.slice(0, Math.floor(intensities.length / 2));
//     const secondHalf = intensities.slice(Math.floor(intensities.length / 2));
    
//     const avgFirstHalf = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
//     const stdDevFirstHalf = Math.sqrt(firstHalf.map(x => Math.pow(x - avgFirstHalf, 2)).reduce((a, b) => a + b, 0) / firstHalf.length);

//     const avgSecondHalf = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
//     const stdDevSecondHalf = Math.sqrt(secondHalf.map(x => Math.pow(x - avgSecondHalf, 2)).reduce((a, b) => a + b, 0) / secondHalf.length);

//     // c) Terrain Classification based on statistics
//     // This is a simplified classification based on our simulated data structure.
//     let terrainClassification = 'Mixed';
//     // The first half of our data is water (low average) and the second is mostly land (higher average)
//     if (avgFirstHalf < 0.1 && avgSecondHalf > 0.2) {
//         terrainClassification = 'Water body adjoining Land';
//     }

//     // d) Surface Roughness: Represented by standard deviation. Higher std dev = rougher.
//     // We'll report the roughness for the 'land' part of the signal.
//     const surfaceRoughness = stdDevSecondHalf;

//     // 3. Assemble the results object
//     return {
//         signal_type: 'SAR',
//         analysis: {
//             target_detected: targetDetected,
//             surface_roughness: surfaceRoughness, // Roughness of the land segment
//             moisture_content: 0.32, // Note: Estimating this requires more complex models, so we'll keep it illustrative.
//             terrain_classification: terrainClassification,
//             confidence: 0.95, // Higher confidence as it's based on the data
//             range_resolution: '10.0 meters', // Illustrative
//             azimuth_resolution: '10.0 meters', // Illustrative
//             signal_quality: 'High'
//         },
//         parameters: sampleData.SAR.parameters,
//         visualization_data: {
//             // Pass the parsed data directly to the visualizer
//             time_domain: parsedData,
//             frequency_domain: [] // Can be left empty for this example
//         }
//     };
//  };
//   const visualizeSignal = (results) => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext('2d');
//     const width = canvas.width;
//     const height = canvas.height;

//     // Clear canvas
//     ctx.clearRect(0, 0, width, height);

//     // Set up plotting area
//     const padding = 40;
//     const plotWidth = width - 2 * padding;
//     const plotHeight = height - 2 * padding;

//     // Draw background
//     ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
//     ctx.fillRect(padding, padding, plotWidth, plotHeight);

//     // Draw grid
//     ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
//     ctx.lineWidth = 1;
    
//     for (let i = 0; i <= 10; i++) {
//       const x = padding + (i / 10) * plotWidth;
//       // Get the data array to plot
// const data = results.visualization_data.time_domain; // Keep using this structure for now

// // ... inside the forEach loop ...
// const intensity = point.y; // Assuming point.y holds the backscatter intensity
// const y = padding + plotHeight - (intensity * plotHeight); // Map [0, 1] to the plot height
      
//       ctx.beginPath();
//       ctx.moveTo(x, padding);
//       ctx.lineTo(x, padding + plotHeight);
//       ctx.stroke();
      
//       ctx.beginPath();
//       ctx.moveTo(padding, y);
//       ctx.lineTo(padding + plotWidth, y);
//       ctx.stroke();
//     }

//     // Plot signal data
//     const data = signalType === 'SAR' ? 
//       results.visualization_data.time_domain : 
//       results.visualization_data.time_series;

//     if (data && data.length > 0) {
//       ctx.strokeStyle = signalType === 'SAR' ? '#06b6d4' : '#f97316';
//       ctx.lineWidth = 2;
//       ctx.beginPath();

//       data.forEach((point, index) => {
//         const x = padding + (index / (data.length - 1)) * plotWidth;
//         const y = padding + plotHeight - (point.y + 1) / 2 * plotHeight;
        
//         if (index === 0) {
//           ctx.moveTo(x, y);
//         } else {
//           ctx.lineTo(x, y);
//         }
//       });

//       ctx.stroke();
//     }

//     // Add labels
//     ctx.fillStyle = 'white';
//     ctx.font = '12px Inter';
//     ctx.textAlign = 'center';
    
//     ctx.fillText(
//       signalType === 'SAR' ? 'Time Domain (SAR Return)' : 'Time Series (Pulsar Signal)',
//       width / 2,
//       height - 10
//     );
    
//     ctx.save();
//     ctx.translate(15, height / 2);
//     ctx.rotate(-Math.PI / 2);
//     ctx.fillText('Amplitude', 0, 0);
//     ctx.restore();
//   };

//   const resetAnalysis = () => {
//     setSelectedFile(null);
//     setAnalysisResults(null);
//     setProcessingProgress(0);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   return (
//     <div className="rf-container">
//       {/* Header */}
//       <div className="rf-header">
//         <h2>📡 Radiofrequency Signals Viewer</h2>
//         <p>Analyze SAR and Cosmic signals with advanced RF processing</p>
//       </div>

//       {/* Signal Type Selector */}
//       <div className="signal-type-selector">
//         <div className="type-tabs">
//           <button 
//             className={`type-tab ${signalType === 'SAR' ? 'active' : ''}`}
//             onClick={() => setSignalType('SAR')}
//           >
//             🛰️ SAR Signals
//           </button>
//           <button 
//             className={`type-tab ${signalType === 'Cosmic' ? 'active' : ''}`}
//             onClick={() => setSignalType('Cosmic')}
//           >
//             🌌 Cosmic Signals
//           </button>
//         </div>
//         <div className="type-info">
//           {signalType === 'SAR' ? (
//             <span>Synthetic Aperture Radar - Surface analysis and target detection</span>
//           ) : (
//             <span>Radio Astronomy - Pulsar detection and cosmic phenomena analysis</span>
//           )}
//         </div>
//       </div>

//       {/* Upload Area */}
//       <div 
//         className={`upload-area ${selectedFile ? 'file-selected' : ''}`}
//         onDrop={handleDrop}
//         onDragOver={handleDragOver}
//         onClick={() => fileInputRef.current?.click()}
//       >
//         <input
//           ref={fileInputRef}
//           type="file"
//           accept=".csv,.txt,.dat,.bin"
//           onChange={handleFileUpload}
//           style={{ display: 'none' }}
//         />
        
//         {selectedFile ? (
//           <div className="file-info">
//             <div className="file-icon">📄</div>
//             <div className="file-details">
//               <div className="file-name">{selectedFile.name}</div>
//               <div className="file-size">
//                 {(selectedFile.size / 1024).toFixed(1)} KB
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="upload-prompt">
//             <div className="upload-icon">📁</div>
//             <p>Drop your RF signal file here or click to browse</p>
//             <div className="file-types">
//               Supported: CSV, TXT, DAT, BIN files
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Sample Data Button */}
//       <div className="sample-data-section">
//         <button className="sample-data-btn" onClick={loadSampleData}>
//           📊 Load Sample {signalType} Data
//         </button>
//         <div className="sample-info">
//           {sampleData[signalType].filename} - Real-world {signalType} signal simulation
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="action-buttons">
//         <button
//           className="analyze-button"
//           onClick={analyzeSignal}
//           disabled={!selectedFile || isAnalyzing}
//         >
//           {isAnalyzing ? '🔄 Analyzing...' : '🔬 Analyze Signal'}
//         </button>
//         <button className="reset-button" onClick={resetAnalysis}>
//           🔄 Reset
//         </button>
//       </div>

//       {/* Processing Status */}
//       {isAnalyzing && (
//         <div className="processing-status">
//           <div className="progress-bar">
//             <div 
//               className="progress-fill" 
//               style={{ width: `${processingProgress}%` }}
//             ></div>
//           </div>
//           <p>Processing {signalType} signal... {processingProgress}%</p>
//         </div>
//       )}

//       {/* Visualization Canvas */}
//       {analysisResults && (
//         <div className="visualization-section">
//           <h3>📈 Signal Visualization</h3>
//           <canvas 
//             ref={canvasRef} 
//             width={800} 
//             height={300}
//             className="signal-canvas"
//           />
//         </div>
//       )}

//       {/* Analysis Results */}
//       {analysisResults && (
//         <div className="analysis-results">
//           <div className="results-header">
//             <h3>📋 Analysis Results</h3>
//             <div className="signal-type-badge">{analysisResults.signal_type}</div>
//           </div>

//           {signalType === 'SAR' ? (
//             <div className="sar-results">
//               <div className="result-grid">
//                 <div className="result-item">
//                   <span className="result-label">Target Detection:</span>
//                   <span className={`result-value ${analysisResults.analysis.target_detected ? 'positive' : 'negative'}`}>
//                     {analysisResults.analysis.target_detected ? '✅ Detected' : '❌ Not Detected'}
//                   </span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">Surface Roughness:</span>
//                   <span className="result-value">{analysisResults.analysis.surface_roughness.toFixed(3)}</span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">Moisture Content:</span>
//                   <span className="result-value">{(analysisResults.analysis.moisture_content * 100).toFixed(1)}%</span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">Terrain Type:</span>
//                   <span className="result-value">{analysisResults.analysis.terrain_classification}</span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">Range Resolution:</span>
//                   <span className="result-value">{analysisResults.analysis.range_resolution}</span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">Confidence:</span>
//                   <span className="result-value confidence">
//                     {(analysisResults.analysis.confidence * 100).toFixed(1)}%
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="cosmic-results">
//               <div className="result-grid">
//                 <div className="result-item">
//                   <span className="result-label">Pulsar Detection:</span>
//                   <span className={`result-value ${analysisResults.analysis.pulsar_detected ? 'positive' : 'negative'}`}>
//                     {analysisResults.analysis.pulsar_detected ? '✅ Detected' : '❌ Not Detected'}
//                   </span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">Period:</span>
//                   <span className="result-value">{analysisResults.analysis.period.toFixed(3)} sec</span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">Dispersion Measure:</span>
//                   <span className="result-value">{analysisResults.analysis.dispersion_measure} pc cm⁻³</span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">Flux Density:</span>
//                   <span className="result-value">{analysisResults.analysis.flux_density}</span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">Distance:</span>
//                   <span className="result-value">{analysisResults.analysis.distance}</span>
//                 </div>
//                 <div className="result-item">
//                   <span className="result-label">S/N Ratio:</span>
//                   <span className="result-value confidence">
//                     {analysisResults.analysis.signal_to_noise.toFixed(1)} dB
//                   </span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Server Status */}
//       <div className={`server-status ${serverStatus}`}>
//         <span className="status-indicator"></span>
//         {serverStatus === 'checking' && 'Checking server...'}
//         {serverStatus === 'connected' && 'RF Analysis Server Connected'}
//         {serverStatus === 'disconnected' && 'Server Offline - Using Simulation Mode'}
//       </div>
//     </div>
//   );
// };

// export default RadioFrequency;