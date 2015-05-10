'use strict';

var beans = require('simple-configure').get('beans');

var misc = beans.get('misc');
var paymentService = beans.get('paymentService');
var fieldHelpers = beans.get('fieldHelpers');

var app = misc.expressAppIn(__dirname);

app.get('/', function (req, res, next) {
  paymentService.getPaymentInfo(function (err, paymentInfo) {
    if (err || !paymentInfo) { return next(err); }
    res.render('index', {
      paymentInfo: paymentInfo,
      placeholder: fieldHelpers.formatNumberWithCurrentLocale(res, 0)
    });
  });
});

app.get('/calcFee/:amount', function (req, res) {
  var amount = fieldHelpers.parseNumberWithCurrentLocale(res.locals.language, req.params.amount);
  if (!amount) { return res.end(''); }
  res.end(fieldHelpers.formatNumberWithCurrentLocale(res, paymentService.calcFee(amount)) + ' €');
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
