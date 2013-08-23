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
var markers = {};
var connected = {};
//An unique identifier to each user logged into the application, determined
//by the server
var rack_id;

var distance_to_waypoints = [];
var currently_on_index = 0;
var interval_id;
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
	//rack_id = data.rack_id;	
	
	if(register_rack_id_in_session(data.rack_id)) {
		rack_id = data.rack_id;
	} else {
		rack_id = Session.getVar('rack_id');
	};
	console.log("Rack id: " + rack_id);
	console.log("Rack id: " + Session.getVar('rack_id'));
	initialize();
});

//When the server sends a 'new_pin' message, it wants to either insert a new pin
//to this user map or update a pin's position. data will consist of the desired
//pin's rack_id and its new location as latitude and longitude 
socket.on('new_pin',function(data) {
	console.log("New pin from user: " + data.rack_id);
	
	var latitude = data.pos.coords.latitude;
	var longitude = data.pos.coords.longitude;
	// Focus on new pin
	map.setCenter(new google.maps.LatLng(latitude,longitude));

	// Check if a pin with such rack_id exists
	if(!markers[data.rack_id]) {
		// If it doesn't, create a marker and append it to markers
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(latitude,longitude),
			map: map,
			title: 'Hello World!', // TODO change this				
		});
		markers[data.rack_id] = marker;
	} else {
		// If it exists, update its position
		markers[data.rack_id].setPosition(new google.maps.LatLng(latitude,longitude));
		markers[data.rack_id].setMap(map);
	}
});

// Refresh "Currently Online" List
socket.on('new_user',function (data) {
	if(!connected[data.rack_id]) {
		connected[data.rack_id] = data;
	}
	$('#currently-online-list').html("");
	var _list = "";
	for (rack_id in connected) {
		_list += "<li><span class='glyphicon glyphicon-question-sign request-location'></span><i class='icon-large icon-bullhorn share-route-with-user'></i><div class='rack_id'>" + rack_id + "</div></li>";		
	}
	$('#currently-online-list').html(_list);
	$('.request-location').click(function(){
		_rack_id = $(this).parent().find('.rack_id').text();
		socket.emit('request_location',{rack_id: _rack_id});
	});	
	_set_share_route_listeners();
	//register_rack_id_in_session(rack_id)
});

socket.on('remove_user',function(data) {
	console.log(connected);
	if(connected[data.rack_id]) {
		delete connected[data.rack_id];
	}
	console.log(connected);
	$('#currently-online-list').html("");
	var _list = "";
	for (rack_id in connected) {
		_list += "<li>" + rack_id + "</li>";		
	}
	$('#currently-online-list').html(_list);

});

socket.on('update_user_list', function(data) {
	$('#currently-online-list').html("");
	var _list = "";
	/*for (rack_id in data) {
		_list += "<li>" + rack_id + "</li>";		
	}
	$('#currently-online-list').html(_list);*/	
});


//A 'remove_pin' message will send a rack_id of a pin to be removed from the
//map
socket.on('remove_pin',function(data) {
	if(markers[data.rack_id]) {
		markers[data.rack_id].setMap(null);
		markers[data.rack_id] = null; // This is important !
	}
});


