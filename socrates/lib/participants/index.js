'use strict';
var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var participantstore = beans.get('participantstore');

var app = misc.expressAppIn(__dirname);

app.get('/count', function (req, res) {
  participantstore.allParticipants(function (err, participants) {
    if (err || !participants) { return res.end(''); }
    res.end(participants.length.toString());
  });
});

module.exports = app;
