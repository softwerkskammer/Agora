'use strict';

var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');

var managementService = beans.get('managementService');

describe('Management Service', function () {

  describe('when calculating durations', function () {

    it('counts each value', function () {
      var resA = {durations: function () { return [2, 2, 4, 3, 5, 2, 3]; }};
      var resB = {durations: function () { return [2, 2, 4, 3, 5, 2, 3]; }};
      var activity = {
        resourceNames: function () { return ['a', 'b']; },
        socratesResourceNamed: function (name) {
          if (name === 'a') { return resA; }
          if (name === 'b') { return resB; }
        }
      };
      var durations = managementService.durations(activity);
      expect(durations).to.have.ownKeys(['2', '3', '4', '5']);
      expect(durations[2]).to.eql({count: 6, duration: 'saturday evening', total: 14});
      expect(durations[3]).to.eql({count: 4, duration: 'sunday morning', total: 8});
      expect(durations[4]).to.eql({count: 2, duration: 'sunday evening', total: 4});
      expect(durations[5]).to.eql({count: 2, duration: 'monday morning', total: 2});
    });

    it('counts only durations that are present', function () {
      var resA = {durations: function () { return [2, 2, 5]; }};
      var resB = {durations: function () { return [2, 2, 4]; }};
      var activity = {
        resourceNames: function () { return ['a', 'b']; },
        socratesResourceNamed: function (name) {
          if (name === 'a') { return resA; }
          if (name === 'b') { return resB; }
        }
      };
      var durations = managementService.durations(activity);
      expect(durations).to.have.ownKeys(['2', '4', '5']);
      expect(durations[2]).to.eql({count: 4, duration: 'saturday evening', total: 6});
      expect(durations[4]).to.eql({count: 1, duration: 'sunday evening', total: 2});
      expect(durations[5]).to.eql({count: 1, duration: 'monday morning', total: 1});
    });

  });

});
