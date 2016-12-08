const pg = require('pg');
const fs = require('fs');
const logger = require("./logging.js");
const FISHER_USER_MATCH = require('./fisher_user_match');
const FISHER_CHILDREN_MATCH = require('./fisher_children_match');
const FISHER_RECORDS_RECEIVED = require('./fisher_records_received');

var client = new pg.Client();
var DB_URL = 'postgres://eaveeikumjabqn:HoOE8hCrYllmUdWI_fwNyi_NN0@ec2-54-247-98-197.eu-west-1.compute.amazonaws.com:5432/d1qik232pvmso9';
//creates 'logging.txt' file that will be send in email after checks and stores logs from various tests
logger.create_log(fs);

//connects to PG database will output to console if connection is succesful
pg.defaults.ssl = true;
pg.connect(DB_URL , function(err, client) {

  if (err) throw err;
  console.log('Connected to postgres succesfully \r\n');
  //logger.write_to_log(fs,'Connected to postgres successfully  \r\n\n')
  fisherTests(client, fs, logger, function(){
    console.log("\nFisher Tests Run");
    logger.write_to_log(fs, "\n Fisher Test Run");
    logger.send_log_report();
  })
});

function fisherTests(client, fs, logger, callback){
  FISHER_RECORDS_RECEIVED.runTest(client, fs, function(returned_text){
    FISHER_USER_MATCH.runTest(client, fs, function(returned_text_2){
      FISHER_CHILDREN_MATCH.runTest(client, fs, function(returned_text_3){
        var finalLogArray = {};
          finalLogArray.records_recieved = returned_text;
          finalLogArray.user_match = returned_text_2;
          finalLogArray.records_recieved = returned_text_3;

        callback();
      })
    })
  }, function(){s
    console.log("No Records Received Fisher Tests Aborted");
    logger.write_to_log(fs,"No Records Received Fisher Tests Aborted")
  })
}
