var CLI = require('../lib/clui.js'),
		Spinner = CLI.Spinner;

var countdown = new Spinner('Exiting in 10 seconds...  ');

console.log('\n');
countdown.start();

var number = 10;
setInterval(function () {
	number--;
	countdown.message('Exiting in ' + number + ' seconds...  ');
	if (number === 0) {
		process.stdout.write('\n');
		process.exit(0);
	}
}, 1000);