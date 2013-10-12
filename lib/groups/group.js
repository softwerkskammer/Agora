"use strict";
var _ = require('underscore');
var beans = require('nconf').get('beans');
var misc = beans.get('misc');
var Renderer = beans.get('renderer');

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
  return groups.filter(function (group) { return group.type === Group.allTypes()[1]; });
};

Group.thematicsFrom = function (groups) {
  return groups.filter(function (group) { return group.type === Group.allTypes()[0]; });
};

Group.prototype.descriptionHTML = function () {
  return Renderer.render(this.description, this.id);
};

Group.prototype.descriptionHTMLFiltered = function (tagToFilter) {
  var matchTag = new RegExp('(' + '<' + tagToFilter + '[^>]*>[^>]*/' + tagToFilter + '>' + '|' + '<' + tagToFilter + '[^/]*/>' + '|' +  '<' + tagToFilter + '[^>]*>' + ')', 'g');

  return this.descriptionHTML().replace(matchTag, '');
};


Group.prototype.isValid = function () {
  return !!this.id;
};

Group.prototype.checkedOrganizers = function (members) {
  var self = this;
  var membersThatAreAdmins = _.filter(members, function (member) {return member.isAdmin; });
  return _.map(membersThatAreAdmins, function (member) {return {member: member, checked: _.contains(self.organizers, member.id)}; });
};

Group.allTypes = function () {
  return ['Themengruppe', 'Regionalgruppe'];
};

Group.prototype.typeCode = function () {
  return Group.allTypes().indexOf(this.type);
};

Group.prototype.mapYrelative = function () {
  return 100 * this.mapY / 441;
};

Group.prototype.mapXrelative = function () {
  return 100 * this.mapX / 342;
};

module.exports = Group;
