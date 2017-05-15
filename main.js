//load all the required packages/modules
const pg = require('pg');
const fs = require('fs');
const email = require('./email');
const FISHER_USER_MATCH = require('./fisher_user_match');
const FISHER_CHILDREN_MATCH = require('./fisher_children_match');
const FISHER_RECORDS_RECEIVED = require('./fisher_records_received');
const MONITOR_RECORDS_RECEIVED = require('./monitor_records_received');
const FISHER_DISPLAYED_PROFIT = require('./fisher_displayed_profit_check');
const CATCH_QUANTITY_CHECK = require('./catch_quanity_check');
const STR_NO_RECORDS_RECEIVED = "No Records Received - No Further Fisher Tests Run";

let total_errors = 0;
let tests_run = 0;
let tests_failed = 0;
let dashline = "-------------------------------------------------\n\n";

//the subject of the email that will either be 'All okay' or 'some failed' depending on the outcome of tests
let job_subject;

//create a timestamp in UTC and create master log for tests
let timestamp = new Date();
let log = "Heroku validation job started at: " + timestamp + "\n\n";
console.log("Heroku validation job started at: " + timestamp + "\n\n");

//create new postgres client and get postgres URL from heroku enviroment letiable
let client = new pg.Client();
let DB_URL =  process.env.DATABASE_URL;
//handle the time period between which the query searches.
//if no time period specified default to last 24 hours
let currentdate = new Date();
let yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

//if valid argument are entered set them as the start and end date in the query's of the Tests
if (process.argv[2] != undefined || process.argv[3] != undefined) {
    let startdate = new Date(process.argv[2]);
    let enddate = new Date(process.argv[3]);
    startdate = startdate.toISOString();
    enddate = enddate.toISOString();
    console.log("Range Date Specified.\nRunning Tests for records between " + startdate + " and " + enddate + " (time in UTC)\n");
    log += "Range Date Specified.\nRunning Tests for records between " + startdate + " and " + enddate + ' (time in UTC)\n\n'
}

/*else if no date or invalid dates are given as arguments the end date will be set to the current time and the
 //start date to 24h before the start date. i.e. will run query for last 24 hours
 */
else {
    let startdate = yesterday;
    let enddate = currentdate;
    startdate = startdate.toISOString();
    enddate = enddate.toISOString();
    console.log("No Date Range Specified - Defaulting to the last 24h.\nRunning Tests for records between " + startdate + " and " + enddate + " (time in UTC)\n");
    log += "No Date Range Specified - Defaulting to the last 24h.\nRunning Tests for records between " + startdate + " and " + enddate + ' (time in UTC)\n\n'
}


//connects to PG database will output to console if connection is succesful
pg.defaults.ssl = true;
pg.connect(DB_URL , function(err, client) {

    if (err) throw err;
    console.log('Connected to postgres succesfully \n' + dashline);
    log += ('Connected to postgres succesfully \n\n' + dashline);

    //fisher tests are run where after email is send
    fisherTests(client, log, startdate, enddate, function(test_logs, errors){

        //monitor tests currently commented out
        log += test_logs;

//    monitorTests(client, log, startdate, enddate, function(test_logs){

        total_errors += errors;
//      log += test_logs
        let finsishTime = new Date();
        console.log("Job Finished at: " + finsishTime.toISOString() + "\n\n");
        log += "Job Finished at: " + finsishTime + "\n\n";
        console.log("Summary: ");
        log += "Summary: \n";
        console.log("Tests Run: " + tests_run);
        log += "Tests Run: " + tests_run + "\n";
        console.log("Tests Failed: " + tests_failed);
        log += "Tests Failed: " + tests_failed + "\n";
        console.log("Total Errors: " + total_errors);
        log += "Total Errors: " + total_errors + "\n";
        let runtime = finsishTime.getTime() - timestamp.getTime();
        console.log("Runtime: " + runtime / 1000 + " seconds");
        log += "Runtime: " + runtime / 1000 + " seconds\n";
        if (total_errors != 0){
            job_subject = "Some Failed"
        }
        else{
            job_subject = "All OK"
        }
        if (test_logs == STR_NO_RECORDS_RECEIVED){
            job_subject += " (NO TRIPS RECEIVED)"
        }
        email.send_report(log, job_subject, function(){
            client.end();
        })
//    })
    })
});

//master fisher test function if records are received run all test else if first test fails
//no other fisher tests will be run
function fisherTests(client, log, startdate, enddate, callback){
    console.log("Running fisher records received...");
    FISHER_RECORDS_RECEIVED.runTest(client, startdate, enddate,  function(returned_text){
        tests_run += 1;
        returned_text += dashline;
        console.log("Running fisher user match...");
        FISHER_USER_MATCH.runTest(client, startdate, enddate,  function(returned_text_2,errors_1){
            tests_run += 1;
            returned_text_2 += dashline;
            if (errors_1 != 0){
                tests_failed += 1
            }
            console.log("Running fisher children match...");
            FISHER_CHILDREN_MATCH.runTest(client, startdate, enddate,  function(returned_text_3, errors_2){
                tests_run += 1;
                returned_text_3 += dashline;
                if (errors_2 != 0){
                    tests_failed += 1
                }
                console.log("Running displayed profit match...");
                FISHER_DISPLAYED_PROFIT.runTest(client, startdate, enddate, function(returned_text_4, errors_3){
                    tests_run += 1;
                    returned_text_4 += dashline;
                    if (errors_3 != 0){
                        tests_failed += 1
                    }
                    console.log("Running quantity check match...");
                    CATCH_QUANTITY_CHECK.runTest(client, startdate, enddate, function(returned_text_5, errors_4){
                        tests_run += 1;
                        returned_text_5 += dashline;
                        if (errors_4 != 0){
                            tests_failed += 1
                        }
                        callback(returned_text + returned_text_2 + returned_text_3 + returned_text_4 + returned_text_5, errors_1 + errors_2 + errors_3 + errors_4)
                    })

                })

            })
        })
    }, function(){
        total_errors +=1;
        tests_run += 1;
        tests_failed +=1;
        console.log(STR_NO_RECORDS_RECEIVED);
        callback( STR_NO_RECORDS_RECEIVED )
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
        callback(returned_text + "No Further Monitor Tests Run\n\n" + dashline)
    })
}
