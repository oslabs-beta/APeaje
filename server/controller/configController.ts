import { Request, Response, NextFunction } from 'express';
import { Database } from 'better-sqlite3';
import { updateBudget } from '../apiUtils';

interface ConfigControllerInterface {
  newBudget: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

const configController: ConfigControllerInterface = {
  newBudget: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { budget, apiName } = req.body;

      if (!budget || !apiName) {
        res.status(400).send('Budget and API name are required');
        return;
      }

      console.log('Received configuration:', { budget, apiName });

      updateBudget(res.locals.db as Database, apiName, budget);

      res.locals.newBudget = budget;
      next();
    } catch (error) {
      console.error('Error updating Budget in the backend', error);
      res.status(500).send('Error from updateBudget middleware');
    }
  }
};

export default configController;