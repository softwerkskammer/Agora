'use strict';

var expect = require('must-dist');

var beans = require('simple-configure').get('beans');
var Member = beans.get('member');
var addonLineUtilities = beans.get('socratesAddonLineUtilities');

function createLine(param) {
  return {member: new Member(param)};
}


describe('AddonLineUtilities', function () {

  it('groups addonlines by first letter of lastname', function () {
    var line = createLine({lastname: 'Last'});
    var lines = [line];
    var groupedLines = addonLineUtilities.groupAndSortAddonlines(lines);
    expect(groupedLines).to.have.keys(['L']);
    expect(groupedLines.L).to.contain(line);
  });

  it('sorts addonlines by lastname', function () {
    var lines = [
      createLine({lastname: 'Lost'}),
      createLine({lastname: 'Anton'}),
      createLine({lastname: 'Last'})
    ];
    var groupedLines = addonLineUtilities.groupAndSortAddonlines(lines);
    expect(Object.keys(groupedLines).sort()).to.eql(['A', 'L']);
    expect(groupedLines.L[0].member.lastname()).to.be('Last');
    expect(groupedLines.L[1].member.lastname()).to.be('Lost');
  });

});
