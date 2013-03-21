"use strict";

var gruppenApp = require('express')();
var path = require('path');

gruppenApp.set('views', path.join(__dirname, 'views'));
gruppenApp.set('view engine', 'jade');

var sympaClient = require('../gruppenverwaltung/swkSympaClient');

gruppenApp.get('/', function (req, res) {
  sympaClient.getGruppen(function (err, gruppen) {
    res.render('gruppen', {title: 'Gruppen', gruppen: gruppen});
  });
});

module.exports = gruppenApp;
