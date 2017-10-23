/**
 * Function to run first check of validation
 * this check is to guarantee that the fisher who has submitted data from a trip matches up with the username provided on the form.
 * the only exception is a fisher_manager who is allowed to submit someone elses data
 * @param client
 * @param startDate
 * @param endDate
 * @param callback
 */
function runTest(client, startDate, endDate) {

    return new Promise((resolve, reject) => {
        let errors = 0;

        // letiable that stores all logging info for individual job
        let logString = "";

        console.log("Test 2: Submiting username matches main_fisher:");
        logString += "Test 2: Submiting username matches main_fisher:\n";

        // Run a query on the database to pull the main_fisher_id__c and user_id__c fields from the trips table entered in the last 24h
        let query = `SELECT main_fisher_id__c, user_id__c, Id FROM Ablb_Fisher_Trip__c WHERE LastModifiedDate >= ${startDate} AND LastModifiedDate < ${endDate}`;
        client.query(query, (err, tripUsers) => {
            if (err) {
                resolve([logString, err]);
            } else {
                console.log(tripUsers.totalSize + ' trip records were received');
                logString += tripUsers.totalSize + ' trip records were received\n';

                query = `SELECT Username__c, abalobi_id__c, abalobi_usertype__c FROM Ablb_User__c`;
                client.query(query, (err, users) => {
                    console.log(users.totalSize + ' user records were retrieved');
                    logString += users.totalSize + ' user records were retrieved\n';

                    // Scan the array of total users for a match for each of the users_from trip for a match
                    for (let i = 0; i < tripUsers.records.length; i = i + 1) {
                        let match = false;
                        for (let j = 0; j < users.records.length; j = j + 1) {
                            // Check if the trip's user corresponds to correct abalobi ID and username
                            // If the main fisher ID matches any user ID and the user ID from the trip matches any Username
                            if (users.records[j]['abalobi_id__c'] === tripUsers.records[i]['main_fisher_id__c'] && users.records[j]['Username__c'] === tripUsers.records[i]['user_id__c']) {
                                match = true
                            } else if (users.records[j]['Username__c'] === tripUsers.records[i]['user_id__c'] && users.records[j]['abalobi_usertype__c'].includes("fisher_manager")) {
                                match = true;
                            }
                        }

                        // If there is no match and the usertype is not a fisher_manager, output which user is incorrect and increment the total amount not found
                        if (match === false) {
                            console.log("Error:  [Username]: " + tripUsers.records[i].user_id__c + " [main_fisher_id]: "
                                + tripUsers.records[i].main_fisher_id__c + "        @ sfID " + tripUsers.records[i].Id
                                + " https://eu5.salesforce.com/" + tripUsers.records[i].Id + '\n' +
                                "\n");
                            logString += "Error:  [Username]: " + tripUsers.records[i].user_id__c + " [main_fisher_id]: "
                                + tripUsers.records[i].main_fisher_id__c + "        @ sfID " + tripUsers.records[i].Id
                                + " https://eu5.salesforce.com/" + tripUsers.records[i].Id + '\n' +
                                "\n";

                            errors += 1;
                        }
                    }

                    if (errors === 0) {
                        console.log("0 Errors - Test PASSED \n");
                        logString += "0 Errors - Test PASSED \n";
                        resolve([logString, errors]);
                    } else {
                        // Output the total amount of users who are a mismatch
                        console.log(errors + " Errors - Test FAILED \r\n");
                        logString += errors + " Errors - Test FAILED \n";
                        resolve([logString, errors]);
                    }
                });
            }
        });
    })


}

module.exports = {
    runTest: runTest
};
