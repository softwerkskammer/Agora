'use strict';

var conf = require('../../testutil/configureForTest');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var expect = require('must');

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

describe('Replace long numbers from text', function () {

  it('returns the input if it is null or undefined', function () {
    expect(fieldHelpers.replaceLongNumbers(null)).to.equal(null);
    expect(fieldHelpers.replaceLongNumbers(undefined)).to.equal(undefined);
  });

  it('does not replace text without digits', function () {
    expect(fieldHelpers.replaceLongNumbers('bla bli blu')).to.equal('bla bli blu');
  });

  it('does not replace text with single brackets, slashes, plus or minus signs', function () {
    expect(fieldHelpers.replaceLongNumbers('text - text + text (text) \/ text')).to.equal('text - text + text (text) \/ text');
  });

  it('does not replace years', function () {
    expect(fieldHelpers.replaceLongNumbers(' 20.12.2011 ')).to.equal(' 20.12.2011 ');
  });

  it('does not replace postal numbers', function () {
    expect(fieldHelpers.replaceLongNumbers(' 77123 Testhausen ')).to.equal(' 77123 Testhausen ');
  });

  it('replaces six or more digits', function () {
    expect(fieldHelpers.replaceLongNumbers(' 123456 ')).to.equal(' ... ');
  });

  it('replaces phone number with parentheses', function () {
    expect(fieldHelpers.replaceLongNumbers(' (040) 334455 ')).to.equal(' ... ');
  });

  it('replaces phone number with parentheses and spaces', function () {
    expect(fieldHelpers.replaceLongNumbers('(040) 33 44 55')).to.equal('...');
  });

  it('replaces phone number with long pre-dial in parentheses and spaces', function () {
    expect(fieldHelpers.replaceLongNumbers('(0 40 35) 33 44 55')).to.equal('...');
  });

  it('replaces phone number with slash', function () {
    expect(fieldHelpers.replaceLongNumbers('040/334455')).to.equal('...');
  });

  it('replaces phone number with slash and spaces', function () {
    expect(fieldHelpers.replaceLongNumbers('040 / 33 44 55')).to.equal('...');
  });

  it('replaces phone number with dash', function () {
    expect(fieldHelpers.replaceLongNumbers('040-334455')).to.equal('...');
  });

  it('replaces phone number with dash and spaces', function () {
    expect(fieldHelpers.replaceLongNumbers('040 - 33 44 55')).to.equal('...');
  });

  it('replaces phone number with country code', function () {
    expect(fieldHelpers.replaceLongNumbers('+4940334455')).to.equal('...');
  });

  it('replaces phone number with country code and spaces', function () {
    expect(fieldHelpers.replaceLongNumbers('+49 40 33 44 55')).to.equal('...');
  });

  it('replaces phone number with country code and parentheses and spaces', function () {
    expect(fieldHelpers.replaceLongNumbers('+49 (40) 33 44 55')).to.equal('...');
  });

  it('replaces phone number with country code and funny zero and spaces', function () {
    expect(fieldHelpers.replaceLongNumbers('+49 (0) 40 33 44 55')).to.equal('...');
  });

  it('replaces phone number with dial-through', function () {
    expect(fieldHelpers.replaceLongNumbers('(040) 33 44 55 - 66')).to.equal('...');
  });
});

describe('killHtmlHead', function () {

  it('does not change text not containing a html head element', function () {
    expect(fieldHelpers.killHtmlHead(null)).to.equal(null);
    expect(fieldHelpers.killHtmlHead('')).to.equal('');
    expect(fieldHelpers.killHtmlHead('<html>bla</html>')).to.equal('<html>bla</html>');
  });

  it('strips HTML <head></head> completely from text', function () {
    expect(fieldHelpers.killHtmlHead('<head></head>')).to.equal('');
    expect(fieldHelpers.killHtmlHead('<head>bla</head>')).to.equal('');
    expect(fieldHelpers.killHtmlHead('123<head>bla</head>321')).to.equal('123321');
  });

  it('strips HTML <head></head> completely from text even when containing newlines', function () {
    expect(fieldHelpers.killHtmlHead('<head>bl\na</head>')).to.equal('');
    expect(fieldHelpers.killHtmlHead('123<head>\nbl\na</head>321')).to.equal('123321');
  });

  it('strips HTML <head></head> completely from text even when text very long', function () {
    expect(fieldHelpers.killHtmlHead('123<head>\nbl\na</head>321 321 321 321 321 321 321 321 321 321 321 321 321 321 ' +
      '321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 '))
      .to.equal('123321 321 321 321 321 321 321 321 321 321 321 321 321 321 ' +
        '321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 ');
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

});

describe('parseToMomentUsingTimezone function', function () {

  it('parses past time in winter', function () {
    var result = fieldHelpers.parseToMomentUsingTimezone('2.1.2013', '3:04', 'Europe/Berlin');
    expect(result.format()).to.equal('2013-01-02T03:04:00+01:00');
  });

  it('parses future time in winter', function () {
    var result = fieldHelpers.parseToMomentUsingTimezone('2.1.2113', '3:04', 'Europe/Berlin');
    expect(result.format()).to.equal('2113-01-02T03:04:00+01:00');
  });

  it('parses past time in summer', function () {
    var result = fieldHelpers.parseToMomentUsingTimezone('2.8.2013', '3:04', 'Europe/Berlin');
    expect(result.format()).to.equal('2013-08-02T03:04:00+02:00');
  });

  it('parses future time in summer', function () {
    var result = fieldHelpers.parseToMomentUsingTimezone('2.8.2113', '3:04', 'Europe/Berlin');
    expect(result.format()).to.equal('2113-08-02T03:04:00+02:00');
  });

  it('parses date with null time', function () {
    var result = fieldHelpers.parseToMomentUsingTimezone('2.8.2013', null, 'Europe/Berlin');
    expect(result.format()).to.equal('2013-08-02T00:00:00+02:00');
  });

  it('parses date with undefined time', function () {
    var result = fieldHelpers.parseToMomentUsingTimezone('2.8.2013', undefined, 'Europe/Berlin');
    expect(result.format()).to.equal('2013-08-02T00:00:00+02:00');
  });

  it('returns undefined without date', function () {
    var result = fieldHelpers.parseToMomentUsingTimezone(undefined, undefined, 'Europe/Berlin');
    expect(result).to.be(undefined);
  });

  it('returns unix timestamps with correct offsets', function () {
    var berlinMoment = fieldHelpers.parseToMomentUsingTimezone('2.8.2013', '12:34:56', 'Europe/Berlin');
    var utcMoment = fieldHelpers.parseToMomentUsingTimezone('2.8.2013', '12:34:56', 'UTC');
    var twoHoursInSeconds = 2 * 60 * 60;
    expect(berlinMoment.unix() + twoHoursInSeconds).to.equal(utcMoment.unix());
  });

});
