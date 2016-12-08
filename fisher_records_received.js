module.exports = {


  runTest: function(client, fs, success, error){

    //initialize logging to file for every console.log
    var logger = require('./logging.js');

    logger.write_to_log(fs,"Test 1: Fisher Trip Records Received Test: \n");
    console.log("Test 1: Fisher Trip Records Received Test:");


    client
    .query('SELECT * FROM salesforce.ablb_fisher_trip__c WHERE lastmodifieddate > current_timestamp - interval \'1 day\'')
    .on('end', function(result) {
      if (result.rowCount > 0){
        console.log(result.rowCount + " Records Received - Passed\r\n");
        logger.write_to_log(fs,result.rowCount + " Records Received - Test Passed\r\n\n");
        success()
      }
      else{
        console.log("No Records Received - Failed \r\n");
        logger.write_to_log(fs,"No Records Received - Test Failed \r\n\n");
        error()
      }
    })
  }
};
