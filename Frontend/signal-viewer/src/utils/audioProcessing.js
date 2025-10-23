/**
 * Load audio file from URL
 */
export async function loadAudio(audioContext, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error('Error loading audio:', error);
    throw error;
  }
}

/**
 * CORRECTED: Pure aliasing simulation - NO MIXING with original
 * Only distorted audio for AI training
 */
export function downsampleWithAliasing(audioBuffer, targetSampleRate) {
  const originalSampleRate = audioBuffer.sampleRate;
  
  if (targetSampleRate >= originalSampleRate) {
    return audioBuffer;
  }
  
  console.log(`🎵 Creating PURE distorted audio at ${targetSampleRate}Hz (no mixing)`);
  
  const outputBuffer = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    originalSampleRate
  ).createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    originalSampleRate
  );
  
  const decimationFactor = Math.round(originalSampleRate / targetSampleRate);
  const nyquistFreq = targetSampleRate / 2;
  
  console.log(`📊 Decimation: ${decimationFactor}x, Nyquist: ${nyquistFreq}Hz`);
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);
    
    // Apply low-pass filter to simulate bandwidth limitation
    const cutoffRatio = targetSampleRate / originalSampleRate;
    let filtered = new Float32Array(inputData.length);
    filtered[0] = inputData[0];
    
    // Simple IIR low-pass filter
    for (let i = 1; i < inputData.length; i++) {
      filtered[i] = inputData[i] * cutoffRatio + filtered[i - 1] * (1 - cutoffRatio);
    }
    
    // Downsample and upsample with zero-order hold (pure decimation)
    for (let i = 0; i < outputData.length; i++) {
      const sourceIdx = Math.floor(i / decimationFactor) * decimationFactor;
      outputData[i] = filtered[sourceIdx]; // ✅ NO MIXING - pure distorted only
    }
  }
  
  console.log(`✅ PURE distorted audio created - duration: ${outputBuffer.duration.toFixed(2)}s`);
  
  return outputBuffer;
}

/**
 * CORRECTED: Aggressive aliasing - PURE distortion with pitch lowering
 * NO mixing with original - only distorted audio
 */
export function applyFrequencyAliasing(audioBuffer, targetSampleRate) {
  const originalSampleRate = audioBuffer.sampleRate;
  
  if (targetSampleRate >= originalSampleRate) {
    return audioBuffer;
  }
  
  console.log(`🚨 PURE aggressive aliasing at ${targetSampleRate}Hz (no mixing)`);
  
  const outputBuffer = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    originalSampleRate
  ).createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    originalSampleRate
  );
  
  const decimationFactor = Math.round(originalSampleRate / targetSampleRate);
  const pitchShiftDown = 0.85; // 15% SLOWER = DEEPER voice
  
  console.log(`🎵 Pitch shift: ${pitchShiftDown}x (deeper voice, pure distortion)`);
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);
    
    // Aggressive multi-pass low-pass filter
    let filtered = new Float32Array(inputData);
    const cutoff = Math.max(0.15, targetSampleRate / originalSampleRate);
    
    for (let pass = 0; pass < 3; pass++) {
      const temp = new Float32Array(filtered.length);
      temp[0] = filtered[0];
      for (let i = 1; i < filtered.length; i++) {
        temp[i] = filtered[i] * cutoff + temp[i - 1] * (1 - cutoff);
      }
      filtered = temp;
    }
    
    // Downsample with zero-order hold
    for (let i = 0; i < outputData.length; i++) {
      const sourceIdx = Math.floor(i / decimationFactor) * decimationFactor;
      outputData[i] = filtered[sourceIdx];
    }
    
    // Apply pitch lowering by reading SLOWER
    const deepened = new Float32Array(outputData.length);
    for (let i = 0; i < outputData.length; i++) {
      const sourceIdx = Math.floor(i * pitchShiftDown);
      if (sourceIdx < outputData.length) {
        deepened[i] = outputData[sourceIdx];
      } else {
        deepened[i] = 0;
      }
    }
    
    // ✅ CHANGED: Use ONLY the deepened version (no mixing!)
    for (let i = 0; i < outputData.length; i++) {
      outputData[i] = deepened[i]; // 100% distorted, 0% original
    }
  }
  
  console.log(`💥 PURE aggressive distortion complete (no original audio mixed in)`);
  
  return outputBuffer;
}

/**
 * CORRECTED: Extreme aliasing for 8kHz - PURE distortion
 * 100% distorted audio, NO mixing with original
 */
