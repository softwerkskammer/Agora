/* eslint-disable no-console, no-sync, no-process-exit */
"use strict";

require("./softwerkskammer/configure.js");
const Database = require("better-sqlite3");
const conf = require("simple-configure");
const path = require("path");
const AdmZip = require("adm-zip");
const fs = require("fs");
const sqlitedb = conf.get("sqlitedb");
const db = new Database(path.join(__dirname, "softwerkskammer/lib/persistence", sqlitedb));
const myArgs = process.argv.slice(2);
const outdir = `${myArgs.length > 0 ? myArgs[0] : ""}`;
const outpath = path.join(outdir, `backup-db-sqlite-${new Date().toISOString()}.db`);

function zipIt(outfile) {
  const zip = new AdmZip();
  zip.addLocalFile(outfile);
  zip.writeZip(outfile.replace(".db", ".zip"), (err) => {
    if (err) {
      console.error("backup failed during zipping:", err);
      return process.exit(1);
    }
    fs.rmSync(outfile);
  });
}

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

db.backup(outpath)
  .then(() => {
    zipIt(outpath);
    console.log("backup successful");
  })
  .catch((err) => {
    console.error("backup failed:", err);
    process.exit(1);
  });
