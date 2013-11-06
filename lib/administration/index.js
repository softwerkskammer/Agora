"use strict";

var path = require('path');

module.exports = function (app) {

  var beans = require('nconf').get('beans');
  var membersAPI = beans.get('membersAPI');
  var groupsAPI = beans.get('groupsAPI');
  var activityAPI = beans.get('activitiesCoreAPI');
  var announcementAPI = beans.get('announcementsAPI');
  var colorAPI = beans.get('colorAPI');
  var Color = beans.get('color');
  var Group = beans.get('group');
  var statusmessage = beans.get('statusmessage');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/memberTable', function (req, res, next) {
    membersAPI.allMembers(function (err, members) {
      if (err) { return next(err); }
      res.render('memberTable', { members: members });
    });
  });

  app.get('/groupTable', function (req, res, next) {
    groupsAPI.getAllAvailableGroups(function (err, groups) {
      if (err) { return next(err); }
      res.render('groupTable', { groups: groups, groupTypes: Group.allTypes() });
    });
  });

  app.get('/activityTable', function (req, res, next) {
    activityAPI.allActivities(function (err, activities) {
      if (err) { return next(err); }
      groupsAPI.getAllAvailableGroups(function (err, groups) {
        res.render('activityTable', { activities: activities, groups: groups});
      });
    });
  });

  app.get('/colors', function (req, res, next) {
    colorAPI.allColors(function (err, colors) {
      if (err) {
        return next(err);
      }
      res.render('colors', { colors: colors });
    });
  });

  app.post('/submitColors', function (req, res, next) {
    var idWithColorPairs = req.body;
    var colors = [];
    for (var id in idWithColorPairs) {
      colors.push(new Color({id: id, color: idWithColorPairs[id]}));
    }
    colorAPI.saveColors(colors, function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage('Speichern erfolgreich', 'Deine Farben wurden gespeichert.').putInSession(req);
      res.redirect('/administration/colors');
    });
  });

  app.post('/submitNewColor', function (req, res, next) {
    colorAPI.saveColor(new Color(req.body), function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage('Speichern erfolgreich', 'Die neue Farbe wurde gespeichert.').putInSession(req);
      res.redirect('/administration/colors');
    });
  });

  app.get('/announcementTable', function (req, res, next) {
    announcementAPI.allAnnouncements(function (err, announcements) {
      if (err) {
        return next(err);
      }
      res.render('announcementTable', { announcements: announcements });
    });
  });

  app.post('/announcementChanged', function (req, res) {
    announcementAPI.updateAnnouncementFieldWith(req.body.pk, req.body.name, req.body.value, function (successful, errors) {
      if (successful) { return res.send(200, "OK"); }
      res.send(500, errors.join(', '));
    });
  });

  return app;
};
