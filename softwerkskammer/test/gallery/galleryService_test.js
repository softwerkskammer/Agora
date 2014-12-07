'use strict';

var conf = require('../../testutil/configureForTest');
var expect = require('must');
var beans = require('nconf').get('beans');
var service = beans.get('galleryService');

describe('the gallery repository on real files', function () {

  it('stores the original image', function (done) {
    var imagePath = __dirname + '/fixtures/image.jpg';
    service.storeImage(imagePath, function (err, imageId) {
      service.retrieveScaledImage(imageId, undefined, done);
    });
  });

  it('provides scaled images', function (done) {
    var imagePath = __dirname + '/fixtures/image.jpg';
    service.storeImage(imagePath, function (err, imageId) {
      service.retrieveScaledImage(imageId, 'thumb', done);
    });
  });

  it('provides exif data for a given image', function (done) {
    var imagePath = __dirname + '/fixtures/exif_image.jpg';
    service.storeImage(imagePath, function (err, imageId) {
      service.getMetadataForImage(imageId, function (err, metadata) {
        expect(metadata.exif).to.have.property('dateTimeOriginal');
        done(err);
      });
    });
  });

  it('returns err for invalid imageId', function (done) {
    service.retrieveScaledImage('invalidId', 'thumb', function (err) {
      expect(err).to.exist();
      done();
    });
  });

});
