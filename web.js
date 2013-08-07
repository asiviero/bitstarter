var express = require('express');
var fs = require('fs');
var http = require('http');
var app = express.createServer(express.logger());
app.use(express.static(__dirname));
var hat = require('hat');

var id = hat();

var connected = new Array();
//var io = require('socket.io');

//Start the server at port 8080
/*var server = http.createServer(function(req, res){ 
	//this.use(express.static(__dirname));
    // Send HTML headers and message
    //res.writeHead(200,{ 'Content-Type': 'text/html' }); 
    //res.end('<h1>Hello Socket Lover!</h1>');
	console.log(req.url);
	if(req.url == '/') {
		buf = fs.readFileSync('index.html');
		res.end(buf.toString());
	}
	else if(req.url=='/map') {
		buf = fs.readFileSync('map.html');
		res.end(buf.toString());
	}
	else if(req.url=='/map.js') {
		buf = fs.readFileSync('map.js');
		res.end(buf.toString());
	}
});
server.listen(8080);
// Create a Socket.IO instance, passing it our server
var socket = io.listen(server);

// Add a connect listener
socket.on('connection', function(client){ 
    console.log("server is start on port 8080");

    // Create periodical which ends a message to the client every 5 seconds
    var interval = setInterval(function() {
        client.send('This is a message from the server!  ' + new Date().getTime());
    },5000);

    // Success!  Now listen to messages to be received
    client.on('message',function(event){
        console.log('Received message from client! ',event);
    });
    client.on('disconnect',function(){
        clearInterval(interval);
        console.log('Server has disconnected');
    });

});*/
/*
app.get('/', function(request, response) {
	var content;
	buf = fs.readFileSync('index.html');
  response.send(buf.toString());
});

app.get('/map', function(request, response) {
	var content;
	buf = fs.readFileSync('map.html');
	//require('map.js');
  response.send(buf.toString());
	//response.render('map.html');
});


app.listen(port, function() {
  console.log("Listening on " + port);
});*/

var app = require('http').createServer(handler)
, io = require('socket.io').listen(app)
, fs = require('fs');

//app.listen(8080);
if(process) {
	var port = process.env.PORT || 8080 ;
} else {
	port = 80;
}
app.listen(port);

function handler (req, res) {
	if(req.url == "/") {
		url = "/index.html";
	}
	else {
		url = req.url;
	}
	fs.readFile(__dirname + url,
			function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
}

io.sockets.on('connection', function (socket) {
	rack_id = hat();
	//socket.emit('news', { hello: 'world', rack_id: rack_id });
	
	socket.emit('news', { hello: 'world', rack_id: rack_id });
	socket.on('broadcast',function(data) {
		console.log("Broadcasting" + connected.length);		
		connected.forEach(function(value) {						
			value.emit('new_pin',data);
		});
	});
	connected.push(socket);
	console.log("Length: " + connected.length);
	/*socket.on('my other event', function (data) {
		console.log(data);
	});*/
	/*socket.on('message',function(event){
        console.log('Received message from client! ',event);
        if(event == 'Ola Zubat!') {
        	socket.emit('message','Ola!');
        }
	});*/
	//console.log(connected[rack_id]);
	
});
