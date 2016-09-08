/*global activity_validator, endMustBeAfterBegin, testglobals*/
(function () {
  'use strict';

  describe('Activitiy Form', function () {
    beforeEach(function (done) {
      $(document).ready(function () { done(); });
    });

    afterEach(function () {
      activity_validator.resetForm();
    });

    var checkFieldMandatory = function (selector) {
      testglobals.mandatoryChecker(activity_validator, selector);
    };

    it('checks that "startDate" is mandatory', function () {
      checkFieldMandatory('#activityform [name=startDate]');
    });

    it('checks that "startTime" is mandatory', function () {
      checkFieldMandatory('#activityform [name=startTime]');
    });

    it('checks that start and end must not be identical', function () {
      $('#activityform [name=startDate]').val('23.09.2011');
      $('#activityform [name=endDate]').val('23.09.2011');
      $('#activityform [name=startTime]').val('12:11');
      $('#activityform [name=endTime]').val('12:11');
      $('#activityform [name=startTime]').trigger('change');

      expect(activity_validator.element('#activityform [name=endDate]')).to.be(false);
      expect(activity_validator.element('#activityform [name=endTime]')).to.be(false);
      expect(activity_validator.errorList[0]).to.have.ownProperty('message', endMustBeAfterBegin);
    });

  });
}());

