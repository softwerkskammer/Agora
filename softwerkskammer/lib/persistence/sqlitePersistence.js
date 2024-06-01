const conf = require("simple-configure");
const Database = require("better-sqlite3");
const path = require("node:path");
const R = require("ramda");
const loggers = require("winston").loggers;

const sqlitedb = conf.get("sqlitedb");
const db = new Database(path.join(__dirname, sqlitedb));
const scriptLogger = loggers.get("scripts");
scriptLogger.info(`DB = ${sqlitedb}`);
const CONFLICTING_VERSIONS = conf.get("beans").get("constants").CONFLICTING_VERSIONS;

function escape(str = "") {
  if (typeof str === "string") {
    return `'${str.replaceAll("'", "''")}'`;
  }
  if (typeof str === "number") {
    return str;
  } else {
    // eslint-disable-next-line no-console
    console.log(str);
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

module.exports = function sqlitePersistenceFunc(collectionName, extraColumns) {
  const extraCols = extraColumns ? extraColumns.split(",") : [];
  function create() {
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

  create();
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
          throw new Error(CONFLICTING_VERSIONS);
        }
      } else if (!existing) {
        this.save(object);
      } else {
        throw new Error(CONFLICTING_VERSIONS);
      }
    },

    removeWithQuery(where) {
      return db.exec(`DELETE FROM ${collectionName} WHERE ${where};`);
    },

    removeById(id) {
      return this.removeWithQuery(`id = ${escape(id)}`);
    },

    recreateForTest() {
      db.exec(`DROP TABLE IF EXISTS ${collectionName};`);
      create();
    },
  };
  return persistence;
};
