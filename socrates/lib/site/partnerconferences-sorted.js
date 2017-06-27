'use strict';

const partners = require('./partners.json');
const moment = require('moment-timezone');

function sortAndFormatPartners() {
  function datestringFor(startdate, enddate) {
    moment.locale('en-GB');
    if (enddate) {
      return moment(startdate).format('D') + ' - ' + moment(enddate).format('LL');
    }
    return moment(startdate).format('LL');
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
