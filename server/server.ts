//npm modules
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'path';
import 'dotenv/config';
import { Database } from 'better-sqlite3';

//our controllers
import authController from './controller/authController';
import configController from './controller/configController';
import dashboardSQL from './controller/dashboardSQL';
import {
  initializeDatabase,
  connectDatabase,
  resetDatabase,
  DatabaseController,
  databaseMiddleware,
  sqliteController,
} from './database/sqliteController';
import { setupDummyDatabase } from './database/dummyDB';
import {
  selectTierBasedOnBudget,
  selectTierBasedOnTime,
  checkBudget,
  updateBudget,
  updateSpent,
  selectTier,
} from './apiUtils';
import newRole from './controller/manageController';
import exp from 'constants';


interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

let dbController: DatabaseController;

// set this to true to use the dummy database (NOTE CURRENTLY NOT FUNCTIONAL):
const isDummyDatabase = false;

if (isDummyDatabase) {
  dbController = setupDummyDatabase();
} else {
  dbController = initializeDatabase();
}

dbController.initialize();

// attach database middleware

//for saving API KEY on apeaje gateway
//const openaiApiKey: string | undefined = process.env.OPENAI_API_KEY;

const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Old path for Development / tsx deployment
// app.use(express.static(path.resolve(__dirname, '../dist/dashboard')));
// app.use('/dashboard', express.static(path.resolve(__dirname, '../dist/dashboard')));

// New path for production 
app.use(express.static(path.resolve(__dirname, '../dashboard')));
app.use('/dashboard', express.static(path.resolve(__dirname, '../dashboard')));


// attach db to middleware
app.use(databaseMiddleware(dbController));

//GENERATES IMAGE—THIS IS OUR PRIMARY API QUERY REDIRECT ENDPOINT
app.post('/generate-image', async (req: Request, res: Response) => {
  const { prompt } = req.body;

  try {
    console.log('headers', req.headers);
    let key: string  = req.headers.authorization;

    const selectedTierConfig = selectTier(res.locals.db, 'openai');
    console.log('Selected tier config:', selectedTierConfig);

    if (!selectedTierConfig) {
      return res.status(400).json({ error: 'No tiers available' });
    }

    const requestHeaders: HeadersInit = new Headers();
    
    requestHeaders.set('Content-Type', 'application/json');
    requestHeaders.set('Authorization', key);

    const requestBody = {
      model: selectedTierConfig.model,
      prompt: prompt,
      n: 1,
      size: selectedTierConfig.size,
      quality: selectedTierConfig.quality,
    };

    const openaiResponse = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      }
    );

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response:', JSON.stringify(openaiData));

    updateSpent(res.locals.db, 'openai', selectedTierConfig.price);

    const insertQuery = res.locals.db.prepare(
      'INSERT INTO Queries (api_name, prompt, tier_id) VALUES (?, ?, ?)'
    );

    insertQuery.run('openai', prompt, selectedTierConfig.id);
    console.log('TIER PROMPTTTTTTTTTTT', selectedTierConfig.id);

    res.json({
      ...openaiData,
      tier: selectedTierConfig,
    });
  } catch (error) {
    console.error('Error:', error);
    res
      .status(500)
      .json({
        error: error.message || 'An error occurred while generating the image',
      });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('apeaje');
});

app.get(
  '/dashboard/chart',
  dashboardSQL.barGraph,
  (req: Request, res: Response) => {
    res.status(200).send(res.locals.bargraph);
  }
);
app.get(
  '/dashboard/initialAmount',
  dashboardSQL.initialAmount,
  (req: Request, res: Response) => {
    res.status(200).send(res.locals.initialAmount);
  }
);
app.get(
  '/dashboard/remaining_balance',
  dashboardSQL.remainingBalance,
  (req: Request, res: Response) => {
    res.status(200).send(res.locals.remainingBalance);
  }
);

