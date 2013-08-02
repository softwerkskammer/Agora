"use strict";

var async = require('async');
var path = require('path');
var _ = require('underscore');
var conf = require('nconf');

var validation = conf.get('beans').get('validation');

var invitationLinkFor = function (activity) {
  var url = conf.get('publicUrlPrefix') + '/activities/subscribe/' + activity.url;
  var text = 'Ich bin dabei!';
  var button = '<table style="border-collapse: collapse;"><tr><td style="border-style: solid; border-color: #E0E4EF #C8D2F0 #C8D2F0 #E0E4EF; border-width: 1px; padding: 5px 10px; background-color: #ECF0FA;"><a target="_blank" style="display: block; text-decoration: none; color: #0000CC!important; font-weight: bold; font-size: 1.1em;" href="' +
    url + '"><font color="#0000CC">' + text + '</font></a></td></tr></table>';

  return '\n\n' + '<table cellspacing="0" cellpadding="0" style="margin: 20px 0;"><tr style="font-weight: bold;">' +
    '<td style="padding-right: 5px;">' + button + '</td>' +
    '</tr></table>';
};

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var membersAPI = conf.get('beans').get('membersAPI');
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

    // TODO: Hier muss der Code zusammengefasst werden!
    // Zuerst die Mail-Informationen aufsammeln und danach die Mail versenden

    var message = new Message(req.body, req.user.member);
    var errors = validation.isValidMessage(message);
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }

    if (req.body.invitedGroups) {
      return groupsAPI.getGroups(req.body.invitedGroups, function (err, groups) {
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
    if (req.body.nickname) {
      return membersAPI.getMember(req.body.nickname, function (err, member) {
        if (err) {return next(err); }
        message.setReceiver(member);

        mailsenderAPI.sendMail(message, function (err) {
          if (err) { return next(err); }
          res.redirect('/mailsender/success');
        });
      });
    }
  }

  app.get('/invitation/:activityUrl', function (req, res, next) {
    async.parallel({
        activity: function (callback) { activitiesAPI.getActivity(req.params.activityUrl, callback); },
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); }
      },
      function (err, results) {
        if (err || !results.activity) { return next(err); }
        var activity = results.activity;
        var invitationGroup = _.find(results.groups, function (group) { return group.id === activity.assignedGroup; });
        var regionalGroups = groupsAPI.combineSubscribedAndAvailableGroups([invitationGroup], Group.regionalsFrom(results.groups));
        var thematicGroups = groupsAPI.combineSubscribedAndAvailableGroups([invitationGroup], Group.thematicsFrom(results.groups));

        var message = new Message();
        message.setSubject('Einladung: ' + activity.title);
        message.setMarkdown(activity.description + '\n\n ** Datum:** ' + activity.startDate() + ', ' + activity.startTime() + '\n\n**Ort:** ' + activity.location + '\n\n **Wegbeschreibung:**\n\n' + activity.direction);
        message.setHtmlAddOn(invitationLinkFor(activity));
        res.render('compose', { message: message, regionalgroups: regionalGroups, themegroups: thematicGroups });
      });
  });

  app.post('/', function (req, res) {
    res.render('compose', {});
  });

  app.get('/contactMember/:nickname', function (req, res, next) {
    membersAPI.getMember(req.params.nickname, function (err, member) {
      if (err) {return next(err); }
      var message = new Message();
      message.setReceiver(member);
      res.render('compose', {message: message});
    });
  });

  app.get('/success', function (req, res) {
    res.render('success', {});
  });

  app.post('/send', function (req, res, next) {
    messageSubmitted(req, res, next);
  });

  return app;
};
