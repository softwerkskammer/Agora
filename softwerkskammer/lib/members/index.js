const async = require('async');
const R = require('ramda');
const Form = require('multiparty').Form;

const beans = require('simple-configure').get('beans');
const validation = beans.get('validation');
const Member = beans.get('member');
const Group = beans.get('group');
const membersService = beans.get('membersService');
const groupstore = beans.get('groupstore');
const memberstore = beans.get('memberstore');
const groupsAndMembersService = beans.get('groupsAndMembersService');
const groupsService = beans.get('groupsService');
const activitiesService = beans.get('activitiesService');
const wikiService = beans.get('wikiService');
const misc = beans.get('misc');
const statusmessage = beans.get('statusmessage');
const notifications = beans.get('notifications');
const authenticationService = beans.get('authenticationService');

function memberSubmitted(req, res, next) {
  function notifyNewMemberRegistration(member, subscriptions) {
    // must be done here, not in Service to avoid circular deps
    notifications.newMemberRegistered(member, subscriptions);
  }

  groupsAndMembersService.updateAndSaveSubmittedMember(req.user, req.body, res.locals.accessrights, notifyNewMemberRegistration, (err, nickname) => {
    if (err) { return next(err); }

    if (nickname) {
      statusmessage.successMessage('message.title.save_successful', 'message.content.members.saved').putIntoSession(req);
      return res.redirect('/members/' + encodeURIComponent(nickname));
    }

    return res.redirect('/members');
  });
}

function tagsFor(callback) {
  memberstore.allMembers((err, members) => {
    callback(err, membersService.toWordList(members).map(wordlist => wordlist.text).sort());
  });
}

const app = misc.expressAppIn(__dirname);

app.get('/', (req, res, next) => {
  memberstore.allMembers((err, members) => {
    if (err) { return next(err); }
    async.each(members, membersService.putAvatarIntoMemberAndSave, err1 => {
      if (err1) { return next(err1); }
      res.render('index', {members, wordList: membersService.toWordList(members)});
    });
  });
});

app.get('/interests', (req, res, next) => {
  const casesensitive = req.query.casesensitive ? '' : 'i';
  memberstore.getMembersWithInterest(req.query.interest, casesensitive, (err, members) => {
    if (err) { return next(err); }
    async.each(members, membersService.putAvatarIntoMemberAndSave, err1 => {
      if (err1) { return next(err1); }
      res.render('indexForTag', {
        interest: req.query.interest,
        members,
        wordList: membersService.toWordList(members)
      });
    });
  });
});

app.get('/checknickname', (req, res) => {
  misc.validate(req.query.nickname, req.query.previousNickname, membersService.isValidNickname, res.end);
});

app.get('/checkemail', (req, res) => {
  misc.validate(req.query.email, req.query.previousEmail, membersService.isValidEmail, res.end);
});

app.get('/new', (req, res, next) => {
  if (req.user.member) {
    return res.redirect('/members/');
  }
  async.parallel(
    {
      allGroups: callback => groupstore.allGroups(callback),
      allTags: callback => tagsFor(callback)
    },
    (err, results) => {
      if (err) { return next(err); }
      const allGroups = results.allGroups;
      res.render('edit', {
        member: new Member().initFromSessionUser(req.user),
        regionalgroups: groupsService.markGroupsSelected([], Group.regionalsFrom(allGroups)),
        themegroups: groupsService.markGroupsSelected([], Group.thematicsFrom(allGroups)),
        tags: results.allTags
      });
    }
  );
});

app.get('/edit/:nickname', (req, res, next) => {
  async.parallel(
    {
      member: callback => groupsAndMembersService.getMemberWithHisGroups(req.params.nickname, callback),
      allGroups: callback => groupstore.allGroups(callback),
      allTags: callback => tagsFor(callback)
    },
    (err, results) => {
      if (err) { return next(err); }
      const member = results.member;
      if (err || !member) { return next(err); }
      if (!res.locals.accessrights.canEditMember(member)) {
        return res.redirect('/members/' + encodeURIComponent(member.nickname()));
      }
      const allGroups = results.allGroups;
      res.render('edit', {
        member,
        regionalgroups: groupsService.markGroupsSelected(member.subscribedGroups, Group.regionalsFrom(allGroups)),
        themegroups: groupsService.markGroupsSelected(member.subscribedGroups, Group.thematicsFrom(allGroups)),
        tags: results.allTags
      });
    }
  );
});

