/*global describe, it */
"use strict";

var expect = require('chai').expect;


var systemUnderTest = require('../lib/groups/sympaTransformer')();

describe('Sympa-Transformer ', function () {


  it('returns an empty array if the list of objects to be transformed is empty', function (done) {

    var result = systemUnderTest.stripMailSuffixes([]);

    expect(result).to.not.be.null;
    expect(result.length).to.equal(0);
    done();
  });

  it('returns a list with an object with a transformed email address', function (done) {

    var result = systemUnderTest.stripMailSuffixes([{ listAddress: 'list@softwerkskammer.de'}]);

    expect(result).to.not.be.null;
    expect(result.length).to.equal(1);
    expect(result[0].listAddress).to.equal('list');
    done();
  });

  it('transforms a whole list of arbitrary email addresses', function (done) {

    var result = systemUnderTest.stripMailSuffixes([{ listAddress: 'list@softwerkskammer.de'},
      { listAddress: 'ich@tolledomain.com'},
      { listAddress: 'info@meinefirma.co.uk'},
      { listAddress: 'wernoch@sonstwo.org'}
    ]);

    expect(result).to.not.be.null;
    expect(result.length).to.equal(4);
    expect(result[0].listAddress).to.equal('list');
    expect(result[1].listAddress).to.equal('ich');
    expect(result[2].listAddress).to.equal('info');
    expect(result[3].listAddress).to.equal('wernoch');
    done();
  });

});
