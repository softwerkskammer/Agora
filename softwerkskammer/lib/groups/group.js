"use strict";
const R = require("ramda");
const misc = require("../commons/misc");
const Renderer = require("../commons/renderer");

const themengruppe = "Themengruppe";
const regionalgruppe = "Regionalgruppe";

/**
 * Max latitude of Germany.
 *
 * according to: https://de.wikipedia.org/wiki/Liste_der_Extrempunkte_Deutschlands
 */
const MAP_COORDINATES_NORTH = 55.05864;
/**
 * Max longitude of Austria.
 *
 * according to: https://de.wikipedia.org/wiki/Geographie_%C3%96sterreichs#Grenzen,_Entfernungen,_Extrempunkte
 */
const MAP_COORDINATES_EAST = 17.160749;
/**
 * Min latitude of Swiss.
 *
 * according to: https://de.wikipedia.org/wiki/Geographische_Extrempunkte_der_Schweiz
 */
const MAP_COORDINATES_SOUTH = 45.81792;
/**
 * Min longitude of Germany.
 *
 * according to: https://de.wikipedia.org/wiki/Liste_der_Extrempunkte_Deutschlands
 */
const MAP_COORDINATES_WEST = 5.866944;
/**
 * Difference of the longitudes of the map.
 */
const MAP_COORDINATES_WIDTH = MAP_COORDINATES_EAST - MAP_COORDINATES_WEST;
/**
 * Difference of the latitudes of the map.
 */
const MAP_COORDINATES_HEIGHT = MAP_COORDINATES_NORTH - MAP_COORDINATES_SOUTH;

class Group {
  constructor(object) {
    if (object) {
      this.id = object.id.toLowerCase();
      this.longName = object.longName;
      this.description = object.description;
      this.type = object.type;
      this.emailPrefix = object.emailPrefix;
      this.meetupURL = object.meetupURL;
      this.color = object.color;
      this.organizers = misc.toArray(object.organizers);
      this.mapX = object.mapX;
      this.mapY = object.mapY;
      this.shortName = object.shortName;
      this.contactingOrganizersEnabled = !!object.contactingOrganizersEnabled;
      this.subscribedMembers = object.subscribedMembers || [];
    } else {
      this.color = "#FF00FF";
    }
  }

  // functions related to one group
  descriptionHTML() {
    return Renderer.render(this.description, this.id);
  }

  descriptionHTMLFiltered(tagToFilter) {
    const matchTag = new RegExp(
      "(" +
        "<" +
        tagToFilter +
        "[^>]*>[^>]*/" +
        tagToFilter +
        ">" +
        "|" +
        "<" +
        tagToFilter +
        "[^/]*/>" +
        "|" +
        "<" +
        tagToFilter +
        "[^>]*>" +
        ")",
      "g",
    );
    return this.descriptionHTML().replace(matchTag, "");
  }

  checkedOrganizers(members) {
    return members.map((member) => {
      return { member, checked: this.isOrganizer(member.id()) };
    });
  }

  membersThatAreOrganizers(members) {
    return members.filter((member) => this.isOrganizer(member.id()));
  }

  mapYrelative() {
    let mapY = parseFloat(this.mapY);
    mapY = mapY - MAP_COORDINATES_SOUTH;
    // swap the origin of the coordinate system:
    mapY = MAP_COORDINATES_HEIGHT - mapY;
    return (100 * mapY) / MAP_COORDINATES_HEIGHT;
  }

  mapXrelative() {
    let mapX = parseFloat(this.mapX);
    mapX = mapX - MAP_COORDINATES_WEST;
    return (100 * mapX) / MAP_COORDINATES_WIDTH;
  }

  isOrganizer(memberId) {
    return !!this.organizers && this.organizers.indexOf(memberId) > -1;
  }

  displaynameInSubscriptionList() {
    return this.longName + " [" + this.emailPrefix + "] - " + this.id;
  }

  meetupUrlName() {
    if (this.meetupURL) {
      const strippedURL = misc.stripTrailingSlash(this.meetupURL);
      return strippedURL.substr(strippedURL.lastIndexOf("/") + 1);
    } else {
      return null;
    }
  }

  canTheOrganizersBeContacted() {
    return !!this.contactingOrganizersEnabled && this.hasOrganizers();
  }

  hasOrganizers() {
    return !R.isEmpty(this.organizers);
  }

  subscribe(member) {
    this.subscribedMembers.push(member.id());
    this.subscribedMembers = R.uniq(this.subscribedMembers);
  }

  unsubscribe(member) {
    this.subscribedMembers = R.without([member.id()], this.subscribedMembers);
  }

  isMemberSubscribed(member) {
    return this.subscribedMembers.includes(member.id());
  }

  membercount() {
    return this.subscribedMembers.length;
  }

  // Helper functions (static) -> look for a better place to implement
  static regionalsFrom(groups) {
    return groups.filter((group) => group.type === regionalgruppe);
  }

  static thematicsFrom(groups) {
    return groups.filter((group) => group.type === themengruppe);
  }

  static allTypes() {
    return [themengruppe, regionalgruppe];
  }

  static organizersOnlyInOneOf(groupA, groupB) {
    return R.symmetricDifference(!groupA ? [] : groupA.organizers, !groupB ? [] : groupB.organizers);
  }
}

module.exports = Group;
