/*global describe, it */
"use strict";
var request = require('supertest'),
  proxyquire = require('proxyquire'),
  sinon = require('sinon');

var Member = require('../lib/members/member');
var storeStub = {};

var app = proxyquire('../lib/members', {'./store': storeStub});
app.locals({
  members_route: 'members'
});

var persistenceStub = {
  save: function () {},
  getById: function () {},
  list: function () {}
};

var store = proxyquire('../lib/members/store.js', {'../persistence/persistence': function () { return persistenceStub; }});

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

describe('Members store', function () {
  var sampleMember = {};
  var sampleList = [sampleMember];

  it('calls persistence.getById for store.getMember and passes on the given callback', function (done)  {
    var getById = sinon.stub(persistenceStub, 'getById');
    getById.callsArgWith(1, sampleMember);

    store.getMember('nick', function (member) {
      member.should.equal(sampleMember);
      getById.calledWith('nick').should.be.true;
      done();
    });
  });

  it('calls persistence.list for store.allMembers and passes on the given callback', function (done)  {
    var list = sinon.stub(persistenceStub, 'list');
    list.callsArgWith(0, sampleList);

    store.allMembers(function (members) {
      members.should.equal(sampleList);
      done();
    });
  });

  it('calls persistence.save for store.saveMember and passes on the given callback', function (done)  {
    var save = sinon.stub(persistenceStub, 'save');
    save.callsArg(1);

    store.saveMember(sampleMember, function () {
      save.calledWith(sampleMember).should.be.true;
      done();
    });
  });

});
