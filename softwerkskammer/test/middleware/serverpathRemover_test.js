"use strict";

const expect = require("must-dist");

const beans = require("../../testutil/configureForTest").get("beans");
const serverpathRemover = beans.get("serverpathRemover");

describe("serverpathRemover removes any paths", () => {
  let removeServerpaths;

  before(() => {
    const res = { locals: {} };
    const next = () => undefined;
    serverpathRemover(null, res, next);
    removeServerpaths = res.locals.removeServerpaths;
  });

  it("that comes before node_modules", () => {
    expect(removeServerpaths("error message /usr/local/something/node_modules/some_other/lib/")).to.equal(
      "error message node_modules/some_other/lib/",
    );
  });

  it("that comes before lib", () => {
    expect(
      removeServerpaths(
        "error 500 /usr/home/username/path_to_installation/agora/softwerkskammer/lib/paaath/node_modules/",
      ),
    ).to.equal("error 500 softwerkskammer/lib/paaath/node_modules/");
  });

  it("that comes before lib or node_modules", () => {
    expect(
      removeServerpaths(
        "error 500 /dir1/dir2/dir3/softwerkskammer/lib/node_modules/etc and also /dir1/dir2/dir3/node_modules/lib/etc",
      ),
    ).to.equal("error 500 softwerkskammer/lib/node_modules/etc and also node_modules/lib/etc");
  });

  it("that occur in the string, even if not followed by lib or node_modules", () => {
    expect(
      removeServerpaths(
        "error 500 /dir1/dir2/dir3/softwerkskammer/lib/node_modules/etc and also /dir1/dir2/dir3/some_file.js",
      ),
    ).to.equal("error 500 softwerkskammer/lib/node_modules/etc and also some_file.js");
  });

  it("copes with long strings", () => {
    const original =
      "Error: Empfänger wurde nicht gefunden.\n" +
      "at /Users/user/Developer/GitRepositories/Agora/lib/mailsender/mailsenderService.js:76:37\n" +
      "at toMember (/Users/user/Developer/GitRepositories/Agora/lib/members/memberstore.js:12:3)\n" +
      "at bound (/Users/user/Developer/GitRepositories/Agora/node_modules/lodash/dist/lodash.js:957:21)\n" +
      "at /Users/user/Developer/GitRepositories/Agora/lib/persistence/persistence.js:51:11\n" +
      "at /Users/user/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/cursor.js:162:16\n" +
      "at commandHandler (/Users/user/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/cursor.js:706:16)\n" +
      "at /Users/user/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/db.js:1806:9\n" +
      "at Server.Base._callHandler (/Users/user/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/connection/base.js:442:41)\n" +
      "at /Users/user/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/connection/server.js:485:18\n" +
      "at MongoReply.parseBody (/Users/user/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/responses/mongo_reply.js:68:5)";

    const shortened =
      "Error: Empfänger wurde nicht gefunden.\n" +
      "at lib/mailsender/mailsenderService.js:76:37\n" +
      "at toMember (lib/members/memberstore.js:12:3)\n" +
      "at bound (node_modules/lodash/dist/lodash.js:957:21)\n" +
      "at lib/persistence/persistence.js:51:11\n" +
      "at node_modules/mongodb/lib/mongodb/cursor.js:162:16\n" +
      "at commandHandler (node_modules/mongodb/lib/mongodb/cursor.js:706:16)\n" +
      "at node_modules/mongodb/lib/mongodb/db.js:1806:9\n" +
      "at Server.Base._callHandler (node_modules/mongodb/lib/mongodb/connection/base.js:442:41)\n" +
      "at node_modules/mongodb/lib/mongodb/connection/server.js:485:18\n" +
      "at MongoReply.parseBody (node_modules/mongodb/lib/mongodb/responses/mongo_reply.js:68:5)";

    expect(removeServerpaths(original)).to.equal(shortened);
  });
});
