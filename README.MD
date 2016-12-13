# data-validation
Daily data validation scripts which send an e-mail report
##Tests Information

Runs with npm start command. If no arguments are specified by default all the tests will be ran by pulling records from the last 24 hours ending at the time of start. If a test needs to be run between a specific start and end date this can be specified by using this format: `npm start 'YYYY-MM-DD' 'YYYY-MM-DD'` The first argument specifies the start date and the second the end date. Note that the dates must be in single quotes and be in the 'YYYY-MM-DD' format and that the arguments are not seperated by any commas.

###Fisher Tests

#### Test 1:

Checks whether any records were recieved in the given timespan. If no records are received the test will **FAIL** and no further fisher tests will be run. If any records are received the test will **PASS** and further tests are run on the records.

#### Test 2:

Checks whether when a record of a trip is submitted that the **main_fisher** field corresponds to the username of the user who submitted the trip. Thus the trip will **FAIL** if it does not. The only exception is that a fisher manager may submit trips for someone other than themselves.

#### Test 3:

Checks whether when a record of a trip is submitted that the number of children records expected matches that of the number of children records in salesforce.

###Monitor Tests

Checks whether any records were recieved in the given timespan. This test will only be run if the day on which If no records are received the test will **FAIL** and no further monitor tests will be run. If any records are received the test will **PASS** and further tests are run on the records.
