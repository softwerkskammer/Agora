'use strict';

process.env.NODE_ICU_DATA = 'node_modules/full-icu'; // necessary for timezone stuff
// eslint-disable-next-line no-trailing-spaces
require('./softwerkskammer/configure'); // initializing parameters
require('./softwerkskammer/app.js').start();
