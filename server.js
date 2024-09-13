const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();
const path = require('path')
const app = express();
app.use(express.json());
app.use(cors());

const openaiApiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// test config for dalle only 
const config = {
  high: { size: '1024x1024', cost: 20 },
  mid: { size: '512x512', cost: 10 },
  low: { size: '256x256', cost: 5 },
};

app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;
  
  // test for time of day
  const hour = new Date().getHours();
  let selectedConfig = config.mid; // default to mid
  
  if (hour >= 22 || hour < 6) {
    selectedConfig = config.low; // low for night hours?
  } else if (hour >= 10 && hour < 18) {
    selectedConfig = config.high; // high hours
  }

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: selectedConfig.size,
      }),
    });

    const openaiData = await openaiResponse.json();
    
    // sotre in db
    const { data, error } = await supabase
      .from('queries')
      .insert({
        prompt: prompt,
        model_version: selectedConfig.size,
        cost: selectedConfig.cost,
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
