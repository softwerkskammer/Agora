'use strict';

require('../../testutil/configureForTest');
var expect = require('must-dist');

var beans = require('simple-configure').get('beans');

var Resources = beans.get('resources');

describe('Resources (fillFromUI)', function () {
  describe('adding / removing children', function () {

    it('does nothing if the name is not changed', function () {
      var resources = new Resources({
        Veranstaltung: {
          _registeredMembers: [
            {memberId: 'memberId'}
          ]
        }
      });

      resources.fillFromUI({names: 'Veranstaltung', limits: '', previousNames: 'Veranstaltung'});

      expect(resources.veranstaltung().registeredMembers().length).to.equal(1);
      expect(resources.veranstaltung().registeredMembers()).to.contain('memberId');
    });

    it('creates the key if the previous name is empty', function () {
      var resources = new Resources({});

      resources.fillFromUI({names: 'Veranstaltung', limits: '', previousNames: ''});

      expect(resources.veranstaltung().registeredMembers().length).to.equal(0);
    });
  });

  describe('integration test', function () {

    it('adheres to values in constructor', function () {
      var resources = new Resources({Veranstaltung: {_limit: 20, _registrationOpen: true, _waitinglist: []}});

      expect(resources.veranstaltung().limit()).to.equal(20);
      expect(resources.veranstaltung().isRegistrationOpen()).to.be(true);
      expect(resources.veranstaltung().hasWaitinglist()).to.be(true);
    });

    it('adds values if given', function () {
      var resources = new Resources({Veranstaltung: {}});

      resources.fillFromUI({
        names: 'Veranstaltung',
        previousNames: 'Veranstaltung',
        limits: '10',
        isRegistrationOpen: 'yes',
        hasWaitinglist: 'yes'
      });

      expect(resources.veranstaltung().limit()).to.equal(10);
      expect(resources.veranstaltung().isRegistrationOpen()).to.be(true);
      expect(resources.veranstaltung().hasWaitinglist()).to.be(true);
    });

    it('removes value if not given', function () {
      var resources = new Resources({Veranstaltung: {_limit: 20, _registrationOpen: true, _withWaitinglist: true}});

      resources.fillFromUI({names: 'Veranstaltung', limits: '', previousNames: 'Veranstaltung'});

      expect(resources.veranstaltung().limit()).to.be(undefined);
      expect(resources.veranstaltung().isRegistrationOpen()).to.be(false);
      expect(resources.veranstaltung().hasWaitinglist()).to.be(false);
    });
  });

});
