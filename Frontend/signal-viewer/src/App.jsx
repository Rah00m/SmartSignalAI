
import React, { useState, useEffect } from 'react'
import EEGViewer from './components/EEGViewer'
export default function App(){
  const [apiUrl, setApiUrl] = useState('http://127.0.0.1:5000/api/predict')
  const [exampleData, setExampleData] = useState(null)
  useEffect(()=>{
    const sr = 128
    const dur = 10
    const n = sr*dur
    const channels = 8
    const values = []
    for(let ch=0; ch<channels; ch++){
      const phase = Math.random()*Math.PI*2
      const arr = new Array(n).fill(0).map((_,i)=> Math.sin(2*Math.PI*(8+ch)*(i/sr)+phase) + 0.15*(Math.random()-0.5))
      values.push(arr)
    }
    setExampleData({ sr, channels, values })
  },[])
  return (
    <div style={{padding:16}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h1>SmartEEG-AI — EEG Viewer</h1>
        <div>
          <label style={{marginRight:8}}>Backend API:</label>
          <input style={{width:320}} value={'http://127.0.0.1:5000/api/predict'} onChange={()=>{}} />
        </div>
      </div>
      {exampleData && <EEGViewer data={exampleData} onPredict={async (payload)=>{ try{ const resp = await fetch('http://127.0.0.1:5000/api/predict',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)}); return resp.json(); }catch(e){ console.error(e); return {label:'error', confidence:0}; } }} />}
    </div>
  )
}
