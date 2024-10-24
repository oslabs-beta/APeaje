//npm modules
import express, {Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'path';
import 'dotenv/config'

//our controllers
import authController from './controller/authController';
import configController from './controller/configController';
import dashboardSQL from './controller/dashboardSQL'
import { initializeDatabase, connectDatabase, resetDatabase, DatabaseController, databaseMiddleware } from './database/sqliteController';
import { setupDummyDatabase } from './database/dummyDB';
import { selectTierBasedOnBudget, selectTierBasedOnTime, updateBudget, selectTier } from './apiUtils';

interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

let dbController: DatabaseController;
const isDummyDatabase = false; // set this to true to use the dummy database

if (isDummyDatabase) {
  dbController = setupDummyDatabase();
} else {
  dbController = initializeDatabase();
}

dbController.initialize();

// attach database middleware

const openaiApiKey: (string | undefined) = process.env.OPENAI_API_KEY;

const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, '../dist')));
// attach db to middleware 
app.use(databaseMiddleware(dbController));

app.get('/', (req: Request, res: Response ) => {
  res.status(200).send('mainpage');
});

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

// app.get('/dashboard/thresholds', dashboardSQL.thresholdsInfo, (req: Request, res: Response) => {
//   res.status(200).send(res.locals.thresholdInfo)
// })

app.get('/dashboard/thresholdsChart', authController.verify, dashboardSQL.thresholdsInfo, (req: Request, res: Response) => {
  res.status(200).send(res.locals.thresholdInfo)
})

app.get('/dashboard/totalRequests', authController.verify, dashboardSQL.totalRequests, (req: Request, res: Response) => {
  res.status(200).send(res.locals.totalRequests)
})


app.get('/dashboard', (req: Request, res: Response) => {
  res
    .status(200)
    .sendFile(path.resolve(__dirname, '../dashboard/public/dash.html'));
});


// app.patch('/configuration', configController.newBudget, configController.updateThresholds,  (req:Request, res:Response) => {
//   res.status(200).send('Configuration updated successfully')
// })

// list all API configurations
app.get('/api-config', configController.listApiConfigs, (req: Request, res: Response) => {
  res.status(200).json(res.locals.apiConfigs);
});

// get single API configuration
app.get('/api-config/:apiName', configController.getApiConfig, (req: Request, res: Response) => {
  res.status(200).json(res.locals.apiConfig);
});

// create new API configuration
app.post('/api-config', configController.createApiConfig, (req: Request, res: Response) => {
  res.status(201).json(res.locals.newConfig);
});

// delete API configuration
app.delete('/api-config/:apiName', configController.deleteApiConfig, (req: Request, res: Response) => {
  res.status(200).json({ message: `API ${res.locals.deletedApi} successfully deleted` });
});

// update thresholds for an API
app.put('/api-config/:apiName/thresholds', configController.newBudget, configController.updateThresholds, (req: Request, res: Response) => {
  res.status(200).json(res.locals.updatedThresholds);
});

// PUT request to update the `use_time_based_tier` setting
app.put('/api-config/openai/settings', (req, res) => {
  const { use_time_based_tier } = req.body;

  // validate the request body is a boolean
  if (typeof use_time_based_tier !== 'boolean') {
    return res.status(400).json({ error: 'Invalid value for use_time_based_tier. Expected a boolean.' });
  }

  // prepare the SQL query to update the `use_time_based_tier` setting
  const updateStmt = res.locals.db.prepare(`
    UPDATE Api_settings
    SET use_time_based_tier = ?, updated_at = ?
    WHERE api_name = 'openai'
  `);

  try {
    const now = new Date().toISOString();
    const result = updateStmt.run(use_time_based_tier ? 1 : 0, now);

    // check if the setting was updated successfully
    if (result.changes === 0) {
      return res.status(404).json({ error: 'API settings not found for OpenAI.' });
    }

    res.json({ message: 'Settings updated successfully.', use_time_based_tier, updated_at: now });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'An error occurred while updating the settings.' });
  }
});



app.post('/generate-image', async (req: Request, res: Response) => {
  const { prompt } = req.body;

  try {
    const selectedTierConfig = selectTier(res.locals.db, 'openai');
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

    const insertQuery = res.locals.db.prepare(
      'INSERT INTO Queries (api_name, prompt, tier_id) VALUES (?, ?, ?)'
    );

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

app.post('/api/register', authController.register,  (req: Request, res: Response) => {
  res.json(res.locals.response)
});

app.post('/api/login', authController.login, (req: Request, res: Response) => {
  res.json(res.locals.response)
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
