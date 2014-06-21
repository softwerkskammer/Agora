'use strict';

var expect = require('must');
var sinon = require('sinon').sandbox.create();

var conf = require('../../testutil/configureForTest');
var persistence = conf.get('beans').get('activityresultsPersistence');
var store = conf.get('beans').get('activityresultstore');

describe('ActivityResult store', function () {
  var activityResult1 = {id: 'Hackergarten1', photos: [{uri: '/path/to/image1.jpg'}]};
  var activityResult2 = {id: 'Hackergarten2', photos: [{uri: '/path/to/image2.jpg'}]};
  var sampleList = [activityResult1, activityResult2];
  var getByField;
  var getById;
  var list;

  beforeEach(function () {
    list = sinon.stub(persistence, 'list', function (sortOrder, callback) {
      return callback(null, sampleList);
    });
    sinon.stub(persistence, 'listByField', function (searchObject, sortOrder, callback) {
      return callback(null, sampleList);
    });
    getByField = sinon.stub(persistence, 'getByField', function (object, callback) {
      return callback(null, activityResult1);
    });
    getById = sinon.stub(persistence, 'getById', function (object, callback) {
      return callback(null, activityResult1);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('the getAcitvityResultById method', function () {
    it('should return the activityResult for an id', function (done) {
      store.getActivityResultById(activityResult1.id, function (err, activityResult) {
        activityResult.should.have.property('id', activityResult1.id);
        done();
      });
    });
  });
});
