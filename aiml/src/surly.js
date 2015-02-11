var fs = require('fs');
var libxmljs = require('libxmljs');
var Logger = require('./logger');
var Stack = require('./stack');
var subs = require('./substitutions');
var pkg = require('../package.json');

var Surly = function() {

	var aimlDom = [],
		wildCardRegex = ' ([A-Z|0-9|\\s]*[A-Z|0-9|-]*[A-Z|0-9]*[!|.|?|\\s]*)',
		wildcard_stack = new Stack(10),
		input_stack = new Stack(10),
		previousResponse = '',
		unknownVariableString = 'unknown',
		storedVariables = {},
		botAttributes = {},
		commands = {
			HELP: function (sentence) {
				return 'This is the unhelpful help. Type "/cmds" to list available commands.';
			},
			CMDS: function () {
				var keys = [];

				for (var key in commands) {
					if (key === 'length' || !commands.hasOwnProperty(key)) continue;
					keys.push(key);
				}

				return 'Available commands: /' + keys.join(', /') + '.';
			}
		},
		inventory = [],
		logger = new Logger('logs/surly.log');

	this.log = function (msg) {
		logger.write(msg);
	};

	/**
	 * Output text to console with indents to make it stand out
	 * @param  {String} msg Message to output
	 * @return {Undefined}
	 */
	this.debug = function (msg) {
		this.log('DEBUG - ' + msg);
	};

	/**
	 * Find files in a dir and run loadAimlFile on them
	 * @param  {String} dir
	 * @return {Undefined}
	 */
	this.loadAimlDir = function (filename, callback) {
	

			if (fs.statSync(filename).isDirectory()) {
			} else if (filename.substr(-5).toLowerCase() === '.aiml') {
				this.loadAimlFile(filename, callback);
			}
	};

	/**
	 * Load an AIML into memory
	 * @param  {String} file
	 * @return {Undefined}
	 */
	this.loadAimlFile = function (file, callback) {
		var that = this;

		this.debug('Loading file "' + file + '"...');

		fs.readFile(file, 'utf8', function (err, xml) {
			if (err) {
				return console.log(err);
			}

			var dom = libxmljs.parseXml(xml);

			aimlDom.push(dom);
			that.debug('Files parsed!');
		});
	};

	/**
	 * Main publicly accessible method
	 * @param  {String}   sentence
	 * @param  {Function} callback
	 * @return {String}
	 */
	this.talk = function(sentence, s2, s3) {
		var i,
			template,
			command = '',
			response = '',
			start_time = new Date();
var senscope = {sentence: sentence, s2: s2, s3: s3};
		this.log('INPUT: ' + sentence);

		input_stack.push(senscope);


 		if(!sentence){
		return ["null", 1];
		}

		
		// Sentences beginning with / are commands
		if (sentence.substr(0,1) === '/') {
			command = sentence.substr(1).split(' ')[0];

			this.debug('Command: ' + command);

			if (typeof commands[command] !== 'function') {
				return command + ' is not a valid command.';
			}

			return commands[command](sentence);
		}

		

		// No DOM, no love
		if (aimlDom.length === 0) {
			return 'My mind is blank.';
		}

		for (i = 0; i < aimlDom.length; i++) {
			template = this.findTemplate(sentence, s2, s3, aimlDom[i].find('category'));
			if (template) {
				break;
			}
		}
		

		if (template[0]) {
			response = this.getTemplateText(template[0][0]);
		}

		if (!response) {
			response = 'null';
			template = [1,1];
		}

		previousResponse = this.normaliseTemplate(template);

		var end_time = new Date();

		this.log('OUTPUT: ' + response + ' (' + Math.abs(end_time - start_time) + 'ms)');

		return [response, template[1]];
	};

	/**
	 * Convert a XML type template to a pattern-style string
	 * @param  {XML Object or String} text AIML Template
	 * @return {[type]}      Normalised template
	 */
	this.normaliseTemplate = function (text) {
		return text
			.toString()
			.replace(/<star ?\S*\/?>/gi, '*')
			.replace(/<template>|<\/template>/gi, '')
			.toUpperCase();
	}

	/**
	 * Parse an AIML template and get the resulting text
	 * @param  {Object} template Libxmljs template node
	 * @return {String}          Outputted text
	 */
	this.getTemplateText = function(template) {
		this.debug('Using template: ' + template.toString());

		var i,
			x,
			output = '',
			children = template.childNodes();

		// @todo - issues here. recursion isn't quite right...
		// if (typeof template === 'undefined') {
		// 	this.debug('Template undefined');
		// 	return false;
		// }
		// 
		// if (!children.length) {
		// 	this.debug('Empty template');
		// 	return false;
		// }

		for (i = 0; i < children.length; i++) {
				
			switch (children[i].name().toLowerCase()) {
				case 'template':
					output += this.getTemplateText(children[i]);
					break;
				case 'text':
					if (children[i].text().trim() !== '') {
						output += this.handleString(children[i]);
					}

					break;
				case 'a': // link tag - return as text
					output += children[i].toString();
					break;
				case 'br':
					output += '<br>';
					break;
				case 'srai':
					output += this.talk(this.getTemplateText(children[i]));
					break;
				case 'random':
					var childrenOfRandom = children[i].find('li'),
							rand = Math.floor(Math.random() * childrenOfRandom.length),
							randomElement = childrenOfRandom[rand];

					output += this.getTemplateText(randomElement);
					break;
				case 'bot':
					output += this.getBotAttribute(children[i].attr('name').value());
					break;
				case 'get':
					if (children[i].attr('name') && this.getStoredVariable(children[i].attr('name').value())) {
						output += this.getStoredVariable(children[i].attr('name').value());
					} else if (children[i].attr('default')) {
						output += children[i].attr('default').value();
					} else {
						output += unknownVariableString;
					}
					break;
				case 'set':
					this.setStoredVariable(children[i].attr('name').value(), this.getTemplateText(children[i]));
					break;
				case 'size':
					var size = 0;

					for (x = 0; x < aimlDom.length; x++) {
						size += aimlDom[x].find('category').length;
					}

					output += size;

					break;
				case 'star':
					var index = 0,
							wildcards;

					if (children[i].attr('index')) {
						index = children[i].attr('index').value() - 1;
					}

					wildcards = wildcard_stack.getLast();

					if (typeof wildcards[index] === 'undefined') {
						this.debug('Error: <star> with no matching * value');
					} else {
						output += wildcards[index];
					}

					break;
				case 'date':
					output += new Date().toISOString();
					break;
				case 'sr':
					output += this.talk(wildcard_stack.getLast()[0]);
					break;
				case 'inventory':
					var action = children[i].attr('action').value();

					switch (action) {
						case 'swap':
							if (inventory.length > 0) {
								this.setStoredVariable('last_dropped', inventory.shift());
							}
							inventory.push(this.getTemplateText(children[i]));
							break;
						case 'list':
							output += 'I am carrying ' + inventory.join(', ') + '. ';
							break;
						default:
							this.debug('Invalid inventory action: ' + action);
					}
					break;
				case 'that':
					output += previousResponse;
					break;
				case 'thatstar':
					var wildcards = wildcard_stack.get(-1)[0],
						index = 0;

					if (children[i].attr('index')) {
						index = children[i].attr('index').value() - 1;
					}

					if (!wildcards) {
						this.debug('Error: <thatstar> with no matching * value.');
					} else {
						output += wildcards[index];
					}

					break;
				case 'li':
					output += this.getTemplateText(children[i]);
					break;
				// case 'pattern':
				case 'gender':
				case 'person2':
				case 'person':
					var text = this.getTemplateText(children[i]),
							set = children[i].name().toLowerCase();

					if (!text) {
						text = wildcard_stack.get(-1)[0];
					}
					
					output += subs.swap(text, set);

					break;
				case 'formal':
					var text = this.getTemplateText(children[i]);

					output += text.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
					break;
				case 'sentence':
					var text = this.getTemplateText(children[i]).toLowerCase();
					output += text[0].toUpperCase() + text.slice(1);
					break;
				case 'uppercase':
					output += this.getTemplateText(children[i]).toUpperCase();
					break;
				case 'lowercase':
					output += this.getTemplateText(children[i]).toLowerCase();
					break;
				case 'think':
					// Parse template but don't output results
					this.getTemplateText(children[i]); 
					break;
				case 'input':
					var input = 1;
					children[i].attr('index').value()
					output += input_stack.get(-input);
					break;
				case 'version':
					output += pkg.version;
					break;
				default:
					//return resolveChildren(children);
					output += ' [' + children[i].name() + ' not implemented] ';
					break;
			}
		}

		return output;
	};

	/**
	 * Handler for plain text node. Returns content as a string.
	 * @param  {libxmljs node} node Node to extract text from
	 * @return {String}             INPUT's text content
	 */
	this.handleString = function (node) {
		// @todo - all sorts
		return node.toString();
	};

	/**
	 * Handler for the AIML <bot> tag. Get a bot's attribute from memory.
	 * @param  {[type]} name [description]
	 * @return {[type]}      [description]
	 */
	this.getBotAttribute = function (name) {
		if (typeof botAttributes[name] === undefined) {
			return null;
		}

		return botAttributes[name];
	};

	/**
	 * Handler for AIML <get> tag. Get a variable from the bot's memory.
	 * @param  {String} name Name of the variable
	 * @return {String}      Value of the variable
	 */
	this.getStoredVariable = function (name) {
		return storedVariables[name];
	};

	/**
	 * Handler for AIML <set> tag. Store a value in the bot's memory for later use.
	 * @param {String} name  The name of the variable to set
	 * @param {String} value The value of the variable
	 */
	this.setStoredVariable = function (name, value) {
		storedVariables[name] = value;
	};

	/**
	 * Unload all data from the AIML DOM
	 * @return undefined
	 */
	this.emptyMind = function () {
		aimlDom = [];
	};

	/**
	 * Search through given categories for a pattern that matches `sentence`. 
	 * Return the matching template.
	 * @param  {String} sentence   Input to find a match for
	 * @param  {Object} categories XMLDom categories list
	 * @return {Object}            XMLDom template element
	 */
	this.findTemplate = function (sentence, s2, s3, categories) {
	if((!s2 && !s3) || (s2.toString().trim().length == 0 && s3.toString().trim().length == 0)){
		for (var i = 0; i < categories.length; i++) {
			var pattern = categories[i].find('pattern')[0].text();

			if (this.comparePattern(sentence, pattern)) {
				
				if (this.checkThat(categories[i])) {
				var stateexit = 1;
if(categories[i].find("subcategory").length > 0 && categories[i].find("subcategory")[0].find('pattern').toString().replace(/<pattern>|<\/pattern>|<pattern\/>/gi, '').trim().length > 0){stateexit = 0;}
					return [categories[i].find('template'), stateexit];
				}
			}
		}
}

if(s2 && !s3 && s2.toString().trim().length != 0){
for (var i = 0; i < categories.length; i++) {
			var pattern = categories[i].find('pattern')[0].text();

			if (this.comparePattern(sentence, pattern)) {
if (categories[i].find("subcategory")[0] && this.comparePattern(s2.toString().trim(), categories[i].find("subcategory")[0].find("pattern")[0].text())) {
				if (this.checkThat(categories[i].find("subcategory")[0])) {
				var stateexit = 1;
	if(categories[i].find("subcategory").length > 1 && categories[i].find("subcategory")[1].find('pattern').toString().replace(/<pattern>|<\/pattern>|<pattern\/>/gi, '').trim().length > 0){stateexit = 0;}
			return [categories[i].find("subcategory")[0].find('template'), stateexit];
				}
}

			}
		}
}



if(s2 && s3 && (s2.toString().trim().length != 0 && s3.toString().trim().length != 0)){
for (var i = 0; i < categories.length; i++) {
			var pattern = categories[i].find('pattern')[0].text();

			if (this.comparePattern(sentence, pattern)) {

if (categories[i].find("subcategory")[1] && this.comparePattern(s3.toString().trim(), categories[i].find("subcategory")[1].find("pattern")[0].text())) {
				if (this.checkThat(categories[i].find("subcategory")[1])) {
			return [categories[i].find("subcategory")[1].find('template'), 0];
				}
}

			}
		}
}
		
		return false;
	};

	/**
	 * Check whether a given category has a <that> and whether
	 * if matches the previous response
	 * @param  {Object}  category Libxmljs category aiml node
	 * @return {Boolean}          True if <that> exists and matches
	 */
	this.checkThat = function (category) {
		var that = category.find('that');

		if (that.length === 0) {
			return true;
		}

		if (that.length > 1) {
			this.debug('Error: multiple <that>s. Using first.');
		}

		return that[0].text() === previousResponse.toUpperCase();

		return isMatch;
	}

	/**
	 * Compare a user's sentence to an AIML pattern
	 * @param  {String} sentence User's sentence
	 * @param  {String} pattern  AIML pattern
	 * @return {Boolean}         True if sentence matches pattern
	 */
	this.comparePattern = function (sentence, aiml_pattern) {
		// @todo
		// add spaces to prevent false positives
		if (sentence.charAt(0) !== ' ') {
			sentence = ' ' + sentence;
		}

		if (sentence.charAt(sentence.length - 1) !== ' ') {
			sentence = sentence + ' ';
		}

		sentence = sentence.toUpperCase(); // @todo - remove this

		var regex_pattern = this.aimlPatternToRegex(aiml_pattern);
		var matches = sentence.match(regex_pattern);
		if (matches && (matches[0].length >= sentence.length || regex_pattern.indexOf(this.wildCardRegex) > -1)) {
			wildcard_stack.push(this.getWildCardValues(sentence, aiml_pattern));
			return true;
		}
	
		return false;
	};

	/**
	 * Convert a string with wildcards (*s) to regex
	 * @param  String pattern The string with wildcards
	 * @return String      The altered string
	 */
	this.aimlPatternToRegex = function (pattern) {
		var lastChar,
				firstChar = pattern.charAt(0);

		// add spaces to prevent e.g. foo matching food
		if (firstChar != '*') {
			pattern = ' ' + pattern;
		}

		lastCharIsStar = pattern.charAt(pattern.length - 1) === '*';

		// remove spaces before *s
		pattern = pattern.replace(' *', '*');

		// replace wildcards with regex
		pattern = pattern.replace(/\*/g, wildCardRegex);

		if (!lastCharIsStar) {
			pattern = pattern + '[\\s|?|!|.]*';
		}

		return pattern;
	};

	/**
	 * Extract wildcard values from a sentence using a given pattern
	 * @param  {String} sentence Sentence to extract values from
	 * @param  {String} pattern  AIML pattern to match against
	 * @return {Array}           Wildcard values
	 */
	this.getWildCardValues = function (sentence, pattern) {
		var replaceArray = pattern.split('*');

		if (replaceArray.length < 2) {
			return wildcard_stack.getLast();
		}

		// replace non-wildcard parts with a pipe
		for (var i = 0; i < replaceArray.length; i++) {
			sentence = sentence.replace(replaceArray[i], '|');
		}

		// split by pipe and we're left with values and empty strings
		sentence = sentence.trim().split('|');

		var output = [];
		var chunk = '';

		for (i = 0; i < sentence.length; i++) {
			chunk = sentence[i].trim();

			if (chunk === '') continue;

			if (chunk.charAt(chunk.length - 1) === '?') {
				chunk = chunk.substr(0, chunk.length - 1);
			}

			output.push(chunk);
		}

		return output;
	};

	/**
	 * Check if a string contains only white space
	 * @param  {String}  input String to check
	 * @return {Boolean}       Returns true if string is empty or jsut whitespace
	 */
	this.isStringEmpty = function(input) {
		return input.trim() === '';
	};

	this.debug('========================== BOOTING ============================');

};

module.exports = Surly;
