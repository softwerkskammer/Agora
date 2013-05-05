"use strict";

var request = require('supertest');
var express = require('express');
var conf = require('../configureForTest');

var app = conf.get('beans').get('groupsApp')(express());

describe('Groups application security', function () {

  it('does not allow to access the /new url for normal visitors', function (done) {
    request(app)
      .get('/new')
      .expect(302, done);
  });

  it('does not allow to access the /edit url for normal visitors', function (done) {
    request(app)
      .get('/edit/GroupA')
      .expect(302, done);
  });

  it('does not allow to access the /submit url for normal visitors', function (done) {
    request(app)
      .post('/submit')
      .expect(302, done);
  });

});
