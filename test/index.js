var Hook = require('../');
var Path = require('path');

var Lab = require('lab');

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;


describe('exports', function () {

    it('can find a git root', function (done) {

        var root = Hook.findGitRoot(__dirname);
        expect(root).to.be.a('string');
        expect(root).to.equal(__dirname);
        done();
    });

    it('can find a git root from higher up', function (done) {

        var root = Hook.findGitRoot(Path.join(__dirname, 'projects'));
        expect(root).to.be.a('string');
        expect(root).to.equal(__dirname);
        done();
    });

    it('can find a project root', function (done) {

        var root = Hook.findProjectRoot(__dirname);
        expect(root).to.be.a('string');
        expect(root).to.equal(__dirname);
        done();
    });

    it('can find a project root from higher up', function (done) {

        var root = Hook.findProjectRoot(Path.join(__dirname, 'projects', 'project6', 'node_modules', 'nope'));
        expect(root).to.be.a('string');
        expect(root).to.equal(Path.join(__dirname, 'projects', 'project6'));
        done();
    });

    it('can find projects', function (done) {

        var projects = Hook.findProjects(Path.join(__dirname, 'projects'));
        expect(projects).to.be.an('array');
        expect(projects).to.have.length(4);
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project1'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project2'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project3', 'api'));
        expect(projects).to.contain(Path.join(__dirname, 'projects', 'project4', 'even', 'deeper', 'thing'));
        done();
    });
});
