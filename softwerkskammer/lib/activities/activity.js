"use strict";
const { DateTime } = require("luxon");

const conf = require("simple-configure");
const Resources = require("./resources");
const fieldHelpers = require("../commons/fieldHelpers");
const Renderer = require("../commons/renderer");

const standardName = "Veranstaltung";

class Activity {
  /* eslint no-underscore-dangle: 0 */
  constructor(object) {
    this.state = object ? object : {};

    if (!this.state.resources) {
      this.state.resources = {};
      this.state.resources[standardName] = { _registeredMembers: [], _registrationOpen: true };
    }

    if (!this.state.startDate) {
      this.state.startDate = new Date();
    } else if (typeof this.state.startDate === "string") {
      this.state.startDate = new Date(this.state.startDate);
    }
    if (!this.state.endDate) {
      this.state.endDate = new Date();
    } else if (typeof this.state.endDate === "string") {
      this.state.endDate = new Date(this.state.endDate);
    }
  }

  id() {
    return this.state.id;
  }

  version() {
    return this.state.version;
  }

  url() {
    return this.state.url ? this.state.url.trim() : undefined;
  }

  fullyQualifiedUrl() {
    return this.url() ? conf.get("publicUrlPrefix") + "/activities/" + encodeURIComponent(this.url()) : undefined;
  }

  title() {
    return this.state.title;
  }

  description() {
    return this.state.description;
  }

  location() {
    return this.state.location;
  }

  direction() {
    return this.state.direction;
  }

  assignedGroup() {
    return this.state.assignedGroup;
  }

  owner() {
    return this.state.owner;
  }

  editorIds() {
    return this.state.editorIds || [];
  }

  clonedFromMeetup() {
    return !!this.state.clonedFromMeetup;
  }

  meetupRSVPCount() {
    return this.state.meetupRSVPCount || 0;
  }

  fillFromUI(object, editorIds) {
    this.state.version = object.version ? parseInt(object.version, 10) : this.state.version;
    this.state.url = object.url;

    this.state.editorIds = editorIds;

    this.state.title = object.title;
    this.state.description = object.description;
    this.state.assignedGroup = object.assignedGroup;
    this.state.location = object.location;
    this.state.direction = object.direction;
    // currently we only support MEZ/MESZ for events
    const startDateTime = fieldHelpers.parseToDateTimeUsingDefaultTimezone(object.startDate, object.startTime);
    this.state.startDate = startDateTime && startDateTime.toJSDate();
    const endDateTime = fieldHelpers.parseToDateTimeUsingDefaultTimezone(object.endDate, object.endTime);
    this.state.endDate = endDateTime && endDateTime.toJSDate();

    this.state.clonedFromMeetup = object.clonedFromMeetup;
    this.state.meetupRSVPCount = object.meetupRSVPCount;

    if (!this.id() || this.id() === "undefined") {
      this.state.id = fieldHelpers.createLinkFrom([
        this.assignedGroup(),
        this.title(),
        this.startDateTime().toFormat("dd.MM.yyyy HH:mm:ss"),
      ]);
    }

    // these are the resource definitions in the edit page:
    if (object.resources) {
      this.resources().fillFromUI(object.resources);
    }

    this.state.isSoCraTes = object.isSoCraTes;

    return this;
  }

  resetForClone() {
    let result = new Activity();
    result.state.editorIds = this.editorIds();
    result.state.title = this.title();
    result.state.description = this.description();
    result.state.assignedGroup = this.assignedGroup();
    result.state.location = this.location();
    result.state.direction = this.direction();
    result.state.startDate = this.state.startDate;
    result.state.endDate = this.state.endDate;

    result.state.resources = {};
    result.resources().copyFrom(this.resources());
    return result;
  }

  isSoCraTes() {
    return this.state.isSoCraTes;
  }

  descriptionHTML() {
    return Renderer.render(this.description(), this.assignedGroup());
  }

  descriptionPlain() {
    return this.descriptionHTML().replace(/<(?:\S|\s)*?>/gm, "");
  }

  hasDirection() {
    return fieldHelpers.isFilled(this.direction());
  }

  directionHTML() {
    return Renderer.render(this.direction(), this.assignedGroup());
  }

  groupName() {
    return this.group ? this.group.longName : "";
  }

  groupFrom(groups) {
    this.group = groups.find((group) => group.id === this.assignedGroup());
  }

  blogEntryUrl() {
    const dateString = this.startDateTime().toFormat("yyyy-MM-dd");
    return `${this.assignedGroup()}/blog_${dateString}_${Renderer.normalize(this.title())}`;
  }

  // Resources

  resources() {
    return new Resources(this.state.resources);
  }

  veranstaltung() {
    return this.resources().veranstaltung();
  }

  resourceNamed() {
    return this.veranstaltung();
  }

  resourceNames() {
    return [standardName];
  }

  addMemberId(memberId, millisOfRegistration) {
    return this.resources().veranstaltung().addMemberId(memberId, millisOfRegistration);
  }

  removeMemberId(memberId) {
    this.resources().veranstaltung().removeMemberId(memberId);
  }

  allRegisteredMembers() {
    return this.resources().allRegisteredMembers();
  }

  isAlreadyRegistered(memberID) {
    return this.allRegisteredMembers().indexOf(memberID) > -1;
  }

  // Waitinglist stuff
  isAlreadyOnWaitinglist(memberID) {
    return this.allWaitinglistEntries().find((entry) => entry.registrantId() === memberID);
  }

  allWaitinglistEntries() {
    return this.resources().allWaitinglistEntries();
  }

  addToWaitinglist(memberId, millisOfRegistration) {
    this.resources().veranstaltung().addToWaitinglist(memberId, millisOfRegistration);
  }

  removeFromWaitinglist(memberId) {
    this.resources().veranstaltung().removeFromWaitinglist(memberId);
  }

  waitinglistEntryFor(memberId) {
    return this.resources().veranstaltung().waitinglistEntryFor(memberId);
  }

  hasWaitinglist() {
    return this.resources().veranstaltung().hasWaitinglist();
  }

  // Display Dates and Times

  isMultiDay() {
    return this.endDateTime().ordinal !== this.startDateTime().ordinal;
  }

  startDateTime() {
    return DateTime.fromJSDate(this.state.startDate).setZone(fieldHelpers.defaultTimezone());
  }

  endDateTime() {
    return DateTime.fromJSDate(this.state.endDate).setZone(fieldHelpers.defaultTimezone());
  }

  month() {
    return this.startDateTime().month;
  }

  year() {
    return this.startDateTime().year;
  }

  colorFrom(groupsColors) {
    return groupsColors && groupsColors[this.assignedGroup()] ? groupsColors[this.assignedGroup()] : "#353535";
  }
}

module.exports = Activity;
