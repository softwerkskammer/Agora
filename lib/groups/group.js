"use strict";
var _ = require('underscore');
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
    this.color = object.color;
    this.organizers = misc.toArray(object.organizers);
    this.mapX = object.mapX;
    this.mapY = object.mapY;
    this.shortName = object.shortName;
  }
}

Group.regionalsFrom = function (groups) {
  return _.where(groups, {type: regionalgruppe});
};

Group.thematicsFrom = function (groups) {
  return _.where(groups, {type: themengruppe});
};

Group.allTypes = function () {
  return [ themengruppe, regionalgruppe ];
};

Group.prototype.descriptionHTML = function () {
  return Renderer.render(this.description, this.id);
};

Group.prototype.descriptionHTMLFiltered = function (tagToFilter) {
  var matchTag = new RegExp('(' + '<' + tagToFilter + '[^>]*>[^>]*/' + tagToFilter + '>' + '|' + '<' + tagToFilter + '[^/]*/>' + '|' + '<' + tagToFilter + '[^>]*>' + ')', 'g');

  return this.descriptionHTML().replace(matchTag, '');
};

Group.prototype.checkedOrganizers = function (members) {
  var self = this;
  var membersThatAreAdmins = _.filter(members, function (member) {return member.isAdmin; });
  return _.map(membersThatAreAdmins, function (member) {return {member: member, checked: _.contains(self.organizers, member.id)}; });
};

Group.prototype.mapYrelative = function () {
  return 100 * this.mapY / 441;
};

Group.prototype.mapXrelative = function () {
  return 100 * this.mapX / 342;
};

module.exports = Group;
