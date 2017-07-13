/**
 * Test that run and evaluates if any trip records were receieved during the specified time range.
 * if any records are recieved the test is passed and other tests are executed. If no records are recieved
 * the test fails and no other tests for fisher trips are done.
 * @param client
 * @param startdate
 * @param enddate
 * @param success
 * @param error
 */
function runTest (client, startdate, enddate, success, error) {

    //initialize logging for every console.log
    let LogString = "";
    let dashline = "--------------------------\n\n";

    console.log("Fisher Tests:\n\nTest 1: Were Fisher Trip records received: ");
    LogString += "Fisher Tests:\n" + dashline + "Test 1: Were Fisher Trip records received: \n";

    //query the postgres database for fisher trips between start date and end date given, returns logging info
    let query = `SELECT Id FROM Ablb_Fisher_Trip__c WHERE LastModifiedDate >= ${startdate} AND LastModifiedDate < ${enddate}`;
    client.query(query, (err, result) => {
        if (err) {
            console.log(err);
            error(err);
        } else if (result && result.totalSize > 0) {
            console.log(result.totalSize + " records received - Test PASSED\n");
            LogString += result.totalSize + " records received - Test PASSED\n";
            success(LogString);
        } else {
            console.log("No records received - Test FAILED \n");
            LogString += "No records received - Test FAILED \n";
            error(LogString)
        }
    });
}

module.exports = {
    runTest: runTest
};
