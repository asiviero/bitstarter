var map;
function initialize() {
	
        var mapOptions = {
          //center: new google.maps.LatLng(geoip_latitude(),geoip_longitude()),
          zoom: 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("google-map"),
            mapOptions);
        console.log(new google.maps.LatLng(geoip_latitude(),geoip_longitude()));

        //console.log("Pasou");
        //console.log(navigator);
        if(navigator.geolocation) {
    	    browserSupportFlag = true;
    	    console.log("Aqui");
    	    navigator.geolocation.getCurrentPosition(function(position) {    	    	
    	      initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
    	      console.log(initialLocation);
    	      map.setCenter(initialLocation);
    	      var marker = new google.maps.Marker({
    	            position: initialLocation,
    	            map: map,
    	            title: 'Hello World!'
    	        });
    	        
    	    }, function() {
    	    	console.log("fial");
    	      handleNoGeolocation(browserSupportFlag);
    	    }, {maximumAge:60000, timeout:5000, enableHighAccuracy:true});
    	  }
        else {
        	console.log("Aq3");
            browserSupportFlag = false;
            handleNoGeolocation(browserSupportFlag);
          }

      }
google.maps.event.addDomListener(window, 'load', initialize);

var socket = io.connect('http://desolate-fortress-2124.herokuapp.com/');
socket.on('news', function (data) {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});
socket.on('message', function(data) {
	window.alert('Ola Denis!');
});

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