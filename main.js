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

const INSTA_RUN = true;

let totalErrors = 0;
let testsRun = 0;
let testsFailed = 0;
let dashline = "-------------------------------------------------\n\n";

// if (INSTA_RUN === true) {
//     main();
// }

/**
 * Run the scripts
 */
function main() {



    // Reset values
    totalErrors = 0;
    testsRun = 0;
    testsFailed = 0;

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

        console.log("debug: start date: " + startDate);
        console.log("debug: end date: " + endDate);

        console.log("No Date Range Specified - Defaulting to the last 24h.\nRunning Tests for records between " + startDate + " and " + endDate + " (time in +0:00 UTC)\n");
        log += "No Date Range Specified - Defaulting to the last 24h.\nRunning Tests for records between " + startDate + " and " + endDate + ' (time in +0:00 UTC)\n\n'
    }

    /**
     * Create a connection to Salesforce and start running the checks
     */
    return salesforce.createConnection().then(client => {

        // Fisher tests are run where after email is send
        return fisherTests(client, log, startDate, endDate, (test_logs, errors) => {

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

            return Promise.resolve("data validation: successfully run")
        });
    }).catch(err => {
        console.log(err);
        console.log('Could not connect to Salesforce. Exiting...');
        return Promise.reject(err)
    });
}

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

    // Setup globals that we'll use at the end
    let returned_logs = "";
    let returned_errors = "";

    console.log(dashline + "Running fisher records received...");

    FISHER_RECORDS_RECEIVED.runTest(client, startDate, endDate)
        .then(returnedText => {
            testsRun += 1;
            returnedText += dashline;
            returned_logs += returnedText;

            console.log(dashline + "Running fisher user match...");
            return FISHER_USER_MATCH.runTest(client, startDate, endDate);
        })
        .then(result => {

            let returnedText_2 = result[0];
            let errors_1 = result[1];

            testsRun += 1;
            returnedText_2 += dashline;
            testsFailed = errors_1 !== 0 ? testsFailed + 1 : testsFailed;

            returned_logs += returnedText_2;
            returned_errors += errors_1;


            console.log(dashline + "\nRunning fisher children match...");
            return FISHER_CHILDREN_MATCH.runTest(client, startDate, endDate);
        })
        .then(result => {

            let returnedText_3 = result[0];
            let errors_2 = result[1];

            testsRun += 1;
            returnedText_3 += dashline;
            testsFailed = errors_2 !== 0 ? testsFailed + 1 : testsFailed;

            returned_logs += returnedText_3;
            returned_errors += errors_2;

            console.log(dashline + "\nRunning displayed profit match...");
            return FISHER_DISPLAYED_PROFIT.runTest(client, startDate, endDate);
        })
        .then(result => {

            let returnedText_4 = result[0];
            let errors_3 = result[1];

            testsRun += 1;
            returnedText_4 += dashline;
            testsFailed = errors_3 !== 0 ? testsFailed + 1 : testsFailed;

            returned_logs += returnedText_4;
            returned_errors += errors_3;

            console.log(dashline + "\nRunning quantity check match...");
            return CATCH_QUANTITY_CHECK.runTest(client, startDate, endDate);
        })
        .then(result => {

            let returnedText_5 = result[0];
            let errors_4 = result[1];

            testsRun += 1;
            returnedText_5 += dashline;
            testsFailed = errors_4 !== 0 ? testsFailed + 1 : testsFailed;

            returned_logs += returnedText_5;
            returned_errors += errors_4;

            callback(returned_logs,
                returned_errors)
        })
        .catch(error => {
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

module.exports = {
    runTests: main
};