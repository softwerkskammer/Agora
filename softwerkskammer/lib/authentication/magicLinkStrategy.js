"use strict";
const util = require("util");
const Strategy = require("passport-strategy");
const jwt = require("jsonwebtoken");

const MagicLinkStrategy = function (options, verify) {
  Strategy.call(this);
  this.name = "magiclink";
  this._verify = verify; // eslint-disable-line no-underscore-dangle
  // TODO remove:
  this._passReqToCallback = true; // eslint-disable-line no-underscore-dangle
  this.tokenName = options.tokenName;
  this.secret = options.secret;
};

util.inherits(MagicLinkStrategy, Strategy);

MagicLinkStrategy.prototype.authenticate = function (req, options) {
  const done = (err, user, info) => {
    if (err) {
      return this.redirect(options.failureRedirect);
    }
    return this.success(user, info);
  };

  jwt.verify(req.query[this.tokenName], this.secret, (err, payload) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return this.error(
          new Error(
            "Das Token ist bereits abgelaufen. Bitte fordere ein neues an und benutze es innerhalb von 30 Minuten.",
          ),
        );
      }
      return this.error(err);
    }
    if (!payload) {
      return this.error(
        new Error(
          "Der Magic Link ist defekt. Bitte fordere einen neuen an und stelle sicher, dass Du ihn vollständig in den Browser kopierst.",
        ),
      );
    }

    return this._verify(req, payload.authenticationId, done); // eslint-disable-line no-underscore-dangle
  });
};

module.exports = MagicLinkStrategy;
