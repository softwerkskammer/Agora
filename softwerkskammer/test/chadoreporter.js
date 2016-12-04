'use strict';
const expect = require('must-dist');

const chado = require('chado');

after(() => {
  const analyzer = chado.analyzer;
  const reportArray = analyzer.read(chado.repo);
  expect(analyzer.getNotVerifiedAssumptions(reportArray)).to.have.length(0);
  expect(analyzer.getNotAssumedVerifications(reportArray)).to.have.length(0);
});

