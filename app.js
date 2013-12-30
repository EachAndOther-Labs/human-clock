var express = require('express'),
    app = express(),
    http = require('http'),
    https = require('https'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    clockOneTag = "NewYork",
    clockTwoTag = "Dublin",
    clockThreeTag = "Tokyo";


var url = require('url');

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log("Listening on " + port);
});

app.use(function(req, res, next) {
    var data = "";
    req.on('data', function(chunk) {
        data += chunk;
    });
    req.on('end', function() {
        req.rawBody = data;
        next();
    });
});

function setupInstagramCallbacks(tag, index, timeZone, clientId, clientSecret) {
    app.get('/' + index, function(req, res) {
        res.sendfile(__dirname + '/index.html');
    });

    app.get('/' + index + '/params', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            tag: tag,
            timeDiff: timeZone
        }));
    });

    app.get('/clock_callback/' + index, function(request, response) {
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        if (query['hub.verify_token'] == 'update_iq_human_clock') {
            response.send(query['hub.challenge']);
        }
    });

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

setupInstagramCallbacks(clockOneTag, 1, "-0500", "33fa122521134670997f80ad7b04b639","0fe1a1a964674448a0077baf6c2c0198");
setupInstagramCallbacks(clockTwoTag, 2, "+0000", "7cb1b72f7b55411ea16a8f882520e883", "21b56b54344d49cdb78350eedbca9f9e");
setupInstagramCallbacks(clockThreeTag, 3, "+0900", "a6d5f32b791f41d5bac669fa925145b5", "e7749d11508e4fda88af7e2f24dbe339");

app.use(express.static(__dirname + '/static'));

io.sockets.on('connection', function(socket) {
    // io.sockets.emit("init", "London");
    // socket.on('instagram', function(data) {
    //     io.sockets.emit('instagram', data);
    // });
});