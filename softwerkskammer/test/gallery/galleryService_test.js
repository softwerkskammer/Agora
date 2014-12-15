'use strict';

var conf = require('../../testutil/configureForTest');
var expect = require('must');
var beans = require('simple-configure').get('beans');
var fs = require('fs');
var path = require('path');

var service = beans.get('galleryService');

describe('the gallery repository on real files', function () {

  function exists(name) {
    /*jslint stupid: true*/
    return fs.existsSync(path.join(conf.get('imageDirectory') || conf.get('TMPDIR') || '/tmp/', name));
  }

  var imagePath = __dirname + '/fixtures/image.jpg';

  describe('activity images', function () {
    it('stores the original image', function (done) {
      service.storeImage(imagePath, function (err, imageId) {
        service.retrieveScaledImage(imageId, undefined, done);
      });
    });

    it('provides scaled images', function (done) {
      service.storeImage(imagePath, function (err, imageId) {
        service.retrieveScaledImage(imageId, 'thumb', done);
      });
    });

    it('provides exif data for a given image', function (done) {
      var exifPath = __dirname + '/fixtures/exif_image.jpg';
      service.storeImage(exifPath, function (err, imageId) {
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

    it('deletes an image', function (done) {
      service.storeImage(imagePath, function (err, imageId) {
        service.retrieveScaledImage(imageId, undefined, function (err, name) {
          /*jslint stupid: true*/
          expect(fs.existsSync(name)).to.be.true();
          service.deleteImage(name, function (err) {
            expect(fs.existsSync(name)).to.be.false();
            done(err);
          });
        });
      });
    });

  });

  describe('avatar images', function () {
    it('stores an avatar image', function (done) {
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(imagePath, params, function (err, name) {
        expect(err).to.not.exist();
        service.retrieveScaledImage(name, undefined, function (err, name) {
          done(err);
        });
      });
    });

    it('stores a miniavatar image', function (done) {
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(imagePath, params, function (err, name) {
        expect(err).to.not.exist();
        service.retrieveScaledImage(name, 'mini', function (err, lname) {
          expect(lname).to.match(/_16\.jpg/);
          done(err);
        });
      });
    });

    it('deletes an existing avatar image', function (done) {
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(imagePath, params, function (err, name) {
        expect(exists(name)).to.be.true();
        service.deleteImage(name, function (err) {
          expect(exists(name)).to.be.false();
          done(err);
        });
      });
    });

    it('is happy with "deleting" a non-existing avatar image', function (done) {
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(imagePath, params, function (err, name) {
        expect(exists(name)).to.be.true();
        service.deleteImage('nonexisting' + name, function (err) {
          expect(exists(name)).to.be.true();
          done(err);
        });
      });
    });
  });

});
