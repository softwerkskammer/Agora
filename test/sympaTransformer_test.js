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
    expect(result[0].groupName).to.equal('list');
    done();
  });

  it('transforms a whole list of arbitrary email addresses', function (done) {

    var result = systemUnderTest.stripMailSuffixes([{ listAddress: 'list@softwerkskammer.de'},
      { listAddress: 'mygroup@tolledomain.com'},
      { listAddress: 'infolist@meinefirma.co.uk'},
      { listAddress: 'otherlist@sonstwo.org'}
    ]);

    expect(result).to.not.be.null;
    expect(result.length).to.equal(4);
    expect(result[0].groupName).to.equal('list');
    expect(result[1].groupName).to.equal('mygroup');
    expect(result[2].groupName).to.equal('infolist');
    expect(result[3].groupName).to.equal('otherlist');
    done();
  });


  it('transforms null to an empty array', function (done) {
    var result = systemUnderTest.toArray(null);

    expect(result).to.not.be.null;
    expect(result.length).to.equal(0);
    done();
  });

  it('transforms a null item to an empty array', function (done) {
    var result = systemUnderTest.toArray({ item: null });

    expect(result).to.not.be.null;
    expect(result.length).to.equal(0);
    done();
  });

  it('transforms a single item to an array with that item', function (done) {
    var result = systemUnderTest.toArray({ item: 'Test' });

    expect(result).to.not.be.null;
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal('Test');
    done();
  });

  it('transforms an array of items to the same array', function (done) {
    var result = systemUnderTest.toArray({ item: [ 'Test1', 'Test2' ] });

    expect(result).to.not.be.null;
    expect(result.length).to.equal(2);
    expect(result[0]).to.equal('Test1');
    expect(result[1]).to.equal('Test2');
    done();
  });
});
