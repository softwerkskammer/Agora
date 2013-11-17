"use strict";

var conf = require('../configureForTest');
var beans = conf.get('beans');
var announcementsInSidebar = beans.get('announcementsInSidebar');
var api = beans.get('announcementsAPI');
var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();

function mockAnouncementsApi(announcements) {
  sinon.stub(api, 'allAnnouncementsUntilToday', function (callback) {
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
  beforeEach(function () {
    res = {locals: {}};
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('shows the latest 3 news if there are no more than 3', function () {
    mockAnouncementsApi([ annOne, annTwo, annThree ]);
    announcementsInSidebar({}, res, function () {});
    expect(res.locals.latestNews.length).to.equal(3);
  });

  it('shows only the latest 5 news if there are more than 5', function () {
    mockAnouncementsApi([ annOne, annTwo, annThree, annFour, annFive, annSix ]);
    announcementsInSidebar({}, res, function () {});
    expect(res.locals.latestNews.length).to.equal(5);
    expect(res.locals.latestNews).to.include(annOne);
    expect(res.locals.latestNews).to.not.include(annSix);
  });

  it('shows only the latest 5 in the order of the persistence', function () {
    mockAnouncementsApi([ annSix, annOne, annTwo, annThree, annFour, annFive ]);
    announcementsInSidebar({}, res, function () {});
    expect(res.locals.latestNews.length).to.equal(5);
    expect(res.locals.latestNews).to.include(annOne);
    expect(res.locals.latestNews).to.not.include(annFive);
  });

  it('signals to show the "more"-link if there are more than 5', function () {
    mockAnouncementsApi([ annOne, annTwo, annThree, annFour, annFive, annSix ]);
    announcementsInSidebar({}, res, function () {});
    expect(res.locals.displayMoreNews).to.be.true;
  });

});

