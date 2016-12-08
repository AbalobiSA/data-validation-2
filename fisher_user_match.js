module.exports = {


	//function to run first check of validation
	//this check is to gurantee that the fisher who has submited data from a trip matches up with the username provided on the form.
	//the only exception is a fisher_manager who is allowed to submit someone elses data

	runTest : function(client,  startdate, enddate,  callback){

		var users = [];
		var users_from_trips = [];
		var row;
		var person;
		var errors = 0;
		var LogString = "";

		console.log("Test 2: Fisher Trip Username Match Test:");
		LogString += "\nTest 2: Fisher Trip Username Match Test:\n"

		//run a query on the database to pull the main_fisher_id__c and user_id__c fields from the trips table entered in the last 24h
		client
		.query('SELECT main_fisher_id__c, user_id__c, sfid FROM salesforce.ablb_fisher_trip__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
		.on('row', function(row) {
			//each row is read from the database and is entered as an object in the array 'users_from_trips'
			users_from_trips.push(row);
		//	console.log(row.sfid)
			//console.log(row.main_fisher_id__c + " " + row.user_id__c )
		})
		//when the rows have been finished output how many trips were made in the last 24h
		.on('end', function(result) {
			console.log(result.rowCount + ' records were received');
			LogString += result.rowCount + ' records were received\n'

			//run another query to recieve all possible username and abalobi_id__c combinations from the database
			client
			.query('SELECT username, abalobi_id__c, abalobi_usertype__c FROM salesforce.user')
			.on('row', function(row) {
				//push each row as an object into an array of users
				users.push(row);
			})

			.on('end', function(result) {
				//scan the array of total users for a match for each of the users_from trip for a match
				for (person in users_from_trips){
					var match = false;
					for (row in users){
						//check if the trip's user corresponds to correct abalobi ID and username
						if (users[row].abalobi_id__c == users_from_trips[person].main_fisher_id__c && users[row].username == users_from_trips[person].user_id__c ){
							match = true
						}
					}
					//if there is no match and the usertype is not a fisher_manager, output which user is incorrect and increment the total amount not found
					if (match == false && !((users[row].abalobi_usertype__c).includes("fisher_manager"))){
						console.log("Error @ sfID " + users_from_trips[person].sfid  );
						LogString += "Error @ sfID " + users_from_trips[person].sfid + " https://eu5.salesforce.com/" + users_from_trips[person].sfid + '\n'
						errors++;
					}
				}
				if (errors == 0){
					console.log("0 Errors - Test Passed \r\n");
					LogString +="0 Errors - Test Passed \r\n\n"
					callback(LogString);
				}
				else{
				//output the total amount of users who are a mismatch
				console.log(errors + " Errors - Test Failed \r\n");
				LogString += errors + " Errors - Test Failed \r\n\n"
				callback(LogString);
			}

		})
		})
	}
};
