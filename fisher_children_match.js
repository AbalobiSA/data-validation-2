module.exports = {

	//function to run second check of validation.
	//for this check every fisher_trip record and validate that the amount child records in salesforce
	//corresponds to the amount of child records expected in every record.

	runTest : function(client,  startdate, enddate, callback){

		var data = [];
		var entry;
		var errors = 0;
		var LogString = "";

		console.log("Test 3: Fisher Trip Children Expected Match Test: ");
		LogString += "Test 3: Fisher Trip Children Expected Match Test: \n"

		//query relevant fields from postgresdb
		client
		.query('SELECT num_children_in_sf__c, sfid, num_children_expected__c FROM salesforce.ablb_fisher_trip__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
		.on('row', function(row) {
			//each row is read from the database and is entered as an object in the array 'data'
			data.push(row)
		})
		//output is given of the amount of records entered once the rows have finished being read
		.on('end', function(result) {
			console.log(result.rowCount + ' records were received');
			LogString += result.rowCount + ' records were received \n';

			//for every record verify that the number in salesforce corresponds to the expected value on the record
			//if not eqaul flag a error at the relevant record's ID
			//Note: that if both fields are undefined it is not flagged as error
			for (entry in data){
				if ((data[entry].num_children_in_sf__c != data[entry].num_children_expected__c) && (data[entry].num_children_in_sf__c != undefined && data[entry].num_children_expected__c != undefined)){
					console.log("Error @ sfID " + data[entry].sfid);
					LogString += "Error @ sfID " + data[entry].sfid + '\n';
					errors++;
				}
			}
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

	}
};
