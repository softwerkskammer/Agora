/*global announcement_validator, urlIsNotAvailable */
(function () {
  "use strict";

  describe("Announcements Form", function () {
    var url = $("#announcementform [name=url]");

    var checkFieldMandatory = function (fieldname) {
      var field = $(fieldname);
      field.val("");
      expect(announcement_validator.element(field)).toBe(false);
      expect(announcement_validator.errorList[0].message).toBe('Dieses Feld ist ein Pflichtfeld.');
      field.val("a");
      expect(announcement_validator.element(field)).toBe(true);
    };

    beforeEach(function (done) {
      $(function () {
        url.val("");
        url.trigger("change");
        jasmine.Ajax.install();
        done();
      });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("checks that a url check response is handled for 'true'", function () {
      jasmine.Ajax.stubRequest("/announcements/checkurl?previousUrl=&url=test1").andReturn({responseText: "true"});
      url.val("test1");
      // trigger validation
      url.trigger("change");

      expect(announcement_validator.element(url)).toBe(true);
      expect(announcement_validator.errorList).toEqual([]);
    });

    it("checks that a url check response is handled for 'false'", function () {
      jasmine.Ajax.stubRequest("/announcements/checkurl?previousUrl=&url=test2").andReturn({responseText: "false"});
      url.val("test2");
      // trigger validation
      url.trigger("change");

      expect(announcement_validator.element(url)).toBe(false);
      expect(announcement_validator.errorList).toContain(jasmine.objectContaining({message: urlIsNotAvailable}));
    });

    it("checks that a url call also sends the previousURl", function () {
      jasmine.Ajax.stubRequest("/announcements/checkurl?url=test3&previousUrl=previous").andReturn({responseText: "true"});
      var previousUrl = $("#announcementform [name=previousUrl]");
      previousUrl.val("previous");
      url.val("test3");
      // trigger validation
      url.trigger("change");

      expect(announcement_validator.element(url)).toBe(true);
    });

    it("checks that 'title' is mandatory", function () {
      checkFieldMandatory("#announcementform [name=title]");
    });

    it("checks that 'url' is mandatory", function () {
      checkFieldMandatory("#announcementform [name=url]");
    });

    it("checks that 'thruDate' is mandatory", function () {
      checkFieldMandatory("#announcementform [name=thruDate]");
    });

  });
}());
