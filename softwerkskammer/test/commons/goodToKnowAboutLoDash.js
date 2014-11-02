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
      var testfunc_curried = _.curry(testfunc)('Argument1');
      var testfunc_partial = _.partial(testfunc, 'Argument1');
      var testfunc_applied = async.apply(testfunc, 'Argument1');

      expect(testfunc_curried('Argument2')).to.equal('Argument1 Argument2');
      expect(testfunc_partial('Argument2')).to.equal('Argument1 Argument2');
      expect(testfunc_applied('Argument2')).to.equal('Argument1 Argument2');

      expect(testfunc_applied()).to.equal('Argument1 undefined');
      expect(testfunc_partial()).to.equal('Argument1 undefined');

      expect(testfunc_curried()).to.not.equal('Argument1 undefined'); // Trouble!
    });
  });
});
