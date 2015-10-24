'use strict';
var expect = require('must-dist');

var chado = require('chado');

after(function () {
  var analyzer = chado.analyzer;
  var reportArray = analyzer.read(chado.repo);
  chado.consoleReporter.logReport();
  expect(analyzer.getNotVerifiedAssumptions(reportArray)).to.have.length(0);
  expect(analyzer.getNotAssumedVerifications(reportArray)).to.have.length(0);
});

