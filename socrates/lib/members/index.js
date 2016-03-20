'use strict';

var async = require('async');
var Form = require('multiparty').Form;
var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var subscriberService = beans.get('subscriberService');
var socratesMembersService = beans.get('socratesMembersService');
var eventstoreService = beans.get('eventstoreService');
var Member = beans.get('member');
var memberSubmitHelper = beans.get('memberSubmitHelper');
var subscriberstore = beans.get('subscriberstore');
var socratesConstants = beans.get('socratesConstants');
var memberstore = beans.get('memberstore');
var statusmessage = beans.get('statusmessage');

var participantsOverviewUrlPrefix = '/wiki/' + socratesConstants.currentYear + '/participantsOverview#';

function editMember(req, res, next, returnToParticipantsListing) {
  if (!req.user.member) {
    return res.render('edit', {member: new Member().initFromSessionUser(req.user, true)});
  }
  var member = req.user.member;
  var subscriber = req.user.subscriber;
  eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, function (err, readModel) {
    if (err || !readModel) { return next(err); }
    var registeredResources = readModel.roomTypesOf(member.id());
    var options = {
      member: member,
      subscriber: subscriber,
      addon: subscriber && subscriber.addon().homeAddress() ? subscriber.addon() : undefined,
      participation: subscriber && subscriber.isParticipating() ? subscriber.currentParticipation() : null,
      sharesARoom: registeredResources.length === 1 && registeredResources[0].indexOf('bed_in_') > -1,
      returnToParticipantsListing: returnToParticipantsListing
    };
    res.render('edit', options);
  });
}

function deleteAvatar(req, res, next, forwardPrefix) {
  var nicknameOfEditMember = req.body.nickname;
  memberstore.getMember(nicknameOfEditMember, function (err, member) {
    if (err) { return next(err); }
    if (res.locals.accessrights.canEditMember(member)) {
      return membersService.deleteCustomAvatarForNickname(nicknameOfEditMember, function (err2) {
        if (err2) { return next(err2); }
        res.redirect(forwardPrefix + encodeURIComponent(nicknameOfEditMember));
      });
    }
    res.redirect(forwardPrefix + encodeURIComponent(nicknameOfEditMember));
  });
}

var app = misc.expressAppIn(__dirname);

app.get('/checknickname', function (req, res) {
  misc.validate(req.query.nickname, req.query.previousNickname, membersService.isValidNickname, res.end);
});

app.get('/checkemail', function (req, res) {
  misc.validate(req.query.email, req.query.previousEmail, membersService.isValidEmail, res.end);
});

app.get('/edit', function (req, res, next) {
  editMember(req, res, next);
});

app.get('/editForParticipantListing', function (req, res, next) {
  editMember(req, res, next, 'returnToParticipantsListing');
});

app.post('/delete', function (req, res, next) {
  var nicknameOfEditMember = req.body.nickname;
  subscriberstore.getSubscriberByNickname(nicknameOfEditMember, function (err, subscriber) {
    if (err || !subscriber) { return next(err); }
    if (!res.locals.accessrights.canDeleteMember(subscriber)) {
      return res.redirect('/members/' + encodeURIComponent(nicknameOfEditMember));
    }
    socratesMembersService.participationStatus(subscriber, function (err1, isParticipant) {
      if (err1) { return next(err1); }
      if (isParticipant) {
        statusmessage.errorMessage('message.title.problem', 'message.content.members.hasParticipated').putIntoSession(req);
        return res.redirect('/members/' + encodeURIComponent(nicknameOfEditMember));
      }
      subscriberService.removeSubscriber(subscriber, function (err2) {
        if (err2) { return next(err2); }
        statusmessage.successMessage('message.title.save_successful', 'message.content.members.deleted').putIntoSession(req);
        res.redirect(participantsOverviewUrlPrefix);
      });
    });
  });
});

app.post('/submit', function (req, res, next) {
  var returnToParticipantsListing = req.body.returnToParticipantsListing;
  memberSubmitHelper(req, res, next, function (err) {
    if (err) { return next(err); }
    subscriberstore.getSubscriber(req.user.member.id(), function (err1, subscriber) {
      if (err1) { return next(err1); }
      subscriber.fillFromUI(req.body);
      subscriberstore.saveSubscriber(subscriber, function (err2) {
        if (err2) { return next(err2); }
        if (returnToParticipantsListing) {
          return res.redirect(participantsOverviewUrlPrefix + encodeURIComponent(req.user.member.nickname()));
        }
        res.redirect('/');
      });
    });

  });
});

app.post('/submitavatar', function (req, res, next) {
  new Form().parse(req, function (err, fields, files) {
    var nickname = fields.nickname[0];
    if (err || !files || files.length < 1) {
      return res.redirect('/members/' + nickname);
    }
    var params = {
      geometry: fields.w[0] + 'x' + fields.h[0] + '+' + fields.x[0] + '+' + fields.y[0],
      scale: fields.scale[0],
      angle: fields.angle[0]
    };
    membersService.saveCustomAvatarForNickname(nickname, files, params, function (err2) {
      if (err2) { return next(err2); }
      if (fields.returnToParticipantsListing[0]) {
        return res.redirect(participantsOverviewUrlPrefix + encodeURIComponent(nickname));
      }
      res.redirect('/members/' + encodeURIComponent(nickname)); // Es fehlen Prüfungen im Frontend
    });
  });
});

app.post('/deleteAvatarFor', function (req, res, next) {
  deleteAvatar(req, res, next, '/members/');
});

app.post('/deleteAvatarInOverviewFor', function (req, res, next) {
  deleteAvatar(req, res, next, participantsOverviewUrlPrefix);
});

app.get('/:nickname', function (req, res, next) {
  subscriberService.getMemberIfSubscriberExists(req.params.nickname, function (err, member) {
    if (err || !member) { return next(err); }
    eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, function (err2, registrationReadModel) {
      if (err2 || !registrationReadModel) { return next(err2); }
      eventstoreService.getRoomsReadModel(socratesConstants.currentUrl, function (err3, roomsReadModel) {
        if (err3 || !roomsReadModel) { return next(err3); }

        // only when a participant looks at their own profile!
        var registeredInRoomType = registrationReadModel.registeredInRoomType(member.id());
        var isInDoubleBedRoom = registeredInRoomType && registeredInRoomType.indexOf('bed_in_') > -1;
        var roommateId = roomsReadModel.roommateFor(registeredInRoomType, member.id());
        memberstore.getMemberForId(roommateId, function (err4, roommate) {
          var potentialRoommates = [];
          if (err4) { return next(err4); }

          if (registeredInRoomType && !roommate) {
            potentialRoommates = roomsReadModel.participantsWithoutRoomIn(registeredInRoomType);
            var index = potentialRoommates.indexOf(member.id());
            potentialRoommates.splice(index, 1);
          }
          memberstore.getMembersForIds(potentialRoommates, function (err4a, potentialRoommateMembers) {
            if (err4a) { return next(err4a); }
            async.each(potentialRoommateMembers, membersService.putAvatarIntoMemberAndSave, function (err5) {
              if (err5) { return next(err5); }
              res.render('get', {
                member: member,
                roommate: roommate,
                potentialRoommates: potentialRoommateMembers,
                registration: {
                  isInDoubleBedRoom: isInDoubleBedRoom,
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
