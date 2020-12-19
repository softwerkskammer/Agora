'use strict';
/*eslint no-sync: 0 */

const conf = require('../../testutil/configureForTest');
const expect = require('must-dist');
const beans = require('simple-configure').get('beans');
const fs = require('fs');
const path = require('path');

const service = beans.get('galleryService');

const sourceImage = path.join(__dirname, '/fixtures/image.jpg');

function tmpPathFor(name) {
  return path.join(conf.get('imageDirectory') || conf.get('TMPDIR') || '/tmp/', name);
}

function exists(name) {
  return fs.existsSync(tmpPathFor(name));
}

describe('the gallery repository on real files', () => {

  describe('metadata for images', () => {
    it('provides exif data for a given image', done => {
      const exifPath = path.join(__dirname, '/fixtures/exif_image.jpg');
      service.storeImage(exifPath, (err, imageId) => {
        if (err) { return done(err); }
        service.getMetadataForImage(imageId, (err1, metadata) => {
          expect(metadata.exif).to.have.property('DateTimeOriginal');
          done(err1);
        });
      });
    });
  });

  describe('stores an image', () => {
    it('in the file system', done => {
      service.storeImage(sourceImage, (err, storedImageId) => {
        expect(exists(storedImageId)).to.be(true);
        done(err);
      });
    });
  });

  describe('retrieval of images', () => {
    it('provides the original image when no width is provided', done => {
      service.storeImage(sourceImage, (err, imageId) => {
        if (err) { return done(err); }
        service.retrieveScaledImage(imageId, undefined, (err2, retrievedImagePath) => {
          expect(fs.existsSync(retrievedImagePath)).to.be(true);
          expect(retrievedImagePath).to.be(tmpPathFor(imageId));
          done(err2);
        });
      });
    });

    it('provides scaled image path when width is provided', done => {
      service.storeImage(sourceImage, (err, imageId) => {
        if (err) { return done(err); }

        // first retrieve: scaled image does not exist yet
        service.retrieveScaledImage(imageId, 'thumb', (err2, retrievedImagePath) => {
          expect(fs.existsSync(retrievedImagePath)).to.be(true);
          expect(retrievedImagePath).to.not.be(tmpPathFor(imageId));
          expect(retrievedImagePath).to.match(/_400\.jpg$/);

          // second retrieve: scaled image already exists
          service.retrieveScaledImage(imageId, 'thumb', (err3, retrievedImagePath2) => {
            expect(retrievedImagePath2).to.be(retrievedImagePath);
            done(err3);
          });
        });
      });
    });

    it('returns error for invalid imageId when width is not provided', done => {
      service.retrieveScaledImage('invalidId', null, err => {
        expect(err).to.exist();
        done();
      });
    });

    it('returns error for invalid imageId when width is provided', done => {
      service.retrieveScaledImage('invalidId', 'thumb', err => {
        expect(err).to.exist();
        done();
      });
    });
  });

  describe('deletion of images', () => {

    it('deletes an image', done => {
      service.storeImage(sourceImage, (err1, imageId) => {
        if (err1) { return done(err1); }
        expect(exists(imageId)).to.be.true();
        service.deleteImage(tmpPathFor(imageId), err2 => {
          expect(exists(imageId)).to.be.false();
          done(err2);
        });
      });
    });
  });

  describe('avatar images', () => {
    it('stores an avatar image', done => {
      service.storeAvatar(sourceImage, {}, (err, name) => {
        expect(err).to.not.exist();
        service.retrieveScaledImage(name, undefined, err1 => {
          done(err1);
        });
      });
    });

    it('stores a miniavatar image', done => {
      service.storeAvatar(sourceImage, {}, (err, name) => {
        expect(err).to.not.exist();
        service.retrieveScaledImage(name, 'mini', (err1, lname) => {
          expect(lname).to.match(/_16\.jpg/);
          done(err1);
        });
      });
    });

    it('deletes an existing avatar image', done => {
      service.storeAvatar(sourceImage, {}, (err, name) => {
        if (err) { return done(err); }
        expect(exists(name)).to.be.true();
        service.deleteImage(name, err1 => {
          expect(exists(name)).to.be.false();
          done(err1);
        });
      });
    });

    it('is happy with "deleting" a non-existing avatar image', done => {
      service.storeAvatar(sourceImage, {}, (err, name) => {
        if (err) { return done(err); }
        expect(exists(name)).to.be.true();
        service.deleteImage('nonexisting' + name, err1 => {
          expect(exists(name)).to.be.true();
          done(err1);
        });
      });
    });
  });

});
