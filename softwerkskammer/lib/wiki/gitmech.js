"use strict";
const Fs = require("fs/promises");
const conf = require("simple-configure");
const workTree = conf.get("wikipath");
const beans = conf.get("beans");
const misc = beans.get("misc");
const gitExec = beans.get("gitExec");
const wikiObjects = beans.get("wikiObjects");
const Metadata = wikiObjects.Metadata;

function dataToLines(data) {
  return data ? data.split("\n").filter((v) => v !== "") : [];
}

function esc(arg) {
  // to secure command line execution
  return `'${arg}'`;
}

async function commit(path, message, author) {
  return gitExec.command(["commit", `--author=${esc(author)}`, "-m", esc(message), esc(path)]);
}

module.exports = {
  absPath: function absPath(path) {
    return `${workTree}/${path}`;
  },

  readFileFs: async function readFileFs(path) {
    return Fs.readFile(this.absPath(path), "utf8");
  },

  readFile: async function readFile(path, version) {
    return gitExec.command(["show", `${version}:${esc(path)}`]);
  },

  log: async function log(path, version, howMany) {
    const data = await gitExec.command([
      "log",
      `-${howMany}`,
      "--no-notes",
      "--follow",
      "--pretty=format:%h%n%H%n%an%n%ai%n%s",
      version,
      "--name-only",
      "--",
      esc(path),
    ]);
    const logdata = data ? data.split("\n\n") : [];
    const metadata = misc.compact(logdata).map((chunk) => {
      const group = chunk.split("\n");
      return new Metadata({
        hashRef: group[0],
        fullhash: group[1],
        author: group[2],
        date: group[3],
        comment: group[4],
        name: group[5],
      });
    });
    if (metadata[0]) {
      metadata[0].hashRef = "HEAD"; // This can be used linking this version, but needs to be empty for HEAD
    }
    return metadata;
  },

  latestChanges: async function latestChanges(path, jsDate) {
    const data = await gitExec.command([
      "log",
      '--since="' + jsDate.toISOString() + '"',
      "--pretty=format:%h%n%H%n%an%n%ai%n%s",
      "--",
      esc(path),
    ]);
    const logdata = data ? data.split("\n") : [];
    const metadata = [];
    for (let i = Math.floor(logdata.length / 5); i > 0; i = i - 1) {
      const group = logdata.slice((i - 1) * 5, i * 5);
      metadata.push(
        new Metadata({
          name: path.replace(".md", ""),
          hashRef: group[0],
          fullhash: group[1],
          author: group[2],
          date: group[3],
          comment: group[4],
        }),
      );
    }
    return metadata;
  },

  add: async function add(path, message, author) {
    await gitExec.command(["add", esc(path)]);
    return commit(path, message, author);
  },

  mv: async function mv(oldpath, newpath, message, author) {
    await gitExec.command(["mv", esc(oldpath), esc(newpath)]);
    return commit(".", message, author);
  },

  rm: async function rm(path, message, author) {
    await gitExec.command(["rm", esc(path)]);
    return commit(path, message, author);
  },

  grep: async function grep(pattern) {
    try {
      const data = await gitExec.command(["grep", "--no-color", "-F", "-n", "-i", "-I", esc(pattern)]);
      const result = data ? data.split("\n") : [];
      // Search in the file names
      const data1 = await gitExec.command(["ls-files", `*${esc(pattern)}*.md`]);
      if (data1) {
        data1.split("\n").forEach((name) => result.push(name));
      }
      return result;
    } catch (e) {
      if (e.message && e.message.split("\n").length < 3) {
        return [];
      }
      throw e;
    }
  },

  diff: async function diff(path, revisions) {
    return gitExec.command(["diff", "--no-color", "-b", esc(revisions), "--", esc(path)]);
  },

  ls: async function ls(subdir) {
    const data = await gitExec.command(["ls-tree", "--name-only", "-r", "HEAD", esc(subdir)]);
    return dataToLines(data);
  },

  lsdirs: async function lsdirs() {
    if (!workTree) {
      return [];
    } // to make it run on dev systems
    const data = await gitExec.command(["ls-tree", "--name-only", "-d", "HEAD"]);
    return dataToLines(data);
  },

  lsblogposts: async function lsblogposts(groupname, pattern) {
    const data = await gitExec.command(["ls-files", esc(`${groupname}/${pattern}`)]);
    return dataToLines(data);
  },

  lsFilesModifiedByMember: async function lsblogposts(nickname) {
    // thanks to https://stackoverflow.com/questions/6349139/can-i-get-git-to-tell-me-all-the-files-one-user-has-modified
    const data = await gitExec.command([
      "log",
      "--no-merges",
      '--author="' + nickname + '"',
      "--name-only",
      '--pretty=format:""',
    ]);
    return dataToLines(data);
  },
};
