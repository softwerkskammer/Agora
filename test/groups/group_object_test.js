"use strict";

var conf = require('../configureForTest');

var Group = conf.get('beans').get('group');
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
    var group = new Group({id: 'abc', type: 'Themengruppe'});
    expect(group.typeCode()).to.equal(0);
    done();
  });

  it('should deliver the correct type code for Regionalgruppe', function (done) {
    var group = new Group({id: 'abc', type: 'Regionalgruppe'});
    expect(group.typeCode()).to.equal(1);
    done();
  });

  it('should transform the id to lowercase', function (done) {
    var group = new Group({id: 'NeuePlattform'});
    expect(group.id).to.equal('neueplattform');
    done();
  });

});
