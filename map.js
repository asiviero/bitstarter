/*
 * map.js
 * 
 * client-side scripting, this file is responsible for both the map displaying
 * and the communication with the server. It defines the websocket connection,
 * its handlers and generates the map. It has a couple of global vars whose
 * usage are detailed near them
 */

//Map object from google maps
var map; 
//Object that works as an associative array to identify users uniquely. Contains
//Marker objects
var connected = {};
//An unique identifier to each user logged into the application, determined
//by the server
var rack_id;

//Setting up the socket connection, this has a bit of hacky feeling since I could
//not manage to deploy to Heroku and Amazon EC2 without code modification on which
//port to connect, which would be unsuitable. If you find a good way to do this, 
//please let me know.
if(document.domain.search("heroku") == -1) {
	port = ":"+8080;
} else {
	port = "";
}
var socket = io.connect('http://'+document.domain+port);

//After socket is created and connected, it awaits for a message from the server
//I opted to initialize the map only after all this because it would be easier
//to use pre-existing function and messages to add markers to the map. Also, google
//maps run asynchronously, which makes parallel processing a constant and sometimes
//not desirable.
socket.on('init_msg', function (data) {
	// Init msg is a set up event, it will set this user rack_id and then, initialize
	// the map. More details on initialize later
	rack_id = data.rack_id;	
	initialize();
});

//When the server sends a 'new_pin' message, it wants to either insert a new pin
//to this user map or update a pin's position. data will consist of the desired
//pin's rack_id and its new location as latitude and longitude 
socket.on('new_pin',function(data) {
	var latitude = data.pos.coords.latitude;
	var longitude = data.pos.coords.longitude;
	// Focus on new pin
	map.setCenter(new google.maps.LatLng(latitude,longitude));

	// Check if a pin with such rack_id exists
	if(!connected[data.rack_id]) {
		// If it doesn't, create a marker and append it to connected
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(latitude,longitude),
			map: map,
			title: 'Hello World!', // TODO change this				
		});
		connected[data.rack_id] = marker;
	} else {
		// If it exists, update its position
		connected[data.rack_id].setPosition(new google.maps.LatLng(latitude,longitude)); 
	}
});

//A 'remove_pin' message will send a rack_id of a pin to be removed from the
//map
socket.on('remove_pin',function(data) {
	if(connected[data.rack_id]) {
		connected[data.rack_id].setMap(null);
		connected[data.rack_id] = null; // This is important !
	}
});


function errorHandler(err) {
	if(err.code == 1) {
		alert("Error: Access is denied!");
	}else if( err.code == 2) {
		alert("Error: Position is unavailable!");
	}
}

//An aux function, will ask the server to broadcast user position
var broadcast_function = function sendLocation(position) {
	socket.emit('broadcast',{rack_id: rack_id, pos: position});
};

//Reports its current position to the server. Server currently responds
//with a new_pin message
var report_function = function reportLocation(position) {
	socket.emit('report',{rack_id: rack_id, pos: position});
};

//An enum to make it easiear to shareLocation
var message_to_server = {
		"REPORT" : report_function,
		"BROADCAST" : broadcast_function
};

//The main communication function. It will fetch the user position and, according
//to method, send a proper message to the server
function shareLocation(method) {
	if(navigator.geolocation){
		// timeout at 60000 milliseconds (60 seconds)
		var options = {timeout:60000};
		navigator.geolocation.getCurrentPosition(message_to_server[method], 
				errorHandler,
				options);
	}else{
		alert("Sorry, browser does not support geolocation!");
	}
}

//Map initialization, as simple as it gets and very similar from Google "Hello World"
//This one will also fetch user position and report it to the server
function initialize() {	
	var mapOptions = {
			zoom: 13,
			mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("google-map"),
			mapOptions);
	if(navigator.geolocation) {
		browserSupportFlag = true;
		shareLocation("REPORT");    	        	    
	}
	else {
		browserSupportFlag = false;
		handleNoGeolocation(browserSupportFlag);
	}

}