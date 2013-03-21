"use strict";

var request = require('supertest'),
    express = require('express'),
    events = require('../lib/events');

describe('Events application', function () {
  it('is mapped to a custom path', function (done) {
    var app = express();
    app.use('/foo', events(express()));
    request(app)
      .get('/foo')
      .expect(200, function (err) {
        console.log(err);
        done();
      });
  });
});

