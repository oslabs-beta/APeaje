const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const setupDatabase = require('./Server/database/sqlite.js');
const { loadAPIConfigs, checkBudget, updateBudget, selectTierBasedOnBudget } = require('./apiUtils.js');

const openaiApiKey = process.env.OPENAI_API_KEY;

const app = express();
app.use(express.json());
app.use(cors());
const db = setupDatabase();


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

  try {
    // const selectedTierConfigselectTierBasedOnTime()
    // get tier from budget 
     const selectedTierConfig = selectTierBasedOnBudget(db, 'openai'); // => A
     console.log('budget tier config', selectedTierConfig);  // debug 

    // new way of accessing the tier
    const apiConfigs = loadAPIConfigs(db);



    const tierConfig = selectedTierConfig;

    if (!tierConfig) {
      return res.status(400).json({ error: 'no tiers available' });
    }
   
    const requestBody = {
      model: tierConfig.model,
      prompt: prompt,
      n: 1,
      size: tierConfig.size,
      quality: tierConfig.quality
    };
    
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
    console.log('openai response', JSON.stringify(openaiData));
    
    // add spent money
    updateBudget(db, 'openai', tierConfig.price);

    // store in db 
    const insertQuery = db.prepare('INSERT INTO Queries (api_name, prompt, tier_id) VALUES (?, ?, ?)');
    insertQuery.run('openai', prompt, tierConfig.id);
    


    // ideally in the future we would like to be as neutral as possible, so maybe returning whole response so that thyhe user can do anything, and think what other things are important to add to the response (tier used)
    res.json({ 
      imageUrl: openaiData.data[0].url, 
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while generating the image' });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));