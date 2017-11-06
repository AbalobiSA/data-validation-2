"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Function to run second check of validation.
 * for this check every fisher_trip record and validate that the amount child records in salesforce
 * corresponds to the amount of child records expected in every record.
 * @param client
 * @param startDate
 * @param endDate
 * @param callback
 */
exports.default = runTest = (client, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        let errors = 0;
        let logString = "";
        console.log("Test 3: All Catch records for each Fisher Trip are in SF: ");
        logString += "Test 3: All Catch records for each Fisher Trip are in SF: \n";
        // Query relevant fields from postgresdb
        let query = `SELECT num_children_in_sf__c, Id, num_children_expected__c FROM Ablb_Fisher_Trip__c WHERE LastModifiedDate >= ${startDate} AND LastModifiedDate < ${endDate}`;
        client.query(query, (err, result) => {
            if (err) {
                console.log("fisher children match: an error has occurred: ", err);
                resolve([logString, err]);
                return;
            }
            console.log(result.totalSize + ' trip records were received');
            logString += result.totalSize + ' trip records were received \n';
            // For every record verify that the number in salesforce corresponds to the expected value on the record
            // if not equal flag a error at the relevant record's ID
            // Note: that if both fields are undefined it is not flagged as error
            for (let entry in result.records) {
                if (result.records[entry].num_children_in_sf__c === 0 && (result.records[entry].num_children_expected__c === null || result.records[entry].num_children_expected__c === '')) {
                    // If there is not data in num_children_expected__c for this record just ignore it
                    continue;
                }
                else if (result.records[entry].num_children_in_sf__c !== result.records[entry].num_children_expected__c && result.records[entry].num_children_in_sf__c !== undefined && result.records[entry].num_children_expected__c !== undefined) {
                    console.log("Error @ sfID " + result.records[entry].Id);
                    logString += "Error @ sfID " + result.records[entry].Id + " https://eu5.salesforce.com/" + result.records[entry].Id + '\n';
                    errors += 1;
                }
            }
            if (errors === 0) {
                console.log("0 Errors - Test PASSED \n");
                logString += "0 Errors - Test PASSED \n";
                resolve([logString, errors]);
            }
            else {
                //output the total amount of users who are a mismatch
                console.log(errors + " Errors - Test FAILED \n");
                logString += errors + " Errors - Test FAILED \n";
                resolve([logString, errors]);
            }
        });
    });
};

//# sourceMappingURL=fisher_children_match.js.map
