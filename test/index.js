var Hook = require('../');
var Path = require('path');

var Lab = require('lab');

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;

describe('exports', function () {

    it('can find a git root', function (done) {

        Hook.findGitRoot(function (err, root) {

            expect(err).to.not.exist;
            expect(root).to.be.a('string');
            done();
        });
    });

    it('can find a project root', function (done) {

        Hook.findProjectRoot(function (err, root) {

            expect(err).to.not.exist;
            expect(root).to.be.a('string');
            done();
        });
    });

    it('can find projects', function (done) {

        var projects = Hook.findProjects(Path.join(__dirname, 'projects'));

        expect(projects).to.be.an('array');
        expect(projects).to.have.length(4);
        done();
    });
});
