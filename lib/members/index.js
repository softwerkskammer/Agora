"use strict";

var path = require('path');
var conf = require('nconf');

var validation = conf.get('beans').get('validation');
var Member = conf.get('beans').get('member');
var userCommons = conf.get('beans').get('userCommons');
var api = conf.get('beans').get('membersAPI');
var groupsAndMembers = conf.get('beans').get('groupsAndMembersAPI');
var groups = conf.get('beans').get('groupsAPI');


module.exports = {
  newUserMustFillInRegistration: function (req, res, next) {
    var urlNew = '/members/new';
    var originalUrl = req.originalUrl;

    function isOK() {
      return originalUrl !== urlNew &&
        originalUrl !== '/members/submit' && //
        originalUrl !== '/auth/logout' && //
        !/.clientscripts./.test(originalUrl) && //
        !/.stylesheets./.test(originalUrl) && //
        !/.img./.test(originalUrl) && !/.checknickname./.test(originalUrl);
    }

    if (req.user && !req.user.member && isOK()) {
      return res.redirect(urlNew);
    }
    next();
  },

  create: function (app) {
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    function memberFromRequest(req) {
      return new Member({object: req.body});
    }

    function memberForNew(req) {
      return new Member({object: req.body, sessionUser: req.user});
    }

    function saveMember(memberOfRequest, previousMemberData, req, res, next) {
      api.saveMember(memberOfRequest, function (err, member) {
        if (err) {
          return next(err);
        }
        if (!req.user.member || req.user.member.id === member.id) {
          req.user.member = member;
        }

        var oldEmail = previousMemberData ? previousMemberData.email : member.email;
        return groups.updateSubscriptions(member.email, oldEmail, req.body.newSubscriptions, function (err) {
          if (err) {
            return next(err);
          }
          return res.redirect('/members/' + member.nickname);
        });
      });
    }

    function memberSubmitted(req, res, next) {
      var memberOfRequest = memberFromRequest(req);
      var errors = validation.isValidMember(memberOfRequest);
      if (errors.length !== 0) {
        return res.render('../../../views/errorPages/validationError', {errors: errors});
      }
      var nicknameOfEditMember = memberOfRequest.nickname;
      userCommons.redirectIfNotAdmin(req, res, function () {
        return api.getMemberForId(memberOfRequest.id, function (err, member) {
          if (err) {
            return next(err);
          }
          saveMember(memberOfRequest, member, req, res, next);
        });
      }, nicknameOfEditMember);
    }

    app.get('/', function (req, res, next) {
      api.allMembers(function (err, members) {
        if (err) {
          return next(err);
        }
        res.render('index', { members: members });
      });
    });

    app.get('/checknickname', function (req, res) {
      var nickname = req.query.nickname;
      api.isValidNickname(nickname, function (err, result) {
        if (err) {
          return res.end('false');
        }
        res.end(result.toString());
      });
    });

    app.get('/new', function (req, res, next) {
      if (req.user.member) {
        return res.redirect('/members/');
      }
      groups.getAllAvailableGroups(function (err, allGroups) {
        if (err) {
          return next(err);
        }
        groups.getGroup('alle', function (err, alle) {
          if (err) {
            return next(err);
          }
          groups.getGroup('commercial', function (err, commercial) {
            if (err) {
              return next(err);
            }
            res.render('edit', { member: memberForNew(req), markedGroups: groups.combineSubscribedAndAvailableGroups([alle, commercial], allGroups) });
          });
        });
      });
    });

    app.get('/edit/:nickname', function (req, res, next) {
      var nicknameOfEditMember = req.params.nickname;
      userCommons.redirectIfNotAdmin(req, res, function () {
        groupsAndMembers.getUserWithHisGroups(nicknameOfEditMember, function (err, member, subscribedGroups) {
          if (err) {
            return next(err);
          }
          if (member) {
            return groups.getAllAvailableGroups(function (err, allGroups) {
              if (err) {
                return next(err);
              }
              return res.render('edit', { member: member, markedGroups: groups.combineSubscribedAndAvailableGroups(subscribedGroups, allGroups) });
            });
          }
          res.redirect('/members/new');
        });
      }, nicknameOfEditMember);
    });

    app.post('/submit', function (req, res, next) {
      if (req.user.member) {
        return memberSubmitted(req, res, next);
      }
      var newMember = memberForNew(req);
      api.isValidNickname(req.body.nickname, function (err, result) {
        var errors = validation.isValidMember(newMember);
        if (!result) {
          errors.push('Dieser Nickname ist leider nicht verfügbar.');
        }
        if (errors.length !== 0) {
          return res.render('../../../views/errorPages/validationError', {errors: errors});
        }
        saveMember(newMember, null, req, res, next);
      });
    });

    app.get('/:nickname', function (req, res, next) {
      var globalCallback = function (err, member, subscribedGroups) {
        if (err) {
          return next(err);
        }
        res.render('get', { member: member, subscribedGroups: subscribedGroups });
      };

      groupsAndMembers.getUserWithHisGroups(req.params.nickname, globalCallback);
    });

    return app;
  }
};
