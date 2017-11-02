gi# data-validation
Daily data validation scripts which send an e-mail report



## Setup and Running Locally

import heroku config variables as follow:

`heroku config:get VARIABLE_NAME -s  >> .env`
where variable name is then the specified heroku config variables viewable in settings. Please import all variables listed there.
You will have to be logged into heroku to do this!

Runs with `heroku local:run npm start`. If no arguments are specified by default all the tests will be ran by pulling records from the last 24 hours ending at the time of start. If a test needs to be run between a specific start and end date this can be specified by using this format: `heroku local:run npm start "YYYY-MM-DD" "YYYY-MM-DD"` The first argument specifies the start date and the second the end date. Note that the dates must be in quotes and be in the 'YYYY-MM-DD' format and that the arguments are not seperated by any commas.


## Schedule, Logging And E-mail Reports

Currently the script is set using the Heroku scheduler which only starts up the script at certain time thus only using the dyno's when running this job. This job is fired daily at the time specified **(Note that time is UTC)**

As heroku does not have very extensive logging capabilities a heroku add-on called **Papertrail** is used to record logs. On the free plan Papertrail keeps all logs written to console for 48 hours. After that all logs are compressed into an archive which stores all logs of the last 7 days. Thus no logs older than that date is view able. To see these logs: In heroku under our app's overview tab there is a table of all our added add-on's. If the Papertrail button is clicked it will redirect to the Papertrail dash board where all logs are visible.

When the job is executed an e-mail report is send to designated e-mail addresses specified in the heroku config variables.


### Fisher Tests

#### Test 1: Records Received

Checks whether any records were recieved in the given timespan. If no records are received the test will **FAIL** and no further fisher tests will be run. If any records are received the test will **PASS** and further tests are run on the records.

#### Test 2: User Match

Checks whether when a record of a trip is submitted that the **main_fisher** field corresponds to the username of the user who submitted the trip. Thus the trip will **FAIL** if it does not. The only exception is that a fisher manager may submit trips for someone other than themselves.

#### Test 3: Children Match

Checks whether when a record of a trip is submitted that the number of children records expected matches that of the number of children records in salesforce.

#### Test 4: Displayed Profit Check

Checks whether when a trip is submited the displayed profit is equal to the calculated profit by calculating all the trips expenses and totally every catch's income to work out the calculated profit. This test will make an exception for entries that are marked as
**faketrip**.

#### Test 5: Catch Quanity Check

Checks whether when a catch is submitted all the quantities add up correctly such for example if the catch is measured in per kg the total weight in kg will add up to the total weight allocated to coop, self and sold to other.

### Monitor Tests

!! Monitor Tests Are Currently commented out and will not execute.

Checks whether any records were recieved in the given timespan. This test will only be run if the day on which If no records are received the test will **FAIL** and no further monitor tests will be run. If any records are received the test will **PASS** and further tests are run on the records.
