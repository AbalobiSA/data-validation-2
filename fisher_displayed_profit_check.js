let async = require('async');

/**
 * Test that calculates the expected profit from a trip by adding expenses and totaling income from catches
 * and compares whether that is equal to the displayed profit field in the trip record.
 * @param client
 * @param startDate
 * @param endDate
 * @param mainCallback
 */
function runTest(client, startDate, endDate, mainCallback) {

    let errors = 0;
    let logString = "";

    console.log("Test 4: Displayed Profit matches actual profit: ");
    logString += "Test 4: Displayed Profit matches actual profit: \n";

    // Query all trips within given time period
    let query = `SELECT Id, num_children_in_sf__c, odk_uuid__c, displayed_profit__c, cost_has__c, cost_bait__c, cost_food__c, cost_fuel__c,
     cost_harbour_fee__c, cost_oil__c, cost_other_amount__c, cost_transport__c 
     FROM Ablb_Fisher_Trip__c WHERE LastModifiedDate >= ${startDate} AND LastModifiedDate < ${endDate}`;
    client.query(query, (err, trips) => {
        console.log(trips.totalSize + ' trip records were received');
        logString += trips.totalSize + ' trip records were received\n';

        if (trips.totalSize === 0) {
            logString += "No successful trips found.";
            return callback(logString, 0);
        }

        async.forEachOf(trips.records, (trip, i, callback) => {

            // Query all catches where parent uuid is that of current trip
            let query = `SELECT coop_price_type__c, other_price_type__c, coop_price_per_item__c, alloc_coop_number__c, coop_price_per_kg__c,
            alloc_coop_weight_kg__c, coop_price_per_crate__c, alloc_coop_crates__c, coop_price_for_total_batch__c,
            other_price_per_item__c, alloc_sold_number__c, other_price_per_kg__c, alloc_sold_weight_kg__c,
            other_price_per_crate__c, alloc_sold_crates__c, other_price_for_total_batch__c
            FROM Ablb_Fisher_Catch__c WHERE odk_parent_uuid__c = '${trip.odk_uuid__c}'`;
            client.query(query, (err, result) => {

                if (err) {
                    return mainCallback(logString, err);
                }

                if (trip.num_children_in_sf__c === 0) {
                    // The trip has no catches registered in salesforce so skip
                    return callback();
                }

                let totalCost = 0;
                let totalIncome = 0;

                for (let i = 0; i < result.records.length; i = i + 1) {
                    totalIncome += income(result.records[i]);
                }

                // If the trips has any costs calculate the total costs
                if (trip.cost_has__c === 'yes') {
                    totalCost += trip.cost_bait__c;
                    totalCost += trip.cost_food__c;
                    totalCost += trip.cost_fuel__c;
                    totalCost += trip.cost_harbour_fee__c;
                    totalCost += trip.cost_oil__c;
                    totalCost += trip.cost_other_amount__c;
                    totalCost += trip.cost_transport__c
                }

                // Calculate the expected profit for trip
                let profit = totalIncome - totalCost;

                // console.log('INCOME = ' + totalIncome);
                // console.log('DISPLAYED PROFIT = ' + trip.displayed_profit__c);
                // console.log('CALCULATED PROFIT = ' + profit);

                // If the profit is not equal to displayed profit flag error and handle all faketrips
                if (profit !== trip.displayed_profit__c && !((trip.odk_uuid__c).includes("faketrip"))) {
                    console.log("Error @ sfID " + trip.Id);
                    logString += "Error @ sfID " + trip.Id + " https://eu5.salesforce.com/" + trip.Id + '\n';

                    errors += 1;
                }

                callback();
            });
        }, () => {
            if (errors === 0) {
                console.log("0 Errors - Test PASSED \n");
                logString += "0 Errors - Test PASSED \n";
                mainCallback(logString, errors);
            } else {
                console.log(errors + " Errors - Test FAILED \r\n");
                logString += errors + " Errors - Test FAILED \n";
                mainCallback(logString, errors);
            }
        });
    });
}

/**
 * Calculate total income of a catch handling different scenarios for price type
 * @param eachCatch
 * @returns {number}
 */
function income(eachCatch) {

    let total_income = 0;

    // Handle sold to coop
    switch (eachCatch.coop_price_type__c) {
        case 'per_item':
            total_income += eachCatch.coop_price_per_item__c * eachCatch.alloc_coop_number__c;
            break;

        case 'per_kg':
            total_income += eachCatch.coop_price_per_kg__c * eachCatch.alloc_coop_weight_kg__c;
            break;

        case 'per_crate':
            total_income += eachCatch.coop_price_per_crate__c * eachCatch.alloc_coop_crates__c;
            break;

        case 'total_batch':
            total_income += eachCatch.coop_price_for_total_batch__c;
            break;
    }

    // Handle sold to other
    switch (eachCatch.other_price_type__c) {
        case 'per_item':
            total_income += eachCatch.other_price_per_item__c * eachCatch.alloc_sold_number__c;
            break;

        case 'per_kg':
            total_income += eachCatch.other_price_per_kg__c * eachCatch.alloc_sold_weight_kg__c;
            break;

        case 'per_crate':
            total_income += eachCatch.other_price_per_crate__c * eachCatch.alloc_sold_crates__c;
            break;

        case 'total_batch':
            total_income += eachCatch.other_price_for_total_batch__c;
            break;
    }

    return total_income;
}

module.exports = {
    runTest: runTest
};
