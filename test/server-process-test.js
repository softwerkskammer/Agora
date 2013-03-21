"use strict";
var child_process = require("child_process");
var should = require('chai').should();
var request = require('request');

var port = 17126;

var base_uri = "http://localhost:" + port;

describe('Server started in different process', function () {
  var child;

  var waitForServerRunning = function (child, callback) {
    var stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", function (chunk) {
      stdout += chunk;
      if (stdout.trim().indexOf('Server running') === 0) {
        /* prevent callback being called multiple times */
        stdout = "";
        callback();
      }
    });
  };

  afterEach(function (done) {
    child.on("exit", function () {
      done();
    });
    child.kill();
  });

  it('delivers the home page when start.js is called from its own directory', function (done) {
    child = child_process.spawn("node", ["start.js", port], { cwd: __dirname + "/../", stdio: "pipe" });
    waitForServerRunning(child, function () {
      request({uri: base_uri}, function (req, resp) {
        should.exist(resp);
        resp.statusCode.should.equal(200);
        resp.body.should.contain('Softwerkskammer');
        done();
      });
    });
  });

});

