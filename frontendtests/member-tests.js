/*global member_validator, nicknameIsNotAvailable, emailAlreadyTaken */
(function () {
  'use strict';

  describe('Member Form', function () {
    var nickname = $('#memberform [name=nickname]');
    var email = $('#memberform [name=email]');

    var checkFieldMandatory = function (fieldname, value) {
      var field = $(fieldname);
      field.val('');
      expect(member_validator.element(field)).to.be(false);
      expect(member_validator.errorList[0].message).to.be('Dieses Feld ist ein Pflichtfeld.');
      field.val(value || 'a');
      expect(member_validator.element(field)).to.be(true);
    };

    it('checks that a nickname check response is handled for "true"', function () {
      sinon.stub($, 'ajax').yieldsTo('success', true);
      nickname.val('nick1');
      // trigger validation
      nickname.trigger('change');

      expect(member_validator.element(nickname)).to.be(true);
      expect(member_validator.errorList).to.be.empty();
      $.ajax.restore();
    });

    it('checks that a nickname check response is handled for "false"', function () {
      sinon.stub($, 'ajax').yieldsTo('success', false);
      nickname.val('nick2');
      // trigger validation
      nickname.trigger('change');

      expect(member_validator.element(nickname)).to.be(false);
      expect(member_validator.errorList[0]).to.have.ownProperty('message', nicknameIsNotAvailable);
      $.ajax.restore();
    });

    it('checks that a nickname check also sends the previousNickname', function () {
      var spy = sinon.spy($, 'ajax');
      var previousNickname = $('#memberform [name=previousNickname]');
      previousNickname.val('previous');
      nickname.val('nick3');
      // trigger validation
      nickname.trigger('change');

      expect(spy.args[0][0].data.previousNickname()).to.equal('previous');
      $.ajax.restore();
    });

    it('checks that a email check response is handled for "true"', function () {
      sinon.stub($, 'ajax').yieldsTo('success', true);
      email.val('mail1@a.de');
      // trigger validation
      email.trigger('change');

      expect(member_validator.element(email)).to.be(true);
      expect(member_validator.errorList).to.be.empty();
      $.ajax.restore();
    });

    it('checks that a email check response is handled for "false"', function () {
      sinon.stub($, 'ajax').yieldsTo('success', false);
      email.val('mail2@a.de');
      // trigger validation
      email.trigger('change');

      expect(member_validator.element(email)).to.be(false);
      expect(member_validator.errorList[0]).to.have.ownProperty('message', emailAlreadyTaken);
      $.ajax.restore();
    });

    it('checks that a email check also sends the previousEmail', function () {
      var spy = sinon.spy($, 'ajax');
      var previousEmail = $('#memberform [name=previousEmail]');
      previousEmail.val('previous');
      email.val('mail3@a.de');
      // trigger validation
      email.trigger('change');
      expect(spy.args[0][0].data.previousEmail()).to.equal('previous');
      $.ajax.restore();
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
