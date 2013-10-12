"use strict";

var conf = require('../configureForTest');
var validation = conf.get('beans').get('validation');
var expect = require('chai').expect;

describe('isValidGroup function', function () {

  it('allows groupnames that contain no special characters', function () {
    expect(isValidGroup("Gruppe")).to.be.empty;
  });

  it('allows groupnames that contain ü, ö, ä', function () {
    expect(isValidGroup("Grüppe")).to.be.empty;
    expect(isValidGroup("Gräppe")).to.be.empty;
    expect(isValidGroup("Gröppe")).to.be.empty;
  });

  it('allows groupnames that contain Ü, Ä, Ö', function () {
    expect(isValidGroup("GrÜppe")).to.be.empty;
    expect(isValidGroup("GrÄppe")).to.be.empty;
    expect(isValidGroup("GrÖppe")).to.be.empty;
  });

  it('allows groupnames that contain ß', function () {
    expect(isValidGroup("Grßppe")).to.be.empty;
  });
  

  function isValidGroup(groupname) {
    return validation.isValidGroup({ id : groupname, emailPrefix : "12345", longName : "a", description : "a", type : "a"});
  }

});