socket.on('server_request_location', function (name, fn) {
	if(navigator.geolocation){
		// timeout at 60000 milliseconds (60 seconds)
		var options = {timeout:60000};
		navigator.geolocation.getCurrentPosition(function(pos) {
			fn(pos);
		}, 
				errorHandler,
				options);
	}else{
		alert("Sorry, browser does not support geolocation!");
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
	console.log(Session.getVar('rack_id'));
	socket.emit('report',{rack_id: Session.getVar('rack_id'), pos: position});
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

route_markers = new Array();
// Route set up events
$(document).ready(function() {
	$('#new-route-button').click(function() {
		var route_block = "<div id='route-panel'>" +
		"<h3>Route:</h3>" +
		"<div class='route-pin-block'>Origin: <span class='route-pin-location'></span> <span class='glyphicon glyphicon-home'></span><span class='glyphicon glyphicon-plus-sign'></span></div>" +
		/*"<div id='route-pin-block-checkpoint-block'></div>" +*/
		"<div class='route-pin-block'>Destination: <span class='route-pin-location'></span> <span class='glyphicon glyphicon-flag'></span><span class='glyphicon glyphicon-plus-sign'></span></div>" +
		"<div class='button' id='add-checkpoint-button'>Add Checkpoint</div>" +
		"<div class='button' id='ask-google-for-route'>Ask Google</div>" +		
		"</div>";
		$('#new-route-panel').html(route_block);
		
		_set_plus_sign_listeners();
		//_set_minus_sign_listeners();
		
		$('#add-checkpoint-button').click(function() {
			_update_route_panel("NEW_CHECKPOINT");
		});
		
		$('#ask-google-for-route').click(function() {
			ask_google_for_route();
		});
		
		$('#new-route-button').remove();	
	});
});

function _update_route_panel(action,index) {
	if(action == "NEW_CHECKPOINT") {
		// Find how many checkpoints exist (nCheckpoints)
		nCheckpoints = route_markers.length-2;
		// New checkpoint will have index nCheckpoints+1
		var div_to_append = "<div class='route-pin-block'>Checkpoint <span class='checkpoint-index'>"+(nCheckpoints+1)+"</span>: <span class='route-pin-location'></span> <span class='glyphicon glyphicon-flag'></span><span class='glyphicon glyphicon-plus-sign'></span><span class='glyphicon glyphicon-minus-sign'></span></div>";
		// Insert right before "Destination"
		$('.route-pin-block:last').before(div_to_append);
		// Update "Destination handlers"
		route_markers[route_markers.length] = route_markers[route_markers.length-1]
		route_markers[route_markers.length-2] = null
		index = route_markers.length-1
		marker = route_markers[route_markers.length-1]				
		google.maps.event.clearListeners(marker, 'drag');
		google.maps.event.clearListeners(marker, 'dragend');
		google.maps.event.addListener(marker, 'drag', function(event) {
			$('.route-pin-block:eq('+index+') .route-pin-location').text(event.latLng.lat()+' / '+event.latLng.lng());
		});

		google.maps.event.addListener(marker, 'dragend', function(event) {
			$('.route-pin-block:eq('+index+') .route-pin-location').text(event.latLng.lat()+' / '+event.latLng.lng());
		});
		// Update plus sign listeners
		_set_plus_sign_listeners();
		_set_minus_sign_listeners();
	}
	else if(action == "REMOVE_CHECKPOINT") {
		console.log("REMOVE_CHECKPOINT ON INDEX" + index);
		// Remove element on index provided
		$('.route-pin-block:eq('+index+')').remove();
		// Readjust listeners
		_set_plus_sign_listeners();
		_set_minus_sign_listeners();
		// Update route_markers 
		route_markers[index].setMap(null);
		for(i = index; i < route_markers.length; i++) {
			route_markers[i] = route_markers[i+1];
			_set_up_drag_events(i);
			_update_checkpoint_index();
		}
	}
}

function _set_up_drag_events(index) {
	marker = route_markers[index];
	google.maps.event.clearListeners(marker, 'drag');
	google.maps.event.clearListeners(marker, 'dragend');
	google.maps.event.addListener(marker, 'drag', function(event) {
		  $('.route-pin-block:eq('+index+') .route-pin-location').text(event.latLng.lat()+' / '+event.latLng.lng());
		});
		 
		google.maps.event.addListener(marker, 'dragend', function(event) {
			$('.route-pin-block:eq('+index+') .route-pin-location').text(event.latLng.lat()+' / '+event.latLng.lng());
		});

}

function _set_up_click_listeners(index) {
	google.maps.event.addListenerOnce(map,"click",function(event) {
		google.maps.event.clearListeners(map, 'click');
		console.log(map);
		$('#route-status-msg').text("");
		if(event.latLng) {
			/*_event = event.latLng;
			console.log(event.latLng);*/
			var lat = event.latLng.lat();	
			var lng = event.latLng.lng();										
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(lat,lng),
				draggable: true,
				map:map,						
			});			
			$('.route-pin-block:eq('+index+') .route-pin-location').text(event.latLng.lat()+' / '+event.latLng.lng());
			route_markers[index] = marker;
			_set_up_drag_events(index);
		}
	});
}

function _set_share_route_listeners() {
	$('.share-route-with-user').click(function() {
		var index = $(this).parent().index() - 1;			
		console.log(index);
		console.log("I am user: " + Session.getVar('rack_id'));
		var destiny = $(this).parent().find('.rack_id').text();
		console.log($(this).parent().find('.rack_id').text());
		socket.emit('share_route_with_user',{route: route_object, origin_rack: Session.getVar('rack_id'), destination_rack: destiny});
	});
}

function _set_plus_sign_listeners() {
	$('.route-pin-block .glyphicon-plus-sign').click(function() {
		var index = $(this).parent().index() - 1;			
		console.log(index);
		$('#route-status-msg').text("Click on map to insert pin");
		_set_up_click_listeners(index);			
	});	
}

function _update_checkpoint_index() {
	$('.checkpoint-index').each(function(){
		var index = $(this).parent().index() - 1;
		$(this).text(index);
	});
}

function _set_minus_sign_listeners() {	
	$('.route-pin-block .glyphicon-minus-sign').unbind("click");
	$('.route-pin-block .glyphicon-minus-sign').click(function() {
		var index = $(this).parent().index() - 1;			
		console.log(index);
		//$('#route-status-msg').text("Click on map to insert pin");
		//_set_up_click_listeners(index);
		_update_route_panel("REMOVE_CHECKPOINT", index);
	});	
}

var directionsService = new google.maps.DirectionsService();

/*
 * Route related functions
 * Upon the markers provided by user, use Google Directions API to generate a route
 * After "Ask Google for Route", we search for the pins specified by the user, 
 * stored in route_marks and send the route to Directions API. After route genration,
 * route_marks may be destroyed
 */
var route_object;
var rendererOptions = {
		draggable: true
};

function ask_google_for_route() {

	
	var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
	//var route_object = {};
	var start = route_markers[0].position;
	var end = route_markers[route_markers.length-1].position;
	/*console.log(start);
	console.log(end);*/
	directionsDisplay.setMap(map);

	var waypoints_array = new Array();
	for (i = 1; i <= route_markers.length-2; i++) {
		waypoints_array.push({location: route_markers[i].position});
	}
	console.log(waypoints_array);
	var request = {
			origin:start,
			destination:end,
			waypoints: waypoints_array,
			travelMode: google.maps.DirectionsTravelMode.DRIVING
	};
	directionsService.route(request, function(response, status) {
		console.log(response);
		if (status == google.maps.DirectionsStatus.OK) {
			console.log(response);
			route_object = response;
			//console.log(route_object);
			directionsDisplay.setDirections(response);
			interval_id = setInterval(function() {
				calculate_distance_to_waypoint(currently_on_index);
			}, 5000);
			$('#route-panel').append("<div class='button' id='broadcast_route'>Broadcast route</div>")
			$('#broadcast_route').click(function(){
				socket.emit('broadcast_route',{rack_id: Session.getVar('rack_id'), route: route_object});
			});
			//return route_object;
		}
	});

	google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
		route_object = directionsDisplay.directions;
	});	  
}

