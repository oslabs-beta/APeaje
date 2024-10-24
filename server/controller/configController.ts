import { Request, Response, NextFunction } from 'express';
import { Database } from 'better-sqlite3';
import { updateBudget } from '../apiUtils';

// core types for configuration
interface TierConfig {
  model: string;
  quality: string;
  size: string;
  price: number;
  id?: string;
  threshold?: {
    budget?: number;
    time?: { start: number; end: number; };
  };
}

// database row types
interface BudgetRow {
  api_name: string;
  budget: number;
  spent: number;
  total_spent: number;
}

interface ThresholdConfig {
  [tier: string]: {
    budget?: number;
    time?: {
      start: string;  // HH:mm format
      end: string;    // HH:mm format
    };
  };
}

interface TierRow {
  api_name: string;
  tier_name: string;
  tier_config: string;
  thresholds: string;
  cost: number;
}

interface Thresholds {
  budget?: Array<{ tier: string; threshold: number }>;
  time?: Array<{ tier: string; start: number; end: number }>;
}

interface ConfigControllerInterface {
  newBudget: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateTiers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateThresholds: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  createApiConfig?: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteApiConfig?: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getApiConfig?: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  listApiConfigs?: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  validateApiConfig?: (config: any) => { isValid: boolean; errors: string[] };
}

