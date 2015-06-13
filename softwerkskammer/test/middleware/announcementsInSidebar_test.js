'use strict';

var beans = require('../../testutil/configureForTest').get('beans');
var announcementsInSidebar = beans.get('announcementsInSidebar');
var store = beans.get('announcementstore');
var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

function stubAnouncements(announcements) {
  sinon.stub(store, 'allAnnouncementsUntilToday', function (callback) {
    callback(null, announcements);
  });
}
var annOne = {id: 1};
var annTwo = {id: 2};
var annThree = {id: 3};
var annFour = {id: 4};
var annFive = {id: 5};
var annSix = {id: 6};

var res;

describe('Announcements in Sidebar', function () {
  var next = function () { return undefined; };
  beforeEach(function () {
    res = {locals: {}};
  });

  afterEach(function () {
    sinon.restore();
  });

  it('shows the latest 3 news if there are no more than 3', function () {
    stubAnouncements([ annOne, annTwo, annThree ]);
    announcementsInSidebar({}, res, next);
    expect(res.locals.latestNews.length).to.equal(3);
  });

  it('shows only the latest 5 news if there are more than 5', function () {
    stubAnouncements([ annOne, annTwo, annThree, annFour, annFive, annSix ]);
    announcementsInSidebar({}, res, next);
    expect(res.locals.latestNews.length).to.equal(5);
    expect(res.locals.latestNews).to.include(annOne);
    expect(res.locals.latestNews).to.not.include(annSix);
  });

  it('shows only the latest 5 in the order of the persistence', function () {
    stubAnouncements([ annSix, annOne, annTwo, annThree, annFour, annFive ]);
    announcementsInSidebar({}, res, next);
    expect(res.locals.latestNews.length).to.equal(5);
    expect(res.locals.latestNews).to.include(annOne);
    expect(res.locals.latestNews).to.not.include(annFive);
  });

  it('signals to show the "more"-link if there are more than 5', function () {
    stubAnouncements([ annOne, annTwo, annThree, annFour, annFive, annSix ]);
    announcementsInSidebar({}, res, next);
    expect(res.locals.displayMoreNews).to.be(true);
  });

});

