"use strict";

exports.addProvider = function (app, route) {
  app.get(route, function (req, res) {
    res.send('Hallo Softwerkskammer! :-)');
  });
};
