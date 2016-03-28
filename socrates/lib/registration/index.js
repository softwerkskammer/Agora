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
  var nightsOptions = req.body.nightsOptions;
  var option = {};
  if (!isRegistrationOpen(req.body.registrationParam) || !nightsOptions) { return res.redirect('/registration'); }
  if (nightsOptions instanceof Array) {
    option.desiredRoomTypes = nightsOptions.map(nightsOption => nightsOption.split(',')[0]);
    option.duration = 'waitinglist';
  } else {
    var splitArray = nightsOptions.split(',');
    option.roomType = splitArray[1] === 'waitinglist' ? undefined : splitArray[0];
    option.desiredRoomTypes = splitArray[1] === 'waitinglist' ? [splitArray[0]] : undefined;
    option.duration = splitArray[1];
  }
  var registrationTuple = {
    activityUrl: socratesConstants.currentUrl,
    resourceName: option.roomType, // TODO roomType
    desiredRoomTypes: option.desiredRoomTypes,
    duration: option.duration,
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
    registrationService.completeRegistration(req.user.member.id(), req.sessionID, body, function (err1, statusTitle, statusText) {
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
    eventstoreService.getRegistrationReadModel(currentUrl, function (err00, registrationReadModel) {
      if (err00 || !registrationReadModel) { return next(err00); }
      eventstoreService.getSoCraTesReadModel(currentUrl, function (err000, socratesReadModel) {
        if (err000 || !socratesReadModel) { return next(err000); }

        activityParticipantService.getParticipantsFor(currentYear, function (err_, participants) {
          if (err_) { return next(err_); }
          managementService.addonLinesOf(participants, function (err1, addonLines) {
            if (err1) { return next(err1); }

            var formatDate = function (date) {
              return moment(date).locale('de').format('L');
            };
            var formatList = function (list) {
              return list.join(', ');
            };

            var waitinglistMembers = [];

            function membersOnWaitinglist(resourceName, globalCallback) {
              async.map(registrationReadModel.allWaitinglistParticipantsIn(resourceName),
                function (entry, callback) {
                  memberstore.getMemberForId(entry.participantId, function (err2, member) {
                    if (err2 || !member) { return callback(err2); }
                    member.addedToWaitinglistAt = entry.timestamp;
                    callback(null, member);
                  });
                },
                function (err2, results) {
                  if (err2) { return next(err2); }
                  waitinglistMembers.push(_.compact(results));
                  globalCallback();
                });
            }

            async.each(roomOptions.allIds(),
              function (resourceName, callback) { membersOnWaitinglist(resourceName, callback); },
              function (err2) {
                if (err2) { return next(err2); }

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
                              return !_.find(participants, function (participant) { return participant.id() === subscriber.id(); });
                            });
                            var neitherParticipantsNorOnWaitinglist = _.filter(cysThatAreNotParticipants, function (subscriber) {
                              return !_.find(_.flatten(waitinglistMembers), function (wlMember) { return wlMember.id() === subscriber.id(); });
                            });
                            subscriberService.getMembersForSubscribers(_.flatten(neitherParticipantsNorOnWaitinglist), function (errF, exParticipants) {
                              if (errF || !exParticipants) { return next(errF); }

                              var addonLinesOfExParticipants = managementService.addonLinesOfMembersWithSubscribers(exParticipants);

                              var participantsOf = {};
                              async.each(roomOptions.allIds(), function (roomType, callback) {
                                memberstore.getMembersForIds(registrationReadModel.allParticipantsIn(roomType), function (errG, members) {
                                  if (errG || !members) { return callback(errG); }
                                  participantsOf[roomType] = members;
                                  return callback(null);
                                });
                              }, function (errX) {
                                if (errX) { return next(errX); }

                                /* eslint camelcase: 0 */
                                res.render('managementTables', {
                                  participantsOf: participantsOf,
                                  title: 'SoCraTes ' + currentYear,
                                  roomsReadModel: roomsReadModel,
                                  registrationReadModel: registrationReadModel,
                                  socratesReadModel: socratesReadModel,
                                  roomOptionIds: roomOptions.allIds(),
                                  addonLines: addonLines,
                                  waitinglistLines: waitinglistLines,
                                  addonLinesOfUnsubscribedMembers: addonLinesOfExParticipants,
                                  tshirtsizes: managementService.tshirtSizes(addonLines),
                                  durations: managementService.durations(registrationReadModel),
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
                                  formatDate: formatDate,
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
    });
  });
});

app.get('/hotelInfo', function (req, res, next) {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  eventstoreService.getRoomsReadModel(currentUrl, function (err0, roomsReadModel) {
    if (err0 || !roomsReadModel) { return next(err0); }
    eventstoreService.getRegistrationReadModel(currentUrl, function (err00, registrationReadModel) {
      if (err00 || !registrationReadModel) { return next(err00); }
      activityParticipantService.getParticipantsFor(currentYear, function (err, participants) {
        if (err) { return next(err); }
        managementService.addonLinesOf(participants, function (err1, addonLines) {
          if (err1) { return next(err1); }
          subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_double'), function (errA, unpairedDoubleParticipants) {
            if (errA) { return next(errA); }
            subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_junior'), function (errB, unpairedJuniorParticipants) {
              if (errB) { return next(errB); }
              subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_double'), function (errC, pairedDoubleParticipants) {
                if (errC) { return next(errC); }
                subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_junior'), function (errD, pairedJuniorParticipants) {
                  if (errD) { return next(errD); }

                  var participantsOf = {};
                  async.each(roomOptions.allIds(), function (roomType, callback) {
                    memberstore.getMembersForIds(registrationReadModel.allParticipantsIn(roomType), function (errE, members) {
                      if (errE || !members) { return callback(errE); }
                      participantsOf[roomType] = members;
                      return callback(null);
                    });
                  }, function (errX) {
                    if (errX) { return next(errX); }

                    res.render('hotelInfoTables', {
                      participantsOf: participantsOf,
                      registrationReadModel: registrationReadModel,
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
  });
});

app.get('/nametags.tex', function (req, res, next) {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  activityParticipantService.getParticipantsFor(currentYear, function (err, participants) {
    if (err) { return next(err); }
    res.type('text/plain; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=nametags.tex');
    res.send(nametagService.nametagsFor(participants));
  });
});

module.exports = app;
