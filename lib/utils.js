var Fs = require('fs');
var Path = require('path');

var internals = {};


// Find the topmost parent of the given module.
internals.findParent = function (mod) {

    return mod.parent ? internals.findParent(mod.parent) : mod;
};


// Similar to mkdir -p, recursively creates directories until `path` exists
internals.mkdir = function (path) {

    var mode = ~process.umask() & parseInt('777', 8);

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

    if (typeof target === 'object') {
        options = target;
        target = undefined;
    }

    options = options || {};

    var root = Path.dirname(internals.findParent(module).filename);
    var projectRoot = exports.findProjectRoot(root);

    var sourcePath = Path.resolve(root, source);
    var targetPath = Path.resolve(projectRoot, target || source);

    if (targetPath.indexOf(projectRoot) !== 0) {
        throw new Error('Destination must be within project root');
    }

    return internals.copy(sourcePath, targetPath, options);
};


// Determine if source is a directory or a file and call the appropriate method
internals.copy = function (source, target, options) {

    if (exports.isDir(source)) {
        internals.copyDirectory(source, target, options);
    }
    else {
        return internals.copyFile(source, target, options);
    }
};


// Recursively copy a directory
internals.copyDirectory = function (source, target, options) {

    internals.mkdir(target);

    var sources = Fs.readdirSync(source);
    for (var i = 0, l = sources.length; i < l; ++i) {
        var sourcePath = Path.join(source, sources[i]);
        var targetPath = Path.join(target, sources[i]);

        internals.copy(sourcePath, targetPath, options);
    }
};


// Copy a single file
internals.copyFile = function (source, target, options) {

    internals.mkdir(Path.dirname(target));

    var mode = ~process.umask() & parseInt('666', 8);

    if (Fs.existsSync(target) &&
        !options.overwrite) {

        return new Error(target + ' already exists');
    }

    var sourceStream = Fs.createReadStream(source);
    var targetStream = Fs.createWriteStream(target, { flag: 'w', mode: mode });

    sourceStream.pipe(targetStream);
};


// Given a path, determine if the path is a directory
exports.isDir = function (path) {

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

    start = start || Path.dirname(internals.findParent(module).filename);
    var root;

    if (exports.isDir(Path.join(start, '.git'))) {
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

    start = start || Path.dirname(internals.findParent(module).filename);
    var position = start.indexOf('node_modules');
    var root = start.slice(0, position === -1 ? undefined : position - Path.sep.length);
    if (root === Path.resolve(root, '..')) {
        throw new Error('Unable to find a package.json for this project');
    }

    while (!Fs.existsSync(Path.join(root, 'package.json'))) {
        root = exports.findProjectRoot(Path.dirname(root));
    }

    return root;
};


// Given a root path, find a list of projects.
// A project is defined as any directory within 4 levels of the starting
// directory that contains a file named "package.json"
//
// Returns an array
exports.findProjects = function (start, depth) {

    start = start || exports.findGitRoot(internals.findParent(module).filename);
    depth = depth || 0;
    ++depth;

    if (depth > 4 ||
        !exports.isDir(start) ||
        start.indexOf('node_modules') !== -1) {

        return [];
    }

    var dirs = Fs.readdirSync(start);
    var projects = [];

    if (Fs.existsSync(Path.join(start, 'package.json'))) {
        projects.push(start);
    }

    for (var i = 0, il = dirs.length; i < il; ++i) {
        var dir = dirs[i];
        var path = Path.join(start, dir);

        if (Fs.existsSync(Path.join(path, 'package.json'))) {
            projects.push(path);
        }
        else {
            projects = projects.concat(exports.findProjects(path, depth));
        }
    }

    return projects;
};

// Install the git hooks as specified by `hooks`. Should be an array of
// strings, like ['pre-commit']. Will automatically turn a single argument into
// an array for simplicity (e.g. Validate.installHooks('pre-commit') works fine).
exports.installHooks = function (hooks, root) {

    if (!Array.isArray(hooks)) {
        hooks = [hooks];
    }

    var gitRoot = exports.findGitRoot(root);

    for (var i = 0, l = hooks.length; i < l; ++i) {
        var hook = hooks[i];
        var dest = Path.join(gitRoot, '.git', 'hooks', hook);
        var source = Path.resolve(__dirname, '..', 'bin', 'validate.sh');

        if (Fs.existsSync(dest)) {
            Fs.renameSync(dest, dest + '.backup');
        }

        Fs.writeFileSync(dest, Fs.readFileSync(source), { mode: 511 });
    }
};
