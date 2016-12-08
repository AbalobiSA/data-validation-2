const pg = require('pg');
const fs = require('fs')
const logger = require("./logging.js")
const FISHER_USER_MATCH = require('./fisher_user_match');
const FISHER_CHILDREN_MATCH = require('./fisher_children_match');
const FISHER_RECORDS_RECEIVED = require('./fisher_records_received');

var client = new pg.Client();
var DB_URL = process.env.DATABASE_URL
//creates 'logging.txt' file that will be send in email after checks and stores logs from various tests
logger.create_log(fs)

//connects to PG database will output to console if connection is succesful
pg.defaults.ssl = true;
pg.connect(DB_URL , function(err, client) {

  if (err) throw err;
  console.log('Connected to postgres succesfully \r\n')
  logger.write_to_log(fs,'Connected to postgres successfully  \r\n\n')
fisherTests(client, fs, logger, function(){
  console.log("\n Fisher Tests Run")
  logger.write_to_log(fs, "\n Fisher Test Run")
  logger.send_report();
})
})

function fisherTests(client, fs, logger, callback){
  FISHER_RECORDS_RECEIVED.runTest(client, fs, function(){
    FISHER_USER_MATCH.runTest(client, fs, function(){
      FISHER_CHILDREN_MATCH.runTest(client, fs, function(){
        callback()
      })
    })
  }, function(){
    console.log("No Records Received Fisher Tests Aborted")
    logger.write_to_log(fs,"No Records Received Fisher Tests Aborted")
  })
}
