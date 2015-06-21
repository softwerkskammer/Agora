'use strict';

var Form = require('multiparty').Form;
var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var subscriberService = beans.get('subscriberService');
var activitystore = beans.get('activitystore');
var Member = beans.get('member');
var memberSubmitHelper = beans.get('memberSubmitHelper');
var subscriberstore = beans.get('subscriberstore');
var socratesConstants = beans.get('socratesConstants');
var memberstore = beans.get('memberstore');

var participantsOverviewUrlPrefix = '/wiki/' + socratesConstants.currentYear + '/participantsOverview#';

function editMember(req, res, next, returnToParticipantsListing) {
  if (!req.user.member) {
    return res.render('edit', {member: new Member().initFromSessionUser(req.user, true)});
  }
  var member = req.user.member;
  var subscriber = req.user.subscriber;
  activitystore.getActivity(socratesConstants.currentUrl, function (err, socrates) {
    if (err || !socrates) { return next(err); }
    var registeredResources = socrates.resources().resourceNamesOf(member.id());
    res.render('edit', {
      member: member,
      subscriber: subscriber,
      addon: subscriber && subscriber.addon().homeAddress() ? subscriber.addon() : undefined,
      participation: subscriber && subscriber.isParticipating() ? subscriber.currentParticipation() : null,
      isOnlyOnWaitinglist: registeredResources.length === 0,
      sharesARoom: registeredResources.length === 1 && registeredResources[0].indexOf('bed_in_') > -1,
      returnToParticipantsListing: returnToParticipantsListing
    });
  });
}

function deleteAvatar(req, res, next, forwardPrefix) {
  var nicknameOfEditMember = req.params.nickname;
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

app.post('/submit', function (req, res, next) {
  var returnToParticipantsListing = req.body.returnToParticipantsListing;
  memberSubmitHelper(req, res, next, function (err) {
    if (err) { return next(err); }
    subscriberstore.getSubscriber(req.user.member.id(), function (err1, subscriber) {
      if (err1) { return next(err1); }
      subscriber.fillFromUI(req.body);
      subscriberstore.saveSubscriber(subscriber, function (err2) {
        if (err2) { return next(err2); }
        if (subscriber.needsToPay()) {
          return res.redirect('/payment/socrates');
        }
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

app.get('/deleteAvatarFor/:nickname', function (req, res, next) {
  deleteAvatar(req, res, next, '/members/');
});

app.get('/deleteAvatarInOverviewFor/:nickname', function (req, res, next) {
  deleteAvatar(req, res, next, participantsOverviewUrlPrefix);
});

app.get('/:nickname', function (req, res, next) {
  subscriberService.getMemberIfSubscriberExists(req.params.nickname, function (err, member) {
    if (err || !member) { return next(err); }
    res.render('get', {member: member});
  });
});

module.exports = app;
