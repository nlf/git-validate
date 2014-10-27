var Crypto = require('crypto');
var Fs = require('fs');
var Mkdirp = require('mkdirp');
var Os = require('os');
var Path = require('path');
var Rimraf = require('rimraf');
var Validate = require('../');
var Writable = require('stream').Writable;

var Code = require('code');
var Lab = require('lab');

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;
var before = lab.before;
var after = lab.after;


var internals = {};
internals.fixtureDir = Path.join(__dirname, 'fixtures');

internals.createFixture = function (done) {

    Mkdirp.sync(Path.join(internals.fixtureDir, 'projects'));
    Fs.writeFileSync(Path.join(internals.fixtureDir, 'test.txt'), '', 'utf8');
    Fs.writeFileSync(Path.join(internals.fixtureDir, 'hook.js'), '#!/usr/bin/env node\nprocess.exit();', 'utf8');
    Fs.writeFileSync(Path.join(internals.fixtureDir, 'hook2.js'), '#!/usr/bin/env node\nprocess.exit(1);', 'utf8');
    Mkdirp.sync(Path.join(internals.fixtureDir, 'projects', 'project1', 'node_modules', 'nope'));
    Fs.writeFileSync(Path.join(internals.fixtureDir, 'projects', 'project1', 'package.json'), '', 'utf8');
    Mkdirp.sync(Path.join(internals.fixtureDir, 'projects', 'project2'));
    Fs.writeFileSync(Path.join(internals.fixtureDir, 'projects', 'project2', 'package.json'), '', 'utf8');
    Mkdirp.sync(Path.join(internals.fixtureDir, 'projects', 'deepproject', 'another', 'directory', 'goes', 'here'));
    Fs.writeFileSync(Path.join(internals.fixtureDir, 'projects', 'notaproject'), '', 'utf8');
    Mkdirp.sync(Path.join(internals.fixtureDir, '.git', 'hooks'));
    done();
};

internals.cleanupFixture = function (done) {

    Rimraf(Path.join(__dirname, 'fixtures'), done);
};


describe('isDir()', function () {

    it('returns true when given a directory', function (done) {

        expect(Validate.isDir(__dirname)).to.be.true();
        done();
    });

    it('returns false when given a file or non-existing directory', function (done) {

        expect(Validate.isDir(Path.join(__dirname, 'index.js'))).to.be.false();
        expect(Validate.isDir(Path.join(__dirname, 'not.here'))).to.be.false();
        done();
    });
});


describe('getEnv()', function () {

    it('returns a copy of the current environment with a modified path', function (done) {

        var env = Validate.getEnv(__dirname);
        for (var key in env) {
            if (key.toLowerCase() === 'path') {
                expect(env[key]).to.contain(Path.join(__dirname, 'node_modules', '.bin'));
                expect(env[key]).to.contain(process.env[key]);
            }
            else {
                expect(env[key]).to.equal(process.env[key]);
            }
        }

        done();
    });
});

describe('runCmd()', function () {

    before(function (done) {

        internals.createFixture(function () {

            var root = Path.join(internals.fixtureDir, 'projects', 'project1');
            var hook = Path.join('fixtures', 'hook.js');
            var hook2 = Path.join('fixtures', 'hook2.js');

            Validate.registerHook(root, hook);
            Validate.registerHook(root, hook2);
            done();
        });
    });

    it('can run a command that passes', function (done) {

        var path = Path.join(internals.fixtureDir, 'projects', 'project1');

        Validate.runCmd(path, 'hook.js', function (code) {

            expect(code).to.equal(0);
            done();
        });
    });

    it('can run a command that fails', function (done) {

        var path = Path.join(internals.fixtureDir, 'projects', 'project1');

        Validate.runCmd(path, 'hook2.js', function (code) {

            expect(code).to.equal(1);
            done();
        });
    });

    it('runs process.exit if no callback is given', function (done) {

        var path = Path.join(internals.fixtureDir, 'projects', 'project1');
        var processExit = process.exit;
        process.exit = function (code) {

            expect(code).to.equal(0);
            process.exit = processExit;
            done();
        };

        Validate.runCmd(path, 'hook.js');
    });

    after(internals.cleanupFixture);
});

describe('exit()', function () {
});

