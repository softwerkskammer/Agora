/*global describe, it */
"use strict";
var request = require('supertest'),
  express = require('express'),
  proxyquire = require('proxyquire');

var Member = require('../lib/members/member');

var dummymember = new Member('hada', 'Hans', 'Dampf', 'hans.dampf@gmail.com', '@hada', 'Süden', 'Entwickler', 'ada', 'http://my.blog', 'beim Bier');

var storeStub = {
  allMembers: function (callback) { callback(null, [dummymember]); },
  getMember: function (nickname, callback) { callback(null, dummymember); }
};

var internalAPIStub = {
  getSubscribedListsForUser: function (email, callback) { callback(null, []); }
};

var memberApp = proxyquire('../lib/members', {
  './memberstore': function () { return storeStub; },
  '../groups/internalAPI': function () { return internalAPIStub; }
});
var app = memberApp(express());

describe('Members application', function () {

  it('shows the list of members as retrieved by persistence call', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(/href="\/hada"/)
      .expect(/hans.dampf@gmail.com/, done);
  });

  it('renders the link for single parent dir', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo')
      .expect(/href="foo\/hada"/, done);
  });

  it.skip('renders the link for two parent dirs', function (done) {
    var root = express();
    root.use('/foo/bar', app);
    request(root)
      .get('/foo/bar')
      .expect(/href="bar\/hada"/, done);
  });

  it.skip('renders the link for a get request with parameters', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo?param=value')
      .expect(/href="foo\/hada"/, done);
  });

  it('shows the details of one members as retrieved by persistence call', function (done) {
    request(app)
      .get('/hada')
      .expect(200)
      .expect(/Blog: http:\/\/my.blog/)
      .expect(/Wie ich von der Softwerkskammer erfahren habe: beim Bier/, done);
  });
});
