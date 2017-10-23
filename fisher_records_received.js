/**
 * Test that run and evaluates if any trip records were receieved during the specified time range.
 * if any records are recieved the test is passed and other tests are executed. If no records are recieved
 * the test fails and no other tests for fisher trips are done.
 * @param client
 * @param startDate
 * @param endDate
 */
function runTest(client, startDate, endDate) {

    return new Promise((resolve, reject) => {



        // Initialize logging for every console.log
        let logString = "";
        let dashline = "--------------------------\n\n";

        console.log("Fisher Tests:\n\nTest 1: Were Fisher Trip records received: ");
        logString += "Fisher Tests:\n" + dashline + "Test 1: Were Fisher Trip records received: \n";

        //query the postgres database for fisher trips between start date and end date given, returns logging info
        let query = `SELECT Id FROM Ablb_Fisher_Trip__c WHERE LastModifiedDate >= ${startDate} AND LastModifiedDate < ${endDate}`;
        client.query(query, (err, result) => {
            if (err) {
                error(err);
                reject(err);
            } else if (result && result.totalSize > 0) {
                console.log(result.totalSize + " trip records received - Test PASSED\n");
                logString += result.totalSize + " trip records received - Test PASSED\n";
                resolve(logString);
            } else {
                console.log("No records received - Test FAILED \n");
                logString += "No records received - Test FAILED \n";
                resolve(logString)
            }
        });
    })

}

module.exports = {
    runTest: runTest
};
