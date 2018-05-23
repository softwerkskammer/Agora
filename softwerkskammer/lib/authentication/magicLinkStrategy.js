'use strict';

const util = require('util');
const Strategy = require('passport-strategy');
const jwt = require('jsonwebtoken');

const MagicLinkStrategy = function (options, verify) {
  Strategy.call(this);
  this.name = 'magiclink';
  this._verify = verify; // eslint-disable-line no-underscore-dangle
  this._passReqToCallback = true; // eslint-disable-line no-underscore-dangle
  this.tokenName = options.tokenName;
  this.secret = options.secret;
};

util.inherits(MagicLinkStrategy, Strategy);

MagicLinkStrategy.prototype.authenticate = function (req, options) {

  const done = (err, user, info) => {
    if (err) { return this.redirect(options.failureRedirect); }
    return this.success(user, info);
  };

  jwt.verify(req.query[this.tokenName], this.secret, (err, payload) => {
    if (err || !payload) { return done(err); }

    return this._verify(req, payload.authenticationId, done); // eslint-disable-line no-underscore-dangle
  });
};

module.exports = MagicLinkStrategy;
