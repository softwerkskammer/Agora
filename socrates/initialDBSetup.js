/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

const beans = require('./configure').get('beans');
const request = require('supertest');
const createApp = require('./testutil/testHelper')('socratesActivitiesApp', beans).createApp;
const Member = beans.get('member');
const appWithSocratesMember = request(createApp({member: new Member({id: 'superuserID'})}));
const year = beans.get('socratesConstants').currentYear;

appWithSocratesMember
  .post('/submit')
  .send('previousUrl=')
  .send('startDate=15/06/' + year + '&startTime=12:30&endDate=10/08/' + year + '&endTime=10:30')
  .send('resources[names]=single&resources[names]=bed_in_double&resources[names]=bed_in_junior&resources[names]=junior')
  .send('resources[limits]=100&resources[limits]=200&resources[limits]=300&resources[limits]=400')
  .end(err => {
    console.log(err || 'Created SoCraTes activity in the database');
    process.exit();
  });
