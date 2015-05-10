/*global member_validator, nicknameIsNotAvailable, emailAlreadyTaken, testglobals */
(function () {
  'use strict';

  describe('Member Form', function () {
    var nickname = $('#memberform [name=nickname]');
    var email = $('#memberform [name=email]');

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
      checkThatPreviousValueIsSent(nickname, $('#memberform [name=previousNickname]'));
    });

    it('checks that a email check response is handled for "true"', function () {
      checkFieldWithPositiveAjaxResponse(email, 'a@b.c', /members\/checkemail\?email=a%40b\.c/);
    });

    it('checks that a email check response is handled for "false"', function () {
      checkFieldWithNegativeAjaxResponse(email, emailAlreadyTaken, 'a@b.c', /members\/checkemail\?email=a%40b\.c/);
    });

    it('checks that a email check also sends the previousEmail', function () {
      checkThatPreviousValueIsSent(email, $('#memberform [name=previousEmail]'), 'a@b.c');
    });

    it('checks that "firstname" is mandatory', function () {
      checkFieldMandatory('#memberform [name=firstname]');
    });

    it('checks that "lastname" is mandatory', function () {
      checkFieldMandatory('#memberform [name=lastname]');
    });

    it('checks that "location" is mandatory', function () {
      checkFieldMandatory('#memberform [name=location]');
    });

    it('checks that "reference" is mandatory', function () {
      checkFieldMandatory('#memberform [name=reference]');
    });

    it('checks that "profession" is mandatory', function () {
      checkFieldMandatory('#memberform [name=profession]');
    });

    it('checks that "email" is mandatory', function () {
      checkFieldMandatory('#memberform [name=email]', 'l@b.de');
    });

    it('checks that "nickname" is mandatory', function () {
      checkFieldMandatory('#memberform [name=nickname]', 'onetwo');
    });

    it('checks that "nickname" has at least two characters', function () {
      nickname.val('a');
      expect(member_validator.element(nickname)).to.be(false);
      expect(member_validator.errorList[0]).to.have.ownProperty('message', 'Geben Sie bitte mindestens 2 Zeichen ein.');
    });
  });
}());