const configController: ConfigControllerInterface = {
  // updates or creates new budget
  newBudget: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { budget, api_name } = req.body;
      if (!budget || !api_name) {
        res.status(400).send('budget and api name are required');
        return;
      }
      updateBudget(res.locals.db as Database, api_name, budget);
      res.locals.newBudget = budget;
      next();
    } catch (error) {
      console.error('error updating budget:', error);
      res.status(500).send('error updating budget');
    }
  },

  // updates existing tier configurations
  updateTiers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tiers } = req.body;
      if (!Array.isArray(tiers)) {
        res.status(400).send('valid tiers array required');
        return;
      }

      const db = res.locals.db as Database;
      const updateTierStmt = db.prepare(`
        update tiers 
        set tier_config = ?, thresholds = ?, cost = ?
        where api_name = ? and tier_name = ?
      `);

      const transaction = db.transaction((tiersToUpdate: TierConfig[]) => {
        for (const tier of tiersToUpdate) {
          updateTierStmt.run(
            JSON.stringify({ model: tier.model, quality: tier.quality, size: tier.size }),
            JSON.stringify({
              budget: tier.threshold?.budget || null,
              time: tier.threshold?.time || null
            }),
            tier.price,
            'openai',
            tier.id
          );
        }
      });

      transaction(tiers);
      res.locals.updatedTiers = tiers;
      next();
    } catch (error) {
      console.error('error updating tiers:', error);
      res.status(500).send('error updating tiers');
    }
  },

  // updates thresholds for existing tiers
  updateThresholds: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { api_name } = req.params;
      const { thresholds } = req.body as { thresholds: ThresholdConfig };

      // check required inputs
      // if no API name or thresholds object provided, return 400 error
      if (!api_name || !thresholds) {
        res.status(400).json({ error: 'api name and thresholds required' });
        return;
      }

      const db = res.locals.db as Database;

      // check if API exists in database
      // query database to get all tier names for this API
      const tiersStmt = db.prepare('select tier_name from tiers where api_name = ?');
      const existingTiers = tiersStmt.all(api_name) as { tier_name: string }[];

      // if no tiers found for this API, it doesn't exist
      if (!existingTiers.length) {
        res.status(404).json({ error: 'api configuration not found' });
        return;
      }

      // check if provided tiers actually exist for this API
      // compare provided tier names against existing tier names
      const providedTiers = Object.keys(thresholds);
      const validTiers = existingTiers.map(t => t.tier_name);
      const invalidTiers = providedTiers.filter(t => !validTiers.includes(t));

      // if any invalid tiers found, return error with list of invalid tiers
      if (invalidTiers.length > 0) {
        res.status(400).json({
          error: 'invalid tiers provided',
          invalidTiers
        });
        return;
      }

      // check if budget thresholds sum to 100%
      // extract all tiers that have budget thresholds
      const budgetThresholds = Object.entries(thresholds)
        .filter(([_, config]:any[]) => config.budget !== undefined)
        .map(([tier, config]:any[]) => ({
          tier,
          budget: config.budget as number
        }));

      // if there are any budget thresholds, verify their sum
      if (budgetThresholds.length > 0) {
        const budgetSum = budgetThresholds.reduce((sum, { budget }) => sum + budget, 0);

        // check if sum is exactly 100 (within floating point rounding error)
        if (Math.abs(budgetSum - 100) > 0.001) {
          res.status(400).json({
            error: 'invalid budget thresholds',
            message: `Budget thresholds must sum to exactly 100%. Current sum: ${budgetSum}%`,
            budgetThresholds
          });
          return;
        }
      }

      // check individual threshold values
      // validate time format and budget range for each tier
      const timeFormatRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (const [tier, config] of Object.entries(thresholds) as any[]) {
        // if time thresholds provided, validate HH:mm format
        if (config.time) {
          if (!timeFormatRegex.test(config.time.start) || !timeFormatRegex.test(config.time.end)) {
            res.status(400).json({
              error: 'invalid time format',
              message: 'Time must be in HH:mm format',
              tier
            });
            return;
          }
        }

        // if budget threshold provided, validate 0-100 range
        if (config.budget !== undefined && (config.budget < 0 || config.budget > 100)) {
          res.status(400).json({
            error: 'invalid budget threshold',
            message: 'Budget threshold must be between 0 and 100',
            tier
          });
          return;
        }
      }


      // prepare database statement for updating thresholds
      const updateThresholdStmt = db.prepare(`
      update tiers
      set thresholds = ?
      where api_name = ? and tier_name = ?
    `);

      // wrap all updates in a transaction for atomicity
      const transaction = db.transaction(() => {
        // update each tier's thresholds
        for (const [tier, config] of Object.entries(thresholds) as any[]) {
          const thresholdConfig = {
            budget: config.budget ?? null,  // use null if budget not provided
            time: config.time ?? null       // use null if time not provided
          };

          // execute update for this tier
          updateThresholdStmt.run(
            JSON.stringify(thresholdConfig),
            api_name,
            tier
          );
        }
      });

      // execute the transaction
      transaction();

      // store updated thresholds for response
      res.locals.updatedThresholds = thresholds;
      next();

    } catch (error) {

      console.error('error updating thresholds:', error);
      res.status(500).json({ error: 'error updating thresholds' });
    }
  },

  // creates new api configuration
  createApiConfig: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { apiName, initialBudget, tiers, thresholds } = req.body;

      const validation = configController.validateApiConfig({ apiName, initialBudget, tiers, thresholds });
      if (!validation.isValid) {
        res.status(400).json({ errors: validation.errors });
        return;
      }

      const db = res.locals.db as Database;

      const transaction = db.transaction(() => {
        // create budget entry
        db.prepare(`
          insert into budget (api_name, budget, spent, total_spent)
          values (?, ?, 0, 0)
        `).run(apiName, initialBudget);

        // create tier entries
        const tierStmt = db.prepare(`
          insert into tiers (api_name, tier_name, tier_config, thresholds, cost)
          values (?, ?, ?, ?, ?)
        `);

        for (const [tierName, tierConfig] of Object.entries(tiers) as [string, TierConfig][]) {
          tierStmt.run(
            apiName,
            tierName,
            JSON.stringify({ model: tierConfig.model, quality: tierConfig.quality, size: tierConfig.size }),
            JSON.stringify({
              budget: thresholds.budget?.find(t => t.tier === tierName) || null,
              time: thresholds.time?.find(t => t.tier === tierName) || null
            }),
            tierConfig.price
          );
        }
      });

      transaction();
      res.locals.newConfig = { apiName, initialBudget, tiers, thresholds };
      next();
    } catch (error) {
      console.error('error creating api configuration:', error);
      res.status(500).send('error creating api configuration');
    }
  },

  // deletes api configuration
  deleteApiConfig: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { apiName } = req.params;
      if (!apiName) {
        res.status(400).send('api name required');
        return;
      }

      const db = res.locals.db as Database;

      const transaction = db.transaction(() => {
        const budgetResult = db.prepare('delete from budget where api_name = ?').run(apiName);
        const tiersResult = db.prepare('delete from tiers where api_name = ?').run(apiName);

        if (budgetResult.changes === 0 && tiersResult.changes === 0) {
          throw new Error('api not found');
        }
      });

      transaction();
      res.locals.deletedApi = apiName;
      next();
    } catch (error) {
      if (error.message === 'api not found') {
        res.status(404).send('api not found');
      } else {
        console.error('error deleting api:', error);
        res.status(500).send('error deleting api');
      }
    }
  },

  // gets single api configuration
  getApiConfig: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { apiName } = req.params;
      if (!apiName) {
        res.status(400).send('api name required');
        return;
      }

      const db = res.locals.db as Database;
      const budget = db.prepare('select * from budget where api_name = ?').get(apiName) as BudgetRow;
      const tiers = db.prepare('select * from tiers where api_name = ?').all(apiName) as TierRow[];

      if (!budget || !tiers.length) {
        res.status(404).send('api not found');
        return;
      }

      const config = {
        apiName,
        budget: budget.budget,
        spent: budget.spent,
        total_spent: budget.total_spent,
        tiers: tiers.reduce<Record<string, any>>((acc, tier) => ({
          ...acc,
          [tier.tier_name]: {
            ...JSON.parse(tier.tier_config),
            price: tier.cost,
            thresholds: JSON.parse(tier.thresholds)
          }
        }), {})
      };

      res.locals.apiConfig = config;
      next();
    } catch (error) {
      console.error('error getting api configuration:', error);
      res.status(500).send('error getting api configuration');
    }
  },

  // lists all api configurations
  listApiConfigs: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = res.locals.db as Database;
      const apiNames = db.prepare('select distinct api_name from budget').all() as { api_name: string }[];

      const configs = apiNames.map(row => {
        const budget = db.prepare('select * from budget where api_name = ?').get(row.api_name) as BudgetRow;
        const tiers = db.prepare('select * from tiers where api_name = ?').all(row.api_name) as TierRow[];
        return {
          apiName: row.api_name,
          budget: budget.budget,
          spent: budget.spent,
          total_spent: budget.total_spent,
          tierCount: tiers.length
        };
      });

      res.locals.apiConfigs = configs;
      next();
    } catch (error) {
      console.error('error listing apis:', error);
      res.status(500).send('error listing apis');
    }
  },

  validateApiConfig: (config: any) => {
    const errors: string[] = [];
    const isValid = (value: any) => value !== undefined && value !== null;

    if (!isValid(config.apiName)) errors.push('api name required');
    if (!isValid(config.initialBudget)) errors.push('initial budget required');
    if (!isValid(config.tiers) || Object.keys(config.tiers).length === 0) {
      errors.push('at least one tier required');
    }

    if (config.tiers) {
      Object.entries(config.tiers).forEach(([tierName, tier]: [string, any]) => {
        if (!isValid(tier.model)) errors.push(`model required for tier ${tierName}`);
        if (!isValid(tier.quality)) errors.push(`quality required for tier ${tierName}`);
        if (!isValid(tier.size)) errors.push(`size required for tier ${tierName}`);
        if (!isValid(tier.price)) errors.push(`price required for tier ${tierName}`);
      });
    }

    return { isValid: errors.length === 0, errors };
  }
};

