'use strict';

var expect = require('must');
var _ = require('lodash');
var async = require('async');


describe('Lo-Dash', function () {
  describe('curry function', function () {
    it('does not pass undefined when function is invoked with less arguments than specified - be careful!', function () {
      var testfunc = function (arg1, arg2) {
        return arg1 + ' ' + arg2;
      };
      var testfuncCurried = _.curry(testfunc)('Argument1');
      var testfuncPartial = _.partial(testfunc, 'Argument1');
      var testfuncApplied = async.apply(testfunc, 'Argument1');

      expect(testfuncCurried('Argument2')).to.equal('Argument1 Argument2');
      expect(testfuncPartial('Argument2')).to.equal('Argument1 Argument2');
      expect(testfuncApplied('Argument2')).to.equal('Argument1 Argument2');

      expect(testfuncApplied()).to.equal('Argument1 undefined');
      expect(testfuncPartial()).to.equal('Argument1 undefined');

      expect(testfuncCurried()).to.not.equal('Argument1 undefined'); // Trouble!
    });
  });
});
