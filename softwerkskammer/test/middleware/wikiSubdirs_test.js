'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var wikiSubdirs = beans.get('wikiSubdirs');
var Git = beans.get('gitmech');
var Group = beans.get('group');
var groupstore = beans.get('groupstore');

describe('Wikisubdirs', function () {
  var allGroups = [
    new Group({id: 'a', type: Group.allTypes()[0]}),
    new Group({id: 'b', type: Group.allTypes()[0]}),
    new Group({id: 'c', type: Group.allTypes()[1]}),
    new Group({id: 'groupWithoutWiki', type: Group.allTypes()[1]})
  ];
  beforeEach(function () {
    sinon.stub(Git, 'lsdirs', function (callback) {
      callback(null, ['a', 'c', 'b', 'andere']);
    });
    sinon.stub(groupstore, 'allGroups', function (callback) {
      callback(null, allGroups);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('transforms the dirs and groups correctly', function () {
    var req = {
      originalUrl: '/something',
      headers: {},
      cookies: {},
      signedCookies: {}
    };
    var res = { locals: {} };
    var next = function () { return ''; };
    wikiSubdirs(req, res, next);
    expect(res.locals.structuredWikisubdirs.regional).to.eql(['c']);
    expect(res.locals.structuredWikisubdirs.themed).to.eql(['a', 'b']);
    expect(res.locals.structuredWikisubdirs.other).to.eql(['andere']);
  });

});

