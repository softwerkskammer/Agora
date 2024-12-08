"use strict";
const misc = require("../commons/misc");
const dashboardService = require("./dashboardService");

const app = misc.expressAppIn(__dirname);

app.get("/", async (req, res) => {
  const result = await dashboardService.dataForDashboard(req.user.member.nickname());
  res.render("index", result);
});

module.exports = app;
