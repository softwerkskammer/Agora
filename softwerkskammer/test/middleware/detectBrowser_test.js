'use strict';

var beans = require('../../testutil/configureForTest').get('beans');
var detectBrowser = beans.get('detectBrowser');
var expect = require('must-dist');

describe('Detecting Browser', function () {

  function checkUserAgent(string) {
    var req = {headers: {'user-agent': string}};
    var res = {locals: {}};
    var next = function () { return undefined; };
    detectBrowser(req, res, next);
    return res.locals.browserIsTooOld;
  }

  it('detects old IE successfully', function () {
    expect(checkUserAgent('Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; Media Center PC 6.0; InfoPath.2; MS-RTC LM 8)')).to.be(true);
    expect(checkUserAgent('Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; GTB7.4; InfoPath.2; SV1; .NET CLR 3.3.69573; WOW64; en-US)')).to.be(true);
    expect(checkUserAgent('Mozilla/4.0 (Windows; MSIE 7.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)')).to.be(true);
  });

  it('detects new IE successfully', function () {
    expect(checkUserAgent('Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; Media Center PC 6.0; InfoPath.3; MS-RTC LM 8; Zune 4.7)')).to.be(false);
    expect(checkUserAgent('Mozilla/5.0 (compatible; MSIE 10.0; Macintosh; Intel Mac OS X 10_7_3; Trident/6.0)')).to.be(false);
  });

  it('detects anything else successfully', function () {
    expect(checkUserAgent('anything')).to.be(false);
    expect(checkUserAgent('Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1')).to.be(false);
  });

});