socket.on('new_route',function(data){
	console.log("Setting up new route from: " + data.rack_id);
	var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
	directionsDisplay.setMap(map);
	//directionsDisplay.setDirections(JSON.parse(data.route));
	waypoints_array = new Array();
	console.log(data.route);
	if(data.route.Tb.waypoints) {
		$.each(data.route.Tb.waypoints,function(index,value) {
			waypoints_array.push({location: value.location.mb +','+ value.location.nb});
		});
	}
	var request = {
			origin:data.route.Tb.origin.mb + ',' + data.route.Tb.origin.nb,
			destination:data.route.Tb.destination.mb + ',' + data.route.Tb.destination.nb,
			waypoints: waypoints_array,
			travelMode: google.maps.DirectionsTravelMode.DRIVING
	};
	directionsService.route(request, function(response, status) {
		//console.log(response);
		if (status == google.maps.DirectionsStatus.OK) {
			//console.log(response);
			route_object = response;
			//console.log(route_object);
			directionsDisplay.setDirections(response);
			distance_to_waypoints = new Array(route_object.Tb.waypoints.length);
			/*$('#route-panel').append("<div class='button' id='broadcast_route'>Broadcast route</div>")
			$('#broadcast_route').click(function(){
				socket.emit('broadcast_route',{rack_id: rack_id, route: route_object});
			});*/
			//return route_object;
		}
	});
	//route_object = JSON.parse(data.route);
});
/*
 * Session related code
 */
function register_rack_id_in_session(rack_id) {
	if(!Session.getVar('rack_id') || Session.getVar('rack_id') == rack_id) {
		Session.setVar('rack_id',rack_id);
		return true;
	} else {
		console.log("Need to fix");
		socket.emit('fix_rack_id',{rack_id: Session.getVar('rack_id')});
		return false;
	}
}

function haversine_distance(LatLng1,LatLng2) {
	if (typeof(Number.prototype.toRad) === "undefined") {
		  Number.prototype.toRad = function() {
		    return this * Math.PI / 180;
		  };
		}
	
	lat1 = LatLng1.lat();
	lat2 = LatLng2.lat();
	lon1 = LatLng1.lng();
	lon2 = LatLng2.lng();
	/*console.log(lat2);
	console.log(lat1);*/
	
	var R = 6371; // km
	var dLat = (lat2-lat1).toRad();
	var dLon = (lon2-lon1).toRad();
	var lat1 = lat1.toRad();
	var lat2 = lat2.toRad();

	//console.log(dLat + " " + dLon);
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;
	console.log(d);
	return d;
}

function calculate_distance_to_waypoint(index) {
	if(currently_on_index >= route_object.Tb.waypoints.length) {
		clearInterval(interval_id);
		return;		
	}
	if(navigator.geolocation){
		// timeout at 60000 milliseconds (60 seconds)
		var options = {timeout:60000};
		navigator.geolocation.getCurrentPosition(function(pos) {
			console.log(pos);
			current_pos = new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
			//waypoint_latlng = route_object.Tb.waypoints[index].location.split(',');
			waypoint_pos = route_object.Tb.waypoints[index].location;
			distance_to_waypoints[index] = haversine_distance(current_pos, waypoint_pos);
			if(distance_to_waypoints[index] < 0.5) {
				console.log("I'm 500m away from checkpoint: " + index);
				socket.emit('reached_waypoint',{rack_id: Session.getVar("rack_id"), position: pos, waypoint: index});
				currently_on_index++;
			}
		}, 
				errorHandler,
				options);
	}else{
		alert("Sorry, browser does not support geolocation!");
	}
}

/*function _test_function() {
	d = calculate_distance_to_waypoint(0);
	console.log("d: " + d);
}*/

socket.on('user_list', function(data) {
	console.log(data);	
});

socket.on('user_reached_waypoint', function(data) {
	console.log("User " + data.rack_id + " reached waypoint " + data.index);
	$('#route-status-msg').text("User " + data.rack_id + " reached waypoint " + data.index);
});