/*global activityDateModel, moment */

(function () {
  'use strict';

  var utc = function (dateString, timeString) {
    return moment.utc(dateString + ' ' + timeString, 'D.M.YYYY H:m');
  };

  function assertMoment(moment, date, time) {
    expect(moment.format('DD.MM.YYYY')).to.equal(date);
    expect(moment.format('HH:mm')).to.equal(time);
  }

  describe('Date Adjustment', function () {
    beforeEach(function (done) {
      $(document).ready(function () { done(); });
    });

    describe('Activity Date Model', function () {

      it('moves EndDate forward if StartDate contains the same date and is moved forward', function () {
        var model = activityDateModel('07.09.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('08.09.2013', '12:15'), end: utc('07.09.2013', '12:15')});
        assertMoment(result, '08.09.2013', '12:15');
      });

      it('moves EndDate forward if StartDate contains a different date and is moved forward', function () {
        var model = activityDateModel('07.09.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('08.09.2013', '12:15'), end: utc('09.09.2013', '14:15')});
        assertMoment(result, '10.09.2013', '14:15');
      });

      it('moves EndDate backward if StartDate contains the same date and is moved backward', function () {
        var model = activityDateModel('07.09.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('06.09.2013', '12:15'), end: utc('07.09.2013', '12:15')});
        assertMoment(result, '06.09.2013', '12:15');

      });

      it('moves EndDate backward if StartDate contains a different date and is moved backward', function () {
        var model = activityDateModel('01.09.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('08.08.2013', '12:15'), end: utc('07.09.2013', '14:15')});
        assertMoment(result, '14.08.2013', '14:15');
      });

      // Time

      it('moves EndTime forward if StartTime contains the same time and is moved forward', function () {
        var model = activityDateModel('07.09.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('07.09.2013', '14:15'), end: utc('07.09.2013', '12:15')});
        assertMoment(result, '07.09.2013', '14:15');
      });

      it('moves EndTime forward if StartTime contains a different time and is moved forward', function () {
        var model = activityDateModel('07.09.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('07.09.2013', '15:45'), end: utc('09.09.2013', '14:15')});
        assertMoment(result, '09.09.2013', '17:45');
      });

      it('moves EndTime backward if StartTime contains the same time and is moved backward', function () {
        var model = activityDateModel('07.09.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('07.09.2013', '10:10'), end: utc('07.09.2013', '12:15')});
        assertMoment(result, '07.09.2013', '10:10');

      });

      it('moves EndTime backward if StartTime contains a different time and is moved backward', function () {
        var model = activityDateModel('01.09.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('01.09.2013', '00:00'), end: utc('07.09.2013', '14:15')});
        assertMoment(result, '07.09.2013', '02:00');
      });

      it('moves EndDate and EndTime forward if StartTime is moved past midnight', function () {
        var model = activityDateModel('07.09.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('07.09.2013', '14:15'), end: utc('09.09.2013', '23:15')});
        assertMoment(result, '10.09.2013', '01:15');
      });

      it('... if endDate is moved across the summertime boundary in spring', function () {
        var model = activityDateModel('29.03.2013', '12:15');
        var result = model.calculateNewEndMoment({start: utc('30.03.2013', '12:15'), end: utc('30.03.2013', '14:15')});
        assertMoment(result, '31.03.2013', '14:15');
      });

      it('... if endDate is moved across the summertime boundary in autumn', function () {
        var model = activityDateModel('25.10.2013', '20:15');
        var result = model.calculateNewEndMoment({start: utc('26.10.2013', '20:15'), end: utc('26.10.2013', '23:15')});
        assertMoment(result, '27.10.2013', '23:15');
      });

      it('... if endTime is moved across the summertime boundary in spring', function () {
        var model = activityDateModel('30.03.2013', '19:15');
        var result = model.calculateNewEndMoment({start: utc('30.03.2013', '22:15'), end: utc('30.03.2013', '23:15')});
        assertMoment(result, '31.03.2013', '02:15');
      });

      it('... if endTime is moved across the summertime boundary in autumn', function () {
        var model = activityDateModel('26.10.2013', '20:15');
        var result = model.calculateNewEndMoment({start: utc('26.10.2013', '23:15'), end: utc('27.10.2013', '00:15')});
        assertMoment(result, '27.10.2013', '03:15');
      });
    });

    describe('Input formatter', function () {

      it('transforms the input dates into moments', function () {
        var model = activityDateModel('01.10.2013', '20:15');
        var result = model.convertInputs('04.11.2013', '16:15', '07.12.2013', '19:25');
        assertMoment(result.start, '04.11.2013', '16:15');
        assertMoment(result.end, '07.12.2013', '19:25');
      });

    });

    describe('Output formatter', function () {

      it('creates end strings for the inputs', function () {
        var result = activityDateModel().createDateAndTimeStrings(utc('06.11.2013', '18:15'));
        expect(result.endDate).to.equal('06.11.2013');
        expect(result.endTime).to.equal('18:15');
      });

    });

    describe('Date Model', function () {

      it('does everything together', function () {
        var model = activityDateModel('07.09.2013', '12:15');
        var result = model.determineNewEnd('08.09.2013', '12:15', '09.09.2013', '14:15');
        expect(result.endDate).to.equal('10.09.2013');
        expect(result.endTime).to.equal('14:15');
      });

    });

  });

}());
