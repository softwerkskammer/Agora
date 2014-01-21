"use strict";

function StatusMessage(type, title, text, additionalArguments) {
  this.type = type;
  this.title = title;
  this.text = text;
  this.additionalArguments = additionalArguments;
}

StatusMessage.prototype.kill = function () {
  delete this.req.session.statusmessage;
};

function putIntoSession(message, req, res) {
  if (!req.session.statusmessage) {
    req.session.statusmessage = message;
  }
  if (res) {
    message.req = req;
    res.locals.statusmessage = message;
  }
}

module.exports = {
  fromObject: function (object, req, res) {
    putIntoSession(new StatusMessage(object.type, object.title, object.text, object.additionalArguments), req, res);
  },

  errorMessage: function (req, title, text, additionalArguments) {
    putIntoSession(new StatusMessage('alert-danger', title, text, additionalArguments), req);
  },

  successMessage: function (req, title, text, additionalArguments) {
    putIntoSession(new StatusMessage('alert-success', title, text, additionalArguments), req);
  }
};
