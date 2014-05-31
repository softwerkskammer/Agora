'use strict';

var conf = require('../../testutil/configureForTest');
var expect = require('must');
var fs = require('fs');
var stream = require('stream');
var api = require('../../lib/images/imagerepositoryAPI');

var directoryForUploads = '/tmp';

var filesToUnlink = [];

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
      filesToUnlink.push(api.directory() + '/' + uuid);
      expect(err).to.be.falsy();
      expect(uuid).to.exist();
      expect(uuid).to.not.be.empty();
      done();
    });
  });

  function createTempFileWithContent(tmpFilePath, fileContent) {
    /*jslint node: true, stupid: true */
    fs.writeFile(tmpFilePath, fileContent, {}, function (err) {
      fs.readFileSync(tmpFilePath).toString().must.be.equal(fileContent);
    });
  }

  it('retrieveImage should return a readable stream of an image stored with given uuid', function (done) {
    // Given
    var tmpFileContent = "Our tempfile Content";
    var tempImageUuid = 'ourtempuuid';
    var tmpFilePath = api.directory() + '/' + tempImageUuid;

    filesToUnlink.push(tmpFilePath);
    createTempFileWithContent(tmpFilePath, tmpFileContent);

    // When
    api.retrieveImage(tempImageUuid, function (err, imageStream) {
      expect(err).to.be.falsy();
      imageStream.must.be.an.instanceof(stream.Readable);

      var bufferOfImageStream = '';

      imageStream.on('data', function (chunkOfImageStream) {
        bufferOfImageStream += chunkOfImageStream;
      });

      imageStream.on('error', function (e) {
        done(e);
      });

      imageStream.on('end', function () {
        // Then expect
        bufferOfImageStream.must.be.equal(tmpFileContent);
        done();
      });

    });

  });

  after(function cleanUpFiles(done) {
    filesToUnlink.forEach(function (file) {
      /*jslint node: true, stupid: true */
      fs.unlinkSync(file);
    });
    done();
  });
});
