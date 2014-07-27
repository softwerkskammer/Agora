'use strict';

var expect = require('must');
var sinon = require('sinon').sandbox.create();

var conf = require('../../testutil/configureForTest');
var persistence = conf.get('beans').get('activityresultsPersistence');
var service = conf.get('beans').get('activityresultsService');

describe('ActivityResult service', function () {
  var activityResult = {id: 'Hackergarten2', photos: [{uri: '/path/to/image1.jpg'}]};
  var getById;

  beforeEach(function () {
    getById = sinon.stub(persistence, 'getById', function (object, callback) {
      return callback(null, activityResult);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('the getActivityResultById method', function () {
    it('should return the activityResult for an id', function (done) {
      service.getActivityResultByName(activityResult.id, function (err, returnedActivityResult) {
        expect(returnedActivityResult.id).to.equal(activityResult.id);
        done();
      });
    });

    it('should return an error if activity does not exist', function (done) {
      getById.restore();
      sinon.stub(persistence, 'getById', function (object, callback) {
        return callback(new Error('not found'), null);
      });

      service.getActivityResultByName('non-existing-id', function (err, activityResult) {
        expect(err).to.exist();
        expect(activityResult).to.be.null();
        done();
      });
    });
  });
});
