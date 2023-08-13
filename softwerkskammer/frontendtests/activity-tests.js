/*global activity_validator, endMustBeAfterBegin, urlIsNotAvailable, testglobals*/
(function () {
  "use strict";

  describe("Activitiy Form", function () {
    var url = $("#activityform [name=url]");

    beforeEach(function (done) {
      $(document).ready(function () {
        done();
      });
    });

    afterEach(function () {
      activity_validator.resetForm();
    });

    var checkFieldMandatory = function (selector) {
      testglobals.mandatoryChecker(activity_validator, selector);
    };

    var checkFieldWithPositiveAjaxResponse = function (field) {
      testglobals.checkFieldWithPositiveAjaxResponse(
        activity_validator,
        field,
        undefined,
        /activities\/checkurl\?url=value/,
      );
    };

    var checkFieldWithNegativeAjaxResponse = function (field, message) {
      testglobals.checkFieldWithNegativeAjaxResponse(
        activity_validator,
        field,
        message,
        undefined,
        /activities\/checkurl\?url=value/,
      );
    };

    var checkThatPreviousValueIsSent = function (field, previousField) {
      testglobals.checkThatPreviousValueIsSent(field, previousField);
    };

    it('checks that a url check response is handled for "true"', function () {
      checkFieldWithPositiveAjaxResponse(url);
    });

    it('checks that a url check response is handled for "false"', function () {
      checkFieldWithNegativeAjaxResponse(url, urlIsNotAvailable);
    });

    it("checks that a url call also sends the previousURl", function () {
      checkThatPreviousValueIsSent(url, $("#activityform [name=previousUrl]"));
    });

    it('checks that "title" is mandatory', function () {
      checkFieldMandatory("#activityform [name=title]");
    });

    it('checks that "assignedGroup" is mandatory', function () {
      var selector = "#activityform [name=assignedGroup]";
      var field = $(selector);
      expect(activity_validator.element(field)).to.be(false);
    });

    it('checks that "location" is mandatory', function () {
      checkFieldMandatory("#activityform [name=location]");
    });

    it('checks that "startDate" is mandatory', function () {
      checkFieldMandatory("#activityform [name=startDate]");
    });

    it('checks that "startTime" is mandatory', function () {
      checkFieldMandatory("#activityform [name=startTime]");
    });

    it("checks that start and end must not be identical", function () {
      $("#activityform [name=startDate]").val("23.09.2011");
      $("#activityform [name=endDate]").val("23.09.2011");
      $("#activityform [name=startTime]").val("12:11");
      $("#activityform [name=endTime]").val("12:11");
      $("#activityform [name=startTime]").trigger("change");

      expect(activity_validator.element("#activityform [name=endDate]")).to.be(false);
      expect(activity_validator.element("#activityform [name=endTime]")).to.be(false);
      expect(activity_validator.errorList[0]).to.have.ownProperty("message", endMustBeAfterBegin);
    });
  });
})();
