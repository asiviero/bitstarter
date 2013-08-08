/*
 * web.js
 * 
 * server-side scripting, will run on a node.js platform. It uses hat to token
 * generation and dict to keep track of users logged in
 */

var express = require('express');
var fs = require('fs');
var http = require('http');
var app = express.createServer(express.logger());
app.use(express.static(__dirname));
var hat = require('hat');
var dict = require('dict');

// A dictionary to keep track of users
var connected = new dict();

var app = require('http').createServer(handler)
, io = require('socket.io').listen(app)
, fs = require('fs');

//app.listen(8080);
//require('./environment');
if(process) {
	var port = process.env.PORT || 8080;
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
	// Upon connection, send back a init_msg to client
	socket.rack_id = rack_id;
	socket.emit('init_msg', {rack_id: socket.rack_id });	
	if(!connected.has(rack_id)) {
		connected.set(rack_id,socket);
	}
	// Broadcast new user online
	connected.forEach(function(value) {
		//console.log(JSON.stringfy(connected));
		
		// Hack to emit new user to everyone
		/*connected.forEach(function(value_in) {
			value.emit('new_user',{value_in: rack_id});
		})*/
		console.log("Here " + connected.size);
		
		connected.forEach(function(value_in,key) {
			value.emit('new_user',{rack_id: key});
		});
	});
	
	//socket.emit('update_user_list',{conn: connected});
	
	// Handlers
	socket.on('broadcast',function(data) {	
		connected.forEach(function(value) {						
			value.emit('new_pin',{pos: data.pos, rack_id: data.rack_id});
		});
	});
	socket.on('report', function(data) {
		socket = connected.get(data.rack_id);
		socket.emit('new_pin',{pos: data.pos, rack_id: socket.rack_id});
	});	
	socket.on('disconnect', function(data) {
		connected.forEach(function(value) {						
			value.emit('remove_pin',{rack_id : socket.rack_id});
			value.emit('remove_user',{rack_id : socket.rack_id});
		});		
		connected.delete(socket.rack_id);
	});

});
