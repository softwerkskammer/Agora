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

  it('does not replace a single @ sign', function () {
    expect(fieldHelpers.replaceMailAddresses('@')).to.equal('@');
  });

  it('does not replace an @ sign when it is not in an email (no dots)', function () {
    expect(fieldHelpers.replaceMailAddresses('Seti@Home')).to.equal('Seti@Home');
  });

  it('does not replace an @ sign when it is not in an email (suffix too long)', function () {
    expect(fieldHelpers.replaceMailAddresses('I stay@Hans.Dampf')).to.equal('I stay@Hans.Dampf');
  });

  it('replaces a single email address', function () {
    var result = fieldHelpers.replaceMailAddresses('Hans.Dampf_1@moby-dick.de');

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

describe('readableDate function', function () {

  it('converts a unix timestamp to a German Date', function () {
    var unixtimestamp = 1375056000;
    var result = fieldHelpers.readableDate(unixtimestamp);
    expect(result).to.equal('29.07.2013');
  });

  it('converts a unix timestamp to a German Date', function () {
    var unixtimestamp = 1388448000;
    var result = fieldHelpers.readableDate(unixtimestamp);
    expect(result).to.equal('31.12.2013');
  });

  it('keeps the value untouched, if the original value is a German date', function () {
    var unixtimestamp = '30.07.2013';
    var result = fieldHelpers.readableDate(unixtimestamp);
    expect(result).to.equal('30.07.2013');
  });

  it('returns null, if the original value is null', function () {
    var unixtimestamp = null;
    var result = fieldHelpers.readableDate(unixtimestamp);
    expect(result).to.equal(null);
  });

  it('returns null, if the original value is not a valid unix timestamp but a string', function () {
    var unixtimestamp2 = 'not a valid unix timestamp';
    var result2 = fieldHelpers.readableDate(unixtimestamp2);
    expect(result2).to.equal(null);
  });

});
