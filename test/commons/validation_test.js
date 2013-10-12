"use strict";

var conf = require('../configureForTest');
var validation = conf.get('beans').get('validation');
var expect = require('chai').expect;

describe('isValidGroup function', function () {

  it('allows groupnames that contain no special characters', function () {
    expect(validationErrorsOf("Gruppe")).to.be.empty;
  });

  it('allows groupnames that contain ü, ö, ä', function () {
    expect(validationErrorsOf("Grüppe")).to.be.empty;
    expect(validationErrorsOf("Gräppe")).to.be.empty;
    expect(validationErrorsOf("Gröppe")).to.be.empty;
  });

  it('allows groupnames that contain Ü, Ä, Ö', function () {
    expect(validationErrorsOf("GrÜppe")).to.be.empty;
    expect(validationErrorsOf("GrÄppe")).to.be.empty;
    expect(validationErrorsOf("GrÖppe")).to.be.empty;
  });

  it('allows groupnames that contain ß', function () {
    expect(validationErrorsOf("Grßppe")).to.be.empty;
  });
  

  function validationErrorsOf(groupname) {
    return validation.isValidGroup({ id : groupname, emailPrefix : "12345", longName : "a", description : "a", type : "a"});
  }

});
