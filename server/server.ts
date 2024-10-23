import express, {Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import 'dotenv/config'

import configController from './controller/configController';
import dashboardSQL from './controller/dashboardSQL'
import { initializeDatabase, connectDatabase, resetDatabase, DatabaseController, databaseMiddleware } from './database/sqliteController';
import { setupDummyDatabase } from './database/dummyDB';
import authController from './controller/authController';
import { selectTierBasedOnBudget, selectTierBasedOnTime, updateBudget } from './apiUtils';

import config from '../config';

let dbController: DatabaseController;
const isDummyDatabase = true; // set this to true to use the dummy database

if (isDummyDatabase) {
  dbController = setupDummyDatabase();
} else {
  dbController = initializeDatabase();
}

dbController.initialize();




const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.resolve(__dirname, '../dist')));
// attach db to middleware 
app.use(databaseMiddleware(dbController));

app.get('/', (req: Request, res: Response ) => {
  res.status(200).send('mainpage');
});

// app.get('/dashboard/chart', dashboardController.lineGraph, (req, res) =>{
  //   res.status(200).send(res.locals.data)
  // } )
  
  app.get('/dashboard/chart', authController.verify, dashboardSQL.barGraph, (req: Request, res: Response) =>{
    res.status(200).send(res.locals.bargraph)
  } )
  app.get('/dashboard/initialAmount', authController.verify, dashboardSQL.initialAmount, (req: Request, res: Response) => {
    res.status(200).send(res.locals.initialAmount)
  })
  app.get('/dashboard/remaining_balance', authController.verify, dashboardSQL.remainingBalance, (req: Request, res: Response) => {
    res.status(200).send(res.locals.remainingBalance)
  })
  
  app.get('/dashboard/tiers', authController.verify, dashboardSQL.tierInfo, (req: Request, res: Response) => {
    res.status(200).send(res.locals.tierInfo)
  })
  
  app.get('/dashboard/totalRequests', authController.verify, dashboardSQL.totalRequests, (req: Request, res: Response) => {
    res.status(200).send(res.locals.totalRequests)
  })
  
  
  app.get('/dashboard', authController.verify, (req: Request, res: Response) => {
    res
    .status(200)
    .sendFile(path.resolve(__dirname, '../dashboard/public/dash.html'));
  });
  
  app.patch('/configuration', authController.verify, configController.newBudget,  (req:Request, res:Response) => {
    res.status(200).send('Budget has been updated')
  })
  
  app.post('/api/register', authController.register,  (req: Request, res: Response) => {
    res.json(res.locals.response)
  });
  
  app.post('/api/login', authController.login, (req: Request, res: Response) => {
    res.json(res.locals.response)
  });
  
  //should be pulled from app's request
  const openaiApiKey: (string | undefined) = process.env.OPENAI_API_KEY;
  app.post('/generate-image', async (req: Request, res: Response) => {
    
    const { prompt, useTimeBasedTier } = req.body;

  try {
    const selectedTierConfig = useTimeBasedTier ? selectTierBasedOnTime(res.locals.db, 'openai')
      : selectTierBasedOnBudget(res.locals.db, 'openai');

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

    updateBudget(res.locals.db, 'openai', selectedTierConfig.price);

    const insertQuery = res.locals.db.prepare('INSERT INTO Queries (api_name, prompt, tier_id) VALUES (?, ?, ?)');

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
