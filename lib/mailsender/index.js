"use strict";

var async = require('async');
var path = require('path');
var conf = require('nconf');

var validation = conf.get('beans').get('validation');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  // var membersAPI = conf.get('beans').get('membersAPI');
  var groupsAPI = conf.get('beans').get('groupsAPI');
  var groupsAndMembersAPI = conf.get('beans').get('groupsAndMembersAPI');
  var mailAPI = conf.get('beans').get('mailAPI');
  var Message = conf.get('beans').get('message');
  var Group = conf.get('beans').get('group');

  function messageSubmitted(req, res, next) {
    if (!req.user || !req.user.member) {
      return next(null); // error: user must be logged in
    }

    var message = new Message(req.body, req.user.member);
    var errors = validation.isValidMessage(message);
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }

    if (req.body.invitedGroups) {
      groupsAPI.getGroups(req.body.invitedGroups, function (err, groups) {
        if (err) { return next(err); }
        async.map(groups, groupsAndMembersAPI.addMembersToGroup, function (err, groups) {
          if (err) { return next(err); }
          message.setBccToGroupMemberAddresses(groups);
          mailAPI.sendMail(message, function (err) {
            if (err) { return next(err); }
            res.redirect('/mail/success');
          });
        });
      });
    }
  }

  app.get('/invitation', function (req, res, next) {
    var invitationGroup = null;
    groupsAPI.getAllAvailableGroups(function (err, allGroups) {
      if (err) { return next(err); }
      var groups = allGroups;
      var regionalGroups = groupsAPI.combineSubscribedAndAvailableGroups(invitationGroup, Group.regionalsFrom(groups));
      var thematicGroups = groupsAPI.combineSubscribedAndAvailableGroups(invitationGroup, Group.thematicsFrom(groups));
      res.render('compose', { regionalgroups: regionalGroups, themegroups: thematicGroups});
    });
  });

  app.post('/', function (req, res) {

    res.render('compose', {});
  });

  app.get('/success', function (req, res) {
    res.render('success', {});
  });

  app.post('/submit', function (req, res, next) {
    messageSubmitted(req, res, next);
  });

  return app;
};
