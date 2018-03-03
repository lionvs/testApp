let logger = require('modules/logger');
let fs = require('fs');
let _ = require('lodash');
let rp = require('request-promise');
let Promise = require('bluebird');


function processBatch(batch, timeCalled){
    if(!timeCalled){
        timeCalled = 1;
    }

    let options = {
        method: batch.method,
        uri: batch.url,
        body: batch.body,
        json: true
    };

    return rp(options)
        .catch(err => {
            logger.log("process Batch Failed: ", batch.url, batch.method);

            if (timeCalled >= 2){
                throw err;
            }

            return processBatch(batch, timeCalled+1);
        });
}

let timeout = 5000;

function processAllBatches(batches){
    let allChunks = [];
    let curChunk = [];
    for(let i=1;i<=batches.length;i++){
        curChunk.push(batches[i]);

        if(i%5===0){
            allChunks.push(curChunk);
            curChunk = [];
        }
    }

    return Promise.resolve(allChunks)
        .map(curChunk => {
            return processBatches(curChunk)
                .delay(timeout)
        }, {concurrency: 1})

}

function processBatches(batches){
    let success = 0;
    let fails = 0;

    return Promise.resolve(batches)
        .map(batch => {
            return processBatch(batch)
                .then(a =>{
                    console.log("success ", a)
                    success++;
                })
                .catch(err => {
                    fails++;
                    console.log("fail ");
                })
        }, {
            concurrency: 5
        })
        .then(() => {
            return {
                fails: fails,
                success: success
            }
        })

}

function mergeParamsToUrl(url, params){
    let fields = _.keys(params);
    fields.forEach(field => {
        console.log('{' + field + "}");
        url = url.replace(new RegExp('{' + field + "}", 'gi'), params[field]);
    });

    return url;
}

function constructBatches(inputData){
    return inputData.payloads.map(payload => {
        let urlParams = _.omit(payload, ["requestBody"]);
        return {
            url: mergeParamsToUrl(inputData.endpoint.url, urlParams),
            method: inputData.endpoint.batch,
            body: payload.requestBody
        };
    });
}

module.exports = function(app) {

    app.post("/batch", (req, res, next) => {
        let query = req.query;
        let body = req.body;

        if(_.isEmpty(query) && _.isEmpty(body)){
            return res.sendStatus(422);
        }

        let inputData = _.isEmpty(query) ? body : query;

        // TODO add validation to data

        logger.info("inputData: ", inputData);

        let batches = constructBatches(inputData);

        logger.info("batches: ", batches);

        processAllBatches(batches)
            .then(result => {
                res.send(result)
            })
            .catch(err => {
                logger.error(err);
                res.sendStatus(500);
            });
    });


};