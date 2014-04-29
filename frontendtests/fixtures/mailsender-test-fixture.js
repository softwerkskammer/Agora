(function () {
  "use strict";

  document.body.innerHTML += '\
<form id="mailform" action="/mailsender/send" method="post">\
  <input id="subject" type="text" name="subject"/>\
  <textarea id="markdown" type="text" name="markdown"></textarea>\
</form>';

}());
