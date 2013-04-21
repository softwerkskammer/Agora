"use strict";

function Group(object) {
  if (object) {
    this.id = object.id;
    this.longName = object.longName;
    this.description = object.description;
    this.type = object.type;
    this.mailPrefix = object.mailPrefix;
  }
}

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
