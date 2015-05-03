'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');
var moment = require('moment-timezone');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var userWithoutMember = require('../../testutil/userWithoutMember');
var accessrights = beans.get('accessrights');

var activitiesService = beans.get('activitiesService');

var Member = beans.get('member');
var SoCraTesActivity = beans.get('socratesActivityExtended');
var createApp = require('../../testutil/testHelper')('socratesRegistrationApp').createApp;

describe('SoCraTes registration application', function () {
  var appWithoutMember = request(createApp({middlewares: [userWithoutMember]}));

  var socratesMember = new Member({
    id: 'memberId2',
    nickname: 'nini',
    email: 'x@y.com',
    site: 'http://my.blog',
    firstname: 'Petra',
    lastname: 'Meier',
    authentications: [],
    socratesOnly: true
  });

  var appWithSocratesMember = request(createApp({member: socratesMember}));

  var socrates = {
    id: 'socratesId',
    title: 'SoCraTes',
    description: 'Coolest event ever :-)',
    location: 'Right next door',
    url: 'socrates-url',
    isSoCraTes: true,
    startUnix: 1440687600,
    endUnix: 1440946800,
    owner: {nickname: "ownerNick"},
    assignedGroup: "assignedGroup",
    group: {groupLongName: "longName"},
    resources: {
      single: {_canUnsubscribe: false, _limit: 0, _position: 2, _registrationOpen: true}, // no capacity
      bed_in_double: {_canUnsubscribe: false, _limit: 10, _position: 3, _registrationOpen: false}, // not opened
      junior: {_canUnsubscribe: false, _limit: 10, _position: 4, _registrationOpen: true},
      bed_in_junior: {_canUnsubscribe: false, _limit: 10, _position: 5, _registrationOpen: true}
    }
  };

  var socratesActivity = new SoCraTesActivity(socrates);

  beforeEach(function () {
    conf.addProperties({registrationOpensAt: moment().subtract(10, 'days').format()}); // already opened
    sinon.stub(activitiesService, 'getActivityWithGroupAndParticipants', function (activityUrl, callback) { callback(null, socratesActivity); });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('before registration is opened', function () {
    beforeEach(function () {
      conf.addProperties({registrationOpensAt: moment().add(10, 'days').format()}); // not opened yet
      conf.addProperties({registrationParam: "secretCode"}); // allows for pre-registration
    });

    it('shows a disabled registration table and the "registration date button"', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<form id="participationinfoform" action="\/registration\/startRegistration" method="post" class="relaxed"><fieldset disabled="disabled"/)
        .expect(/<button type="submit" disabled="disabled" class="pull-right btn btn-primary">Registration will open /)
        .expect(200, done);
    });

    it('does not display that options 1 and 2 are not available', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<th>Single<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="single,2"/)
        .expect(/<th>Double shared<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="bed_in_double,2"/, done);
    });

    it('shows an enabled registration table with initially disabled register button if the registration param is passed along', function (done) {
      appWithoutMember
        .get('/?registration=secretCode')
        .expect(/<form id="participationinfoform" action="\/registration\/startRegistration" method="post" class="relaxed"><fieldset>/)
        .expect(/<th>Junior shared<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="bed_in_junior,2"/)
        .expect(/<button type="submit" disabled="disabled" class="pull-right btn btn-primary">I really do want to participate!/)
        .expect(200, done);
    });


  });

  describe('when registration is opened', function () {

    it('shows an enabled registration table with initially disabled register button if the registration is open', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<form id="participationinfoform" action="\/registration\/startRegistration" method="post" class="relaxed"><fieldset>/)
        .expect(/<th>Junior shared<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="bed_in_junior,2"/)
        .expect(/<button type="submit" disabled="disabled" class="pull-right btn btn-primary">I really do want to participate!/)
        .expect(200, done);
    });

    it('displays that options 1 and 2 are not available', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<th>Double shared<div class="radio-inline/)
        .expect(/<th>Single<div class="radio-inline/, done);
    });

    it('displays the options (but disabled), because the user is registered', function (done) {
      socrates.resources.junior._registeredMembers = [{memberId: 'memberId2'}];

      appWithSocratesMember
        .get('/')
        .expect(/<form id="participationinfoform" action="\/registration\/startRegistration" method="post" class="relaxed"><fieldset disabled="disabled"/)
        .expect(/<th>Single<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="single,2"/)
        .expect(/<th>Double shared<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="bed_in_double,2"/)
        .expect(/<div class="btn pull-right btn btn-success">You are already registered\./, done);
    });

  });

});
