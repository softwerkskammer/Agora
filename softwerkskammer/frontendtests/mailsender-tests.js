/*global mail_validator, testglobals */
(function () {
  'use strict';

  describe('Mailsender Form', function () {

    var checkFieldMandatory = function (selector) {
      testglobals.mandatoryChecker(mail_validator, selector);
    };

    it('checks that "subject" is mandatory', function () {
      checkFieldMandatory('#mailform [name=subject]');
    });

    it('checks that "markdown" is mandatory', function () {
      checkFieldMandatory('#mailform [name=markdown]');
    });

  });
}());
