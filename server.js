const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const openaiApiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/*
const config = {
  high: { size: '1024x1024', cost: 20 },
  mid: { size: '512x512', cost: 10 },
  low: { size: '256x256', cost: 5 },
};
*/

const config = {
  A: { model: 'dall-e-3', quality: 'hd', size: '1024x1792', price: 0.0120 },
  B: { model: 'dall-e-3', quality: 'hd', size: '1024x1024', price: 0.0080 },
  C: { model: 'dall-e-3', quality: 'Standard', size: '1024x1792', price: 0.0080 },
  D: { model: 'dall-e-3', quality: 'Standard', size: '1024x1024', price: 0.0040 },
  E: { model: 'dall-e-2', quality: 'Standard', size: '512x512', price: 0.0018 },
  F: { model: 'dall-e-2', quality: 'Standard', size: '256x256', price: 0.0016 }
};





app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;
  
  // test for time of day
  const hour = new Date().getHours();
  let selectedConfig = config.F; // default to mid
  
  if (hour >= 22 || hour < 6) {
    selectedConfig = config.A; // low for night hours?
  } else if (hour >= 10 && hour < 18) {
    selectedConfig = config.D; // high hours
  }

  try {
    const requestBody = {
      model: selectedConfig.model,
      prompt: prompt,
      n: 1,
      size: selectedConfig.size,
    };

    //  quality only for DALL-E 3
    if (selectedConfig.model === 'dall-e-3') {
      requestBody.quality = selectedConfig.quality;
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const openaiData = await openaiResponse.json();
    
    // sotre in db
    const { data, error } = await supabase
      .from('queries')
      .insert({
        prompt: prompt,
        model_version: `${selectedConfig.model}-${selectedConfig.quality}-${selectedConfig.size}`,
        cost: Math.round(selectedConfig.price * 100), // convert to cents
        response: JSON.stringify(openaiData),
      });

    if (error) throw error;

    res.json({ imageUrl: openaiData.data[0].url });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'error occurred while generating the image' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/*"CREATE TABLE queries (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    cost INTEGER NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);"
*/