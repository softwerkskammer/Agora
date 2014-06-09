'use strict';

var conf = require('nconf');
var beans = conf.get('beans');

var misc = beans.get('misc');
var paymentService = beans.get('paymentService');
var statusmessage = beans.get('statusmessage');
var fieldHelpers = beans.get('fieldHelpers');

var app = misc.expressAppIn(__dirname);

app.get('/', function (req, res, next) {
  paymentService.getPaymentInfo(function (err, paymentInfo) {
    if (err || !paymentInfo) { return next(err); }
    res.render('index', {
      paymentInfo: paymentInfo,
      paymentKey: conf.get('publicPaymentKey'),
      placeholder: fieldHelpers.formatNumberWithCurrentLocale(res, 0)
    });
  });
});

app.get('/calcFee/:amount', function (req, res) {
  var amount = parseFloat(req.params.amount.replace(',', '.'));
  if (amount === 0) { // TODO or NaN
    return res.end('');
  }
  var fee = paymentService.calcFee(amount);
  res.end(fieldHelpers.formatNumberWithCurrentLocale(res, fee) + ' €');
});

app.get('/calcFee', function (req, res) {
  return res.end('');
});

app.post('/submitCreditCard', function (req, res, next) {
  var saveCreditCardPayment = function (callback) { callback(null); };
  paymentService.payWithCreditCard(saveCreditCardPayment, parseFloat(req.body.amount.replace(',', '.')), req.body.description, req.user.member.id(),
    req.body.stripeId, function (err, message) {
      if (err) { return next(err); }
      message.putIntoSession(req);
      res.redirect('/payment/');
    });
});

module.exports = app;
