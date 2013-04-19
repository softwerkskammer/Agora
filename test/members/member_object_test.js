/*global describe, it */
"use strict";
var should = require('chai').should();

var Member = require('../../lib/members/member');

describe('Member', function () {
  it('is instantiated empty when no arguments', function (done) {
    var member = new Member();
    for (var name in member) {
      var property = member[name];
      if (typeof(property) !== 'function') {
        if (name !== 'isAdmin') {
          should.not.exist(property, name);
        }
      }
    }
    done();
  });

  it('is populated by Google OpenID record', function (done) {
    var userdata = JSON.parse('{' +
      '"identifier": "https://www.google.com/accounts/o8/id?id=someGoogelID", "profile": {' +
      '"displayName": "Hans Dampf", "emails" : [{"value": "hada@web.de"}],' +
      '"name": {"familyName": "Dampf","givenName": "Hans"}}}');

    var member = new Member({sessionUser: userdata});
    member.firstname.should.equal("Hans", 'firstname');
    member.lastname.should.equal("Dampf", 'lastname');
    member.email.should.equal("hada@web.de", 'email');
    done();
  });

  it('is populated by GitHub record', function (done) {
    var userdata = JSON.parse('{' +
      '"identifier": "github:123456", "profile": {' +
      ' "provider" : "github", "id" : 123456, "displayName": "Hans Dampf", "username" :"hada", ' +
      '"profileUrl" : "https://github.com/hansdampf", ' + '"emails" : [ { "value": null } ], ' +
      '"_json" : { "html_url" :"https://github.com/hansdampf", "blog" : "http://hada.wordpress.com" }}}');

    var member = new Member({sessionUser: userdata});
    should.not.exist(member.firstname, 'firstname');
    should.not.exist(member.lastname, 'lastname');
    member.site.should.equal("https://github.com/hansdampf, http://hada.wordpress.com", 'site');

    done();
  });

  it('is populated with empty fields where no information is given', function (done) {
    var req_body = {
      id: 'testuser',
      nickname: 'testuser',
      email: 'mail@google.de',
      firstname: 'Test',
      lastname: 'User'
    };
    var member = new Member({object: req_body});
    should.not.exist(member.twitter, 'twitter');
    should.not.exist(member.location, 'location');
    should.not.exist(member.profession, 'profession');
    should.not.exist(member.interests, 'interest');
    should.not.exist(member.site, 'site');
    should.not.exist(member.reference, 'reference');
    done();
  });

  it('is autocorrecting the twittername removing leading @', function (done) {
    var req_body = {
      id: 'testuser',
      nickname: 'testuser',
      twitter: '@twitter'
    };
    var member = new Member({object: req_body});
    member.twitter.should.equal('twitter');
    done();
  });

  it('is not autocorrecting the twittername when already no leading @', function (done) {
    var req_body = {
      id: 'testuser',
      nickname: 'testuser',
      twitter: 'twitter'
    };
    var member = new Member({object: req_body});
    member.twitter.should.equal('twitter');
    done();
  });

  it('has a boolean value for "isAdmin"', function (done) {
    var member = new Member();
    member.isAdmin.should.be.false;
    done();
  });

  it('always has a boolean value vor "isAdmin"', function (done) {
    var req_body = {};
    var member = new Member({object: req_body});
    member.isAdmin.should.be.false;
    done();
  });

  it('is correctly filled from small database record', function (done) {
    var db_record = {id: 'ID', nickname: 'NICK'};
    var member = new Member({object: db_record});
    member.id.should.equal(db_record.id);
    member.nickname.should.equal(db_record.nickname);
    member.isAdmin.should.be.false;
    done();
  });

  it('is correctly filled as Admin from small database record', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: true};
    var member = new Member({object: db_record});
    member.isAdmin.should.be.true;
    done();
  });

  it('is correctly filled as Admin from small database record even when boolean is transmitted as String', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: 'true'};
    var member = new Member({object: db_record});
    member.isAdmin.should.be.true;
    done();
  });

  it('is correctly filled as Admin from UI as String', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: false};
    var member = new Member({object: db_record});
    member.isAdmin.should.be.false;
    member.setAdminFromInteger("1");
    member.isAdmin.should.be.true;
    done();
  });

  it('is correctly filled as not Admin from UI as String', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: true};
    var member = new Member({object: db_record});
    member.isAdmin.should.be.true;
    member.setAdminFromInteger("0");
    member.isAdmin.should.be.false;
    done();
  });

  it('is correctly filled as Admin from UI as Integer', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: false};
    var member = new Member({object: db_record});
    member.isAdmin.should.be.false;
    member.setAdminFromInteger(1);
    member.isAdmin.should.be.true;
    done();
  });

  it('is correctly filled as not Admin from UI as Integer', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: true};
    var member = new Member({object: db_record});
    member.isAdmin.should.be.true;
    member.setAdminFromInteger(0);
    member.isAdmin.should.be.false;
    done();
  });

});
