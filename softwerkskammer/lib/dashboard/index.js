"use strict";
const beans = require("simple-configure").get("beans");
const misc = beans.get("misc");
const dashboardService = require("./dashboardService");

const app = misc.expressAppIn(__dirname);

app.get("/", async (req, res) => {
  const result = await dashboardService.dataForDashboard(req.user.member.nickname());
  res.render("index", result);
});

module.exports = app;
