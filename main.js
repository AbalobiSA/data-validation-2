const pg = require('pg');
const fs = require('fs');
const email = require('./email')
const FISHER_USER_MATCH = require('./fisher_user_match');
const FISHER_CHILDREN_MATCH = require('./fisher_children_match');
const FISHER_RECORDS_RECEIVED = require('./fisher_records_received');

var timestamp = new Date();
var log = "Heroku validation job started at: " + timestamp + "\n\n"

var client = new pg.Client();
var DB_URL = process.env.DATABASE_URL
//creates 'logging.txt' file that will be send in email after checks and stores logs from various tests


//connects to PG database will output to console if connection is succesful
pg.defaults.ssl = true;
pg.connect(DB_URL , function(err, client) {

  if (err) throw err;
  console.log('Connected to postgres succesfully \n');
  log += 'Connected to postgres succesfully \n\n'

  fisherTests(client, log, function(test_logs){
    console.log("\nFisher Tests Run");
    log += test_logs
    log += "\nFisher Tests Run\n"
    email.send_report(log, function(){
      client.end();
    })
  })
});

function fisherTests(client, log, callback){
  FISHER_RECORDS_RECEIVED.runTest(client,  function(returned_text){
    FISHER_USER_MATCH.runTest(client,  function(returned_text_2){
      FISHER_CHILDREN_MATCH.runTest(client,  function(returned_text_3){
         //log += (returned_text + returned_text_2 + returned_text_3)
        callback(returned_text + returned_text_2 + returned_text_3);
      })
    })
  }, function(){s
    console.log("No Records Received Fisher Tests Aborted");
    log += "No Records Received Fisher Tests Aborted"
  })
}
