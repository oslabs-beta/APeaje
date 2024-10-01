import express, {Express, Request, Response, NextFunction } from 'express';
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const dashboardController = require('./controller/dashboardController')
const setupDatabase = require('./database/sqlite.js');
 const { selectTierBasedOnBudget, selectTierBasedOnTime, updateBudget } = require('./apiUtils.js');
const config = require('../config.js');
require('dotenv').config();

const openaiApiKey: (string | undefined) = process.env.OPENAI_API_KEY;

const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.resolve(__dirname, '../dist')));
const db = setupDatabase();


const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.body.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.status(200).send('mainpage');
});

app.get('/dashboard/chart', (req, res, next) => {

  next();
},
  dashboardController.lineGraph,
  (req, res) => {
    res.status(200).send(res.locals.data);
  }
)

app.get('/dashboard', (req, res) => {
  res
    .status(200)
    .sendFile(path.resolve(__dirname, '../dashboard/public/dash.html'));
});

app.post('/register', async (req: Request, res: Response) => {
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

app.post('/login', async (req: Request, res: Response) => {
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


app.post('/generate-image', authenticateToken, async (req: Request, res: Response) => {
  
  const { prompt, useTimeBasedTier } = req.body;

  try {
    const selectedTierConfig = useTimeBasedTier ? selectTierBasedOnTime(db, 'openai')  : selectTierBasedOnBudget(db, 'openai');

    console.log('Selected tier config:', selectedTierConfig);

    if (!selectedTierConfig) {
      return res.status(400).json({ error: 'No tiers available' });
    }

    const requestBody = {
      model: selectedTierConfig.model,
      prompt: prompt,
      n: 1,
      size: selectedTierConfig.size,
      quality: selectedTierConfig.quality
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

    console.log('OpenAI response:', JSON.stringify(openaiData));

    updateBudget(db, 'openai', selectedTierConfig.price);

    const insertQuery = db.prepare('INSERT INTO Queries (api_name, prompt, tier_id) VALUES (?, ?, ?)');
    insertQuery.run('openai', prompt, selectedTierConfig.id);

    res.json({
      ...openaiData,
      tier: selectedTierConfig
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while generating the image' });
  }
});

/**
 * 404 handler
 */
app.get('*', (req, res) => {
  console.log('error finding url');
  res.status(404).send('Not Found');
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.log(err);
  console.log('hit global error');

  res.status(500).send({ error: err });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
