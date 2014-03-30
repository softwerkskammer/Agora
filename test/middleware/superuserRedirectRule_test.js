"use strict";

var conf = require('../../testutil/configureForTest');
var superuserURLRegex = new RegExp(conf.get('superuserURLPattern'));
var expect = require('chai').expect;

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

