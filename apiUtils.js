function loadAPIConfigs(db) {
    /*
  function to organize better config across all api tiers 
  looks like this intially

  [
  { api_name: 'openai', tier_name: 'A', tier_config: '{"model":"dall-e-3","quality":"hd","size":"1024x1792"}', cost: 0.0120, id: 1 },
  { api_name: 'openai', tier_name: 'B', tier_config: '{"model":"dall-e-3","quality":"hd","size":"1024x1024"}', cost: 0.0080, id: 2 },
]
  becomes:

{
  openai: {
    A: { model: 'dall-e-3', quality: 'hd', size: '1024x1792', id: 1, price: 0.0120 },
    B: { model: 'dall-e-3', quality: 'hd', size: '1024x1024', id: 2, price: 0.0080 },
  },
  ...potentially more APIs
}
  */
    
  // get all tiers from the database
  const tiers = db.prepare('SELECT * FROM Tiers').all();
  
  const apiConfigs = {};

 // loop through all tiers
  for (const tier of tiers) {

    if (!apiConfigs[tier.api_name]) {
      apiConfigs[tier.api_name] = {};
    }

    // add this tier to the appropriate API obj, added ID maybe useful in the future
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


function selectTierBasedOnBudget(db, apiName) {
  // load all api configurations from the database
  const apiConfigs = loadAPIConfigs(db);

  // get current budget information for the specified api
  const budgetInfo = checkBudget(db, apiName);

  // define budget thresholds and corresponding tiers
  // each object represents minimum budget percentage to that tier speficicly 
  const budgetThresholds = [
    { threshold: 80, tier: 'A' },
    { threshold: 50, tier: 'B' },
    { threshold: 30, tier: 'C' },
    { threshold: 10, tier: 'D' },
    { threshold: 5, tier: 'E' },
    { threshold: 0, tier: 'F' }
  ];

  // calculate remaining budget as a percentage
  const remainingBudgetPercentage = ((budgetInfo.budget - budgetInfo.spent) / budgetInfo.budget) * 100;

  // iterate through thresholds from highest to lowest
  for (const { threshold, tier } of budgetThresholds) {
    // if remaining budget is above or equal to the threshold
    if (remainingBudgetPercentage >= threshold) {
      // return the corresponding tier configuration
      return apiConfigs[apiName][tier];
    }
  }

  // if no threshold is met, return the lowest tier (F)
  return apiConfigs[apiName]['F'];
}


function selectTierBasedOnTime() {
  const currentHour = new Date().getHours();
  
  if (currentHour < 6) {
    return 'F';
  } else if (currentHour >= 22) {
    return 'A';
  } else {
    return 'C';
  }
}


module.exports = {
  loadAPIConfigs,
  checkBudget,
  updateBudget,
  selectTierBasedOnBudget,
  selectTierBasedOnTime
};