'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationReadModel = beans.get('RegistrationReadModel');


var singleBedRoom = 'singleBedRoom';
var sessionId1 = 'session-id-1';
var sessionId2 = 'session-id-2';

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var aShortTimeAgo = moment.tz().subtract(10, 'minutes');
var anEvenShorterTimeAgo = moment.tz().subtract(1, 'minutes');

