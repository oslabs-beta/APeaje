const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const setupDatabase = require('./Server/database/sqlite.js');

const openaiApiKey = process.env.OPENAI_API_KEY;

const app = express();
app.use(express.json());
app.use(cors());
const db = setupDatabase();

/*
const config = {
  A: { model: 'dall-e-3', quality: 'hd', size: '1024x1792', price: 0.0120 },
  B: { model: 'dall-e-3', quality: 'hd', size: '1024x1024', price: 0.0080 },
  C: { model: 'dall-e-3', quality: 'Standard', size: '1024x1792', price: 0.0080 },
  D: { model: 'dall-e-3', quality: 'Standard', size: '1024x1024', price: 0.0040 },
  E: { model: 'dall-e-2', quality: 'Standard', size: '512x512', price: 0.0018 },
  F: { model: 'dall-e-2', quality: 'Standard', size: '256x256', price: 0.0016 }
};
*/

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertUser = db.prepare('INSERT INTO Users (username, password, role) VALUES (?, ?, ?)');
    const result = insertUser.run(username, hashedPassword, role);
    res.json({ userId: result.lastInsertRowid, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});



app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const getUser = db.prepare('SELECT * FROM Users WHERE username = ?');
    const user = getUser.get(username);
    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET);
        res.json({ token, userId: user.id, role: user.role, message: 'Login successful' });
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


app.post('/generate-image', authenticateToken, async (req, res) => {
  const { prompt } = req.body;
  

  // only threshhold for now 
  try {
    const currentHour = new Date().getHours();
    let selectedTier;
    if (currentHour < 6) {
      selectedTier = 'F';
    } else if (currentHour >= 22) {
      selectedTier = 'A';
    } else {
      selectedTier = 'C';
    }
    
    // get tiers (debugging)
    const getTier = db.prepare('SELECT * FROM Tiers WHERE api_name = ? AND tier_name = ?');
    const tier = getTier.get('openai', selectedTier);
    
    if (!tier) {
      return res.status(400).json({ error: 'Invalid tier or no tiers available' });
    }
    
    // parse tier from database  
    const tierConfig = JSON.parse(tier.tier_config);
    
    const requestBody = {
      model: tierConfig.model,
      prompt: prompt,
      n: 1,
      size: tierConfig.size,
      quality: ""
    };
    
    if (tierConfig.model === 'dall-e-3') {
      requestBody.quality = tierConfig.quality;
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
    

    // debug OpenAI response 
    console.log('OpenAI API Response:', JSON.stringify(openaiData));
    

    // debug response
    /*if (!openaiData.data || !openaiData.data[0] || !openaiData.data[0].url) {
      if (openaiData.error) {
        throw new Error(`OpenAI API Error: ${openaiData.error.message}`);
      } else {
        throw new Error('Invalid response from OpenAI API');
      }
    }
    */
    
    // store in db 
    const insertQuery = db.prepare('INSERT INTO Queries (api_name, prompt, tier_id) VALUES (?, ?, ?)');
    insertQuery.run('openai', prompt, tier.id);
    
    res.json({ 
      imageUrl: openaiData.data[0].url, 
      cost: tier.cost,
      usedTier: selectedTier,
      currentHour: currentHour
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while generating the image' });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));