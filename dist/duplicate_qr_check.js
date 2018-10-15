"use strict";
/**
 * A test that checks that no duplicate qr codes exist in the database.
 * @param client
 * @param startDate
 * @param endDate
 * @param callback
 */
let runTest = (client, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        let errors = 0;
        let logString = "";
        console.log("Test 6: Duplicate QR Check: ");
        logString += "Test 6: Duplicate QR Quanity Check: \n";

        let addError = (qr, entryId, duplicateId, duplicatePairs) => {
            let errorString = "Error: [QR]: " + qr + "\n[ID 1]: " + entryId + "     https://eu5.salesforce.com/" + entryId +
                "\n[ID 2]: " + duplicateId + "     https://eu5.salesforce.com/" + duplicateId + '\n\n';

            for (let pair of duplicatePairs) {
                //If the pair is already logged as an error, return
                if (pair.entryId === entryId && pair.duplicateId === duplicateId) return;
                if (pair.entryId === duplicateId && pair.duplicateId === entryId) return;
            }

            //If the pair is not found, create it, and add it to the list
            duplicatePairs.push({
                entryId: entryId,
                duplicateId: duplicateId
            });

            console.log(errorString);
            logString += errorString;
            errors += 1;
        }

        let query = `SELECT Id, catch_qr_tag__c    
            FROM Ablb_Fisher_Catch__c WHERE LastModifiedDate >= ${startDate} AND LastModifiedDate < ${endDate} AND has_qr_tag__c = 'yes'`;

        client.query(query, (err, result) => {
            if (err) {
                console.log(err);
                return resolve([logString, err]);
            }
            console.log(result.totalSize + ' catch records were received');
            logString += result.totalSize + ' catch records were received\n';

            query = `SELECT Id, code_single_batch__c, code_multiple_catch_tags__c
            FROM Ablb_Batch_Tags__c WHERE LastModifiedDate >= ${startDate} AND LastModifiedDate < ${endDate}`

            client.query(query, (err, batchResult) => {
                if (err) {
                    return resolve([logString, err]);
                }

                let duplicatePairs = [];

                for (let i = 0; i < result.records.length; i++) {

                    //Skip the entry if the record doesn't have a qr tag
                    if (!result.records[i].catch_qr_tag__c) continue;

                    let entry = result.records[i];
                    let qr_code = entry.catch_qr_tag__c.substr(39);

                    //Check current table for duplicates
                    for (let j = 0; j < result.records.length; j++) {
                        //Skip check if they are the same entry or the check entry doesn't have a qr tag
                        if (i === j || !result.records[j].catch_qr_tag__c) continue;
                        let checkEntry = result.records[j];
                        if (entry.catch_qr_tag__c === checkEntry.catch_qr_tag__c) addError(qr_code, entry.Id, checkEntry.Id, duplicatePairs);
                    }

                    //Check single batch
                    for (let j = 0; j < batchResult.records.length; j++) {
                        let record = batchResult.records[j];
                        //Skip if the record doesn't have a tag
                        if (entry.Id === record.Id || !record.code_single_batch__c) continue;
                        if (qr_code === record.code_single_batch__c) addError(qr_code, entry.Id, record.Id, duplicatePairs);
                    }

                    //Check multiple catch tags
                    for (let j = 0; j < batchResult.records.length; j++) {
                        let record = batchResult.records[j];
                        let occurences = 0;

                        //Skip if the record doesn't have multiple catch tags
                        if (entry.Id === record.Id || !record.code_multiple_catch_tags__c) continue;
                        let catchTags = record.code_multiple_catch_tags__c.split(' ');

                        for (let k = 0; k < catchTags.length; k++) {
                            if (qr_code === catchTags[k]) occurences++;
                            if (occurences > 1) addError(qr_code, entry.Id, record.Id, duplicatePairs);
                        }
                    }
                }
                if (errors === 0) {
                    console.log("0 Errors - Test PASSED \n");
                    logString += "0 Errors - Test PASSED \n";
                    resolve([logString, errors]);
                }

                else {
                    // Output the total amount number of duplicate QR codes
                    console.log(errors + " Errors - Test FAILED \n");
                    logString += errors + " Errors - Test FAILED \n";
                    resolve([logString, errors]);
                }
            });
        });
    });
};

module.exports = {
    runTest: runTest
};