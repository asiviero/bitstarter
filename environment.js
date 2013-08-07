if(typeof process == 'undefined') {
	port = ':'+8080;
} else {
	port = process.env.PORT || 80;
}