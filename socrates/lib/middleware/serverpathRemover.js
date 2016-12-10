'use strict';

module.exports = function (req, res, next) {
  res.locals.removeServerpaths = msg => {
    // find the path that comes before node_modules or lib:
    const pathToBeRemoved = /\/[^ ]*?\/(?=(node_modules|socrates\/lib|softwerkskammer\/lib)\/)/.exec(msg);
    if (pathToBeRemoved) {
      return msg.replace(new RegExp(pathToBeRemoved[0], 'g'), '');
    }
    return msg;
  };
  next();
};
