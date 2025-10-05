
import React, { useEffect, useMemo, useRef, useState } from "react";
import Plot from "react-plotly.js";

export default function EEGViewer({ data, onPredict }) {
  const { sr, channels, values } = data;
  const totalSec = values[0].length / sr;
  const [windowSec, setWindowSec] = useState(6);
  const [cursorSec, setCursorSec] = useState(windowSec/2);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [zoom, setZoom] = useState(1.0);
  const [selectedChannels, setSelectedChannels] = useState(Array.from({length:Math.min(4,channels)},(_,i)=>i));
  const [viewMode, setViewMode] = useState("Continuous");
  const [xorChunkSec, setXorChunkSec] = useState(3);
  const requestRef = useRef(null); const lastRef = useRef(null);
  const effectiveWindowSec = Math.max(0.5, windowSec / zoom);

  useEffect(()=>{
    if(playing){
      lastRef.current = performance.now();
      const step = (now)=>{
        const dt = (now - lastRef.current)/1000;
        lastRef.current = now;
        setCursorSec(prev=>{
          let next = prev + dt*speed;
          if(next > totalSec - 1e-6) next = 0;
          return next;
        });
        requestRef.current = requestAnimationFrame(step);
      };
      requestRef.current = requestAnimationFrame(step);
      return ()=> cancelAnimationFrame(requestRef.current);
    } else {
      if(requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  },[playing,speed,totalSec]);

  useEffect(()=>{
    // auto predict on mount center window
    if(onPredict){
      const mid = Math.floor(values[0].length/2);
      const half = Math.floor((effectiveWindowSec*sr)/2);
      const s = Math.max(0, mid-half);
      const e = Math.min(values[0].length, s + Math.floor(effectiveWindowSec*sr));
      const window = values.map(ch => ch.slice(s,e));
      onPredict({ sr, channels: values.length, window }).then(res=>console.log('predict',res)).catch(()=>{});
    }
  },[]);

  function getWindowSamples(){
    const startSec = Math.max(0, cursorSec - effectiveWindowSec/2);
    const endSec = Math.min(totalSec, startSec + effectiveWindowSec);
    const sIdx = Math.floor(startSec * sr);
    const eIdx = Math.floor(endSec * sr);
    return { sIdx, eIdx, startSec, endSec };
  }
  const continuousTraces = useMemo(()=>{
    const { sIdx, eIdx } = getWindowSamples();
    const t = Array.from({length: eIdx-sIdx}, (_,i) => (sIdx + i)/sr - (cursorSec - effectiveWindowSec/2));
    return selectedChannels.map((chIdx, i) => ({
      x: t, y: values[chIdx].slice(sIdx,eIdx), name: `ch${chIdx}`, type:'scatter', mode:'lines'
    }));
  }, [cursorSec, effectiveWindowSec, selectedChannels, zoom]);
  function toggleChannel(i){
    setSelectedChannels(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev, i].slice(0,12));
  }
  function median(arr){ const s=[...arr].sort((a,b)=>a-b); const m=s.length; return m%2? s[(m-1)/2] : 0.5*(s[m/2-1]+s[m/2]); }
  function computeXor(){
    const { sIdx, eIdx } = getWindowSamples();
    const length = eIdx - sIdx;
    const chunkLen = Math.max(1, Math.floor(xorChunkSec * sr));
    const nChunks = Math.floor(length / chunkLen);
    if(nChunks < 2) return null;
    const base = values[selectedChannels[0]].slice(sIdx, sIdx + chunkLen);
    const baseBin = base.map(v => v > median(base) ? 1 : 0);
    const xorMaps = [];
    for(let k=1;k<nChunks;k++){
      const seg = values[selectedChannels[0]].slice(sIdx + k*chunkLen, sIdx + (k+1)*chunkLen);
      const segBin = seg.map(v => v > median(seg) ? 1 : 0);
      const xor = baseBin.map((b,i)=> b ^ (segBin[i] || 0));
      xorMaps.push(xor);
    }
    return { xorMaps, chunkLen };
  }
  function handlePredict(){
    if(!onPredict) return;
    const { sIdx, eIdx } = getWindowSamples();
    const window = values.map(ch => ch.slice(sIdx,eIdx));
    onPredict({ sr, channels: values.length, window }).then(res=>{
      if(res) alert(`Prediction: ${res.label} (conf=${res.confidence?.toFixed(2)||'N/A'})`);
    });
  }

  return (
    <div style={{display:'flex',gap:12}}>
      <div style={{width:300, padding:12, border:'1px solid #e6e9ee', borderRadius:8, background:'#fff'}}>
        <h3 style={{marginTop:0}}>Controls</h3>
        <div style={{marginTop:8}}>
          <label>View mode</label>
          <select value={viewMode} onChange={e=>setViewMode(e.target.value)} style={{width:'100%'}}>
            <option>Continuous</option><option>XOR</option><option>Polar</option><option>Reoccurrence</option><option>Spectrogram</option>
          </select>
        </div>
        <div style={{marginTop:8}}>Window (s): <input type="range" min={1} max={Math.min(30,Math.floor(totalSec))} value={windowSec} onChange={e=>setWindowSec(Number(e.target.value))} /> <b>{windowSec}s</b></div>
        <div style={{marginTop:8}}>
          <button onClick={()=>setPlaying(!playing)} style={{marginRight:8}}>{playing? 'Pause':'Play'}</button>
          <span>Speed</span>
          <input type="range" min={0.25} max={4} step={0.25} value={speed} onChange={e=>setSpeed(Number(e.target.value))} />
          <span>{speed}x</span>
        </div>
        <div style={{marginTop:8}}>Zoom:
          <button onClick={()=>setZoom(z=>Math.max(0.5, z/1.25))}>-</button>
          <span style={{margin:'0 8px'}}>{zoom.toFixed(2)}x</span>
          <button onClick={()=>setZoom(z=>Math.min(4, z*1.25))}>+</button>
        </div>
        <div style={{marginTop:8}}>Pan:
          <button onClick={()=>setCursorSec(c=>Math.max(0, c - effectiveWindowSec/4))}>◀</button>
          <button onClick={()=>setCursorSec(c=>Math.min(totalSec, c + effectiveWindowSec/4))}>▶</button>
        </div>
        <div style={{marginTop:8}}>XOR chunk (s): <input type="range" min={0.5} max={Math.min(10,windowSec)} step={0.5} value={xorChunkSec} onChange={e=>setXorChunkSec(Number(e.target.value))} /> <b>{xorChunkSec}s</b></div>
        <div style={{marginTop:8}}><button onClick={handlePredict} style={{width:'100%', background:'#2563eb', color:'#fff', padding:8, borderRadius:6}}>Predict</button></div>
        <div style={{marginTop:12}}><h4>Channels</h4>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, maxHeight:220, overflow:'auto'}}>
            {Array.from({length:channels}).map((_,i)=>(<label key={i}><input type="checkbox" checked={selectedChannels.includes(i)} onChange={()=>toggleChannel(i)} /> ch{i}</label>))}
          </div>
        </div>
      </div>

      <div style={{flex:1, padding:12, border:'1px solid #eee', borderRadius:8, background:'#fff'}}>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <div>Viewer — Cursor {cursorSec.toFixed(2)}s / {totalSec.toFixed(1)}s</div>
        </div>
        <div style={{marginTop:12}}>
          {viewMode === "Continuous" && (<Plot data={continuousTraces} layout={{height:Math.max(300, selectedChannels.length*120), xaxis:{title:'Time (s)'}}} config={{responsive:true}} />)}
          {viewMode === "XOR" && (()=>{ const xor = computeXor(); if(!xor) return <div>Not enough chunks.</div>; return <div><h4>XOR map</h4>{xor.xorMaps.map((r,ri)=>(<div key={ri} style={{display:'flex'}}>{r.map((v,ci)=>(<div key={ci} style={{width:3,height:8, background: v? '#111':'#fff'}}/>))}</div>))}</div> })()}
          {viewMode === "Reoccurrence" && (()=>{ if(selectedChannels.length<2) return <div>Select at least 2 channels.</div>; const {sIdx,eIdx}=getWindowSamples(); const x=values[selectedChannels[0]].slice(sIdx,eIdx); const y=values[selectedChannels[1]].slice(sIdx,eIdx); return <Plot data={[{x,y, mode:'markers', marker:{size:3}}]} layout={{height:500}} /> })()}
        </div>
      </div>
    </div>
  );
}
