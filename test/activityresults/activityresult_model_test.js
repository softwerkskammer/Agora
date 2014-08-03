'use strict';

require('../../testutil/configureForTest');
var conf = require('nconf');
var expect = require('must');

var ActivityResult = conf.get('beans').get('activityresult');

describe('Activity result', function () {
  it('should have an id', function () {
    var activityResult = new ActivityResult({id: "hackergarten2_2"});
    expect(activityResult.id).to.be('hackergarten2_2');
  });

  it('should have an empty constructor', function () {
    expect((new ActivityResult()).id).to.be.falsy();
  });

  it('should have a list of photo urls', function () {
    var activityResult = new ActivityResult({
      id: 'hackergarten2_2',
      photos: [
        {uri: '/path/to/image1.jpg'},
        {uri: '/path/to/image2.jpg'}
      ]
    });

    expect(activityResult.photos[0]).to.eql({uri: '/path/to/image1.jpg'});
    expect(activityResult.photos[1]).to.eql({uri: '/path/to/image2.jpg'});

  });

  it('should have a created_by field', function () {
    expect(new ActivityResult({created_by: 'me'})).to.have.property('created_by', 'me');
  });

  it('should have a field of defined tags for an activityResult', function () {
    expect(new ActivityResult({tags: ['1', '2']}).tags).to.be.eql(['1', '2']);
  });

  describe('photo subdocument', function () {
    it('should be retrievable by id', function () {
      var activityResult = new ActivityResult({
        'id': 'whatever',
        'photos': [
          {
            'id': 'my_photo_id',
            'date': 'thedate'
          }
        ]
      });

      expect(activityResult.getPhotoById('my_photo_id')).to.have.property('date', 'thedate');
    });

    it('should be updatable by id', function () {
      var activityResult = new ActivityResult({
        'id': 'whatever',
        'photos': [
          {
            'id': 'my_photo_id',
            'date': 'thedate'
          }
        ]
      });

      activityResult.updatePhotoById('my_photo_id', {date: 'thendate'});
      expect(activityResult.getPhotoById('my_photo_id')).to.have.property('date', 'thendate');
    });
  });
});
