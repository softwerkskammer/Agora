'use strict';

const expect = require('must-dist');
const beans = require('./../../testutil/configureForTest').get('beans');
const CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
const persistence = require('../../lib/persistence/persistence')('teststore');

function clearStore(callback) {
  persistence.drop(() => {
    callback(); // here we can ignore errors
  });
}

describe('The persistence store', () => {

  beforeEach(clearStore); // if this fails, you need to start your mongo DB

  describe('in general', () => {
    const toPersist = {id: 'toPersist', name: 'Heinz'};

    const storeSampleData = done => {
      persistence.save(toPersist, done);
    };

    describe('on save', () => {
      it('fails to save object without id', done => {
        persistence.save({}, err => {
          expect(err.message).to.equal('Given object has no valid id');
          done(); // error condition - do not pass err
        });
      });

      it('fails to save object with id null', done => {
        persistence.save({id: null}, err => {
          expect(err.message).to.equal('Given object has no valid id');
          done(); // error condition - do not pass err
        });
      });
    });

    describe('on save-with-version', () => {
      it('fails to save-with-version object without id', done => {
        persistence.saveWithVersion({}, err => {
          expect(err.message).to.equal('Given object has no valid id');
          done(); // error condition - do not pass err
        });
      });

      it('fails to save-with-version object with id null', done => {
        persistence.saveWithVersion({id: null}, err => {
          expect(err.message).to.equal('Given object has no valid id');
          done(); // error condition - do not pass err
        });
      });

      it('on save-with-version, saves an object that is not yet in database and initializes version with 1', done => {
        persistence.saveWithVersion({id: 123}, err => {
          if (err) {return done(err); }
          persistence.getById(123, (err1, result) => {
            expect(result.version).to.equal(1);
            done(err1);
          });
        });
      });

      it('on save-with-version, updates an object that is in database with same version', done => {
        persistence.save({id: 123, data: 'abc', version: 1}, err => {
          if (err) {return done(err); }
          persistence.saveWithVersion({id: 123, data: 'def', version: 1}, err1 => {
            if (err1) {return done(err1); }
            persistence.getById(123, (err2, result) => {
              expect(result.data).to.equal('def');
              expect(result.version).to.equal(2);
              done(err2);
            });
          });
        });
      });

      it('on save-with-version, does not update an object that is in database with a different version', done => {
        persistence.save({id: 123, data: 'abc', version: 2}, err => {
          if (err) {return done(err); }
          const objectToSave = {id: 123, data: 'def', version: 1};
          persistence.saveWithVersion(objectToSave, err1 => {
            expect(err1.message).to.equal(CONFLICTING_VERSIONS);
            persistence.getById(123, (err2, result) => {
              expect(result.data, 'Data of object in database remains unchanged').to.equal('abc');
              expect(result.version, 'Version of object in database remains unchanged').to.equal(2);
              expect(objectToSave.version, 'Version of object to save remains unchanged').to.equal(1);
              done(err2);
            });
          });
        });
      });
    });

    describe('on update', () => {
      it('replaces old object with new object', done => {
        storeSampleData(() => {
          persistence.update({id: 'toPersist', firstname: 'Peter'}, 'toPersist', err => {
            if (err) { done(err); }
            persistence.getById('toPersist', (err1, result) => {
              expect(result.id).to.equal('toPersist');
              expect(result.name).to.be.undefined();
              expect(result.firstname).to.equal('Peter');
              done(err1);
            });
          });
        });
      });

      it('replaces old object with new object even if id\'s differ', done => {
        storeSampleData(() => {
          persistence.update({id: 'toPersist2', name: 'Heinz'}, 'toPersist', err => {
            if (err) { done(err); }
            persistence.getById('toPersist', (err1, result) => {
              expect(result).to.be.undefined();
              persistence.getById('toPersist2', (err2, result1) => {
                expect(result1.id).to.equal('toPersist2');
                expect(result1.name).to.equal('Heinz');
                done(err2);
              });
            });
          });
        });
      });
    });

    describe('on getById', () => {
      it('retrieves none for non-existing id', done => {
        persistence.getById('non-existing-id', (err, result) => {
          expect(result).not.to.exist();
          done(err);
        });
      });

      it('retrieves one for existing id', done => {
        storeSampleData(() => {
          persistence.getById('toPersist', (err, result) => {
            expect(result.id).to.equal('toPersist');
            expect(result.name).to.equal('Heinz');
            done(err);
          });
        });
      });

      it('retrieves undefined if the id should be null', done => {
        storeSampleData(() => {
          persistence.getById(null, (err, result) => {
            expect(err).not.to.exist();
            expect(result).to.be(undefined);
            done(err);
          });
        });
      });
    });

    describe('on list', () => {
      it('retrieves an empty list when no data is inserted', done => {
        persistence.list({}, (err, result) => {
          expect(result).to.have.length(0);
          done(err);
        });
      });

      it('retrieves all', done => {
        storeSampleData(() => {
          persistence.list({}, (err, result) => {
            expect(result).to.have.length(1);
            expect(result[0].name).to.equal('Heinz');
            done(err);
          });
        });
      });
    });

    describe('on getByField', () => {
      it('retrieves undefined if some field should be null', done => {
        storeSampleData(() => {
          persistence.getByField({id: null}, (err, result) => {
            expect(err).not.to.exist();
            expect(result).to.be(undefined);
            done(err);
          });
        });
      });
    });

    describe('on remove', () => {
      it('removes an object having an id', done => {
        storeSampleData(() => {
          persistence.remove('toPersist', err1 => {
            if (err1) { return done(err1); }
            persistence.getById('toPersist', (err2, result) => {
              expect(result).to.be.undefined();
              done(err2);
            });
          });
        });
      });

      it('cannot remove an object with no id', done => {
        persistence.remove(undefined, err => {
          expect(err.message).to.equal('Given object has no valid id');
          done();
        });
      });
    });
  });

  describe('for many objects', () => {
    const user1 = {id: '1', firstname: 'Heinz', lastname: 'Meier'};
    const user2 = {id: '2', firstname: 'Max', lastname: 'Albers'};
    const user3 = {id: '3', firstname: 'Peter', lastname: 'Paulsen'};
    const user4 = {id: '4', firstname: 'Anna', lastname: 'Albers'};

    const storeSampleData = done => {
      persistence.save(user1, () => {
        persistence.save(user2, () => {
          persistence.save(user3, () => {
            persistence.save(user4, done);
          });
        });
      });
    };

    const storeSampleDataAtOnce = done => {
      persistence.saveAll([user1, user2, user3, user4], done);
    };

    it('retrieves all members in ascending order', done => {
      storeSampleData(() => {
        persistence.list({lastname: 1, firstname: 1}, (err, result) => {
          expect(result).to.have.length(4);
          expect(result[0].firstname).to.equal('Anna');
          expect(result[0].lastname).to.equal('Albers');
          expect(result[1].firstname).to.equal('Max');
          expect(result[1].lastname).to.equal('Albers');
          expect(result[2].firstname).to.equal('Heinz');
          expect(result[2].lastname).to.equal('Meier');
          expect(result[3].firstname).to.equal('Peter');
          expect(result[3].lastname).to.equal('Paulsen');
          done(err);
        });
      });
    });

    it('retrieves those members whose IDs are contained in the list', done => {
      storeSampleData(() => {
        persistence.listByIds(['3', '4', '6', 'test'], {lastname: 1, firstname: 1}, (err, result) => {
          expect(result).to.have.length(2);
          expect(result[0].firstname).to.equal('Anna');
          expect(result[0].lastname).to.equal('Albers');
          expect(result[1].firstname).to.equal('Peter');
          expect(result[1].lastname).to.equal('Paulsen');
          done(err);
        });
      });
    });

    it('stores all objects with one call', done => {
      storeSampleDataAtOnce(() => {
        persistence.list({lastname: 1, firstname: 1}, (err, result) => {
          expect(result).to.have.length(4);
          expect(result[0].firstname).to.equal('Anna');
          expect(result[0].lastname).to.equal('Albers');
          expect(result[1].firstname).to.equal('Max');
          expect(result[1].lastname).to.equal('Albers');
          expect(result[2].firstname).to.equal('Heinz');
          expect(result[2].lastname).to.equal('Meier');
          expect(result[3].firstname).to.equal('Peter');
          expect(result[3].lastname).to.equal('Paulsen');
          done(err);
        });
      });
    });

  });

  describe('for Member', () => {
    const Member = beans.get('member');
    const moment = require('moment-timezone');
    const toPersist = new Member().initFromSessionUser({authenticationId: 'toPersist'}).state;

    const storeSampleData = done => {
      persistence.save(toPersist, done);
    };

    it('checks that created has been written', done => {
      // this test will definitely fail, if run a microsecond before midnight. - Ideas?
      const today = moment().format('DD.MM.YY');
      storeSampleData(() => {
        persistence.getById('toPersist', (err, result) => {
          expect(result.id).to.equal('toPersist');
          expect(result.created).to.exist();
          expect(result.created).to.equal(today);
          done(err);
        });
      });
    });
  });

  describe('when collection does not exist', () => {
    beforeEach(clearStore);

    describe('mapReduce', () => {
      it('returns empty array', done => {
        const R = require('ramda');
        persistence.mapReduce(() => 'nothing', R.identity, {out: {inline: 1}}, (err, result) => {
          expect(err).to.not.exist();
          expect(result).to.be.empty();
          done();
        });
      });
    });
  });
});
