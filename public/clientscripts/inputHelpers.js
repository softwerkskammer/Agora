/* global document */
"use strict";
function fillUrlFromText(urlId, textId) {
  var titleInput = document.getElementById(textId);
  var title = titleInput.value;
  var urlContent = encodeURIComponent(title.replace(/^\s\s*/, '').replace(/\s\s*$/, '').replace(/[ #,!?ßöäü:"']/gi, '_'));
  var urlInput = document.getElementById(urlId);
  urlInput.value = urlContent;
  urlInput.focus();
}
