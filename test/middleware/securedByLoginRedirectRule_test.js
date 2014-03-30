"use strict";

var conf = require('../../testutil/configureForTest');
var securedByLoginURLRegex = new RegExp(conf.get('securedByLoginURLPattern'));
var expect = require('chai').expect;

describe('SecuredByLoginURLRedirect Rule (members)', function () {

  it('secures members/', function () {
    var url = 'http://host/members/';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures members', function () {
    var url = 'http://host/members';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures members/edit', function () {
    var url = 'http://host/members/edit';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures members/new', function () {
    var url = 'http://host/members/new';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures members/something', function () {
    var url = 'http://host/members/something';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures members/submit', function () {
    var url = 'http://host/members/submit';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

});

describe('SecuredByLoginURLRedirect Rule (mailarchive)', function () {

  it('secures members/', function () {
    var url = 'http://host/mailarchive/';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

});

describe('SecuredByLoginURLRedirect Rule (wiki/socrates.*)', function () {

  it('secures wiki/socrates2013', function () {
    var url = 'http://host/wiki/socrates2013/';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures wiki/socrates2014', function () {
    var url = 'http://host/wiki/socrates2014/';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures wiki/socrates2014orga', function () {
    var url = 'http://host/wiki/socrates2014orga/';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

});

describe('SecuredByLoginURLRedirect Rule (*/new)', function () {

  it('secures URLs with activities/new', function () {
    var url = 'http://host/activities/new';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures URLs with announcements/new', function () {
    var url = 'http://host/announcements/new';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures URLs with groups/new', function () {
    var url = 'http://host/groups/new';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('does secure members/new', function () {
    var url = 'http://host/members/new';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('does secure something/new', function () {
    var url = 'http://host/something/new';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

  it('secures URLs with something/new/something', function () {
    var url = 'http://host/something/new/something';
    expect(securedByLoginURLRegex.test(url)).to.be.true;
  });

});

