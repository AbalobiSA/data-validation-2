"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Load all the required packages/modules
const Logfile_1 = require("./Logfile");
const Salesforce = require("ablb-salesforce-2");
const secrets = require("../../../secrets/secrets.js");
const salesforce = new Salesforce(secrets.SF_USER, secrets.SF_PASSWORD);
const FISHER_USER_MATCH = require('./fisher_user_match');
const FISHER_CHILDREN_MATCH = require('./fisher_children_match');
const FISHER_RECORDS_RECEIVED = require('./fisher_records_received');
const FISHER_DISPLAYED_PROFIT = require('./fisher_displayed_profit_check');
const CATCH_QUANTITY_CHECK = require('./catch_quantity_check');
// import * as MONITOR_RECORDS_RECEIVED from './monitor_records_received';
const email = require('./email');
const STR_NO_RECORDS_RECEIVED = "No Records Received - No Further Fisher Tests Run";
const dashline = "-------------------------------------------------\n\n";
const INSTA_RUN = true;
let GLOBAL_LOGFILE;
const main = () => {
    // Reset values in logfile
    GLOBAL_LOGFILE = new Logfile_1.Logfile();
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
    let client;
    return salesforce.createConnection()
        .then(conn => {
        client = conn;
        // Fisher tests are run where after email is send
        return fisherTests(client, startDate, endDate);
    })
        .then(success => {
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
        console.log("ALL TESTS SHOULD BE COMPLETED NOW.");
        email.send_report(GLOBAL_LOGFILE.getLog(), GLOBAL_LOGFILE.email_subject, () => {
            console.log('Report sent ;)');
        });
        return Promise.resolve("data validation: successfully run");
    })
        .catch(err => {
        console.log(err);
        console.log('Could not connect to Salesforce. Exiting...');
        return Promise.reject(err);
    });
};
/**
 * Master fisher test function if records are received run all test else if first test fails
 * no other fisher tests will be run
 * @param client
 * @param startDate
 * @param endDate
 */
const fisherTests = (client, startDate, endDate) => {
    // Setup globals that we'll use at the end
    console.log(dashline + "Running fisher records received...");
    return FISHER_RECORDS_RECEIVED.runTest(client, startDate, endDate)
        .then(returnedText => {
        GLOBAL_LOGFILE.incrementTestsRun();
        GLOBAL_LOGFILE.addLog(returnedText += dashline);
        console.log(dashline + "Running fisher user match...");
        return FISHER_USER_MATCH.runTest(client, startDate, endDate);
    })
        .then(result => {
        createLogEntry(GLOBAL_LOGFILE, result);
        console.log(dashline + "\nRunning fisher children match...");
        return FISHER_CHILDREN_MATCH.runTest(client, startDate, endDate);
    })
        .then(result => {
        createLogEntry(GLOBAL_LOGFILE, result);
        console.log(dashline + "\nRunning displayed profit match...");
        return FISHER_DISPLAYED_PROFIT.runTest(client, startDate, endDate);
    })
        .then(result => {
        createLogEntry(GLOBAL_LOGFILE, result);
        console.log(dashline + "\nRunning quantity check match...");
        return CATCH_QUANTITY_CHECK.runTest(client, startDate, endDate);
    })
        .then(result => {
        createLogEntry(GLOBAL_LOGFILE, result);
        return Promise.resolve();
    })
        .catch(ex => {
        GLOBAL_LOGFILE.incrementErrors(1);
        GLOBAL_LOGFILE.incrementTestsRun();
        GLOBAL_LOGFILE.incrementTestsFailed();
        GLOBAL_LOGFILE.addLog(ex.toString());
        GLOBAL_LOGFILE.setStatus("NO_RECORDS_RECEIVED");
        return Promise.resolve();
    });
};
const createLogEntry = (log, result) => {
    let returnedText = result[0];
    let errors = result[1];
    log.addLog(returnedText);
    log.addLog(dashline);
    log.incrementTestsRun();
    log.incrementErrors(errors);
};
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
// main();
module.exports = {
    runTests: main
};

//# sourceMappingURL=index.js.map
