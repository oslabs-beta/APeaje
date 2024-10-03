import express, {Express, Request, Response, NextFunction } from 'express';

const setupDatabase = require('../database/sqlite.js');
const db = setupDatabase();
const { selectTierBasedOnBudget, selectTierBasedOnTime, updateBudget } = require('../apiUtils.js');

const query = (sql, params = []) => {
    return db.prepare(sql).all(params)
}


  const configController = () => {
    const newBudget = async(req:Request, res:Response, next:NextFunction) => {
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

      updateBudget.run(data.budget, )

      next()
    } catch(error) {
        console.error('Error updating Budget in the backend', error); 
        res.status(500).send('Error from updateBudget middleware')
    }
  }
}
  




  module.exports = configController;

