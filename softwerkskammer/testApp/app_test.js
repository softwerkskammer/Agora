'use strict';
const expect = require('must-dist');
const httpRequest = require('request');
const sinon = require('sinon').sandbox.create();
const conf = require('../testutil/configureForTest');
const beans = conf.get('beans');
const groupsService = beans.get('groupsService');
const groupstore = beans.get('groupstore');

const baseUri = 'http://localhost:' + parseInt(conf.get('port'), 10);

const app = require('../app.js');

describe('SWK Plattform server', () => {
  beforeEach(done => {
    sinon.stub(groupstore, 'allGroups').callsFake(callback => callback(null, []));
    sinon.stub(groupsService, 'getAllAvailableGroups').callsFake(callback => callback(null, []));
    app.start(done);
  });

  afterEach(done => {
    sinon.restore();
    app.stop(done);
  });

  it('responds on a GET for the home page', done => {
    httpRequest({uri: baseUri}, (req, resp) => {
      expect(resp).to.exist();
      expect(resp.statusCode).to.equal(200);
      done(); // without error check
    });
  });

  it('responds with HTML on a GET for the home page', done => {
    httpRequest({uri: baseUri}, (req, resp) => {
      expect(resp.headers['content-type']).to.contain('text/html');
      done(); // without error check
    });
  });

  it('shows "Softwerkskammer" on the home page', done => {
    httpRequest({uri: baseUri}, (req, resp) => {
      expect(resp.body).to.contain('Softwerkskammer');
      done(); // without error check
    });
  });

  it('renders the i18n translated text on the home page correctly', done => {
    httpRequest({uri: baseUri}, (req, resp) => {
      expect(resp.body).to.contain('Die Softwerkskammer hat sich 2011 gegründet, um den Austausch Interessierter zum Thema Software Craftsmanship\nzu vereinfachen.');
      done(); // without error check
    });
  });

  it('provides the screen style sheet', done => {
    const stylesheetUri = baseUri + '/stylesheets/screen.css';
    httpRequest({uri: stylesheetUri}, (req, resp) => {
      expect(resp.statusCode).to.equal(200);
      expect(resp.headers['content-type']).to.contain('text/css');
      expect(resp.body).to.contain('color:');
      done(); // without error check
    });
  });

  it('provides the clientside membercheck functions', done => {
    const stylesheetUri = baseUri + '/clientscripts/check-memberform.js';
    httpRequest({uri: stylesheetUri}, (req, resp) => {
      expect(resp.statusCode).to.equal(200);
      expect(resp.headers['content-type']).to.contain('application/javascript');
      expect(resp.body).to.contain('#memberform');
      done(); // without error check
    });
  });
});

describe('SWK Plattform server with Error', () => {
  beforeEach(done => {
    sinon.stub(groupstore, 'allGroups').callsFake(callback => callback(new Error(), []));
    sinon.stub(groupsService, 'getAllAvailableGroups').callsFake(callback => callback(null, []));
    app.start(done);
  });

  afterEach(done => {
    sinon.restore();
    app.stop(done);
  });

  it('renders the i18n translated text on the home page correctly', done => {

    httpRequest({uri: baseUri}, (req, resp) => {
      expect(resp.body).to.contain('<li>Was hast Du getan?</li>');
      expect(resp.body).to.contain('<li>Betriebssystem und Browser inkl. Version.</li>');
      expect(resp.body).to.contain('<li>Den Stacktrace</li>');
      expect(resp.body).to.contain('<p>Das Agora-Team bittet um Entschuldigung.</p>');
      done(); // without error check
    });
  });

});
