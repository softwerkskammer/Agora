const Fs = require("fs/promises");
const Path = require("path");
const R = require("ramda");
const eventsToObject = require("./eventsToObject");
const conf = require("simple-configure");
const beans = conf.get("beans");
const misc = beans.get("misc");
const Git = beans.get("gitmech");
const wikiObjects = beans.get("wikiObjects");
const memberstore = beans.get("memberstore");
const FileWithChangelist = wikiObjects.FileWithChangelist;
const DirectoryWithChangedFiles = wikiObjects.DirectoryWithChangedFiles;
const Diff = beans.get("gitDiff");
let workTree = conf.get("wikipath");

async function init() {
  workTree = await Fs.realpath(workTree);
}
init();

async function replaceNonExistentNicknames(metadataList) {
  async function replaceNickPotentially(metadata) {
    try {
      const member = await memberstore.getMember(metadata.author);
      if (!member) {
        metadata.author = null;
      }
    } catch (e) {
      metadata.author = null;
    }
    return metadata;
  }
  return Promise.all(metadataList.map(replaceNickPotentially));
}

module.exports = {
  BLOG_ENTRY_FILE_PATTERN: "blog_*",

  showPage: async function showPage(completePageName, pageVersion) {
    return Git.readFile(completePageName + ".md", pageVersion);
  },

  pageEdit: async function pageEdit(completePageName) {
    try {
      const stats = await Fs.stat(Git.absPath(completePageName + ".md"));
      if (stats && !stats.isFile()) {
        return { content: "", metadata: ["NEW"] };
      }
    } catch (e) {
      return { content: "", metadata: ["NEW"] };
    }
    let content = "";
    let metadata = [];
    try {
      content = await Git.readFile(completePageName + ".md", "HEAD");
      metadata = await Git.log(completePageName + ".md", "HEAD", 1);
      return { content, metadata };
    } catch (e) {
      return { content, metadata };
    }
  },

  pageRename: async function pageRename(subdir, pageNameOld, pageNameNew, member) {
    const completePageNameOld = `${subdir}/${pageNameOld}.md`;
    const completePageNameNew = `${subdir}/${pageNameNew}.md`;
    return Git.mv(
      completePageNameOld,
      completePageNameNew,
      `rename: "${pageNameOld}" -> "${pageNameNew}"`,
      member.asGitAuthor()
    );
  },

  pageSave: async function pageSave(subdir, pageName, body, member) {
    try {
      const stats = await Fs.stat(Git.absPath(subdir));
      if (stats && !stats.isDirectory()) {
        await Fs.mkdir(Git.absPath(subdir));
      }
    } catch (e) {
      await Fs.mkdir(Git.absPath(subdir));
    }
    const completePageName = `${subdir}/${pageName}.md`;
    const pageFile = Git.absPath(completePageName);
    await Fs.writeFile(pageFile, body.content);
    let metadata = [];
    try {
      metadata = await Git.log(completePageName, "HEAD", 1);
    } catch (e) {
      // ignore
    }
    const conflict = metadata[0] && metadata[0].fullhash !== body.metadata;
    await Git.add(completePageName, body.comment.length === 0 ? "no comment" : body.comment, member.asGitAuthor());
    return conflict;
  },

  replaceNonExistentNicknames,

  pageHistory: async function pageHistory(completePageName) {
    await Git.readFile(completePageName + ".md", "HEAD");
    try {
      const metadata = await Git.log(completePageName + ".md", "HEAD", 30);
      return replaceNonExistentNicknames(metadata);
    } catch (e) {
      return [];
    }
  },

  pageCompare: async function pageCompare(completePageName, revisions) {
    const diff = await Git.diff(completePageName + ".md", revisions);
    return new Diff(diff);
  },

  pageList: async function pageList(subdir) {
    const list = await Git.ls(subdir);
    const items = list.map((row) => {
      const rowWithoutEnding = row.replace(".md", "");
      return {
        fullname: rowWithoutEnding,
        name: Path.basename(rowWithoutEnding),
      };
    });
    return items;
  },

  search: async function search(searchtext) {
    const items = await Git.grep(searchtext);
    const result = items
      .filter((item) => item.trim() !== "")
      .map((item) => {
        const record = item.split(":");
        return {
          pageName: record[0].split(".")[0],
          line: record[1],
          text: record.slice(2).join(""),
        };
      });
    return result;
  },

  parseBlogPost: function parseBlogPost(path, post) {
    const blogpost = new wikiObjects.Blogpost(path, post);
    return blogpost.isValid() ? blogpost : undefined;
  },

  getBlogpostsForGroup: async function getBlogpostsForGroup(groupname) {
    const self = this;

    const result = await Git.lsblogposts(groupname, this.BLOG_ENTRY_FILE_PATTERN);
    if (result.length === 0) {
      return [];
    }
    const unsortedPosts = await Promise.all(
      result.map(async (path) => {
        const post = await Git.readFileFs(path);
        return self.parseBlogPost(path, post);
      })
    );
    return misc.compact(unsortedPosts).sort((a, b) => {
      return a.date() < b.date() ? 1 : -1;
    });
  },

  findPagesForDigestSince: async function findPagesForDigestSince(millis) {
    const date = new Date(millis);
    const self = this;
    const result = []; // collects changes

    async function addChangesToResult(item, resultLine) {
      const metadata = await Git.latestChanges(item.fullname + ".md", date);
      if (metadata.length > 0) {
        const diff = await Git.diff(item.fullname + ".md", `HEAD@{${date.toISOString()}}..HEAD`);
        resultLine.addFile(
          new FileWithChangelist({
            file: item.name,
            changelist: metadata,
            diff: new Diff(diff),
          })
        );
      }
    }

    async function collectInnDirectory(directory) {
      const resultLine = new DirectoryWithChangedFiles({ dir: directory, files: [] });
      const items = await self.pageList(directory);
      await Promise.all(items.map(async (item) => addChangesToResult(item, resultLine)));
      if (resultLine.files.length > 0) {
        result.push(resultLine);
      }
    }

    const subdirs = await Git.lsdirs();

    await Promise.all(subdirs.map(collectInnDirectory));
    return result;
  },

  listChangedFilesinDirectory: async function listChangedFilesinDirectory(directory) {
    try {
      const metadata = await Git.log(directory, "HEAD", 30);
      let currentFiles = await Fs.readdir(Path.join(workTree, directory));
      currentFiles = currentFiles.map((file) => Path.basename(file, ".md"));

      const gitfiles = R.uniqBy((item) => item.name, metadata).filter(
        (item) => !item.name.match(wikiObjects.BLOG_ENTRY_REGEX)
      );

      gitfiles.forEach((item) => {
        if (!currentFiles.includes(item.pureName())) {
          item.deleted = true;
        }
      });

      return gitfiles;
    } catch (e) {
      return [];
    }
  },

  parseEvents: async function parseEvents(year) {
    try {
      const contents = await Git.readFile(`alle/europaweite-veranstaltungen-${year}.md`, "HEAD");
      return eventsToObject(contents, year);
    } catch (e) {
      return {};
    }
  },

  listFilesModifiedByMember: async function listFilesModifiedByMember(nickname) {
    let reallyAnArray = [];
    try {
      const files = await Git.lsFilesModifiedByMember(nickname);
      reallyAnArray = !files ? [] : files;
    } catch (e) {
      // ignore
    }
    const filteredSortedUnique = R.uniq(reallyAnArray.filter((x) => x.includes("/")).sort());
    const mapOfWikisToObjectLists = filteredSortedUnique.map((f) => {
      const parts = f.replace(/\.md/, "").replace(/"/g, "").split("/");
      return { wiki: parts[0], page: parts[1] };
    });
    return R.map(
      (arr) => arr.map((f) => f.page),
      R.groupBy((f) => f.wiki, mapOfWikisToObjectLists)
    );
  },
};
