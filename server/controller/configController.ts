import { Request, Response, NextFunction } from 'express';
import { Database } from 'better-sqlite3';
import { sqliteController } from '../database/sqliteController';
import config from '../../config'

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



  configController.updateThresholds = async(req:Request, res:Response, next:NextFunction) => {
    try {
    const {thresholds} = req.body; //{threshold:50, tier: 'A'}
    if(!thresholds) {
      return res.status(400).send('No thresholds provided')
    }
    console.log('Received configuration:',thresholds)

    // need to make the correct format of thresholds // right now, it is in array of obejct 
    // check if the thresholds is equal to tier_name 
       // Update each threshold in the database
     // Update each threshold in the database



     
     for (const { threshold, tier } of thresholds) {
      // Ensure tier exists in the config before updating
      const tierConfig = config.apis.openai.tiers[tier];
      if (!tierConfig) {
          return res.status(400).send(`Tier ${tier} not found in configuration`);
      }

      // Update the threshold for the corresponding tier
      const updateThresholdsStmt = await sqliteController.run(res.locals.db,
          `UPDATE Tiers
          SET thresholds = ?
          WHERE tier_name = ?`, [threshold, tier]);

      console.log(`Updated tier ${tier} with threshold ${threshold}`, updateThresholdsStmt);
  }
      console.log('update Tiers with thresholds', thresholds)
      // res.locals.thresholds= updateThresholds
      next()

    }catch (error) {
      console.error('Error updating Tiers in the backend', error); 
        res.status(500).send('Error from updateThreshold middleware')
    }
  }
export default configController;

