"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Load all the required packages/modules
const Logfile_1 = require("./Logfile");
const salesforce = require("ablb-salesforce");
const email = require('./email');
const FISHER_USER_MATCH = require('./fisher_user_match');
const FISHER_CHILDREN_MATCH = require('./fisher_children_match');
const FISHER_RECORDS_RECEIVED = require('./fisher_records_received');
const MONITOR_RECORDS_RECEIVED = require('./monitor_records_received');
const FISHER_DISPLAYED_PROFIT = require('./fisher_displayed_profit_check');
const CATCH_QUANTITY_CHECK = require('./catch_quantity_check');
const STR_NO_RECORDS_RECEIVED = "No Records Received - No Further Fisher Tests Run";
const INSTA_RUN = true;
// let totalErrors: number = 0;
// let testsRun: number = 0;
// let testsFailed: number = 0;
let dashline = "-------------------------------------------------\n\n";
let GLOBAL_LOGFILE;
// main();
/**
 * Run the scripts
 */
function main() {
    // Reset values in logfile
    GLOBAL_LOGFILE = new Logfile_1.Logfile();
    return new Promise((resolve, reject) => {
        // Create a timestamp in UTC and create master log for tests
        let timestamp = new Date();
        GLOBAL_LOGFILE.addLog("Salesforce validation job started at: " + timestamp + "\n\n");
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
            GLOBAL_LOGFILE.addLog("Range Date Specified.\nRunning Tests for records between "
                + startDate + " and " + endDate + " (time in UTC)\n");
        }
        else {
            startDate = yesterday;
            endDate = currentDate;
            startDate = startDate.toISOString();
            endDate = endDate.toISOString();
            console.log("debug: start date: " + startDate);
            console.log("debug: end date: " + endDate);
            GLOBAL_LOGFILE.addLog("No Date Range Specified - Defaulting to the last 24h."
                + "\nRunning Tests for records between " + startDate + " and " + endDate + " (time in +0:00 UTC)\n");
        }
        /**
         * Create a connection to Salesforce and start running the checks
         */
        salesforce.createConnection().then(client => {
            // Fisher tests are run where after email is send
            fisherTests(client, startDate, endDate, () => {
                let finishTime = new Date();
                let runtime = finishTime.getTime() - timestamp.getTime();
                GLOBAL_LOGFILE.addLog(dashline + "\nJob Finished at: " + finishTime.toISOString() + "\n");
                GLOBAL_LOGFILE.addLog("Job Finished at: " + finishTime + "\n\n");
                GLOBAL_LOGFILE.addLog("Summary: \n");
                GLOBAL_LOGFILE.addLog("Tests Run: " + GLOBAL_LOGFILE.getTestsRun() + "\n");
                GLOBAL_LOGFILE.addLog("Tests Failed: " + GLOBAL_LOGFILE.getFails() + "\n");
                GLOBAL_LOGFILE.addLog("Total Errors: " + GLOBAL_LOGFILE.getErrors() + "\n");
                GLOBAL_LOGFILE.addLog("Runtime: " + runtime / 1000 + " seconds\n");
                if (GLOBAL_LOGFILE.getErrors() !== 0) {
                    GLOBAL_LOGFILE.email_subject = `${GLOBAL_LOGFILE.getErrors()} failed tests!`;
                }
                else {
                    GLOBAL_LOGFILE.email_subject = "All OK!";
                }
                if (GLOBAL_LOGFILE.getStatus() === "NO_RECORDS_RECEIVED") {
                    GLOBAL_LOGFILE.email_subject += " (NO TRIPS RECEIVED)";
                }
                email.send_report(GLOBAL_LOGFILE.getLog(), GLOBAL_LOGFILE.email_subject, () => {
                    console.log('Report sent ;)');
                });
                resolve("data validation: successfully run");
            });
        }).catch(err => {
            console.log(err);
            console.log('Could not connect to Salesforce. Exiting...');
            reject(err);
        });
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
function fisherTests(client, startDate, endDate, callback) {
    // Setup globals that we'll use at the end
    console.log(dashline + "Running fisher records received...");
    FISHER_RECORDS_RECEIVED.runTest(client, startDate, endDate)
        .then(returnedText => {
        GLOBAL_LOGFILE.incrementTestsRun();
        GLOBAL_LOGFILE.addLog(returnedText += dashline);
        console.log(dashline + "Running fisher user match...");
        return FISHER_USER_MATCH.runTest(client, startDate, endDate);
    })
        .then(result => {
        GLOBAL_LOGFILE.addLog(result[0]);
        GLOBAL_LOGFILE.incrementErrors(result[1]);
        GLOBAL_LOGFILE.incrementTestsRun();
        GLOBAL_LOGFILE.addLog(dashline);
        // testsFailed = errors_1 !== 0 ? testsFailed + 1 : testsFailed;
        console.log(dashline + "\nRunning fisher children match...");
        return FISHER_CHILDREN_MATCH.runTest(client, startDate, endDate);
    })
        .then(result => {
        let returnedText = result[0];
        let errors = result[1];
        GLOBAL_LOGFILE.addLog(returnedText);
        GLOBAL_LOGFILE.addLog(dashline);
        GLOBAL_LOGFILE.incrementTestsRun();
        GLOBAL_LOGFILE.incrementErrors(errors);
        console.log(dashline + "\nRunning displayed profit match...");
        return FISHER_DISPLAYED_PROFIT.runTest(client, startDate, endDate);
    })
        .then(result => {
        let returnedText = result[0];
        let errors = result[1];
        GLOBAL_LOGFILE.addLog(returnedText);
        GLOBAL_LOGFILE.addLog(dashline);
        GLOBAL_LOGFILE.incrementTestsRun();
        GLOBAL_LOGFILE.incrementErrors(errors);
        console.log(dashline + "\nRunning quantity check match...");
        return CATCH_QUANTITY_CHECK.runTest(client, startDate, endDate);
    })
        .then(result => {
        let returnedText = result[0];
        let errors = result[1];
        GLOBAL_LOGFILE.addLog(returnedText);
        GLOBAL_LOGFILE.addLog(dashline);
        GLOBAL_LOGFILE.incrementTestsRun();
        GLOBAL_LOGFILE.incrementErrors(errors);
        callback();
    })
        .catch(ex => {
        GLOBAL_LOGFILE.incrementErrors(1);
        GLOBAL_LOGFILE.incrementTestsRun();
        GLOBAL_LOGFILE.incrementTestsFailed();
        GLOBAL_LOGFILE.addLog(ex.toString());
        GLOBAL_LOGFILE.setStatus("NO_RECORDS_RECEIVED");
        callback();
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
// function monitorTests(client, log, startDate, endDate, callback) {
//
//     MONITOR_RECORDS_RECEIVED.runTest(client, startDate, endDate, returnedText => {
//         testsRun += 1;
//         //run other tests
//         callback(returnedText + dashline)
//     }, returnedText => {
//         totalErrors += 1;
//         testsRun += 1;
//         testsFailed += 1;
//
//         callback(returnedText + "No Further Monitor Tests Run\n\n" + dashline)
//     });
// }
module.exports = {
    runTests: main
};
