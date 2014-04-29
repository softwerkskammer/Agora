/*jslint es5: true */
(function () {
  "use strict";

  document.body.innerHTML += '\
<form id="activityform" action="submit" method="post">\
  <input id="title" type="text" name="title">\
  <input id="location" type="text" name="location">\
  <input id="startDate" class="datepicker" type="text" name="startDate">\
  <input id="startTime" class="timepicker" type="text" name="startTime">\
  <input id="endDate" class="datepicker" type="text" name="endDate">\
  <input id="endTime" class="timepicker" type="text" name="endTime">\
  <input id="assignedGroup" type="text" name="assignedGroup">\
  <input id="description" type="text" name="description">\
  <input id="direction" type="text" name="direction">\
</form>';

}());
