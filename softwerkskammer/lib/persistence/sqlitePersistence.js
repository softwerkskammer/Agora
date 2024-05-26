const conf = require("simple-configure");
const Database = require("better-sqlite3");
const path = require("node:path");
const loggers = require("winston").loggers;

const sqlitedb = conf.get("sqlitedb");
const db = new Database(path.join(__dirname, sqlitedb));
const scriptLogger = loggers.get("scripts");
scriptLogger.info(`DB = ${sqlitedb}`);

function escape(str = "") {
  if (typeof str === "string") {
    return `'${str.replaceAll("'", "''")}'`;
  }
  if (typeof str === "number") {
    return str;
  } else {
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

module.exports = function sqlitePersistenceFunc(collectionName, extraCols = []) {
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
      execWithTry(`CREATE INDEX idx_${this.collectionName}_${col} ON ${this.collectionName}(${col});`);
    });
  }

  const colsForSave = ["id", "data"].concat(extraCols);

  const persistence = {
    list(orderBy) {
      return this.listByField("true", orderBy);
    },

    listByIds(list, orderBy) {
      return this.listByField(`id IN (${list.map((each) => `${escape(each)}`).join(",")})`, orderBy);
    },

    listByField(where, orderBy = "id ASC") {
      const query = `SELECT data FROM ${collectionName} WHERE ${where} ORDER BY ${orderBy};`;
      return db
        .prepare(query)
        .all()
        .map((each) => each && JSON.parse(each.data));
    },

    getById(id) {
      return this.getByField({ key: "id", val: id });
    },

    getByField(where) {
      return this.getByWhere(`${where.key} = ${escape(where.val)}`);
    },

    getByWhere(where) {
      const query = `SELECT data FROM ${collectionName} WHERE ${where};`;
      const result = db.prepare(query).get();
      return result ? JSON.parse(result.data) : {};
    },

    createValsForSave(object) {
      return [escape(object.id), asSqliteString(object)].concat(
        extraCols.map((col) => {
          return object[col].toJSON ? escape(object[col].toJSON()) : escape(object[col]);
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

    removeWithQuery(where) {
      return db.exec(`DELETE FROM ${collectionName} WHERE ${where};`);
    },

    removeById(id) {
      return this.removeWithQuery(`id = ${escape(id)}`);
    },

    removeAllByIds(ids) {
      return this.removeWithQuery(`id IN (${ids.map(escape).join(",")})`);
    },
  };
  return persistence;
};
