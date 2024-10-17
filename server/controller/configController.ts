import { Request, Response, NextFunction } from 'express';
import { Database } from 'better-sqlite3';
import { sqliteController } from '../database/sqliteController';

import { selectTierBasedOnBudget, selectTierBasedOnTime, updateBudget } from '../apiUtils';



const configController = () => {}

  configController.newBudget = async(req:Request, res:Response, next:NextFunction) => {
    const {data} = req.body
    console.log('data in config', data )
    try {
      if(!data) {
      console.error('data not found from updateBudget')
      }

      const updateBudget = await query(
      `UPDATE Budget
      SET budget = ?
      WHERE api_name = ?`)

      console.log()
      // updateBudget.run(data.budget)

      next()
    } catch(error) {
        console.error('Error updating Budget in the backend', error); 
        res.status(500).send('Error from updateBudget middleware')
    }
  }


export default configController;
