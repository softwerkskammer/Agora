/*global activity_validator, endMustBeAfterBegin, urlIsNotAvailable*/
(function () {
  "use strict";

  describe("Activitiy Form", function () {
    var url = $("#activityform [name=url]");

    var checkFieldMandatory = function (fieldname) {
      var field = $(fieldname);
      field.val("");
      expect(activity_validator.element(field)).toBe(false);
      expect(activity_validator.errorList[0].message).toBe('Dieses Feld ist ein Pflichtfeld.');
      field.val("a");
      expect(activity_validator.element(field)).toBe(true);
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
      jasmine.Ajax.stubRequest("/activities/checkurl?previousUrl=&url=test1").andReturn({responseText: "true"});
      url.val("test1");
      // trigger validation
      url.trigger("change");

      expect(activity_validator.element(url)).toBe(true);
      expect(activity_validator.errorList).toEqual([]);
    });

    it("checks that a url check response is handled for 'false'", function () {
      jasmine.Ajax.stubRequest("/activities/checkurl?previousUrl=&url=test2").andReturn({responseText: "false"});
      url.val("test2");
      // trigger validation
      url.trigger("change");

      expect(activity_validator.element(url)).toBe(false);
      expect(activity_validator.errorList).toContain(jasmine.objectContaining({message: urlIsNotAvailable}));
    });

    it("checks that a url call also sends the previousURl", function () {
      jasmine.Ajax.stubRequest("/activities/checkurl?url=test3&previousUrl=previous").andReturn({responseText: "true"});
      var previousUrl = $("#activityform [name=previousUrl]");
      previousUrl.val("previous");
      url.val("test3");
      // trigger validation
      url.trigger("change");

      expect(activity_validator.element(url)).toBe(true);
    });

    it("checks that a url call also sends the previousURl", function () {
      jasmine.Ajax.stubRequest("/activities/checkurl?url=test3&previousUrl=previous").andReturn({responseText: "true"});
      var previousUrl = $("#activityform [name=previousUrl]");
      previousUrl.val("previous");
      url.val("test3");
      // trigger validation
      url.trigger("change");

      expect(activity_validator.element(url)).toBe(true);
    });

    it("checks that 'title' is mandatory", function () {
      checkFieldMandatory("#activityform [name=title]");
    });

    it("checks that 'location' is mandatory", function () {
      checkFieldMandatory("#activityform [name=location]");
    });

    it("checks that 'startDate' is mandatory", function () {
      checkFieldMandatory("#activityform [name=startDate]");
    });

    it("checks that 'startTime' is mandatory", function () {
      checkFieldMandatory("#activityform [name=startTime]");
    });

    it("checks that start and end must not be identical", function () {
      $("#activityform [name=startDate]").val("23.09.2011");
      $("#activityform [name=endDate]").val("23.09.2011");
      $("#activityform [name=startTime]").val("12:11");
      $("#activityform [name=endTime]").val("12:11");
      $("#activityform [name=startTime]").trigger("change");

      expect(activity_validator.element("#activityform [name=endDate]")).toBe(false);
      expect(activity_validator.element("#activityform [name=endTime]")).toBe(false);
      expect(activity_validator.errorList).toContain(jasmine.objectContaining({message: endMustBeAfterBegin}));
    });

  });
}());

