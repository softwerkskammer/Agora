/*global mail_validator */
(function () {
  "use strict";

  describe("Mailsender Form", function () {

    var checkFieldMandatory = function (fieldname) {
      var field = $(fieldname);
      field.val("");
      expect(mail_validator.element(field)).toBe(false);
      expect(mail_validator.errorList[0].message).toBe('Dieses Feld ist ein Pflichtfeld.');
      field.val("a"); // to make it select a t-shirt size
      expect(mail_validator.element(field)).toBe(true);
    };

    beforeEach(function (done) {
      $(function () {
        jasmine.Ajax.install();
        done();
      });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("checks that 'subject' is mandatory", function () {
      checkFieldMandatory("#mailform [name=subject]");
    });

    it("checks that 'markdown' is mandatory", function () {
      checkFieldMandatory("#mailform [name=markdown]");
    });

  });
}());
