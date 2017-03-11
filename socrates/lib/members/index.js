'use strict';

const async = require('async');
const Form = require('multiparty').Form;
const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const membersService = beans.get('membersService');
const subscriberService = beans.get('subscriberService');
const socratesMembersService = beans.get('socratesMembersService');
const eventstoreService = beans.get('eventstoreService');
const Member = beans.get('member');
const memberSubmitHelper = beans.get('memberSubmitHelper');
const subscriberstore = beans.get('subscriberstore');
const socratesConstants = beans.get('socratesConstants');
const allCountries = beans.get('allCountries');
const memberstore = beans.get('memberstore');
const statusmessage = beans.get('statusmessage');

const participantsOverviewUrlPrefix = '/wiki/' + socratesConstants.currentYear + '/participantsOverview#';

function editMember(req, res, next, returnToParticipantsListing, memberToEdit, subscriberToEdit) {
  if (!req.user.member) {
    return res.render('edit', {member: new Member().initFromSessionUser(req.user, true), allCountries: allCountries.countries});
  }
  const member = memberToEdit || req.user.member;
  const subscriber = subscriberToEdit || req.user.subscriber;
  eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, (err, readModel) => {
    if (err || !readModel) { return next(err); }
    const registeredResources = readModel.roomTypesOf(member.id());
    const options = {
      member,
      subscriber,
      addon: subscriber && subscriber.addon().homeAddress() ? subscriber.addon() : undefined,
      participation: subscriber && subscriber.isParticipating() ? subscriber.currentParticipation() : null,
      sharesARoom: registeredResources.length === 1 && registeredResources[0].indexOf('bed_in_') > -1,
      returnToParticipantsListing,
      allCountries: allCountries.countries
    };
    res.render('edit', options);
  });
}

function deleteAvatar(req, res, next, forwardPrefix) {
  const nicknameOfEditMember = req.body.nickname;
  memberstore.getMember(nicknameOfEditMember, (err, member) => {
    if (err) { return next(err); }
    if (res.locals.accessrights.canEditMember(member)) {
      return membersService.deleteCustomAvatarForNickname(nicknameOfEditMember, err2 => {
        if (err2) { return next(err2); }
        res.redirect(forwardPrefix + encodeURIComponent(nicknameOfEditMember));
      });
    }
    res.redirect(forwardPrefix + encodeURIComponent(nicknameOfEditMember));
  });
}

const app = misc.expressAppIn(__dirname);

app.get('/checknickname', (req, res) => {
  misc.validate(req.query.nickname, req.query.previousNickname, membersService.isValidNickname, res.end);
});

app.get('/checkemail', (req, res) => {
  misc.validate(req.query.email, req.query.previousEmail, membersService.isValidEmail, res.end);
});

app.get('/edit', (req, res, next) => {
  editMember(req, res, next);
});

app.get('/edit/:nickname', (req, res, next) => {
  const nickname = req.params.nickname;
  if (res.locals.user.member.nickname() !== nickname && !res.locals.accessrights.isSuperuser()) {
    return next(); // provoke a 404
  }
  memberstore.getMember(nickname, (err, member) => {
    if (err || !member) { return next(err); }
    subscriberstore.getSubscriber(member.id(), (err1, subscriber) => {
      if (err1 || !subscriber) { return next(err1); }
      editMember(req, res, next, null, member, subscriber);
    });
  });
});

app.get('/editForParticipantListing', (req, res, next) => {
  editMember(req, res, next, 'returnToParticipantsListing');
});

app.post('/delete', (req, res, next) => {
  const nicknameOfEditMember = req.body.nickname;
  subscriberstore.getSubscriberByNickname(nicknameOfEditMember, (err, subscriber) => {
    if (err || !subscriber) { return next(err); }
    if (!res.locals.accessrights.canDeleteMember(subscriber)) {
      return res.redirect('/members/' + encodeURIComponent(nicknameOfEditMember));
    }
    socratesMembersService.participationStatus(subscriber, (err1, isParticipant) => {
      if (err1) { return next(err1); }
      if (isParticipant) {
        statusmessage.errorMessage('message.title.problem', 'message.content.members.hasParticipated').putIntoSession(req);
        return res.redirect('/members/' + encodeURIComponent(nicknameOfEditMember));
      }
      subscriberService.removeSubscriber(subscriber, err2 => {
        if (err2) { return next(err2); }
        statusmessage.successMessage('message.title.save_successful', 'message.content.members.deleted').putIntoSession(req);
        res.redirect(participantsOverviewUrlPrefix);
      });
    });
  });
});

