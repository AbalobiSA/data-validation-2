module.exports = {

  runTest : function(client,  startdate, enddate,  callback){


    var trips = [];
    var entry = 0;
    var errors = 0
    var LogString = "";

    console.log("Test 4: Displayed Profit Check: ");
    LogString += "Test 4: Displayed Profit Check: \n"

    client
    .query('SELECT * FROM salesforce.ablb_fisher_trip__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
    .on('row', function(row) {

      if (row.trip_has__c == 'yes'){
        trips.push(row)
      //  console.log(row.id)
      }

    })

    .on('end', function(result) {

      console.log(result.rowCount + ' records were received')
      LogString += result.rowCount + ' records were received\n'
      //var amountOfTrips = trips.length;
      //var iterator = 0;
      var total_cost = 0
      var total_income = 0

      // ID is getting increased here
      for (entry in trips){

        //console.log(entry)
        var query = 'SELECT * FROM salesforce.ablb_fisher_catch__c WHERE odk_parent_uuid__c = \'' + trips[entry].odk_uuid__c + '\''
        var iterator = 0;

        client
        .query(query)
        .on('row', function(row){
          //console.log(trips[iterator].id + " : " + row.id)
          income(row, function(returned_income){
            total_income += returned_income;
          })
        })
        .on('end', function(result) {

          if (trips[iterator].cost_has__c == 'yes'){

            total_cost += trips[iterator].cost_bait__c
            total_cost += trips[iterator].cost_food__c
            total_cost += trips[iterator].cost_fuel__c
            total_cost += trips[iterator].cost_harbour_fee__c
            total_cost += trips[iterator].cost_oil__c
            total_cost += trips[iterator].cost_other_amount__c
            total_cost += trips[iterator].cost_transport__c
          }

          var profit = total_income - total_cost
          //console.log(trips[iterator].id + " : Calculated Profit: " + profit)
          if (profit != trips[iterator].displayed_profit__c){
            console.log("Error @ sfID " + trips[iterator].sfid  );
						LogString += "Error @ sfID " + trips[iterator].sfid + " https://eu5.salesforce.com/" + trips[iterator].sfid + '\n'
            errors++;
          }

          //console.log(trips[iterator].id + " has " + result.rowCount + ' catches were received, total cost; ' + total_cost + " total income: " + total_income )
          total_cost = 0
          total_income = 0
          iterator++;
          if (iterator == trips.length){

            if (errors == 0){
              console.log("0 Errors - Test PASSED \n");
              LogString +="0 Errors - Test PASSED \n"
              callback(LogString, errors);
            }
            else{
              //output the total amount of users who are a mismatch
              console.log(errors + " Errors - Test FAILED \r\n");
              LogString += errors + " Errors - Test FAILED \n"
              callback(LogString, errors);
            }

          }
        })
      }
    })

    function income(each_catch, callback){
      var total_income = 0

      switch(each_catch.coop_price_type__c) {
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

      switch(each_catch.other_price_type__c) {
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
      callback(total_income)
    }
  }
}
