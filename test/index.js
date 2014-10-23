var Hook = require('../');
var Path = require('path');
var Fs = require('fs');

var Code = require('code');
var Lab = require('lab');

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;
var before = lab.before;
var after = lab.after;


describe('exports', function () {

    before(function (done) {

        if (!Fs.existsSync(Path.join(__dirname, '.git'))) {
            Fs.mkdirSync(Path.join(__dirname, '.git'));
            Fs.mkdirSync(Path.join(__dirname, '.git', 'hooks'));
        }

        done();
    });

    it('can find a git root', function (done) {

        var root = Hook.findGitRoot(__dirname);
        expect(root).to.be.a.string();
        expect(root).to.equal(__dirname);
        done();
    });

    it('can find a git root from higher up', function (done) {

        var root = Hook.findGitRoot(Path.join(__dirname, 'projects'));
        expect(root).to.be.a.string();
        expect(root).to.equal(__dirname);
        done();
    });

    it('returns undefined when not in a git repository', function (done) {

        var root = Hook.findGitRoot(Path.sep);
        expect(root).to.be.undefined();
        done();
    });

    it('can find a project root', function (done) {

        var root = Hook.findProjectRoot(__dirname);
        expect(root).to.be.a.string();
        expect(root).to.equal(Path.dirname(__dirname));
        done();
    });

    it('can find a project root from higher up', function (done) {

        var root = Hook.findProjectRoot(Path.join(__dirname, 'projects', 'project6', 'node_modules', 'nope'));
        expect(root).to.be.a.string();
        expect(root).to.equal(Path.join(__dirname, 'projects', 'project6'));
        done();
    });

    it('can find projects', function (done) {

        var projects = Hook.findProjects(Path.join(__dirname, 'projects'));
        expect(projects).to.be.an.array();
        expect(projects).to.have.length(5);
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project1'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project2'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project3', 'api'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project4', 'even', 'deeper', 'thing'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project6'));
        done();
    });

    it('does not blow up when attempting to search a non-existing directory', function (done) {

        var projects = Hook.findProjects(Path.join(__dirname, 'nothing_here'));
        expect(projects).to.be.an.array();
        expect(projects).to.have.length(0);
        done();
    });

    it('can add a file to a project root', function (done) {

        expect(Hook.addFile('./test/test.txt', 'test/projects/project1/test.txt')).to.be.undefined();
        expect(Fs.existsSync(Path.join(__dirname, 'projects', 'project1', 'test.txt'))).to.be.true();
        done();
    });

    it('refuses to copy a file above the project root', function (done) {

        var err = Hook.addFile('./test/test.txt', '../test.txt');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('Destination must be within project root');
        done();
    });

    it('refuses to overwrite a file by default', function (done) {

        var err = Hook.addFile('./test/test.txt', './test/test.txt');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('already exists');
        done();
    });

    it('will overwrite a file if overwrite = true', function (done) {

        expect(Hook.addFile('./test/test.txt', './test/test.txt', { overwrite: true })).to.be.undefined();
        done();
    });

    it('returns an error when trying to copy a file that does not exist', function (done) {

        var err = Hook.addFile('./bacon.txt', './meats.txt');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('no such file');
        done();
    });

    it('returns an error when the wrong number of parameters is given', function (done) {

        var err = Hook.addFile('./bacon.txt');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('Invalid arguments given');
        done();
    });

    it('can override the root directory when copying a file', function (done) {

        expect(Hook.addFile(Path.join(__dirname, 'projects', 'project1'), './package.json', './package.json2')).to.be.undefined();
        expect(Fs.existsSync(Path.join(__dirname, 'projects', 'project1', 'package.json2'))).to.be.true();
        expect(Hook.addFile(Path.join(__dirname, 'projects', 'project1'), './package.json', './package.json', { overwrite: true })).to.be.undefined();
        done();
    });

    it('errors when the pre-commit.d directory cannot be created', function (done) {

        Fs.writeFileSync(Path.join(__dirname, '.git', 'hooks', 'pre-commit.d'), 'error', 'utf8');
        var err = Hook.registerHook(Path.join(__dirname, 'projects', 'project6'), 'hooks/test-hook.js');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('file already exists');
        Fs.unlinkSync(Path.join(__dirname, '.git', 'hooks', 'pre-commit.d'));
        done();
    });

    it('can register a hook', function (done) {

        expect(Hook.registerHook(Path.join(__dirname, 'projects', 'project6'), 'hooks/test-hook.js')).to.be.undefined();
        var pkg = Fs.readFileSync(Path.join(__dirname, 'projects', 'project6', 'package.json'), 'utf8');
        expect(pkg).to.contain('test-hook');
        expect(pkg).to.not.contain('test-hook.js');
        done();
    });

    it('can register a second hook', function (done) {

        expect(Hook.registerHook(Path.join(__dirname, 'projects', 'project6'), 'hooks/test-second-hook.js')).to.be.undefined();
        var pkg = Fs.readFileSync(Path.join(__dirname, 'projects', 'project6', 'package.json'), 'utf8');
        expect(pkg).to.contain('test-hook');
        expect(pkg).to.contain('test-second-hook');
        expect(pkg).to.not.contain('test-hook.js');
        expect(pkg).to.not.contain('test-second-hook.js');
        done();
    });

    it('errors when the given hook does not exist', function (done) {

        var err = Hook.registerHook('hooks/test-missing-hook.js');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('no such file');
        done();
    });

    it('errors when the given hook is above the module root', function (done) {

        var err = Hook.registerHook('../hooks/test-missing-hook.js');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('may not be above project root');
        done();
    });

    after(function (done) {

        Fs.unlinkSync(Path.join(__dirname, '.git', 'hooks', 'pre-commit.d', 'test-second-hook.js'));
        Fs.unlinkSync(Path.join(__dirname, '.git', 'hooks', 'pre-commit.d', 'test-hook.js'));
        Fs.rmdirSync(Path.join(__dirname, '.git', 'hooks', 'pre-commit.d'));
        Fs.rmdirSync(Path.join(__dirname, '.git', 'hooks'));
        Fs.rmdirSync(Path.join(__dirname, '.git'));
        Fs.unlinkSync(Path.join(__dirname, 'projects', 'project1', 'test.txt'));
        Fs.unlinkSync(Path.join(__dirname, 'projects', 'project1', 'package.json2'));
        Fs.writeFileSync(Path.join(__dirname, 'projects', 'project6', 'package.json'), '{}', 'utf8');
        done();
    });
});
