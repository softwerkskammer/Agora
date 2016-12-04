'use strict';
const expect = require('must-dist');
const fs = require('fs');
const chado = require('chado');

after(() => {
  const analyzer = chado.analyzer;
  const reportArray = analyzer.read(chado.repo);
  chado.consoleReporter.logReport();

  /*eslint no-sync: 0*/
  fs.writeFileSync('chado-result.json', JSON.stringify(chado.repo, null, 2));

  expect(analyzer.getNotVerifiedAssumptions(reportArray)).to.have.length(0);
  expect(analyzer.getNotAssumedVerifications(reportArray)).to.have.length(0);
});

