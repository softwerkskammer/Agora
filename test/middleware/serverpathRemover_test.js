"use strict";

var expect = require('chai').expect;

var beans = require('../configureForTest').get('beans');
var serverpathRemover = beans.get('serverpathRemover');

describe('serverpathRemover removes any paths', function () {

  var removeServerpaths;

  before(function () {
    var res = {locals: {}};
    var next = function () {};
    serverpathRemover(null, res, next);
    removeServerpaths = res.locals.removeServerpaths;
  });

  it('that comes before node_modules', function () {
    expect(removeServerpaths('error message /usr/local/something/node_modules/some_other/lib/')).to.equal('error message node_modules/some_other/lib/');
  });

  it('that comes before lib', function () {
    expect(removeServerpaths('error 500 /usr/home/username/path_to_installation/agora/lib/paaath/node_modules/')).to.equal('error 500 lib/paaath/node_modules/');
  });

  it('that comes before lib or node_modules', function () {
    expect(removeServerpaths('error 500 /dir1/dir2/dir3/lib/node_modules/etc and also /path1/path2/path3/node_modules/lib/etc')).to.equal('error 500 lib/node_modules/etc and also node_modules/lib/etc');
  });

  it('copes with long strings', function () {
    var original = "Error: Empfänger wurde nicht gefunden.\n" +
    "at /Users/rauch/Developer/GitRepositories/Agora/lib/mailsender/mailsenderAPI.js:76:37\n" +
    "at toMember (/Users/rauch/Developer/GitRepositories/Agora/lib/members/memberstore.js:12:3)\n" +
    "at bound (/Users/rauch/Developer/GitRepositories/Agora/node_modules/lodash/dist/lodash.js:957:21)\n" +
    "at /Users/rauch/Developer/GitRepositories/Agora/lib/persistence/persistence.js:51:11\n" +
    "at /Users/rauch/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/cursor.js:162:16\n" +
    "at commandHandler (/Users/rauch/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/cursor.js:706:16)\n" +
    "at /Users/rauch/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/db.js:1806:9\n" +
    "at Server.Base._callHandler (/Users/rauch/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/connection/base.js:442:41)\n" +
    "at /Users/rauch/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/connection/server.js:485:18\n" +
    "at MongoReply.parseBody (/Users/rauch/Developer/GitRepositories/Agora/node_modules/mongodb/lib/mongodb/responses/mongo_reply.js:68:5)";

    var shortened = "Error: Empfänger wurde nicht gefunden.\n" +
    "at lib/mailsender/mailsenderAPI.js:76:37\n" +
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
