$(document).ready(function () {

  if ($.mockjax) {
    // mocking the ajax request
    $.mockjax({
      url: "/members/checknickname",
      response: function (formdata) {
        var nick = formdata.data.nickname.trim(),
          nicknames = ["Nick", "Nack"];
        this.responseText = "true";
        if ($.inArray(nick, nicknames) !== -1) {
          this.responseText = "false";
        }
      },
      responseTime: 50
    });
  }
// validate signup form on keyup and submit
  var validator = $("#memberform").validate({
    rules: {
      nickname: {
        required: true,
        minlength: 2,
        remote: "/members/checknickname"
      },
      firstname: "required",
      lastname: "required",
      email: {
        required: true,
        email: true
      },
      location: "required",
      reference: "required",
      profession: "required"
    },
    messages: {
      nickname: {
        remote: jQuery.validator.format("Dieser Nickname ist leider nicht verfügbar.")
      }
    },
    errorPlacement: function (error, element) {
      error.appendTo(element.parent());
    },
    submitHandler: function () {
      alert("submitted!");
    },
    // set this class to error-labels to indicate valid fields
    success: function (label) {
      // set &nbsp; as text for IE
      label.html("&nbsp;").addClass("checked");
    },
    // and remove it again in case of error
    highlight: function (element, errorClass) {
      $(element).parent().find("." + errorClass).removeClass("checked");
    }
  });

  validator.form();

  ['#nickname', '#lastname', '#firstname', "#email", "#profession", "#location", "#reference"].forEach(function (each) {
    $(each).keyup(function () {
      validator.element(each);
    });
  })

})
;