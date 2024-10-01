const setupDatabase = require('../database/sqlite.js');
const db = setupDatabase();

// console.log('sqlite database', db)

const dashboardSQL = {}


// Example of a query method
const query = (sql, params = []) => {
  return db.prepare(sql).all(params)
}

dashboardSQL.barGraph = async (req, res, next) => {
try{

// Query to get budget and queries
const budgetData = await query(`SELECT DATE(Q.timestamp) AS date, SUM(B.total_spent) AS total_spent, COUNT(Q.id) AS number_of_requests FROM Queries Q JOIN Budget B ON Q.api_name = B.api_name GROUP BY DATE(Q.timestamp) ORDER BY DATE(Q.timestamp)`)

console.log('budgetData', budgetData)

res.locals.bargraph = budgetData;
  next()
} catch(error) {
  console.error('Error fetching bar graph data: error ')
 res.status(500).send('Error fetching bar graph data: error')
}}

// give data to the front-end current remaining balance using Budget table
dashboardSQL.remainingBalance = async (req, res, next) => {
 // Query to get the remaining balance
  try {
    const remainingBalance = await query(`SELECT budget - total_spent AS remaining_balance FROM Budget`)
    console.log('remaining balance from backend', remainingBalance)

    res.locals.remainingBalance = remainingBalance;
    next()
  }catch(error) {
    console.error('Error fetching remainingBalance:', error); 
  }

}


dashboardSQL.initialAmount = async (req, res, next) => {
  try {
    const initialAmount = await query(`SELECT budget FROM Budget`)

    console.log('initialAmount from backend', initialAmount)
    res.locals.initialAmount = initialAmount
    next()
  } catch(error) {
    console.error('Error fetching initialAmount:', error); 
    res.status(500).send('Error from initialAmount middleware')
  }

}
// count of total requests from amount of query table??
dashboardSQL.totalRequests = async (req, res, next) => {
    try {
        const totalRequests = await query(`SELECT COUNT(id) AS total_requests FROM Queries`);

        console.log('total request', totalRequests)
        res.locals.totalRequests = totalRequests
        next();
    } catch (error) {
        console.error('Error fetching total requests:', error); 
        res.status(500).send('Error from totalRequests middleware')

    }
}

// gives the break down of tiers with different type of resolutions with cost 

dashboardSQL.tierInfo = async (req, res, next) => {
  try{
    const tierBreakdown = await query(`SELECT tier_name, COUNT(*) AS count FROM Tiers GROUP BY tier_name`)

    console.log('tier breakdown', tierBreakdown)
    res.locals.tierInfo = tierBreakdown
    next();
  } catch (error) {
    console.error('Error fetching tier breakdown:', error); 
    res.status(500).send('Error from tierInfo middleware')
  }
}









module.exports = dashboardSQL;