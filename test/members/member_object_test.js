"use strict";

var conf = require('nconf');
var expect = require('chai').expect;
require('../configureForTest');

var Member = conf.get('beans').get('member');

describe('Member initial filling', function () {

  it('is correctly filled from small database record', function () {
    var db_record = {id: 'ID', nickname: 'NICK'};
    var member = new Member(db_record);
    expect(member.id(), 'id').to.equal(db_record.id);
    expect(member.nickname(), 'nickname').to.equal(db_record.nickname);
  });
  
  it('is populated by Google OpenID record', function () {
    var userdata = JSON.parse('{' +
      '"authenticationId": "https://www.google.com/accounts/o8/id?id=someGoogelID", "profile": {' +
      '"displayName": "Hans Dampf", "emails" : [{"value": "hada@web.de"}],' +
      '"name": {"familyName": "Dampf","givenName": "Hans"}}}');

    var member = new Member().initFromSessionUser(userdata);
    expect(member.firstname(), 'firstname').to.equal('Hans');
    expect(member.lastname(), 'lastname').to.equal('Dampf');
    expect(member.email(), 'email').to.equal('hada@web.de');
  });

  it('is populated by GitHub record', function () {
    var userdata = JSON.parse('{' +
      '"authenticationId": "github:123456", "profile": {' +
      ' "provider" : "github", "id" : 123456, "displayName": "Hans Dampf", "username" :"hada", ' +
      '"profileUrl" : "https://github.com/hansdampf", ' + '"emails" : [ { "value": null } ], ' +
      '"_json" : { "html_url" :"https://github.com/hansdampf", "blog" : "http://hada.wordpress.com" }}}');

    var member = new Member().initFromSessionUser(userdata);
    expect(member.firstname(), 'firstname').to.not.exist;
    expect(member.lastname(), 'lastname').to.not.exist;
    expect(member.site(), 'site').to.equal('https://github.com/hansdampf, http://hada.wordpress.com');
  });

  it('is populated by GitHub record with only github url', function () {
    var userdata = JSON.parse('{' +
      '"authenticationId": "github:123456", "profile": {' +
      ' "provider" : "github", "id" : 123456, "displayName": "Hans Dampf", "username" :"hada", ' +
      '"profileUrl" : "https://github.com/hansdampf", ' + '"emails" : [ { "value": null } ], ' +
      '"_json" : { "html_url" :"https://github.com/hansdampf", "blog" : "undefined" }}}');

    var member = new Member().initFromSessionUser(userdata);
    expect(member.firstname(), 'firstname').to.not.exist;
    expect(member.lastname(), 'lastname').to.not.exist;
    expect(member.site(), 'site').to.equal('https://github.com/hansdampf');
  });

  it('is populated with empty fields where no information is given', function () {
    var record = {
      id: 'testuser',
      nickname: 'testuser',
      email: 'mail@google.de',
      firstname: 'Test',
      lastname: 'User'
    };
    var member = new Member(record);
    expect(member.twitter(), 'twitter').to.not.exist;
    expect(member.location(), 'location').to.not.exist;
    expect(member.profession(), 'profession').to.not.exist;
    expect(member.interests(), 'interest').to.not.exist;
    expect(member.site(), 'site').to.not.exist;
    expect(member.reference(), 'reference').to.not.exist;
  });

  it('shows the full name as display-name', function () {
    var db_record = {nickname: 'Nick', firstname: 'Hans', lastname: 'Dampf'};
    var member = new Member(db_record);
    expect(member.displayName()).to.equal('Hans Dampf');
  });

  it('constructs avatar from mail address using gravatar URL', function () {
    var email = 'member@mail.com';
    var db_record = {nickname: 'Nick', email: email};
    var member = new Member(db_record);
    expect(member.avatarUrl(10)).to.contain('http://www.gravatar.com/avatar/');
    expect(member.avatarUrl(10)).to.contain('?d=blank&s=10');
  });

  it('uses size 32 if no size is given', function () {
    var email = 'member@mail.com';
    var db_record = {nickname: 'Nick', email: email};
    var member = new Member(db_record);
    expect(member.avatarUrl()).to.contain('?d=blank&s=32');
  });
});

describe('Member twitter field autocorrection', function () {
  it('is autocorrecting the twittername removing leading @', function () {
    var member = new Member();
    member.fillFromUI({twitter: '@twitter'});
    expect(member.twitter(), 'twitter').to.equal('twitter');
  });

  it('is not autocorrecting the twittername when already no leading @', function () {
    var member = new Member();
    member.fillFromUI({twitter: 'twitter'});
    expect(member.twitter(), 'twitter').to.equal('twitter');
  });

  it('is adding http:// when not provided', function () {
    var member = new Member();
    member.fillFromUI({site: 'twitter'});
    expect(member.site(), 'site').to.equal('http://twitter');
  });

  it('is not adding http:// when already provided', function () {
    var member = new Member();
    member.fillFromUI({site: 'http://twitter'});
    expect(member.site(), 'site').to.equal('http://twitter');
  });

  it('is not adding http:// when already https:// provided', function () {
    var member = new Member();
    member.fillFromUI({site: 'https://twitter'});
    expect(member.site(), 'site').to.equal('https://twitter');
  });

});

describe('display functionalities', function () {
  it('produces a valid git author', function () {
    var db_record = {nickname: 'Nick'};
    var member = new Member(db_record);
    expect(member.asGitAuthor()).to.equal('Nick <Nick@softwerkskammer.org>');
  });
});
