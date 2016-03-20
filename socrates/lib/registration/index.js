'use strict';
var moment = require('moment-timezone');
var _ = require('lodash');
var async = require('async');

var conf = require('simple-configure');
var beans = conf.get('beans');
var misc = beans.get('misc');
var memberstore = beans.get('memberstore');
var Member = beans.get('member');
var subscriberstore = beans.get('subscriberstore');
var activitiesService = beans.get('activitiesService');
var activityParticipantService = beans.get('activityParticipantService');
var subscriberService = beans.get('subscriberService');
var registrationService = beans.get('registrationService');
var icalService = beans.get('icalService');
var activitystore = beans.get('activitystore'); // only for iCal info
var statusmessage = beans.get('statusmessage');
var memberSubmitHelper = beans.get('memberSubmitHelper');
var socratesConstants = beans.get('socratesConstants');
var Addon = beans.get('socratesAddon');
var addonLineUtilities = beans.get('socratesAddonLineUtilities');
var Participation = beans.get('socratesParticipation');
var roomOptions = beans.get('roomOptions');
var managementService = beans.get('managementService');
var nametagService = beans.get('nametagService');
var currentUrl = beans.get('socratesConstants').currentUrl;
var currentYear = beans.get('socratesConstants').currentYear;

var eventstoreService = beans.get('eventstoreService');

var app = misc.expressAppIn(__dirname);

function registrationOpening() {
  return moment(conf.get('registrationOpensAt'));
}

function isRegistrationOpen(registrationParam) {
  return registrationOpening().isBefore(moment())
    || (registrationParam && registrationParam === conf.get('registrationParam'));
}

function registrationOpensIn() {
  var registrationOpeningTime = registrationOpening();
  var reference = moment();
  if (registrationOpeningTime.isAfter(reference)) {
    var inDays = registrationOpeningTime.diff(reference, 'days');
    var inHours = registrationOpeningTime.diff(reference.add(inDays, 'days'), 'hours');
    var inMinutes = registrationOpeningTime.diff(reference.add(inHours, 'hours'), 'minutes');
    return {days: inDays, hours: inHours, minutes: inMinutes};
  }
  return undefined;
}

app.get('/', function (req, res, next) {
  eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, function (err, registrationReadModel) {
    if (err || !registrationReadModel) { return next(err); }
    var memberId = res.locals.accessrights.memberId();
    var options = roomOptions.allRoomOptions(registrationReadModel, memberId, isRegistrationOpen(req.query.registration));
    var registration = {
      isPossible: isRegistrationOpen(req.query.registration),
      queryParam: req.query.registration,
      alreadyRegistered: registrationReadModel.isAlreadyRegistered(memberId),
      selectedOption: registrationReadModel.selectedOptionFor(memberId),
      alreadyOnWaitinglist: registrationReadModel.isAlreadyOnWaitinglist(memberId),
      opening: registrationOpening(),
      opensIn: registrationOpensIn()
    };

    res.render('get', {
      activity: {
        title: 'SoCraTes ' + socratesConstants.currentYear,
        url: socratesConstants.currentUrl,
        fullyQualifiedUrl: conf.get('socratesURL')
      },
      roomOptions: options,
      registration: registration
    });
  });
});

app.get('/ical', function (req, res, next) {
  function sendCalendarStringNamedToResult(ical, filename, localRes) {
    localRes.type('text/calendar; charset=utf-8');
    localRes.header('Content-Disposition', 'inline; filename=' + filename + '.ics');
    localRes.send(ical.toString());
  }

  // here we want to continue using the real activity:
  activitystore.getActivity(socratesConstants.currentUrl, function (err, activity) {
    if (err || !activity) { return next(err); }
    activity.state.description = '';
    sendCalendarStringNamedToResult(icalService.activityAsICal(activity), activity.url(), res);
  });
});

app.get('/interested', function (req, res) {
  res.render('iAmInterested');
});

app.post('/startRegistration', function (req, res, next) {
  if (!isRegistrationOpen(req.body.registrationParam) || !req.body.nightsOptions) { return res.redirect('/registration'); }
  var option = req.body.nightsOptions.split(',');
  var registrationTuple = {
    activityUrl: socratesConstants.currentUrl,
    resourceName: option[0], // TODO roomType
    duration: option[1],
    sessionID: req.sessionID
  };
  var participateURL = '/registration/participate';
  req.session.registrationTuple = registrationTuple; // so that we can access it again when finishing the registration
  registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
      return res.redirect('/registration');
    }
    if (!req.user) {
      req.session.returnToUrl = participateURL;
      return res.render('loginForRegistration', {returnToUrl: participateURL});
    }
    res.redirect(participateURL);
  });
});

