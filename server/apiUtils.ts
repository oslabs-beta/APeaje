import config from '../config';
import { Database } from 'better-sqlite3';

// Type definitions for data structures
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
  model: string;
  size: number;
  price: number;
  quality: string;
}

interface APISettings {
  api_name: string;
  use_time_based_tier: number;
  updated_at: string;
}

interface TierConfig {
  model: string;
  quality: string;
  size: string;
}

interface ThresholdConfig {
  budget: number | null;
  time: {
    start: string;
    end: string;
  } | null;
}

interface ProcessedTier {
  model: string;
  quality: string;
  size: string;
  id: string;
  price: number;
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
    SET spent = spent + ?,
        total_spent = total_spent + ?
    WHERE api_name = ?
  `);
  const result = updateBudget.run(cost, cost, api_name);

  console.log(`Budget updated for ${api_name}: Cost: ${cost}, Rows affected: ${result.changes}`);

  const updatedBudget = checkBudget(db, api_name);
  console.log(`Updated budget for ${api_name}:`, updatedBudget);
}


function checkBudget(db: Database, api_name: string): BudgetInfo {
  const budget = db.prepare('SELECT * FROM Budget WHERE api_name = ?').get(api_name) as BudgetInfo;
  return budget;
}

/**
  core logic for selecting a tier based on either budget or time thresholds
      Convert current time and tier times to minutes
      Check if current time falls within any tier's time range
      Handle midnight-spanning ranges (e.g., 22:00-06:00)
  fall back to lowest cost tier if no matches
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isTimeInRange(current: number, start: number, end: number): boolean {
  if (start <= end) {
    return current >= start && current < end;
  } else {
    // handle ranges spanning midnight (e.g., 22:00-06:00)
    return current >= start || current < end;
  }
}

function selectTierBasedOnThreshold(db: Database, apiName: string, thresholdType: 'budget' | 'time', value: number): ProcessedTier {
  // get tiers ordered by cost (highest first)
  const tiers = db.prepare(`
    SELECT tier_name, tier_config, thresholds, cost
    FROM Tiers 
    WHERE api_name = ?
    ORDER BY cost DESC
  `).all(apiName) as Array<{
    tier_name: string;
    tier_config: string;
    thresholds: string;
    cost: number;
  }>;

  for (const tier of tiers) {
    const tierConfig = JSON.parse(tier.tier_config) as TierConfig;
    const thresholds = JSON.parse(tier.thresholds) as ThresholdConfig;

    if (thresholdType === 'budget') {
      // check if remaining budget percentage meets threshold
      if (thresholds.budget !== null && value >= thresholds.budget) {
        return {
          ...tierConfig,
          id: tier.tier_name,
          price: tier.cost
        };
      }
    } else if (thresholdType === 'time') {
      // check if current hour falls within time range
      if (thresholds.time) {
        const currentMinutes = value * 60;
        const startMinutes = parseTimeToMinutes(thresholds.time.start);
        const endMinutes = parseTimeToMinutes(thresholds.time.end);

        if (isTimeInRange(currentMinutes, startMinutes, endMinutes)) {
          return {
            ...tierConfig,
            id: tier.tier_name,
            price: tier.cost
          };
        }
      }
    }
  }

  // fall back to lowest cost tier if no thresholds met
  const lowestTier = tiers[tiers.length - 1];
  return {
    ...JSON.parse(lowestTier.tier_config),
    id: lowestTier.tier_name,
    price: lowestTier.cost
  };
}


function selectTierBasedOnBudget(db: Database, apiName: string): ProcessedTier {
  const budgetInfo = checkBudget(db, apiName);
  const remainingBudgetPercentage = ((budgetInfo.budget - budgetInfo.spent) / budgetInfo.budget) * 100;
  return selectTierBasedOnThreshold(db, apiName, 'budget', remainingBudgetPercentage);
}

function selectTierBasedOnTime(db: Database, apiName: string): ProcessedTier {
  const currentHour = new Date().getHours();
  return selectTierBasedOnThreshold(db, apiName, 'time', currentHour);
}

function getAPISettings(db: Database, api_name: string): APISettings | null {
  const settings = db.prepare(`
    SELECT api_name, use_time_based_tier, updated_at 
    FROM Api_settings 
    WHERE api_name = ?
  `).get(api_name) as APISettings | undefined;

  if (!settings) {
    const insertStmt = db.prepare(`
      INSERT INTO Api_settings (api_name, use_time_based_tier) 
      VALUES (?, 0)
    `);

    try {
      insertStmt.run(api_name);
      return {
        api_name,
        use_time_based_tier: 0,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating default settings:', error);
      return null;
    }
  }

  return settings;
}


function selectTier(db: Database, apiName: string): ProcessedTier {
  try {
    const settings = getAPISettings(db, apiName);

    if (!settings) {
      console.log('No settings found, defaulting to budget-based selection');
      return selectTierBasedOnBudget(db, apiName);
    }

    const useTimeBased = Boolean(settings.use_time_based_tier);
    console.log(`Using ${useTimeBased ? 'time' : 'budget'}-based tier selection for ${apiName}`);

    return useTimeBased ?
      selectTierBasedOnTime(db, apiName) :
      selectTierBasedOnBudget(db, apiName);

  } catch (error) {
    console.error('Error in tier selection:', error);
    return selectTierBasedOnBudget(db, apiName);
  }
}

export {
  loadAPIConfigs,
  checkBudget,
  updateBudget,
  selectTierBasedOnBudget,
  selectTierBasedOnTime,
  selectTier
};