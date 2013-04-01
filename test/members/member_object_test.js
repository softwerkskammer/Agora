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
        should.not.exist(property);
      }
    }
    done();
  });

  it('is populated by Google OpenID record', function (done) {
    var member = new Member();
    var userdata = JSON.parse('{' +
      '"identifier": "https://www.google.com/accounts/o8/id?id=someGoogelID", "profile": {' +
      '"displayName": "Hans Dampf", "emails" : [{"value": "hada@web.de"}],' +
      '"name": {"familyName": "Dampf","givenName": "Hans"}}}');

    member.updateWith(null, userdata);
    member.firstname.should.equal("Hans");
    member.lastname.should.equal("Dampf");
    member.email.should.equal("hada@web.de");
    done();
  });

  it('is populated by GitHub record', function (done) {
    var member = new Member();
    var userdata = JSON.parse('{' +
      '"identifier": "github:123456", "profile": {' +
      ' "provider" : "github", "id" : 123456, "displayName": "Hans Dampf", "username" :"hada", ' +
      '"profileUrl" : "https://github.com/hansdampf", ' + '"emails" : [ { "value": null } ], ' +
      '"_json" : { "html_url" :"https://github.com/hansdampf", "blog" : "http://hada.wordpress.com" }}}');

    member.updateWith(null, userdata);
    should.not.exist(member.firstname);
    should.not.exist(member.lastname);
    member.site.should.equal("https://github.com/hansdampf, http://hada.wordpress.com");

    done();
  });

});
