/* global $, document, window */
"use strict";

var highlightCurrentSection = function () {
  var loc = window.location.href; // returns the full URL
  $('li').filter(function () {
    return new RegExp(this.id).test(loc);
  }).addClass('active');
};
$(document).ready(highlightCurrentSection);

