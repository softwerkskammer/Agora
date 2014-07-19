"use strict";

var request = require('supertest');
var expect = require("must");

var beans = require('../../testutil/configureForTest').get('beans');

function wrapBeans(beans, nameOfBean, actualBean) {
  return {
    get: function get(name) {
      if (name === nameOfBean) {
        return actualBean;
      }
      return beans.get(name);
    }
  };
}

describe("a 500 error thrown in a supertest", function () {
  it("should call the error handler if supplied", function (done) {
    var testApp = beans.get("misc").expressAppIn(__dirname);
    testApp.use(function (req, res, next) {
      throw new Error("Error Message");
    });

    var doneCalled = false;
    var createApp = require('../../testutil/testHelper')('testApp', wrapBeans(beans, "testApp", testApp), function (err) {
      done();
      doneCalled = true;
    }).createApp;
    request(createApp()).get("/").end(function (err) {
      if (!doneCalled) {
        done(new Error("Done not called before"));
      }
    });
  });
});
