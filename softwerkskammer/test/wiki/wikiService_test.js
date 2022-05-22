"use strict";
const Fs = require("fs/promises");

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");
const beans = require("../../testutil/configureForTest").get("beans");
const wikiService = beans.get("wikiService");
const memberstore = beans.get("memberstore");
const { DateTime } = require("luxon");
const { Metadata } = require("../../lib/wiki/wikiObjects");
const Git = beans.get("gitmech");

describe("Wiki Service", () => {
  const content = "Hallo, ich bin der Dateiinhalt";
  const nonExistingPage = "global/nonExisting";

  beforeEach(() => {
    sinon.stub(Git, "readFile").callsFake((completePageName) => {
      if (completePageName === nonExistingPage + ".md") {
        throw new Error();
      }
      return content;
    });
    sinon.stub(Git, "log").returns([]);
    sinon.stub(Git, "absPath").callsFake((path) => path);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("(showPage)", () => {
    it("returns content for a requested existing page", async () => {
      const cont = await wikiService.showPage("pageName", "11");
      expect(content).to.equal(cont);
    });

    it("returns an error if the requested page is not found", async () => {
      try {
        await wikiService.showPage(nonExistingPage, "11");
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });
  });

  describe("(editPage)", () => {
    it("indicates that the file is none existent", async () => {
      const { content: cont, metadata } = await wikiService.pageEdit("pageName");
      expect("").to.equal(cont);
      expect(metadata).to.contain("NEW");
    });

    it("returns the content of the file to edit if it exists", async () => {
      const { content: cont, metadata } = await wikiService.pageEdit("README");
      expect(cont).to.equal(content);
      expect(metadata).to.be.empty();
    });
  });
});

describe("WikiService (list for dashboard)", () => {
  beforeEach(() => {
    const metadatas = [
      new Metadata({
        name: "crafterswap/index.md",
        hashRef: "HEAD",
        fullhash: "baa6d36a37f0f04e1e88b4b57f0d89893789686c",
        author: "leider",
        date: "2014-04-30 17:25:48 +0200",
        comment: "no comment",
      }),
      new Metadata({
        name: "crafterswap/index.md",
        hashRef: "e6eb66c",
        fullhash: "e6eb66c3f666888da4b0da3f9207d88e996e8bf5",
        author: "leider",
        date: "2014-04-30 17:25:37 +0200",
        comment: "no comment",
      }),
      new Metadata({
        name: "crafterswap/blog_2014-03-19_der_blog.md",
        hashRef: "643e958",
        fullhash: "643e958937540da5907f7d32d87647cb5773e626",
        author: "leider",
        date: "2014-03-27 22:39:03 +0100",
        comment: "no comment",
      }),
      new Metadata({
        name: "crafterswap/blog_2014-03-19_der_blog.md",
        hashRef: "a3ab0d7",
        fullhash: "a3ab0d79e3958e21b0367bc952a04596e7892739",
        author: "leider",
        date: "2014-03-27 22:38:04 +0100",
        comment: "no comment",
      }),
      new Metadata({
        name: "crafterswap/index.md",
        hashRef: "f327d71",
        fullhash: "f327d711e3e8f0104cde2902198512444af46df3",
        author: "leider",
        date: "2014-03-09 14:37:59 +0100",
        comment: "no comment",
      }),
      new Metadata({
        name: "crafterswap/blog_vonmorgen.md",
        hashRef: "370dd3c",
        fullhash: "370dd3ce2e09fe74a78be8f8a10d36e7a3d8975b",
        author: "trauerleider",
        date: "2014-02-13 08:26:01 +0100",
        comment: "no comment",
      }),
      new Metadata({
        name: "crafterswap/index.md",
        hashRef: "2c0a379",
        fullhash: "2c0a379a5497d0998ac2ffcad4cc4261fb0a19c3",
        author: "leider",
        date: "2013-12-21 23:06:13 +0100",
        comment: "no comment",
      }),
    ];
    sinon.stub(Git, "log").returns(metadatas);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("removes duplicate entries and blogposts for the dashboard", async () => {
    sinon.stub(Fs, "readdir").returns(["index.md", "blog_vonmorgen.md"]);

    const metadata = await wikiService.listChangedFilesinDirectory("crafterswap");
    expect(metadata).to.have.length(2);
    expect(metadata[0].name).to.equal("crafterswap/index.md");
    expect(metadata[0].datestring).to.equal("2014-04-30 17:25:48 +0200");
    expect(metadata[1].name).to.equal("crafterswap/blog_vonmorgen.md");
    expect(metadata[1].datestring).to.equal("2014-02-13 08:26:01 +0100");
  });

  it("marks deleted files", async () => {
    sinon.stub(Fs, "readdir").returns(["index.md"]);

    const metadata = await wikiService.listChangedFilesinDirectory("crafterswap");
    expect(metadata).to.have.length(2);
    expect(metadata[1].name).to.equal("crafterswap/blog_vonmorgen.md");
    expect(metadata[1].deleted).to.be(true);
  });
});
//This is an extra group because the Git.readFile mock has a different objective
describe("WikiService (getBlogPosts)", () => {
  beforeEach(() => {
    sinon.stub(Git, "lsblogposts").callsFake((groupname) => {
      if (groupname === "internet") {
        return ["internet/blog_2013-10-01AgoraCodeKata.md", "internet/blog_2013-11-01LeanCoffeeTest.md"];
      } else if (groupname === "alle") {
        return [];
      } else if (groupname === "error") {
        return [
          "error/blog_2013-10-01.md",
          "error/blog_notadate.md",
          "error/blog_2013-05-01.md",
          "error/blog_2013-05-1.md",
          "error/blog_2013-5-01.md",
          "error/blog_.md",
        ];
      }
    });
    sinon.stub(Git, "readFileFs").callsFake((path) => {
      if (path === "internet/blog_2013-11-01LeanCoffeeTest.md") {
        return (
          "####   Lean Coffee November 2013\n" +
          "\n" +
          "Und beim nächsten Mal haben wir dann.\n" +
          "\n" +
          "Diesen Blog gemacht."
        );
      } else if (path === "internet/blog_2013-10-01AgoraCodeKata.md") {
        return (
          "Agora Code-Kata Oktober 2013\n" +
          "\n" +
          "Weil viele uns weder JavaScript noch populäre JavaScript...\n" +
          "\n" +
          "Leider hatten wir vorher keine Anweisungen herumgeschickt, ..."
        );
      } else if (path === "error/blog_2013-10-01.md") {
        return "#1";
      } else if (path === "error/blog_notadate.md") {
        return "#2";
      } else if (path === "error/blog_2013-05-01.md") {
        return "#3";
      } else if (path === "error/blog_2013-05-1.md") {
        return "#4";
      } else if (path === "error/blog_2013-5-01.md") {
        return "#5";
      } else if (path === "error/blog_.md") {
        return "";
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns two properly parsed blog posts for the group internet", async () => {
    const result = await wikiService.getBlogpostsForGroup("internet");
    expect(result.length === 2).to.be(true);

    const post1 = result[0];
    expect(post1.title).to.equal("Lean Coffee November 2013");
    expect(post1.teaser).to.equal("<p>Und beim nächsten Mal haben wir dann.</p>\n");
    expect(post1.dialogId()).to.equal("internet-blog_2013-11-01LeanCoffeeTest");
    expect(post1.date()).to.eql(DateTime.fromFormat("2013-11-01", "yyyy-MM-dd"));

    const post2 = result[1];
    expect(post2.title).to.equal("Agora Code-Kata Oktober 2013");
    expect(post2.teaser).to.equal("<p>Weil viele uns weder JavaScript noch populäre JavaScript...</p>\n");
    expect(post2.dialogId()).to.equal("internet-blog_2013-10-01AgoraCodeKata");
    expect(post2.date()).to.eql(DateTime.fromFormat("2013-10-01", "yyyy-MM-dd"));
  });

  it("returns no blog posts if there are none", async () => {
    const result = await wikiService.getBlogpostsForGroup("alle");
    expect(result.length === 0).to.be(true);
  });

  it("skips empty posts and posts without proper date", async () => {
    const result = await wikiService.getBlogpostsForGroup("error");
    expect(result.length).to.equal(4);
    const titles = result.map((post) => post.title);
    expect(titles).to.contain("1");
    expect(titles).to.contain("3");
    expect(titles).to.contain("4");
    expect(titles).to.contain("5");
  });
});

describe("WikiService (parseBlogPost)", () => {
  it("returns undefined when Blogpost invalid", () => {
    expect(wikiService.parseBlogPost("", "")).to.be.undefined();
  });

  it("returns the Blogpost if it is valid", () => {
    expect(
      wikiService.parseBlogPost("blog_2013-11-01LeanCoffeeTest.md", "#Lean Coffee November 2013")
    ).to.not.be.undefined();
  });
});

describe("Wiki Service (daily digest)", () => {
  const subdirs = ["dirA", "dirB"];
  const filesForDirA = ["dirA/fileA1", "dirA/fileA2"];
  const filesForDirB = ["dirB/fileB1", "dirB/fileB2"];
  const metadataA1 = {
    author: "authorA1",
    fullhash: "hashA1",
    date: "2014-01-11 18:45:29 +0100",
  };
  const metadataA2 = {
    author: "authorA2",
    fullhash: "hashA2",
    date: "2014-01-10 18:45:29 +0100",
  };
  const metadataB1 = {
    author: "authorB1",
    fullhash: "hashB1",
    date: "2014-01-11 18:45:29 +0100",
  };

  beforeEach(() => {
    sinon.stub(Git, "ls").callsFake((dirname) => {
      if (dirname === "dirA") {
        return filesForDirA;
      }
      if (dirname === "dirB") {
        return filesForDirB;
      }
    });

    sinon.stub(Git, "latestChanges").callsFake((filename) => {
      if (filename.indexOf("A1") > -1) {
        return [metadataA1];
      }
      if (filename.indexOf("A2") > -1) {
        return [metadataA2];
      }
      if (filename.indexOf("B1") > -1) {
        return [metadataB1];
      }
      return [];
    });

    sinon.stub(Git, "readFile");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Digest", () => {
    it("finds all changed pages", async () => {
      sinon.stub(Git, "lsdirs").returns(subdirs);

      sinon.stub(Git, "diff").returns("");

      const pages = await wikiService.findPagesForDigestSince(Date.now());
      expect(pages.length).to.equal(2);
      pages.forEach((page) => {
        if (page.dir === "dirA") {
          expect(page.files.length).to.equal(2);
        } else {
          expect(page.files.length).to.equal(1);
        }
      });
    });

    it("handles an error correctly", async () => {
      sinon.stub(Git, "lsdirs").throws(new Error());

      try {
        await wikiService.findPagesForDigestSince(Date.now());
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });
  });
});

describe("Wiki Service (replaceNonExistentNicknames)", () => {
  let metadatas;
  beforeEach(() => {
    metadatas = [
      {
        name: "crafterswap/index.md",
        hashRef: "HEAD",
        fullhash: "baa6d36a37f0f04e1e88b4b57f0d89893789686c",
        author: "known",
        datestring: "2014-04-30 17:25:48 +0200",
        comment: "no comment",
      },
      {
        name: "crafterswap/blog_vonmorgen.md",
        hashRef: "370dd3c",
        fullhash: "370dd3ce2e09fe74a78be8f8a10d36e7a3d8975b",
        author: "unknown",
        datestring: "2014-02-13 08:26:01 +0100",
        comment: "no comment",
      },
    ];

    sinon.stub(memberstore, "getMember").callsFake((nick) => {
      if (nick === "known") {
        return {}; // we just need existence here
      }
      return null;
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("updates the entries author if not found in memberstore", async () => {
    const updatedMetadatas = await wikiService.replaceNonExistentNicknames(metadatas);
    expect(updatedMetadatas[0].author).to.be("known");
    expect(updatedMetadatas[1].author).to.be(null);
  });
});

describe("Wiki Service (listFilesModifiedByMember)", () => {
  beforeEach(() => {
    sinon.stub(Git, "lsFilesModifiedByMember").returns([
      "dummyfile", // we want to ignore this one because it is not in a wiki
      "wiki1/file1.md",
      "wiki1/file3.md",
      "wiki1/file2.md", // multiple entries, unsorted
      "wiki2/file1.md", // single entry
      "wiki3/file1.md",
      "wiki3/file1.md",
      "wiki3/file2.md",
      "wiki3/file1.md", // duplicate entries, unsorted
      '"global/CodeAndCakeM\\303\\274nster.md"', // in quotes, with unicode
    ]);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns the files modified by the member, grouped by wiki", async () => {
    const results = await wikiService.listFilesModifiedByMember("memberId");
    expect(results.wiki1).to.eql(["file1", "file2", "file3"]);
    expect(results.wiki2).to.eql(["file1"]);
    expect(results.wiki3).to.eql(["file1", "file2"]);
    expect(results.global).to.eql(["CodeAndCakeM\\303\\274nster"]);
  });
});
