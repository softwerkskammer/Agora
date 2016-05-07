/*global member_validator, nicknameIsNotAvailable, emailAlreadyTaken, testglobals */
(function () {
  'use strict';

  describe('Member Form', function () {
    var nickname = $('[name=nickname]');
    var email = $('[name=email]');

    afterEach(function () {
      member_validator.resetForm();
    });

    var checkFieldMandatory = function (selector, value) {
      testglobals.mandatoryChecker(member_validator, selector, value);
    };

    var checkFieldWithPositiveAjaxResponse = function (field, value, urlRegexp) {
      testglobals.checkFieldWithPositiveAjaxResponse(member_validator, field, value, urlRegexp);
    };

    var checkFieldWithNegativeAjaxResponse = function (field, message, value, urlRegexp) {
      testglobals.checkFieldWithNegativeAjaxResponse(member_validator, field, message, value, urlRegexp);
    };

    var checkThatPreviousValueIsSent = function (field, previousField, value) {
      testglobals.checkThatPreviousValueIsSent(field, previousField, value);
    };

    it('checks that a nickname check response is handled for "true"', function () {
      checkFieldWithPositiveAjaxResponse(nickname, undefined, /members\/checknickname\?nickname=value/);
    });

    it('checks that a nickname check response is handled for "false"', function () {
      checkFieldWithNegativeAjaxResponse(nickname, nicknameIsNotAvailable, undefined, /members\/checknickname\?nickname=value/);
    });

    it('checks that a nickname check also sends the previousNickname', function () {
      checkThatPreviousValueIsSent(nickname, $('[name=previousNickname]'));
    });

    it('checks that a email check response is handled for "true"', function () {
      checkFieldWithPositiveAjaxResponse(email, 'a@b.c', /members\/checkemail\?email=a%40b\.c/);
    });

    it('checks that a email check response is handled for "false"', function () {
      checkFieldWithNegativeAjaxResponse(email, emailAlreadyTaken, 'a@b.c', /members\/checkemail\?email=a%40b\.c/);
    });

    it('checks that a email check also sends the previousEmail', function () {
      checkThatPreviousValueIsSent(email, $('[name=previousEmail]'), 'a@b.c');
    });

    it('checks that "firstname" is mandatory', function () {
      checkFieldMandatory('[name=firstname]');
    });

    it('checks that "lastname" is mandatory', function () {
      checkFieldMandatory('[name=lastname]');
    });

    xit('checks that "country" is mandatory', function () {
      checkFieldMandatory('[name=country]', 'DE'); // does not work with the select2 element?!
    });

    it('checks that "email" is mandatory', function () {
      checkFieldMandatory('[name=email]', 'l@b.de');
    });

    it('checks that "nickname" is mandatory', function () {
      checkFieldMandatory('[name=nickname]', 'onetwo');
    });

    it('checks that "nickname" has at least two characters', function () {
      nickname.val('a');
      expect(member_validator.element(nickname)).to.be(false);
      expect(member_validator.errorList[0]).to.have.ownProperty('message', 'Please enter at least 2 characters.');
    });

    it('checks that "tShirtSize" is mandatory', function () {
      var field = $('#tShirtSizeMale');
      field.val('');
      expect(member_validator.element(field)).to.be(false);
      expect(member_validator.errorList[0].message).to.be('Please select a t-shirt size.');
      field.val('L');
      expect(member_validator.element(field)).to.be(true);
    });

    it('checks that "homeAddress" is mandatory', function () {
      checkFieldMandatory('[name=homeAddress]', 'onetwo\nhhsd');
    });
  });
}());
