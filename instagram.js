var http = require('http'),
    https = require('https'),
    app = require('./app'),
    io = require('socket.io').listen(server);

var instagramCallbacks = function (tag, index, timeZone, clientId, clientSecret) {
    app.get('/' + index, function(req, res) {
        res.sendfile(__dirname + '/index.html');
    });

    app.get('/' + index + '/params', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            tag: tag,
            timeZone: timeZone
        }));
    });

    /**
     * Instagram will verify our subscription
     * by executing a get against our callback url
     */
    app.get('/clock_callback/' + index, function(request, response) {
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        if (query['hub.verify_token'] === 'update_iq_human_clock') {
            response.send(query['hub.challenge']);
        }
    });

    /**
     * Once subscribed, instagram will post back to this callback url (this url
     * is provided to instagram when creating a client for the api).
     *
     * The call back indicates that there are new photos available for our tag
     */
    app.post('/clock_callback/' + index, function(request, response) {
        var instagram_updates = JSON.parse(request.rawBody);
        for (var i in instagram_updates) {
            console.log(instagram_updates[i]);
        }

        var numDataUpdates = instagram_updates.length;

        var options = {
            host: 'api.instagram.com',
            port: 443,
            path: '/v1/tags/' + tag + '/media/recent?client_id=' + clientId + '&client_secret=' + clientSecret
        };
        /**
         * There are new tags, so execute a call to the Instagram api to return
         * an array of our new images
         */
        var req = https.request(options, function(res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            var fullData = "";
            res.on('data', function(chunk) {
                fullData += chunk;
            });
            res.on('end', function() {
                try {
                    var fullJSONData = JSON.parse(fullData);
                    if (fullJSONData.data.length < numDataUpdates) {
                        numDataUpdates = fullJSONData.data.length;
                    }
                    for (var i = 0; i < numDataUpdates; i++) {
                        var update = {
                            image: fullJSONData.data[i].images.low_resolution.url,
                            id: fullJSONData.data[i].id
                        };

                        // Send our updates to the webapp
                        io.sockets.emit(tag, update);
                    }

                } catch (e) {
                    console.log("Error parsing JSON data");
                }

            });
        });

        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write('data\n');
        req.write('data\n');
        req.end();

        response.send("ok");
    });
}

module.exports.callback = instagramCallbacks;
