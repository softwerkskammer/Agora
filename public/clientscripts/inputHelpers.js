/* global document, $ */
"use strict";
function fillUrlFromText(urlId, textId) {
  var title = document.getElementById(textId).value;
  var urlContent = encodeURIComponent(title.replace(/^\s\s*/, '').replace(/\s\s*$/, '').replace(/[ #,!?ßöäü:"']/gi, '_'));
  var urlInput = $('#' + urlId);
  urlInput.val(urlContent);
  urlInput.change();
  urlInput.focus();
}
