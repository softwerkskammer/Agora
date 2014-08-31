'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = require('../../testutil/configureForTestWithDB').get('beans');
var memberstore = beans.get('memberstore');
var persistence = beans.get('membersPersistence');
var Member = beans.get('member');

describe('Members application with DB', function () {

  var member = new Member({id: 'id', interests: 'a, bb, c d e,f g h ,ü+p'});

  beforeEach(function (done) { // if this fails, you need to start your mongo DB
    persistence.drop(function () {
      memberstore.saveMember(member, function (err) {
        done(err);
      });
    });
  });

  it('finds a member by simple interest', function (done) {
    memberstore.getMembersWithInterest('a', function (err, members) {
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be('id');
      done(err);
    });
  });

  it('finds a member by interest with umlaut and "+"', function (done) {
    memberstore.getMembersWithInterest('ü+p', function (err, members) {
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be('id');
      done(err);
    });
  });

  it('finds a member by interest with spaces (case 1)', function (done) {
    memberstore.getMembersWithInterest('c d e', function (err, members) {
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be('id');
      done(err);
    });
  });

  it('finds a member by interest with spaces (case 2)', function (done) {
    memberstore.getMembersWithInterest('f g h', function (err, members) {
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be('id');
      done(err);
    });
  });

  it('does not find a member by partial matches of an interest', function (done) {
    memberstore.getMembersWithInterest('b', function (err, members) {
      expect(members).to.have.length(0);
      done(err);
    });
  });

});

