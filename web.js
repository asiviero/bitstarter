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
var route_shared = new dict();

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
		route_shared.set(rack_id,new Array());
		console.log("Route shared: " + rack_id + " " + route_shared.get(rack_id));
		connected.set(rack_id,socket);
		socket.set('rack_id',rack_id);
	}
	// Broadcast new user online
	connected.forEach(function(value) {
		console.log("Here " + connected.size);		
		connected.forEach(function(value_in,key) {
			value.emit('new_user',{rack_id: key});
			value.emit('user_list',{list: connected});
		});
	});
	
	
	
	//socket.emit('update_user_list',{conn: connected});
	
	// Handlers
	socket.on('broadcast',function(data) {
		socket.broadcast.emit('new_pin',{pos: data.pos, rack_id: socket.rack_id});
	});
	socket.on('broadcast_route',function(data){
		console.log("Received broadcast_route from: " + rack_id);
		//connected.forEach(function(value) {						
			socket.broadcast.emit('new_route',{route: data.route, rack_id: data.rack_id});
		//});
	});
	socket.on('report', function(data) {
		socket = connected.get(data.rack_id);
		socket.emit('new_pin',{pos: data.pos, rack_id: socket.rack_id});
	});	
	socket.on('request_location',function(data) {
		console.log("Received a request from " + socket.rack_id + " for position of " + data.rack_id);
		//socket.emit('server_request_location',{})
		_requested = connected.get(data.rack_id);
		_requested.emit('server_request_location','tobi',function(result) {			
			socket.emit('new_pin',{pos: result, rack_id: data.rack_id});
		});
	});
	socket.on('fix_rack_id', function(data) {
		console.log("Received a fix from " + socket.rack_id + " to " + data.rack_id);
		connected.delete(socket.rack_id);
		connected.set(data.rack_id,socket);
		socket.emit('remove_user',{rack_id : socket.rack_id});
		socket.broadcast.emit('remove_user',{rack_id : socket.rack_id});
		socket.rack_id = data.rack_id;
		console.log("Received a fix from " + socket.rack_id + " to " + data.rack_id);		
		socket.emit('new_user',{rack_id: data.rack_id});
		socket.broadcast.emit('new_user',{rack_id: data.rack_id});
		
		route_shared.set(data.rack_id,route_shared.get(socket.rack_id));
		
	});
	
	socket.on('share_route_with_user', function(data) {
		console.log("\n\nUser: " + data.origin_rack + " wants to share data with \n\n" + data.destination_rack);
		_requested = connected.get(data.destination_rack);
		_requested.emit('new_route',{route: data.route, rack_id: data.origin_rack});
		console.log(route_shared.has(data.origin_rack));
		if(route_shared.has(data.origin_rack) && route_shared.get(data.origin_rack) !== undefined) {
			_array = route_shared.get(data.origin_rack);
			if(_array.indexOf(data.origin_rack) != -1) {
				_array.push(data.destination_rack);			
			}
		} 
		else {
			_array = [data.destination_rack];			
		}
		route_shared.set(data.origin_rack,_array);
	});
	
	socket.on('reached_waypoint',function(data) {
		console.log("User " + data.rack_id + " has reached a waypoint\n\n");
		console.log(route_shared.get(data.rack_id));
		route_shared.get(data.rack_id).forEach(function(value){
			_requested = connected.get(value);
			_requested.emit('new_pin', {pos: data.position, rack_id: value});
			_requested.emit('user_reached_waypoint',{rack_id: data.rack_id, index: data.waypoint});
		});
	});
	
	socket.on('disconnect', function(data) {
		//connected.forEach(function(value) {						
			socket.broadcast.emit('remove_pin',{rack_id : socket.rack_id});
			socket.broadcast.emit('remove_user',{rack_id : socket.rack_id});
		//});		
		connected.delete(socket.rack_id);
	});

});
