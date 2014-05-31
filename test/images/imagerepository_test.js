'use strict';

var conf = require('../../testutil/configureForTest');
var expect = require('must');
var fs = require('fs');
var stream = require('stream');
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
    var iconStream = fs.createReadStream(__dirname + '/sample_image.ico');
    api.storeImage(iconStream, function (err, uuid) {
      expect(err).to.be.falsy();
      expect(uuid).to.exist();
      expect(uuid).to.not.be.empty();
      done();
    });
  });

  it('retrieveImage should return a readable stream of an image stored with given uuid', function (done) {
    // Given
    var tempUuid = 'ourtempuuid';
    var fileContent = "Our tempfile Content";

    /*jslint node: true, stupid: true */
    fs.writeSync(api.directory() + '/' + tempUuid, new Buffer(fileContent));

    // When
    api.retrieveImage(tempUuid, function (err, imageStream) {
      err.must.be.falsy();
      imageStream.must.be.an.instanceof(stream.Readable);

      var content = '';

      imageStream.resume();
      imageStream.on('data', function (chunk) { content += content; })
      imageStream.on('end', function () {
        content.must.be.equal(fileContent);
        done();
      })

    });

  });
});
