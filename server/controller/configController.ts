import { Request, Response, NextFunction } from 'express';
import { Database } from 'better-sqlite3';
import { sqliteController } from '../database/sqliteController';

import { selectTierBasedOnBudget, selectTierBasedOnTime, updateBudget } from '../apiUtils';



const configController : any = {}

  configController.newBudget = async(req:Request, res:Response, next:NextFunction) => {
    try {
    const {budget, timeRange, tiers, thresholds } = req.body;
    // if (!budget || !timeRange) {
    if(!budget) {
      return res.status(400).send('All fields are required')
    };

    console.log('Received configuration:', {
      budget, 
      // timeRange,
      // tiers,
      // thresholds,
    })
  
      const updateBudget = await sqliteController.run(res.locals.db,
      `UPDATE Budget
      SET budget = ?`, [budget]);

      console.log('updateBudget', updateBudget)
      res.locals.newBudget = updateBudget
      next()
    } catch(error) {
        console.error('Error updating Budget in the backend', error); 
        res.status(500).send('Error from updateBudget middleware')
    }
  }



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

