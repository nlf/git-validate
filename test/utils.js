var Utils = require('../lib/utils');
var Fs = require('fs');
var Path = require('path');
var Mkdirp = require('mkdirp');
var Rimraf = require('rimraf');

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;

var internals = {};
internals.fixturePath = Path.join(__dirname, 'fixtures');

internals.mkdir = function (path) {

    var args = [internals.fixturePath];
    for (var i = 0, l = arguments.length; i < l; ++i) {
        args.push(arguments[i]);
    }

    Mkdirp.sync(Path.join.apply(null, args));
};

internals.createFile = function (path) {

    var args = [internals.fixturePath];
    for (var i = 0, l = arguments.length; i < l; ++i) {
        args.push(arguments[i]);
    }

    Fs.writeFileSync(Path.join.apply(null, args), '', 'utf8');
};

internals.createFixture = function (done) {

    internals.mkdir('project1', 'not_a_project');
    internals.createFile('project1', 'package.json');
    internals.mkdir('project2', '.git', 'hooks');
    internals.mkdir('project3', 'actual_project');
    internals.createFile('project3', 'actual_project', 'package.json');
    internals.mkdir('project4', 'this', 'is', 'too', 'deep', 'to', 'find');
    internals.createFile('project4', 'this', 'is', 'too', 'deep', 'to', 'find', 'package.json');
    done();
};

internals.cleanupFixture = function (done) {

    Rimraf(internals.fixturePath, done);
};

describe('isDir()', function () {

    it('returns true for a directory', function (done) {

        expect(Utils.isDir(__dirname)).to.be.true();
        done();
    });

    it('returns false for a file', function (done) {

        expect(Utils.isDir(__filename)).to.be.false();
        done();
    });

    it('returns false when the path does not exist', function (done) {

        expect(Utils.isDir('nothere')).to.be.false();
        done();
    });
});

describe('copy()', function () {

    beforeEach(internals.createFixture);

    it('can copy an entire directory', function (done) {

        Utils.copy(internals.fixturePath, Path.join(__dirname, 'fixtures2'));
        expect(Utils.isDir(Path.join(__dirname, 'fixtures2'))).to.be.true();
        expect(Utils.isDir(Path.join(__dirname, 'fixtures2', 'project1'))).to.be.true();
        expect(Fs.existsSync(Path.join(__dirname, 'fixtures2', 'project1', 'package.json'))).to.be.true();
        expect(Utils.isDir(Path.join(__dirname, 'fixtures2', 'project1', 'not_a_project'))).to.be.true();
        expect(Utils.isDir(Path.join(__dirname, 'fixtures2', 'project2'))).to.be.true();
        expect(Utils.isDir(Path.join(__dirname, 'fixtures2', 'project3', 'actual_project'))).to.be.true();
        expect(Fs.existsSync(Path.join(__dirname, 'fixtures2', 'project3', 'actual_project', 'package.json'))).to.be.true();
        expect(Utils.isDir(Path.join(__dirname, 'fixtures2', 'project4', 'this', 'is', 'too', 'deep', 'to', 'find'))).to.be.true();
        expect(Fs.existsSync(Path.join(__dirname, 'fixtures2', 'project4', 'this', 'is', 'too', 'deep', 'to', 'find', 'package.json'))).to.be.true();
        done();
    });

    it('throws when trying to overwrite a file by default', function (done) {

        Utils.copy(Path.join(internals.fixturePath, 'project1', 'package.json'), Path.join(__dirname, 'fixtures2', 'project1', 'package.json'));
        var err = Utils.copy(Path.join(internals.fixturePath, 'project1', 'package.json'), Path.join(__dirname, 'fixtures2', 'project1', 'package.json'));
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('already exists');
        done();
    });

    it('allows overwriting a file when setting overwrite to true', function (done) {

        Utils.copy(Path.join(internals.fixturePath, 'project1', 'package.json'), Path.join(__dirname, 'fixtures2', 'project1', 'package.json'));
        var err = Utils.copy(Path.join(internals.fixturePath, 'project1', 'package.json'), Path.join(__dirname, 'fixtures2', 'project1', 'package.json'), { overwrite: true });
        expect(err).to.be.undefined();
        done();
    });

    it('can copy a file without specifying a target', function (done) {

        Utils.copy(Path.join(internals.fixturePath, 'project1', 'package.json'));
        var err = Utils.copy(Path.join(internals.fixturePath, 'project1', 'package.json'), { overwrite: true });
        expect(err).to.be.undefined();
        done();
    });

    it('throws when trying to write outside of the project root', function (done) {

        expect(function () {

            Utils.copy(Path.join(internals.fixturePath, 'project1', 'package.json'), Path.join(__dirname, '..', '..'));
        }).to.throw(Error, /within project root/);
        done();
    });

    it('throws when trying to copy a directory over a file', function (done) {

        Utils.copy(Path.join(internals.fixturePath, 'project1', 'package.json'), Path.join(__dirname, 'fixtures2', 'project1', 'package.json'));
        expect(function () {

            Utils.copy(Path.join(internals.fixturePath, 'project1'), Path.join(__dirname, 'fixtures2', 'project1', 'package.json'));
        }).to.throw();
        done();
    });

    afterEach(function (done) {

        internals.cleanupFixture(function () {

            Rimraf(Path.join(__dirname, 'fixtures2'), done);
        });
    });
});

