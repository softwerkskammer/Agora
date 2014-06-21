'use strict';

require('../../testutil/configureForTest');
var conf = require('nconf');
var expect = require('must');
var should = require('should');

var ActivityResult = conf.get('beans').get('activityresult');

describe('An activity result', function () {
  it('should have an id', function () {
    var activityResult = new ActivityResult({id: "hackergarten2_2"});
    expect(activityResult.id).to.be('hackergarten2_2');
  });

  it('should have a list of photo urls', function () {
    var activityResult = new ActivityResult({
      id: 'hackergarten2_2',
      photos: [
        {uri: '/path/to/image1.jpg'},
        {uri: '/path/to/image2.jpg'}
      ]
    });

    activityResult.photos.should.containEql({uri: '/path/to/image1.jpg'});
    activityResult.photos.should.containEql({uri: '/path/to/image2.jpg'});

  });
});
