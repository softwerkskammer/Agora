'use strict';

const currentYear = 2017;

module.exports.currentYear = currentYear;
module.exports.urlPrefix = 'socrates-';
module.exports.currentUrl = this.urlPrefix + currentYear;

module.exports.registrationPeriodinMinutes = 30;

module.exports.twitterConstants = {
  twitterHandle: 'SoCraTes_Conf',
  urlEncodedTweetText: `SoCraTes+${currentYear}+will+take+place+from+24+to+27+August.+More+at&url=http%3A%2F%2Fsocrates-conference.de%2F`,
  hashtag: 'socrates_17'
};
