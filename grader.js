#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var sys = require('util'),
rest = require('./restler');



var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkExistsUrl = function(url) {
    var url_regex = new RegExp('\\b(https?|ftp|file)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]*[-A-Za-z0-9+&@#/%=~_|]');
    var match = url_regex.test(url);
    if(!match) {	    	
        console.log("%s is not a valid URL. Exiting.", url);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return url;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var checkFromURL = function(url,checksf) {	
	rest.get(url).on('complete',function(data){
		/*var outfile = "hello.txt";
		var out = "A startup is a business built to grow rapidly.\n";
		fs.writeFileSync(outfile, out);*/
		
		$ = cheerio.load(data);
		
	    var checks = loadChecks(checksf).sort();
	    
	    var out = {};
	    for(var ii in checks) {
	        var present = $(checks[ii]).length > 0;
	        out[checks[ii]] = present;
	    }
	    console.log(out);
	    return JSON.stringify(out,null,4);
	});
};
	
if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-u, --url <url_file>', 'URL to be fetched',clone(checkExistsUrl))
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)        
        .parse(process.argv);
    //var checkJson = checkHtmlFile(program.file, program.checks);
    var checkURL = checkFromURL(program.url,program.checks);
    //var outJson = JSON.stringify(checkURL, null, 4);
    //console.log(checkFromURL(program.url,program.checks));
} else {
    exports.checkHtmlFile = checkHtmlFile;
}