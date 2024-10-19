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


  configController.updateTiers = async(req:Request, res:Response, next:NextFunction) => {
    try {
    const {budget, timeRange, tiers, thresholds } = req.body;
    if(!tiers) {
      return res.status(400).send('Tier is not selected')
    }
    console.log('Received configuration:', {
      // budget, 
      // timeRange
      tiers,
      thresholds,
    })
    
    // const updateTier = await sqliteController.run(res.locals.db,
    //   `UPDATE 
    //   SET budget = ?`, [budget]);

    //   console.log('updateBudget', updateBudget)
    //   res.locals.newBudget = updateBudget
      next()

    }catch (error) {
      console.error('Error updating Tiers in the backend', error); 
        res.status(500).send('Error from updateTier middleware')

    }
  
  }


export default configController;
*/
