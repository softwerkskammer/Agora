(function () {
  "use strict";

  document.body.innerHTML += '\
<form id="groupform" action="submit" method="post">\
  <input id="id" type="text" name="id"/>\
  <input id="longName" type="text" name="longName"/>\
  <input id="description" type="text" name="description"/>\
  <input id="emailPrefix" type="text" name="emailPrefix"/>\
  <input id="type" type="text" name="type"/>\
</form>';

}());
