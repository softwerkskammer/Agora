'use strict';

var conf = require('../../testutil/configureForTest');
var expect = require('must');
var api = require('../../lib/images/imagerepositoryAPI');

var directoryForUploads = '/tmp';

describe("the image repository - ", function () {
  before(function () {
    conf.set('imageDirectory', directoryForUploads);
  });

  it('should retrieve the document folder from nconf', function () {

    expect(api.directory()).to.equal(directoryForUploads);

  });

  it('storeImage should call a callback as result', function (done) {
    api.storeImage(null, function (err) {
      done();
    });
  });

  it('storeImage should expect a readable stream and throw an error if it is not provided', function (done) {
    api.storeImage('not a readable stream at all', function (err) {
      err.must.be.an.instanceof(Error);
      done();
    });
  });

  it('storeImage should store an image and return a uuid', function (done) {
    done();
  });
});
