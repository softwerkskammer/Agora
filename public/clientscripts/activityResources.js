/* global $, document */
"use strict";


function init_resource_buttons() {

  function add_resource() {
    var resource_row = $($('#resource-template').text().trim());
    $(this).closest('.form-group').before(resource_row);
    resource_row.find('input').first().focus();
  }


  $('#resources .add').on('click', add_resource);
}


$(document).ready(init_resource_buttons);
