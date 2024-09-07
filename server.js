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

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );
    res.json({ userId: result.rows[0].id, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (await bcrypt.compare(password, user.password)) {
        res.json({ userId: user.id, message: 'Login successful' });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error during login' });
  }
});






app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;
  
  // test for time of day
  const hour = new Date().getHours();
  let selectedConfig = config.A; // default to mid
  
  if (hour >= 22 || hour < 6) {
    selectedConfig = config.A; // low for night hours?
  } else if (hour >= 10 && hour < 18) {
    selectedConfig = config.A; // high hours
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
    
    console.log('Selected config:', selectedConfig);
    console.log('Selected config:', selectedConfig);
    console.log('Price:', selectedConfig.price);
    // sotre in db
    const { data, error } = await supabase
      .from('queries')
      .insert({
        prompt: prompt,
        model_version: `${selectedConfig.model}-${selectedConfig.quality}-${selectedConfig.size}`,
        cost: selectedConfig.price
      })
      .select();

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
    cost NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);"
*/

/*
-- Users table
CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Queries table
CREATE TABLE queries (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    tier VARCHAR(20) NOT NULL,
    cost NUMERIC(10, 4) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- APIs table
CREATE TABLE apis (
    name VARCHAR(50) PRIMARY KEY,
    budget NUMERIC(10, 2) NOT NULL,
    amount_spent NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- Updated Config table
CREATE TABLE config (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(50) NOT NULL,
    tier VARCHAR(20) NOT NULL,
    tier_config JSONB NOT NULL,
    thresholds JSONB,
    UNIQUE (api_name, tier)
);
*/ 