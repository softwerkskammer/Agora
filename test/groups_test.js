/*global describe, it */
"use strict";
var request = require('supertest'),
    proxyquire =  require('proxyquire'),
    express = require('express');

var sympaClientStub = {};
var sympaClientStubFactory = function () {
  return sympaClientStub;
};

var groups = proxyquire('../lib/groups', {'./sympa': sympaClientStubFactory});
var app = groups(express());

app.locals({
  baseUrl: 'groups'
});

describe('Groups application', function () {

  it('shows the list of groups as retrieved by the SOAP call', function (done) {
    var groupsresult = [{id: 'groupid1', name: 'Group 1'}];
    sympaClientStub.getGroups = function (callback) {
      callback(null, groupsresult);
    };
    request(app)
      .get('/')
      .expect(200)
      .expect(/href="groups\/groupid1"/)
      .expect(/Group 1/, done);
  });
});

