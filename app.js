var express = require('express'),
    app = express(),
    config = require('./config.json'),
    http = require('http'),
    https = require('https'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

console.log(config);

var url = require('url');

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log("Listening on " + port);
});

app.use(function(req, res, next) {
    console.log('line 19:app.use')
    var data = "";
    req.on('data', function(chunk) {
        console.log(data);
        data += chunk;
    });
    req.on('end', function() {
        console.log('end:app.use', data);
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
    console.log(entry);
    setupInstagramCallbacks(entry.tag, entry.value, entry.timeZone, entry.clientId, entry.clientSecret);
});

/**
 * Set up Instagram call backs
 * @param tag
 * @param index
 * @param timeZone
 * @param clientId - provided when you register with Instagram
 * @param clientSecret - provided when you register with Instagram
 */
function setupInstagramCallbacks(tag, index, timeZone, clientId, clientSecret) {
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
        if (query['hub.verify_token'] == 'update_iq_human_clock') {
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
                    var updatesArray = [];
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

app.use(express.static(__dirname + '/static'));

io.sockets.on('connection', function(socket) {
    // io.sockets.emit("init", "London");
    // socket.on('instagram', function(data) {
    //     io.sockets.emit('instagram', data);
    // });
});