/**
 * Test that calculates the expected profit from a trip by adding expenses and totaling income from catches
 * and compares whether that is equal to the displayed profit field in the trip record.
 * @param client
 * @param startdate
 * @param enddate
 * @param callback
 */
function runTest(client, startdate, enddate, callback) {

    let errors = 0;
    let LogString = "";

    console.log("Test 4: Displayed Profit matches actual profit: ");
    LogString += "Test 4: Displayed Profit matches actual profit: \n";

    // Query all trips within given time period
    let query = `SELECT Id, odk_uuid__c, displayed_profit__c, cost_bait__c, cost_food__c, cost_fuel__c,
     cost_harbour_fee__c, cost_oil__c, cost_other_amount__c, cost_transport__c 
     FROM Ablb_Fisher_Trip__c WHERE LastModifiedDate >= ${startdate} AND LastModifiedDate < ${enddate}`;
    client.query(query, (err, trips) => {
        console.log(trips.totalSize + ' records were received');
        LogString += trips.totalSize + ' records were received\n';

        // Total income and expense per trip
        let total_cost = 0;
        let total_income = 0;
        let iterator = 0;

        if (trips.totalSize === 0) {
            LogString += "No successful trips found.";
            return callback(LogString, 0);
        }

        // NB please not how iterator is used! Ensures for loop works sync and not async!
        console.log("ITERATING THROUGH TRIPS...");
        for (let entry in trips.records) {
            // Query all catches where parent uuid is that of current trip
            let query = `SELECT coop_price_type__c, coop_price_per_item__c, alloc_coop_number__c, coop_price_per_kg__c, 
            alloc_coop_weight_kg__c, coop_price_per_crate__c, alloc_coop_crates__c, coop_price_for_total_batch__c,
            other_price_per_item__c, alloc_sold_number__c, other_price_per_kg__c, alloc_sold_weight_kg__c,
            other_price_per_crate__c, alloc_sold_crates__c, other_price_for_total_batch__c
            FROM Ablb_Fisher_Catch__c WHERE odk_parent_uuid__c = '${trips.records[entry].odk_uuid__c}'`;
            client.query(query, (err, result) => {
                if (err) {
                    return callback(LogString, err);
                }

                for (let i = 0; i < result.records.length; i = i + 1) {
                    total_income += income(result.records[i]);
                }

                // if the trips has any costs calculate the total costs
                if (trips.records[iterator].cost_has__c === 'yes') {
                    total_cost += trips.records[iterator].cost_bait__c;
                    total_cost += trips.records[iterator].cost_food__c;
                    total_cost += trips.records[iterator].cost_fuel__c;
                    total_cost += trips.records[iterator].cost_harbour_fee__c;
                    total_cost += trips.records[iterator].cost_oil__c;
                    total_cost += trips.records[iterator].cost_other_amount__c;
                    total_cost += trips.records[iterator].cost_transport__c
                }

                // Calculate the expected profit for trip
                let profit = total_income - total_cost;

                // If the profit is not equal to displayed profit flag error and handle all faketrips
                if (profit !== trips.records[iterator].displayed_profit__c && !((trips.records[iterator].odk_uuid__c).includes("faketrip"))) {
                    console.log("Error @ sfID " + trips.records[iterator].Id);
                    LogString += "Error @ sfID " + trips.records[iterator].Id + " https://eu5.salesforce.com/" + trips.records[iterator].Id + '\n';

                    errors += 1;
                }

                // Reset all fields and increment iterator
                total_cost = 0;
                total_income = 0;
                iterator += 1;

                // If for loop is complete
                if (iterator === trips.totalSize) {
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
                }
            });
        }
    });
}

// Calculate total income of a catch handling different scenarios for price type
function income(each_catch) {

    let total_income = 0;

    // Handle sold to coop
    switch (each_catch.coop_price_type__c) {
        case 'per_item':
            total_income += each_catch.coop_price_per_item__c * each_catch.alloc_coop_number__c;
            break;

        case 'per_kg':
            total_income += each_catch.coop_price_per_kg__c * each_catch.alloc_coop_weight_kg__c;
            break;

        case 'per_crate':
            total_income += each_catch.coop_price_per_crate__c * each_catch.alloc_coop_crates__c;
            break;

        case 'total_batch':
            total_income += each_catch.coop_price_for_total_batch__c;
            break;
    }

    // Handle sold to other
    switch (each_catch.other_price_type__c) {
        case 'per_item':
            total_income += each_catch.other_price_per_item__c * each_catch.alloc_sold_number__c;
            break;

        case 'per_kg':
            total_income += each_catch.other_price_per_kg__c * each_catch.alloc_sold_weight_kg__c;
            break;

        case 'per_crate':
            total_income += each_catch.other_price_per_crate__c * each_catch.alloc_sold_crates__c;
            break;

        case 'total_batch':
            total_income += each_catch.other_price_for_total_batch__c;
            break;
    }

    return total_income;
}

module.exports = {
    runTest: runTest
};
