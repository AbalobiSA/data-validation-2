//load all the required packages/modules
const pg = require('pg');
const fs = require('fs');
const email = require('./email')
const FISHER_USER_MATCH = require('./fisher_user_match');
const FISHER_CHILDREN_MATCH = require('./fisher_children_match');
const FISHER_RECORDS_RECEIVED = require('./fisher_records_received');
const MONITOR_RECORDS_RECEIVED = require('./monitor_records_received')

var total_errors = 0;
var tests_run = 0;
var tests_failed = 0;
var dashline = "-------------------------------------------------\n\n"

//the subject of the email that will either be 'All okay' or 'some failed' depending on the outcome of tests
var job_subject

//create a timestamp in UTC and create master log for tests
var timestamp = new Date();
var log = "Heroku validation job started at: " + timestamp + "\n\n"
console.log("Heroku validation job started at: " + timestamp + "\n\n")

//create new postgres client and get postgres URL from heroku enviroment variable
var client = new pg.Client();
var DB_URL =  process.env.DATABASE_URL || 'postgres://eaveeikumjabqn:HoOE8hCrYllmUdWI_fwNyi_NN0@ec2-54-247-98-197.eu-west-1.compute.amazonaws.com:5432/d1qik232pvmso9'
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
  console.log("Range Date Specified.\nRunning Tests for records between " + startdate + " and " + enddate + " (time in UTC)\n")
  log += "Range Date Specified.\nRunning Tests for records between " + startdate + " and " + enddate + ' (time in UTC)\n\n'
}

/*else if no date or invalid dates are given as arguments the end date will be set to the current time and the
//start date to 24h before the start date. i.e. will run query for last 24 hours
*/
else {
  var startdate = yesterday;
  var enddate = currentdate;
  startdate = startdate.toISOString();
  enddate = enddate.toISOString();
  console.log("No Date Range Specified - Defaulting to the last 24h.\nRunning Tests for records between " + startdate + " and " + enddate + " (time in UTC)\n")
  log += "No Date Range Specified - Defaulting to the last 24h.\nRunning Tests for records between " + startdate + " and " + enddate + ' (time in UTC)\n\n'
}


//connects to PG database will output to console if connection is succesful
pg.defaults.ssl = true;
pg.connect(DB_URL , function(err, client) {

  if (err) throw err;
  console.log('Connected to postgres succesfully \n' + dashline);
  log += ('Connected to postgres succesfully \n\n' + dashline)

  //fisher tests are run where after email is send
fisherTests(client, log, startdate, enddate, function(test_logs, errors){

  log += test_logs

    monitorTests(client, log, startdate, enddate, function(test_logs){

      total_errors += errors
      log += test_logs
      var finsishTime = new Date()
      console.log("Job Finished at: " + finsishTime.toISOString() + "\n\n")
      log += "Job Finished at: " + finsishTime + "\n\n"
      console.log("Summary: ")
      log += "Summary: \n"
      console.log("Tests Run: " + tests_run)
      log += "Tests Run: " + tests_run + "\n"
      console.log("Tests Failed: " + tests_failed)
      log += "Tests Failed: " + tests_failed + "\n"
      console.log("Total Errors: " + total_errors)
      log += "Total Errors: " + total_errors + "\n"
      var runtime = finsishTime.getTime() - timestamp.getTime()
      console.log("Runtime: " + runtime / 1000 + " seconds")
      log += "Runtime: " + runtime / 1000 + " seconds\n"
      if (total_errors != 0){
        job_subject = "Some Failed"
      }
      else{
        job_subject = "All OK"
      }
     email.send_report(log, job_subject, function(){
        client.end();
      })
    })
    })
});

//master fisher test function if records are received run all test else if first test fails
//no other fisher tests will be run
function fisherTests(client, log, startdate, enddate, callback){

  FISHER_RECORDS_RECEIVED.runTest(client, startdate, enddate,  function(returned_text){
    tests_run += 1;
    returned_text += dashline
    FISHER_USER_MATCH.runTest(client, startdate, enddate,  function(returned_text_2,errors_1){
      tests_run += 1;
      returned_text_2 += dashline
      if (errors_1 != 0){
        tests_failed += 1
      }
      FISHER_CHILDREN_MATCH.runTest(client, startdate, enddate,  function(returned_text_3, errors_2){
        tests_run += 1;
        returned_text_3 += dashline
        if (errors_2 != 0){
          tests_failed += 1
        }
        callback(returned_text + returned_text_2 + returned_text_3, errors_1 + errors_2 )
      })
    })
  }, function(){
    total_errors +=1;
    tests_run += 1;
    tests_failed +=1;
    console.log("No Records Received Fisher Tests Not Run");
    callback( "No Records Received - Fisher Tests Not Run" )
  })
}

function monitorTests(client, log, startdate, enddate, callback){

  MONITOR_RECORDS_RECEIVED.runTest(client, startdate, enddate,  function(returned_text){
    tests_run += 1;
    //run other tests
    callback(returned_text + dashline)
  },function(returned_text){
    total_errors +=1;
    tests_run +=1;
    tests_failed +=1;
    callback(returned_text + "Monitor Tests Not Run\n\n" + dashline)
  })
}
