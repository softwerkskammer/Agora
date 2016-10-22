'use strict';
const moment = require('moment-timezone');
const async = require('async');
const R = require('ramda');

const conf = require('simple-configure');
const beans = conf.get('beans');
const misc = beans.get('misc');
const allCountries = beans.get('allCountries');
const memberstore = beans.get('memberstore');
const Member = beans.get('member');
const subscriberstore = beans.get('subscriberstore');
const activityParticipantService = beans.get('activityParticipantService');
const subscriberService = beans.get('subscriberService');
const registrationService = beans.get('registrationService');
const icalService = beans.get('icalService');
const activitystore = beans.get('activitystore'); // only for iCal info
const statusmessage = beans.get('statusmessage');
const memberSubmitHelper = beans.get('memberSubmitHelper');
const socratesConstants = beans.get('socratesConstants');
const Addon = beans.get('socratesAddon');
const addonLineUtilities = beans.get('socratesAddonLineUtilities');
const Participation = beans.get('socratesParticipation');
const roomOptions = beans.get('roomOptions');
const managementService = beans.get('managementService');
const nametagService = beans.get('nametagService');
const currentUrl = beans.get('socratesConstants').currentUrl;
const currentYear = beans.get('socratesConstants').currentYear;

const eventstoreService = beans.get('eventstoreService');

const app = misc.expressAppIn(__dirname);

function registrationOpening() {
  return moment(conf.get('registrationOpensAt'));
}

function isRegistrationOpen(registrationParam) {
  return registrationOpening().isBefore(moment())
    || (registrationParam && registrationParam === conf.get('registrationParam'));
}

function registrationOpensIn() {
  const registrationOpeningTime = registrationOpening();
  const reference = moment();
  if (registrationOpeningTime.isAfter(reference)) {
    const inDays = registrationOpeningTime.diff(reference, 'days');
    const inHours = registrationOpeningTime.diff(reference.add(inDays, 'days'), 'hours');
    const inMinutes = registrationOpeningTime.diff(reference.add(inHours, 'hours'), 'minutes');
    return {days: inDays, hours: inHours, minutes: inMinutes};
  }
  return undefined;
}