describe('findGitRoot()', function () {

    it('can find a git root', function (done) {

        var root = Path.resolve(__dirname, '..');
        expect(Utils.findGitRoot()).to.equal(root);
        done();
    });

    it('returns undefined when no git root exists', function (done) {

        expect(Utils.findGitRoot(Path.resolve(__dirname, '..', '..'))).to.be.undefined();
        done();
    });
});

describe('findProjectRoot()', function () {

    before(internals.createFixture);

    it('can find a project root', function (done) {

        var root = Path.resolve(__dirname, '..');
        expect(Utils.findProjectRoot()).to.equal(root);
        done();
    });

    it('can find a project root from a child directory', function (done) {

        var root = Path.join(internals.fixturePath, 'project1', 'not_a_project');
        expect(Utils.findProjectRoot(root)).to.equal(Path.join(internals.fixturePath, 'project1'));
        done();
    });

    it('can return an error when no project is found', function (done) {

        var root = Path.resolve(__dirname, '..', '..');
        expect(function () {

            Utils.findProjectRoot(root);
        }).to.throw('Unable to find a package.json for this project');
        done();
    });

    after(internals.cleanupFixture);
});

describe('findProjects()', function () {

    before(internals.createFixture);

    it('can find projects', function (done) {

        var projects = Utils.findProjects();
        expect(projects).to.be.an.array();
        expect(projects).to.have.length(3);
        expect(projects).to.contain(Path.dirname(__dirname));
        expect(projects).to.contain(Path.join(internals.fixturePath, 'project1'));
        expect(projects).to.contain(Path.join(internals.fixturePath, 'project3', 'actual_project'));
        done();
    });

    after(internals.cleanupFixture);
});

describe('installHooks()', function () {

    beforeEach(internals.createFixture);

    it('can install a single hook', function (done) {

        Utils.installHooks('pre-commit', Path.join(internals.fixturePath, 'project2'));
        expect(Fs.existsSync(Path.join(internals.fixturePath, 'project2', '.git', 'hooks', 'pre-commit'))).to.be.true();
        done();
    });

    it('can install multiple hooks', function (done) {

        Utils.installHooks(['pre-commit', 'post-commit'], Path.join(internals.fixturePath, 'project2'));
        expect(Fs.existsSync(Path.join(internals.fixturePath, 'project2', '.git', 'hooks', 'pre-commit'))).to.be.true();
        expect(Fs.existsSync(Path.join(internals.fixturePath, 'project2', '.git', 'hooks', 'post-commit'))).to.be.true();
        done();
    });

    it('backs up an existing hook when installing', function (done) {

        Utils.installHooks('pre-commit', Path.join(internals.fixturePath, 'project2'));
        expect(Fs.existsSync(Path.join(internals.fixturePath, 'project2', '.git', 'hooks', 'pre-commit'))).to.be.true();
        Utils.installHooks('pre-commit', Path.join(internals.fixturePath, 'project2'));
        expect(Fs.existsSync(Path.join(internals.fixturePath, 'project2', '.git', 'hooks', 'pre-commit'))).to.be.true();
        expect(Fs.existsSync(Path.join(internals.fixturePath, 'project2', '.git', 'hooks', 'pre-commit.backup'))).to.be.true();
        done();
    });

    afterEach(internals.cleanupFixture);
});
