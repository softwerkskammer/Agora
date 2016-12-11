'use strict';

const beans = require('simple-configure').get('beans');

const misc = beans.get('misc');
const paymentService = beans.get('paymentService');
const fieldHelpers = beans.get('fieldHelpers');

const app = misc.expressAppIn(__dirname);

app.get('/', (req, res, next) => {
  paymentService.getPaymentInfo((err, paymentInfo) => {
    if (err || !paymentInfo) { return next(err); }
    res.render('index', {
      paymentInfo: paymentInfo,
      placeholder: fieldHelpers.formatNumberWithCurrentLocale(res, 0)
    });
  });
});

app.get('/calcFee/:amount', (req, res) => {
  const amount = fieldHelpers.parseNumberWithCurrentLocale(res.locals.language, req.params.amount);
  if (!amount) { return res.end(''); }
  const fee = fieldHelpers.formatNumberWithCurrentLocale(res, paymentService.calcFee(amount));
  res.end(fee + ' €');
});

app.get('/calcFee', (req, res) => res.end(''));

app.post('/submitCreditCard', (req, res, next) => {
  const saveCreditCardPayment = callback => { callback(null); };
  paymentService.payWithCreditCard(saveCreditCardPayment, parseFloat(req.body.amount.replace(',', '.')), req.body.description,
    req.body.stripeId, (err, message) => {
      if (err) { return next(err); }
      message.putIntoSession(req);
      res.redirect('/payment/');
    });
});

module.exports = app;
