'use strict';

const moment = require('moment-timezone');
const beans = require('simple-configure').get('beans');
const renderer = beans.get('renderer');
const wikiService = beans.get('wikiService');
const statusmessage = beans.get('statusmessage');
const misc = beans.get('misc');

function showPage(subdir, pageName, pageVersion, req, res, next) {
  const normalizedPageName = renderer.normalize(pageName);
  const completePageName = subdir + '/' + normalizedPageName;
  wikiService.showPage(completePageName, pageVersion, (err, content) => {
    if (err || !content) {
      if (req.user) { return res.redirect('/wiki/edit/' + completePageName); }
      return next();
    }
    const headerAndBody = renderer.titleAndRenderedTail(content, subdir);
    res.render('get', {
      content: headerAndBody.body,
      title: headerAndBody.title,
      pageName: normalizedPageName,
      subdir: subdir,
      canEdit: pageVersion === 'HEAD' && req.user
    });
  });
}

const app = misc.expressAppIn(__dirname);

// the calendar for events
app.get('/events/:year', (req, res) => {
  res.render('eventsWithCalendars', {year: req.params.year});
});

app.get('/eventsFor', (req, res, next) => {
  const from = moment(req.query.start);
  if (from.date() > 1) { from.add(1, 'M'); }

  wikiService.parseEvents(from.year(), (err, events) => {
    if (err) { return next(err); }
    res.end(JSON.stringify(events));
  });
});

// wiki pages

app.get('/versions/:subdir/:page', (req, res, next) => {
  const pageName = req.params.page;
  const subdir = req.params.subdir;
  const completePageName = subdir + '/' + pageName;
  wikiService.pageHistory(completePageName, (err, metadata) => {
    if (err || !metadata) { return next(); }
    res.render('history', {
      pageName: pageName,
      subdir: subdir,
      items: metadata
    });
  });
});

app.get('/compare/:subdir/:page/:revisions', (req, res, next) => {
  const pageName = req.params.page;
  const subdir = req.params.subdir;
  const completePageName = subdir + '/' + pageName;
  const revisions = req.params.revisions;
  wikiService.pageCompare(completePageName, revisions, (err, diff) => {
    if (err || !diff) { return next(); }
    res.render('compare', {
      pageName: pageName,
      subdir: subdir,
      lines: diff.asLines()
    });
  });
});

// editing pages

app.get('/edit/:subdir/:page', (req, res, next) => {
  const pageName = renderer.normalize(req.params.page);
  const subdir = req.params.subdir;
  const completePageName = subdir + '/' + pageName;
  wikiService.pageEdit(completePageName, (err, content, metadata) => {
    if (err) { return next(err); }
    res.render('edit', {
      page: {content: content, comment: '', metadata: metadata[0].fullhash},
      subdir: subdir,
      pageName: pageName
    });
  });
});

app.post('/:subdir/:page', (req, res) => {
  const pageName = renderer.normalize(req.params.page);
  const subdir = req.params.subdir;
  wikiService.pageSave(subdir, pageName, req.body, req.user.member, (err, conflict) => {
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

app.post('/rename/:subdir/:page', (req, res, next) => {
  const pageNameNew = renderer.normalize(req.body.newName);
  const subdir = req.params.subdir;
  wikiService.pageRename(subdir, req.params.page, pageNameNew, req.user.member, err => {
    if (err) {
      statusmessage.errorMessage('message.title.problem', 'message.content.save_error').putIntoSession(req);
      return next(err);
    }
    statusmessage.successMessage('message.title.save_successful', 'message.content.wiki.saved').putIntoSession(req);
    res.redirect('/wiki/' + subdir + '/' + pageNameNew);
  });
});

// showing pages

app.get('/list/:subdir/', (req, res, next) => {
  const subdir = req.params.subdir;
  wikiService.pageList(subdir, (err, items) => {
    if (err) { return next(err); }
    res.render('list', {items: items, subdir: subdir});
  });
});

app.get('/modal/:subdir/:page', (req, res, next) => {
  const subdir = req.params.subdir;
  const completePageName = subdir + '/' + req.params.page;
  wikiService.showPage(completePageName, 'HEAD', (err, content) => {
    if (err) { return next(err); }
    res.render('modal', {content: content && renderer.render(content, subdir), subdir: subdir});
  });
});

app.get('/:subdir/:page', (req, res, next) => {
  const version = req.query.version || 'HEAD';
  showPage(req.params.subdir, req.params.page, version, req, res, next);
});

app.get('/:subdir/', (req, res) => {
  res.redirect('/wiki/' + req.params.subdir + '/index');
});

app.get('/:subdir', (req, res) => {
  res.redirect('/wiki/' + req.params.subdir + '/index');
});

app.get('/', (req, res) => {
  res.redirect('/wiki/alle/index');
});

app.post('/search', (req, res, next) => {
  const searchtext = req.body.searchtext;
  if (searchtext.length < 2) {
    statusmessage.errorMessage('message.title.query', 'message.content.query').putIntoSession(req);
    return res.redirect(req.headers.referer);
  }
  wikiService.search(searchtext, (err, results) => {
    if (err) {return next(err); }
    res.render('searchresults', {searchtext: searchtext, matches: results});
  });
});

module.exports = app;
