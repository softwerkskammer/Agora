'use strict';
var moment = require('moment-timezone');
// var _ = require('lodash');
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
      selectedOptions: registrationReadModel.selectedOptionsFor(memberId),
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

  var nightsOptions = req.body.nightsOptions instanceof Array ? req.body.nightsOptions : [req.body.nightsOptions];

  var registrationTuple = {
    activityUrl: socratesConstants.currentUrl,
    sessionId: req.sessionID,
    desiredRoomTypes: []
  };

  nightsOptions.forEach(option => {
    var splitArray = option.split(',');
    if (splitArray[1] === 'waitinglist') {
      registrationTuple.desiredRoomTypes.push(splitArray[0]);
    } else {
      registrationTuple.roomType = splitArray[0];  // TODO roomType
      registrationTuple.duration = parseInt(splitArray[1], 10);
    }
  });

  var participateURL = '/registration/participate';
  req.session.registrationTuple = registrationTuple; // so that we can access it again when finishing the registration
  registrationService.startRegistration(registrationTuple, res.locals.accessrights.memberId(), moment.tz(), function (err, statusTitle, statusText) {
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
      var expiresAt = readModel.reservationExpiration(registrationTuple.sessionId);
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
      if (body.roomType && body.duration) {
        statusmessage.successMessage('general.info', 'activities.successfully_registered').putIntoSession(req);
      } else {
        statusmessage.successMessage('general.info', 'activities.successfully_added_to_waitinglist').putIntoSession(req);
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

            activityParticipantService.getWaitinglistParticipantsFor(currentYear, function (err17, waitinglistParticipants) {
              if (err17) { return next(err17); }
              managementService.addonLinesOf(waitinglistParticipants, function (err18, waitinglistAddonLines) {
                if (err18) { return next(err18); }

                var formatDate = function (date) {
                  return moment(date).locale('de').format('L');
                };
                var formatList = function (list) {
                  return list.join(', ');
                };

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
                          memberstore.getMembersForIds(registrationReadModel.allParticipantsIn(roomType), function (errG, members) {
                            if (errG || !members) { return callback(errG); }
                            participantsOf[roomType] = members;
                            return callback(null);
                          });
                        }, function (errX) {
                          if (errX) { return next(errX); }

                          var waitinglistParticipantsOf = {};
                          async.each(roomOptions.allIds(), function (roomType, callback) {
                            memberstore.getMembersForIds(registrationReadModel.allWaitinglistParticipantsIn(roomType), function (errG, members) {
                              if (errG || !members) { return callback(errG); }
                              waitinglistParticipantsOf[roomType] = members;
                              return callback(null);
                            });
                          }, function (errY) {
                            if (errY) { return next(errY); }

                            /* eslint camelcase: 0 */
                            res.render('managementTables', {
                              participantsOf: participantsOf,
                              waitinglistParticipantsOf: waitinglistParticipantsOf,
                              title: 'SoCraTes ' + currentYear,
                              roomsReadModel: roomsReadModel,
                              registrationReadModel: registrationReadModel,
                              socratesReadModel: socratesReadModel,
                              roomOptionIds: roomOptions.allIds(),
                              addonLines: addonLines,
                              waitinglistLines: waitinglistAddonLines,
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
                      _registrationReadModel: registrationReadModel,
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
