const conf = require('simple-configure');
const beans = conf.get('beans');
const R = require('ramda');
const Feed = require('feed').Feed;

const misc = beans.get('misc');
const groupsService = beans.get('groupsService');
const groupstore = beans.get('groupstore');
const wikiService = beans.get('wikiService');
const Group = beans.get('group');
const groupsAndMembers = beans.get('groupsAndMembersService');
const meetupActivitiesService = beans.get('meetupActivitiesService');
const activitystore = beans.get('activitystore');
const statusmessage = beans.get('statusmessage');

const app = misc.expressAppIn(__dirname);

function groupSubmitted(req, res, next) {
  const group = new Group(req.body);
  groupsService.isGroupValid(group, errors => {
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors}); }
    groupstore.getGroup(group.id, (err1, existingGroup) => {
      if (err1) { return next(err1); }
      if (!existingGroup) {
        group.subscribe(req.user.member);
      } else {
        group.subscribedMembers = existingGroup.subscribedMembers;
      }
      groupsAndMembers.saveGroup(group, err2 => {
        if (err2) { return next(err2); }
        statusmessage.successMessage('message.title.save_successful', 'message.content.groups.saved').putIntoSession(req);
        res.redirect('/groups/' + group.id);
      });
    });
  });
}

// display all groups
app.get('/', (req, res, next) => {
  groupsService.getAllAvailableGroups((err, groups) => {
    if (err) { return next(err); }
    res.render('index', {
      regionalgroups: Group.regionalsFrom(groups),
      themegroups: Group.thematicsFrom(groups)
    });
  });
});

app.get('/new', (req, res) => {
  res.render('edit', {
    group: new Group(),
    allTypes: Group.allTypes(),
    organizersChecked: [
      {member: req.user.member, checked: true}
    ]
  });
});

app.post('/submit', (req, res, next) => groupSubmitted(req, res, next));

// the parameterized routes must come after the fixed ones!

app.get('/edit/:groupname', (req, res, next) => {
  groupsAndMembers.getGroupAndMembersForList(req.params.groupname, (err, group) => {
    if (err || !group) { return next(err); }
    if (!res.locals.accessrights.canEditGroup(group)) {
      return res.redirect('/groups/' + encodeURIComponent(req.params.groupname));
    }
    const realGroup = group || new Group();
    const organizersChecked = realGroup.checkedOrganizers(realGroup.members);
    res.render('edit', {group: realGroup, allTypes: Group.allTypes(), organizersChecked});
  });
});

app.post('/clone-from-meetup-for-group', (req, res, next) => {
  groupstore.getGroup(req.body.groupname, (err, group) => {
    if (err || !group) { return next(err); }
    meetupActivitiesService.cloneActivitiesFromMeetupForGroup(group, (err2) => {
      if (err2) { return next(err2); }
      res.redirect('/groups/' + req.body.groupname);
    });
  });

});

app.get('/checkgroupname', (req, res) => {
  misc.validate(req.query.id, null, groupsService.isGroupNameAvailable, res.end);
});

app.get('/checkemailprefix', (req, res) => {
  misc.validate(req.query.emailPrefix, null, groupsService.isEmailPrefixAvailable, res.end);
});

app.post('/subscribe', (req, res) => {
  groupsAndMembers.subscribeMemberToGroup(req.user.member, req.body.groupname, err => {
    if (err) {
      statusmessage.errorMessage('message.title.problem', 'message.content.save_error_reason', {err: err.toString()}).putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.groups.subscribed').putIntoSession(req);
    }
    res.redirect('/groups/' + req.body.groupname);
  });
});

app.post('/unsubscribe', (req, res) => {
  groupsAndMembers.unsubscribeMemberFromGroup(req.user.member, req.body.groupname, err => {
    if (err) {
      statusmessage.errorMessage('message.title.problem', 'message.content.save_error_reason', {err: err.toString()}).putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.groups.unsubscribed').putIntoSession(req);
    }
    res.redirect('/groups/' + req.body.groupname);
  });
});

app.get('/:groupname', (req, res, next) => {
  function addGroupDataToActivity(activities, group) {
    activities.forEach(activity => {
      activity.colorRGB = group.color;
      activity.group = group; // sets the group object in activity
    });
    return activities;
  }

  groupsAndMembers.getGroupAndMembersForList(req.params.groupname, (err, group) => {
    if (err || !group) { return next(err); }
    wikiService.getBlogpostsForGroup(req.params.groupname, (err1, blogposts) => {
      if (err1) { return next(err1); }
      activitystore.upcomingActivitiesForGroupIds([group.id], (err2, activities) => {
        if (err2) { return next(err2); }
        activitystore.pastActivitiesForGroupIds([group.id], (err3, pastActivities) => {
          if (err3) { return next(err3); }
          const registeredUserId = req && req.user ? req.user.member.id() : undefined;
          res.render('get', {
            group,
            users: group.members,
            userIsGroupMember: groupsAndMembers.memberIsInMemberList(registeredUserId, group.members),
            organizers: group.organizers,
            blogposts,
            blogpostsFeedUrl: req.originalUrl + '/feed',
            webcalURL: conf.get('publicUrlPrefix').replace('http', 'webcal') + '/activities/icalForGroup/' + group.id,
            upcomingGroupActivities: addGroupDataToActivity(activities, group) || [],
            recentGroupActivities: addGroupDataToActivity(pastActivities ? R.take(5, pastActivities) : [], group)
          });
        });
      });
    });
  });
});

app.get('/:groupname/feed', (req, res, next) => {

  groupsAndMembers.getGroupAndMembersForList(req.params.groupname, (err, group) => {
    if (err || !group) { return next(err); }
    wikiService.getBlogpostsForGroup(req.params.groupname, (err1, blogposts) => {
      if (err1) { return next(err1); }

      const updated = blogposts.length > 0 ? blogposts[0].date().toJSDate() : undefined;
      const baseUrl = conf.get('publicUrlPrefix');

      const feed = new Feed({
        id: baseUrl + req.originalUrl,
        title: [res.locals.siteTitle, group.longName, req.i18n.t('wiki.blogposts')].join(' - '),
        favicon: baseUrl + '/favicon.ico',
        image: baseUrl + res.locals.siteLogoPath,
        updated: updated,
        generator: 'Agora'
      });

      blogposts.forEach(post => {
        feed.addItem({
          title: post.title,
          id: post.name,
          link: baseUrl + post.url(),
          content: post.renderBody(),
          date: post.date().toJSDate(),
        });
      });

      res.type('application/atom+xml');
      res.send(feed.atom1());
    });
  });
});

module.exports = app;
