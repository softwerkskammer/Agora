/*global describe, it */
"use strict";

var Group = require('../../lib/groups/group');
var expect = require('chai').expect;

describe('Group object', function () {

  it('should deliver two types of groups', function (done) {
    var group = new Group();
    var allTypes = group.allTypes();
    expect(allTypes.length).to.equal(2);
    expect(allTypes).to.contain('Themengruppe');
    expect(allTypes).to.contain('Regionalgruppe');
    done();
  });

  it('should deliver the correct type code for Themengruppe', function (done) {
    var group = new Group(null, null, null, 'Themengruppe');
    expect(group.typeCode()).to.equal(0);
    done();
  });

  it('should deliver the correct type code for Regionalgruppe', function (done) {
    var group = new Group(null, null, null, 'Regionalgruppe');
    expect(group.typeCode()).to.equal(1);
    done();
  });

});
