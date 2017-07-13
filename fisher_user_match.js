/**
 * Function to run first check of validation
 * this check is to gurantee that the fisher who has submited data from a trip matches up with the username provided on the form.
 * the only exception is a fisher_manager who is allowed to submit someone elses data
 * @param client
 * @param startdate
 * @param enddate
 * @param callback
 */
function runTest(client, startdate, enddate, callback) {

    let errors = 0;

    // letiable that stores all logging info for individual job
    let LogString = "";

    console.log("Test 2: Submiting username matches main_fisher:");
    LogString += "Test 2: Submiting username matches main_fisher:\n";

    //run a query on the database to pull the main_fisher_id__c and user_id__c fields from the trips table entered in the last 24h
    let query = `SELECT main_fisher_id__c, user_id__c, Id FROM Ablb_Fisher_Trip__c WHERE LastModifiedDate >= ${startdate} AND LastModifiedDate < ${enddate}`;
    client.query(query, (err, tripUsers) => {
        if (err) {
            callback(LogString, err);
        } else {
            console.log(tripUsers.totalSize + ' records were received');
            LogString += tripUsers.totalSize + ' records were received\n';

            query = `SELECT Username, abalobi_id__c, abalobi_usertype__c FROM User`;
            client.query(query, (err, users) => {
                console.log(users.totalSize + ' records were received');
                LogString += users.totalSize + ' records were received\n';

                //scan the array of total users for a match for each of the users_from trip for a match
                for (let i = 0 ; i < tripUsers.records.length; i = i + 1) {
                    let match = false;
                    for (let j = 0 ; j < users.records.length; j = j + 1) {
                        // Check if the trip's user corresponds to correct abalobi ID and username
                        // If the main fisher ID matches any user ID and the user ID from the trip matches any Username
                        if (users.records[j]['abalobi_id__c'] === tripUsers.records[i]['main_fisher_id__c'] && users.records[j]['Username'] === tripUsers.records[i]['user_id__c']) {
                            match = true
                        } else if (users.records[j]['Username'] === tripUsers.records[i]['user_id__c'] && users.records[j]['abalobi_usertype__c'].includes("fisher_manager")){
                            match = true;
                        }
                    }

                    // If there is no match and the usertype is not a fisher_manager, output which user is incorrect and increment the total amount not found
                    if (match === false) {
                        console.log("Error:  [Username]: " + tripUsers.records[i].user_id__c + " [main_fisher_id]: "
                            + tripUsers.records[i].main_fisher_id__c + "        @ sfID " + tripUsers.records[i].Id
                            + " https://eu5.salesforce.com/" + tripUsers[i].Id + '\n' +
                            "\n");
                        LogString += "Error:  [Username]: " + tripUsers.records[i].user_id__c + " [main_fisher_id]: "
                            + tripUsers.records[i].main_fisher_id__c + "        @ sfID " + tripUsers.records[i].Id
                            + " https://eu5.salesforce.com/" + tripUsers.records[i].Id + '\n' +
                            "\n";

                        errors += 1;
                    }
                }

                if (errors === 0) {
                    console.log("0 Errors - Test PASSED \n");
                    LogString += "0 Errors - Test PASSED \n";
                    callback(LogString, errors);
                } else {
                    //output the total amount of users who are a mismatch
                    console.log(errors + " Errors - Test FAILED \r\n");
                    LogString += errors + " Errors - Test FAILED \n";
                    callback(LogString, errors);
                }
            });
        }
    });
}

module.exports = {
    runTest: runTest
};
