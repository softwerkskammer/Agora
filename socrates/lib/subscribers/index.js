'use strict';
const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const subscriberstore = beans.get('subscriberstore');

const app = misc.expressAppIn(__dirname);

app.get('/count', (req, res) => {
  subscriberstore.allSubscribers((err, subscribers) => {
    if (err || !subscribers) { return res.end(''); }
    res.end(subscribers.length.toString());
  });
});

module.exports = app;
