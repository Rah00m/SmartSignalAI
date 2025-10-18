import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainHome.css';

const MainHome = () => {
  const navigate = useNavigate();

  const signalCategories = [
    {
      id: 'medical',
      title: 'Medical Signals',
      description: 'Advanced signal processing for medical diagnostics and monitoring',
      icon: 'M',
      features: [
        'ECG monitoring and analysis',
        'EEG signal processing',
        'Real-time medical data visualization',
        'Advanced filtering techniques',
        'Arrhythmia detection',
        'Heart rate variability analysis'
      ],
      route: '/medical',
      gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
      accentColor: '#ff6b6b'
    },
    {
      id: 'audio',
      title: 'Audio Signals',
      description: 'Comprehensive audio analysis and processing solutions',
      icon: 'A',
      features: [
        'Car sound analysis',
        'Audio frequency analysis',
        'Noise reduction algorithms',
        'Real-time audio processing',
        'Sound classification',
        'Acoustic pattern recognition'
      ],
      route: '/audio',
      gradient: 'linear-gradient(135deg, #74b9ff, #0984e3)',
      accentColor: '#74b9ff'
    },
    {
      id: 'radar',
      title: 'Radar Signals',
      description: 'Advanced radar signal processing and target detection',
      icon: 'R',
      features: [
        'Drone detection and tracking',
        'SAR earthquake detection',
        'Real-time radar processing',
        'Advanced target analysis',
        'Signal pattern recognition',
        'Multi-target tracking'
      ],
      route: '/radar',
      gradient: 'linear-gradient(135deg, #00b894, #00a085)',
      accentColor: '#00b894'
    }
  ];

  return (
    <div className="main-home">
      {/* Available Signal Types Section */}
      <div className="signal-types-section">
        <h2 className="section-title">Signal Processing Modules</h2>
        <div className="signal-grid">
          {signalCategories.map((category) => (
            <div key={category.id} className="card-container">
              <div className="flip-card">
                <div className="flip-card-inner">
                  {/* Front Side */}
                  <div 
                    className="flip-card-front"
                    style={{ background: category.gradient }}
                  >
                    <div className="card-header">
                      <div 
                        className="signal-icon-modern"
                        style={{ boxShadow: `0 0 20px -5px ${category.accentColor}`}}
                      >
                        {category.icon}
                      </div>
                      <h3 className="signal-title">{category.title}</h3>
                    </div>
                    <p className="signal-description">{category.description}</p>
                    <div className="hover-indicator">
                      <span>Hover to explore features</span>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div 
                    className="flip-card-back"
                    style={{ 
                      borderColor: category.accentColor
                    }}
                  >
                    <div className="features-content">
                      <h4 className="features-title">Key Capabilities</h4>
                      <ul className="features-list-back">
                        {category.features.slice(0, 5).map((feature, index) => ( // Show max 5 features
                          <li key={index} className="feature-item-back">
                            <span 
                              className="feature-bullet"
                              style={{ backgroundColor: category.accentColor }}
                            ></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button 
                        className="launch-btn"
                        onClick={() => navigate(category.route)}
                        style={{ 
                          background: category.gradient,
                          boxShadow: `0 8px 25px -5px ${category.accentColor}40`
                        }}
                      >
                        Launch Module
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="footer-section">
        <div className="footer-content">
          <div className="footer-column">
            <h3>SmartSignal AI</h3>
            <p>Professional-grade signal processing platform powered by advanced machine learning algorithms.</p>
          </div>
          <div className="footer-column">
            <h4>Modules</h4>
            <div className="quick-links">
              <span onClick={() => navigate('/medical')}>Medical Signals</span>
              <span onClick={() => navigate('/audio')}>Audio Processing</span>
              <span onClick={() => navigate('/radar')}>Radar Analysis</span>
            </div>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <div className="social-links">
              <span 
                onClick={() => window.open('https://github.com/Rah00m/SmartSignalAI', '_blank')}
                style={{ cursor: 'pointer' }}
              >
                Documentation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainHome;






// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import './MainHome.css';

// const MainHome = () => {
//   const navigate = useNavigate();

//   const signalCategories = [
//     {
//       id: 'medical',
//       title: 'Medical Signals',
//       description: 'Advanced signal processing for medical diagnostics and monitoring',
//       icon: 'M',
//       features: [
//         'ECG monitoring and analysis',
//         'EEG signal processing', 
//         'Real-time medical data visualization',
//         'Advanced filtering techniques',
//         'Arrhythmia detection',
//         'Heart rate variability analysis'
//       ],
//       route: '/medical',
//       gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
//       accentColor: '#ff6b6b'
//     },
//     {
//       id: 'audio',
//       title: 'Audio Signals',
//       description: 'Comprehensive audio analysis and processing solutions',
//       icon: 'A',
//       features: [
//         'Car sound analysis',
//         'Audio frequency analysis',
//         'Noise reduction algorithms',
//         'Real-time audio processing',
//         'Sound classification',
//         'Acoustic pattern recognition'
//       ],
//       route: '/audio',
//       gradient: 'linear-gradient(135deg, #74b9ff, #0984e3)',
//       accentColor: '#74b9ff'
//     },
//     {
//       id: 'radar',
//       title: 'Radar Signals',
//       description: 'Advanced radar signal processing and target detection',
//       icon: 'R',
//       features: [
//         'Drone detection and tracking',
//         'SAR earthquake detection',
//         'Real-time radar processing',
//         'Advanced target analysis',
//         'Signal pattern recognition',
//         'Multi-target tracking'
//       ],
//       route: '/radar',
//       gradient: 'linear-gradient(135deg, #00b894, #00a085)',
//       accentColor: '#00b894'
//     }
//   ];

//   return (
//     <div className="main-home">
//       {/* Hero Section */}
//       <div className="hero-section">
//         <div className="hero-content">
//           <p className="hero-description">
//             Professional signal processing and analysis platform. Leverage advanced 
//             algorithms and machine learning to extract meaningful insights from complex 
//             signal data across multiple domains.
//           </p>
//         </div>
//       </div>

//       {/* Available Signal Types Section */}
//       <div className="signal-types-section">
//         <h2 className="section-title">Signal Processing Modules</h2>
//         <div className="signal-grid">
//           {signalCategories.map((category) => (
//             <div key={category.id} className="card-container">
//               <div className="flip-card" onClick={() => navigate(category.route)}>
//                 <div className="flip-card-inner">
//                   {/* Front Side */}
//                   <div 
//                     className="flip-card-front"
//                     style={{ background: category.gradient }}
//                   >
//                     <div className="card-header">
//                       <div 
//                         className="signal-icon-modern"
//                         style={{ borderColor: category.accentColor }}
//                       >
//                         {category.icon}
//                       </div>
//                       <h3 className="signal-title">{category.title}</h3>
//                     </div>
//                     <p className="signal-description">{category.description}</p>
//                     <div className="hover-indicator">
//                       <span>Hover to explore features</span>
//                     </div>
//                   </div>

//                   {/* Back Side */}
//                   <div 
//                     className="flip-card-back"
//                     style={{ 
//                       background: `linear-gradient(135deg, ${category.accentColor}15, ${category.accentColor}25)`,
//                       borderColor: category.accentColor
//                     }}
//                   >
//                     <div className="features-content">
//                       <h4 className="features-title">Key Capabilities</h4>
//                       <ul className="features-list-back">
//                         {category.features.map((feature, index) => (
//                           <li key={index} className="feature-item-back">
//                             <span 
//                               className="feature-bullet"
//                               style={{ backgroundColor: category.accentColor }}
//                             ></span>
//                             {feature}
//                           </li>
//                         ))}
//                       </ul>
//                       <button 
//                         className="launch-btn"
//                         style={{ 
//                           background: category.gradient,
//                           boxShadow: `0 8px 25px ${category.accentColor}30`
//                         }}
//                       >
//                         Launch Module
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Footer Section */}
//       <div className="footer-section">
//         <div className="footer-content">
//           <div className="footer-column">
//             <h3>SmartSignal AI</h3>
//             <p>Professional-grade signal processing platform powered by advanced machine learning algorithms.</p>
//           </div>
//           <div className="footer-column">
//             <h4>Modules</h4>
//             <div className="quick-links">
//               <span onClick={() => navigate('/medical')}>Medical Signals</span>
//               <span onClick={() => navigate('/audio')}>Audio Processing</span>
//               <span onClick={() => navigate('/radar')}>Radar Analysis</span>
//             </div>
//           </div>
//           <div className="footer-column">
//             <h4>Resources</h4>
//             <div className="social-links">
//               <span 
//                 onClick={() => window.open('https://github.com/Rah00m/SmartSignalAI', '_blank')}
//                 style={{ cursor: 'pointer' }}
//               >
//                 Documentation
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MainHome;