export default configController;

/*
frontend usage guide:

1. create new api:
   endpoint: POST /api-config
   body: {
     apiName: "myapi",
     initialBudget: 100,
     tiers: {
       tier1: { model: "gpt4", quality: "high", size: "1024x1024", price: 0.12 }
     },
     thresholds: {
       budget: [{ tier: "tier1", threshold: 90 }],
       time: [{ tier: "tier1", start: 9, end: 17 }]
     }
   }

2. get single api:
   endpoint: GET /api-config/:apiName
   returns: full configuration with budget and tiers

3. list all apis:
   endpoint: GET /api-config
   returns: list of apis with basic info

4. delete api:
   endpoint: DELETE /api-config/:apiName
   removes: api and all related data

5. update budget:
   endpoint: POST /api-config/budget
   body: { apiName: "myapi", budget: 200 }

6. update tiers:
   endpoint: PUT /api-config/tiers
   body: {
     tiers: [{
       model: "gpt4",
       quality: "high",
       size: "1024x1024",
       price: 0.15,
       id: "tier1"
     }]
   }

// Example function to update thresholds
const updateThresholds = async (apiName: string, thresholds: ThresholdConfig) => {
    try {
        const response = await fetch(`/api-config/${apiName}/thresholds`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ thresholds })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update thresholds');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating thresholds:', error);
        throw error;
    }
};


const updateThresholds = async (apiName: string, thresholds: ThresholdConfig) => {
    try {
        const response = await fetch(`/api-config/${apiName}/thresholds`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ thresholds })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update thresholds');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating thresholds:', error);
        throw error;
    }
};

 example:
const thresholds = {
    "A": { 
        budget: 80,
        time: { start: "09:00", end: "17:00" }
    },
    "B": { 
        budget: 60,
        time: { start: "17:00", end: "23:00" }
    },
    "C": { budget: 40 }, // time is optional
    "D": { budget: 20 },
    "E": { budget: 10 },
    "F": { budget: 0 }
};

 Update thresholds for OpenAI
await updateThresholds('openai', thresholds);


await updateThresholds('azure', azureThresholds);
*/