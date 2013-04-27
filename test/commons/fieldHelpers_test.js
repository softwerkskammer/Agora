/*global describe, it */
"use strict";
var fieldHelpers = require('../../lib/commons/fieldHelpers');

describe('Activity application', function () {

  it('removes all special characters from the id string', function () {
    var id = fieldHelpers.createLinkFrom(['assignedGroup', 'title', 'startDate']);
    id.should.equal('assignedGroup_title_startDate');

    var tmpId = fieldHelpers.createLinkFrom(['assignedGroup', '?!tit le?!', '2012-11-11']);
    tmpId.should.equal('assignedGroup___tit_le___2012-11-11');
  });

});
