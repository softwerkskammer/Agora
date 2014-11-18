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
    room: 'double',
    nights: 2
  };
  var roomOptions = [
    {id: 'single', name: 'Single', two: 214, three: 329, four: 412},
    {id: 'double', name: 'Double shared …', shareable: true, two: 174, three: 269, four: 332},
    {id: 'junior', name: 'Junior shared …', shareable: true, two: 168, three: 260, four: 320},
    {id: 'juniorAlone', name: 'Junior (exclusive)', two: 236, three: 362, four: 456}
  ];
  res.render('participate', {participation: participation, roomOptions: roomOptions});
});

app.post('/participate', function (req, res) {
  console.log(req.body);
  res.redirect('participate');
});

module.exports = app;
