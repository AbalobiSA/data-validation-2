/**
 * A test that checks each catch that has come in and evaluates whether the quantities of
 * of the catch etc. amount sold to coop amount kept add up.
 * @param client
 * @param startDate
 * @param endDate
 * @param callback
 */
const runTest = (client, startDate, endDate) => {

    return new Promise((resolve, reject) => {
        let errors = 0;
        let logString = "";

        console.log("Test 5: Catch Quanity Check: ");
        logString += "Test 5: Catch Quanity Check: \n";

        // Query all catches that have come in, in given time period
        let query = `SELECT Id, coop_price_type__c, other_price_type__c, num_items__c, alloc_coop_number__c, 
            alloc_self_number__c, alloc_sold_number__c, weight_kg__c, alloc_coop_weight_kg__c, alloc_self_weight_kg__c,
            alloc_sold_weight_kg__c, num_crates__c, alloc_coop_crates__c, alloc_self_crates__c, alloc_sold_crates__c     
            FROM Ablb_Fisher_Catch__c WHERE LastModifiedDate >= ${startDate} AND LastModifiedDate < ${endDate}`;

        client.query(query, (err, result) => {

            if (err) {
                console.log(err);
                return resolve([logString, err]);
            }

            console.log(result.totalSize + ' catch records were received');
            logString += result.totalSize + ' catch records were received\n';

            for (let i = 0; i < result.totalSize; i = i + 1) {
                // If price type is total batch ignore as quantity will then be irrelevant
                // If the quantities is not valid flag an error and add id to log with link
                if (result.records[i].coop_price_type__c !== 'total_batch' && result.records[i].other_price_type__c !== 'total_batch') {
                    if (!checkQuantity(result.records[i])) {
                        console.log("Error @ sfID " + result.records[i].Id);
                        logString += "Error @ sfID " + result.records[i].Id + " https://eu5.salesforce.com/" + result.records[i].Id + '\n';

                        errors += 1;
                    }
                }
            }

            if (errors === 0) {
                console.log("0 Errors - Test PASSED \n");
                logString += "0 Errors - Test PASSED \n";
                resolve([logString, errors]);
            } else {
                // Output the total amount of users who are a mismatch
                console.log(errors + " Errors - Test FAILED \n");
                logString += errors + " Errors - Test FAILED \n";
                resolve([logString, errors]);
            }
        });
    })


}

/**
 * Check that a quantity of a certain catch adds up
 *
 * @param eachCatch
 * @returns {boolean}
 */
function checkQuantity(eachCatch) {

    let valid = true;

    // Handle sold to coop
    // Note: -0.00000001 is to avoid floating point (decimal) rounding issues
    switch (eachCatch.coop_price_type__c) {
        case 'per_item':
            if (eachCatch.num_items__c < (-0.00000001 + eachCatch.alloc_coop_number__c + eachCatch.alloc_self_number__c + eachCatch.alloc_sold_number__c)) {
                valid = false;
            }
            break;

        case 'per_kg':
            if (eachCatch.weight_kg__c < (-0.00000001 + eachCatch.alloc_coop_weight_kg__c + eachCatch.alloc_self_weight_kg__c + eachCatch.alloc_sold_weight_kg__c)) {
                valid = false;
            }
            break;

        case 'per_crate':
            if (eachCatch.num_crates__c < (-0.00000001 + eachCatch.alloc_coop_crates__c + eachCatch.alloc_self_crates__c + eachCatch.alloc_sold_crates__c)) {
                valid = false;
            }
            break;

        default:
            break;
    }

    // Handle sold to other
    switch (eachCatch.other_price_type__c) {
        case 'per_item':
            if (eachCatch.num_items__c < (-0.00000001 + eachCatch.alloc_coop_number__c + eachCatch.alloc_self_number__c + eachCatch.alloc_sold_number__c)) {
                valid = false;
            }
            break;

        case 'per_kg':
            if (eachCatch.weight_kg__c < (-0.00000001 + eachCatch.alloc_coop_weight_kg__c + eachCatch.alloc_self_weight_kg__c + eachCatch.alloc_sold_weight_kg__c)) {
                valid = false;
            }
            break;

        case 'per_crate':
            if (eachCatch.num_crates__c < (-0.00000001 + eachCatch.alloc_coop_crates__c + eachCatch.alloc_self_crates__c + eachCatch.alloc_sold_crates__c)) {
                valid = false;
            }
            break;

        default:
            break;
    }

    return valid;
}

module.exports = {
    runTest: runTest
};
