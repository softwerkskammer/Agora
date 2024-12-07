"use strict";
const beans = require("simple-configure").get("beans");
const renderer = require("../commons/renderer");
const wikiService = require("./wikiService");
const statusmessage = require("../commons/statusmessage");
const misc = beans.get("misc");

async function showPage(subdir, pageName, pageVersion, req, res, next) {
  const normalizedPageName = renderer.normalize(pageName);
  const completePageName = `${subdir}/${normalizedPageName}`;
  try {
    const content = await wikiService.showPage(completePageName, pageVersion);
    if (!content) {
      if (req.user) {
        return res.redirect(`/wiki/edit/${completePageName}`);
      }
      return next();
    }
    const headerAndBody = renderer.titleAndRenderedTail(content, subdir);
    res.render("get", {
      content: headerAndBody.body,
      title: headerAndBody.title,
      pageName: normalizedPageName,
      subdir,
      canEdit: pageVersion === "HEAD" && req.user,
    });
  } catch (e) {
    if (req.user) {
      return res.redirect(`/wiki/edit/${completePageName}`);
    }
    return next();
  }
}

const app = misc.expressAppIn(__dirname);

// the calendar for events
app.get("/events/:year", (req, res) => {
  res.render("eventsWithCalendars", { year: req.params.year });
});

app.get("/eventsFor", async (req, res) => {
  const from = new Date(req.query.start);
  const events = await wikiService.parseEvents(from.getFullYear());
  res.end(JSON.stringify(events));
});

// wiki pages

app.get("/versions/:subdir/:page", async (req, res, next) => {
  const pageName = req.params.page;
  const subdir = req.params.subdir;
  const completePageName = `${subdir}/${pageName}`;
  try {
    const items = await wikiService.pageHistory(completePageName);
    res.render("history", { pageName, subdir, items });
  } catch {
    next(); // transform 500 to 404
  }
});

app.get("/compare/:subdir/:page/:revisions", async (req, res, next) => {
  const pageName = req.params.page;
  const subdir = req.params.subdir;
  const completePageName = `${subdir}/${pageName}`;
  const revisions = req.params.revisions;
  try {
    const diff = await wikiService.pageCompare(completePageName, revisions);
    res.render("compare", { pageName, subdir, lines: diff.asLines() });
  } catch {
    next(); // transform 500 to 404
  }
});

// editing pages

app.get("/edit/:subdir/:page", async (req, res) => {
  const pageName = renderer.normalize(req.params.page);
  const subdir = req.params.subdir;
  const completePageName = `${subdir}/${pageName}`;
  const { content, metadata } = await wikiService.pageEdit(completePageName);
  res.render("edit", { page: { content, comment: "", metadata: metadata[0].fullhash }, subdir, pageName });
});

app.post("/:subdir/:page", async (req, res) => {
  const pageName = renderer.normalize(req.params.page);
  const subdir = req.params.subdir;
  try {
    const conflict = await wikiService.pageSave(subdir, pageName, req.body, req.user.member);
    if (conflict) {
      statusmessage.errorMessage("message.title.conflict", "message.content.wiki.conflict").putIntoSession(req);
    } else {
      statusmessage.successMessage("message.title.save_successful", "message.content.wiki.saved").putIntoSession(req);
    }
  } catch (e) {
    statusmessage.errorMessage("message.title.problem", "message.content.save_error").putIntoSession(req);
  }
  res.redirect(`/wiki/${subdir}/${pageName}`);
});

app.post("/rename/:subdir/:page", async (req, res) => {
  const pageNameNew = renderer.normalize(req.body.newName);
  const subdir = req.params.subdir;
  try {
    await wikiService.pageRename(subdir, req.params.page, pageNameNew, req.user.member);
    statusmessage.successMessage("message.title.save_successful", "message.content.wiki.saved").putIntoSession(req);
    res.redirect(`/wiki/${subdir}/${pageNameNew}`);
  } catch (e) {
    statusmessage.errorMessage("message.title.problem", "message.content.save_error").putIntoSession(req);
    throw e;
  }
});

// showing pages

app.get("/list/:subdir/", async (req, res) => {
  const subdir = req.params.subdir;
  const items = await wikiService.pageList(subdir);
  res.render("list", { items, subdir });
});

app.get("/modal/:subdir/:page", async (req, res) => {
  const subdir = req.params.subdir;
  const completePageName = subdir + "/" + req.params.page;
  const content = await wikiService.showPage(completePageName, "HEAD");
  res.render("modal", { content: content && renderer.render(content, subdir), subdir });
});

app.get("/:subdir/:page", async (req, res, next) => {
  const version = req.query.version || "HEAD";
  return showPage(req.params.subdir, req.params.page, version, req, res, next);
});

app.get("/:subdir/", (req, res) => {
  res.redirect("/wiki/" + req.params.subdir + "/index");
});

app.get("/:subdir", (req, res) => {
  res.redirect("/wiki/" + req.params.subdir + "/index");
});

app.get("/", (req, res) => {
  res.redirect("/wiki/alle/index");
});

app.post("/search", async (req, res) => {
  const searchtext = req.body.searchtext;
  if (searchtext.length < 2) {
    statusmessage.errorMessage("message.title.query", "message.content.query").putIntoSession(req);
    return res.redirect(req.headers.referer);
  }
  const matches = await wikiService.search(searchtext);
  res.render("searchresults", { searchtext, matches });
});

module.exports = app;
