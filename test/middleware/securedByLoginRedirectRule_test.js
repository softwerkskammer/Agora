"use strict";

var conf = require('../configureForTest');
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
