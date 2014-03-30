"use strict";

var conf = require('../../testutil/configureForTest');
var superuserURLRegex = new RegExp(conf.get('superuserURLPattern'));
var expect = require('chai').expect;

describe('RedirectIfNotSuperuser Rule (edit)', function () {

  it('secures URLs with activities/edit', function () {
    var url = 'http://host/activities/edit';
    expect(superuserURLRegex.test(url)).to.be.true;
  });

  it('secures URLs with announcements/edit', function () {
    var url = 'http://host/announcements/edit';
    expect(superuserURLRegex.test(url)).to.be.true;
  });

  it('secures URLs with groups/edit', function () {
    var url = 'http://host/groups/edit';
    expect(superuserURLRegex.test(url)).to.be.true;
  });

  it('does secure members/edit', function () {
    var url = 'http://host/members/edit';
    expect(superuserURLRegex.test(url)).to.be.true;
  });

  it('does secure something/edit', function () {
    var url = 'http://host/something/edit';
    expect(superuserURLRegex.test(url)).to.be.true;
  });

  it('secures URLs with something/edit/something', function () {
    var url = 'http://host/something/edit/something';
    expect(superuserURLRegex.test(url)).to.be.true;
  });

  it('does not secure URLs with something/something', function () {
    var url = 'http://host/something/something';
    expect(superuserURLRegex.test(url)).to.be.false;
  });

});

describe('RedirectIfNotSuperuser Rule (administration)', function () {

  it('secures URLs with administration', function () {
    var url = 'http://host/administration/something';
    expect(superuserURLRegex.test(url)).to.be.true;
  });

  it('secures URLs with administration/ at the end', function () {
    var url = 'http://host/administration/';
    expect(superuserURLRegex.test(url)).to.be.true;
  });

});

