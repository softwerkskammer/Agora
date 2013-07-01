"use strict";
var markdown = require('markdown').markdown;
var _ = require('underscore');
var conf = require('nconf');
var misc = conf.get('beans').get('misc');

function Group(object) {
  if (object) {
    this.id = object.id.toLowerCase();
    this.longName = object.longName;
    this.description = object.description;
    this.type = object.type;
    this.emailPrefix = object.emailPrefix;
    this.color = object.color;
    this.organizers = misc.toArray(object.organizers);
  }
}

Group.regionalsFrom = function (groups) {
  return groups.filter(function (group) { return group.type === Group.allTypes()[1]; });
};

Group.thematicsFrom = function (groups) {
  return groups.filter(function (group) { return group.type === Group.allTypes()[0]; });
};

Group.prototype.descriptionHTML = function () {
  return markdown.toHTML(this.description.replace(/\r/g, ''));
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

module.exports = Group;
