"use strict";

function Group(name, longName, description, type) {
  this.id = name;
  this.longName = longName;
  this.description = description;
  this.type = type;
}

Group.prototype.fromObject = function (object) {
  this.id = object.id;
  this.longName = object.longName;
  this.description = object.description;
  this.type = object.type;
  return this;
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
