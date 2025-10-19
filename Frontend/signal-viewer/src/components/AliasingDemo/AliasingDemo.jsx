import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FrequencySlider from './FrequencySlider';
import AudioVisualizer from './AudioVisualizer';
import AudioControls from './AudioControls';
import './AliasingDemo.css';
import { 
  loadAudio, 
  downsampleWithAliasing, 
  applyFrequencyAliasing,
  applyExtremeLowPassAliasing,
  stopAudioSource 
} from '../../utils/audioProcessing';

const AliasingDemo = () => {
  const navigate = useNavigate();
  const [samplingFrequency, setSamplingFrequency] = useState(44100);
  const [originalBuffer, setOriginalBuffer] = useState(null);
  const [processedBuffer, setProcessedBuffer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [currentAudioFile, setCurrentAudioFile] = useState('/assets/audio/female-voice.wav'); // ✅ Add .wav extension
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const sourceNodeRef = useRef(null);

  // Initialize Audio Context
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(context);
      } catch (err) {
        console.error('Failed to initialize audio context:', err);
        setError('Your browser does not support Web Audio API. Please use a modern browser.');
      }
    };

    initAudioContext();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  // Load audio file when context is ready or file changes
  useEffect(() => {
    if (!audioContext) return;

    const loadAudioFile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Loading audio file from:', currentAudioFile);
        const buffer = await loadAudio(audioContext, currentAudioFile);
        setOriginalBuffer(buffer);
        setProcessedBuffer(buffer);
        console.log('Audio loaded successfully');
      } catch (err) {
        console.error('Error loading audio:', err);
        setError(`Failed to load audio file: ${currentAudioFile}. Please check that the file exists in /public/assets/audio/`);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudioFile();
  }, [audioContext, currentAudioFile]);

  // Process audio when sampling frequency changes
  useEffect(() => {
    if (!originalBuffer) return;

    try {
      if (samplingFrequency === 44100) {
        setProcessedBuffer(originalBuffer);
      } else {
        let processed;
        
        // Use different methods based on target rate
        if (samplingFrequency <= 10000) {
          // Extreme aliasing for very low rates (8-10 kHz)
          console.log('🚨 Using EXTREME aliasing method');
          processed = applyExtremeLowPassAliasing(originalBuffer, samplingFrequency);
        } else if (samplingFrequency <= 16000) {
          // Aggressive aliasing for low rates (10-16 kHz)
          console.log('⚠️ Using AGGRESSIVE aliasing method');
          processed = applyFrequencyAliasing(originalBuffer, samplingFrequency);
        } else {
          // Standard aliasing for moderate rates (16-44 kHz)
          console.log('📊 Using STANDARD aliasing method');
          processed = downsampleWithAliasing(originalBuffer, samplingFrequency);
        }
        
        setProcessedBuffer(processed);
        
        console.log(`✅ Processed at ${samplingFrequency}Hz`);
        console.log(`🎵 Duration: ${processed.duration.toFixed(2)}s (should match original)`);
        console.log(`📏 Sample count: ${processed.length.toLocaleString()}`);
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Error processing audio. Please try again.');
    }
  }, [samplingFrequency, originalBuffer]);

  const handlePlay = () => {
    if (!audioContext || !processedBuffer) {
      setError('Audio not ready. Please wait or reload the page.');
      return;
    }

    // Stop any currently playing audio
    if (sourceNodeRef.current) {
      stopAudioSource(sourceNodeRef.current);
    }

    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create and play new source
    const source = audioContext.createBufferSource();
    source.buffer = processedBuffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
      setIsPlaying(false);
      sourceNodeRef.current = null;
    };

    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (audioContext && audioContext.state === 'running') {
      audioContext.suspend();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (sourceNodeRef.current) {
      stopAudioSource(sourceNodeRef.current);
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleFrequencyChange = (newFrequency) => {
    setSamplingFrequency(newFrequency);
    // Stop playback when frequency changes
    handleStop();
  };

  const handleAudioFileChange = (newFile) => {
    handleStop(); // Stop current playback
    setCurrentAudioFile(newFile);
  };

  return (
    <div className="aliasing-demo">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Home
      </button>

      <div className="demo-header">
        <h1>🎤 Part 1: Demonstrating Aliasing on Speech Signals</h1>
        <p className="demo-description">
          Explore how under-sampling below the Nyquist rate affects audio quality. 
          Reduce sampling frequency and hear how higher frequencies 'fold back' and appear at lower frequencies, causing female voices to sound like male voices.
        </p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {isLoading && (
        <div className="loading-message">
          ⏳ Loading audio file...
        </div>
      )}

      <div className="demo-content">
        <div className="control-section">
          <FrequencySlider 
            frequency={samplingFrequency}
            onFrequencyChange={handleFrequencyChange}
          />
          
          <AudioControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            audioFile={currentAudioFile}
            onAudioFileChange={handleAudioFileChange}
            processedBuffer={processedBuffer}  // ✅ NEW: Pass processed buffer
            samplingRate={samplingFrequency}   // ✅ NEW: Pass sampling rate
          />
        </div>

        <div className="visualizer-section">
          <AudioVisualizer 
            audioBuffer={processedBuffer}
            samplingRate={samplingFrequency}
            isPlaying={isPlaying}
          />
        </div>
      </div>

      <div className="educational-panel">
        <h3>📚 Understanding Aliasing</h3>
        <div className="education-grid">
          <div className="edu-card">
            <h4>⚡ Nyquist-Shannon Theorem</h4>
            <p>
              To perfectly reconstruct a signal, you must sample at <strong>more than twice</strong> the highest frequency present:
            </p>
            <code>f_sample &gt; 2 × f_max</code>
            <p>For human speech (≈20 kHz max), you need ≥40 kHz sampling rate.</p>
          </div>

          <div className="edu-card">
            <h4>⚠️ What Happens Below Nyquist?</h4>
            <p>
              High frequencies "fold back" and incorrectly appear at lower frequencies:
            </p>
            <ul>
              <li>Distortion occurs</li>
              <li>Female voices become deeper and sound like male voices</li>
              <li>Audio becomes distorted, thick, and robotic</li>
            </ul>
          </div>

          <div className="edu-card">
            <h4>🎯 What to Observe:</h4>
            <ul>
              <li>At sampling frequency decreases below 40 kHz, aliasing occurs</li>
              <li>High frequencies "fold back" and appear as lower frequencies</li>
              <li>Female voices become deeper and sound like male voices</li>
              <li>Audio becomes distorted, thick, and robotic</li>
            </ul>
          </div>

          <div className="edu-card">
            <h4>👂 Female vs 👨 Male Voices</h4>
            <p><strong>Female Voices:</strong></p>
            <p>Higher fundamental frequency (165-255 Hz) with rich harmonic content above 3-4 kHz. More susceptible to aliasing effects.</p>
            
            <p><strong>Male Voices:</strong></p>
            <p>Lower fundamental frequency (85-180 Hz) with less high-frequency content. Less affected by under-sampling at very low sampling rates.</p>
          </div>
          
          {/* NEW: Add AI Training Card */}
          <div className="edu-card ai-card">
            <h4>🧠 Part 3: AI Anti-Aliasing</h4>
            <p>
              The next step is to train a neural network to <strong>reconstruct</strong> the original high-quality audio from the aliased version.
            </p>
            <ul>
              <li><strong>Dataset:</strong> Download pairs of (aliased, original) audio files</li>
              <li><strong>Model:</strong> U-Net or encoder-decoder architecture</li>
              <li><strong>Training:</strong> Learn the mapping from distorted → clean</li>
              <li><strong>Result:</strong> AI "fixes" aliasing in real-time during playback</li>
            </ul>
            <p className="highlight">
              💡 Use the download button to create your training dataset with different sampling rates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AliasingDemo;