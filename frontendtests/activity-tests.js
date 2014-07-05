/*global activity_validator, endMustBeAfterBegin, urlIsNotAvailable*/
(function () {
  'use strict';

  describe('Activitiy Form', function () {
    var url = $('#activityform [name=url]');

    var checkFieldMandatory = function (fieldname) {
      testglobals.mandatoryChecker(activity_validator, fieldname);
    };

    it('checks that a url check response is handled for "true"', function () {
      sinon.stub($, 'ajax').yieldsTo('success', true);

      url.val('test1');
      // trigger validation
      url.trigger('change');

      expect(activity_validator.element(url)).to.be(true);
      expect(activity_validator.errorList).to.be.empty();
      $.ajax.restore();
    });

    it('checks that a url check response is handled for "false"', function () {
      sinon.stub($, 'ajax').yieldsTo('success', false);
      url.val('test2');
      // trigger validation
      url.trigger('change');

      expect(activity_validator.element(url)).to.be(false);
      expect(activity_validator.errorList[0]).to.have.ownProperty('message', urlIsNotAvailable);
      $.ajax.restore();
    });

    it('checks that a url call also sends the previousURl', function () {
      var spy = sinon.spy($, 'ajax');
      var previousUrl = $('#activityform [name=previousUrl]');
      previousUrl.val('previous');
      url.val('test3');
      // trigger validation
      url.trigger('change');
      expect(spy.args[0][0].data.previousUrl()).to.equal('previous');
      $.ajax.restore();
    });

    it('checks that "title" is mandatory', function () {
      checkFieldMandatory('#activityform [name=title]');
    });

    it('checks that "location" is mandatory', function () {
      checkFieldMandatory('#activityform [name=location]');
    });

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

