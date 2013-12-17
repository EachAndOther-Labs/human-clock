var express = require('express'),
    app = express(),
    http = require('http'),
    https = require('https'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

var url = require('url');

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log("Listening on " + port);
});

app.use(function(req, res, next) {
    var data = "";
    req.on('data', function(chunk) {
        data += chunk
    });
    req.on('end', function() {
        req.rawBody = data;
        next();
    });
});

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/1', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/1/params', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ tag: "London", timeDiff: "0" }));
});

app.get('/2', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/3', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/clock_callback/1', function(request, response) {
    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;
    if (query['hub.verify_token'] == 'update_iq_human_clock') {
        response.send(query['hub.challenge']);
    }
});

app.post('/clock_callback/1', function(request, response) {
    var instagram_updates = JSON.parse(request.rawBody);
    for (var i in instagram_updates) {
        console.log(instagram_updates[i]);
    }

    var numDataUpdates = instagram_updates.length;

    var options = {
        host: 'api.instagram.com',
        port: 443,
        path: '/v1/tags/London/media/recent?client_id=c8ef24044b394ea0b11dbfd34dbffa45&client_secret=0b321ddbe9864840a0472b4a8a15e380'
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
                    io.sockets.emit('instagram', update);
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

app.use(express.static(__dirname + '/static'));

io.sockets.on('connection', function(socket) {
    io.sockets.emit("init", "London");
    socket.on('instagram', function(data) {
        io.sockets.emit('instagram', data);
    });
});
