module.exports = {


  runTest: function(client,  startdate, enddate, success, error){

    //initialize logging for every console.log
    var LogString = "";


    console.log("Test 1: Fisher Trip Records Received Test:");
    LogString += "Test 1: Fisher Trip Records Received Test:\n";


      client
    .query('SELECT * FROM salesforce.ablb_fisher_trip__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
    .on('end', function(result) {
      if (result.rowCount > 0){
        console.log(result.rowCount + " Records Received - Passed\n");
        LogString += result.rowCount + " Records Received - Test Passed\n";
        success(LogString);
      }
      else{
        console.log("No Records Received - Failed \n");
        LogString += "No Records Received - Failed \n";
        error(LogString)
      }
    })
  }
};
