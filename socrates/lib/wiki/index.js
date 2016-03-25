'use strict';

var beans = require('simple-configure').get('beans');
var Renderer = beans.get('renderer');
var wikiService = beans.get('wikiService');
var statusmessage = beans.get('statusmessage');
var misc = beans.get('misc');
var activityParticipantService = beans.get('activityParticipantService');
var currentYear = beans.get('socratesConstants').currentYear;

function showPage(subdir, pageName, pageVersion, req, res, next) {
  var normalizedPageName = Renderer.normalize(pageName);
  var completePageName = subdir + '/' + normalizedPageName;
  wikiService.showPage(completePageName, pageVersion, function (err, content) {
    if (err || !content) {
      if (req.user) { return res.redirect('/wiki/edit/' + completePageName); }
      return next();
    }
    var headerAndBody = Renderer.titleAndRenderedTail(content, subdir);
    res.render('get', {
      content: headerAndBody.body,
      title: headerAndBody.title,
      pageName: normalizedPageName,
      subdir: subdir,
      canEdit: pageVersion === 'HEAD' && req.user
    });
  });
}

var app = misc.expressAppIn(__dirname);

app.get('/versions/:subdir/:page', function (req, res, next) {
  var pageName = req.params.page;
  var subdir = req.params.subdir;
  var completePageName = subdir + '/' + pageName;
  wikiService.pageHistory(completePageName, function (err, metadata) {
    if (err || !metadata) { return next(); }
    res.render('history', {
      pageName: pageName,
      subdir: subdir,
      items: metadata
    });
  });
});

app.get('/compare/:subdir/:page/:revisions', function (req, res, next) {
  var pageName = req.params.page;
  var subdir = req.params.subdir;
  var completePageName = subdir + '/' + pageName;
  var revisions = req.params.revisions;
  wikiService.pageCompare(completePageName, revisions, function (err, diff) {
    if (err || !diff) { return next(); }
    res.render('compare', {
      pageName: pageName,
      subdir: subdir,
      lines: diff.asLines()
    });
  });
});

// editing pages

app.get('/edit/:subdir/:page', function (req, res, next) {
  var pageName = Renderer.normalize(req.params.page);
  var subdir = req.params.subdir;
  var completePageName = subdir + '/' + pageName;
  wikiService.pageEdit(completePageName, function (err, content, metadata) {
    if (err) { return next(err); }
    res.render('edit', {
      page: {content: content, comment: '', metadata: metadata[0].fullhash},
      subdir: subdir,
      pageName: pageName
    });
  });
});

app.post('/:subdir/:page', function (req, res) {
  var pageName = Renderer.normalize(req.params.page);
  var subdir = req.params.subdir;
  wikiService.pageSave(subdir, pageName, req.body, req.user.member, function (err, conflict) {
    if (err) {
      statusmessage.errorMessage('message.title.problem', 'message.content.save_error').putIntoSession(req);
    } else if (conflict) {
      statusmessage.errorMessage('message.title.conflict', 'message.content.wiki.conflict').putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.wiki.saved').putIntoSession(req);
    }
    res.redirect('/wiki/' + subdir + '/' + pageName);
  });
});

app.post('/rename/:subdir/:page', function (req, res, next) {
  var pageNameNew = Renderer.normalize(req.body.newName);
  var subdir = req.params.subdir;
  wikiService.pageRename(subdir, req.params.page, pageNameNew, req.user.member, function (err) {
    if (err) {
      statusmessage.errorMessage('message.title.problem', 'message.content.save_error').putIntoSession(req);
      return next(err);
    }
    statusmessage.successMessage('message.title.save_successful', 'message.content.wiki.saved').putIntoSession(req);
    res.redirect('/wiki/' + subdir + '/' + pageNameNew);
  });
});

// showing pages

app.get('/:year/participantsOverview/', function (req, res, next) {
  var year = req.params.year;
  activityParticipantService.getParticipantsFor(year, function (err, participants) {
    if (err || !participants) { return next(err); }
    res.render('participants', {
      title: 'Participants',
      participants: participants,
      showQuestions: year < 2016
    });
  });
});

app.get('/list/:subdir/', function (req, res, next) {
  var subdir = req.params.subdir;
  wikiService.pageList(subdir, function (err, items) {
    if (err) { return next(err); }
    res.render('list', {items: items, subdir: subdir});
  });
});

app.get('/:subdir/:page', function (req, res, next) {
  var version = req.query.version || 'HEAD';
  showPage(req.params.subdir, req.params.page, version, req, res, next);
});

app.get('/:subdir/', function (req, res) {
  res.redirect('/wiki/' + req.params.subdir + '/index');
});

app.get('/:subdir', function (req, res) {
  res.redirect('/wiki/' + req.params.subdir + '/index');
});

app.get('/', function (req, res) {
  res.redirect('/wiki/' + currentYear + '/index');
});

app.post('/search', function (req, res, next) {
  var searchtext = req.body.searchtext;
  if (searchtext.length < 2) {
    statusmessage.errorMessage('message.title.query', 'message.content.query').putIntoSession(req);
    return res.redirect(req.headers.referer);
  }
  wikiService.search(searchtext, function (err, results) {
    if (err) {return next(err); }
    res.render('searchresults', {searchtext: searchtext, matches: results});
  });
});

module.exports = app;
