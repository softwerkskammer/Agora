'use strict';

var moment = require('moment-timezone');
var expect = require('must');

var ActivityResult = require('../../testutil/configureForTest').get('beans').get('activityresult');

describe('Activity result', function () {
  it('should have an id', function () {
    var activityResult = new ActivityResult({id: 'hackergarten2_2'});
    expect(activityResult.id()).to.be('hackergarten2_2');
  });

  it('should not have an empty constructor', function () {
    expect((new ActivityResult({})).id()).to.be.falsy();
  });

  it('should have a list of photo ids', function () {
    var activityResult = new ActivityResult({
      id: 'hackergarten2_2',
      photos: [
        {id: 'image1.jpg'},
        {id: 'image2.jpg'}
      ]
    });

    expect(activityResult.photos()[0].state).to.eql({id: 'image1.jpg'});
    expect(activityResult.photos()[1].state).to.eql({id: 'image2.jpg'});

  });

  it('should have a field of defined tags for an activityResult', function () {
    expect(new ActivityResult({tags: ['1', '2']}).tags()).to.be.eql(['1', '2']);
  });

  describe('photo subdocument', function () {
    it('should be retrievable by id', function () {
      var activityResult = new ActivityResult({
        id: 'whatever',
        photos: [
          {id: 'my_photo_id'}
        ]
      });

      expect(activityResult.getPhotoById('my_photo_id')).to.exist();
    });

    it('should be updatable by id', function () {
      var activityResult = new ActivityResult({
        id: 'whatever',
        photos: [
          {id: 'my_photo_id', title: 'Title'}
        ]
      });

      activityResult.updatePhotoById('my_photo_id', {title: 'newTitle'});
      expect(activityResult.getPhotoById('my_photo_id').title()).to.eql('newTitle');
    });

    it('should collect all distinct tags present', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          {tags: ['tagA', 'tagC']},
          {tags: ['tagA', 'tagD']}
        ]
      });

      expect(activityResult.getDistinctPresentTags()).to.be.a.permutationOf(['tagA', 'tagC', 'tagD']);
    });

    it('should not collect undefined tags', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          {tags: ['tagA', 'tagC']},
          {tags: null}
        ]
      });

      expect(activityResult.getDistinctPresentTags()).to.be.a.permutationOf(['tagA', 'tagC']);
    });

    it('should not collect undefined tags', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          {tags: ['tagA', 'tagC']},
          {tags: [undefined]}
        ]
      });

      expect(activityResult.getDistinctPresentTags()).to.be.a.permutationOf(['tagA', 'tagC']);
    });

    it('displays a "legacy" uri', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          {id: 'name.jpg', uri: '/gallery/legacyname.jpg'}
        ]
      });

      expect(activityResult.getPhotoById('name.jpg').uri()).to.eql('/gallery/legacyname.jpg');
    });

    it('displays a uri based on the id', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          {id: 'name.jpg'}
        ]
      });

      expect(activityResult.getPhotoById('name.jpg').uri()).to.eql('/gallery/name.jpg');
    });
  });

  describe('preparation for display', function () {

    it('creates a list of "day" objects', function () {
      var activityResult = new ActivityResult({
        id: 'ar_id',
        photos: [
          {id: 'image1.jpg', tags: ['tag1'], timestamp: moment('2014-02-20T12:00:00Z').toDate()},
          {id: 'image2.jpg', tags: ['tag1'], timestamp: moment('2014-02-20T12:01:00Z').toDate()}
        ]
      });
      expect(activityResult.photosByDay()).to.have.length(1);
      expect(activityResult.photosByDay()[0].day.locale('de').format('l')).to.be('20.2.2014');
      expect(activityResult.photosByDay()[0].photosByTag).to.have.ownKeys(['tag1']);
      expect(activityResult.photosByDay()[0].photosByTag.tag1).to.have.length(2);
    });

    it('sorts the photos by time', function () {
      var activityResult = new ActivityResult({
        id: 'ar_id',
        photos: [
          {id: 'image1.jpg', tags: ['tag1'], timestamp: moment('2014-02-20T12:00:00Z').toDate()},
          {id: 'image2.jpg', tags: ['tag1'], timestamp: moment('2014-02-20T12:01:00Z').toDate()}
        ]
      });
      var photosOfTag1 = activityResult.photosByDay()[0].photosByTag.tag1;
      expect(photosOfTag1[0].state).to.have.ownProperty('id', 'image1.jpg');
      expect(photosOfTag1[1].state).to.have.ownProperty('id', 'image2.jpg');
    });

    it('sorts the days by time descending', function () {
      var activityResult = new ActivityResult({
        id: 'ar_id',
        photos: [
          {id: 'image1.jpg', tags: ['tag1'], timestamp: moment('2014-02-20T12:00:00Z').toDate()},
          {id: 'image2.jpg', tags: ['tag1'], timestamp: moment('2014-02-21T12:01:00Z').toDate()}
        ]
      });
      expect(activityResult.photosByDay()).to.have.length(2);
      expect(activityResult.photosByDay()[0].day.locale('de').format('l')).to.be('21.2.2014');
      expect(activityResult.photosByDay()[1].day.locale('de').format('l')).to.be('20.2.2014');
    });
  });

});