app.get('/', (req, res, next) => {
  eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, (err, registrationReadModel) => {
    if (err || !registrationReadModel) { return next(err); }
    eventstoreService.getRoomsReadModel(socratesConstants.currentUrl, (err2, roomsReadModel) => {
      if (err2 || !roomsReadModel) { return next(err2); }
      const memberId = res.locals.accessrights.memberId();
      const options = roomOptions.allRoomOptions(registrationReadModel, memberId, isRegistrationOpen(req.query.registration));
      const registration = {
        isPossible: isRegistrationOpen(req.query.registration),
        queryParam: req.query.registration,
        alreadyRegistered: registrationReadModel.isAlreadyRegistered(memberId),
        selectedOptions: registrationReadModel.selectedOptionsFor(memberId),
        roommate: roomsReadModel.roommateFor('bed_in_double', memberId) || roomsReadModel.roommateFor('bed_in_junior', memberId),
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
});

app.get('/ical', (req, res, next) => {
  function sendCalendarStringNamedToResult(ical, filename, localRes) {
    localRes.type('text/calendar; charset=utf-8');
    localRes.header('Content-Disposition', 'inline; filename=' + filename + '.ics');
    localRes.send(ical.toString());
  }

  // here we want to continue using the real activity:
  activitystore.getActivity(socratesConstants.currentUrl, (err, activity) => {
    if (err || !activity) { return next(err); }
    activity.state.description = '';
    sendCalendarStringNamedToResult(icalService.activityAsICal(activity), activity.url(), res);
  });
});

app.get('/interested', (req, res) => {
  res.render('iAmInterested');
});

app.post('/startRegistration', (req, res, next) => {

  if (!isRegistrationOpen(req.body.registrationParam) || !req.body.nightsOption || !req.body.roomsOptions) {
    return res.redirect('/registration');
  }
  const registrationTuple = {
    activityUrl: socratesConstants.currentUrl,
    sessionId: req.sessionID,
    desiredRoomTypes: misc.toArray(req.body.roomsOptions),
    duration: req.body.nightsOption
  };

  const participateURL = '/registration/participate';
  req.session.registrationTuple = registrationTuple; // so that we can access it again when finishing the registration
  registrationService.startRegistration(registrationTuple, res.locals.accessrights.memberId(), moment.tz(), (err, statusTitle, statusText) => {
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

app.get('/participate', (req, res, next) => {
  const registrationTuple = req.session.registrationTuple;
  if (!registrationTuple) { return res.redirect('/registration'); }
  if (!req.user) { return res.redirect('/registration'); }
  const member = req.user.member || new Member().initFromSessionUser(req.user, true);

  eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, (err, readModel) => {
    if (err || !readModel) { return next(err); }
    if (readModel.isAlreadyRegistered(member.id())) {
      statusmessage.successMessage('general.info', 'activities.already_registered').putIntoSession(req);
      return res.redirect('/registration');
    }
    subscriberstore.getSubscriber(member.id(), (err1, subscriber) => {
      if (err1) { return next(err1); }
      const addon = (subscriber && subscriber.addon()) || new Addon({});
      const participation = (subscriber && subscriber.currentParticipation()) || new Participation();
      const expiresAt = readModel.reservationExpiration(registrationTuple.sessionId);
      res.render('participate', {
        member: member,
        addon: addon,
        subscriber: subscriber,
        participation: participation,
        registrationTuple: registrationTuple,
        expiresIn: expiresAt && expiresAt.diff(moment(), 'minutes'),
        expiresAt: expiresAt,
        allCountries: allCountries.countries
      });
    });
  });
});

app.post('/completeRegistration', (req, res, next) => {
  memberSubmitHelper(req, res, next, err => {
    if (err) { return next(err); }
    const body = req.body;
    registrationService.completeRegistration(req.user.member.id(), req.sessionID, body, (err1, statusTitle, statusText) => {
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

app.get('/reception', (req, res, next) => {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  activityParticipantService.getParticipantsFor(currentYear, (err, participants) => {
    if (err) { return next(err); }
    managementService.addonLinesOf(participants, (err1, addonLines) => {
      if (err1) { return next(err1); }
      res.render('reception', {
        addonLines: addonLineUtilities.groupAndSortAddonlines(addonLines)
      });
    });
  });
});

// for management tables:

app.get('/management', (req, res, next) => {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  eventstoreService.getRoomsReadModel(currentUrl, (err0, roomsReadModel) => {
    if (err0 || !roomsReadModel) { return next(err0); }
    eventstoreService.getRegistrationReadModel(currentUrl, (err00, registrationReadModel) => {
      if (err00 || !registrationReadModel) { return next(err00); }
      eventstoreService.getSoCraTesReadModel(currentUrl, (err000, socratesReadModel) => {
        if (err000 || !socratesReadModel) { return next(err000); }

        activityParticipantService.getParticipantsFor(currentYear, (err_, participants) => {
          if (err_) { return next(err_); }
          managementService.addonLinesOf(participants, (err1, addonLines) => {
            if (err1) { return next(err1); }

            activityParticipantService.getWaitinglistParticipantsFor(currentYear, (err17, waitinglistParticipants) => {
              if (err17) { return next(err17); }
              managementService.addonLinesOf(waitinglistParticipants, (err18, waitinglistAddonLines) => {
                if (err18) { return next(err18); }

                subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_double'), (errA, unpairedDoubleParticipants) => {
                  if (errA) { return next(errA); }
                  subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_junior'), (errB, unpairedJuniorParticipants) => {
                    if (errB) { return next(errB); }
                    subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_double'), (errC, pairedDoubleParticipants) => {
                      if (errC) { return next(errC); }
                      subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_junior'), (errD, pairedJuniorParticipants) => {
                        if (errD) { return next(errD); }

                        const participantLinesOf = {};
                        roomOptions.allIds().forEach(roomType => { participantLinesOf[roomType] = []; });
                        addonLines.forEach(line => {
                          registrationReadModel.roomTypesOf(line.member.id()).forEach(roomType => { participantLinesOf[roomType].push(line); });
                        });

                        const waitinglistLinesOf = {};
                        roomOptions.allIds().forEach(roomType => { waitinglistLinesOf[roomType] = []; });
                        waitinglistAddonLines.forEach(line => {
                          registrationReadModel.roomTypesOf(line.member.id()).forEach(roomType => { waitinglistLinesOf[roomType].push(line); });
                        });

                        /* eslint camelcase: 0 */
                        res.render('managementTables', {
                          title: 'SoCraTes ' + currentYear,
                          roomsReadModel: roomsReadModel,
                          registrationReadModel: registrationReadModel,
                          socratesReadModel: socratesReadModel,
                          roomOptionIds: roomOptions.allIds(),
                          addonLines: addonLines,
                          participantLinesOf: participantLinesOf,
                          waitinglistLines: waitinglistAddonLines,
                          waitinglistLinesOf: waitinglistLinesOf,
                          tshirtsizes: managementService.tshirtSizes(addonLines),
                          durations: managementService.durations(registrationReadModel),
                          rooms: {
                            bed_in_double: {
                              unpairedParticipants: R.sortBy(participant => participant.displayName(), unpairedDoubleParticipants),
                              roomPairs: roomsReadModel.roomPairsWithFullMembersFrom('bed_in_double', pairedDoubleParticipants)
                            },
                            bed_in_junior: {
                              unpairedParticipants: R.sortBy(participant => participant.displayName(), unpairedJuniorParticipants),
                              roomPairs: roomsReadModel.roomPairsWithFullMembersFrom('bed_in_junior', pairedJuniorParticipants)
                            }
                          },
                          formatDate: date => moment(date).locale('de').format('L'),
                          formatDateTime: date => moment(date).locale('de').format('D.M.YY H:mm'),
                          formatList: list => list.join(', ')
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

app.get('/hotelInfo', (req, res, next) => {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  eventstoreService.getRoomsReadModel(currentUrl, (err0, roomsReadModel) => {
    if (err0 || !roomsReadModel) { return next(err0); }
    eventstoreService.getRegistrationReadModel(currentUrl, (err00, registrationReadModel) => {
      if (err00 || !registrationReadModel) { return next(err00); }
      activityParticipantService.getParticipantsFor(currentYear, (err, participants) => {
        if (err) { return next(err); }
        managementService.addonLinesOf(participants, (err1, addonLines) => {
          if (err1) { return next(err1); }
          subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_double'), (errA, unpairedDoubleParticipants) => {
            if (errA) { return next(errA); }
            subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsWithoutRoomIn('bed_in_junior'), (errB, unpairedJuniorParticipants) => {
              if (errB) { return next(errB); }
              subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_double'), (errC, pairedDoubleParticipants) => {
                if (errC) { return next(errC); }
                subscriberService.getMembersAndSubscribersForIds(roomsReadModel.participantsInRoom('bed_in_junior'), (errD, pairedJuniorParticipants) => {
                  if (errD) { return next(errD); }

                  const participantsOf = {};
                  async.each(roomOptions.allIds(), (roomType, callback) => {
                    memberstore.getMembersForIds(registrationReadModel.allParticipantsIn(roomType), (errE, members) => {
                      if (errE || !members) { return callback(errE); }
                      participantsOf[roomType] = members;
                      return callback(null);
                    });
                  }, errX => {
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

app.get('/nametags.tex', (req, res, next) => {
  if (!res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  activityParticipantService.getParticipantsFor(currentYear, (err, participants) => {
    if (err) { return next(err); }
    res.type('text/plain; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=nametags.tex');
    res.send(nametagService.nametagsFor(participants));
  });
});

module.exports = app;
