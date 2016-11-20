'use strict';
const R = require('ramda');
const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const Renderer = beans.get('renderer');
const fieldHelpers = beans.get('fieldHelpers');

const themengruppe = 'Themengruppe';
const regionalgruppe = 'Regionalgruppe';

class Group {
  constructor(object) {
    if (object) {
      this.id = object.id.toLowerCase();
      this.longName = object.longName;
      this.description = object.description;
      this.type = object.type;
      this.emailPrefix = object.emailPrefix;
      this.color = fieldHelpers.addPrefixTo('#', object.color);
      this.organizers = misc.toArray(object.organizers);
      this.mapX = object.mapX;
      this.mapY = object.mapY;
      this.shortName = object.shortName;
    } else {
      this.color = '#FF00FF';
    }
  }

  // functions related to one group
  descriptionHTML() {
    return Renderer.render(this.description, this.id);
  }

  descriptionHTMLFiltered(tagToFilter) {
    const matchTag = new RegExp('(' + '<' + tagToFilter + '[^>]*>[^>]*/' + tagToFilter + '>' + '|' + '<' + tagToFilter + '[^/]*/>' + '|' + '<' + tagToFilter + '[^>]*>' + ')', 'g');
    return this.descriptionHTML().replace(matchTag, '');
  }

  checkedOrganizers(members) {
    return members.map(member => {return {member: member, checked: this.isOrganizer(member.id())}; });
  }

  mapYrelative() {
    return 100 * this.mapY / 441;
  }

  mapXrelative() {
    return 100 * this.mapX / 342;
  }

  isOrganizer(memberId) {
    return !!this.organizers && this.organizers.indexOf(memberId) > -1;
  }

  // Helper functions (static) -> look for a better place to implement
  static regionalsFrom(groups) {
    return groups.filter(group => group.type === regionalgruppe);
  }

  static thematicsFrom(groups) {
    return groups.filter(group => group.type === themengruppe);
  }

  static allTypes() {
    return [ themengruppe, regionalgruppe ];
  }

  static organizersOnlyInOneOf(groupA, groupB) {
    return R.symmetricDifference(!groupA ? [] : groupA.organizers, !groupB ? [] : groupB.organizers);
  }
}

module.exports = Group;
