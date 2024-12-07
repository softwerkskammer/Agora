"use strict";
const conf = require("simple-configure");
const Database = require("better-sqlite3");
const path = require("node:path");
const R = require("ramda");
const loggers = require("winston").loggers;

const sqlitedb = conf.get("sqlitedb");
const db = new Database(path.join(__dirname, sqlitedb));
const scriptLogger = loggers.get("scripts");
scriptLogger.info(`DB = ${sqlitedb}`);
const CONFLICTING_VERSIONS = require("../commons/constants").CONFLICTING_VERSIONS;

const TESTMODE = conf.get("TESTMODE");

function escape(str = "") {
  if (typeof str === "string") {
    return `'${str.replaceAll("'", "''")}'`;
  }
  if (typeof str === "number") {
    return str;
  } else {
    return str + "";
  }
}

function asSqliteString(obj) {
  return `${escape(JSON.stringify(obj))}`;
}

function execWithTry(command) {
  try {
    db.exec(command);
  } catch (e) {
    const errortext = e.toString();
    if (!(errortext.startsWith("SqliteError: index") && errortext.endsWith("already exists"))) {
      // we expect re-entrance of index creation
      // eslint-disable-next-line no-console
      console.error(errortext);
    }
  }
}

function sqlitePersistenceFunc(collectionNameInput, extraColumns) {
  const collectionName = TESTMODE === "testWithDB" ? "teststore" : collectionNameInput;
  const extraCols = extraColumns ? extraColumns.split(",") : [];

  function createForTest() {
    if (collectionName !== "teststore") {
      console.error("Trying to drop a production collection?"); // eslint-disable-line no-console
      return;
    }
    const columns = ["id TEXT PRIMARY KEY", "data BLOB"].concat(
      extraCols.map((col) => {
        if (col === "version") {
          return `${col} INTEGER`;
        }
        return `${col} TEXT`;
      }),
    );
    db.exec(`CREATE TABLE IF NOT EXISTS ${collectionName} ( ${columns.join(",")});`);
    execWithTry(`CREATE INDEX idx_${collectionName}_id ON ${collectionName}(id);`);
    if (extraCols.length > 0) {
      const suffix = extraCols.join("_");
      const columnsInIdx = extraCols.join(",");
      execWithTry(`CREATE INDEX idx_${collectionName}_${suffix} ON ${collectionName}(${columnsInIdx});`);
      extraCols.forEach((col) => {
        execWithTry(`CREATE INDEX idx_${collectionName}_${col} ON ${collectionName}(${col});`);
      });
    }
  }

  const colsForSave = ["id", "data"].concat(extraCols);

  const persistence = {
    list(orderBy) {
      return this.listByWhere("true", orderBy);
    },

    listByIds(list, orderBy) {
      return this.listByWhere(`id IN (${list.map((each) => `${escape(each)}`).join(",")})`, orderBy);
    },

    listByWhere(where, orderBy = "id ASC") {
      const query = `SELECT data FROM ${collectionName} WHERE ${where} ORDER BY ${orderBy};`;
      return db
        .prepare(query)
        .all()
        .map((each) => each && JSON.parse(each.data));
    },

    getById(id, caseInsensitive) {
      return this.getByField({ key: "id", val: id }, caseInsensitive);
    },

    getByField(where, caseInsensitive) {
      return this.getByWhere(`${where.key} = ${escape(where.val)}`, caseInsensitive);
    },

    getByWhere(where, caseInsensitive = false) {
      const query = `SELECT data FROM ${collectionName} WHERE ${where} ${caseInsensitive ? "COLLATE NOCASE" : ""};`;
      const result = db.prepare(query).get();
      return result ? JSON.parse(result.data) : undefined;
    },

    createValsForSave(object) {
      return [escape(object.id), asSqliteString(object)].concat(
        extraCols.map((col) => {
          if (object[col]) {
            return object[col].toJSON ? escape(object[col].toJSON()) : escape(object[col]);
          } else {
            return "null";
          }
        }),
      );
    },

    save(object) {
      if (object.id === null || object.id === undefined) {
        throw new Error("Given object has no valid id");
      }
      const vals = this.createValsForSave(object);
      return db.exec(`REPLACE INTO ${collectionName} (${colsForSave.join(",")}) VALUES (${vals.join(",")});`);
    },

    saveAll(objects) {
      if (objects.length < 1) {
        return;
      }
      const rows = objects.map((obj) => {
        const vals = this.createValsForSave(obj);
        return `(${vals.join(",")})`;
      });
      return db.exec(`REPLACE INTO ${collectionName} (${colsForSave.join(",")}) VALUES ${rows.join("\n,")};`);
    },

    saveWithVersion(object) {
      if (object.id === null || object.id === undefined) {
        throw new Error("Given object has no valid id");
      }
      const oldVersion = object.version || 0;
      object.version = oldVersion + 1;
      const existing = this.getById(object.id);
      const existingWithVersion = this.getByWhere(`id = ${escape(object.id)} AND version = ${oldVersion}`);
      if (existing && existingWithVersion) {
        const vals = this.createValsForSave(object);
        const colsVals = R.zip(colsForSave, vals)
          .map(([col, val]) => {
            return `${col} = ${val}`;
          })
          .join(", ");

        db.exec(
          `UPDATE ${collectionName} 
            SET ${colsVals} WHERE version = ${oldVersion} AND id = '${existing.id}';`,
        );
        const updated = this.getById(object.id);
        if (updated.version !== object.version) {
          object.version = oldVersion;
          throw new Error(CONFLICTING_VERSIONS);
        }
      } else if (!existing) {
        this.save(object);
      } else {
        object.version = oldVersion;
        throw new Error(CONFLICTING_VERSIONS);
      }
    },

    removeWithQuery(where) {
      return db.exec(`DELETE FROM ${collectionName} WHERE ${where};`);
    },

    removeById(id) {
      if (id === null || id === undefined) {
        throw new Error("Given object has no valid id");
      }
      return this.removeWithQuery(`id = ${escape(id)}`);
    },

    recreateForTest() {
      if (collectionName === "teststore") {
        db.exec(`DROP TABLE IF EXISTS ${collectionName};`);
        createForTest();
      } else {
        console.error("Trying to drop a production collection?"); // eslint-disable-line no-console
      }
    },

    //     initAll() {
    //       const createTablesAndIndices = `CREATE TABLE activityresultstore ( id TEXT PRIMARY KEY,data BLOB);
    // CREATE TABLE activitystore ( id TEXT PRIMARY KEY,data BLOB,startDate TEXT,endDate TEXT,url TEXT,version INTEGER);
    // CREATE TABLE groupstore ( id TEXT PRIMARY KEY,data BLOB);
    // CREATE TABLE memberstore ( id TEXT PRIMARY KEY,data BLOB);
    // CREATE TABLE optionenstore ( id TEXT PRIMARY KEY,data BLOB);
    // CREATE TABLE settingsstore ( id TEXT PRIMARY KEY,data BLOB);
    // CREATE INDEX idx_activityresultstore_id ON activityresultstore(id);
    // CREATE INDEX idx_activitystore_endDate ON activitystore(endDate);
    // CREATE INDEX idx_activitystore_id ON activitystore(id);
    // CREATE INDEX idx_activitystore_startDate ON activitystore(startDate);
    // CREATE INDEX idx_activitystore_startDate_endDate_url_version ON activitystore(startDate,endDate,url,version);
    // CREATE INDEX idx_activitystore_url ON activitystore(url);
    // CREATE INDEX idx_activitystore_version ON activitystore(version);
    // CREATE INDEX idx_groupstore_id ON groupstore(id);
    // CREATE INDEX idx_memberstore_id ON memberstore(id);
    // CREATE INDEX idx_optionenstore_id ON optionenstore(id);
    // CREATE INDEX idx_settingsstore_id ON settingsstore(id);`;
    //
    //       db.exec(createTablesAndIndices);
    //     },
  };

  return persistence;
}

module.exports = TESTMODE === "test" ? require("./noOpPersistence") : sqlitePersistenceFunc;
