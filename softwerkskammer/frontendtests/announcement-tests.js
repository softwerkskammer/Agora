/*global announcement_validator, urlIsNotAvailable, testglobals */
(function () {
  'use strict';

  describe('Announcements Form', function () {
    var url = $('#announcementform [name=url]');

    afterEach(function () {
      announcement_validator.resetForm();
    });

    var checkFieldMandatory = function (selector) {
      testglobals.mandatoryChecker(announcement_validator, selector);
    };

    var checkFieldWithPositiveAjaxResponse = function (field) {
      testglobals.checkFieldWithPositiveAjaxResponse(announcement_validator, field, undefined, /announcements\/checkurl\?url=value/);
    };

    var checkFieldWithNegativeAjaxResponse = function (field, message) {
      testglobals.checkFieldWithNegativeAjaxResponse(announcement_validator, field, message, undefined, /announcements\/checkurl\?url=value/);
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

    it('checks that a url call also sends the previousURl', function () {
      checkThatPreviousValueIsSent(url, $('#announcementform [name=previousUrl]'));
    });

    it('checks that "title" is mandatory', function () {
      checkFieldMandatory('#announcementform [name=title]');
    });

    it('checks that "url" is mandatory', function () {
      checkFieldMandatory('#announcementform [name=url]');
    });

    it('checks that "thruDate" is mandatory', function () {
      checkFieldMandatory('#announcementform [name=thruDate]');
    });

  });
}());
