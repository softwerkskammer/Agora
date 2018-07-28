'use strict';

const beans = require('../../testutil/configureForTest').get('beans');
const Group = beans.get('group');
const Member = beans.get('member');
const expect = require('must-dist');

describe('Group object', () => {

  describe('constructor', () => {

    it('reads a single organizer into an array', () => {
      const group = new Group({id: 'group', organizers: 'id'});

      expect(group.organizers).to.be.an.array();
      expect(group.organizers).to.contain('id');
    });

    it('reads two organizers into an array', () => {
      const group = new Group({id: 'group', organizers: 'idA,idB'});

      expect(group.organizers).to.be.an.array();
      expect(group.organizers).to.contain('idA');
      expect(group.organizers).to.contain('idB');
    });

    it('leaves an organizers array as-is', () => {
      const group = new Group({id: 'group', organizers: ['idA', 'idB']});

      expect(group.organizers).to.be.an.array();
      expect(group.organizers).to.contain('idA');
      expect(group.organizers).to.contain('idB');
    });

  });

});

describe('should deliver', () => {

  it('two types of groups', () => {
    const allTypes = Group.allTypes();
    expect(allTypes.length).to.equal(2);
    expect(allTypes).to.contain('Themengruppe');
    expect(allTypes).to.contain('Regionalgruppe');
  });

  it('the group for Themengruppe', () => {
    const group = new Group({id: 'abc', type: 'Themengruppe'});
    expect(Group.thematicsFrom([group])).to.eql([group]);
    expect(Group.regionalsFrom([group])).to.eql([]);
  });

  it('the group for Regionalgruppe', () => {
    const group = new Group({id: 'abc', type: 'Regionalgruppe'});
    expect(Group.thematicsFrom([group])).to.eql([]);
    expect(Group.regionalsFrom([group])).to.eql([group]);
  });

});

it('should transform the id to lowercase', () => {
  const group = new Group({id: 'NeuePlattform'});
  expect(group.id).to.equal('neueplattform');
});

describe('descriptionHTMLFiltered should filter the description html by given', () => {

  it('matchOpenClosedTag', () => {
    const descriptionHTML = () => '<a href="#">asda</a>description';
    const group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered('a')).to.equal('description');
  });

  it('matchSingleClosedTag', () => {
    const descriptionHTML = () => '<img src="#"/>description';
    const group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered('img')).to.equal('description');
  });

  it('matchSingleTag', () => {
    const descriptionHTML = () => '<img src="#">description';
    const group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered('img')).to.equal('description');
  });

});

it('should generate a list for the organizers based on members, only one in organizers', () => {
  const group = new Group({id: 'NeuePlattform', organizers: ['Hans', 'Heinz']});
  const members = [new Member({id: 'Hans'}), new Member({id: 'Karl'})];

  const checkedOrganizers = group.checkedOrganizers(members);

  expect(checkedOrganizers.length).to.equal(2);
  expect(checkedOrganizers[0].member.id()).to.equal('Hans');
  expect(checkedOrganizers[0].checked).to.be(true);
  expect(checkedOrganizers[1].member.id()).to.equal('Karl');
  expect(checkedOrganizers[1].checked).to.be(false);
});

it('generates a transparent label for subscription checkboxes', () => {
  const group = new Group({id: 'NeuePlattform', longName: 'Neue Plattform', emailPrefix: 'NP'});

  const labeltext = group.displaynameInSubscriptionList();

  expect(labeltext).to.equal('Neue Plattform [NP] - neueplattform');
});

describe('answers that a', () => {

  it('memberId is one of its organizers', () => {
    const group = new Group({id: 'groupA', organizers: 'id'});
    expect(group.isOrganizer('id')).to.be(true);
  });

  it('wrong memberId is not one of its organizers', () => {
    const group = new Group({id: 'groupA', organizers: 'id'});
    expect(group.isOrganizer('anotherId')).to.be(false);
  });

  it('memberId is not one of its organizers if there are no organizers initialized', () => {
    const group = new Group();
    expect(group.isOrganizer('anotherId')).to.be(false);
  });

});

describe('delivers the symmetric difference of organizers to', () => {

  it('no other group (first arg is undefined)', () => {
    const group = new Group({id: 'groupA', organizers: 'id'});
    expect(Group.organizersOnlyInOneOf(undefined, group)).to.contain('id');
  });

  it('no other group (second arg is undefined)', () => {
    const group = new Group({id: 'groupA', organizers: 'id'});
    expect(Group.organizersOnlyInOneOf(group)).to.contain('id');
  });

  it('another group (identical organizers)', () => {
    const groupA = new Group({id: 'groupA', organizers: 'id'});
    const groupB = new Group({id: 'groupB', organizers: 'id'});
    expect(Group.organizersOnlyInOneOf(groupA, groupB)).to.not.contain('id');
  });

  it('another group (additional organizers on both sides)', () => {
    const groupA = new Group({id: 'groupA', organizers: ['id', 'idA']});
    const groupB = new Group({id: 'groupB', organizers: ['id', 'idB']});
    expect(Group.organizersOnlyInOneOf(groupA, groupB)).to.contain('idA');
    expect(Group.organizersOnlyInOneOf(groupA, groupB)).to.contain('idB');
    expect(Group.organizersOnlyInOneOf(groupA, groupB)).to.not.contain('id');
  });

});

describe('returns the meetup :urlname from the given meetup URL', () => {
  it('returns null when no meetup URL is given', () => {
    const group = new Group({id: 'group'});

    expect(group.meetupUrlName()).to.eql(null);
  });

  it('behaves shit-in shit-out when the meetup URL is malformed', () => {
    const group = new Group({id: 'group', meetupURL: 'https://www.meetup.com/de-DE//'});

    expect(group.meetupUrlName()).to.eql('');
  });

  it('can handle an URL with trailing slash', () => {
    const group = new Group({id: 'group', meetupURL: 'https://www.meetup.com/de-DE/Softwerkskammer-Karlsruhe/'});

    expect(group.meetupUrlName()).to.eql('Softwerkskammer-Karlsruhe');
  });

  it('can handle an URL without trailing slash', () => {
    const group = new Group({id: 'group', meetupURL: 'https://www.meetup.com/de-DE/Softwerkskammer-Karlsruhe'});

    expect(group.meetupUrlName()).to.eql('Softwerkskammer-Karlsruhe');
  });

  it('can handle an URL in different languages', () => {
    const group = new Group({id: 'group', meetupURL: 'https://www.meetup.com/en-US/Softwerkskammer-Karlsruhe/'});

    expect(group.meetupUrlName()).to.eql('Softwerkskammer-Karlsruhe');
  });

});
