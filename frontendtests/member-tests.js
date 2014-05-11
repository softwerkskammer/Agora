/*global member_validator, nicknameIsNotAvailable, emailAlreadyTaken */
(function () {
  "use strict";

  describe("Member Form", function () {
    var nickname = $("#memberform [name=nickname]");
    var email = $("#memberform [name=email]");

    var checkFieldMandatory = function (fieldname, value) {
      var field = $(fieldname);
      field.val("");
      expect(member_validator.element(field)).toBe(false);
      expect(member_validator.errorList[0].message).toBe('Dieses Feld ist ein Pflichtfeld.');
      field.val(value || "a");
      expect(member_validator.element(field)).toBe(true);
    };

    beforeEach(function (done) {
      $(function () {
        nickname.val("");
        nickname.trigger("change");
        email.val("");
        email.trigger("change");
        jasmine.Ajax.install();
        done();
      });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("checks that a nickname check response is handled for 'true'", function () {
      jasmine.Ajax.stubRequest("/members/checknickname?nickname=nick1&previousNickname=").andReturn({responseText: "true"});
      nickname.val("nick1");
      // trigger validation
      nickname.trigger("change");

      expect(member_validator.element(nickname)).toBe(true);
      expect(member_validator.errorList).toEqual([]);
    });

    it("checks that a nickname check response is handled for 'false'", function () {
      jasmine.Ajax.stubRequest("/members/checknickname?nickname=nick2&previousNickname=").andReturn({responseText: "false"});
      nickname.val("nick2");
      // trigger validation
      nickname.trigger("change");

      expect(member_validator.element(nickname)).toBe(false);
      expect(member_validator.errorList).toContain(jasmine.objectContaining({message: nicknameIsNotAvailable}));
    });

    it("checks that a nickname check also sends the previousNickname", function () {
      jasmine.Ajax.stubRequest("/members/checknickname?nickname=nick3&previousNickname=previous").andReturn({responseText: "true"});
      var previousNickname = $("#memberform [name=previousNickname]");
      previousNickname.val("previous");
      nickname.val("nick3");
      // trigger validation
      nickname.trigger("change");

      expect(member_validator.element(nickname)).toBe(true);
    });

    it("checks that a email check response is handled for 'true'", function () {
      jasmine.Ajax.stubRequest("/members/checkemail?email=mail1@a.de&previousEmail=").andReturn({responseText: "true"});
      email.val("mail1@a.de");
      // trigger validation
      email.trigger("change");

      expect(member_validator.element(email)).toBe(true);
      expect(member_validator.errorList).toEqual([]);
    });

    it("checks that a email check response is handled for 'false'", function () {
      jasmine.Ajax.stubRequest("/members/checkemail?email=mail2%40a.de&previousEmail=").andReturn({responseText: "false"});
      email.val("mail2@a.de");
      // trigger validation
      email.trigger("change");

      expect(member_validator.element(email)).toBe(false);
      expect(member_validator.errorList).toContain(jasmine.objectContaining({message: emailAlreadyTaken}));
    });

    it("checks that a email check also sends the previousEmail", function () {
      jasmine.Ajax.stubRequest("/members/checkemail?email=mail3@a.de&previousEmail=previous").andReturn({responseText: "true"});
      var previousEmail = $("#memberform [name=previousEmail]");
      previousEmail.val("previous");
      email.val("mail3@a.de");
      // trigger validation
      email.trigger("change");
    });

    it("checks that 'firstname' is mandatory", function () {
      checkFieldMandatory("#memberform [name=firstname]");
    });

    it("checks that 'lastname' is mandatory", function () {
      checkFieldMandatory("#memberform [name=lastname]");
    });

    it("checks that 'location' is mandatory", function () {
      checkFieldMandatory("#memberform [name=location]");
    });

    it("checks that 'reference' is mandatory", function () {
      checkFieldMandatory("#memberform [name=reference]");
    });

    it("checks that 'profession' is mandatory", function () {
      checkFieldMandatory("#memberform [name=profession]");
    });

    it("checks that 'email' is mandatory", function () {
      checkFieldMandatory("#memberform [name=email]", "l@b.de");
    });

    it("checks that 'nickname' is mandatory", function () {
      checkFieldMandatory("#memberform [name=nickname]", "onetwo");
    });

    it("checks that 'nickname' has at least two characters", function () {
      nickname.val("a");
      expect(member_validator.element(nickname)).toBe(false);
      expect(member_validator.errorList).toContain(jasmine.objectContaining({message: 'Geben Sie bitte mindestens 2 Zeichen ein.'}));
    });
  });
}());