app.get('/participate', function (req, res, next) {
  var registrationTuple = req.session.registrationTuple;
  if (!registrationTuple) { return res.redirect('/registration'); }
  if (!req.user) { return res.redirect('/registration'); }
  var member = req.user.member || new Member().initFromSessionUser(req.user, true);

  eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, function (err, readModel) {
    if (err || !readModel) { return next(err); }
    if (readModel.isAlreadyRegistered(member.id())) {
      statusmessage.successMessage('general.info', 'activities.already_registered').putIntoSession(req);
      return res.redirect('/registration');
    }
    subscriberstore.getSubscriber(member.id(), function (err1, subscriber) {
      if (err1) { return next(err1); }
      var addon = (subscriber && subscriber.addon()) || new Addon({});
      var participation = (subscriber && subscriber.currentParticipation()) || new Participation();
      var expiresAt = readModel.reservationExpiration(registrationTuple.sessionID);
      res.render('participate', {
        member: member,
        addon: addon,
        subscriber: subscriber,
        participation: participation,
        registrationTuple: registrationTuple,
        expiresIn: expiresAt && expiresAt.diff(moment(), 'minutes'),
        expiresAt: expiresAt
      });
    });
  });
});

app.post('/completeRegistration', function (req, res, next) {
  memberSubmitHelper(req, res, next, function (err) {
    if (err) { return next(err); }
    var body = req.body;
    registrationService.saveRegistration(req.user.member.id(), req.sessionID, body, function (err1, statusTitle, statusText) {
      if (err1) { return next(err1); }
      delete req.session.statusmessage;
      delete req.session.registrationTuple;
      if (statusTitle && statusText) {
        statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
        return res.redirect('/registration');
      }
      if (body.duration === 'waitinglist') {
        statusmessage.successMessage('general.info', 'activities.successfully_added_to_waitinglist').putIntoSession(req);
      } else {
        statusmessage.successMessage('general.info', 'activities.successfully_registered').putIntoSession(req);
      }
      res.redirect('/registration');
    });
  });
});

app.get('/reception', function (req, res, next) {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  activityParticipantService.getParticipantsFor(currentYear, function (err, participants) {
    if (err) { return next(err); }
    managementService.addonLinesOf(participants, function (err1, addonLines) {
      if (err1) { return next(err1); }
      res.render('reception', {
        addonLines: addonLineUtilities.groupAndSortAddonlines(addonLines)
      });
    });
  });
});

// for management tables:

