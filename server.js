const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database/sqlite.js');

const openaiApiKey = process.env.OPENAI_API_KEY;

const app = express();
app.use(express.json());
app.use(cors());

const config = {
  A: { model: 'dall-e-3', quality: 'hd', size: '1024x1792', price: 0.0120 },
  B: { model: 'dall-e-3', quality: 'hd', size: '1024x1024', price: 0.0080 },
  C: { model: 'dall-e-3', quality: 'Standard', size: '1024x1792', price: 0.0080 },
  D: { model: 'dall-e-3', quality: 'Standard', size: '1024x1024', price: 0.0040 },
  E: { model: 'dall-e-2', quality: 'Standard', size: '512x512', price: 0.0018 },
  F: { model: 'dall-e-2', quality: 'Standard', size: '256x256', price: 0.0016 }
};

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
  const { prompt, api_name } = req.body;
  
  try {
    // get the tier information
    const getTier = db.prepare('SELECT * FROM Tiers WHERE api_name = ? ORDER BY price DESC LIMIT 1');
    const tier = getTier.get(api_name);

    if (!tier) {
      return res.status(400).json({ error: 'Invalid API or no tiers available' });
    }

    const requestBody = {
      model: config[tier.tier_name].model,
      prompt: prompt,
      n: 1,
      size: config[tier.tier_name].size,
    };

    if (config[tier.tier_name].model === 'dall-e-3') {
      requestBody.quality = config[tier.tier_name].quality;
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
    
    console.log('Selected tier:', tier);
    console.log('Price:', tier.price);

    // store in db
    const insertQuery = db.prepare('INSERT INTO Queries (api_name, prompt, tier_id, dynamic_cost) VALUES (?, ?, ?, ?)');
    insertQuery.run(api_name, prompt, tier.id, tier.price);

    // update budget
    const updateBudget = db.prepare('UPDATE Budget SET spent = spent + ?, total_spent = total_spent + ? WHERE api_name = ?');
    updateBudget.run(tier.price, tier.price, api_name);

    res.json({ imageUrl: openaiData.data[0].url, cost: tier.price });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while generating the image' });
  }
});

// get all tiers
app.get('/tiers', authenticateToken, (req, res) => {
  try {
    const getTiers = db.prepare('SELECT * FROM Tiers');
    const tiers = getTiers.all();
    res.json(tiers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tiers' });
  }
});

// New endpoint to update or insert a tier
app.post('/update-tier', authenticateToken, (req, res) => {
  const { api_name, tier_name, price, thresholds } = req.body;
  try {
    const upsertTier = db.prepare(`
      INSERT INTO Tiers (api_name, tier_name, price, thresholds)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(api_name, tier_name) DO UPDATE SET
      price = excluded.price,
      thresholds = excluded.thresholds
    `);
    const result = upsertTier.run(api_name, tier_name, price, JSON.stringify(thresholds));
    res.json({ message: 'Tier updated successfully', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Error updating tier' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));