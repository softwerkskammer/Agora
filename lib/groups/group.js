"use strict";
var markdown = require('markdown').markdown;

function Group(object) {
  if (object) {
    this.id = object.id;
    this.longName = object.longName;
    this.description = object.description;
    this.type = object.type;
    this.emailPrefix = object.emailPrefix;
    this.color = object.color;
  }
}

Group.prototype.descriptionHTML = function () {
  return markdown.toHTML(this.description.replace(/\r/g, ''));
};

Group.prototype.isValid = function () {
  return !!this.id;
};

Group.prototype.allTypes = function () {
  return ['Themengruppe', 'Regionalgruppe'];
};

Group.prototype.typeCode = function () {
  return this.allTypes().indexOf(this.type);
};

module.exports = Group;
