/*global mail_validator */
(function () {
  'use strict';

  describe('Mailsender Form', function () {

    var checkFieldMandatory = function (fieldname) {
      testglobals.mandatoryChecker(mail_validator, fieldname);
    };

    it('checks that "subject" is mandatory', function () {
      checkFieldMandatory('#mailform [name=subject]');
    });

    it('checks that "markdown" is mandatory', function () {
      checkFieldMandatory('#mailform [name=markdown]');
    });

  });
}());
