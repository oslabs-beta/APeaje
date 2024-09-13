const config = require('./config');

function loadAPIConfigs(db) {
  const tiers = db.prepare('SELECT * FROM Tiers').all();
  const apiConfigs = {};

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

  return apiConfigs;
}


function checkBudget(db, api_name) {
  const budget = db.prepare('SELECT * FROM Budget WHERE api_name = ?').get(api_name);
  return budget;
}

function updateBudget(db, api_name, cost) {
  const updateBudget = db.prepare(`
    UPDATE Budget
    SET spent = spent + ?,
        total_spent = total_spent + ?
    WHERE api_name = ?
  `);
  updateBudget.run(cost, cost, api_name);
}


function selectTierBasedOnThreshold(apiName, thresholdType, value) {
  const thresholds = config.apis[apiName].thresholds[thresholdType];
  
  // iterate through thresholds
  for (const threshold of thresholds) {
    // if budget threshold and value is above or equal to threshold
    if (thresholdType === 'budget' && value >= threshold.threshold) {
      return config.apis[apiName].tiers[threshold.tier];
    // if time threshold and value is within the time range
    } else if (thresholdType === 'time' && value >= threshold.start && value < threshold.end) {
      return config.apis[apiName].tiers[threshold.tier];
    }
  }
  
  // if no threshold is met, return the lowest tier
  return config.apis[apiName].tiers['F'];
}

function selectTierBasedOnBudget(db, apiName) {
  // get current budget 
  const budgetInfo = checkBudget(db, apiName);
  //  percentage
  const remainingBudgetPercentage = ((budgetInfo.budget - budgetInfo.spent) / budgetInfo.budget) * 100;
  // select tier based on budget threshold
  return selectTierBasedOnThreshold(apiName, 'budget', remainingBudgetPercentage);
}

function selectTierBasedOnTime(apiName) {
  const currentHour = new Date().getHours();

  // select tier based on time threshold
  return selectTierBasedOnThreshold(apiName, 'time', currentHour);
}

module.exports = {
  loadAPIConfigs,
  checkBudget,
  updateBudget,
  selectTierBasedOnBudget,
  selectTierBasedOnTime
};