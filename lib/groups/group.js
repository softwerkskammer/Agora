"use strict";

function Group(name, longName, description, type) {
  this.name = name;
  this.longName = longName;
  this.description = description;
  this.type = type;
}

Group.prototype.fromObject = function (object) {
  this.name = object.name;
  this.longName = object.longName;
  this.description = object.description;
  this.type = object.type;
  return this;
};

Group.prototype.isValid = function () {
  return this.name !== undefined;
};

module.exports = Group;
