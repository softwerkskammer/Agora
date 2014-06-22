#!/bin/sh
# set application variables in the config files inside the config folder
cd node_modules/jquery-validation
npm install grunt-cli --save-dev
npm install
grunt concat