app.get(
  '/dashboard/tiers',
  dashboardSQL.tierInfo,
  (req: Request, res: Response) => {
    res.status(200).send(res.locals.tierInfo);
  }
);

app.post('/manageTeam', (req: Request, res: Response) => {
  res.status(200).send('get to the backend');
});
app.put(
  '/dashboard/users/:userId/role',
  newRole.updateNewRole,
  (req: Request, res: Response) => {
    res.status(200).send(res.locals.newRole);
  }
);
app.delete(
  '/dashboard/users/:userId',
  newRole.deleteUser,
  (req: Request, res: Response) => {
    res.status(200).send(res.locals.deletedUser);
  }
);

app.get(
  '/dashboard/thresholdsChart',
  dashboardSQL.thresholdsInfo,
  (req: Request, res: Response) => {
    res.status(200).send(res.locals.thresholdInfo)
  }
);

app.get(
  '/dashboard/totalRequests',
  dashboardSQL.totalRequests,
  (req: Request, res: Response) => {
    res.status(200).send(res.locals.totalRequests);
  }
);

app.get(
  '/dashboard/users',
  sqliteController.getAllUsers,
  (req: Request, res: Response) => {
    res.status(200).send(res.locals.users);
  }
);



// Old for development 
/*
app.get('/dashboard', (req: Request, res: Response) => {
  res
    .status(200)
    .sendFile(path.resolve(__dirname, '../dashboard/public/dash.html'));
});
*/


// New for production
app.get('/dashboard', (req: Request, res: Response) => {
  res.status(200).sendFile(path.resolve(__dirname, '../dist/index.html'));
});

app.get('/login', (req: Request, res: Response) => {
  res.status(200).sendFile(path.resolve(__dirname, '../dist/index.html'));
});

app.get('/register', (req: Request, res: Response) => {
  res.status(200).sendFile(path.resolve(__dirname, '../dist/index.html'));
});

app.get('/configuration', (req: Request, res: Response) => {
  res.status(200).sendFile(path.resolve(__dirname, '../dist/index.html'));
});

app.get('/manage', (req: Request, res: Response) => {
  res.status(200).sendFile(path.resolve(__dirname, '../dist/index.html'));
});

app.get('/profile', (req: Request, res: Response) => {
  res.status(200).sendFile(path.resolve(__dirname, '../dist/index.html'));
});

// app.patch('/configuration', configController.newBudget, configController.updateThresholds,  (req:Request, res:Response) => {
//   res.status(200).send('Configuration updated successfully')
// })



app.get(
  '/api-config/:apiName/use-time-based-tier',
  configController.getUseTimeBasedTier,
  (req: Request, res: Response) => {
    res.status(200).json({ useTimeBasedTier: res.locals.useTimeBasedTier });
  }
);

// checks budget
app.get('/api-config/:apiName/budget', (req: Request, res: Response) => {
  const { apiName } = req.params;

  try {
    const budgetInfo = checkBudget(res.locals.db as Database, apiName);
    res.status(200).json(budgetInfo);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Error fetching budget information' });
  }
});

// get single API configuration
app.get(
  '/api-config/:apiName',
  configController.getApiConfig,
  (req: Request, res: Response) => {
    res.status(200).json(res.locals.apiConfig);
  }
);

// list all API configurations
app.get(
  '/api-config',
  configController.listApiConfigs,
  (req: Request, res: Response) => {
    res.status(200).json(res.locals.apiConfigs);
  }
);

// create new API configuration
app.post(
  '/api-config',
  configController.createApiConfig,
  (req: Request, res: Response) => {
    res.status(201).json(res.locals.newConfig);
  }
);

// delete API configuration
app.delete(
  '/api-config/:apiName',
  configController.deleteApiConfig,
  (req: Request, res: Response) => {
    res
      .status(200)
      .json({ message: `API ${res.locals.deletedApi} successfully deleted` });
  }
);

