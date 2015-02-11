/*
 * GET JSON Surly response
 */

exports.index = function(req, res){
var talkit = interpreter.talk(req.query.sentence, req.query.s2, req.query.s3);
	var	output = {
		response: talkit[0],
		exit: talkit[1]
	};

	res.send(JSON.stringify(output));
};
