'use strict';

var conf = require('nconf');
var beans = conf.get('beans');
var misc = beans.get('misc');

var paymentService = beans.get('paymentService');
var statusmessage = beans.get('statusmessage');


var app = misc.expressAppIn(__dirname);

app.get('/', function (req, res, next) {
  paymentService.getPaymentInfo('0', function (err, paymentInfo) {
    if (err || !paymentInfo) { return next(err); }
    res.render('index', { paymentInfo: paymentInfo });
  });
});

app.post('/setAmount', function (req, res, next) {
  res.redirect('/payments/pay/' + req.body.amount);
});

app.get('/pay/:amount', function (req, res, next) {
  paymentService.getPaymentInfo(req.params.amount, function (err, paymentInfo) {
    if (err || !paymentInfo) { return next(err); }
    res.render('payment', {
      paymentKey: conf.get('publicPaymentKey'),
      paymentInfo: paymentInfo
    });
  });
});

app.post('/submitTransfer', function (req, res, next) {
  var url = req.body.url;
  paymentService.payWithTransfer(url, req.user.member.id(), function (err) {
    if (err) { return next(err); }
    statusmessage.successMessage('message.title.save_successful', 'message.content.addon.saved').putIntoSession(req);
    res.redirect('/payments/');
  });
});

app.post('/submitCreditCard', function (req, res, next) {
  var saveCreditCardPayment = function (callback) { callback(null); };
  paymentService.payWithCreditCard(saveCreditCardPayment, req.body.amount, req.body.description, req.user.member.id(),
    req.body.stripeId, function (err, message) {
      if (err) { return next(err); }
      message.putIntoSession(req);
      res.redirect('/payments/');
    });
});

module.exports = app;
