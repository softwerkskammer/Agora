"use strict";

function StatusMessage(type, title, text) {
  this.type = type;
  this.title = title;
  this.text = text;
}

StatusMessage.prototype.putInSession = function (req) {
  req.session.statusmessage = this;
};

StatusMessage.prototype.transferToLocals = function (req, res) {
  this.req = req;
  res.locals.statusmessage = this;
};

StatusMessage.prototype.kill = function () {
  delete this.req.session.statusmessage;
};

module.exports = {
  fromObject: function (object) {
    return new StatusMessage(object.type, object.title, object.text);
  },

  errorMessage: function (title, text) {
    return new StatusMessage('alert-error', title, text);
  },

  infoMessage: function (title, text) {
    return new StatusMessage('alert-info', title, text);
  },

  successMessage: function (title, text) {
    return new StatusMessage('alert-success', title, text);
  }
};
