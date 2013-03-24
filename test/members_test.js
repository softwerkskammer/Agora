/* global describe, it */
"use strict";
var request = require('supertest');
var proxyquire = require('proxyquire');
var Member = require('../lib/members/member');
var storeStub = {};

var app = proxyquire('../lib/members', {'./store': storeStub});
app.locals({
  members_route: 'members'
});

describe('Members application', function () {
  var dummymember = new Member('hada', 'Hans', 'Dampf', 'hans.dampf@gmail.com', '@hada', 'Süden', 'Entwickler', 'ada', 'http://my.blog', 'beim Bier');

  it('shows the list of members as retrieved by persistence call', function (done) {
    storeStub.allMembers = function (callback) {
      callback([dummymember]);
    };
    request(app)
      .get('/')
      .expect(200)
      .expect(/href="hada"/)
      .expect(/hans.dampf@gmail.com/, done);
  });

  it('shows the details of one members as retrieved by persistence call', function (done) {
    storeStub.getById = function (callback) {
      callback(dummymember);
    };
    request(app)
      .get('/hada')
      .expect(200)
      .expect(/Blog: http:\/\/my.blog/)
      .expect(/Wie ich von der Softwerkskammer erfahren habe: beim Bier/, done);
  });
});

