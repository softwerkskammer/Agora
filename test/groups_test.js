/*global describe, it */
"use strict";
var request = require('supertest');
var express = require('express');

var groups = require('../lib/groups');
var app = groups(express());

app.locals({
  baseUrl: 'groups'
});

describe('Groups application', function () {

  it('shows available groups actions', function (done) {
    var body = '<!DOCTYPE html><html><head><title>Groups</title><link rel="stylesheet" href="/stylesheets/style.css"></head><body><h1>Groups</h1><ul><li><a href="/groups/lists">Die angelegten Listen</a></li><li><a href="/groups/users">Die User der Liste neueplattform</a></li><li><a href="/groups/subscribed">Die Listen, in denen Nicole subscribed ist</a></li></ul></body></html>';
    request(app)
      .get('/')
      .expect(200)
      .expect(body, done);
  });
});