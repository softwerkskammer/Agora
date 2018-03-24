'use strict';

const conf = require('simple-configure');
const beans = conf.get('beans');
const async = require('async');
const R = require('ramda');
const Feed = require('feed');

const misc = beans.get('misc');
const groupsService = beans.get('groupsService');
const wikiService = beans.get('wikiService');
const Group = beans.get('group');
const groupsAndMembers = beans.get('groupsAndMembersService');
const activitystore = beans.get('activitystore');
const statusmessage = beans.get('statusmessage');

const app = misc.expressAppIn(__dirname);

function groupSubmitted(req, res, next) {
  const group = new Group(req.body);
  groupsService.isGroupValid(group, errors => {
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors}); }
    groupsAndMembers.saveGroup(group, err => {
      if (err) { return next(err); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.groups.saved').putIntoSession(req);
      res.redirect('/groups/' + group.id);
    });
  });
}

// display all groups
app.get('/', (req, res, next) => {
  groupsService.getAllAvailableGroups((err, groups) => {
    if (err) { return next(err); }
    async.map(groups, (group, callback) => groupsAndMembers.addMembercountToGroup(group, callback),
      (err1, groupsWithMembers) => {
        if (err1) { return next(err1); }
        res.render('index', {
          regionalgroups: Group.regionalsFrom(groupsWithMembers),
          themegroups: Group.thematicsFrom(groupsWithMembers)
        });
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
            upcomingGroupActivities: activities || [],
            recentGroupActivities: pastActivities ? R.take(5, pastActivities) : []
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

      const updated = blogposts.length > 0 ? blogposts[0].date().toDate() : undefined;
      const baseUrl = req.protocol + '://' + req.get('host');

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
          date: post.date().toDate(),
        });
      });

      res.type('application/atom+xml');
      res.send(feed.atom1());
    });
  });
});

module.exports = app;
