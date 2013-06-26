"use strict";

var conf = require('../configureForTest');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var expect = require('chai').expect;

describe('Activity application', function () {

  // tested function is currently not used in production anymore (28.4.2013, leider)
  it('removes all special characters from the id string', function () {
    var id = fieldHelpers.createLinkFrom(['assignedGroup', 'title', 'startDate']);
    expect(id).to.equal('assignedGroup_title_startDate');

    var tmpId = fieldHelpers.createLinkFrom(['assignedGroup', '?!tit le?!', '2012-11-11']);
    expect(tmpId).to.equal('assignedGroup___tit_le___2012-11-11');
  });

});

describe('Replace email addresses from text', function () {

  it('returns the input if it is null or undefined', function () {
    expect(fieldHelpers.replaceMailAddresses(null)).to.equal(null);
    expect(fieldHelpers.replaceMailAddresses(undefined)).to.equal(undefined);
  });

  it('replaces a single email address', function () {
    var result = fieldHelpers.replaceMailAddresses('hans.dampf@moby-dick.de');

    expect(result).to.equal('...@...');
  });

  it('replaces an email address in a text', function () {
    var result = fieldHelpers.replaceMailAddresses('many thanks to hans.dampf@moby-dick.de who sent me this link');

    expect(result).to.equal('many thanks to ...@... who sent me this link');
  });

  it('replaces an email address in a quoted mail', function () {
    var result = fieldHelpers.replaceMailAddresses('31.12.2005, Hans Dampf <hans_dampf.@mymail.org>:');

    expect(result).to.equal('31.12.2005, Hans Dampf <...@...>:');
  });

  it('replaces multiple email addresses', function () {
    var result = fieldHelpers.replaceMailAddresses('erna.meier@hihi.com and Hans Dampf <hans_dampf.@mymail.org>tester@system.url');

    expect(result).to.equal('...@... and Hans Dampf <...@...>...@...');
  });

});
