// Load all the required packages/modules
const fs = require('fs');

const email = require('./email');
const salesforce = require('./salesforce');

const FISHER_USER_MATCH = require('./fisher_user_match');
const FISHER_CHILDREN_MATCH = require('./fisher_children_match');
const FISHER_RECORDS_RECEIVED = require('./fisher_records_received');
const MONITOR_RECORDS_RECEIVED = require('./monitor_records_received');
const FISHER_DISPLAYED_PROFIT = require('./fisher_displayed_profit_check');
const CATCH_QUANTITY_CHECK = require('./catch_quantity_check');
const STR_NO_RECORDS_RECEIVED = "No Records Received - No Further Fisher Tests Run";

let totalErrors = 0;
let testsRun = 0;
let testsFailed = 0;
let dashline = "-------------------------------------------------\n\n";

// The subject of the email that will either be 'All okay' or 'some failed' depending on the outcome of tests
let jobSubject;

// Create a timestamp in UTC and create master log for tests
let timestamp = new Date();
let log = "Salesforce validation job started at: " + timestamp + "\n\n";
console.log(log);

// Handle the time period between which the query searches.
// If no time period specified default to last 24 hours
let currentDate = new Date();
let yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

let startDate, endDate;

// If valid argument are entered set them as the start and end date in the query's of the Tests
if (process.argv[2] !== undefined || process.argv[3] !== undefined) {
    startDate = new Date(process.argv[2]);
    endDate = new Date(process.argv[3]);
    startDate = startDate.toISOString();
    endDate = endDate.toISOString();

    console.log("Range Date Specified.\nRunning Tests for records between " + startDate + " and " + endDate + " (time in UTC)\n");
    log += "Range Date Specified.\nRunning Tests for records between " + startDate + " and " + endDate + ' (time in UTC)\n\n'
}
// Else if no date or invalid dates are given as arguments the end date will be set to the current time and the
// start date to 24h before the start date. i.e. will run query for last 24 hours
else {
    startDate = yesterday;
    endDate = currentDate;
    startDate = startDate.toISOString();
    endDate = endDate.toISOString();

    console.log("No Date Range Specified - Defaulting to the last 24h.\nRunning Tests for records between " + startDate + " and " + endDate + " (time in +0:00 UTC)\n");
    log += "No Date Range Specified - Defaulting to the last 24h.\nRunning Tests for records between " + startDate + " and " + endDate + ' (time in +0:00 UTC)\n\n'
}

/**
 * Create a connection to Salesforce and start running the checks
 */
salesforce.createConnection().then(client => {

    // Fisher tests are run where after email is send
    fisherTests(client, log, startDate, endDate, (test_logs, errors) => {

        let finishTime = new Date();
        let runtime = finishTime.getTime() - timestamp.getTime();

        log += test_logs;
        totalErrors += errors;

        console.log(dashline + "\nJob Finished at: " + finishTime.toISOString() + "\n");
        log += "Job Finished at: " + finishTime + "\n\n";
        console.log("Summary: ");
        log += "Summary: \n";
        console.log("Tests Run: " + testsRun);
        log += "Tests Run: " + testsRun + "\n";
        console.log("Tests Failed: " + testsFailed);
        log += "Tests Failed: " + testsFailed + "\n";
        console.log("Total Errors: " + totalErrors);
        log += "Total Errors: " + totalErrors + "\n";
        console.log("Runtime: " + runtime / 1000 + " seconds");
        log += "Runtime: " + runtime / 1000 + " seconds\n";

        if (totalErrors !== 0) {
            jobSubject = "Some Failed"
        } else {
            jobSubject = "All OK"
        }

        if (test_logs === STR_NO_RECORDS_RECEIVED) {
            jobSubject += " (NO TRIPS RECEIVED)"
        }

        email.send_report(log, jobSubject, () => {
            console.log('Report sent ;)');
        });
    });
}).catch(err => {
    console.log(err);
    console.log('Could not connect to Salesforce. Exiting...');
    process.exit(1);
});

/**
 * Master fisher test function if records are received run all test else if first test fails
 * no other fisher tests will be run
 * @param client
 * @param log
 * @param startDate
 * @param endDate
 * @param callback
 */
function fisherTests(client, log, startDate, endDate, callback) {
    console.log(dashline + "Running fisher records received...");

    FISHER_RECORDS_RECEIVED.runTest(client, startDate, endDate, (returnedText) => {
        testsRun += 1;
        returnedText += dashline;
        console.log(dashline + "Running fisher user match...");

        FISHER_USER_MATCH.runTest(client, startDate, endDate, (returnedText_2, errors_1) => {
            testsRun += 1;
            returnedText_2 += dashline;
            testsFailed = errors_1 !== 0 ? testsFailed + 1 : testsFailed;

            console.log(dashline + "\nRunning fisher children match...");

            FISHER_CHILDREN_MATCH.runTest(client, startDate, endDate, (returnedText_3, errors_2) => {
                testsRun += 1;
                returnedText_3 += dashline;
                testsFailed = errors_2 !== 0 ? testsFailed + 1 : testsFailed;

                console.log(dashline + "\nRunning displayed profit match...");

                FISHER_DISPLAYED_PROFIT.runTest(client, startDate, endDate, (returnedText_4, errors_3) => {
                    testsRun += 1;
                    returnedText_4 += dashline;
                    testsFailed = errors_3 !== 0 ? testsFailed + 1 : testsFailed;

                    console.log(dashline + "\nRunning quantity check match...");

                    CATCH_QUANTITY_CHECK.runTest(client, startDate, endDate, (returnedText_5, errors_4) => {
                        testsRun += 1;
                        returnedText_5 += dashline;
                        testsFailed = errors_4 !== 0 ? testsFailed + 1 : testsFailed;

                        callback(returnedText + returnedText_2 + returnedText_3 + returnedText_4 + returnedText_5, errors_1 + errors_2 + errors_3 + errors_4)
                    });
                });
            });
        });
    }, () => {
        totalErrors += 1;
        testsRun += 1;
        testsFailed += 1;

        console.log(STR_NO_RECORDS_RECEIVED);
        callback(STR_NO_RECORDS_RECEIVED)
    });
}

/**
 *
 * @param client
 * @param log
 * @param startDate
 * @param endDate
 * @param callback
 */
function monitorTests(client, log, startDate, endDate, callback) {

    MONITOR_RECORDS_RECEIVED.runTest(client, startDate, endDate, returnedText => {
        testsRun += 1;
        //run other tests
        callback(returnedText + dashline)
    }, returnedText => {
        totalErrors += 1;
        testsRun += 1;
        testsFailed += 1;

        callback(returnedText + "No Further Monitor Tests Run\n\n" + dashline)
    });
}
