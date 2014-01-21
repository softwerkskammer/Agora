"use strict";
var child_process = require("child_process");
var should = require('chai').should();
var request = require('request');

var nconf = require('./configureForTest');

var port = 17126;
var base_uri = "http://localhost:" + port;

describe('Server started in different process', function () {
  this.timeout(20000);

  var child;

  var waitForServerRunning = function (child, callback) {
    var stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", function (chunk) {
      stdout += chunk;

      // the Server running output highly depends on the log output, it should just be in there, somewhere
      if (stdout.trim().indexOf('Server running') > -1) {
        /* prevent callback being called multiple times */
        stdout = "";
        callback();
      }
    });
  };

  var serverShouldDeliverStartPage = function (done) {
    request({uri: base_uri}, function (req, resp) {
      should.exist(resp);
      // status code of 500 may indicate that some nconf-property is not configured (example was superuser, is now fixed)
      resp.statusCode.should.equal(200);
      resp.body.should.contain('Softwerkskammer');
      done(); // without error check
    });
  };

  beforeEach(function () {
    nconf.set('port', port);
  });

  afterEach(function (done) {
    nconf.set('port', 17125);
    child.on("exit", function () {  // this callback does not receive an error value
      done(); // without error check
    });
    child.kill();
  });

  it('delivers the home page when start.js is called from its own directory', function (done) {
    child = child_process.spawn("node", ["start.js", "--port", port], { cwd: __dirname + "/../", stdio: "pipe" });
    waitForServerRunning(child, function () {
      serverShouldDeliverStartPage(done);
    });
  });

  it('delivers the home page when start.js is called from another directory', function (done) {
    child = child_process.spawn("node", ["../start.js", "--port", port], { cwd: __dirname, stdio: "pipe" });
    waitForServerRunning(child, function () {
      serverShouldDeliverStartPage(done);
    });
  });
});
