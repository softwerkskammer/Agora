"use strict";

var should = require('chai').should();
var expect = require('chai').expect;
var conf = require('./../configureForTest');
var persistence = require('../../lib/persistence/persistence')('teststore');
var clearStore = function (callback) {
  persistence.drop(function () {
    callback(); // here we can ignore errors
  });
};

describe('The persistence store', function () {

  beforeEach(clearStore); // if this fails, you need to start your mongo DB

  describe('in general', function () {
    var toPersist = {id: 'toPersist', name: 'Heinz'};

    var storeSampleData = function (done) {
      persistence.save(toPersist, done);
    };


    it('fails to save object without id', function (done) {
      persistence.save({}, function (err) {
        expect(err.message).to.equal("Given object has no valid id");
        done(); // error condition - do not pass err
      });
    });

    it('fails to save object with id null', function (done) {
      persistence.save({id: null}, function (err) {
        expect(err.message).to.equal("Given object has no valid id");
        done(); // error condition - do not pass err
      });
    });

    it('fails to save-with-version object without id', function (done) {
      persistence.saveWithVersion({}, function (err) {
        expect(err.message).to.equal("Given object has no valid id");
        done(); // error condition - do not pass err
      });
    });

    it('fails to save-with-version object with id null', function (done) {
      persistence.saveWithVersion({id: null}, function (err) {
        expect(err.message).to.equal("Given object has no valid id");
        done(); // error condition - do not pass err
      });
    });

    it('on save-with-version, saves an object that is not yet in database and initializes version with 1', function (done) {
      persistence.saveWithVersion({id: 123}, function (err) {
        if (err) {return done(err); }
        persistence.getById(123, function (err, result) {
          expect(result.version).to.equal(1);
          done(err);
        });
      });
    });

    it('on save-with-version, updates an object that is in database with same version', function (done) {
      persistence.save({id: 123, data: "abc", version: 1}, function (err) {
        if (err) {return done(err); }
        persistence.saveWithVersion({id: 123, data: "def", version: 1}, function (err) {
          if (err) {return done(err); }
          persistence.getById(123, function (err, result) {
            expect(result.data).to.equal("def");
            expect(result.version).to.equal(2);
            done(err);
          });
        });
      });
    });

    it('on save-with-version, does not update an object that is in database with a different version', function (done) {
      persistence.save({id: 123, data: "abc", version: 2}, function (err) {
        if (err) {return done(err); }
        var objectToSave = {id: 123, data: "def", version: 1};
        persistence.saveWithVersion(objectToSave, function (err) {
          expect(err.message).to.equal("Conflicting versions.");
          persistence.getById(123, function (err, result) {
            expect(result.data, "Data of object in database remains unchanged").to.equal("abc");
            expect(result.version, "Version of object in database remains unchanged").to.equal(2);
            expect(objectToSave.version, "Version of object to save remains unchanged").to.equal(1);
            done(err);
          });
        });
      });
    });

    it('retrieves none for non-existing id', function (done) {
      persistence.getById('non-existing-id', function (err, result) {
        should.not.exist(result);
        done(err);
      });
    });

    it('retrieves one for existing id', function (done) {
      storeSampleData(function () {
        persistence.getById('toPersist', function (err, result) {
          result.id.should.equal('toPersist');
          result.name.should.equal('Heinz');
          done(err);
        });
      });
    });

    it('retrieves an empty list when no data is inserted', function (done) {
      persistence.list({}, function (err, result) {
        result.length.should.equal(0);
        done(err);
      });
    });

    it('retrieves all', function (done) {
      storeSampleData(function () {
        persistence.list({}, function (err, result) {
          result.length.should.equal(1);
          result[0].name.should.equal('Heinz');
          done(err);
        });
      });
    });

    it('retrieves undefined if the id should be null', function (done) {
      storeSampleData(function () {
        persistence.getById(null, function (err, result) {
          expect(!!err).to.be.false;
          expect(result).to.be.undefined;
          done(err);
        });
      });
    });

    it('retrieves undefined if some field should be null', function (done) {
      storeSampleData(function () {
        persistence.getByField({id: null}, function (err, result) {
          expect(!!err).to.be.false;
          expect(result).to.be.undefined;
          done(err);
        });
      });
    });

  });

  describe('for many objects', function () {
    var user1 = {id: '1', firstname: 'Heinz', lastname: 'Meier'};
    var user2 = {id: '2', firstname: 'Max', lastname: 'Albers'};
    var user3 = {id: '3', firstname: 'Peter', lastname: 'Paulsen'};
    var user4 = {id: '4', firstname: 'Anna', lastname: 'Albers'};

    var storeSampleData = function (done) {
      persistence.save(user1, function () {
        persistence.save(user2, function () {
          persistence.save(user3, function () {
            persistence.save(user4, done);
          });
        });
      });
    };

    var storeSampleDataAtOnce = function (done) {
      persistence.saveAll([user1, user2, user3, user4], done);
    };

    it('retrieves all members in ascending order', function (done) {
      storeSampleData(function () {
        persistence.list({lastname: 1, firstname: 1}, function (err, result) {
          result.length.should.equal(4);
          result[0].firstname.should.equal('Anna');
          result[0].lastname.should.equal('Albers');
          result[1].firstname.should.equal('Max');
          result[1].lastname.should.equal('Albers');
          result[2].firstname.should.equal('Heinz');
          result[2].lastname.should.equal('Meier');
          result[3].firstname.should.equal('Peter');
          result[3].lastname.should.equal('Paulsen');
          done(err);
        });
      });
    });

    it('retrieves those members whose IDs are contained in the list', function (done) {
      storeSampleData(function () {
        persistence.listByIds(['3', '4', '6', 'test'], {lastname: 1, firstname: 1}, function (err, result) {
          result.length.should.equal(2);
          result[0].firstname.should.equal('Anna');
          result[0].lastname.should.equal('Albers');
          result[1].firstname.should.equal('Peter');
          result[1].lastname.should.equal('Paulsen');
          done(err);
        });
      });
    });

    it('stores all objects with one call', function (done) {
      storeSampleDataAtOnce(function () {
        persistence.list({lastname: 1, firstname: 1}, function (err, result) {
          result.length.should.equal(4);
          result[0].firstname.should.equal('Anna');
          result[0].lastname.should.equal('Albers');
          result[1].firstname.should.equal('Max');
          result[1].lastname.should.equal('Albers');
          result[2].firstname.should.equal('Heinz');
          result[2].lastname.should.equal('Meier');
          result[3].firstname.should.equal('Peter');
          result[3].lastname.should.equal('Paulsen');
          done(err);
        });
      });
    });

  });

  describe('for Member', function () {
    var Member = conf.get('beans').get('member');
    var moment = require('moment-timezone');
    var toPersist = new Member().initFromSessionUser({authenticationId: 'toPersist'}).state;

    var storeSampleData = function (done) {
      persistence.save(toPersist, done);
    };

    it('checks that created has been written', function (done) {
      // this test will definitely fail, if run a microsecond before midnight. - Ideas?
      var today = moment().format('DD.MM.YY');
      storeSampleData(function () {
        persistence.getById('toPersist', function (err, result) {
          result.id.should.equal('toPersist');
          should.exist(result.created);
          result.created.should.equal(today);
          done(err);
        });
      });
    });
  });
});
