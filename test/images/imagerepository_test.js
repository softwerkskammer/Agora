'use strict';

require('../../testutil/configureForTest');
var expect = require('must');
var api = require('../../lib/images/imagerepositoryAPI');
var conf = require('nconf');

var directoryForUploads = '/tmp';

describe("the image repository - ", function () {
  before(function () {
    conf.set('imageDirectory', directoryForUploads);
  })

  it('should retrieve the document folder from nconf', function () {

    expect(api.directory).to.equal(directoryForUploads);

  });

  it('storeImage should call a callback as result', function (done) {
    api.storeImage(null, function (err) {
      done();
    })
  });
});