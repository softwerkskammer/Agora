"use strict";
var chai = require("chai");
var expect = chai.expect;

require('../configureForTest');
var beans = require('nconf').get('beans');
var validation = beans.get('validation');

describe('Validation', function () {



  describe('isValidForMember', function () {
    it('performs many checks simultaneously', function () {
      var result = validation.isValidForMember({});

      expect(result.length).to.equal(9);
    });

    it('does not validate an empty body without nickname', function () {
      var result = validation.isValidForMember({});

      expect(result).to.contain('Nickname ist ein Pflichtfeld.');
    });
  });


  describe('isValidForActivity', function () {
    it('performs many checks simultaneously', function () {
      var result = validation.isValidForActivity({});

      expect(result.length).to.equal(8);
    });

    it('does not validate activity input without title', function () {
      var result = validation.isValidForActivity({});

      expect(result).to.contain('Titel ist ein Pflichtfeld.');
    });

    it('does not validate resource names of activity input without resources', function () {
      var result = validation.isValidForActivity({});

      expect(result).to.contain('Es muss mindestens eine Ressourcenbezeichnung angegeben werden.');
    });

    it('does not validate resource names of activity input without resource names', function () {
      var result = validation.isValidForActivity({ resources: {} });

      expect(result).to.contain('Es muss mindestens eine Ressourcenbezeichnung angegeben werden.');
    });

    it('does not validate resource names of activity input with an empty resource name', function () {
      var result = validation.isValidForActivity({ resources: {names: ''} });

      expect(result).to.contain('Es muss mindestens eine Ressourcenbezeichnung angegeben werden.');
    });

    it('does not validate resource names of activity input with an empty resource name array', function () {
      var result = validation.isValidForActivity({ resources: {names: []} });

      expect(result).to.contain('Es muss mindestens eine Ressourcenbezeichnung angegeben werden.');
    });

    it('does not validate resource names of activity input with several empty resource names', function () {
      var result = validation.isValidForActivity({ resources: {names: ['', '']} });

      expect(result).to.contain('Es muss mindestens eine Ressourcenbezeichnung angegeben werden.');
    });

    it('validates resource names of activity input with a non-empty resource name', function () {
      var result = validation.isValidForActivity({ resources: { names: 'hello'} });

      expect(result).to.not.contain('Es muss mindestens eine Ressourcenbezeichnung angegeben werden.');
    });

    it('validates resource names of activity input with at least one non-empty resource name', function () {
      var result = validation.isValidForActivity({ resources: { names: ['', 'hello', '']} });

      expect(result).to.not.contain('Es muss mindestens eine Ressourcenbezeichnung angegeben werden.');
    });

    //////

    it('validates resource limits of activity input without resources', function () {
      var result = validation.isValidForActivity({});

      expect(result).to.not.contain('Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.');
    });

    it('validates resource limits of activity input without resource limits', function () {
      var result = validation.isValidForActivity({ resources: {} });

      expect(result).to.not.contain('Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.');
    });

    it('validates resource limits of activity input with an empty resource limit', function () {
      var result = validation.isValidForActivity({ resources: {limits: ''} });

      expect(result).to.not.contain('Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.');
    });

    it('validates resource limits of activity input with an empty resource limit array', function () {
      var result = validation.isValidForActivity({ resources: {limits: []} });

      expect(result).to.not.contain('Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.');
    });

    it('validates resource limits of activity input with several empty resource limits', function () {
      var result = validation.isValidForActivity({ resources: {limits: ['', '']} });

      expect(result).to.not.contain('Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.');
    });

    it('validates resource limits of activity input with an int resource limit', function () {
      var result = validation.isValidForActivity({ resources: { limits: '10'} });

      expect(result).to.not.contain('Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.');
    });

    it('validates resource limits of activity input with at least one int resource limit', function () {
      var result = validation.isValidForActivity({ resources: { limits: ['', '-77', '']} });

      expect(result).to.not.contain('Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.');
    });

    it('does not validate resource limits of activity input with a non-int decimal resource limit', function () {
      var result = validation.isValidForActivity({ resources: { limits: '7.5'} });

      expect(result).to.contain('Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.');
    });

    it('does not validate resource limits of activity input with a textual resource limit', function () {
      var result = validation.isValidForActivity({ resources: { limits: 'abc'} });

      expect(result).to.contain('Die Ressourcenbeschränkungen dürfen nur aus Ziffern bestehen.');
    });

    //////

    it('does not validate uniqueness of activity input with two identical resource names', function () {
      var result = validation.isValidForActivity({ resources: { names: ['a', 'a']} });

      expect(result).to.contain('Die Bezeichnungen der Ressourcen müssen eindeutig sein.');
    });

    it('validates uniqueness of activity input with one resource name', function () {
      var result = validation.isValidForActivity({ resources: { names: 'a'} });

      expect(result).to.not.contain('Die Bezeichnungen der Ressourcen müssen eindeutig sein.');
    });

    it('validates uniqueness of activity input with two different resource names', function () {
      var result = validation.isValidForActivity({ resources: { names: ['a', 'b']} });

      expect(result).to.not.contain('Die Bezeichnungen der Ressourcen müssen eindeutig sein.');
    });

    it('validates uniqueness of activity input with two empty resource names', function () {
      var result = validation.isValidForActivity({ resources: { names: ['', '']} });

      expect(result).to.not.contain('Die Bezeichnungen der Ressourcen müssen eindeutig sein.');
    });

    it('does not validate start and end of activity input when end date is before start date', function () {
      var result = validation.isValidForActivity({ startDate: "01.01.2013", startTime: "12:00", endDate: "01.10.2012", endTime: "12:00" });

      expect(result).to.contain('Start muss vor Ende liegen.');
    });

    it('does not validate start and end of activity input when end time is before start time', function () {
      var result = validation.isValidForActivity({ startDate: "01.01.2013", startTime: "12:00", endDate: "01.01.2013", endTime: "11:00" });

      expect(result).to.contain('Start muss vor Ende liegen.');
    });

    it('does not validate start and end of activity input when end time is same as start time', function () {
      var result = validation.isValidForActivity({ startDate: "01.01.2013", startTime: "12:00", endDate: "01.01.2013", endTime: "12:00" });

      expect(result).to.contain('Start muss vor Ende liegen.');
    });

    it('validates start and end of activity input when end is after start', function () {
      var result = validation.isValidForActivity({ startDate: "01.01.2013", startTime: "12:00", endDate: "01.01.2013", endTime: "13:00" });

      expect(result).to.not.contain('Start muss vor Ende liegen.');
    });

  });

});
