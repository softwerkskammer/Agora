'use strict';

const conf = require('../../testutil/configureForTest');
const securedByLoginURLRegex = new RegExp(conf.get('securedByLoginURLPattern'));
const expect = require('must-dist');

describe('SecuredByLoginURLRedirect Rule (members)', () => {

  it('secures members/', () => {
    const url = 'http://host/members/';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures members', () => {
    const url = 'http://host/members';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures members/edit', () => {
    const url = 'http://host/members/edit';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures members/new', () => {
    const url = 'http://host/members/new';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures members/something', () => {
    const url = 'http://host/members/something';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures members/submit', () => {
    const url = 'http://host/members/submit';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

});

describe('SecuredByLoginURLRedirect Rule (mailarchive)', () => {

  it('secures members/', () => {
    const url = 'http://host/mailarchive/';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

});

describe('SecuredByLoginURLRedirect Rule (wiki/socrates.*)', () => {

  it('secures wiki/socrates2013', () => {
    const url = 'http://host/wiki/socrates2013/';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures wiki/socrates2014', () => {
    const url = 'http://host/wiki/socrates2014/';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures wiki/socrates2014orga', () => {
    const url = 'http://host/wiki/socrates2014orga/';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

});

describe('SecuredByLoginURLRedirect Rule (*/new)', () => {

  it('secures URLs with activities/new', () => {
    const url = 'http://host/activities/new';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures URLs with groups/new', () => {
    const url = 'http://host/groups/new';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('does secure members/new', () => {
    const url = 'http://host/members/new';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('does secure something/new', () => {
    const url = 'http://host/something/new';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures URLs with something/new/something', () => {
    const url = 'http://host/something/new/something';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

});

describe('SecuredByLoginURLRedirect Rule (*/edit)', () => {

  it('secures URLs with activities/edit', () => {
    const url = 'http://host/activities/edit';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures URLs with groups/edit', () => {
    const url = 'http://host/groups/edit';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('does secure members/edit', () => {
    const url = 'http://host/members/edit';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('does secure something/edit', () => {
    const url = 'http://host/something/edit';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('secures URLs with something/edit/something', () => {
    const url = 'http://host/something/edit/something';
    expect(securedByLoginURLRegex.test(url)).to.be(true);
  });

  it('does not secure URLs with something/something', () => {
    const url = 'http://host/something/something';
    expect(securedByLoginURLRegex.test(url)).to.be(false);
  });

});
