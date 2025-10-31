const API_BASE_URL = 'http://localhost:8000/api/audio-sr';

class VoiceFixerService {
  constructor() {
    this.isModelLoaded = false;
    this.checkModelStatus();
  }

  async checkModelStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/model-info`);
      const data = await response.json();
      this.isModelLoaded = data.status === 'loaded';
      console.log('🎤 VoiceFixer Model Status:', data);
      return data;
    } catch (error) {
      console.error('❌ Error checking model status:', error);
      this.isModelLoaded = false;
      return null;
    }
  }

  audioBufferToWavBlob(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const bitsPerSample = 16;
    
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // WAV file header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Audio data
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  // ✅ Process audio from AudioBuffer (for generated signals)
  async processAudio(aliasedBuffer, targetSampleRate = 44100, onProgress) {
    console.log('🎤 Starting VoiceFixer enhancement...');
    console.log(`📊 Input: ${aliasedBuffer.sampleRate}Hz, Duration: ${aliasedBuffer.duration.toFixed(2)}s`);
    console.log(`🎯 Target: ${targetSampleRate}Hz`);

    if (onProgress) onProgress('Converting audio to WAV format...');

    try {
      const audioBlob = this.audioBufferToWavBlob(aliasedBuffer);
      console.log(`📦 Audio blob size: ${(audioBlob.size / 1024).toFixed(2)} KB`);

      const formData = new FormData();
      formData.append('file', audioBlob, 'input.wav');

      if (onProgress) {
        if (!this.isModelLoaded) {
          onProgress('Loading VoiceFixer (first time: 30s)...');
        } else {
          onProgress('Restoring audio with VoiceFixer...');
        }
      }
      
      console.log('🚀 Sending to VoiceFixer backend...');
      
      const response = await fetch(`${API_BASE_URL}/process-audio?target_sr=${targetSampleRate}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorText;
        try {
          const errorJson = await response.json();
          errorText = errorJson.detail || JSON.stringify(errorJson);
        } catch {
          errorText = await response.text();
        }
        throw new Error(`Backend error (${response.status}): ${errorText}`);
      }

      if (onProgress) onProgress('Receiving enhanced audio...');
      console.log('📥 Receiving enhanced audio...');
      
      const enhancedBlob = await response.blob();
      console.log(`📦 Enhanced blob size: ${(enhancedBlob.size / 1024).toFixed(2)} KB`);

      if (enhancedBlob.size === 0) {
        throw new Error('Received empty audio file from server');
      }

      if (onProgress) onProgress('Decoding enhanced audio...');
      const arrayBuffer = await enhancedBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const enhancedBuffer = await audioContext.decodeAudioData(arrayBuffer);

      console.log('✅ VoiceFixer enhancement complete!');
      console.log(`📊 Output: ${enhancedBuffer.sampleRate}Hz, Duration: ${enhancedBuffer.duration.toFixed(2)}s`);

      this.isModelLoaded = true;
      return enhancedBuffer;

    } catch (error) {
      console.error('❌ VoiceFixer processing error:', error);
      throw new Error(`Enhancement failed: ${error.message}`);
    }
  }

  // ✅ Process uploaded file (preserves original sample rate)
  async processAudioFile(audioFile, targetSampleRate = 44100, onProgress) {
    console.log('📁 Processing uploaded file:', audioFile.name);
    console.log(`📦 File size: ${(audioFile.size / 1024).toFixed(2)} KB`);

    try {
      // Send original file directly to backend (no browser resampling)
      if (onProgress) onProgress('Preparing file for restoration...');

      const formData = new FormData();
      formData.append('file', audioFile);

      if (onProgress) {
        if (!this.isModelLoaded) {
          onProgress('Loading VoiceFixer (first time: 30s)...');
        } else {
          onProgress('Restoring audio with VoiceFixer...');
        }
      }
      
      console.log('🚀 Sending to VoiceFixer backend...');
      console.log(`⏱️ Expected time: 10-30 seconds`);
      
      const response = await fetch(`${API_BASE_URL}/process-audio?target_sr=${targetSampleRate}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorText;
        try {
          const errorJson = await response.json();
          errorText = errorJson.detail || JSON.stringify(errorJson);
        } catch {
          errorText = await response.text();
        }
        throw new Error(`Backend error (${response.status}): ${errorText}`);
      }

      if (onProgress) onProgress('Receiving enhanced audio...');
      console.log('📥 Receiving enhanced audio...');
      
      const enhancedBlob = await response.blob();
      console.log(`📦 Enhanced blob size: ${(enhancedBlob.size / 1024).toFixed(2)} KB`);

      if (enhancedBlob.size === 0) {
        throw new Error('Received empty audio file');
      }

      // Decode both for playback comparison
      if (onProgress) onProgress('Decoding audio for playback...');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Decode original
      const originalArrayBuffer = await audioFile.arrayBuffer();
      const originalBuffer = await audioContext.decodeAudioData(originalArrayBuffer);
      
      // Decode enhanced
      const enhancedArrayBuffer = await enhancedBlob.arrayBuffer();
      const enhancedBuffer = await audioContext.decodeAudioData(enhancedArrayBuffer);

      console.log('✅ VoiceFixer restoration complete!');
      console.log(`📊 Original: ${originalBuffer.sampleRate}Hz`);
      console.log(`📊 Enhanced: ${enhancedBuffer.sampleRate}Hz`);

      this.isModelLoaded = true;
      
      return {
        originalBuffer: originalBuffer,
        enhancedBuffer: enhancedBuffer,
        originalFileName: audioFile.name
      };

    } catch (error) {
      console.error('❌ File processing error:', error);
      throw new Error(`Processing failed: ${error.message}`);
    }
  }

  async checkBackendHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      console.log('🏥 Backend health:', data);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

// ✅ Export singleton instance
export default new VoiceFixerService();
















// const API_BASE_URL = 'http://localhost:8000/api/audio-sr';

// class AIAntiAliasingService {
//   constructor() {
//     this.isModelLoaded = false;
//     this.checkModelStatus();
//   }

//   async checkModelStatus() {
//     try {
//       const response = await fetch(`${API_BASE_URL}/model-info`);
//       const data = await response.json();
//       this.isModelLoaded = data.loaded;
//       console.log('🤖 AudioSR Model Status:', data);
//       return data;
//     } catch (error) {
//       console.error('❌ Error checking model status:', error);
//       this.isModelLoaded = false;
//       return null;
//     }
//   }

//   audioBufferToWavBlob(audioBuffer) {
//     const numberOfChannels = audioBuffer.numberOfChannels;
//     const sampleRate = audioBuffer.sampleRate;
//     const length = audioBuffer.length;
//     const bitsPerSample = 16;
    
//     const bytesPerSample = bitsPerSample / 8;
//     const blockAlign = numberOfChannels * bytesPerSample;
//     const byteRate = sampleRate * blockAlign;
//     const dataSize = length * blockAlign;
    
//     const buffer = new ArrayBuffer(44 + dataSize);
//     const view = new DataView(buffer);
    
//     const writeString = (offset, string) => {
//       for (let i = 0; i < string.length; i++) {
//         view.setUint8(offset + i, string.charCodeAt(i));
//       }
//     };
    
//     writeString(0, 'RIFF');
//     view.setUint32(4, 36 + dataSize, true);
//     writeString(8, 'WAVE');
//     writeString(12, 'fmt ');
//     view.setUint32(16, 16, true);
//     view.setUint16(20, 1, true);
//     view.setUint16(22, numberOfChannels, true);
//     view.setUint32(24, sampleRate, true);
//     view.setUint32(28, byteRate, true);
//     view.setUint16(32, blockAlign, true);
//     view.setUint16(34, bitsPerSample, true);
//     writeString(36, 'data');
//     view.setUint32(40, dataSize, true);
    
//     const channels = [];
//     for (let i = 0; i < numberOfChannels; i++) {
//       channels.push(audioBuffer.getChannelData(i));
//     }
    
//     let offset = 44;
//     for (let i = 0; i < length; i++) {
//       for (let channel = 0; channel < numberOfChannels; channel++) {
//         const sample = Math.max(-1, Math.min(1, channels[channel][i]));
//         const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
//         view.setInt16(offset, intSample, true);
//         offset += 2;
//       }
//     }
    
//     return new Blob([buffer], { type: 'audio/wav' });
//   }

//   // ✅ Process audio from AudioBuffer (for generated signals)
//   async processAudio(aliasedBuffer, targetSampleRate = 48000, onProgress) {
//     console.log('🎵 Starting AI audio enhancement...');
//     console.log(`📊 Input: ${aliasedBuffer.sampleRate}Hz, Duration: ${aliasedBuffer.duration.toFixed(2)}s`);
//     console.log(`🎯 Target: ${targetSampleRate}Hz`);

//     if (onProgress) onProgress('Converting audio to WAV format...');

//     try {
//       const audioBlob = this.audioBufferToWavBlob(aliasedBuffer);
//       console.log(`📦 Audio blob size: ${(audioBlob.size / 1024).toFixed(2)} KB`);

//       const formData = new FormData();
//       formData.append('file', audioBlob, 'input.wav');

//       if (onProgress) {
//         if (!this.isModelLoaded) {
//           onProgress('Loading AI model (first time: 5-10 min)...');
//         } else {
//           onProgress('Sending to AI backend...');
//         }
//       }
      
//       console.log('🚀 Sending to AudioSR backend...');
      
//       const response = await fetch(`${API_BASE_URL}/process-audio?target_sr=${targetSampleRate}`, {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         let errorText;
//         try {
//           const errorJson = await response.json();
//           errorText = errorJson.detail || JSON.stringify(errorJson);
//         } catch {
//           errorText = await response.text();
//         }
//         throw new Error(`Backend error (${response.status}): ${errorText}`);
//       }

//       if (onProgress) onProgress('Receiving enhanced audio...');
//       console.log('📥 Receiving enhanced audio...');
      
//       const enhancedBlob = await response.blob();
//       console.log(`📦 Enhanced blob size: ${(enhancedBlob.size / 1024).toFixed(2)} KB`);

//       if (enhancedBlob.size === 0) {
//         throw new Error('Received empty audio file from server');
//       }

//       if (onProgress) onProgress('Decoding enhanced audio...');
//       const arrayBuffer = await enhancedBlob.arrayBuffer();
//       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//       const enhancedBuffer = await audioContext.decodeAudioData(arrayBuffer);

//       console.log('✅ AI enhancement complete!');
//       console.log(`📊 Output: ${enhancedBuffer.sampleRate}Hz, Duration: ${enhancedBuffer.duration.toFixed(2)}s`);

//       this.isModelLoaded = true;
//       return enhancedBuffer;

//     } catch (error) {
//       console.error('❌ AI processing error:', error);
//       throw new Error(`AI enhancement failed: ${error.message}`);
//     }
//   }

//   // ✅ FIX: Process uploaded file WITHOUT browser resampling
//   async processAudioFile(audioFile, targetSampleRate = 48000, onProgress) {
//     console.log('📁 Processing uploaded file:', audioFile.name);
//     console.log(`📦 File size: ${(audioFile.size / 1024).toFixed(2)} KB`);

//     try {
//       // ✅ Step 1: Send original file DIRECTLY to backend (no decoding!)
//       // This preserves the original sample rate
//       if (onProgress) onProgress('Preparing file for AI enhancement...');

//       const formData = new FormData();
//       formData.append('file', audioFile);  // ✅ Send original file as-is

//       if (onProgress) {
//         if (!this.isModelLoaded) {
//           onProgress('Loading AI model (first time: 5-10 min)...');
//         } else {
//           onProgress('Enhancing audio with AI...');
//         }
//       }
      
//       console.log('🚀 Sending original file to AudioSR backend...');
      
//       const response = await fetch(`${API_BASE_URL}/process-audio?target_sr=${targetSampleRate}`, {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         let errorText;
//         try {
//           const errorJson = await response.json();
//           errorText = errorJson.detail || JSON.stringify(errorJson);
//         } catch {
//           errorText = await response.text();
//         }
//         throw new Error(`Backend error (${response.status}): ${errorText}`);
//       }

//       if (onProgress) onProgress('Receiving enhanced audio...');
//       console.log('📥 Receiving enhanced audio...');
      
//       const enhancedBlob = await response.blob();
//       console.log(`📦 Enhanced blob size: ${(enhancedBlob.size / 1024).toFixed(2)} KB`);

//       if (enhancedBlob.size === 0) {
//         throw new Error('Received empty audio file from server');
//       }

//       // ✅ Step 2: Decode BOTH original and enhanced for playback
//       if (onProgress) onProgress('Decoding audio for playback...');
      
//       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
//       // Decode original file (will be resampled by browser for playback only)
//       const originalArrayBuffer = await audioFile.arrayBuffer();
//       const originalBuffer = await audioContext.decodeAudioData(originalArrayBuffer);
      
//       // Decode enhanced file
//       const enhancedArrayBuffer = await enhancedBlob.arrayBuffer();
//       const enhancedBuffer = await audioContext.decodeAudioData(enhancedArrayBuffer);

//       console.log('✅ AI enhancement complete!');
//       console.log(`📊 Original (for playback): ${originalBuffer.sampleRate}Hz`);
//       console.log(`📊 Enhanced: ${enhancedBuffer.sampleRate}Hz, Duration: ${enhancedBuffer.duration.toFixed(2)}s`);

//       this.isModelLoaded = true;
      
//       return {
//         originalBuffer: originalBuffer,
//         enhancedBuffer: enhancedBuffer,
//         originalFileName: audioFile.name
//       };

//     } catch (error) {
//       console.error('❌ File processing error:', error);
//       throw new Error(`File processing failed: ${error.message}`);
//     }
//   }

//   async checkBackendHealth() {
//     try {
//       const response = await fetch(`${API_BASE_URL}/health`);
//       return response.ok;
//     } catch (error) {
//       console.error('Backend health check failed:', error);
//       return false;
//     }
//   }
// }

// export default new AIAntiAliasingService();