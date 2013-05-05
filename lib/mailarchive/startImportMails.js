"use strict";
require("../../configure")();
var file = process.argv[2];
var group = process.argv[3];
require('./importMails')(file, group);
