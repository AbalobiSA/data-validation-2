//load all the required packages/modules
const pg = require('pg');
const fs = require('fs');
const email = require('./email')
const FISHER_USER_MATCH = require('./fisher_user_match');
const FISHER_CHILDREN_MATCH = require('./fisher_children_match');
const FISHER_RECORDS_RECEIVED = require('./fisher_records_received');
const MONITOR_RECORDS_RECEIVED = require('./monitor_records_received')

//create a timestamp in UTC and create master log for tests
var timestamp = new Date();
var log = "Heroku validation job started at: " //+ timestamp + "\n\n"

//create new postgres client and get postgres URL from heroku enviroment variable
var client = new pg.Client();
var DB_URL =  process.env.DATABASE_URL
//handle the time period between which the query searches.
//if no time period specified default to last 24 hours
var currentdate = new Date()
var yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1);

//if valid argument are entered set them as the start and end date in the query's of the Tests
if (process.argv[2] != undefined || process.argv[3] != undefined) {
  var startdate = new Date(process.argv[2])
  var enddate = new Date(process.argv[3])
  startdate = startdate.toISOString();
  enddate = enddate.toISOString();
  console.log("start date: " + startdate)
  console.log("end date: " + enddate)
  log += "Dates Specified.\n Running Test between " + startdate + " and " + enddate + '\n\n'
}

/*else if no date or invalid dates are given as arguments the end date will be set to the current time and the
//start date to 24h before the start date. i.e. will run query for last 24 hours
*/
else {
  var startdate = yesterday;
  var enddate = currentdate;
  startdate = startdate.toISOString();
  enddate = enddate.toISOString();
  console.log("started date: " + startdate)
  console.log("ended date: " + enddate)
  log += "No Dates Specified.\n Running Test between " + startdate + " and " + enddate + '\n\n'
}


//connects to PG database will output to console if connection is succesful
pg.defaults.ssl = true;
pg.connect(DB_URL , function(err, client) {

  if (err) throw err;
  console.log('Connected to postgres succesfully \n');
  log += 'Connected to postgres succesfully \n\n'

  //fisher tests are run where after email is send
fisherTests(client, log, startdate, enddate, function(test_logs){

  log += test_logs

    monitorTests(client, log, startdate, enddate, function(test_logs){

      log += test_logs
      email.send_report(log, function(){
        client.end();
      })
    })
    })
});

//master fisher test function if records are received run all test else if first test fails
//no other fisher tests will be run
function fisherTests(client, log, startdate, enddate, callback){

  FISHER_RECORDS_RECEIVED.runTest(client, startdate, enddate,  function(returned_text){
    FISHER_USER_MATCH.runTest(client, startdate, enddate,  function(returned_text_2){
      FISHER_CHILDREN_MATCH.runTest(client, startdate, enddate,  function(returned_text_3){
        callback(returned_text + returned_text_2 + returned_text_3);
      })
    })
  }, function(){
    console.log("No Records Received Fisher Tests Not Run");
    callback( "No Records Received - Fisher Tests Not Run")
  })
}

function monitorTests(client, log, startdate, enddate, callback){

  MONITOR_RECORDS_RECEIVED.runTest(client, startdate, enddate,  function(returned_text){
    //run other tests
    callback(returned_text)
  },function(returned_text){
    callback(returned_text + "Monitor Tests Not Run")
  })
}