app.get('/management', function (req, res, next) {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  eventstoreService.getRoomsReadModel(currentUrl, function (err0, roomsReadModel) {
    if (err0 || !roomsReadModel) { return next(err0); }

    activitiesService.getActivityWithGroupAndParticipants(currentUrl, function (err, activity) {
      if (err) { return next(err); }
      managementService.addonLinesOf(activity.participants, function (err1, addonLines) {
        if (err1) { return next(err1); }

        var formatDates = function (dates) {
          return _(dates).map(function (date) { return date.locale('de').format('L'); }).uniq().value();
        };
        var formatList = function (list) {
          return list.join(', ');
        };

        activity.waitinglistMembers = {};

        function membersOnWaitinglist(act, resourceName, globalCallback) {
          async.map(act.resourceNamed(resourceName).waitinglistEntries(),
            function (entry, callback) {
              memberstore.getMemberForId(entry.registrantId(), function (err2, member) {
                if (err2 || !member) { return callback(err2); }
                member.addedToWaitinglistAt = entry.registrationDate();
                callback(null, member);
              });
            },
            function (err2, results) {
              if (err2) { return next(err2); }
              act.waitinglistMembers[resourceName] = _.compact(results);
              globalCallback();
            });
        }

        async.each(activity.resourceNames(),
          function (resourceName, callback) { membersOnWaitinglist(activity, resourceName, callback); },
          function (err2) {
            if (err2) { return next(err2); }

            var waitinglistMembers = [];
            _.each(activity.resourceNames(), function (resourceName) {
              waitinglistMembers.push(activity.waitinglistMembers[resourceName]);
            });

            managementService.addonLinesOf(_.flatten(waitinglistMembers), function (err3, waitinglistLines) {
              if (err3 || !waitinglistLines) { return next(err3); }

              subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_double'), function (errA, unpairedDoubleParticipants) {
                if (errA) { return next(errA); }
                subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_junior'), function (errB, unpairedJuniorParticipants) {
                  if (errB) { return next(errB); }
                  subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_double'), function (errC, pairedDoubleParticipants) {
                    if (errC) { return next(errC); }
                    subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_junior'), function (errD, pairedJuniorParticipants) {
                      if (errD) { return next(errD); }
                      subscriberstore.allSubscribers(function (errE, subscribers) {
                        if (errE) { return next(errE); }
                        var currentYearSubscribers = _.filter(subscribers, function (subscriber) { return subscriber.isParticipating(); });
                        var cysThatAreNotParticipants = _.filter(currentYearSubscribers, function (subscriber) {
                          return !_.find(activity.participants, function (participant) { return participant.id() === subscriber.id(); });
                        });
                        var neitherParticipantsNorOnWaitinglist = _.filter(cysThatAreNotParticipants, function (subscriber) {
                          return !_.find(_.flatten(waitinglistMembers), function (wlMember) { return wlMember.id() === subscriber.id(); });
                        });
                        subscriberService.getMembersForSubscribers(_.flatten(neitherParticipantsNorOnWaitinglist), function (errF, exParticipants) {
                          if (errF || !exParticipants) { return next(errF); }

                          var addonLinesOfExParticipants = managementService.addonLinesOfMembersWithSubscribers(exParticipants);

                          /* eslint camelcase: 0 */
                          res.render('managementTables', {
                            activity: activity,
                            addonLines: addonLines,
                            waitinglistLines: waitinglistLines,
                            addonLinesOfUnsubscribedMembers: addonLinesOfExParticipants,
                            tshirtsizes: managementService.tshirtSizes(addonLines),
                            durations: managementService.durations(activity),
                            rooms: {
                              bed_in_double: {
                                unpairedParticipants: unpairedDoubleParticipants,
                                roomPairs: roomsReadModel.roomPairsWithFullMembersFrom('bed_in_double', pairedDoubleParticipants)
                              },
                              bed_in_junior: {
                                unpairedParticipants: unpairedJuniorParticipants,
                                roomPairs: roomsReadModel.roomPairsWithFullMembersFrom('bed_in_junior', pairedJuniorParticipants)
                              }
                            },
                            formatDates: formatDates,
                            formatList: formatList
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });

      });
    });
  });
});

app.get('/hotelInfo', function (req, res, next) {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  eventstoreService.getRoomsReadModel(currentUrl, function (err0, roomsReadModel) {
    if (err0 || !roomsReadModel) { return next(err0); }

    activitiesService.getActivityWithGroupAndParticipants(currentUrl, function (err, activity) {
      if (err) { return next(err); }
      managementService.addonLinesOf(activity.participants, function (err1, addonLines) {
        if (err1) { return next(err1); }
        subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_double'), function (errA, unpairedDoubleParticipants) {
          if (errA) { return next(errA); }
          subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_junior'), function (errB, unpairedJuniorParticipants) {
            if (errB) { return next(errB); }
            subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_double'), function (errC, pairedDoubleParticipants) {
              if (errC) { return next(errC); }
              subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_junior'), function (errD, pairedJuniorParticipants) {
                if (errD) { return next(errD); }

                res.render('hotelInfoTables', {
                  activity: activity,
                  addonLines: addonLines,
                  rooms: {
                    bed_in_double: {
                      unpairedParticipants: unpairedDoubleParticipants,
                      roomPairs: roomsReadModel.roomPairsWithFullMembersFrom('bed_in_double', pairedDoubleParticipants)
                    },
                    bed_in_junior: {
                      unpairedParticipants: unpairedJuniorParticipants,
                      roomPairs: roomsReadModel.roomPairsWithFullMembersFrom('bed_in_junior', pairedJuniorParticipants)
                    }
                  }
                });
              });
            });
          });
        });
      });
    });
  });
});

app.get('/nametags.tex', function (req, res, next) {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  activitiesService.getActivityWithGroupAndParticipants(currentUrl, function (err, activity) {
    if (err) { return next(err); }
    res.type('text/plain; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=nametags.tex');
    res.send(nametagService.nametagsFor(activity.participants));
  });
});

module.exports = app;
