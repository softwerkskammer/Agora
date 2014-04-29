(function () {
  "use strict";

  document.body.innerHTML += '\
<form id="announcementform" action="/announcements/submit" method="post">\
  <input id="title" type="text" name="title"/>\
  <input id="url" type="text" name="url"/>\
  <input id="thruDate" type="text" name="thruDate"/>\
  <textarea id="message" type="text" name="message"></textarea>\
</form>';

}());
