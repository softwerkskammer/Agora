/*global describe, it */
"use strict";

var nconf = require('../configure');
var expect = require('chai').expect;
var securedByLoginURLRegex = new RegExp(nconf.get('securedByLoginURLPattern'));


describe('default secure URL configuration', function () {

  it('should secure \/members\/ pages except "submit"', function (done) {
    expect(securedByLoginURLRegex.test('/members')).to.be.true;
    expect(securedByLoginURLRegex.test('/members/new')).to.be.true;
    expect(securedByLoginURLRegex.test('/members/submit')).to.be.false;
    done();
  });

  it('should secure \/administration\/ pages', function (done) {
    expect(securedByLoginURLRegex.test('/groups/administration')).to.be.true;
    expect(securedByLoginURLRegex.test('/members/administration')).to.be.true;
    expect(securedByLoginURLRegex.test('/something/administration')).to.be.true;
    done();
  });

  it('should secure \/edit\/ pages', function (done) {
    expect(securedByLoginURLRegex.test('/groups/edit/')).to.be.true;
    expect(securedByLoginURLRegex.test('/something/edit/')).to.be.true;
    done();
  });

  it('should secure \/new\/ pages', function (done) {
    expect(securedByLoginURLRegex.test('/groups/new')).to.be.true;
    expect(securedByLoginURLRegex.test('/something/new')).to.be.true;
    done();
  });

});
