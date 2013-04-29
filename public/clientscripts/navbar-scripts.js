/* global $, document, window */
"use strict";

var highlightCurrentSection = function () {
  var loc = window.location.href; // returns the full URL
  $('li').filter(function () {
    return this.id && new RegExp(this.id).test(loc);
  }).addClass('active');
};

var addHelpButtonToTextarea = function () {
  $('textarea').each(function () {
    $(this).markdown({
      additionalButtons: [
        [
          {
            name: "groupCustom",
            data: [
              {
                name: "cmdBeer",
                title: "Help",
                icon: "icon icon-question-sign",
                callback: function (e) {
                  window.open("http://daringfireball.net/projects/markdown/syntax", "_blank");
                }
              }
            ]
          }
        ]
      ]
    });
  });
};
$(document).ready(highlightCurrentSection);
$(document).ready(addHelpButtonToTextarea);

