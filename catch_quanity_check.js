module.exports = {

  runTest : function(client,  startdate, enddate,  callback){

    /*a test that checks each catch that has come in and evaluates whether the quanities of
    of the catch etc. amount sold to coop amount kept add up. */

    var errors = 0
    var LogString = "";

    console.log("Test 5: Catch Quanity Check: ");
    LogString += "Test 5: Catch Quanity Check: \n"

    //query all catches that have come in, in given time period
    client
    .query('SELECT * FROM salesforce.ablb_fisher_catch__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
    .on('row', function(row) {

      //if price type is total batch ignore as quanity will then be irrelevant
      //if the quantities is not valid flag an error and add id to log with link
      if (row.coop_price_type__c != 'total_batch' && row.other_price_type__c != 'total_batch'){
          checkQuanity(row, function(valid){
            if (!valid){
              console.log("Error @ sfID " + row.sfid  );
  						LogString += "Error @ sfID " + row.sfid + " https://eu5.salesforce.com/" + row.sfid + '\n'
  						errors++;
            }
          })
      }
    })

    //on end of query log amount of records recceived and the amount of errors etc...
    .on('end', function(result) {

      console.log(result.rowCount + ' records were received')
      LogString += result.rowCount + ' records were received\n'

      if (errors == 0){
        console.log("0 Errors - Test PASSED \n");
        LogString += "0 Errors - Test PASSED \n";
        callback(LogString, errors);
      }
      else{
        //output the total amount of users who are a mismatch
        console.log(errors + " Errors - Test FAILED \n");
        LogString += errors + " Errors - Test FAILED \n";
        callback(LogString, errors);
      }


    })

    //check that a quanity of a certain catch adds up
    function checkQuanity(each_catch, callback){

      var valid = true

      //handle sold to coop
      //Note: -0.00000001 is to avoid floating point (decimal) rounding issues
      switch(each_catch.coop_price_type__c) {

        case 'per_item':
        if (each_catch.num_items__c <  (-0.00000001 + each_catch.alloc_coop_number__c + each_catch.alloc_self_number__c + each_catch.alloc_sold_number__c)){
          valid = false
          break;
        }
        else break;

        case 'per_kg':
        if (each_catch.weight_kg__c <  (-0.00000001 + each_catch.alloc_coop_weight_kg__c + each_catch.alloc_self_weight_kg__c + each_catch.alloc_weight_kg__c)){
          valid = false
          break;
        }
        else break;

        case 'per_crate':
        if (each_catch.num_crates__c <  (-0.00000001 + each_catch.alloc_coop_crates__c + each_catch.alloc_self_crates__c + each_catch.alloc_sold_crates__c)){
          valid = false
          break;
        }
        else break;

        default:
        break;

      }
      //handle sold to other
      switch(each_catch.other_price_type__c) {

        case 'per_item':
        if (each_catch.num_items__c <  (-0.00000001 + each_catch.alloc_coop_number__c + each_catch.alloc_self_number__c + each_catch.alloc_sold_number__c)){
          valid = false
          break;
        }
        else break;

        case 'per_kg':
        if (each_catch.weight_kg__c <  (-0.00000001 + each_catch.alloc_coop_weight_kg__c + each_catch.alloc_self_weight_kg__c + each_catch.alloc_weight_kg__c)){
          valid = false
          break;
        }
        else break;

        case 'per_crate':
        if (each_catch.num_crates__c <  (-0.00000001 + each_catch.alloc_coop_crates__c + each_catch.alloc_self_crates__c + each_catch.alloc_sold_crates__c)){
          valid = false
          break;
        }
        else break;

        default:
        break;

      }
      callback(valid)
    }
  }
}
