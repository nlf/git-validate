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

describe('addFile()', function () {

    before(internals.createFixture);

    it('can add a file to a project root', function (done) {

        var source = Path.join('fixtures', 'test.txt');
        var dest = Path.join('test', 'fixtures', 'projects', 'project1', 'test.txt');

        Validate.addFile(source, dest);
        expect(Fs.existsSync(Path.join(internals.fixtureDir, 'projects', 'project1', 'test.txt'))).to.be.true();
        done();
    });

    it('refuses to copy a file outside of the project root', function (done) {

        var source = Path.join('fixtures', 'test.txt');
        var dest = Path.join('..', '..', 'test.txt');

        expect(function () {

            Validate.addFile(source, dest);
        }).to.throw(Error, /Destination must be within project root/);
        done();
    });

    it('refuses to overwrite a file by default', function (done) {

        var source = Path.join('fixtures', 'test.txt');
        var dest = Path.join('test', 'fixtures', 'test.txt');

        expect(function () {

            Validate.addFile(source, dest);
        }).to.throw(Error, /already exists/);
        done();
    });

    it('overwrites files if overwrite = true', function (done) {

        var source = Path.join('fixtures', 'test.txt');
        var dest = Path.join('test', 'fixtures', 'test.txt');

        Validate.addFile(source, dest, { overwrite: true });
        done();
    });

    it('returns an error when trying to copy a file that does not exist', function (done) {

        expect(function () {

            Validate.addFile('bacon.txt', 'meats.txt');
        }).to.throw(Error, /no such file/);
        done();
    });

    after(internals.cleanupFixture);
});
