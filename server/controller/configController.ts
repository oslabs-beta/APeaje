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
  createApiConfig: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteApiConfig: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getApiConfig: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  listApiConfigs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  validateApiConfig: (config: any) => { isValid: boolean; errors: string[] };
}

const configController: ConfigControllerInterface = {
  // updates or creates new budget
  newBudget: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { budget, apiName } = req.body;
      if (!budget || !apiName) {
        res.status(400).send('budget and api name are required');
        return;
      }
      updateBudget(res.locals.db as Database, apiName, budget);
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
      const { apiName, thresholds } = req.body;

      if (!apiName || !thresholds) {
        res.status(400).send('api name and thresholds required');
        return;
      }

      const db = res.locals.db as Database;
      const tiersStmt = db.prepare('select tier_name from tiers where api_name = ?');
      const tiers = tiersStmt.all(apiName) as { tier_name: string }[];

      if (!tiers.length) {
        res.status(404).send('api configuration not found');
        return;
      }

      const updateThresholdStmt = db.prepare(`
        update tiers
        set thresholds = ?
        where api_name = ? and tier_name = ?
      `);

      const transaction = db.transaction(() => {
        for (const tier of tiers) {
          const tierThresholds = {
            budget: thresholds.budget?.find(t => t.tier === tier.tier_name) || null,
            time: thresholds.time?.find(t => t.tier === tier.tier_name) || null
          };
          updateThresholdStmt.run(
            JSON.stringify(tierThresholds),
            apiName,
            tier.tier_name
          );
        }
      });

      transaction();
      res.locals.updatedThresholds = thresholds;
      next();
    } catch (error) {
      console.error('error updating thresholds:', error);
      res.status(500).send('error updating thresholds');
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

7. update thresholds:
   endpoint: PUT /api-config/:apiName/thresholds
   body: {
     thresholds: {
       budget: [{ tier: "tier1", threshold: 95 }],
       time: [{ tier: "tier1", start: 8, end: 18 }]
     }
   }
*/