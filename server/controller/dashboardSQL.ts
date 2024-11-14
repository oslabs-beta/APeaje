import { Request, Response, NextFunction } from 'express';
import { Database } from 'better-sqlite3';
import { sqliteController } from '../database/sqliteController';

const dashboardSQL: any = {};

dashboardSQL.barGraph = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budgetData = await sqliteController.query(res.locals.db, `
      SELECT 
        DATE(Q.timestamp) AS date,
        SUM(B.total_spent) AS total_spent,
        COUNT(Q.id) AS number_of_requests
      FROM Queries Q
      JOIN Budget B ON Q.id
      GROUP BY DATE(Q.timestamp)
      ORDER BY DATE(Q.timestamp)
    `);
    console.log('budgetData', budgetData);
    res.locals.bargraph = budgetData;
    next();
  } catch (error) {
    console.error('Error fetching bar graph data:', error);
    res.status(500).send('Error fetching bar graph data');
  }
};

dashboardSQL.remainingBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const remainingBalance = await sqliteController.query(res.locals.db, `
      SELECT budget - total_spent AS remaining_balance 
      FROM Budget
    `);
    // console.log('remaining balance from backend', remainingBalance);
    res.locals.remainingBalance = remainingBalance;
    next();
  } catch (error) {
    console.error('Error fetching remainingBalance:', error);
    res.status(500).send('Error fetching remaining balance');
  }
};

dashboardSQL.initialAmount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const initialAmount = await sqliteController.query(res.locals.db, `
      SELECT budget 
      FROM Budget
    `);
    // console.log('initialAmount from backend', initialAmount);
    res.locals.initialAmount = initialAmount;
    next();
  } catch (error) {
    console.error('Error fetching initialAmount:', error);
    res.status(500).send('Error from initialAmount middleware');
  }
};

dashboardSQL.totalRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalRequests = await sqliteController.query(res.locals.db, `
      SELECT COUNT(id) AS total_requests 
      FROM Queries
    `);
    // console.log('total request', totalRequests);
    res.locals.totalRequests = totalRequests;
    next();
  } catch (error) {
    console.error('Error fetching total requests:', error);
    res.status(500).send('Error from totalRequests middleware');
  }
};

dashboardSQL.tierInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tierBreakdown = await sqliteController.query(res.locals.db, `
      SELECT tier_name, COUNT(*) AS count 
      FROM Tiers 
      GROUP BY tier_name
    `);
    // console.log('tier breakdown', tierBreakdown);
    res.locals.tierInfo = tierBreakdown;
    next();
  } catch (error) {
    console.error('Error fetching tier breakdown:', error);
    res.status(500).send('Error from tierInfo middleware');
  }
};

dashboardSQL.thresholdsInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thresholdsBreakdown = await sqliteController.query(res.locals.db, `
      WITH QueryCosts AS (
        SELECT 
          q.tier_id,
          SUM(t.cost) as tier_total_cost
        FROM Queries q
        JOIN Tiers t ON q.tier_id = t.tier_name 
        WHERE t.api_name = 'openai'
        GROUP BY q.tier_id
      )
      SELECT 
        t.tier_name, 
        t.tier_config, 
        t.thresholds, 
        t.cost,
        COUNT(q.id) as request_count,
        COALESCE(qc.tier_total_cost, 0) as spent
      FROM Tiers t
      LEFT JOIN Queries q ON q.tier_id = t.tier_name AND t.api_name = 'openai'
      LEFT JOIN QueryCosts qc ON qc.tier_id = t.tier_name
      WHERE t.api_name = 'openai'
      GROUP BY t.tier_name, t.tier_config, t.thresholds, t.cost
      ORDER BY t.cost DESC;
    `);

    const totalSpent = thresholdsBreakdown.reduce((sum: number, tier: any) => sum + (tier.tier_total_cost || 0), 0);

    await sqliteController.run(res.locals.db, `
      UPDATE Budget 
      SET spent = ?, total_spent = ?
      WHERE api_name = 'openai' 
    `, [totalSpent, totalSpent]);

    res.locals.thresholdInfo = thresholdsBreakdown;
    next();
  } catch (error) {
    next(error);
  }
};



dashboardSQL.fullTierInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fullTierInfo = await sqliteController.query(res.locals.db, `
      SELECT tier_name as id, tier_config, cost as price, thresholds
      FROM Tiers
    `);
    res.locals.fullTierInfo = fullTierInfo;
    next();
  } catch (error) {
    console.error('Error fetching full tier info:', error);
    res.status(500).send('Error from fullTierInfo middleware');
  }
};



export default dashboardSQL;