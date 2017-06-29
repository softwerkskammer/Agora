'use strict';

const moment = require('moment-timezone');

function sortAndFormatPartners(partners) {
  function datestringFor(startdate, enddate) {
    moment.locale('en-GB');
    const start = moment(startdate);
    if (enddate) {
      const end = moment(enddate);
      if (start.month() === end.month()) {
        return start.format('D') + ' - ' + end.format('LL');
      } else if (start.year() === end.year()) {
        return start.format('D MMMM') + ' - ' + end.format('LL');
      } else {
        return start.format('LL') + ' - ' + end.format('LL');
      }
    }
    return start.format('LL');
  }

  const parsedPartners = partners.map(
    p => {
      return {
        name: p.name,
        url: p.url,
        datestring: datestringFor(p.startdate, p.enddate),
        startMoment: moment(p.startdate),
        location: p.location
      };
    }
  );
  return parsedPartners.sort((a, b) => a.startMoment.diff(b.startMoment));
}

module.exports = sortAndFormatPartners;
