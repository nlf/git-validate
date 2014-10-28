var Fs = require('fs');
var Path = require('path');

var internals = {};


// Find the topmost parent of the given module.
internals.findParent = function (mod) {

    return mod.parent ? internals.findParent(mod) : mod;
};


// Similar to mkdir -p, recursively creates directories until `path` exists
internals.mkdir = function (path) {

    var mode = ~process.umask() & 0777;

    if (exports.isDir(path)) {
        return;
    }

    try {
        Fs.mkdirSync(path, mode);
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }

        internals.mkdir(Path.dirname(path));
        internals.mkdir(path);
    }
};


// Expands source and target to absolute paths, then calls internals.copy
exports.copy = function (source, target, options) {

    options = options || {};

    var root = internals.findParent(module).filename;
    var projectRoot = internals.findProjectRoot(root);

    var sourcePath = Path.resolve(root, source);
    var targetPath = Path.resolve(projectRoot, target);

    if (!(new RegExp('^' + projectRoot.replace('/', '\/') + '/\.*$')).test(targetPath)) {
        throw new Error('Destination must be within project root');
    }

    internals.copy(sourcePath, targetPath, options);
};


// Determine if source is a directory or a file and call the appropriate method
internals.copy = function (source, target, options) {

    if (internals.isDir(source)) {
        internals.copyDirectory(source, target, options);
    }
    else {
        internals.copyFile(source, target, options);
    }
};


// Recursively copy a directory
internals.copyDirectory = function (source, target, options) {

    var sources = Fs.readdirSync(source);
    for (var i = 0, l = sources.length; i < l; ++i) {
        var sourcePath = Path.join(source, sources[i]);
        var targetPath = Path.join(target, sources[i]);

        internals.copy(source, target, options);
    }
};


// Copy a single file
internals.copyFile = function (source, target, options) {

    if (!internals.isDir(Path.dirname(targetPath))) {
        internals.mkdir(Path.dirname(targetPath));
    }

    var mode = ~process.umask() & 0666;

    if (Fs.existsSync(target) &&
        !options.overwrite) {

        throw new Error(target + ' already exists');
    }

    var sourceStream = Fs.createReadStream(source);
    var targetStream = Fs.createWriteStream(target, { flag: 'w', mode: mode });

    sourceStream.pipe(targetStream);
};


// Given a path, determine if the path is a directory
internals.isDir = function (path) {

    try {
        var stat = Fs.statSync(path);
        return stat.isDirectory();
    }
    catch (e) {
        return false;
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
        root = internals.findGitRoot(Path.dirname(start));
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
            projects = projects.concat(internals.findProjects(path, depth));
        }
    }

    return projects;
};
