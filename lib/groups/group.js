"use strict";
var markdown = require('markdown').markdown;

function Group(object) {
  if (object) {
    this.id = object.id.toLowerCase();
    this.longName = object.longName;
    this.description = object.description;
    this.type = object.type;
    this.emailPrefix = object.emailPrefix;
    this.color = object.color;
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

Group.allTypes = function () {
  return ['Themengruppe', 'Regionalgruppe'];
};

Group.prototype.typeCode = function () {
  return Group.allTypes().indexOf(this.type);
};

module.exports = Group;
