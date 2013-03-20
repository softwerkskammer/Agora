"use strict";

var gruppenApp = require('express')();
gruppenApp.set('views', __dirname + '/views');
gruppenApp.set('view engine', 'jade');

var sympaClient = require('../gruppenverwaltung/swkSympaClient');

gruppenApp.get('/', function (req, res) {
  console.dir(req.app.route);
  sympaClient.getGruppen(function (err, gruppen) {
    res.render('gruppen', {title: 'Gruppen', gruppen: gruppen});
  });
});

module.exports = gruppenApp;
