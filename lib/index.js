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


exports.findGitRoot = function (start) {

    if (internals.isDir(Path.join(start, '.git'))) {
        return start;
    }
    else {
        return exports.findGitRoot(Path.dirname(start));
    }
};


exports.findProjectRoot = function (start) {

    var position = start.indexOf('node_modules');
    return start.slice(0, position === -1 ? undefined : position - Path.sep.length);
};


internals.isDir = function (path) {

    try {
        var stat = Fs.statSync(path);
        return stat.isDirectory();
    }
    catch (e) {
        return false;
    }
};


exports.findProjects = function (root, depth) {

    depth = depth || 0;
    ++depth;

    if (depth > 4 ||
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
