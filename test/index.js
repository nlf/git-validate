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
        expect(root).to.equal(__dirname);
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
        expect(projects).to.have.length(4);
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project1'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project2'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project3', 'api'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project4', 'even', 'deeper', 'thing'));
        done();
    });

    it('does not blow up when attempting to search a non-existing directory', function (done) {

        var projects = Hook.findProjects(Path.join(__dirname, 'nothing_here'));
        expect(projects).to.be.an.array();
        expect(projects).to.have.length(0);
        done();
    });

    it('can add a file to a project root', function (done) {

        var err = Hook.addFile('./test.txt', 'projects/project1/test.txt');
        expect(err).to.be.undefined();
        done();
    });

    it('refuses to copy a file above the project root', function (done) {

        var err = Hook.addFile('./test.txt', '../test.txt');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('Destination must be within project root');
        done();
    });

    it('refuses to overwrite a file by default', function (done) {

        var err = Hook.addFile('./test.txt', './test.txt');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('already exists');
        done();
    });

    it('will overwrite a file if overwrite = true', function (done) {

        var err = Hook.addFile('./test.txt', './test.txt', { overwrite: true });
        expect(err).to.be.undefined();
        done();
    });

    it('returns an error when trying to copy a file that does not exist', function (done) {

        var err = Hook.addFile('./bacon.txt', './meats.txt');
        expect(err).to.not.be.undefined();
        expect(err.message).to.contain('no such file');
        done();
    });

    after(function (done) {

        Fs.rmdirSync(Path.join(__dirname, '.git'));
        Fs.unlinkSync(Path.join(__dirname, 'projects', 'project1', 'test.txt'));
        done();
    });
});
