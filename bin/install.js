var Fs = require('fs');
var Path = require('path');
var Utils = require('../lib/utils');

var projectRoot;
try {
    projectRoot = Utils.findProjectRoot();
}
catch (e) {
    process.exit();
}

var project = JSON.parse(Fs.readFileSync(Path.join(projectRoot, 'package.json'), 'utf8'));
Utils.installHooks(['pre-commit', 'pre-push']);
