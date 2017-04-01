'use strict';

const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();

const beans = require('../../testutil/configureForTest').get('beans');

const galleryService = beans.get('galleryService');
const persistence = beans.get('activityresultsPersistence');
const service = beans.get('activityresultsService');
const ActivityResult = beans.get('activityresult');

describe('ActivityResult service', () => {
  let activityResult;
  let getById;

  beforeEach(() => {
    activityResult = {id: 'Hackergarten2', photos: [{id: 'image1.jpg'}]};
    getById = sinon.stub(persistence, 'getById').callsFake((object, callback) => callback(null, activityResult));
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('the getActivityResultByName method', () => {
    it('should return the activityResult for an id', done => {
      service.getActivityResultByName(activityResult.id, (err, returnedActivityResult) => {
        expect(returnedActivityResult.id()).to.equal(activityResult.id);
        done(err);
      });
    });

    it('should return an error if activity does not exist', done => {
      getById.restore();
      sinon.stub(persistence, 'getById').callsFake((object, callback) => callback(new Error('not found'), null));

      service.getActivityResultByName('non-existing-id', (err, result) => {
        expect(err).to.exist();
        expect(result).to.be(undefined);
        done();
      });
    });

    it('return an activitymodel instance', done => {
      service.getActivityResultByName(activityResult.id, (err, model) => {
        expect(model).to.be.an.instanceOf(ActivityResult);
        done(err);
      });
    });
  });

  it('addPhotoToActivityResult should add an image to an activityresult', done => {
    const saveStub = sinon.stub(persistence, 'save').callsFake((object, callback) => {
      callback();
    });

    sinon.stub(galleryService, 'storeImage').callsFake((path, callback) => { callback(null, path); });
    sinon.stub(galleryService, 'getMetadataForImage').callsFake((path, callback) => { callback(null); });

    service.addPhotoToActivityResult('Hackergarten2', {path: 'my_uri'}, 'memberId', (err, imageUri) => {
      expect(saveStub.called).to.be(true);
      const objectToSave = saveStub.args[0][0];
      expect(objectToSave.photos).to.have.length(2);
      expect(imageUri).to.be('my_uri');
      done(err);
    });
  });

  it('updatePhotoOfActivityResult should change an image in an activityresult', done => {
    const saveStub = sinon.stub(persistence, 'save').callsFake((object, callback) => {
      callback();
    });

    service.updatePhotoOfActivityResult('Hackergarten2', 'image1.jpg', {title: 'Photo 1'},
      {canEditPhoto: () => true}, err => {
        expect(saveStub.called).to.be(true);
        const objectToSave = saveStub.args[0][0];
        expect(objectToSave.photos).to.have.length(1);
        expect(objectToSave.photos[0]).to.have.ownProperty('title', 'Photo 1');
        done(err);
      });
  });
});
