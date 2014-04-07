var	clc      = require('cli-color'),
		ansiTrim = require('cli-color/lib/trim'),
		_        = require('lodash');

var sparklineSymbols = [
	'\u2581',
	'\u2582',
	'\u2583',
	'\u2584',
	'\u2585',
	'\u2586',
	'\u2587',
	'\u2588'
];

var helpers = {

	// Make an ascii horizontal gauge
	Gauge: function (value, maxValue, width, dangerZone, suffix) {
		var barLength = Math.ceil(value/maxValue*width);
		if(barLength > width)
			barLength = width;

		var barColor = clc.green;
		if(value > dangerZone)
			barColor = clc.red;

		return '['+
			barColor(Array(barLength).join("|")) +  //The filled portion
			Array(width+1-barLength).join("-") +		//The empty portion
		'] ' + clc.blackBright(suffix);
	},

	//Make a unicode sparkline chart
	Sparkline: function (points, suffix) {
		if(typeof suffix == 'undefined')
			suffix = '';

		var max = _.max(points);

		var scaledSequence = _.map(points, function (thisPoint) {
			if(max === 0)
				return [0, 0];
			else if(thisPoint === 0)
				return [0, 0];
			else
				return [
					Math.ceil(thisPoint / max * (sparklineSymbols.length-1)),
					thisPoint
				];
		});

		var sparklineGraph = '';
		var alreadyDrawnMax = false;
		_.each(scaledSequence, function (symbolNumber) {
			if(symbolNumber[1] == max & !alreadyDrawnMax)
			{
				sparklineGraph += clc.green(sparklineSymbols[symbolNumber[0]]);
				alreadyDrawnMax = true;
			}
			else
				sparklineGraph += sparklineSymbols[symbolNumber[0]];
		});

		return sparklineGraph + '  ' + clc.blackBright(points[points.length-1] + suffix + ' (') + clc.green(max + suffix) + clc.blackBright(')');
	},

	// Interface for storing multiple lines and then outputting them all at once.
	LineBuffer: function (userOptions) {
		var self = this;
		self.lines = [];

		//Merge the user defined settings (if there are any) with the default settings.
		var defaultOptions = {
			x: 0,
			y: 0,
			width: 'console',
			height: 'console',
			scroll: 0
		};

		if(typeof userOptions == 'undefined')
			self.userOptions = defaultOptions;
		else
		{
			_.extend(defaultOptions, userOptions);
			self.userOptions = defaultOptions;
		}

		this.height = function ()
		{
			if(self.userOptions.height == 'console')
				return process.stdout.rows;
			else
				return self.userOptions.height;
		};

		this.width = function ()
		{
			if(self.userOptions.width == 'console')
				return process.stdout.columns;
			else
				return self.userOptions.width;
		};

		// Push a line of content into the buffer.
		this.addLine = function (lineObject) {
			self.lines.push(lineObject);
			return self;
		};

		// See if the buffer has enough content to fill the vertical space, if not fill the vertical space
		// with the designated fill line.
		this.fill = function (fillLine) {
			var fillHeight = self.height()-self.lines.length;
			if(fillHeight > 0)
			{
				for(var i = 0; i < fillHeight; i++)
				{
					self.addLine(fillLine);
				}
			}
			return self;
		};

		//Output a buffer full of lines.
		this.output = function () {
			//First grab a subset of the lines depending on the scroll location and the height of the buffer.
			var outputLines;
			var sliceEnd;
			var outputHeight = self.height();
			if(self.userOptions.scroll > self.lines.length)
				return;

			if(self.lines.length - self.userOptions.scroll > outputHeight)
				outputLines = self.lines.slice(self.userOptions.scroll, self.userOptions.scroll + outputHeight);
			else
				outputLines = self.lines.slice(self.userOptions.scroll);

			//First move the cursor to the location where we want the buffer to draw.
			var currentY = self.userOptions.y;
			_.each(outputLines, function (line) {
				process.stdout.write(clc.moveTo(self.userOptions.x, currentY));
				line.output();
				currentY++;
			});
		};
	},

	// Chainable wrapper for line content
	Line: function (defaultBuffer) {
		var lineContent = "";
		var self = this;
		self.defaultBuffer = defaultBuffer;

		//Put text in the line
		this.text = function (text, styles) {
			for(var styleNumber in styles)
			{
				text = styles[styleNumber](text);
			}
			lineContent += text;
			return self;
		};

		//Put padding in the line.
		this.padding = function (width, styles) {
			var padding = Array(width+1).join(" ");
			for(var styleNumber in styles)
			{
				padding = styles[styleNumber](padding);
			}
			lineContent += padding;
			return self;
		};

		//Put padding in the line.
		this.column = function (text, columnWidth, textStyles) {
			var textWidth = ansiTrim(text).length;

			if(textWidth > columnWidth)
			{
				self.text(text.slice(0, columnWidth), textStyles);
			}
			else if(textWidth < columnWidth)
			{
				self.text(text, textStyles)
						.padding(columnWidth - textWidth);
			}
			else
			{
				self.text(text, textStyles);
			}
			return self;
		};

		//Fill the rest of the width of the line with space.
		this.fill = function (styles) {
			var fillWidth = process.stdout.columns-ansiTrim(lineContent).length;
			if(fillWidth > 0)
				self.padding(fillWidth, styles);
			return self;
		};

		//Store a line in a line buffer to be output later.
		this.store = function (buffer) {
			if(typeof buffer == 'undefined')
			{
				if(typeof self.defaultBuffer == 'undefined')
					process.stderr.write('Attempt to store a line in a line buffer, without providing a line buffer to store that line in.');
				else
					self.defaultBuffer.addLine(self);
			}
			else
			{
				buffer.addLine(self);
			}
			return self;
		};

		//Output a line directly to the screen.
		this.output = function () {
			process.stdout.write(lineContent+"\n");
			return self;
		};
	}
};

module.exports = helpers;