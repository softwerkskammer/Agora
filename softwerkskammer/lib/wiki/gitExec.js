const Path = require("path");
const Fs = require("fs/promises");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const conf = require("simple-configure");

let gitCommands = [];
let workTree = conf.get("wikipath");

async function init() {
  if (workTree) {
    try {
      workTree = await Fs.realpath(workTree);
    } catch (e) {
      throw new Error(`Repository path does not exist: ${workTree}`);
    }
    const gitDir = Path.join(workTree, ".git");
    try {
      await Fs.stat(gitDir);
    } catch (e) {
      throw new Error(`Repository path is not initialized: ${workTree}`);
    }
    gitCommands = [`--git-dir=${gitDir}`, `--work-tree=${workTree}`];
    // run a smoke test of git and the repo:
    try {
      await exec("git log -1 --oneline ", { cwd: workTree });
    } catch (e) {
      if (/fatal: your current branch 'master' does not have any commits yet/.test(e.message)) {
        throw new Error(`Please add an initial commit to the repository: ${workTree}`);
      }
      throw new Error(`${e.message} in ${workTree}`);
    }
  }
}

init();

async function gitExec(commands) {
  const { stdout } = await exec(`git ${gitCommands.concat(commands).join(" ")}`, {
    cwd: workTree,
  });
  return stdout;
}

module.exports = { command: gitExec };
