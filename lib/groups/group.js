"use strict";
var _ = require('lodash');
var _s = require('underscore.string');
var beans = require('nconf').get('beans');
var misc = beans.get('misc');
var Renderer = beans.get('renderer');

var themengruppe = 'Themengruppe';
var regionalgruppe = 'Regionalgruppe';

function Group(object) {
  if (object) {
    this.id = object.id.toLowerCase();
    this.longName = object.longName;
    this.description = object.description;
    this.type = object.type;
    this.emailPrefix = object.emailPrefix;
    this.color = _s.startsWith(object.color, '#') ? object.color : '#' + object.color;
    this.organizers = misc.toArray(object.organizers);
    this.mapX = object.mapX;
    this.mapY = object.mapY;
    this.shortName = object.shortName;
  }
}

// Helper functions (static) -> look for a better place to implement

Group.regionalsFrom = function (groups) {
  return _.where(groups, {type: regionalgruppe});
};

Group.thematicsFrom = function (groups) {
  return _.where(groups, {type: themengruppe});
};

Group.allTypes = function () {
  return [ themengruppe, regionalgruppe ];
};

Group.organizersOnlyInOneOf = function (groupA, groupB) {
  return _.xor(groupA.organizers, !groupB ? [] : groupB.organizers);
};

// functions related to one group

Group.prototype.descriptionHTML = function () {
  return Renderer.render(this.description, this.id);
};

Group.prototype.descriptionHTMLFiltered = function (tagToFilter) {
  var matchTag = new RegExp('(' + '<' + tagToFilter + '[^>]*>[^>]*/' + tagToFilter + '>' + '|' + '<' + tagToFilter + '[^/]*/>' + '|' + '<' + tagToFilter + '[^>]*>' + ')', 'g');

  return this.descriptionHTML().replace(matchTag, '');
};

Group.prototype.checkedOrganizers = function (members) {
  var self = this;
  return _.map(members, function (member) {return {member: member, checked: _.contains(self.organizers, member.id())}; });
};

Group.prototype.mapYrelative = function () {
  return 100 * this.mapY / 441;
};

Group.prototype.mapXrelative = function () {
  return 100 * this.mapX / 342;
};

Group.prototype.isOrganizer = function (memberId) {
  return !!this.organizers && this.organizers.indexOf(memberId) > -1;
};

module.exports = Group;
