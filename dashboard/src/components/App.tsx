import React, { useState } from 'react';
import RealTimeChart from './RealTimeChart.jsx'
import '../../public/style.css'

const App = () => (

<<<<<<< HEAD:dashboard/src/components/App.jsx
    <>
     <h1>Dashboard</h1>
     <RealTimeChart />
=======
  const generateImage = async (): Promise<void> => {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          //'Authorization': `Bearer ${api_key}`
        },
        body: JSON.stringify({
          prompt: promptState,
        }),
      });

      const data = await response.json();
      console.log(data);
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  return (
    <>
      <h1>PROMPT: {promptState}</h1>
      <img src={imageUrlState} width='512' alt={promptState}></img>
      <input
        type='label'
        value={promptState}
        onChange={(e) => updatePrompt(e.target.value)}
      />
      <button onClick={generateImage}>submit</button>
>>>>>>> 4fe6537 (added types to App.tsx and server.ts):dashboard/src/components/App.tsx
    </>
)

export default App;

{/* <RealTimeChart /> */}