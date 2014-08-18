'use strict';

require('../../testutil/configureForTest');
var conf = require('nconf');
var expect = require('must');

var ActivityResult = conf.get('beans').get('activityresult');

describe('Activity result', function () {
  it('should have an id', function () {
    var activityResult = new ActivityResult({id: "hackergarten2_2"});
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

    expect(activityResult.photos()[0]).to.eql({id: 'image1.jpg'});
    expect(activityResult.photos()[1]).to.eql({id: 'image2.jpg'});

  });

  it('should have a created_by function', function () {
    expect(new ActivityResult({created_by: 'me'}).created_by()).to.eql('me');
  });

  it('should have a field of defined tags for an activityResult', function () {
    expect(new ActivityResult({tags: ['1', '2']}).tags()).to.be.eql(['1', '2']);
  });

  describe('photo subdocument', function () {
    it('should be retrievable by id', function () {
      var activityResult = new ActivityResult({
        id: 'whatever',
        photos: [
          { id: 'my_photo_id', date: 'thedate' }
        ]
      });

      expect(activityResult.getPhotoById('my_photo_id')).to.have.property('date', 'thedate');
    });

    it('should be updatable by id', function () {
      var activityResult = new ActivityResult({
        id: 'whatever',
        photos: [
          { id: 'my_photo_id', date: 'thedate' }
        ]
      });

      activityResult.updatePhotoById('my_photo_id', {date: 'newdate'});
      expect(activityResult.getPhotoById('my_photo_id')).to.have.property('date', 'newdate');
    });

    it('should collect all distinct tags present', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          { tags: ['tagA', 'tagC'] },
          { tags: ['tagA', 'tagD'] }
        ]
      });

      expect(activityResult.getDistinctPresentTags()).to.be.a.permutationOf(['tagA', 'tagC', 'tagD']);
    });

    it('should not collect undefined tags', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          { tags: ['tagA', 'tagC'] },
          { tags: null }
        ]
      });

      expect(activityResult.getDistinctPresentTags()).to.be.a.permutationOf(['tagA', 'tagC']);
    });

    it('should not collect undefined tags', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          { tags: ['tagA', 'tagC'] },
          { tags: [undefined] }
        ]
      });

      expect(activityResult.getDistinctPresentTags()).to.be.a.permutationOf(['tagA', 'tagC']);
    });

    it('displays a "legacy" uri', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          { id: 'name.jpg', uri: '/gallery/legacyname.jpg'}
        ]
      });

      expect(activityResult.uriForPhoto('name.jpg')).to.eql('/gallery/legacyname.jpg');
    });

    it('displays a uri based on the id', function () {
      var activityResult = new ActivityResult({
        id: 'dontcare',
        photos: [
          { id: 'name.jpg'}
        ]
      });

      expect(activityResult.uriForPhoto('name.jpg')).to.eql('/gallery/name.jpg');
    });
  });
});
