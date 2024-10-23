import config from '../config';
import { Database } from 'better-sqlite3';

interface BudgetInfo {
  id: number;
  api_name: string;
  budget: number;
  spent: number;
  total_spent: number;
}

interface TierData {
  api_name: string;
  tier_name: string;
  tier_config: string;
  id: number;
  cost: number;
}

function loadAPIConfigs(db: Database) {
  const tiers = db.prepare('SELECT * FROM Tiers').all() as TierData[];
  const apiConfigs: { [key: string]: { [key: string]: any } } = {};
  for (const tier of tiers) {
    if (!apiConfigs[tier.api_name]) {
      apiConfigs[tier.api_name] = {};
    }
    apiConfigs[tier.api_name][tier.tier_name] = {
      ...JSON.parse(tier.tier_config),
      id: tier.id,
      price: tier.cost
    };
  }
  console.log('what is apiConfigs', apiConfigs);
  return apiConfigs;
}

function updateBudget(db: Database, api_name: string, cost: number): void {
  const updateBudget = db.prepare(`
    UPDATE Budget
    SET budget = ?
    WHERE api_name = ?
  `);
  const result = updateBudget.run(cost, api_name);

  // Log the update
  console.log(`Budget updated for ${api_name}: Cost: ${cost}, Rows affected: ${result.changes}`);

  // Fetch and log the updated budget
  const updatedBudget = checkBudget(db, api_name);
  console.log(`Updated budget for ${api_name}:`, updatedBudget);
}

function checkBudget(db: Database, api_name: string): BudgetInfo {
  const budget = db.prepare('SELECT * FROM Budget WHERE api_name = ?').get(api_name) as BudgetInfo;
  return budget;
}

function selectTierBasedOnThreshold(apiName: string, thresholdType: 'budget' | 'time', value: number) {
  const thresholds = config.apis[apiName].thresholds[thresholdType];
  // iterate through thresholds
  for (const threshold of thresholds) {
    // if budget threshold and value is above or equal to threshold
    if (thresholdType === 'budget' && value >= threshold.threshold) {
      const selectedTier = config.apis[apiName].tiers[threshold.tier];
      selectedTier.id = threshold.tier;
      return selectedTier;
      // if time threshold and value is within the time range
    } else if (thresholdType === 'time' && value >= threshold.start && value < threshold.end) {
      const selectedTier = config.apis[apiName].tiers[threshold.tier];
      selectedTier.id = threshold.tier;
      return selectedTier;
    }
  }
  const lowestTier = config.apis[apiName].tiers['F'];
  lowestTier.id = 'F';
  return lowestTier;
}

function selectTierBasedOnBudget(db: Database, apiName: string) {
  // get current budget
  const budgetInfo = checkBudget(db, apiName);
  // percentage
  const remainingBudgetPercentage = ((budgetInfo.budget - budgetInfo.spent) / budgetInfo.budget) * 100;
  // select tier based on budget threshold
  return selectTierBasedOnThreshold(apiName, 'budget', remainingBudgetPercentage);
}

function selectTierBasedOnTime(db: Database, apiName: string) {
  const currentHour = new Date().getHours();
  // select tier based on time threshold
  return selectTierBasedOnThreshold(apiName, 'time', currentHour);
}

export {
  loadAPIConfigs,
  checkBudget,
  updateBudget,
  selectTierBasedOnBudget,
  selectTierBasedOnTime
};