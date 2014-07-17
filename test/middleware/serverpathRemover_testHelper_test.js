"use strict";

var expect = require("must");
var request = require("supertest");

describe("serverpathRemover used as a test bean", function () {
  it("should be available in res.locals when using testBeans, so handle500 works seamlessly", function (done) {
    var testConf = require('../../testutil/configureForTest');
    var testBeans = testConf.get("beans");
    expect(testBeans.get("serverpathRemover")).to.exist();

    var misc = testBeans.get('misc');
    var app = misc.expressAppIn(__dirname);
    var resLocals;
    app.get("/", function (req, res, next) {
      resLocals = res.locals;
      res.send(200);
    });

    var wrappedTestBeans = {
      get: function (name) {
        if (name === "testapp") {
          return app;
        }
        return testBeans.get(name);
      }
    };
    var createApp = require('../../testutil/testHelper')('testapp', wrappedTestBeans).createApp;
    request(createApp()).get("/").end(function () {
      console.dir(resLocals);
      expect(resLocals.removeServerpaths).to.exist();
      done();
    });
  });
});
