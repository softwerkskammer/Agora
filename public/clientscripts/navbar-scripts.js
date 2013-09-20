/* global $, document, window */
"use strict";

var highlightCurrentSection = function () {
  var loc = window.location.href; // returns the full URL
  $('li').filter(function () {
    return this.id && new RegExp(this.id).test(loc);
  }).first().addClass('active');
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
                  name: "cmdHelp",
                  title: "Help",
                  icon: "icon icon-question-sign",
                  callback: function () { $("#cheatsheet").modal(); }
                }
              ]
            }
          ]
        ],
        onPreview: function (e) {
          $.post("/wiki/preview",
            {data: e.getContent(), subdir: ($("#subdir").val() || $("#assignedGroup").val() || $('#id').val())},
            function (data) { $(".md-preview").html(data); }
          );
        }
      }
    );
  });
};
$(document).ready(highlightCurrentSection);
$(document).ready(addHelpButtonToTextarea);

