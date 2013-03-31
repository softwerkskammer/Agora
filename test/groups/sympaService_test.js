/*global describe, it */
"use strict";
var should = require('chai').should();

var sympaService = require('../../lib/groups/sympaService')();

describe('SympaService ', function () {
  it('should return true when addings a user successfully', function (done) {

    sympaService.addUserToList("myUser", "myList", function (err, result) {

      should.equal(result, true);
      done();
    });


  });

  it('should return true when removing a user successfully', function (done) {

    sympaService.removeUserFromList("myUser", "myList", function (err, result) {

      should.equal(result, true);
      done();
    });


  });
});