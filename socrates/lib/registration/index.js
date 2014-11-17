'use strict';
var moment = require('moment-timezone');

var beans = require('nconf').get('beans');
var misc = beans.get('misc');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');

var app = misc.expressAppIn(__dirname);

app.get('/participate', function (req, res) {
  var participation = {
    user: {
      nickname: 'Nick',
      firstname: 'First',
      lastname: 'Last',
      email: 'First.Last@somedomain.de',
      twitter: 'firstlast',
      address: 'Morgenstr. 41\n76131 Karlsruhe\nDeutschland',
      billingaddress: 'Same',
      tshirtsize: 'L'
    },
    room: 'double'
  };
  var roomOptions = [
    {id: 'single', name: 'Single'},
    {id: 'juniorAlone', name: 'Junior Exclusive'},
    {id: 'junior', name: 'Junior shared with', shareable: true},
    {id: 'double', name: 'Double shared with', shareable: true}
  ];
  res.render('participate', {participation: participation, roomOptions: roomOptions});
});

module.exports = app;
