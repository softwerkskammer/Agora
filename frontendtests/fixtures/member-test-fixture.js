(function () {
  "use strict";

  document.body.innerHTML += '\
<form id="memberform" action="submit" method="post">\
  <input id="nickname" type="text" name="nickname">\
  <input id="firstname" type="text" name="firstname">\
  <input id="lastname" type="text" name="lastname">\
  <input id="email" type="text" name="email">\
  <input id="twitter" type="text" name="twitter">\
  <input id="location" type="text" name="location">\
  <input id="profession" type="text" name="profession">\
  <input id="interests" type="text" name="interests">\
  <input id="site" type="text" name="site">\
  <input id="reference" type="text" name="reference">\
</form>';

}());
