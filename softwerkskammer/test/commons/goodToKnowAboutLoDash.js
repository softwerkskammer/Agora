'use strict';

const expect = require('must-dist');
const _ = require('lodash');
const async = require('async');

describe('Lo-Dash', () => {
  describe('curry function', () => {
    it('does not pass undefined when function is invoked with less arguments than specified - be careful!', () => {
      const testfunc = (arg1, arg2) => arg1 + ' ' + arg2;
      const testfuncCurried = _.curry(testfunc)('Argument1');
      const testfuncPartial = _.partial(testfunc, 'Argument1');
      const testfuncApplied = async.apply(testfunc, 'Argument1');

      expect(testfuncCurried('Argument2')).to.equal('Argument1 Argument2');
      expect(testfuncPartial('Argument2')).to.equal('Argument1 Argument2');
      expect(testfuncApplied('Argument2')).to.equal('Argument1 Argument2');

      expect(testfuncApplied()).to.equal('Argument1 undefined');
      expect(testfuncPartial()).to.equal('Argument1 undefined');

      expect(testfuncCurried()).to.not.equal('Argument1 undefined'); // Trouble!
    });
  });
});
