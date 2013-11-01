/* global $, document */
"use strict";


function init_resource_buttons() {

  function add_resource() {
    var resource_row = $($('#resource-template').text().trim());
    $(this).closest('.form-group').before(resource_row);
    resource_row.find('input').first().focus();
  }


  function delete_resource() {
      $(this).closest('.form-group').remove();
  }


  $('#resources .add').on('click', add_resource);
  $('#resources').on('click', '.delete', delete_resource);
}


$(document).ready(init_resource_buttons);
