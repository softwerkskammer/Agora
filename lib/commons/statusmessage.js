"use strict";

function statusMessage(type, title, text, additionalArguments) {
  return {
    contents: function () {
      return {
        type: type,
        title: title,
        text: text,
        additionalArguments: additionalArguments
      };
    },

    kill: function () {
      delete this.req.session.statusmessage;
    },

    putIntoSession: function (req, res) {
      if (!req.session.statusmessage) {
        req.session.statusmessage = this.contents();
      }
      if (res) {
        this.req = req;
        res.locals.statusmessage = this;
      }
    }
  };
}

module.exports = {
  fromObject: function (object) {
    return statusMessage(object.type, object.title, object.text, object.additionalArguments);
  },

  errorMessage: function (title, text, additionalArguments) {
    return statusMessage('alert-danger', title, text, additionalArguments);
  },

  successMessage: function (title, text, additionalArguments) {
    return statusMessage('alert-success', title, text, additionalArguments);
  }
};
