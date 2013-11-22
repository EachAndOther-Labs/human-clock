/*var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8111);

function handler (req, res) {
  
  // if (typeof res.query != "undefined") {
      console.log(req); 
  //}

/*  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });

}
*/
/*

var express = require("express");
var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

app.use(express.logger());
// app.use(express.bodyParser());
*/
/*
*/

/*
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


*/

/*


io.sockets.on('connection', function (socket) {
  socket.on('send', function (data) {
    io.sockets.emit('message', data);
  });
});
*/



var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

var url = require('url');

var port = process.env.PORT || 5000;
server.listen(port, function() {
  console.log("Listening on " + port);
});

app.use(function(req, res, next){
   var data = "";
   req.on('data', function(chunk){ data += chunk});
   req.on('end', function(){
      req.rawBody = data;
      next();
   });
});

app.get('/', function (req, res) {
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
      io.sockets.emit('instagram', instagram_updates[i]);
    }
    response.send("ok");
});

io.sockets.on('connection', function (socket) {
    socket.on('instagram', function (data) {
        io.sockets.emit('instagram', data);
    });
});
