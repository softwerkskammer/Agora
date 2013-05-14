"use strict";

var async = require('async');
var path = require('path');
var _ = require('underscore');
var conf = require('nconf');

var validation = conf.get('beans').get('validation');

var invitationLinkFor = function (activity) {
  return '\n' + conf.get('publicUrlPrefix') + '/activities/subscribe/' + activity.url;
};

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  // var membersAPI = conf.get('beans').get('membersAPI');
  var groupsAPI = conf.get('beans').get('groupsAPI');
  var activitiesAPI = conf.get('beans').get('activitiesAPI');
  var groupsAndMembersAPI = conf.get('beans').get('groupsAndMembersAPI');
  var mailsenderAPI = conf.get('beans').get('mailsenderAPI');
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
          mailsenderAPI.sendMail(message, function (err) {
            if (err) { return next(err); }
            res.redirect('/mailsender/success');
          });
        });
      });
    }
  }

  app.post('/invitation', function (req, res, next) {
    async.parallel({
        activity: function (callback) { activitiesAPI.getActivity(req.body.activityUrl, callback); },
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); }
      },
      function (err, results) {
        if (err || !results.activity) { return next(err); }
        var activity = results.activity;
        var invitationGroup = _.find(results.groups, function (group) { group.id === activity.assignedGroup; });
        var regionalGroups = groupsAPI.combineSubscribedAndAvailableGroups(invitationGroup, Group.regionalsFrom(results.groups));
        var thematicGroups = groupsAPI.combineSubscribedAndAvailableGroups(invitationGroup, Group.thematicsFrom(results.groups));
        var invitationLink = invitationLinkFor(activity);
        var message = new Message();
        message.setSubject('Einladung: ' + activity.title);
        message.setMarkdown(activity.description + "\n\n" + invitationLink);
        res.render('compose', { message: message, regionalgroups: regionalGroups, themegroups: thematicGroups});
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
