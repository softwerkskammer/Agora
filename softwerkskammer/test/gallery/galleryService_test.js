'use strict';

var conf = require('../../testutil/configureForTest');
var expect = require('must');
var beans = require('nconf').get('beans');
var fs = require('fs');
var service = beans.get('galleryService');

describe('the gallery repository on real files', function () {

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
      var nickname = 'avatarnick';
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(imagePath, nickname, params, function (err) {
        expect(err).to.not.exist();
        service.scaleAndReturnFullImagePath(nickname, undefined, function (err, name) {
          expect(name).to.match(/avatarnick\.jpg/);
          done(err);
        });
      });
    });

    it('stores a miniavatar image', function (done) {
      var nickname = 'avatarnick';
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(imagePath, nickname, params, function (err) {
        expect(err).to.not.exist();
        service.scaleAndReturnFullImagePath(nickname, 16, function (err, name) {
          expect(name).to.match(/avatarnick_16\.jpg/);
          done(err);
        });
      });
    });

    it('deletes an existing avatar image', function (done) {
      var nickname = 'avatarnick';
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(imagePath, nickname, params, function (err, name) {
        /*jslint stupid: true*/
        expect(fs.existsSync(name)).to.be.true();
        service.deleteAvatar(nickname, function (err) {
          expect(fs.existsSync(name)).to.be.false();
          done(err);
        });
      });
    });

    it('is happy with "deleting" a non-existing avatar image', function (done) {
      var nickname = 'avatarnick';
      var params = {geometry: '100x100+10+10', scale: '0.5', angle: '0'};
      service.storeAvatar(imagePath, nickname, params, function (err, name) {
        /*jslint stupid: true*/
        expect(fs.existsSync(name)).to.be.true();
        service.deleteAvatar(nickname + 'nonexisting', function (err) {
          expect(fs.existsSync(name)).to.be.true();
          done(err);
        });
      });
    });
  });

});
