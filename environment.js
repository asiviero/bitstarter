if(typeof process == 'undefined') {
	port = ':'+8080;
} else {
	port = process.env.PORT || 8080;
}

var conn_string = 'http://desolate-fortress-2124.herokuapp.com/';