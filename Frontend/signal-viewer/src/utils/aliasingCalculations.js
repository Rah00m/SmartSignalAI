/**
 * Calculate Nyquist frequency
 * @param {number} samplingRate 
 * @returns {number}
 */
export const calculateNyquistFrequency = (samplingRate) => {
  return samplingRate / 2;
};

/**
 * Check if sampling rate is below Nyquist for speech
 * Speech typically needs ~40kHz for full quality
 * @param {number} samplingRate 
 * @returns {boolean}
 */
export const isAliasingPresent = (samplingRate) => {
  const SPEECH_NYQUIST = 40000; // 40kHz for full speech quality
  return samplingRate < SPEECH_NYQUIST;
};

/**
 * Calculate aliasing severity (0-100%)
 * @param {number} samplingRate 
 * @returns {number}
 */
export const calculateAliasingSeverity = (samplingRate) => {
  const IDEAL_RATE = 44100;
  const MIN_RATE = 8000;
  
  if (samplingRate >= IDEAL_RATE) return 0;
  if (samplingRate <= MIN_RATE) return 100;
  
  return Math.round(((IDEAL_RATE - samplingRate) / (IDEAL_RATE - MIN_RATE)) * 100);
};

/**
 * Get aliasing description based on sample rate
 * @param {number} samplingRate 
 * @returns {object}
 */
export const getAliasingDescription = (samplingRate) => {
  const severity = calculateAliasingSeverity(samplingRate);
  
  const descriptions = {
    none: {
      level: 'None',
      description: 'High quality audio - No aliasing detected',
      color: '#4CAF50'
    },
    minimal: {
      level: 'Minimal',
      description: 'Slight quality loss - Minor aliasing present',
      color: '#8BC34A'
    },
    moderate: {
      level: 'Moderate',
      description: 'Noticeable distortion - Voice sounds slightly robotic',
      color: '#FFC107'
    },
    severe: {
      level: 'Severe',
      description: 'Heavy distortion - Voice sounds deep and robotic. Female voices sound male.',
      color: '#FF9800'
    },
    extreme: {
      level: 'Extreme',
      description: 'Extreme distortion - Audio quality severely degraded',
      color: '#F44336'
    }
  };
  
  if (severity === 0) return descriptions.none;
  if (severity < 25) return descriptions.minimal;
  if (severity < 50) return descriptions.moderate;
  if (severity < 75) return descriptions.severe;
  return descriptions.extreme;
};