#!/usr/bin/env node

var express = require('express');
var http = require('http');
var server = http.createServer(app);
var ent = require('ent');
var fs = require('fs');
var path = require('path');
var routes = require('./routes');
var talk = require('./routes/talk');
var adminp = require('./routes/admin');
var surly = require('./src/surly');
var pkg = require('./package.json');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var conf = require('rc')('surly', {
    brain: '',      b: '',
    help: false,
    version: false
});

var options = {
    brain: __dirname + '/habmind.aiml',
    help: conf.help || conf.h,
    version: conf.version,
};

if (options.help) {
    console.log('Surly chat bot web server\n\n' + 
        'Options: \n' + 
        '  -b, --brain       AIML directory (./aiml)\n' + 
        '  --help            Show this help message\n' + 
        '  --version         Show version number');
    process.exit();
}

if (options.version) {
    console.log(pkg.version);
    process.exit();
}

var app = express();

// all environments
app.set('port', options.port || process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: 'somesecret' })); // session secret
app.use(express.static(path.join(__dirname, 'public')));

// development only

interpreter = new surly();
interpreter.loadAimlDir(options.brain);
eventEmitter.on('emitup', function(){
interpreter = new surly();
interpreter.loadAimlDir(options.brain);
});

adminp.emitupdate(eventEmitter);
// Set up routes
app.get('/admin', adminp.index);    // Gets the form
app.get('/talk', talk.index); // Gets a response (JSON)
app.post('/admin-rest', adminp.rest); 

// Set up static files dir
app.use(express.static(__dirname + '/public'));

http.createServer(app).listen(app.get('port'), function(){
    console.log('listening on port: ' + app.get('port'));
});
