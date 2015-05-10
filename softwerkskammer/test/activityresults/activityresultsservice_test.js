'use strict';

var expect = require('must');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');

var galleryService = beans.get('galleryService');
var persistence = beans.get('activityresultsPersistence');
var service = beans.get('activityresultsService');
var ActivityResult = beans.get('activityresult');

describe('ActivityResult service', function () {
  var activityResult;
  var getById;

  beforeEach(function () {
    activityResult = {id: 'Hackergarten2', photos: [{id: 'image1.jpg'}]};
    getById = sinon.stub(persistence, 'getById', function (object, callback) {
      return callback(null, activityResult);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('the getActivityResultByName method', function () {
    it('should return the activityResult for an id', function (done) {
      service.getActivityResultByName(activityResult.id, function (err, returnedActivityResult) {
        expect(returnedActivityResult.id()).to.equal(activityResult.id);
        done(err);
      });
    });

    it('should return an error if activity does not exist', function (done) {
      getById.restore();
      sinon.stub(persistence, 'getById', function (object, callback) {
        return callback(new Error('not found'), null);
      });

      service.getActivityResultByName('non-existing-id', function (err, result) {
        expect(err).to.exist();
        expect(result).to.be(undefined);
        done();
      });
    });

    it('return an activitymodel instance', function (done) {
      service.getActivityResultByName(activityResult.id, function (err, model) {
        expect(model).to.be.an.instanceOf(ActivityResult);
        done(err);
      });
    });
  });

  it('addPhotoToActivityResult should add an image to an activityresult', function (done) {
    var saveStub = sinon.stub(persistence, 'save', function (object, callback) {
      callback();
    });

    sinon.stub(galleryService, 'storeImage', function (path, callback) { callback(null, path); });
    sinon.stub(galleryService, 'getMetadataForImage', function (path, callback) { callback(null); });

    service.addPhotoToActivityResult('Hackergarten2', {path: 'my_uri'}, 'memberId', function (err, imageUri) {
      expect(saveStub.called).to.be(true);
      var objectToSave = saveStub.args[0][0];
      expect(objectToSave.photos).to.have.length(2);
      expect(imageUri).to.be('my_uri');
      done(err);
    });
  });

  it('updatePhotoOfActivityResult should change an image in an activityresult', function (done) {
    var saveStub = sinon.stub(persistence, 'save', function (object, callback) {
      callback();
    });

    service.updatePhotoOfActivityResult('Hackergarten2', 'image1.jpg', {title: 'Photo 1'},
      {canEditPhoto: function () { return true; }}, function (err) {
        expect(saveStub.called).to.be(true);
        var objectToSave = saveStub.args[0][0];
        expect(objectToSave.photos).to.have.length(1);
        expect(objectToSave.photos[0]).to.have.ownProperty('title', 'Photo 1');
        done(err);
      });
  });
});
