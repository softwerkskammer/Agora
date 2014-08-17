'use strict';

var conf = require('../../testutil/configureForTest');
var expect = require('must');
var beans = require('nconf').get('beans');
var service = beans.get('galleryService');

describe("the gallery repository on real files", function () {

  it('stores the original image', function (done) {
    var storedImageId = 'image.jpg';
    var imagePath = __dirname + '/fixtures/' + storedImageId;
    service.storeImage(imagePath, function (err, imageId) {
      service.retrieveScaledImage(imageId, undefined, undefined, done);
    });
  });

  it('provides scaled images', function (done) {
    var storedImageId = 'image.jpg';
    var imagePath = __dirname + '/fixtures/' + storedImageId;
    service.storeImage(imagePath, function (err, imageId) {
      service.retrieveScaledImage(imageId, 100, 100, done);
    });
  });

  it('provides exif data for a given image', function (done) {
    var storedImageId = 'exif_image.jpg';
    var imagePath = __dirname + '/fixtures/' + storedImageId;
    service.storeImage(imagePath, function (err, imageId) {
      service.getMetadataForImage(imageId, function (err, metadata) {
        expect(metadata.exif).to.have.property('dateTimeOriginal');
        done(err);
      });
    });
  });

  it('returns err for invalid imageId', function (done) {
    service.retrieveScaledImage('invalidId', 12, undefined, function (err) {
      expect(err).to.exist();
      done();
    });
  });

});