//updates budget for API
app.patch(
  '/api-config/:apiName/newBudget',
  configController.newBudget,
  (req: Request, res: Response) => {
    res.status(200).json(res.locals.budgetInfo);
  }
);


// update thresholds for an API
app.put(
  '/api-config/:apiName/thresholds',
  configController.newBudget,
  configController.updateThresholds,
  (req: Request, res: Response) => {
    res.status(200).json(res.locals.updatedThresholds);
  }
);

// PUT request to update the `use_time_based_tier` setting
app.put('/api-config/openai/settings', (req, res) => {
  const { use_time_based_tier } = req.body;

  // validate the request body is a boolean
  if (typeof use_time_based_tier !== 'boolean') {
    return res
      .status(400)
      .json({
        error: 'Invalid value for use_time_based_tier. Expected a boolean.',
      });
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
      return res
        .status(404)
        .json({ error: 'API settings not found for OpenAI.' });
    }

    res.json({
      message: 'Settings updated successfully.',
      use_time_based_tier,
      updated_at: now,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while updating the settings.' });
  }
});

app.put(
  '/api-config/:apiName/save',
  async (req: Request, res: Response, next: NextFunction) => {
    const db = res.locals.db as Database;
    console.log('Save endpoint received payload:', req.body);

    try {
      // Wrap everything in a single transaction
      const transaction = db.transaction(() => {
        // 1. Update budget if provided
        if (req.body.budget !== undefined) {
          updateBudget(db, req.params.apiName, req.body.budget);
        }

        // 2. Update thresholds if provided
        if (req.body.thresholds) {
          const updateThresholdStmt = db.prepare(`
          UPDATE tiers
          SET thresholds = CASE
            WHEN json_valid(thresholds) = 1 THEN
              json_patch(
                COALESCE(thresholds, '{}'),
                json(?)
              )
            ELSE
              json(?)
            END
          WHERE api_name = ? AND tier_name = ?
        `);

          for (const [tier, config] of Object.entries(req.body.thresholds)) {
            const thresholdJson = JSON.stringify(config);
            updateThresholdStmt.run(
              thresholdJson,
              thresholdJson,
              req.params.apiName,
              tier
            );
          }
        }

        // 3. Update API settings if provided
        if (req.body.use_time_based_tier !== undefined) {
          const updateSettingsStmt = db.prepare(`
          INSERT OR REPLACE INTO Api_settings (api_name, use_time_based_tier, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `);

          updateSettingsStmt.run(
            req.params.apiName,
            req.body.use_time_based_tier ? 1 : 0
          );
        }
      });

      transaction();

      // Return updated state
      const updatedBudget = checkBudget(db, req.params.apiName);
      const updatedTiers = db
        .prepare('SELECT tier_name, thresholds FROM tiers WHERE api_name = ?')
        .all(req.params.apiName);
      const updatedSettings = db
        .prepare(
          'SELECT use_time_based_tier FROM Api_settings WHERE api_name = ?'
        )
        .get(req.params.apiName);

      res.status(200).json({
        message: 'Configuration saved successfully',
        budget: updatedBudget,
        thresholds: updatedTiers,
        settings: updatedSettings,
      });
    } catch (error) {
      console.error('Error in save operation:', error);
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  }
);

app.post(
  '/api/register',
  authController.register,
  (req: Request, res: Response) => {
    res.json(res.locals.response);
  }
);

app.post('/api/login', authController.login, (req: Request, res: Response) => {
  res.json(res.locals.response);
});

/**
 * 404 handler
 */

/*
app.get('*', (req: Request, res: Response) => {
  console.log('error finding url for 404 error');
  res.status(404).send('Not Found');
});
*/

// new for development 
app.get('*', (req: Request, res: Response) => {
  res.status(200).sendFile(path.resolve(__dirname, '../dist/index.html'));
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
});

const PORT = process.env.PORT || 2024;
app.listen(PORT, (): void => console.log(`Server running on port ${PORT}`));
