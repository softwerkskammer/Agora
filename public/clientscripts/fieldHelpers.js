"use strict";
function urlFromText(urlId, titleId) {
  var titleInput = document.getElementById(titleId);
  var title = titleInput.value;
  var urlContent = encodeURIComponent(title.replace(/^\s\s*/, '').replace(/\s\s*$/, '').replace(/[ #,!?ßöäü:"']/gi, '_'));
  var urlInput = document.getElementById(urlId);
  urlInput.value = urlContent;
  window.setTimeout(function () { urlInput.focus(); }, 0);
}
