'use strict';

require('../../testutil/configureForTest');
var conf = require('nconf');
var expect = require('must');

var ActivityResult = conf.get('beans').get('activityresult');

describe('An activity result', function () {
  it('should have an id', function () {
    var activityResult = new ActivityResult({id: "hackergarten2_2"});
    expect(activityResult.id).to.be('hackergarten2_2');
  });
});