app.post('/submit', (req, res, next) => {
  const editedData = req.body;
  const returnToParticipantsListing = editedData.returnToParticipantsListing;
  memberSubmitHelper(req, res, next, err => {
    if (err) { return next(err); }
    const memberId = editedData.id;
    const nickname = editedData.nickname;
    subscriberstore.getSubscriber(memberId, (err1, subscriber) => {
      if (err1) { return next(err1); }
      subscriber.fillFromUI(req.body);
      subscriberstore.saveSubscriber(subscriber, err2 => {
        if (err2) { return next(err2); }
        if (returnToParticipantsListing) {
          return res.redirect(participantsOverviewUrlPrefix + encodeURIComponent(nickname));
        }
        res.redirect('/');
      });
    });

  });
});

app.post('/submitavatar', (req, res, next) => {
  new Form().parse(req, (err, fields, files) => {
    const nickname = fields.nickname[0];
    if (err || !files || files.length < 1) {
      return res.redirect('/members/' + nickname);
    }
    const params = {
      geometry: fields.w[0] + 'x' + fields.h[0] + '+' + fields.x[0] + '+' + fields.y[0],
      scale: fields.scale[0],
      angle: fields.angle[0]
    };
    membersService.saveCustomAvatarForNickname(nickname, files, params, err2 => {
      if (err2) { return next(err2); }
      if (fields.returnToParticipantsListing[0]) {
        return res.redirect(participantsOverviewUrlPrefix + encodeURIComponent(nickname));
      }
      res.redirect('/members/' + encodeURIComponent(nickname)); // Es fehlen Prüfungen im Frontend
    });
  });
});

app.post('/deleteAvatarFor', (req, res, next) => {
  deleteAvatar(req, res, next, '/members/');
});

app.post('/deleteAvatarInOverviewFor', (req, res, next) => {
  deleteAvatar(req, res, next, participantsOverviewUrlPrefix);
});

app.get('/:nickname', (req, res, next) => {
  subscriberService.getMemberIfSubscriberExists(req.params.nickname, (err, member) => {
    if (err || !member) { return next(err); }
    eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, (err2, registrationReadModel) => {
      if (err2 || !registrationReadModel) { return next(err2); }
      eventstoreService.getRoomsReadModel(socratesConstants.currentUrl, (err3, roomsReadModel) => {
        if (err3 || !roomsReadModel) { return next(err3); }

        // only when a participant looks at their own profile!
        let registeredInRoomType = registrationReadModel.registeredInRoomType(member.id());
        const isInDoubleBedRoom = registeredInRoomType && registeredInRoomType.indexOf('bed_in_') > -1;
        const roommateId = isInDoubleBedRoom && roomsReadModel.roommateFor(registeredInRoomType, member.id());
        memberstore.getMemberForId(roommateId, (err4, roommate) => {
          let potentialRoommates = [];
          if (err4) { return next(err4); }

          if (registeredInRoomType && !roommate) {
            potentialRoommates = roomsReadModel.participantsWithoutRoomIn(registeredInRoomType);
            const index = potentialRoommates.indexOf(member.id());
            potentialRoommates.splice(index, 1);
          }
          memberstore.getMembersForIds(potentialRoommates, (err4a, potentialRoommateMembers) => {
            if (err4a) { return next(err4a); }
            async.each(potentialRoommateMembers, membersService.putAvatarIntoMemberAndSave, err5 => {
              if (err5) { return next(err5); }
              res.render('get', {
                member,
                roommate,
                potentialRoommates: potentialRoommateMembers,
                registration: {
                  isInDoubleBedRoom,
                  alreadyRegistered: !!registeredInRoomType,
                  alreadyOnWaitinglist: registrationReadModel.isAlreadyOnWaitinglist(member.id())
                }
              });
            });
          });
        });
      });
    });
  });
});

module.exports = app;
