"use strict";

const { DateTime } = require("luxon");

const expect = require("must-dist");
const beans = require("./../../testutil/configureForTest").get("beans");
const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;
const persistence = require("../../lib/persistence/persistence")("teststore");

async function clearStore() {
  await persistence.dropAsync();
}

describe("The persistence store", () => {
  beforeEach(clearStore); // if this fails, you need to start your mongo DB

  describe("in general", () => {
    const toPersist = { id: "toPersist", name: "Heinz" };

    async function storeSampleData() {
      return persistence.saveAsync(toPersist);
    }

    describe("on save", () => {
      it("fails to save object without id", async () => {
        try {
          await persistence.saveAsync({});
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal("Given object has no valid id");
        }
      });

      it("fails to save object with id null", async () => {
        try {
          await persistence.saveAsync({ id: null });
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal("Given object has no valid id");
        }
      });
    });

    describe("on save-with-version", () => {
      it("fails to save-with-version object without id", async () => {
        try {
          await persistence.saveWithVersionAsync({});
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal("Given object has no valid id");
        }
      });

      it("fails to save-with-version object with id null", async () => {
        try {
          await persistence.saveWithVersionAsync({ id: null });
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal("Given object has no valid id");
        }
      });

      it("on save-with-version, saves an object that is not yet in database and initializes version with 1", async () => {
        await persistence.saveWithVersionAsync({ id: 123 });
        const result = await persistence.getByIdAsync(123);
        expect(result.version).to.equal(1);
      });

      it("on save-with-version, updates an object that is in database with same version", async () => {
        await persistence.saveAsync({ id: 123, data: "abc", version: 1 });
        await persistence.saveWithVersionAsync({ id: 123, data: "def", version: 1 });
        const result = await persistence.getByIdAsync(123);
        expect(result.data).to.equal("def");
        expect(result.version).to.equal(2);
      });

      it("on save-with-version, does not update an object that is in database with a different version", async () => {
        await persistence.saveAsync({ id: 123, data: "abc", version: 2 });
        const objectToSave = { id: 123, data: "def", version: 1 };
        try {
          await persistence.saveWithVersionAsync(objectToSave);
          expect(false).to.be(true);
        } catch (err) {
          expect(err.message).to.equal(CONFLICTING_VERSIONS);
        }
        const result = await persistence.getByIdAsync(123);
        expect(result.data, "Data of object in database remains unchanged").to.equal("abc");
        expect(result.version, "Version of object in database remains unchanged").to.equal(2);
        expect(objectToSave.version, "Version of object to save remains unchanged").to.equal(1);
      });
    });

    describe("on update", () => {
      it("replaces old object with new object", async () => {
        await storeSampleData();
        await persistence.updateAsync({ id: "toPersist", firstname: "Peter" }, "toPersist");
        const result = await persistence.getByIdAsync("toPersist");
        expect(result.id).to.equal("toPersist");
        expect(result.name).to.be.undefined();
        expect(result.firstname).to.equal("Peter");
      });

      it("replaces old object with new object even if id's differ", async () => {
        await storeSampleData();
        await persistence.updateAsync({ id: "toPersist2", name: "Heinz" }, "toPersist");
        const result = await persistence.getByIdAsync("toPersist");
        expect(result).to.be.undefined();
        const result1 = await persistence.getByIdAsync("toPersist2");
        expect(result1.id).to.equal("toPersist2");
        expect(result1.name).to.equal("Heinz");
      });
    });

    describe("on getById", () => {
      it("retrieves none for non-existing id", async () => {
        const result = await persistence.getByIdAsync("non-existing-id");
        expect(result).not.to.exist();
      });

      it("retrieves one for existing id", async () => {
        await storeSampleData();
        const result = await persistence.getByIdAsync("toPersist");
        expect(result.id).to.equal("toPersist");
        expect(result.name).to.equal("Heinz");
      });

      it("retrieves undefined if the id should be null", async () => {
        await storeSampleData();
        const result = await persistence.getByIdAsync(null);
        expect(result).not.to.exist();
      });
    });

    describe("on list", () => {
      it("retrieves an empty list when no data is inserted", async () => {
        const result = await persistence.listAsync({});
        expect(result).to.have.length(0);
      });

      it("retrieves all", async () => {
        await storeSampleData();
        const result = await persistence.listAsync({});
        expect(result).to.have.length(1);
        expect(result[0].name).to.equal("Heinz");
      });
    });

    describe("on getByField", () => {
      it("retrieves undefined if some field should be null", async () => {
        await storeSampleData();
        const result = await persistence.getByFieldAsync({ id: null });
        expect(result).not.to.exist();
      });
    });

    describe("on remove", () => {
      it("removes an object having an id", async () => {
        await storeSampleData();
        await persistence.removeAsync("toPersist");
        const result = await persistence.getByIdAsync("toPersist");
        expect(result).not.to.exist();
      });

      it("cannot remove an object with no id", async () => {
        try {
          await persistence.removeAsync(undefined);
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
      return await persistence.saveAllAsync([user1, user2, user3, user4]);
    }

    it("retrieves all members in ascending order", async () => {
      await storeSampleData();
      const result = await persistence.listAsync({ lastname: 1, firstname: 1 });
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

    it("retrieves those members whose IDs are contained in the list", async () => {
      await storeSampleData();
      const result = await persistence.listByIdsAsync(["3", "4", "6", "test"], { lastname: 1, firstname: 1 });
      expect(result).to.have.length(2);
      expect(result[0].firstname).to.equal("Anna");
      expect(result[0].lastname).to.equal("Albers");
      expect(result[1].firstname).to.equal("Peter");
      expect(result[1].lastname).to.equal("Paulsen");
    });

    it("stores all objects with one call", async () => {
      await storeSampleData();
      const result = await persistence.listAsync({ lastname: 1, firstname: 1 });
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
  });

  describe("for Member", () => {
    const Member = beans.get("member");
    const toPersist = new Member().initFromSessionUser({ authenticationId: "toPersist" }).state;

    async function storeSampleData() {
      return persistence.saveAsync(toPersist);
    }

    it("checks that created has been written", async () => {
      // this test will definitely fail, if run a microsecond before midnight. - Ideas?
      const today = DateTime.local().toFormat("dd.MM.yy");
      await storeSampleData();
      const result = await persistence.getByIdAsync("toPersist");
      expect(result.id).to.equal("toPersist");
      expect(result.created).to.exist();
      expect(result.created).to.equal(today);
    });
  });
});
