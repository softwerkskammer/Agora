'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
var socratesActivitiesService = beans.get('socratesActivitiesService');

var eventstoreService = beans.get('eventstoreService');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');
var roomOptions = beans.get('roomOptions');

var activitiesService = beans.get('activitiesService');  // for fetching the SoCraTes activity from SWK
var Activity = beans.get('activity'); // for creating a new activity for SWK
var activitystore = beans.get('activitystore'); // for storing the SoCraTes activity in SWK

var reservedURLs = '^new$|^edit$|^submit$|^checkurl$\\+';

var app = misc.expressAppIn(__dirname);

function activitySubmitted(req, res, next) {
  eventstoreService.getSoCraTesCommandProcessor(req.body.previousUrl, function (err, socratesCommandProcessor) {
    if (err) { return next(err); }
    socratesCommandProcessor.setConferenceDetails(req.body);
    eventstoreService.saveCommandProcessor(socratesCommandProcessor, function (err1) {
      if (err1 && err1.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        statusmessage.errorMessage('message.title.conflict', 'message.content.save_error_retry').putIntoSession(req);
        return res.redirect('/activities/edit/' + encodeURIComponent(req.body.previousUrl));
      }
      if (err1) { return next(err1); }

      // update the activity because we need it for the display in the SWK calendar
      // TODO SWK must not create activities whose URLs start with 'socrates-'!
      activitiesService.getActivityWithGroupAndParticipants(req.body.previousUrl, function (err2, activity) { // here we need a real activity
        if (err2) { return next(err2); }
        if (!activity) { activity = new Activity({owner: req.user.member.id()}); }
        req.body.isSoCraTes = true; // mark activity as SoCraTes activity (important for SWK)
        activity.fillFromUI(req.body);
        activitystore.saveActivity(activity, function (err3) {
          if (err3 && err3.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            statusmessage.errorMessage('message.title.conflict', 'message.content.save_error_retry').putIntoSession(req);
            return res.redirect('/activities/edit/' + encodeURIComponent(activity.url()));
          }
          if (err3) { return next(err3); }
          statusmessage.successMessage('message.title.save_successful', 'message.content.activities.saved').putIntoSession(req);
          res.redirect('/registration/');
        });
      });
    });
  });
}

app.get('/new', function (req, res) {
  res.render('edit', {socratesReadModel: eventstoreService.newSoCraTesReadModel(), roomTypes: roomOptions.allIds()});
});

app.get('/edit/:url', function (req, res, next) {
  eventstoreService.getSoCraTesReadModel(req.params.url, function (err, socratesReadModel) {
    if (err || !socratesReadModel) { return next(err); }
    if (!res.locals.accessrights.canEditActivity()) {
      return res.redirect('/registration/');
    }
    res.render('edit', {socratesReadModel: socratesReadModel, roomTypes: roomOptions.allIds()});
  });
});

app.post('/submit', function (req, res, next) {
  var year = req.body.startDate.split('/')[2];
  req.body.title = 'SoCraTes ' + year;
  req.body.url = 'socrates-' + year;
  req.body.location = 'Soltau, Germany'; // important because it shows up in the iCal data :-)
  req.body.assignedGroup = 'G'; // required by SWK code

  async.parallel(
    [
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (url, cb) { eventstoreService.isValidUrl(url, cb); };
        validation.checkValidity(req.body.previousUrl.trim(), req.body.url.trim(), validityChecker, req.i18n.t('validation.url_not_available'), callback);
      },
      function (callback) {
        var errors = validation.isValidForActivity(req.body);
        return callback(null, errors);
      }
    ],
    function (err, errorMessages) {
      if (err) { return next(err); }
      var realErrors = _.filter(_.flatten(errorMessages), function (message) { return !!message; });
      if (realErrors.length === 0) {
        return activitySubmitted(req, res, next);
      }
      return res.render('../../../views/errorPages/validationError', {errors: realErrors});
    }
  );
});

app.get('/checkurl', function (req, res) {
  misc.validate(req.query.url, req.query.previousUrl, _.partial(eventstoreService.isValidUrl, reservedURLs), res.end);
});

// for management tables:

app.get('/fromWaitinglistToParticipant/:roomType/:nickname', function (req, res) {
  var duration = 2;

  socratesActivitiesService.fromWaitinglistToParticipant(req.params.nickname, req.params.roomType, duration, moment.tz(), function (err) {
    if (err) { return res.send('Error: ' + err); }
    res.send('-> Teilnehmer');
  });
});

app.post('/newDuration', function (req, res, next) {
  socratesActivitiesService.newDurationFor(req.body.nickname, req.body.roomType, req.body.duration, function (err) {
    if (err) {return next(err); }
    res.redirect('/registration/management');
  });
});

app.post('/newResource', function (req, res, next) {
  socratesActivitiesService.newRoomTypeFor(req.body.nickname, req.body.newResourceName, function (err) {
    if (err) {return next(err); }
    res.redirect('/registration/management');
  });
});

app.post('/newWaitinglist', function (req, res, next) {
  socratesActivitiesService.newWaitinglistFor(req.body.nickname, req.body.newResourceName, function (err) {
    if (err) {return next(err); }
    res.redirect('/registration/management');
  });
});

app.post('/newParticipantPair', function (req, res, next) {
  socratesActivitiesService.addParticipantPairFor(req.body.roomType, req.body.participant1, req.body.participant2, function (err) {
    if (err) { return next(err); }
    res.redirect('/registration/management');
  });
});

app.post('/removeParticipantPair', function (req, res, next) {
  socratesActivitiesService.removeParticipantPairFor(req.body.roomType, req.body.participant1, req.body.participant2, function (err) {
    if (err) { return next(err); }
    res.redirect('/registration/management');
  });
});

app.post('/removeParticipant', function (req, res, next) {
  socratesActivitiesService.removeParticipantFor(req.body.roomType, req.body.participant, function (err) {
    if (err) { return next(err); }
    res.redirect('/registration/management');
  });
});

app.post('/removeWaitinglistMember', function (req, res, next) {
  socratesActivitiesService.removeWaitinglistMemberFor(req.body.roomType, req.body.waitinglistMember, function (err) {
    if (err) { return next(err); }
    res.redirect('/registration/management');
  });
});

module.exports = app;
