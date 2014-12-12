'use strict';

var beans = require('nconf').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');

var app = misc.expressAppIn(__dirname);

app.get('/checknickname', function (req, res) {
  misc.validate(req.query.nickname, req.query.previousNickname, membersService.isValidNickname, res.end);
});

app.get('/checkemail', function (req, res) {
  misc.validate(req.query.email, req.query.previousEmail, membersService.isValidEmail, res.end);
});

app.get('/:nickname', function (req, res, next) {
  memberstore.getMember(req.params.nickname, function (err, member) {
    if (err || !member) { return next(err); }
    res.render('get', {member: member});
  });
});

module.exports = app;
