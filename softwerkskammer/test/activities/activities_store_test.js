'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var persistence = beans.get('activitiesPersistence');
var store = beans.get('activitystore');
var Activity = beans.get('activity');
var Resource = beans.get('resource');
var SoCraTesActivity = beans.get('socratesActivity');

describe('Activity store', function () {
  var activity1 = {title: 'CodingDojo1', url: 'CodingDojo1', description: 'bli'};
  var activity2 = {title: 'CodingDojo2', url: 'CodingDojo2', description: 'bla'};
  var socrates = {
    id: 'socratesId',
    title: 'SoCraTes',
    description: 'Coolest event ever :-)',
    location: 'Right next door',
    url: 'socrates-url',
    isSoCraTes: true,
    startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.02.2014'),
    endUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('15.02.2014'),
    owner: {nickname: 'ownerNick'},
    assignedGroup: 'assignedGroup',
    group: {groupLongName: 'longName'}
  };
  var sampleList;
  var getByField;
  var getById;
  var list;

  beforeEach(function () {
    sampleList = [activity1, activity2];

    list = sinon.stub(persistence, 'list', function (sortOrder, callback) {
      return callback(null, sampleList);
    });
    sinon.stub(persistence, 'listByField', function (searchObject, sortOrder, callback) {
      return callback(null, sampleList);
    });
    getByField = sinon.stub(persistence, 'getByField', function (object, callback) {
      return callback(null, activity1);
    });
    getById = sinon.stub(persistence, 'getById', function (id, callback) {
      if (id === 'socrates') {
        return callback(null, socrates);
      }
      return callback(null, activity1);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('calls persistence.list for store.allActivities and transforms the result to an Activity', function (done) {
    store.allActivities(function (err, activities) {
      expect(activities[0].title()).to.equal(activity1.title);
      expect(activities[1].title()).to.equal(activity2.title);
      expect(activities[0].descriptionHTML()).to.contain('bli');
      expect(activities[1].descriptionHTML()).to.contain('bla');
      done(err);
    });
  });

  it('calls persistence.getByField for store.getActivity and transforms the result to an Activity', function (done) {
    var url = activity1.url;
    store.getActivity(url, function (err, activity) {
      expect(activity.title()).to.equal(activity1.title);
      expect(getByField.calledWith({url: url})).to.be(true);
      expect(activity.descriptionHTML()).to.contain('bli');
      done(err);
    });
  });

  it('calls persistence.getById for store.getActivityForId and transforms the result to an Activity', function (done) {
    var id = 'id';
    store.getActivityForId(id, function (err, activity) {
      expect(activity.title()).to.equal(activity1.title);
      expect(getById.calledWith(id)).to.be(true);
      expect(activity.descriptionHTML()).to.contain('bli');
      done(err);
    });
  });

  it('returns an activity object for the given id although the persistence only returns a JS object', function (done) {
    getByField.restore();
    sinon.stub(persistence, 'getByField', function (id, callback) { return callback(null, {url: 'activityUrl'}); });

    store.getActivity('activityUrl', function (err, result) {
      expect(result.url()).to.equal('activityUrl');
      done(err);
    });
  });

  it('returns null when id does not exist', function (done) {
    getByField.restore();
    sinon.stub(persistence, 'getByField', function (id, callback) { callback(); });

    store.getActivity(1234, function (err, result) {
      expect(result).to.be(null);
      done(err);
    });
  });

  it('returns undefined when persistence yields an error', function (done) {
    getByField.restore();
    sinon.stub(persistence, 'getByField', function (id, callback) { callback(new Error('error')); });

    store.getActivity(1234, function (err, result) {
      expect(err).to.exist();
      expect(result).to.not.exist();
      done(); // error condition - do not pass err
    });
  });

  it('returns all activites although the persistence only returns JS objects', function (done) {
    list.restore();
    sinon.stub(persistence, 'list', function (sortOrder, callback) { callback(null, [{url: 'activityUrl'}]); });

    store.allActivities(function (err, result) {
      expect(result).to.have.length(1);
      expect(result[0].url()).to.equal('activityUrl');
      done(err);
    });
  });

  it('returns upcoming activities', function (done) {
    store.upcomingActivities(function (err, result) {
      expect(result).to.have.length(2);
      done(err);
    });
  });

  it('returns past activities', function (done) {
    store.pastActivities(function (err, result) {
      expect(result).to.have.length(2);
      done(err);
    });
  });

  it('calls persistence.remove for store.removeActivity and passes on the given callback', function (done) {
    var remove = sinon.stub(persistence, 'remove', function (memberId, callback) { callback(); });
    var activity = new Activity(activity1);
    activity.state.id = 'I D';
    store.removeActivity(activity, function (err) {
      expect(remove.calledWith('I D')).to.be(true);
      done(err);
    });
  });

  describe('builds a SoCraTesActivity', function () {
    var id = 'socrates';
    it('on fetching a single activity - when the isSoCraTes flag is set', function (done) {
      store.getActivityForId(id, function (err, activity) {
        expect(activity).to.be.a(SoCraTesActivity);
        done(err);
      });
    });

    it('on fetching all activities - when the isSoCraTes flag is set', function (done) {
      sampleList = [socrates];

      store.allActivities(function (err, activities) {
        expect(activities[0]).to.be.a(SoCraTesActivity);
        done(err);
      });
    });

    it('that shows all required data for the overview and the calendar in SWK and for display and edit in SoCraTes', function (done) {
      store.getActivityForId(id, function (err, activity) {
        expect(activity.id()).to.equal('socratesId');
        expect(activity.title()).to.equal('SoCraTes');
        expect(activity.startMoment().toString()).to.equal('Sat Feb 01 2014 00:00:00 GMT+0100');
        expect(activity.endMoment().toString()).to.equal('Sat Feb 15 2014 00:00:00 GMT+0100');
        expect(activity.fullyQualifiedUrl()).to.equal('https://socrates.com:12345');
        expect(activity.url()).to.equal('socrates-url');
        expect(activity.allRegisteredMembers()).to.eql([]);
        expect(activity.resourceNames()).to.eql(['Veranstaltung']);
        expect(activity.resourceNamed('Veranstaltung')).to.eql(new Resource({
          _registeredMembers: [],
          _registrationOpen: true
        }, 'Veranstaltung'));
        expect(activity.isMultiDay()).to.be(true);
        expect(activity.location()).to.be('Right next door');
        expect(activity.assignedGroup()).to.be('G');
        expect(activity.owner()).to.eql({nickname: 'ownerNick'});
        expect(activity.groupName()).to.be(undefined);
        expect(activity.colorFrom()).to.equal('#3771C8'); // fixed SoCraTes color
        expect(activity.groupFrom()).to.equal(undefined);
        done(err);
      });
    });

    it('flattensAndSorts a mongo result completely', function () {
      var nestedMongoResult = [{
        value: [
          [
            [
              {startUnix: 3}, {startUnix: 7}, {startUnix: 2}
            ],
            {startUnix: 1}, {startUnix: 6}, {startUnix: 5}
          ],
          {startUnix: 4}, {startUnix: 9}, {startUnix: 8}
        ]
      }];
      var result = store.flattenAndSortMongoResultCollection(nestedMongoResult);
      expect(result).to.eql([
        {startUnix: 1}, {startUnix: 2}, {startUnix: 3},
        {startUnix: 4}, {startUnix: 5}, {startUnix: 6},
        {startUnix: 7}, {startUnix: 8}, {startUnix: 9}
      ]);
    });

  });
});
