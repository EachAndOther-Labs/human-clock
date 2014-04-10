var express = require('express'),
    config = require('./config.json'),
    http = require('http');

var app = module.exports = express();
server = http.createServer(app);


var url = require('url');
var instagram = require('./instagram');

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log("Listening on " + port);
});

app.use(function(req, res, next) {
    var data = "";
    req.on('data', function(chunk) {
        console.log('THIS IS A CHUNK ' +chunk);
        data += chunk;
    });
    req.on('end', function() {
        req.rawBody = data;
        next();
    });
});

/**
 *
 * Loop through each photo tag and create an instagram callback
 *
 */
config.photoTags.forEach(function(entry) {
    instagram.callback(entry.tag, entry.value, entry.timeZone, entry.clientId, entry.clientSecret);
});

app.use(express.static(__dirname + '/static'));