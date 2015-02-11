var surly = require('../src/surly');
var fs = require('fs');
var libxmljs = require('libxmljs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var emitup;
var parseString = require('xml2js').parseString;
var conf = require('rc')('surly', {
    brain: '',      b: '',
    help: false,
    version: false
});

var options = {
    brain: __dirname + "/../habmind.aiml",
    help: conf.help || conf.h,
    version: conf.version,
};

var aimlDom = [];
exports.index = function(req, res){
  res.render('admin', { title: 'Express' });
};


exports.emitupdate = function(emitter){
emitup = emitter;
}

exports.rest = function(req, res){
im = 0;
files = null;
aimlDom = [];
eventEmitter = new events.EventEmitter();
eventEmitter.on('counter', function(){
if(req.body.dataid && req.body.typeid && (req.body.typeid == "pattern" || req.body.typeid == "template") && !req.body.fetch && !req.body.datasub && parseInt(req.body.dataid) >= 0 && parseInt(req.body.dataid) <= allindex(aimlDom[0].toString(), "<category>").length){

var toreplace = "";

if(req.body.typeid == "template"){toreplace="pattern"}
if(req.body.typeid == "pattern"){toreplace="template"}

var newaiml = aimlDom[0].toString().replace("<" + toreplace + "/>","<" + toreplace + "></" + toreplace + ">").replace(aimlDom[0].find("category")[parseInt(req.body.dataid) - 1].find(req.body.typeid).toString(),"<" + req.body.typeid + ">" + req.body.value.toString().toUpperCase() + "</" + req.body.typeid + ">");


fs.writeFile(options.brain, "", function(err) {
  if (err) throw err;
});
fs.writeFile(options.brain, newaiml, function(err) {
  if (err) throw err;
});


res.send(req.body.value.toString().toUpperCase());
}

if(req.body.dataid && req.body.typeid && (req.body.typeid == "pattern" || req.body.typeid == "template") && !req.body.fetch && req.body.datasub && parseInt(req.body.dataid) >= 0 && parseInt(req.body.dataid) <= allindex(aimlDom[0].toString(), "<category>").length){

var toreplace = "";

if(req.body.typeid == "template"){toreplace="pattern"}
if(req.body.typeid == "pattern"){toreplace="template"}
var newaiml = aimlDom[0].toString().replace("<" + toreplace + "/>","<" + toreplace + "></" + toreplace + ">").replace(aimlDom[0].find("category")[parseInt(req.body.dataid) - 1].find("subcategory")[parseInt(req.body.datasub) - 1].find(req.body.typeid).toString(),"<" + req.body.typeid + ">" + req.body.value.toString().toUpperCase() + "</" + req.body.typeid + ">");

fs.writeFile(options.brain, "", function(err) {
  if (err) throw err;
});

fs.writeFile(options.brain, newaiml, function(err) {
  if (err) throw err;
});


res.send(req.body.value.toString().toUpperCase());


}




if(req.body.fetch){
parseString(aimlDom[0], function (err, result) {
	res.send(JSON.stringify(result));
});

}


if(req.body.add){


var newaiml = aimlDom[0].toString().replace("</aiml>","") + "<category>\n<pattern></pattern>\n<template></template>\n\n<subcategory>\n<pattern></pattern>\n<template></template>\n</subcategory>\n\n<subcategory>\n<pattern></pattern>\n<template></template>\n</subcategory>\n</category>\n</aiml>";

fs.writeFile(options.brain, "", function(err) {
  if (err) throw err;
});

fs.writeFile(options.brain, newaiml, function(err) {
  if (err) throw err;
});



	res.send("1");
}





if(req.body.remove && parseInt(req.body.dataid) >= 0 && parseInt(req.body.dataid) <= allindex(aimlDom[0].toString(), "<category>").length){


var indexstart = allindex(aimlDom[0].toString(), "<category>");

var indexend = allindex(aimlDom[0].toString(), "</category>");

var newaiml = aimlDom[0].toString().replace(aimlDom[0].toString().substr(indexstart[parseInt(req.body.dataid) - 1], indexend[parseInt(req.body.dataid) - 1] + 11),"") + "</aiml>";
fs.writeFile(options.brain, "", function(err) {
  if (err) throw err;
});

fs.writeFile(options.brain, newaiml, function(err) {
  if (err) throw err; 
});



	res.send("1");
}




if((!req.body.remove && !req.body.add && !req.body.fetch && !req.body.dataid && !req.body.typeid) || (parseInt(req.body.dataid) < 0 || parseInt(req.body.dataid) > allindex(aimlDom[0].toString(), "<category>").length)){
res.send("0");
}




});	
loadAimlDir(options.brain);			
};

allindex = function(str, toSearch) {
    var indicates = [];
    for(var pos = str.indexOf(toSearch); pos !== -1; pos = str.indexOf(toSearch, pos + 1)) {
        indicates.push(pos);
    }
    return indicates;
}

loadAimlDir = function (filename, callback) {


			if (fs.statSync(filename).isDirectory()) {
			} else if (filename.substr(-5).toLowerCase() === '.aiml') {
				this.loadAimlFile(filename, callback);
       }
	};

	
	
	
loadAimlFile = function (file, callback) {
		var that = this;
		fs.readFile(file, 'utf8', function (err, xml) {
			if (err) {
				return console.log(err);
			}
			var dom = libxmljs.parseXml(xml);
			aimlDom.push(dom);
			eventEmitter.emit('counter');
			emitup.emit('emitup');
		});

	};