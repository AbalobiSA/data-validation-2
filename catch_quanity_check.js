module.exports = {

  runTest : function(client,  startdate, enddate,  callback){


    var errors = 0
    var LogString = "";

    console.log("Test 5: Catch Quanity Check: ");
    LogString += "Test 5: Catch Quanity Check: \n"

    client
    .query('SELECT * FROM salesforce.ablb_fisher_catch__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
    .on('row', function(row) {

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

      switch(each_catch.coop_price_type__c) {

        case 'per_item':
        if (each_catch.num_items__c != (each_catch.alloc_coop_number__c + each_catch.alloc_self_number__c + each_catch.alloc_sold_number__c)){
          valid = false
          break;
        }
        else break;

        case 'per_kg':
        if (each_catch.weight_kg__c != (each_catch.alloc_coop_weight_kg__c + each_catch.alloc_self_weight_kg__c + each_catch.alloc_weight_kg__c)){
          valid = false
          break;
        }
        else break;

        case 'per_crate':
        if (each_catch.num_crates__c != (each_catch.alloc_coop_crates__c + each_catch.alloc_self_crates__c + each_catch.alloc_sold_crates__c)){
          valid = false
          break;
        }
        else break;

        default:
        break;

      }

      switch(each_catch.other_price_type__c) {

        case 'per_item':
        if (each_catch.num_items__c != (each_catch.alloc_coop_number__c + each_catch.alloc_self_number__c + each_catch.alloc_sold_number__c)){
          valid = false
          break;
        }
        else break;

        case 'per_kg':
        if (each_catch.weight_kg__c != (each_catch.alloc_coop_weight_kg__c + each_catch.alloc_self_weight_kg__c + each_catch.alloc_weight_kg__c)){
          valid = false
          break;
        }
        else break;

        case 'per_crate':
        if (each_catch.num_crates__c != (each_catch.alloc_coop_crates__c + each_catch.alloc_self_crates__c + each_catch.alloc_sold_crates__c)){
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
