'use strict';

const expect = require('must-dist');

const beans = require('simple-configure').get('beans');
const Member = beans.get('member');
const addonLineUtilities = beans.get('socratesAddonLineUtilities');

function createLine(param) {
  return {member: new Member(param)};
}

describe('AddonLineUtilities', () => {

  it('groups addonlines by first letter of lastname', () => {
    const line = createLine({lastname: 'Last'});
    const lines = [line];
    const groupedLines = addonLineUtilities.groupAndSortAddonlines(lines);
    expect(groupedLines).to.have.keys(['L']);
    expect(groupedLines.L).to.contain(line);
  });

  it('sorts addonlines by lastname', () => {
    const lines = [
      createLine({lastname: 'Lost'}),
      createLine({lastname: 'Anton'}),
      createLine({lastname: 'Last'})
    ];
    const groupedLines = addonLineUtilities.groupAndSortAddonlines(lines);
    expect(Object.keys(groupedLines).sort()).to.eql(['A', 'L']);
    expect(groupedLines.L[0].member.lastname()).to.be('Last');
    expect(groupedLines.L[1].member.lastname()).to.be('Lost');
  });

});
