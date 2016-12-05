'use strict';

const expect = require('must-dist');
const CoolBeans = require('CoolBeans');

describe('configureForTest issue', () => {
  it('allows to configure different beans per test', () => {
      const moduleName = 'membersPersistence';
      const module1a = require('../../testutil/configureForTest').get('beans').get(moduleName);
      const module2 = require('../../testutil/configureForTestWithDB').get('beans').get(moduleName);
      const module1b = require('../../testutil/configureForTest').get('beans').get(moduleName);
      expect(module1a).to.not.be(module2);
      expect(module1b).to.not.be(module2);
  });

  it('is not caused by underlying beans library', () => {
      const moduleName = 'membersPersistence';
      const beans1a = new CoolBeans({[moduleName]: {properties: {value: '1a'}}});
      const beans1b = new CoolBeans({[moduleName]: {properties: { value: '1b'}}});
      const beans2 = new CoolBeans({[moduleName]: {properties:{value: '2'}}});
      const module1a = beans1a.get(moduleName).value;
      const module2 = beans2.get(moduleName).value;
      const module1b = beans1b.get(moduleName).value;
      expect(module1a).to.be('1a');
      expect(module2).to.be('2');
      expect(module1b).to.be('1b');
  });

  it('is caused by simpe-configure', () => {
    const conf1 = require('simple-configure');
    conf1.addProperties({a: 1});
    const conf2 = require('simple-configure');
    conf2.addProperties({a: 2});
    expect(conf1.get('a')).to.be(1);
    expect(conf2.get('a')).to.be(2);
  });
});


