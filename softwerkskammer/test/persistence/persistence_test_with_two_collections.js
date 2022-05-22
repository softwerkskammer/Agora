"use strict";

const expect = require("must-dist");

require("./../../testutil/configureForTest");

function createTeststore(collectionName) {
  return require("../../lib/persistence/persistence")(collectionName);
}

describe("The parallel persistence store", () => {
  const persistence1 = createTeststore("teststore1");
  const persistence2 = createTeststore("teststore2");

  it("retrieves in parallel", async () => {
    await Promise.all([
      async () => {
        await persistence1.saveMongo({ id: "toPersist2", name: "Heinz2" });
        const result = await persistence1.getMongoById("toPersist2");
        expect(result.id).to.equal("toPersist2");
        expect(result.name).to.equal("Heinz2");
      },
      async () => {
        await persistence1.saveMongo({ id: "toStore2", name: "Hans2" });
        const result = await persistence1.getMongoById("toStore2");
        expect(result.id).to.equal("toStore2");
        expect(result.name).to.equal("Hans2");
      },
      async () => {
        await persistence1.saveMongo({ id: "toPersist", name: "Heinz" });
        const result = await persistence1.getMongoById("toPersist");
        expect(result.id).to.equal("toPersist");
        expect(result.name).to.equal("Heinz");
      },
      async () => {
        await persistence1.saveMongo({ id: "toStore", name: "Hans" });
        const result = await persistence2.getMongoById("toStore");
        expect(result.id).to.equal("toStore");
        expect(result.name).to.equal("Hans");
      },
    ]);
  });
});
