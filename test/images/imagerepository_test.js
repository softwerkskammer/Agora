'use strict';

require('../../testutil/configureForTest');
var expect = require('must');
var api = require('../../lib/images/imagerepositoryAPI');
var conf = require('nconf');

describe("the image repository", function () {
  it('should retrieve the document folder from nconf', function () {
    var directoryForUploads = '/tmp';
    conf.set('imageDirectory', directoryForUploads);
    
    expect(api.directory).to.equal(directoryForUploads);
  });
});