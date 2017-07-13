/**
 * Function to run second check of validation.
 * for this check every fisher_trip record and validate that the amount child records in salesforce
 * corresponds to the amount of child records expected in every record.
 * @param client
 * @param startdate
 * @param enddate
 * @param callback
 */
function runTest (client, startdate, enddate, callback) {

    let errors = 0;
    let LogString = "";

    console.log("Test 3: All Catch records for each Fisher Trip are in SF: ");
    LogString += "Test 3: All Catch records for each Fisher Trip are in SF: \n";

    // Query relevant fields from postgresdb
    let query = `SELECT num_children_in_sf__c, Id, num_children_expected__c FROM Ablb_Fisher_Trip__c WHERE LastModifiedDate >= ${startdate} AND LastModifiedDate < ${enddate}`;
    client.query(query, (err, result) => {
        console.log(result.totalSize + ' records were received');
        LogString += result.totalSize + ' records were received \n';

        // For every record verify that the number in salesforce corresponds to the expected value on the record
        // if not equal flag a error at the relevant record's ID
        // Note: that if both fields are undefined it is not flagged as error
        for (let entry in result.records) {
            if (result.records[entry].num_children_in_sf__c !== result.records[entry].num_children_expected__c && result.records[entry].num_children_in_sf__c !== undefined && result.records[entry].num_children_expected__c !== undefined) {
                console.log("Error @ sfID " + result.records[entry].Id);
                LogString += "Error @ sfID " + result.records[entry].Id + " https://eu5.salesforce.com/" + result.records[entry].Id + '\n';
                errors += 1;
            }
        }

        if (errors === 0) {
            console.log("0 Errors - Test PASSED \n");
            LogString += "0 Errors - Test PASSED \n";
            callback(LogString, errors);
        } else {
            //output the total amount of users who are a mismatch
            console.log(errors + " Errors - Test FAILED \n");
            LogString += errors + " Errors - Test FAILED \n";
            callback(LogString, errors);
        }
    });
}

module.exports = {
    runTest: runTest
};
