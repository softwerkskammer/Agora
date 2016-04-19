'use strict';

var moment = require('moment-timezone');
var jwt = require('jwt-simple');

// var logger = require('winston').loggers.get('authorization');

const conf = require('simple-configure');
var beans = conf.get('beans');
var membersService = beans.get('membersService');
var jwtSecret = conf.get('jwtSecret');

function createUserObject(req, authenticationId, legacyAuthenticationId, profile, done) {
  if (req.session.callingAppReturnTo) { // we're invoked from another app -> don't add a member to the session
    const user = {authenticationId: {newId: authenticationId, oldId: legacyAuthenticationId, profile: profile}};
    return done(null, user);
  }
  process.nextTick(membersService.findMemberFor(req.user, authenticationId, legacyAuthenticationId, function (err, member) {
    if (err) { return done(err); }
    if (!member) { return done(null, {authenticationId: authenticationId, profile: profile}); }
    return done(null, {authenticationId: authenticationId, member: member});
  }));
}

module.exports = {
  createUserObjectFromOpenID: function (req, authenticationId, profile, done) {
    function minimalProfileFrom(openidProfile) {
      if (!openidProfile) {
        return undefined;
      }
      return {
        emails: openidProfile.emails && [openidProfile.emails[0]],
        name: openidProfile.name,
        profileUrl: openidProfile.profileUrl
      };
    }

    createUserObject(req, authenticationId, undefined, minimalProfileFrom(profile), done);
  },

  createUserObjectFromGithub: function (req, accessToken, refreshToken, profile, done) {
    function minimalProfileFrom(githubProfile) {
      if (!githubProfile) {
        return undefined;
      }
      return {
        emails: [githubProfile._json.email],
        profileUrl: githubProfile.profileUrl,
        _json: {
          blog: githubProfile._json && githubProfile._json.blog
        }
      };
    }

    createUserObject(req, profile.provider + ':' + profile.id, undefined, minimalProfileFrom(profile), done);
  },

  createUserObjectFromGooglePlus: function (req, iss, sub, profile, jwtClaims, accessToken, refreshToken, params, done) {
    function minimalProfileFrom(googleProfile) {
      if (!googleProfile) {
        return undefined;
      }
      return {
        emails: googleProfile.emails && [googleProfile.emails[0]],
        name: googleProfile.name,
        profileUrl: googleProfile.url
      };
    }

    /* eslint no-underscore-dangle: 0 */
    createUserObject(req, 'https://plus.google.com/' + sub, jwtClaims.openid_id, minimalProfileFrom(profile._json), done);
  },

  redirectToCallingApp: function (req, res) {

    var returnTo = req.session.callingAppReturnTo;
    delete req.session.callingAppReturnTo;
    const jwtObject = {
      userId: req.user.authenticationId.newId,
      oldUserId: req.user.authenticationId.oldId,
      profile: req.user.authenticationId.profile,
      returnTo: returnTo,
      expires: moment().add(5, 'seconds').toJSON()
    };
    var jwtToken = jwt.encode(jwtObject, jwtSecret);
    if (req.session.currentAgoraUser) { // restore current member info:
      req._passport.session.user = req.session.currentAgoraUser;
      delete req.session.currentAgoraUser;
    } else { // log out:
      delete req._passport.session.user;
    }
    res.redirect(conf.get('socratesURL') + '/auth/loggedIn' + '?id_token=' + jwtToken);
  }

};
