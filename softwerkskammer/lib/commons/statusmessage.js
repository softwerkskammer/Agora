function statusMessage(type, title, text, additionalArguments) {
  return {
    contents: function contents() {
      return {
        type,
        title,
        text,
        additionalArguments
      };
    },

    kill: function kill() {
      delete this.req.session.statusmessage;
    },

    putIntoSession: function putIntoSession(req, res) {
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
  fromObject: function fromObject(object) {
    return statusMessage(object.type, object.title, object.text, object.additionalArguments);
  },

  errorMessage: function errorMessage(title, text, additionalArguments) {
    return statusMessage('alert-danger', title, text, additionalArguments);
  },

  successMessage: function successMessage(title, text, additionalArguments) {
    return statusMessage('alert-success', title, text, additionalArguments);
  }
};
