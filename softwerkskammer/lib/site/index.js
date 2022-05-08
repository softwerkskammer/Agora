/* eslint no-underscore-dangle: 0 */

const path = require("path");
const fs = require("fs");
const qrimage = require("qr-image");

const conf = require("simple-configure");
const beans = conf.get("beans");
const Renderer = beans.get("renderer");
const groupstore = beans.get("groupstore");
const Group = beans.get("group");
const misc = beans.get("misc");

const app = misc.expressAppIn(__dirname);
app.locals.pretty = true;

app.get("/", (req, res, next) => {
  // display all groups
  groupstore.allGroups((err, groups) => {
    if (err) {
      return next(err);
    }
    res.render("index", { regionalgroups: Group.regionalsFrom(groups) });
  });
});

app.get("/robots.txt", (req, res, next) => {
  fs.readFile(path.join(__dirname, "views", "robots.txt"), "utf8", (err, data) => {
    if (err) {
      return next(err);
    }
    res.send(data);
  });
});

app.get("/goodbye.html", (req, res) => {
  if (req.user && req.user.member) {
    return res.redirect("/");
  }
  res.render("goodbye");
});

app.get("/impressum.html", (req, res) => {
  res.render("impressum");
});

app.get("/help.html", (req, res) => {
  res.redirect("/wiki/hilfe");
});

app.get("/credits.html", (req, res) => {
  res.render("credits");
});

app.get("/login", (req, res) => {
  res.render("authenticationRequired");
});

app.get("/loginDialog", (req, res) => {
  res.render("loginDialog", { returnUrl: req.query.returnUrl, loginChoice: req.cookies.loginChoice || {} });
});

app.get("/passwordDialog", (req, res) => {
  res.render("passwordDialog", { returnUrl: req.query.returnUrl, loginChoice: req.cookies.loginChoice || {} });
});

app.get("/mustBeSuperuser", (req, res) => {
  res.render("superuserRightsRequired", { requestedPage: req.query.page });
});

app.get("/cheatsheet.html", (req, res) => {
  res.render("lazyMarkdownCheatsheet");
});

app.get("/test", (req, res) => {
  res.render("../../../views/errorPages/authenticationError", { error: { stack: "" } });
});

app.get("/language/:isoCode", (req, res) => {
  req.session.language = req.params.isoCode;
  res.redirect(req.query.currentUrl);
});

app.post("/preview", (req, res) => {
  res.send(Renderer.render(req.body.data, req.body.subdir));
});

app.get("/qrcode", (req, res) => {
  const url = req.query.url;
  const fullUrl = misc.startsWith(url, "http") ? url : conf.get("publicUrlPrefix") + url;
  const img = qrimage.image(fullUrl, { type: "svg" });
  res.type("svg");
  img.pipe(res);
});

module.exports = app;
