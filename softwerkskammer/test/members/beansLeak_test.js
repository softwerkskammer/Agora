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
      const beans1a = new CoolBeans({[moduleName]: '1a'});
      const beans1b = new CoolBeans({[moduleName]: '2'});
      const beans2 = new CoolBeans({[moduleName]: '1b'});
      const module1a = beans1a.get(moduleName);
      const module2 = beans2.get(moduleName);
      const module1b = beans1b.get(moduleName);
      expect(module1a).to.not.be(module2);
      expect(module1b).to.not.be(module2);
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


