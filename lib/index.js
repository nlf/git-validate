// Load modules

var Fs = require('fs');
var Path = require('path');
var Cp = require('child_process');


// Declare internals

var internals = {};


exports.registerHook = function (filename) {
};


exports.addFile = function (filename, path) {
};


exports.deleteFile = function (filename, path) {
};


exports.findGitRoot = function (callback) {

    Cp.exec('git rev-parse --show-toplevel', function (err, stderr) {

        callback(err, stderr.trim());
    });
};


exports.findProjectRoot = function (callback) {

    var path = __dirname.slice(0, __dirname.indexOf('node_modules'));
    callback(null, path);
};


internals.isDir = function (path) {

    var stat = Fs.statSync(path);
    return stat.isDirectory();
};


exports.findProjects = function (root, depth) {

    depth = depth || 0;
    ++depth;

    if (depth > 4 ||
        // !internals.isDir(root)) {
        !internals.isDir(root) ||
        root.indexOf('node_modules') !== -1) {

        return [];
    }

    var dirs = Fs.readdirSync(root);
    var projects = [];

    for (var i = 0, il = dirs.length; i < il; ++i) {
        var dir = dirs[i];
        var path = Path.join(root, dir);

        if (Fs.existsSync(Path.join(path, 'package.json'))) {
            projects.push(path);
        }
        else {
            projects = projects.concat(exports.findProjects(path, depth));
        }
    }

    return projects;
};