describe('registerHook()', function () {

    before(internals.createFixture);

    it('errors when the pre-commit.d directory cannot be created', function (done) {

        var path = Path.join(internals.fixtureDir, '.git', 'hooks', 'pre-commit.d');
        Fs.writeFileSync(path, 'error', 'utf8');

        var root = Path.join(internals.fixtureDir, 'projects', 'project1');
        var hook = Path.join('fixtures', 'hook.js');

        var err = Validate.registerHook(root, hook);
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('file already exists');

        Fs.unlinkSync(path);
        done();
    });

    it('can register a hook', function (done) {

        var root = Path.join(internals.fixtureDir, 'projects', 'project1');
        var hook = Path.join('fixtures', 'hook.js');
        var hash = Crypto.createHash('md5').update(Path.join('projects', 'project1')).digest('hex');

        expect(Validate.registerHook(root, hook)).to.be.undefined();
        expect(Fs.existsSync(Path.join(internals.fixtureDir, '.git', 'hooks', 'pre-commit.d'))).to.be.true();
        expect(Fs.existsSync(Path.join(internals.fixtureDir, '.git', 'hooks', 'pre-commit.d', hash))).to.be.true();
        expect(Fs.existsSync(Path.join(internals.fixtureDir, '.git', 'hooks', 'pre-commit.d', hash, 'hook.js'))).to.be.true();
        done();
    });

    it('can register a second hook', function (done) {

        var root = Path.join(internals.fixtureDir, 'projects', 'project1');
        var hook = Path.join('fixtures', 'hook2.js');
        var hash = Crypto.createHash('md5').update(Path.join('projects', 'project1')).digest('hex');

        expect(Validate.registerHook(root, hook)).to.be.undefined();
        expect(Fs.existsSync(Path.join(internals.fixtureDir, '.git', 'hooks', 'pre-commit.d'))).to.be.true();
        expect(Fs.existsSync(Path.join(internals.fixtureDir, '.git', 'hooks', 'pre-commit.d', hash))).to.be.true();
        expect(Fs.existsSync(Path.join(internals.fixtureDir, '.git', 'hooks', 'pre-commit.d', hash, 'hook.js'))).to.be.true();
        expect(Fs.existsSync(Path.join(internals.fixtureDir, '.git', 'hooks', 'pre-commit.d', hash, 'hook2.js'))).to.be.true();
        done();
    });

    it('errors when the given hook is above the parent module root', function (done) {

        var err = Validate.registerHook(Path.join('..', 'hooks', 'test-missing-hook.js'));
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('may not be above project root');
        done();
    });

    after(internals.cleanupFixture);
});

describe('addFile()', function () {

    before(internals.createFixture);

    it('can add a file to a project root', function (done) {

        var source = Path.join('fixtures', 'test.txt');
        var dest = Path.join('test', 'fixtures', 'projects', 'project1', 'test.txt');

        expect(Validate.addFile(source, dest)).to.be.undefined();
        expect(Fs.existsSync(Path.join(internals.fixtureDir, 'projects', 'project1', 'test.txt'))).to.be.true();
        done();
    });

    it('refuses to copy a file outside of the project root', function (done) {

        var source = Path.join('fixtures', 'test.txt');
        var dest = Path.join('..', '..', 'test.txt');

        var err = Validate.addFile(source, dest);
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('Destination must be within project root');
        done();
    });

    it('refuses to overwrite a file by default', function (done) {

        var source = Path.join('fixtures', 'test.txt');
        var dest = Path.join('test', 'fixtures', 'test.txt');

        var err = Validate.addFile(source, dest);
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('already exists');
        done();
    });

    it('overwrites files if overwrite = true', function (done) {

        var source = Path.join('fixtures', 'test.txt');
        var dest = Path.join('test', 'fixtures', 'test.txt');

        expect(Validate.addFile(source, dest, { overwrite: true })).to.be.undefined();
        done();
    });

    it('returns an error when trying to copy a file that does not exist', function (done) {

        var err = Validate.addFile('bacon.txt', 'meats.txt');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('no such file');
        done();
    });

    after(internals.cleanupFixture);
});

describe('findGitRoot()', function () {

    before(internals.createFixture);

    it('can find a git root', function (done) {

        expect(Validate.findGitRoot(internals.fixtureDir)).to.equal(internals.fixtureDir);
        done();
    });

    it('can find a git root from a child directory', function (done) {

        expect(Validate.findGitRoot(Path.join(internals.fixtureDir, 'projects'))).to.equal(internals.fixtureDir);
        done();
    });

    it('returns undefined when not within a git repo', function (done) {

        expect(Validate.findGitRoot(Os.tmpdir())).to.be.undefined();
        done();
    });

    after(internals.cleanupFixture);
});

describe('findProjectRoot()', function () {

    before(internals.createFixture);

    it('can find a project root', function (done) {

        expect(Validate.findProjectRoot(__dirname)).to.equal(Path.dirname(__dirname));
        done();
    });

    it('can find a project root from within a child module', function (done) {

        expect(Validate.findProjectRoot(Path.join(internals.fixtureDir, 'projects', 'project1', 'node_modules', 'nope'))).to.equal(Path.join(internals.fixtureDir, 'projects', 'project1'));
        done();
    });

    after(internals.cleanupFixture);
});

describe('findProjects()', function () {

    before(internals.createFixture);

    it('can find projects', function (done) {

        var projects = Validate.findProjects(internals.fixtureDir);
        expect(projects).to.be.an.array();
        expect(projects).to.have.length(2);
        expect(projects).to.contain(Path.join(internals.fixtureDir, 'projects', 'project1'));
        expect(projects).to.contain(Path.join(internals.fixtureDir, 'projects', 'project2'));
        done();
    });

    it('does not blow up when attempting to search a non-existing directory', function (done) {

        var projects = Validate.findProjects(Path.join(internals.fixtureDir, 'nothing_here'));
        expect(projects).to.be.an.array();
        expect(projects).to.have.length(0);
        done();
    });

    after(internals.cleanupFixture);
});
