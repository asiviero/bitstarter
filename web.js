var express = require('express');
var fs = require('fs');
var http = require('http');
var app = express.createServer(express.logger());
app.use(express.static(__dirname));
var hat = require('hat');
var dict = require('dict');


var id = hat();

var connected = new dict();

var app = require('http').createServer(handler)
, io = require('socket.io').listen(app)
, fs = require('fs');

//app.listen(8080);
require('./environment');
if(conn_string.search("heroku") == -1) {
	port = 8080;
} else {
	port = 80;
}

/*if(process) {
	var port = process.env.PORT || 8080 ;
} else {
	port = 8080;
}*/
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
	socket.rack_id = rack_id;
	socket.emit('init_msg', {rack_id: socket.rack_id });	
	if(!connected.has(rack_id)) {
		connected.set(rack_id,socket);
	}
	console.log("Length: " + connected.size + " ");
	socket.on('broadcast',function(data) {	
		console.log("Broadcasting " + connected.length + " from " + data.rack_id);		
		connected.forEach(function(value) {						
			value.emit('new_pin',{pos: data.pos, rack_id: data.rack_id});
		});
	});
	socket.on('report', function(data) {
		console.log("Report received");
		socket = connected.get(data.rack_id);
		socket.emit('new_pin',{pos: data.pos, rack_id: socket.rack_id});
		//socket.emit('new_pin',{pos: data.pos, rack_id: rack_id});
	});	
	socket.on('disconnect', function(data) {
		connected.forEach(function(value) {						
			value.emit('remove_pin',{rack_id : socket.rack_id});			
		});
		
		connected.delete(socket.rack_id);
		console.log("Length: " + connected.size + " ");
	});

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


