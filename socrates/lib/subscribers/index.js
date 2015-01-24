'use strict';
var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var subscriberstore = beans.get('subscriberstore');

var app = misc.expressAppIn(__dirname);

app.get('/count', function (req, res) {
  subscriberstore.allSubscribers(function (err, subscribers) {
    if (err || !subscribers) { return res.end(''); }
    res.end(subscribers.length.toString());
  });
});

module.exports = app;
