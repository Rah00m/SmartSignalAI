import React from 'react';
import CarAudioAnalysis from './CarAudioAnalysis';

const AudioSignals = () => {
  return <CarAudioAnalysis />;
};

export default AudioSignals;







// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import '../MainHome.css';
// import CarAudioAnalysis from './CarAudioAnalysis';

// const AudioSignals = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="main-home">
//       <div className="hero-section">
//         <div className="hero-content">
//           <h1 className="hero-title">Audio Signals</h1>
//           <p className="hero-description">
//             Advanced audio signal processing for automotive applications.
//             Analyze car sounds, engine performance, and audio diagnostics.
//           </p>
//           <button 
//             className="back-btn"
//             onClick={() => navigate('/')}
//           >
//             ← Back to Home
//           </button>
//         </div>
//       </div>

//       <div className="signal-types-section">
//         <h2 className="section-title">Car Audio Analysis</h2>
//         <div className="signal-grid">
//           <div
//             className="signal-card"
//             style={{ background: 'linear-gradient(135deg, #74b9ff, #0984e3)' }}
//           >
//             <div className="signal-card-header">
//               <div className="signal-icon">🔊</div>
//               <h3 className="signal-title">Car Sound Analysis</h3>
//             </div>
//             <p className="signal-description">
//               Comprehensive audio analysis for vehicle diagnostics and performance monitoring.
//             </p>
            
//             <div className="key-features">
//               <h4>⚡ Key Features:</h4>
//               <ul className="features-list">
//                 <li className="feature-item">
//                   <span className="feature-icon">✓</span>
//                   Engine sound analysis
//                 </li>
//                 <li className="feature-item">
//                   <span className="feature-icon">✓</span>
//                   Frequency spectrum analysis
//                 </li>
//                 <li className="feature-item">
//                   <span className="feature-icon">✓</span>
//                   Noise detection and filtering
//                 </li>
//                 <li className="feature-item">
//                   <span className="feature-icon">✓</span>
//                   Real-time audio processing
//                 </li>
//               </ul>
//             </div>
            
//             <button className="explore-btn">
//               Coming Soon <span className="arrow">⏳</span>
//             </button>
//           </div>
//         </div>
//       </div>
//       <CarAudioAnalysis />
//     </div>
//   );
// };

// export default AudioSignals;