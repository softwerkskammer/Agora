"use strict";

function StatusMessage(type, title, text, additionalArguments) {
  this.type = type;
  this.title = title;
  this.text = text;
  this.additionalArguments = additionalArguments;
}

StatusMessage.prototype.putInSession = function (req, res) {
  req.session.statusmessage = this;
  if (res) {
    this.transferToLocals(req, res);
  }
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
    return new StatusMessage(object.type, object.title, object.text, object.additionalArguments);
  },

  errorMessage: function (title, text, additionalArguments) {
    return new StatusMessage('alert-danger', title, text, additionalArguments);
  },

  infoMessage: function (title, text, additionalArguments) {
    return new StatusMessage('alert-info', title, text, additionalArguments);
  },

  successMessage: function (title, text, additionalArguments) {
    return new StatusMessage('alert-success', title, text, additionalArguments);
  }
};
