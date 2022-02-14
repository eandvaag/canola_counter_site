
$(document).ready(function(){

    $("#error_message").hide();

    $('form').submit(function(e) {
        e.preventDefault();

        $.post($(location).attr('href'),
        {
            username: $("#username").val(),
            password: $("#password").val()
        },
        
        function(response, status) {

            if (response.error) {
                $("#error_message").html("Sorry, an error occurred during the sign-in.");
                $("#error_message").show();
            }
            else if (response.not_found) {
                $("#error_message").html("Your username/password combination is incorrect.");
                $("#error_message").show();
            }
            else {
                window.location.href = response.redirect;
            }
        });
    });
});