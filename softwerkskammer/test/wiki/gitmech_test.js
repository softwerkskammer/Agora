"use strict";

const R = require("ramda");
const sinon = require("sinon").createSandbox();
const expect = require("must-dist");
const beans = require("../../testutil/configureForTest").get("beans");
const Git = beans.get("gitmech");
const gitExec = beans.get("gitExec");

describe("the gitmech module", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("- read operations", () => {
    const argsForLog = [
      "log",
      "-1",
      "--no-notes",
      "--follow",
      "--pretty=format:%h%n%H%n%an%n%ai%n%s",
      "HEAD",
      "--name-only",
      "--",
      "'path'",
    ];

    it('"readFile" returns file contents as string', async () => {
      const gitCommand = sinon.stub(gitExec, "command").returns("string");

      const string = await Git.readFile("path", 1);
      expect(gitCommand.withArgs(["show", "1:'path'"]).calledOnce).to.be(true);
      expect(string).to.equal("string");
    });

    it('"readFile" returns error on error', async () => {
      sinon.stub(gitExec, "command").throws(new Error());
      try {
        await Git.readFile("path", 1);
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it('escapes the dynamic argument in "readFile" to avoid cmd injection', async () => {
      const pathGiven = "Given | Path";
      const gitCommand = sinon.stub(gitExec, "command").returns("string");

      await Git.readFile(pathGiven, 1);
      expect(gitCommand.firstCall.args[0][1]).to.be("1:'Given | Path'");
    });

    it('produces sensible metadata via "git log" for editing', async () => {
      const gitCommand = sinon
        .stub(gitExec, "command")
        .returns(
          "7f91fc6\n" +
            "7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n" +
            "leider\n" +
            "2014-03-01 18:36:29 +0100\n" +
            "no comment\n" +
            "path/file.md\n\n"
        );
      const metadatas = await Git.log("path", "HEAD", 1);
      expect(gitCommand.withArgs(argsForLog).calledOnce).to.be(true);
      const metadata = metadatas[0];
      expect(metadatas).to.have.length(1);
      expect(metadata.name).to.equal("path/file.md");
      expect(metadata.hashRef).to.equal("HEAD");
      expect(metadata.fullhash).to.equal("7f91fc607da7947e62b2d8a52088ee0ce29a88c8");
      expect(metadata.author).to.equal("leider");
      expect(metadata.datestring).to.equal("2014-03-01 18:36:29 +0100");
      expect(metadata.comment).to.equal("no comment");
    });

    it('produces sensible metadata via "git log" for viewing the history', async () => {
      const gitCommand = sinon
        .stub(gitExec, "command")
        .returns(
          "7f91fc6\n" +
            "7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n" +
            "leider\n" +
            "2014-03-01 18:36:29 +0100\n" +
            "no comment\n" +
            "path/file.md\n\n" +
            "7f91fc6\n" +
            "7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n" +
            "leider\n" +
            "2014-03-01 18:36:29 +0100\n" +
            "no comment\n" +
            "path/file.md\n\n" +
            "16e441b\n" +
            "16e441b7db64acf4980a067047b0d9fb5cf9bb3e\n" +
            "trauerleider\n" +
            "2014-02-15 16:18:44 +0100\n" +
            "no comment\n" +
            "path/file.md\n\n" +
            "a5967c3\n" +
            "a5967c3594f637618798b6687e0a36ae2873b60d\n" +
            "trauerleider\n" +
            "2014-02-06 21:10:33 +0100\n" +
            "no comment\n" +
            "path/file.md\n\n" +
            "3d38d9d\n" +
            "3d38d9dad4d205ceedb4861bc0cfe292e245c307\n" +
            "trauerleider\n" +
            "2013-12-08 12:53:42 +0100\n" +
            "no comment\n" +
            "path/file.md\n\n"
        );
      const metadatas = await Git.log("path", "HEAD", 1);
      expect(gitCommand.withArgs(argsForLog).calledOnce).to.be(true);
      const metadata = metadatas[0];
      expect(metadatas).to.have.length(5);

      expect(metadata.name).to.equal("path/file.md");
      expect(metadata.hashRef).to.equal("HEAD");
      expect(metadata.fullhash).to.equal("7f91fc607da7947e62b2d8a52088ee0ce29a88c8");
      expect(metadata.author).to.equal("leider");
      expect(metadata.datestring).to.equal("2014-03-01 18:36:29 +0100");
      expect(metadata.comment).to.equal("no comment");

      expect(metadatas[1].hashRef).to.equal("7f91fc6");
      expect(metadatas[2].hashRef).to.equal("16e441b");
      expect(metadatas[3].hashRef).to.equal("a5967c3");
      expect(metadatas[4].hashRef).to.equal("3d38d9d");
    });

    it('can handle renames via "git log" for viewing the history', async () => {
      const gitCommand = sinon
        .stub(gitExec, "command")
        .returns(
          "7f91fc6\n" +
            "7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n" +
            "leider\n" +
            "2014-03-01 18:36:29 +0100\n" +
            'rename: "blog_vonheute" -> "blog_2014-03-19_der_blog"\n' +
            "crafterswap/blog_2014-03-19_der_blog.md\n" +
            "crafterswap/blog_vonheute.md\n\n" +
            "7f91fc6\n" +
            "7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n" +
            "leider\n" +
            "2014-03-01 18:36:29 +0100\n" +
            "no comment\n" +
            "path/file.md\n\n"
        );
      const metadatas = await Git.log("path", "HEAD", 1);
      expect(gitCommand.withArgs(argsForLog).calledOnce).to.be(true);
      let metadata = metadatas[0];
      expect(metadatas).to.have.length(2);

      expect(metadata.name).to.equal("crafterswap/blog_2014-03-19_der_blog.md");
      expect(metadata.hashRef).to.equal("HEAD");
      expect(metadata.fullhash).to.equal("7f91fc607da7947e62b2d8a52088ee0ce29a88c8");
      expect(metadata.author).to.equal("leider");
      expect(metadata.datestring).to.equal("2014-03-01 18:36:29 +0100");
      expect(metadata.comment).to.equal('rename: "blog_vonheute" -> "blog_2014-03-19_der_blog"');

      metadata = metadatas[1];
      expect(metadata.name).to.equal("path/file.md");
      expect(metadata.hashRef).to.equal("7f91fc6");
    });

    it('calls the callback with an error when failing at "log"', async () => {
      sinon.stub(gitExec, "command").throws(new Error());
      try {
        await Git.log("path", "HEAD", 1);
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it('escapes the dynamic argument in "git log" to avoid cmd injection', async () => {
      const pathGiven = "Given | Path";
      const gitCommand = sinon.stub(gitExec, "command");
      await Git.log(pathGiven, "HEAD", 1);
      expect(gitCommand.firstCall.args[0][8]).to.be("'Given | Path'");
    });

    it('produces sensible metadata via "latestChanges" for sending change emails', async () => {
      const gitCommand = sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "log") {
          return (
            "60ca4ed\n" +
            "60ca4eda5b79fd55461a78725ff0815cfd3f8550\n" +
            "leider\n" +
            "2014-03-13 20:06:51 +0100\n" +
            "no comment\n" +
            "19c89ae\n" +
            "19c89ae3e7601b002133df569a1a4d57aaaa3271\n" +
            "leider\n" +
            "2014-03-13 20:06:19 +0100\n" +
            'rename: "blog_2014-02-12neuereintrag" -> "blog_2014-02-12---fdadfadfjj-neuereintrag"\n' +
            "f327d71\n" +
            "f327d711e3e8f0104cde2902198512444af46df3\n" +
            "leider\n" +
            "2014-03-09 14:37:59 +0100\n" +
            "no comment\n"
          );
        }
      });
      const metadatas = await Git.latestChanges("path", new Date());
      expect(gitCommand.firstCall.args[0][1]).to.match("--since");
      expect(metadatas).to.have.length(3);
      expect(metadatas[0].hashRef).to.equal("f327d71");
      expect(metadatas[1].hashRef).to.equal("19c89ae");
      expect(metadatas[2].hashRef).to.equal("60ca4ed");
    });

    it('calls the callback with an error when failing at "latestChanges"', async () => {
      sinon.stub(gitExec, "command").throws(new Error());
      try {
        await Git.latestChanges("path", new Date());
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });
  });

  describe(" - write operations", () => {
    function runTestsFor(commandName, gitmechCommand) {
      return () => {
        it("calls commit when successful", async () => {
          let commitcalled = false;
          sinon.stub(gitExec, "command").callsFake((args) => {
            if (args[0] === "commit") {
              commitcalled = true;
            }
          });
          await gitmechCommand("message", "author");
          expect(commitcalled).to.be(true);
        });

        it("does not call commit when failing", async () => {
          let commitcalled = false;
          sinon.stub(gitExec, "command").callsFake((args) => {
            if (args[0] === commandName) {
              throw new Error();
            }
            if (args[0] === "commit") {
              commitcalled = true;
            }
          });
          try {
            await gitmechCommand("message", "author");
            expect(true).to.be(false);
          } catch (e) {
            expect(e).to.exist();
            expect(commitcalled).to.be(false);
          }
        });

        it('handles "commit" errors', async () => {
          let commitcalled = false;
          sinon.stub(gitExec, "command").callsFake((args) => {
            if (args[0] === "commit") {
              commitcalled = true;
              throw new Error();
            }
          });
          try {
            await gitmechCommand("message", "author");
            expect(true).to.be(false);
          } catch (e) {
            expect(e).to.exist();
            expect(commitcalled).to.be(true);
          }
        });

        it('escapes the dynamic argument in "command" to avoid cmd injection', async () => {
          const stub = sinon.stub(gitExec, "command");
          await gitmechCommand("message", "author");
          const argument = stub.firstCall.args[0];
          if (argument[0] === commandName) {
            expect(argument[1]).to.match(/'?.'/);
            if (argument.length === 3) {
              expect(argument[2]).to.match(/'?.'/);
            }
          }
        });

        it('escapes the dynamic argument in "commit" to avoid cmd injection', async () => {
          const stub = sinon.stub(gitExec, "command");
          await gitmechCommand("message", "author");
          const argument = stub.lastCall.args[0];
          if (argument[0] === "commit") {
            expect(argument[1]).to.be("--author='author'");
            expect(argument[3]).to.be("'message'");
            expect(argument[4]).to.match(/'?.'/);
          }
        });
      };
    }

    describe('"add" command', runTestsFor("add", R.partial(Git.add, ["path"])));
    describe('"rm" command', runTestsFor("rm", R.partial(Git.rm, ["path"])));
    describe('"mv" command', runTestsFor("mv", R.partial(Git.mv, ["oldpath", "newpath"])));
  });

  describe(" - searching", () => {
    it("finds in file contents", async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "grep") {
          return (
            "global/index.md:8:Dies ist der Index [für] das [[andreas:test]] -dudelo\n" +
            "global/veran.md:12:[UK Tester Forums - Test Management Forum](http://uktmf.com/index.php?q=node/5271)                                             | London                  | 5.2.             \n" +
            "global/veran.md:16:[Belgium Testing Days](http://btdconf.com/)                                                                                    | Brügge                  | 17.3. - 20.3.    \n" +
            "global/veran.md:20:[SIGIST (Specialist Group in Software Testing) Spring Conference](http://www.bcs.org/category/9264)                            | London                  | 11.3.            "
          );
        }
      });
      const chunks = await Git.grep("test");
      expect(chunks).to.have.length(4);
      expect(chunks).to.contain(
        "global/veran.md:16:[Belgium Testing Days](http://btdconf.com/)                                                                                    | Brügge                  | 17.3. - 20.3.    "
      );
    });

    it("finds in file names", async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "ls-files") {
          return "andex.md\n" + "andreas.md\n" + "andreastest.md";
        }
      });
      const chunks = await Git.grep("test");
      expect(chunks).to.have.length(3);
      expect(chunks).to.contain("andex.md");
    });

    it("handles errors in grep search with more than two lines", async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "grep") {
          throw new Error("line1\nline2\nline3");
        }
      });
      try {
        await Git.grep("test");
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it("handles errors in grep search with less than two lines", async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "grep") {
          throw new Error("line1\nline2");
        }
      });
      const result = await Git.grep("test");
      expect(result).to.eql([]);
    });

    it("handles errors in file search", async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "ls-files") {
          throw new Error();
        }
      });
      try {
        await Git.grep("test");
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it('escapes the dynamic argument in "grep" to avoid cmd injection', async () => {
      const stub = sinon.stub(gitExec, "command");
      await Git.grep("some | text");
      const argument = stub.firstCall.args[0];
      if (argument[0] === "grep") {
        expect(argument[6]).to.be("'some | text'");
      }
    });

    it('escapes the dynamic argument in "ls-files" to avoid cmd injection', async () => {
      const stub = sinon.stub(gitExec, "command").returns("andex.md");
      await Git.grep("some | text");
      const argument = stub.lastCall.args[0];
      if (argument[0] === "ls-files") {
        expect(argument[1]).to.be("*'some | text'*.md");
      }
    });
  });

  describe(" - listing files", () => {
    it('"ls" - converts the data to an array of single non empty lines', async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "ls-tree") {
          return "andex.md\n" + "\n" + "andreastest.md";
        }
      });
      const lines = await Git.ls("subdir");
      expect(lines).to.have.length(2);
    });

    it('"ls" - handles errors correct', async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "ls-tree") {
          throw new Error();
        }
      });
      try {
        await Git.ls("subdir");
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it('escapes the dynamic argument in "ls" to avoid cmd injection', async () => {
      const stub = sinon.stub(gitExec, "command");
      await Git.ls("subdir | dd");
      const argument = stub.firstCall.args[0];
      expect(argument[4]).to.be("'subdir | dd'");
    });

    it('"lsdirs" - converts the data to an array of single non empty lines', async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "ls-tree") {
          return "andex\n" + "\n" + "andreastest";
        }
      });
      const lines = await Git.lsdirs();
      expect(lines).to.have.length(2);
    });

    it('"lsdirs" - handles errors correctly', async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "ls-tree") {
          throw new Error();
        }
      });
      try {
        await Git.lsdirs();
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it('"lsdirs" - converts the data to an array of single non empty lines', async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "ls-tree") {
          return "";
        }
      });
      const lines = await Git.lsdirs();
      expect(lines).to.be.empty();
    });

    it('"lsblogposts" - converts the data to an array of single non empty lines', async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "ls-files") {
          return "andex.md\n" + "\n" + "andreastest.md";
        }
      });
      const lines = await Git.lsblogposts("group", "pattern");
      expect(lines).to.have.length(2);
    });

    it('"lsblogposts" - handles errors correct', async () => {
      sinon.stub(gitExec, "command").callsFake((args) => {
        if (args[0] === "ls-files") {
          throw new Error();
        }
      });
      try {
        await Git.lsblogposts("group", "pattern");
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it('escapes the dynamic argument in "lsblogposts" to avoid cmd injection', async () => {
      const stub = sinon.stub(gitExec, "command");
      await Git.lsblogposts("group", "some | text");
      const argument = stub.firstCall.args[0];
      expect(argument[1]).to.be("'group/some | text'");
    });
  });
});
