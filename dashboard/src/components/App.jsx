// App.jsx
import React, { useState } from 'react';
const api_key = process.env.OPENAI_API_KEY;

function App() {
  const [promptState, updatePrompt] = useState('Type a Prompt');
  const [imageUrlState, setImageUrl] = useState(
    'https://upload.wikimedia.org/wikipedia/commons/7/79/M%C3%B6bius_Strip.jpg');

  const generateImage = async () => {
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
      <img src={imageUrlState} width='512'></img>
      <input
        type='label'
        value={promptState}
        onChange={(e) => updatePrompt(e.target.value)}
      ></input>
      <button onClick={generateImage}>submit</button>
    </>
  );
}

export default App;

//  <Route path="/myCloset" element={<MyCloset />} />
