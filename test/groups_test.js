/*global describe, it */
"use strict";
var request = require('supertest'),
  express = require('express'),
  MongoConf = require('./mongoConf'),
  conf = new MongoConf();

conf.set('port', '17124');

var groups = require('../lib/groups');
var app = groups(express(), conf);

app.locals({
  baseUrl: 'groups'
});

describe('Groups application', function () {

  it('shows all available lists', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(/Alle Gruppen/, done);
  });
});