app.post('/delete', (req, res, next) => {
  const nickname = req.body.nickname;
  if (!res.locals.accessrights.canDeleteMemberByNickname(nickname)) {
    return res.redirect('/members/' + encodeURIComponent(nickname));
  }
  groupsAndMembersService.removeMember(nickname, err => {
    if (err) {
      if (err.message !== 'hasSubscriptions') {
        return next(err);
      }
      statusmessage.errorMessage('message.title.problem', 'message.content.members.hasSubscriptions').putIntoSession(req);
      return res.redirect('/members/edit/' + encodeURIComponent(nickname));
    }
    statusmessage.successMessage('message.title.save_successful', 'message.content.members.deleted').putIntoSession(req);
    res.redirect('/members/');
  });
});

app.post('/updatePassword', (req, res, next) => {
  memberstore.getMemberForId(req.body.id, (err, member) => {
    if (err) { return next(err); }
    member.updatePassword(req.body.password);
    member.addAuthentication(authenticationService.pwdAuthenticationPrefix + member.email());
    memberstore.saveMember(member, err1 => {
      if (err1) { return next(err1); }
      res.redirect('/members/' + encodeURIComponent(member.nickname()));
    });
  });
});

app.post('/submit', (req, res, next) => {
  async.parallel(
    [
      callback => {
        validation.checkValidity(req.body.previousNickname, req.body.nickname, membersService.isValidNickname, req.i18n.t('validation.nickname_not_available'), callback);
      },
      callback => {
        validation.checkValidity(req.body.previousEmail, req.body.email, membersService.isValidEmail, req.i18n.t('validation.duplicate_email'), callback);
      },
      callback => {
        const errors = validation.isValidForMember(req.body);
        callback(null, errors);
      }
    ],
    (err, errorMessages) => {
      if (err) { return next(err); }
      const realErrors = R.flatten(errorMessages).filter(message => !!message);
      if (realErrors.length === 0) {
        return memberSubmitted(req, res, next);
      }
      return res.render('../../../views/errorPages/validationError', {errors: realErrors});
    }
  );
});

app.post('/submitavatar', (req, res, next) => {
  new Form().parse(req, (err, fields, files) => {
    const nickname = fields.nickname[0];
    if (err || !files || files.length < 1) {
      return res.redirect('/members/' + nickname);
    }
    const params = {
      scale: parseFloat(fields.scale[0]),
      angle: parseFloat(fields.angle[0]),
      geometry: {width: parseInt(fields.w[0]), height: parseInt(fields.h[0]), left: parseInt(fields.x[0]), top: parseInt(fields.y[0])}
    };
    membersService.saveCustomAvatarForNickname(nickname, files, params, err1 => {
      if (err1) { return next(err1); }
      res.redirect('/members/' + encodeURIComponent(nickname)); // Es fehlen Prüfungen im Frontend
    });
  });
});

app.post('/deleteAvatarFor', (req, res, next) => {
  const nicknameOfEditMember = req.body.nickname;
  memberstore.getMember(nicknameOfEditMember, (err, member) => {
    if (err) { return next(err); }
    if (res.locals.accessrights.canEditMember(member)) {
      return membersService.deleteCustomAvatarForNickname(nicknameOfEditMember, err1 => {
        if (err1) { return next(err1); }
        res.redirect('/members/' + encodeURIComponent(nicknameOfEditMember));
      });
    }
    res.redirect('/members/' + encodeURIComponent(nicknameOfEditMember));
  });

});

app.get('/:nickname', (req, res, next) => {
  groupsAndMembersService.getMemberWithHisGroups(req.params.nickname, (err, member, subscribedGroups) => {
    if (err || !member) { return next(err); }
    activitiesService.getPastActivitiesOfMember(member, (err1, pastActivities) => {
      if (err1) { return next(err1); }
      activitiesService.getOrganizedOrEditedActivitiesOfMember(member, (err2, organizedOrEditedActivities) => {
        if (err2) { return next(err2); }
        wikiService.listFilesModifiedByMember(member.nickname(), (err3, modifiedWikiFiles) => {
          if (err3) { return next(err3); }
          res.render('get', {
            member,
            pastActivities,
            organizedOrEditedActivities,
            subscribedGroups,
            modifiedWikiFiles
          });
        });
      });
    });
  });
});

module.exports = app;
