'use strict';

const moment = require('moment-timezone');
const jwt = require('jwt-simple');

const conf = require('simple-configure');
const beans = conf.get('beans');
const membersService = beans.get('membersService');
const jwtSecret = conf.get('jwtSecret');

function createUserObject(req, authenticationId, legacyAuthenticationId, profile, done) {
  if (req.session.callingAppReturnTo) { // we're invoked from another app -> don't add a member to the session
    const user = {authenticationId: {newId: authenticationId, oldId: legacyAuthenticationId, profile}};
    return done(null, user);
  }
  process.nextTick(membersService.findMemberFor(req.user, authenticationId, (err, member) => {
    if (err) { return done(err); }
    if (!member) { return done(null, {authenticationId, profile}); }
    return done(null, {authenticationId, member});
  }));
}

module.exports = {
  createUserObjectFromOpenID: (req, authenticationId, openidProfile, done) => {
    const minimalProfile = openidProfile &&
      {
        emails: openidProfile.emails && [openidProfile.emails[0]],
        name: openidProfile.name,
        profileUrl: openidProfile.profileUrl
      };

    createUserObject(req, authenticationId, undefined, minimalProfile, done);
  },

  createUserObjectFromGithub: function (req, accessToken, refreshToken, githubProfile, done) {
    const minimalProfile = githubProfile &&
        {
          emails: [githubProfile._json.email],
          profileUrl: githubProfile.profileUrl,
          _json: {
            blog: githubProfile._json && githubProfile._json.blog
          }
        };

    createUserObject(req, githubProfile.provider + ':' + githubProfile.id, undefined, minimalProfile, done);
  },

  createUserObjectFromGooglePlus: function (req, iss, sub, profile, jwtClaims, accessToken, refreshToken, params, done) {
    /* eslint no-underscore-dangle: 0 */
    const googleProfile = profile._json;
    const minimalProfile = googleProfile && {
        emails: googleProfile.emails && [googleProfile.emails[0]],
        name: googleProfile.name,
        profileUrl: googleProfile.url
      };

    createUserObject(req, 'https://plus.google.com/' + sub, jwtClaims.openid_id, minimalProfile, done);
  },

  redirectToCallingApp: function redirectToCallingApp(req, res) {
    const returnTo = req.session.callingAppReturnTo;
    delete req.session.callingAppReturnTo;
    const jwtObject = {
      userId: req.user.authenticationId.newId,
      oldUserId: req.user.authenticationId.oldId,
      profile: req.user.authenticationId.profile,
      returnTo,
      expires: moment().add(5, 'seconds').toJSON()
    };
    const jwtToken = jwt.encode(jwtObject, jwtSecret);
    if (req.session.currentAgoraUser) { // restore current member info:
      req._passport.session.user = req.session.currentAgoraUser;
      delete req.session.currentAgoraUser;
    } else { // log out:
      delete req._passport.session.user;
    }
    res.redirect(conf.get('socratesURL') + '/auth/loggedIn' + '?id_token=' + jwtToken);
  }

};
