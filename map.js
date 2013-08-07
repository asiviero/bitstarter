var map;
var initialLocation;

/*if(document.domain.search("heroku") == -1) {
	port = ":"+port;
} else {
	port = "";
}*/

if(document.domain.search("heroku") == -1) {
	port = ":"+8080;
} else {
	port = "";
}
/*var socket = io.connect(conn_string);
console.log(conn_string);*/
var socket = io.connect('http://'+document.domain+port);
console.log('http://'+document.domain+port);
var connected = {};
var rack_id;

socket.on('init_msg', function (data) {
	console.log(data);
	//socket.emit('my other event', { my: 'data' });
	rack_id = data.rack_id;
	
	initialize();
});
socket.on('new_pin',function(data) {
	console.log(data);
	console.log("New pin to be added at" + data.pos.coords.latitude + " " + data.pos.coords.longitude + " under id " + data.rack_id);
	var latitude = data.pos.coords.latitude;
	var longitude = data.pos.coords.longitude;
	//alert("Latitude : " + latitude + " Longitude: " + longitude);
	map.setCenter(new google.maps.LatLng(latitude,longitude));
	//console.log(map);
	console.log(connected);

	if(!connected[data.rack_id]) {
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(latitude,longitude),
			map: map,
			title: 'Hello World!',
				
		});
		connected[data.rack_id] = marker;
	} else {console.log("Pin is already here!");}
});
socket.on('remove_pin',function(data) {
	console.log("Removing pin at id: " + data.rack_id);
	if(connected[data.rack_id]) {
		connected[data.rack_id].setMap(null);
		connected[data.rack_id] = null;
	} else {console.log("Pin is not at map!");}
});




/*var socket = io.connect('http://'+document.domain+port);
socket.on('news', function (data) {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});
socket.on('new_pin',function(data) {
	console.log("New pin to be added at" + data.pos.coords.latitude + data.pos.coords.longitude);
	var latitude = data.pos.coords.latitude;
	var longitude = data.pos.coords.longitude;
	//alert("Latitude : " + latitude + " Longitude: " + longitude);
	map.setCenter(new google.maps.LatLng(latitude,longitude));
	console.log(map);
	var marker = new google.maps.Marker({
		position: new google.maps.LatLng(latitude,longitude),
		map: map,
		title: 'Hello World!'
	});
});*/

/*if (google.loader.ClientLocation != null) {
  alert(google.loader.ClientLocation.address.city);
} else {
  alert("Not found");
}*/
//console.log(new google.maps.LatLng(geoip_latitude(),geoip_longitude()));

function showLocation(position) {
	var latitude = position.coords.latitude;
	var longitude = position.coords.longitude;
	//alert("Latitude : " + latitude + " Longitude: " + longitude);
	map.setCenter(new google.maps.LatLng(latitude,longitude));
	console.log(map);
	var marker = new google.maps.Marker({
		position: new google.maps.LatLng(latitude,longitude),
		map: map,
		title: 'Hello World!'
	});
}

function errorHandler(err) {
	if(err.code == 1) {
		alert("Error: Access is denied!");
	}else if( err.code == 2) {
		alert("Error: Position is unavailable!");
	}
}
function getLocation(){

	if(navigator.geolocation){
		// timeout at 60000 milliseconds (60 seconds)
		var options = {timeout:60000};
		navigator.geolocation.getCurrentPosition(showLocation, 
				errorHandler,
				options);
	}else{
		alert("Sorry, browser does not support geolocation!");
	}
}



var broadcast_function = function sendLocation(position) {
	socket.emit('broadcast',{rack_id: rack_id, pos: position});
};

var report_function = function reportLocation(position) {
	console.log("Pos: " + position);
	socket.emit('report',{rack_id: rack_id, pos: position});
};

var message_to_server = {
		"REPORT" : report_function,
		"BROADCAST" : broadcast_function
};

function shareLocation(method) {
	if(navigator.geolocation){
		// timeout at 60000 milliseconds (60 seconds)
		var options = {timeout:60000};
		console.log("Method " + method);
		console.log("Typeof " + typeof message_to_server[method]);
		console.log(message_to_server[method]);
		navigator.geolocation.getCurrentPosition(message_to_server[method], 
				errorHandler,
				options);
	}else{
		alert("Sorry, browser does not support geolocation!");
	}
}

function initialize() {
	
	//while(!rack_id);
        var mapOptions = {
          //center: new google.maps.LatLng(geoip_latitude(),geoip_longitude()),
          zoom: 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("google-map"),
            mapOptions);
        //console.log(new google.maps.LatLng(geoip_latitude(),geoip_longitude()));

        console.log("Passou");
        //console.log(navigator);
        if(navigator.geolocation) {
        	browserSupportFlag = true;
        	shareLocation("REPORT");    	        	    
    	  }
        else {
        	console.log("Aq3");
            browserSupportFlag = false;
            handleNoGeolocation(browserSupportFlag);
          }

      }
//google.maps.event.addDomListener(window, 'load', initialize);

/*if(process) {
	var port = process.env.PORT || 8080 ;
} else {
	port = 8080;
}
app.listen(port);*/
