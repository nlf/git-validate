// Load modules

var Fs = require('fs');
var Path = require('path');
var Cp = require('child_process');


// Declare internals

var internals = {};


// Given a filename, copies the file to the git root's .git/hooks/pre-commit.d directory,
// also modifies the current project's package.json file to add the hook.

exports.registerHook = function (root, source) {

    if (arguments.length === 1) {
        source = root;
        root = Path.dirname(module.parent.filename);
    }

    var rootDir = Path.dirname(module.parent.filename);
    var gitRoot = exports.findGitRoot(root);
    var projectRoot = exports.findProjectRoot(root);
    var precommitDir = Path.join(gitRoot, '.git', 'hooks', 'pre-commit.d');
    var sourcePath = Path.resolve(rootDir, source);
    var packagePath = Path.join(projectRoot, 'package.json');

    var matcher = new RegExp('^' + rootDir.replace('/', '\/') + '\/.*$');
    if (!matcher.test(sourcePath)) {
        return new Error('Source file may not be above project root: ' + projectRoot);
    }

    if (!internals.isDir(precommitDir)) {
        try {
            Fs.mkdirSync(precommitDir);
        }
        catch (e) {
            return e;
        }
    }

    try {
        var fileContent = Fs.readFileSync(sourcePath);
        Fs.writeFileSync(Path.join(precommitDir, Path.basename(sourcePath)), fileContent);

        var projectPackage = require(packagePath);
        projectPackage.precommit = projectPackage.precommit || [];
        projectPackage.precommit.push(Path.basename(source).replace(/\.[a-zA-Z0-9]+$/, ''));
        Fs.writeFileSync(packagePath, JSON.stringify(projectPackage), 'utf8');
    }
    catch (e) {
        return e;
    }
};

// Given a source file, and a destination path (relative to the project root),
// copy the source to the destination. If options.overwrite is false or not set,
// check to see if the file exists first and do not copy if it does. If true,
// always copy the file without checking
//
// Returns null if the file was copied, an Error object with explanation if it was not

exports.addFile = function (root, source, destination, options) {

    if (arguments.length === 3) {
        if (typeof destination === 'object') {
            options = destination;
            destination = source;
            source = root;
            root = Path.dirname(module.parent.filename);
        }
        else {
            options = {};
        }
    }
    else if (arguments.length === 2) {
        destination = source;
        source = root;
        root = Path.dirname(module.parent.filename);
        options = {};
    }
    else if (arguments.length < 2) {
        return new Error('Invalid arguments given to addFile');
    }

    var projectRoot = exports.findProjectRoot(root);
    var sourcePath = Path.resolve(root, source);
    var destinationPath = Path.resolve(projectRoot, destination);

    var matcher = new RegExp('^' + projectRoot.replace('/', '\/') + '\/.*$');
    if (!matcher.test(destinationPath)) {
        return new Error('Destination must be within project root: ' + projectRoot);
    }

    if (!options.overwrite &&
        Fs.existsSync(destinationPath)) {

        return new Error('Destination ' + destinationPath + ' already exists.');
    }

    try {
        var fileContents = Fs.readFileSync(sourcePath);
        Fs.writeFileSync(destinationPath, fileContents);
    }
    catch (e) {
        return e;
    }
};


// Given a starting directory, find the root of a git repository.
// In this case, the root is defined as the first directory that contains
// a directory named ".git"
//
// Returns a string if found, otherwise undefined

exports.findGitRoot = function (start) {

    var root;

    if (internals.isDir(Path.join(start, '.git'))) {
        root = start;
    }
    else if (Path.dirname(start) !== start) {
        root = exports.findGitRoot(Path.dirname(start));
    }

    return root;
};


// Given a starting directory, find the root of the current project.
// The root of the project is defined as the topmost directory that is
// *not* contained within a directory named "node_modules" that also
// contains a file named "package.json"
//
// Returns a string

exports.findProjectRoot = function (start) {

    var position = start.indexOf('node_modules');
    var root = start.slice(0, position === -1 ? undefined : position - Path.sep.length);

    while (!Fs.existsSync(Path.join(root, 'package.json'))) {
        root = Path.dirname(root);
    }

    return root;
};


// Given a path, determine if the path is a directory
//
// Returns true/false

internals.isDir = function (path) {

    try {
        var stat = Fs.statSync(path);
        return stat.isDirectory();
    }
    catch (e) {
        return false;
    }
};


// Given a root path, find a list of projects.
// A project is defined as any directory within 4 levels of the starting
// directory that contains a file named "package.json"
//
// Returns an array

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
