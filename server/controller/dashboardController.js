// const setupDatabase = require('../database/sqlite.js');
// const db = setupDatabase();
const dashboardController = {};
require('dotenv').config();

// console.log('sqlite database', db)

const { Pool } = require('pg');

const PG_URI = process.env.PG_URI;

// create a new pool here using the connection string above
const pool = new Pool({
  connectionString: PG_URI
});

// Adding some notes about the database here will be helpful for future you or other developers.
// Schema for the database can be found below:
// https://github.com/CodesmithLLC/unit-10SB-databases/blob/master/docs/assets/images/schema.png

// We export an object that contains a property called query,
// which is a function that returns the invocation of pool.query() after logging the query
// This will be required in the controllers to be the access point to the database

query = (text, params, callback) => {
    console.log('executed query', text);
    return pool.query(text, params, callback);
  }

dashboardController.lineGraph = async (req, res, next) => {

  //console.log('supabase', supabase
  const data = await query("SELECT DATE_TRUNC('day', timestamp) as time, CAST(SUM(cost) as DECIMAL) as cost, COUNT(id) as requests FROM queries GROUP BY time ORDER BY time"); //await supabase.from('queries').select('*');
  console.log('data', data.rows);

  res.locals.data = data.rows;
  next();
}




module.exports = dashboardController;