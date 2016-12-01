'use strict';
/*eslint no-sync: 0 */

var conf = require('../../testutil/configureForTest');
var expect = require('must-dist');
var beans = require('simple-configure').get('beans');
var fs = require('fs');
var path = require('path');

var service = beans.get('galleryService');

var sourceImage = path.join(__dirname, '../../testutil/fixtures/image.jpg');

function tmpPathFor(name) {
  return path.join(conf.get('imageDirectory') || conf.get('TMPDIR') || '/tmp/', name);
}

function exists(name) {
  return fs.existsSync(tmpPathFor(name));
}

describe('the gallery repository on real files', function () {

  describe('metadata for images', function () {
    it('provides exif data for a given image', function (done) {
      var exifPath = path.join(__dirname, '../../testutil/fixtures/exif_image.jpg');
      service.storeImage(exifPath, function (err, imageId) {
        if (err) { return done(err); }
        service.getMetadataForImage(imageId, function (err1, metadata) {
          expect(metadata.exif).to.have.property('dateTimeOriginal');
          done(err1);
        });
      });
    });
  });

  describe('stores an image', function () {
    it('in the file system', function (done) {
      service.storeImage(sourceImage, function (err, storedImageId) {
        expect(exists(storedImageId)).to.be(true);
        done(err);
      });
    });
  });

  describe('retrieval of images', function () {
    it('provides the original image when no width is provided', function (done) {
      service.storeImage(sourceImage, function (err, imageId) {
        if (err) { return done(err); }
        service.retrieveScaledImage(imageId, undefined, function (err2, retrievedImagePath) {
          expect(fs.existsSync(retrievedImagePath)).to.be(true);
          expect(retrievedImagePath).to.be(tmpPathFor(imageId));
          done(err2);
        });
      });
    });

    it('provides scaled image path when width is provided', function (done) {
      service.storeImage(sourceImage, function (err, imageId) {
        if (err) { return done(err); }

        // first retrieve: scaled image does not exist yet
        service.retrieveScaledImage(imageId, 'thumb', function (err2, retrievedImagePath) {
          expect(fs.existsSync(retrievedImagePath)).to.be(true);
          expect(retrievedImagePath).to.not.be(tmpPathFor(imageId));
          expect(retrievedImagePath).to.match(/_400\.jpg$/);

          // second retrieve: scaled image already exists
          service.retrieveScaledImage(imageId, 'thumb', function (err3, retrievedImagePath2) {
            expect(retrievedImagePath2).to.be(retrievedImagePath);
            done(err3);
          });
        });
      });
    });

    it('returns error for invalid imageId when width is not provided', function (done) {
      service.retrieveScaledImage('invalidId', null, function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('returns error for invalid imageId when width is provided', function (done) {
      service.retrieveScaledImage('invalidId', 'thumb', function (err) {
        expect(err).to.exist();
        done();
      });
    });
  });

  describe('deletion of images', function () {

    it('deletes an image', function (done) {
      service.storeImage(sourceImage, function (err1, imageId) {
        if (err1) { return done(err1); }
        expect(exists(imageId)).to.be.true();
        service.deleteImage(tmpPathFor(imageId), function (err2) {
          expect(exists(imageId)).to.be.false();
          done(err2);
        });
      });
    });
  });

  describe('avatar images', function () {
    it('stores an avatar image', function (done) {
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(sourceImage, params, function (err, name) {
        expect(err).to.not.exist();
        service.retrieveScaledImage(name, undefined, function (err1) {
          done(err1);
        });
      });
    });

    it('stores a miniavatar image', function (done) {
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(sourceImage, params, function (err, name) {
        expect(err).to.not.exist();
        service.retrieveScaledImage(name, 'mini', function (err1, lname) {
          expect(lname).to.match(/_16\.jpg/);
          done(err1);
        });
      });
    });

    it('deletes an existing avatar image', function (done) {
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(sourceImage, params, function (err, name) {
        if (err) { return done(err); }
        expect(exists(name)).to.be.true();
        service.deleteImage(name, function (err1) {
          expect(exists(name)).to.be.false();
          done(err1);
        });
      });
    });

    it('is happy with "deleting" a non-existing avatar image', function (done) {
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(sourceImage, params, function (err, name) {
        if (err) { return done(err); }
        expect(exists(name)).to.be.true();
        service.deleteImage('nonexisting' + name, function (err1) {
          expect(exists(name)).to.be.true();
          done(err1);
        });
      });
    });
  });

});
