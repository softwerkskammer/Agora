"use strict";

const { DateTime } = require("luxon");

const expect = require("must-dist");
const beans = require("./../../testutil/configureForTest").get("beans");
const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;
const persistence = require("../../lib/persistence/sqlitePersistence")("teststore", "version");

async function clearStore() {
  await persistence.recreateForTest();
}

describe("The persistence store", () => {
  beforeEach(clearStore); // if this fails, you need to start your mongo DB

  describe("in general", () => {
    const toPersist = { id: "toPersist", name: "Heinz" };

    function storeSampleData() {
      return persistence.save(toPersist);
    }

    describe("on save", () => {
      it("fails to save object without id", () => {
        try {
          persistence.save({});
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal("Given object has no valid id");
        }
      });

      it("fails to save object with id null", () => {
        try {
          persistence.save({ id: null });
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal("Given object has no valid id");
        }
      });
    });

    describe("on save-with-version", () => {
      it("fails to save-with-version object without id", () => {
        try {
          persistence.saveWithVersion({});
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal("Given object has no valid id");
        }
      });

      it("fails to save-with-version object with id null", () => {
        try {
          persistence.saveWithVersion({ id: null });
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal("Given object has no valid id");
        }
      });

      it("on save-with-version, saves an object that is not yet in database and initializes version with 1", () => {
        persistence.saveWithVersion({ id: 123 });
        const result = persistence.getById(123);
        expect(result.version).to.equal(1);
      });

      it("on save-with-version, updates an object that is in database with same version", () => {
        persistence.save({ id: 123, data: "abc", version: 1 });
        persistence.saveWithVersion({ id: 123, data: "def", version: 1 });
        const result = persistence.getById(123);
        expect(result.data).to.equal("def");
        expect(result.version).to.equal(2);
      });

      it("on save-with-version, does not update an object that is in database with a different version", () => {
        persistence.save({ id: 123, data: "abc", version: 2 });
        const objectToSave = { id: 123, data: "def", version: 1 };
        try {
          persistence.saveWithVersion(objectToSave);
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal(CONFLICTING_VERSIONS);
        }
        const result = persistence.getById(123);
        expect(result.data, "Data of object in database remains unchanged").to.equal("abc");
        expect(result.version, "Version of object in database remains unchanged").to.equal(2);
        expect(objectToSave.version, "Version of object to save remains unchanged").to.equal(1);
      });
    });

    describe("on update", () => {
      it("replaces old object with new object", () => {
        storeSampleData();
        persistence.save({ id: "toPersist", firstname: "Peter" }, "toPersist");
        const result = persistence.getById("toPersist");
        expect(result.id).to.equal("toPersist");
        expect(result.name).to.be.undefined();
        expect(result.firstname).to.equal("Peter");
      });
    });

    describe("on getById", () => {
      it("retrieves none for non-existing id", () => {
        const result = persistence.getById("non-existing-id");
        expect(result).not.to.exist();
      });

      it("retrieves one for existing id", () => {
        storeSampleData();
        const result = persistence.getById("toPersist");
        expect(result.id).to.equal("toPersist");
        expect(result.name).to.equal("Heinz");
      });

      it("retrieves undefined if the id should be null", () => {
        storeSampleData();
        const result = persistence.getById(null);
        expect(result).not.to.exist();
      });
    });

    describe("on list", () => {
      it("retrieves an empty list when no data is inserted", () => {
        const result = persistence.list();
        expect(result).to.have.length(0);
      });

      it("retrieves all", () => {
        storeSampleData();
        const result = persistence.list();
        expect(result).to.have.length(1);
        expect(result[0].name).to.equal("Heinz");
      });
    });

    describe("on getByField", () => {
      it("retrieves undefined if some field should be null", () => {
        storeSampleData();
        const result = persistence.getByField({ key: "id", val: null });
        expect(result).not.to.exist();
      });
    });

    describe("on remove", () => {
      it("removes an object having an id", () => {
        storeSampleData();
        persistence.removeById("toPersist");
        const result = persistence.getById("toPersist");
        expect(result).not.to.exist();
      });

      it("cannot remove an object with no id", () => {
        try {
          persistence.removeById(undefined);
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal("Given object has no valid id");
        }
      });
    });
  });

  describe("for many objects", () => {
    const user1 = { id: "1", firstname: "Heinz", lastname: "Meier" };
    const user2 = { id: "2", firstname: "Max", lastname: "Albers" };
    const user3 = { id: "3", firstname: "Peter", lastname: "Paulsen" };
    const user4 = { id: "4", firstname: "Anna", lastname: "Albers" };

    async function storeSampleData() {
      return [user1, user2, user3, user4].map((obj) => persistence.save(obj));
    }

    it("retrieves all members in ascending order", () => {
      storeSampleData();
      const result = persistence.list("data->>'$.lastname' ASC, data->>'$.firstname' ASC");
      expect(result).to.have.length(4);
      expect(result[0].firstname).to.equal("Anna");
      expect(result[0].lastname).to.equal("Albers");
      expect(result[1].firstname).to.equal("Max");
      expect(result[1].lastname).to.equal("Albers");
      expect(result[2].firstname).to.equal("Heinz");
      expect(result[2].lastname).to.equal("Meier");
      expect(result[3].firstname).to.equal("Peter");
      expect(result[3].lastname).to.equal("Paulsen");
    });

    it("retrieves those members whose IDs are contained in the list", () => {
      storeSampleData();
      const result = persistence.listByIds(
        ["3", "4", "6", "test"],
        "data->>'$.lastname' ASC, data->>'$.firstname' ASC",
      );
      expect(result).to.have.length(2);
      expect(result[0].firstname).to.equal("Anna");
      expect(result[0].lastname).to.equal("Albers");
      expect(result[1].firstname).to.equal("Peter");
      expect(result[1].lastname).to.equal("Paulsen");
    });
  });

  describe("for Member", () => {
    const Member = require("../../lib/members/member");
    const toPersist = new Member().initFromSessionUser({ authenticationId: "toPersist" }).state;

    async function storeSampleData() {
      return persistence.save(toPersist);
    }

    it("checks that created has been written", () => {
      // this test will definitely fail, if run a microsecond before midnight. - Ideas?
      const today = DateTime.local().toFormat("dd.MM.yy");
      storeSampleData();
      const result = persistence.getById("toPersist");
      expect(result.id).to.equal("toPersist");
      expect(result.created).to.exist();
      expect(result.created).to.equal(today);
    });
  });
});
