"use strict";

// DO NOT FORGET TO KEEP THIS FILE IN SYNC WITH /public/clientscripts/check-memberform.js

function standardMemberChecks(req) {
  req.assert('nickname').notEmpty();
  req.assert('nickname').len(2);
  req.assert('firstname').notEmpty();
  req.assert('lastname').notEmpty();
  req.assert('email').notEmpty();
  req.assert('email').isEmail();
  req.assert('location').notEmpty();
  req.assert('reference').notEmpty();
  req.assert('profession').notEmpty();

  return req.validationErrors();
}
module.exports = {
  isReqBodyValidMember: function (req, res, callback) {
    var errors = standardMemberChecks(req);
    if (errors) {
      return res.render('../../../views/validationError', {errors: errors});
    }
    callback();
  },

  isReqBodyValidNewMember: function (req, res, api, callback) {
    api.isValidNickname(req.body.nickname, function (err, result) {
      var errors = standardMemberChecks(req);
      if (!result) {
        if (!errors) {
          errors = [];
        }
        errors.push({param: 'nickname', msg: 'already taken', value: req.body.nickname});
      }
      if (errors) {
        return res.render('../../../views/validationError', {errors: errors});
      }
      callback();
    });
  }
};
