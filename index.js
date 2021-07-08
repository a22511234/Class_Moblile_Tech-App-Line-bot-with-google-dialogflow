'use strict';
const 
    bodyParser = require('body-parser'),
    config = require('config'),
    express = require('express'),
    request = require('request');

var app = express();
var port = process.env.PORT || process.env.port || 5000;
app.set('port', port);
app.use(bodyParser.json());
app.listen(app.get('port'),function(){
    console.log('[app.listen] Node app is running on port',app.get('port'));
});

module.exports = app;

const SHEETDB_PRODUCTINFO_ID = config.get('productinfo_id');

app.post('/webhook',function(req, res){
    console.log('[WebHook] In');
    let data = req.body;
    let queryCategory = data.queryResult.parameters["Category"];
    var thisQs={};
    if(queryCategory=="熱門"){
        thisQs.IsHot="TRUE";
    }else{
        thisQs.Category = queryCategory;
    }
    thisQs.casesensitive = false;

    request({
        uri:"https://sheetdb.io/api/v1/"+ SHEETDB_PRODUCTINFO_ID +"/search?",
        json:true,
        method:"GET",
        headers:{"Content-Type":"application/json"},
        qs:thisQs
    },function(error, response, body){
        if(!error && response.statusCode==200){
            console.log('[SheetDB API] Success');
            sendCards(body, res);
        }else{
            console.log('[SheetDB API] failed');
        }
    });
});

function sendCards(body, res){
    console.log('[sendCards] In');
    var thisFulfillmentMessages = [];
    var thisLineObject = {
        payload:{
            line:{
                type:"template",
                altText: "this is a carousel template",
                template:{
                    type:"carousel",
                    columns:[]
                }
            }
        }
    };

   for(var x=0;x<body.length;x++){
    var thisObject = {};
    thisObject.thumbnailImageUrl = body[x].Photo;
    thisObject.imageBackgroundColor = "#FFFFFF";
    thisObject.title = body[x].Name;
    thisObject.text = body[x].Category;
    thisObject.defaultAction = {};
    thisObject.defaultAction.type = "uri";
    thisObject.defaultAction.label = "view detail";
    thisObject.defaultAction.uri = body[x].Photo;
    thisObject.actions = [];
    var thisActionObject = {};
    thisActionObject.type = "uri";
    thisActionObject.label = "view detail";
    thisActionObject.uri = body[x].Photo;
    thisObject.actions.push(thisActionObject);
    thisLineObject.payload.line.template.columns.push(thisObject);
    }

    thisFulfillmentMessages.push(thisLineObject);
    var responseObject = {
        fulfillmentMessages:thisFulfillmentMessages
    };
    res.json(responseObject);
}