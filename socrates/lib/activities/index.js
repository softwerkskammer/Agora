'use strict';

const async = require('async');
const R = require('ramda');
const _ = require('lodash');
const moment = require('moment-timezone');

const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
const socratesActivitiesService = beans.get('socratesActivitiesService');

const eventstoreService = beans.get('eventstoreService');
const validation = beans.get('validation');
const statusmessage = beans.get('statusmessage');
const roomOptions = beans.get('roomOptions');

const activitiesService = beans.get('activitiesService');  // for fetching the SoCraTes activity from SWK
const Activity = beans.get('activity'); // for creating a new activity for SWK
const activitystore = beans.get('activitystore'); // for storing the SoCraTes activity in SWK

const reservedURLs = '^new$|^edit$|^submit$|^checkurl$\\+';

const app = misc.expressAppIn(__dirname);

function activitySubmitted(req, res, next) {
  eventstoreService.getSoCraTesCommandProcessor(req.body.url, function (err, socratesCommandProcessor) {
    if (err) { return next(err); }
    const events = socratesCommandProcessor.createConferenceEvents(req.body);
    eventstoreService.saveCommandProcessor(socratesCommandProcessor, events, function (err1) {
      if (err1 && err1.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        statusmessage.errorMessage('message.title.conflict', 'message.content.save_error_retry').putIntoSession(req);
        return res.redirect('/activities/edit/' + encodeURIComponent(req.body.previousUrl));
      }
      if (err1) { return next(err1); }

      // update the activity because we need it for the display in the SWK calendar
      activitiesService.getActivityWithGroupAndParticipants(req.body.url, function (err2, activity) { // here we need a real activity
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
  const year = req.body.startDate.split('/')[2];
  req.body.title = 'SoCraTes ' + year;
  req.body.url = 'socrates-' + year;
  req.body.location = 'Soltau, Germany'; // important because it shows up in the iCal data :-)
  req.body.assignedGroup = 'G'; // required by SWK code

  async.parallel(
    [
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        const validityChecker = function (url, cb) { eventstoreService.isValidUrl(url, cb); };
        validation.checkValidity(req.body.previousUrl.trim(), req.body.url.trim(), validityChecker, req.i18n.t('validation.url_not_available'), callback);
      },
      function (callback) {
        const errors = validation.isValidForActivity(req.body);
        return callback(null, errors);
      },
      function (callback) {
        let errors = [];
        if (req.body.previousUrl && req.body.previousUrl !== req.body.url) {
          errors.push('It is impossible to alter the year of an existing SoCraTes conference.');
        }
        return callback(null, errors);
      }
    ],
    function (err, errorMessages) {
      if (err) { return next(err); }
      const realErrors = _.filter(_.flatten(errorMessages), message => message);
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
  const duration = 2;

  socratesActivitiesService.fromWaitinglistToParticipant(req.params.nickname, req.params.roomType, duration, moment.tz(), function (err) {
    if (err) { return res.send('Error: ' + err); }
    res.send('-> Teilnehmer');
  });
});

function updateFor(updater, params, res, next) {
  updater(params, function (err) {
    if (err) { return next(err); }
    res.redirect('/registration/management');
  });
}

app.post('/newDuration', function (req, res, next) {
  updateFor(socratesActivitiesService.newDurationFor, R.pick(['nickname', 'roomType', 'duration'], req.body), res, next);
});

app.post('/newResource', function (req, res, next) {
  socratesActivitiesService.newRoomTypeFor(req.body.nickname, req.body.newResourceName, function (err) {
    if (err) {return next(err); }
    res.redirect('/registration/management');
  });
});

app.post('/newWaitinglist', function (req, res, next) {
  const waitinglistOptions = 'waitinglistOptions_' + encodeURIComponent(req.body.nickname);
  let desiredRoomTypes = req.body[waitinglistOptions];
  if (desiredRoomTypes && !(desiredRoomTypes instanceof Array)) {
    desiredRoomTypes = [desiredRoomTypes];
  }
  socratesActivitiesService.newWaitinglistFor(req.body.nickname, desiredRoomTypes, function (err) {
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
  updateFor(socratesActivitiesService.removeWaitinglistMemberFor,
    {desiredRoomTypes: [req.body.roomType], waitinglistMemberNick: req.body.waitinglistMember}, res, next);
});

module.exports = app;
