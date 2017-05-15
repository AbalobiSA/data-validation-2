// const pg = require('pg');
// let defaultClient = new pg.Client();

// let defaultStartDate = new Date("2017-01-24");
// let defaultEndDate = new Date('2017-01-26');

// defaultStartDate = defaultStartDate.toISOString();
// defaultEndDate = defaultEndDate.toISOString();

// let dashline="===================";
// let log = "";

// pg.defaults.ssl = true;
// pg.connect(DB_URL, function(err, client) {

//     if (err) throw err;
//     console.log('Connected to postgres succesfully \n' + dashline);
//     log += ('Connected to postgres succesfully \n\n' + dashline);

//     //fisher tests are run where after email is send
//     runTest(client, defaultStartDate, defaultEndDate, function(let1, let2){
//     	console.log(let1);
//     	console.log(let2);

//     })

// });



//function to run first check of validation
//this check is to gurantee that the fisher who has submited data from a trip matches up with the username provided on the form.
//the only exception is a fisher_manager who is allowed to submit someone elses data

function runTest(client, startdate, enddate, callback) {

    let users = [];
    let users_from_trips = [];
    let row;
    let person;
    let errors = 0;

    //letiable that stores all logging info for individual job
    let LogString = "";

    console.log("Test 2: Submiting username matches main_fisher:");
    LogString += "Test 2: Submiting username matches main_fisher:\n";




    //run a query on the database to pull the main_fisher_id__c and user_id__c fields from the trips table entered in the last 24h
    client
        .query('SELECT main_fisher_id__c, user_id__c, sfid FROM salesforce.ablb_fisher_trip__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
        .on('row', function(row) {
            //each row is read from the database and is entered as an object in the array 'users_from_trips'
            users_from_trips.push(row);
            //	console.log(row.sfid)
            //console.log(row.main_fisher_id__c + " " + row.user_id__c )
            /*

            	Trip Data:
            	main_fisher_id__c
            	user_id__c
            	sfid

            	Users Data:
            	username
            	abalobi_id__c
            	abalobi_usertype__c
            */

        })
        //when the rows have been finished output how many trips were made in the last 24h
        .on('end', function(result) {
            console.log(result.rowCount + ' records were received');
            LogString += result.rowCount + ' records were received\n';

            //run another query to recieve all possible username and abalobi_id__c combinations from the database
            client
                .query('SELECT username, abalobi_id__c, abalobi_usertype__c FROM salesforce.user')
                .on('row', function(row) {
                    //push each row as an object into an array of users
                    users.push(row);
                })

            .on('end', function(result) {
                //scan the array of total users for a match for each of the users_from trip for a match
                for (person in users_from_trips) {
                    let match = false;
                    for (row in users) {
                        //check if the trip's user corresponds to correct abalobi ID and username

                        //If the main fisher ID matches any user ID,
                        //AND the user ID from the trip matches any Username
                        if (users[row].abalobi_id__c == users_from_trips[person].main_fisher_id__c && users[row].username == users_from_trips[person].user_id__c) {
                            match = true
                        }
                        else if (users[row].username == users_from_trips[person].user_id__c && users[row].abalobi_usertype__c.includes("fisher_manager")){
                        	match = true;
                        	// console.log("MANAGER FOUND");
                        }
                        // else if (((users[row].abalobi_usertype__c).includes("fisher_manager"))){
                        // 	match = true;
                        // }
                        // console.log("USERTYPE: " + users[row].abalobi_usertype__c);
                    }
                    //if there is no match and the usertype is not a fisher_manager, output which user is incorrect and increment the total amount not found
                    if (match == false) {
                        console.log("\nError @ sfID " + users_from_trips[person].sfid
                        	+ "\nTrip Fisher ID: " + users_from_trips[person].main_fisher_id__c
                        	+ "\nDoes not match Trip User ID: " + users_from_trips[person].user_id__c
                        	// + "\nSalesforce Username: " + users[row].username
                        	// + "\nUsertype of logger: " + users[row].abalobi_usertype__c
                        	+ "\n");
                        LogString += "Error @ sfID " + users_from_trips[person].sfid + " https://eu5.salesforce.com/" + users_from_trips[person].sfid + '\n' +
                            'Trip Fisher ID:' + users_from_trips[person].main_fisher_id__c + "" +
                            "\nDoes not match Trip User ID: " + users_from_trips[person].user_id__c + "" +
                            "\n";
                        errors++;
                    }
                }
                if (errors == 0) {
                    console.log("0 Errors - Test PASSED \n");
                    LogString += "0 Errors - Test PASSED \n";
                    callback(LogString, errors);
                } else {
                    //output the total amount of users who are a mismatch
                    console.log(errors + " Errors - Test FAILED \r\n");
                    LogString += errors + " Errors - Test FAILED \n";
                    callback(LogString, errors);
                }

            })
        })
}

module.exports = {
    runTest: runTest
};
