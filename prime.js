#!/usr/bin/env node
var fs = require('fs');
var outfile = "prime.txt";
//var out = "A startup is a business built to grow rapidly.\n";

function isPrime(x) {
	var i;
	if(x <= 1) return false;
	for(i=2; i<=x/2; i++) {
		if(x%i == 0) return false;
	}
	return true;
}

var i;
var strprime = '2';
var j = 1;

for(i=3; j<=100; i++) {
	if(isPrime(i)) {
		strprime += ','+i;
		j++;
	}
}

fs.writeFileSync(outfile, strprime);  
console.log("Script: " + __filename + "\nWrote: " + strprime + "\nTo: " + outfile);