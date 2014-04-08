var CLI   = require('../lib/clui.js'),
    clc   = require('cli-color');

var Line          = CLI.Line;
    Progress      = CLI.Progress;

var statuses = [0, 0, 0, 0, 0];
var lengths = [10, 20, 30, 40, 50];

console.log('\nCtrl/Command + C to quit...\n\n\n\n\n\n\n\n\n');

function drawProgress () {
  process.stdout.write('\033[9A');
  var blankLine = new Line().fill().output();

  var headers = new Line()
    .padding(2)
    .column('Item', 20, [clc.cyan])
    .column('Progress', 40, [clc.cyan])
    .fill()
    .output();

  blankLine.output();

  for(var index in lengths) {
    var thisProgressBar = new Progress(20);

    var websiteLine = new Line()
    .padding(2)
    .column('Item #' + index, 20, [clc.cyan])
    .column(thisProgressBar.update(statuses[index], lengths[index]), 40)
    .fill()
    .output();
  }

  blankLine.output();
}

var statusTimer = setInterval(drawProgress, 100);
var incrementTimer = setInterval(function () {
  for(var index in lengths)
  {
    if(statuses[index] < lengths[index])
      statuses[index]++;
  }
}, 500);

