"use strict";
module.exports = {
  t: function (string) { return string; },
  accessrights: {
    isRegistered: function () { return true; },
    isSuperuser: function () { return true; }
  },
  user: {
    member: {
      nickname: function () { return 'nick'; }
    }
  }
};
