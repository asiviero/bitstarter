/*if(typeof process == 'undefined') {
	port = ':'+8080;
} else {
	port = process.env.PORT || 8080;
}*/

var conn_string = 'http://desolate-fortress-2124.herokuapp.com';
//var conn_string = 'http://ec2-54-213-26-1.us-west-2.compute.amazonaws.com:8080';
global.conn_string = conn_string;