export function applyExtremeLowPassAliasing(audioBuffer, targetSampleRate) {
  const originalSampleRate = audioBuffer.sampleRate;
  
  console.log(`💀 PURE extreme aliasing at ${targetSampleRate}Hz (no mixing)`);
  
  const outputBuffer = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    originalSampleRate
  ).createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    originalSampleRate
  );
  
  const decimationFactor = Math.round(originalSampleRate / targetSampleRate);
  const pitchShiftDown = 0.7; // 30% SLOWER = Much DEEPER voice
  
  console.log(`🎵 EXTREME pitch shift: ${pitchShiftDown}x (very deep, pure distortion)`);
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);
    
    // Extreme low-pass filtering
    let filtered = new Float32Array(inputData);
    const windowSize = Math.max(15, decimationFactor * 2);
    
    // Moving average (brick-wall approximation)
    for (let i = 0; i < filtered.length; i++) {
      let sum = 0;
      let count = 0;
      const start = Math.max(0, i - windowSize);
      const end = Math.min(filtered.length - 1, i + windowSize);
      
      for (let j = start; j <= end; j++) {
        sum += inputData[j];
        count++;
      }
      filtered[i] = sum / count;
    }
    
    // Extreme decimation
    for (let i = 0; i < outputData.length; i++) {
      const sourceIdx = Math.floor(i / decimationFactor) * decimationFactor;
      outputData[i] = filtered[sourceIdx];
    }
    
    // Apply strong pitch lowering
    const deepened = new Float32Array(outputData.length);
    for (let i = 0; i < outputData.length; i++) {
      const sourceIdx = Math.floor(i * pitchShiftDown);
      if (sourceIdx < outputData.length) {
        deepened[i] = outputData[sourceIdx];
      }
    }
    
    // ✅ CHANGED: Use ONLY the deepened version (100% distorted)
    for (let i = 0; i < outputData.length; i++) {
      outputData[i] = deepened[i]; // Pure distortion, no mixing
    }
    
    // Add bass resonance to emphasize low frequencies
    const resonanceDelay = Math.floor(originalSampleRate / 120); // ~120Hz
    for (let i = resonanceDelay; i < outputData.length; i++) {
      outputData[i] += outputData[i - resonanceDelay] * 0.4;
    }
    
    // Normalize to prevent clipping
    let maxVal = 0;
    for (let i = 0; i < outputData.length; i++) {
      maxVal = Math.max(maxVal, Math.abs(outputData[i]));
    }
    if (maxVal > 0.95) {
      for (let i = 0; i < outputData.length; i++) {
        outputData[i] *= 0.95 / maxVal;
      }
    }
  }
  
  console.log(`💀 PURE extreme distortion complete (100% distorted, 0% original)`);
  
  return outputBuffer;
}

/**
 * Stop audio source safely
 */
export function stopAudioSource(sourceNode) {
  if (sourceNode) {
    try {
      sourceNode.stop();
      sourceNode.disconnect();
    } catch (error) {
      console.log('Audio source already stopped');
    }
  }
}

/**
 * Analyze audio buffer
 */
export function analyzeAudioBuffer(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0);
  
  let sumSquares = 0;
  let peak = 0;
  
  for (let i = 0; i < channelData.length; i++) {
    const abs = Math.abs(channelData[i]);
    sumSquares += channelData[i] * channelData[i];
    if (abs > peak) peak = abs;
  }
  
  const rms = Math.sqrt(sumSquares / channelData.length);
  
  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    length: audioBuffer.length,
    numberOfChannels: audioBuffer.numberOfChannels,
    rms: rms,
    peak: peak,
    nyquistFrequency: audioBuffer.sampleRate / 2
  };
}

export function getNyquistFrequency(samplingRate) {
  return samplingRate / 2;
}

export function willAlias(samplingRate, maxFrequency) {
  return samplingRate < (2 * maxFrequency);
}

export function getFrequencySpectrum(audioBuffer, fftSize = 2048) {
  const channelData = audioBuffer.getChannelData(0);
  const spectrum = new Float32Array(fftSize / 2);
  
  const startSample = Math.floor(channelData.length / 2);
  
  for (let i = 0; i < spectrum.length; i++) {
    const index = startSample + i;
    if (index < channelData.length) {
      spectrum[i] = Math.abs(channelData[index]);
    }
  }
  
  return spectrum;
}