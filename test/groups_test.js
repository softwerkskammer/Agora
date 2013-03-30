/*global describe, it */
"use strict";
var request = require('supertest');
var express = require('express');

var values = [];

var conf = {
  get: function (key) {
    return values[key];
  },
  defaults: function (obj) {
    return obj;
  }
};

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
      .expect(/Lists/, done);
  });
});