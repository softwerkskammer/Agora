"use strict";

var conf = require('../configureForTest');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var expect = require('chai').expect;

describe('Activity application', function () {

  // tested function is currently not used in production anymore (28.4.2013, leider)
  it('removes all special characters from the id string', function () {
    var id = fieldHelpers.createLinkFrom(['assignedGroup', 'title', 'startDate']);
    expect(id).to.equal('assignedGroup_title_startDate');

    var tmpId = fieldHelpers.createLinkFrom(['assignedGroup', '?!tit le?!', '2012-11-11']);
    expect(tmpId).to.equal('assignedGroup___tit_le___2012-11-11');
  });

});
