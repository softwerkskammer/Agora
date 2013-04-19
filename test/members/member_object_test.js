/*global describe, it */
"use strict";
var expect = require('chai').expect;

var Member = require('../../lib/members/member');

describe('Member', function () {

  it('is populated by Google OpenID record', function (done) {
    var userdata = JSON.parse('{' +
      '"identifier": "https://www.google.com/accounts/o8/id?id=someGoogelID", "profile": {' +
      '"displayName": "Hans Dampf", "emails" : [{"value": "hada@web.de"}],' +
      '"name": {"familyName": "Dampf","givenName": "Hans"}}}');

    var member = new Member({sessionUser: userdata});
    expect(member.firstname, 'firstname').to.equal('Hans');
    expect(member.lastname, 'lastname').to.equal('Dampf');
    expect(member.email, 'email').to.equal('hada@web.de');
    done();
  });

  it('is populated by GitHub record', function (done) {
    var userdata = JSON.parse('{' +
      '"identifier": "github:123456", "profile": {' +
      ' "provider" : "github", "id" : 123456, "displayName": "Hans Dampf", "username" :"hada", ' +
      '"profileUrl" : "https://github.com/hansdampf", ' + '"emails" : [ { "value": null } ], ' +
      '"_json" : { "html_url" :"https://github.com/hansdampf", "blog" : "http://hada.wordpress.com" }}}');

    var member = new Member({sessionUser: userdata});
    expect(member.firstname, 'firstname').to.not.exist;
    expect(member.lastname, 'lastname').to.not.exist;
    expect(member.site, 'site').to.equal('https://github.com/hansdampf, http://hada.wordpress.com');

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
    expect(member.twitter, 'twitter').to.not.exist;
    expect(member.location, 'location').to.not.exist;
    expect(member.profession, 'profession').to.not.exist;
    expect(member.interests, 'interest').to.not.exist;
    expect(member.site, 'site').to.not.exist;
    expect(member.reference, 'reference').to.not.exist;
    done();
  });

  it('is autocorrecting the twittername removing leading @', function (done) {
    var req_body = {
      id: 'testuser',
      nickname: 'testuser',
      twitter: '@twitter'
    };
    var member = new Member({object: req_body});
    expect(member.twitter, 'twitter').to.equal('twitter');
    done();
  });

  it('is not autocorrecting the twittername when already no leading @', function (done) {
    var req_body = {
      id: 'testuser',
      nickname: 'testuser',
      twitter: 'twitter'
    };
    var member = new Member({object: req_body});
    expect(member.twitter, 'twitter').to.equal('twitter');
    done();
  });

  it('has a boolean value for "isAdmin"', function (done) {
    var member = new Member();
    expect(member.isAdmin).to.be.false;
    done();
  });

  it('always has a boolean value vor "isAdmin"', function (done) {
    var req_body = {};
    var member = new Member({object: req_body});
    expect(member.isAdmin).to.be.false;
    done();
  });

  it('is correctly filled from small database record', function (done) {
    var db_record = {id: 'ID', nickname: 'NICK'};
    var member = new Member({object: db_record});
    expect(member.id, 'id').to.equal(db_record.id);
    expect(member.nickname, 'nickname').to.equal(db_record.nickname);
    expect(member.isAdmin).to.be.false;
    done();
  });

  it('is correctly filled as Admin from small database record', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: true};
    var member = new Member({object: db_record});
    expect(member.isAdmin).to.be.true;
    done();
  });

  it('is correctly filled as Admin from small database record even when boolean is transmitted as String', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: 'true'};
    var member = new Member({object: db_record});
    expect(member.isAdmin).to.be.true;
    done();
  });

  it('is correctly filled as Admin from UI as String', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: false};
    var member = new Member({object: db_record});
    expect(member.isAdmin).to.be.false;
    member.setAdminFromInteger("1");
    expect(member.isAdmin).to.be.true;
    done();
  });

  it('is correctly filled as not Admin from UI as String', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: true};
    var member = new Member({object: db_record});
    expect(member.isAdmin).to.be.true;
    member.setAdminFromInteger("0");
    expect(member.isAdmin).to.be.false;
    done();
  });

  it('is correctly filled as Admin from UI as Integer', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: false};
    var member = new Member({object: db_record});
    expect(member.isAdmin).to.be.false;
    member.setAdminFromInteger(1);
    expect(member.isAdmin).to.be.true;
    done();
  });

  it('is correctly filled as not Admin from UI as Integer', function (done) {
    var db_record = {nickname: 'Nick', isAdmin: true};
    var member = new Member({object: db_record});
    expect(member.isAdmin).to.be.true;
    member.setAdminFromInteger(0);
    expect(member.isAdmin).to.be.false;
    done();
  });

});
