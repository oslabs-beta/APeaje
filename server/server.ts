import express, {Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
//import dashboardController from './controller/dashboardController'
import dashboardSQL from './controller/dashboardSQL'
import setupDatabase from './database/sqlite';
import { selectTierBasedOnBudget, selectTierBasedOnTime, updateBudget } from './apiUtils';

import config from '../config';
require('dotenv').config();

console.log(setupDatabase)

export const db = setupDatabase();

const openaiApiKey: (string | undefined) = process.env.OPENAI_API_KEY;

const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.resolve(__dirname, '../dist')));

// set up database
const realDB = setupDatabase();

const dummyDB = setupDatabase();

// console.log('sqlite db in server.tx', db)

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader:string = req.headers['authorization'];
  console.log('authHeader', authHeader)
  const token:string = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.body.user = user;
    next();
  });
};

app.get('/', (req: Request, res: Response ) => {
  res.status(200).send('mainpage');
});

// app.get('/dashboard/chart', dashboardController.lineGraph, (req, res) =>{
//   res.status(200).send(res.locals.data)
// } )

app.get('/dashboard/chart', dashboardSQL.barGraph, (req: Request, res: Response) =>{
  res.status(200).send(res.locals.bargraph)
} )
app.get('/dashboard/initialAmount', dashboardSQL.initialAmount, (req: Request, res: Response) => {
  res.status(200).send(res.locals.initialAmount)
})
app.get('/dashboard/remaining_balance', dashboardSQL.remainingBalance, (req: Request, res: Response) => {
  res.status(200).send(res.locals.remainingBalance)
})

app.get('/dashboard/tiers', dashboardSQL.tierInfo, (req: Request, res: Response) => {
  res.status(200).send(res.locals.tierInfo)
})

app.get('/dashboard/totalRequests', dashboardSQL.totalRequests, (req: Request, res: Response) => {
  res.status(200).send(res.locals.totalRequests)
})


app.get('/dashboard', (req: Request, res: Response) => {
  res
    .status(200)
    .sendFile(path.resolve(__dirname, '../dashboard/public/dash.html'));
});

interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}


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
      const user = getUser.get(username) as User | undefined;

      if (user) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
          const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET as string
          );
          res.json({
            token,
            userId: user.id,
            role: user.role,
            message: 'Login successful',
          });
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


app.post('/generate-image', async (req: Request, res: Response) => {
  
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

    console.log('Inserting query with tier_id:', selectedTierConfig.id);

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
app.get('*', (req: Request, res: Response) => {
  console.log('error finding url for 404 error');
  res.status(404).send('Not Found');
});

/**
 * Global error handler
 */
app.use('/', (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const defaultErr = {
    log: 'Express error handler caught unknown error',
    status: 500,
    message: { err: 'An error occurred' },
  };
  const errorObj = Object.assign({}, defaultErr, err);
  console.log(errorObj.log);
  return res.status(errorObj.status).json(errorObj.message);
})

const PORT = process.env.PORT || 2024;
app.listen(PORT, (): void => console.log(`Server running on port ${PORT}`));
