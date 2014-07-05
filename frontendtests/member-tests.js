/*global member_validator, nicknameIsNotAvailable, emailAlreadyTaken */
(function () {
  'use strict';

  describe('Member Form', function () {
    var nickname = $('#memberform [name=nickname]');
    var email = $('#memberform [name=email]');

    var sandbox = sinon.sandbox;

    afterEach(function () {
      member_validator.resetForm();
      sandbox.restore();
    });

    var checkFieldMandatory = function (fieldname, value) {
      testglobals.mandatoryChecker(member_validator, fieldname, value);
    };

    it('checks that a nickname check response is handled for "true"', function () {
      sandbox.stub($, 'ajax').yieldsTo('success', true);
      nickname.val('nick');
      // trigger validation
      nickname.trigger('change');

      expect(member_validator.element(nickname)).to.be(true);
      expect(member_validator.errorList).to.be.empty();
    });

    it('checks that a nickname check response is handled for "false"', function () {
      sandbox.stub($, 'ajax').yieldsTo('success', false);
      nickname.val('nick');
      // trigger validation
      nickname.trigger('change');

      expect(member_validator.element(nickname)).to.be(false);
      expect(member_validator.errorList[0]).to.have.ownProperty('message', nicknameIsNotAvailable);
    });

    it('checks that a nickname check also sends the previousNickname', function () {
      var spy = sandbox.spy($, 'ajax');
      var previousNickname = $('#memberform [name=previousNickname]');
      previousNickname.val('previous');
      nickname.val('nick');
      // trigger validation
      nickname.trigger('change');

      expect(spy.args[0][0].data.previousNickname()).to.equal('previous');
    });

    it('checks that a email check response is handled for "true"', function () {
      sandbox.stub($, 'ajax').yieldsTo('success', true);
      email.val('mail@a.de');
      // trigger validation
      email.trigger('change');

      expect(member_validator.element(email)).to.be(true);
      expect(member_validator.errorList).to.be.empty();
    });

    it('checks that a email check response is handled for "false"', function () {
      sandbox.stub($, 'ajax').yieldsTo('success', false);
      email.val('mail@a.de');
      // trigger validation
      email.trigger('change');

      expect(member_validator.element(email)).to.be(false);
      expect(member_validator.errorList[0]).to.have.ownProperty('message', emailAlreadyTaken);
    });

    it('checks that a email check also sends the previousEmail', function () {
      var spy = sandbox.spy($, 'ajax');
      var previousEmail = $('#memberform [name=previousEmail]');
      previousEmail.val('previous');
      email.val('mail@a.de');
      // trigger validation
      email.trigger('change');
      expect(spy.args[0][0].data.previousEmail()).to.equal('previous');
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
