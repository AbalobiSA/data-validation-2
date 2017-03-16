module.exports = {

  /*test that run and evaluates if any trip records were receieved during the specified time range.
  if any records are recieved the test is passed and other tests are executed. If no records are recieved
  the test fails and no other tests for fisher trips are done. */


  runTest: function(client,  startdate, enddate, success, error){

    //initialize logging for every console.log
    var LogString = "";
    var dashline = "--------------------------\n\n"


    console.log("Fisher Tests:\n\nTest 1: Were Fisher Trip records received: ");
    LogString += "Fisher Tests:\n" + dashline + "Test 1: Were Fisher Trip records received: \n"


    //query the postgres database for fisher trips between start date and end date given, returns logging info
    client
    .query('SELECT * FROM salesforce.ablb_fisher_trip__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
    .on('end', function(result) {
      if (result.rowCount > 0){
        console.log(result.rowCount + " records received - Test PASSED\n");
        LogString += result.rowCount + " records received - Test PASSED\n";
        success(LogString);
      }
      else{
        console.log("No records received - Test FAILED \n");
        LogString += "No records received - Test FAILED \n";
        error(LogString)
      }
    })
  }
};
