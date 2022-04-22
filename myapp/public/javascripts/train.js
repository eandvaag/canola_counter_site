function disable_training_submit() {

    let buttons = ["#train_button"];

    for (button of buttons) {
        $(button).prop('disabled', true);
        $(button).removeClass("std-button-hover");
        $(button).css("opacity", 0.5);
        $(button).css("cursor", "default");
    }

    $("#train_button_text").css("cursor", "default");
}

function enable_training_submit() {

    let buttons = ["#train_button"];

    for (button of buttons) {
        $(button).prop('disabled', false);
        $(button).addClass("std-button-hover");
        $(button).css("opacity", 1);
        $(button).css("cursor", "pointer");
    }
    $("#train_button_text").css("cursor", "pointer");
}

function training_form_is_complete() {
    // currently disabled
    return false;
    /*
    let inputs_to_check = ["job_name_input"];
    for (input of inputs_to_check) {
        let input_length = ($("#" + input).val()).length;
        if ((input_length < 3) || (input_length > 20)) {
            return false;
        }
    }
    return true;
    */
}

function update_training_submit() {
    if (training_form_is_complete()) {
        enable_training_submit();
    }
    else {
        disable_training_submit();
    }
}


function submit_training_request() {

    let job_name = $("#job_name_input").val();
    $("#job_name_input").val('');
    disable_training_submit();

    console.log("submitting training request");
    $.post($(location).attr('href'),
    {
        action: "submit_training_request",
        farm_name: $("#farm_combo").val(),
        field_name: $("#field_combo").val(),
        mission_date: $("#mission_combo").val(),
        job_name: job_name,
    },
    function(response, status) {
        if (response.error) { 
            $("#modal_header_text").html("Error");
            $("#modal_message").html("An error occurred:<br><br>" +
                                     response.message);
            $("#result_modal").css("display", "block");
        }
        else {
            $("#modal_header_text").html("Success!");
            $("#modal_message").html("The training job has been successfully started.");
            $("#result_modal").css("display", "block");
        }
    });
}

function manage_jobs_request() {
    $.post($(location).attr('href'),
    {
        action: "manage_jobs_request",
    }, 
    function(response, status) {
        if (response.error) { 
            console.log("error occurred");
            console.log(response.message);
        }
        else {
            window.location.href = response.redirect;
        }
    });    
}

function show_train() {

    console.log("showing train");

    let left_col_width = "100px";
    let right_col_width = "220px";

    $("#tab_details").empty();

    $("#tab_details").append(`<table class="transparent_table" style="height: 500px" id="train_table"></table>`);

    $("#train_table").append(`<tr>`+
    `<th style="width: 750px;"><div id="manage_section"></th>` +
    `<th style="width: 750px;"><div id="train_section"></div></th>` +
    `<tr>`);

    $("#manage_section").append(
        `<button class="std-button std-button-hover" style="width: 220px; height: 50px;" onclick="manage_jobs_request()">`+
            `<span><i class="fa-solid fa-bars-progress" style="margin-right:8px"></i> Manage Jobs</span></button>`);

    $("#train_section").append(`<form id="train_form" action=""></form>`)

    $("#train_form").append(`<table class="transparent_table" id="settings_table"></table>`);
    $("#settings_table").append(`<tr>` +
        `<th><div class="table_head" style="width: ${left_col_width};">Job Name:</div></th>` +
        `<th><div style="width: ${right_col_width};"><input id="job_name_input" class="nonfixed_input"></div></th>` +
    `<tr>`);



    $("#train_form").append(`<br><br>`);
    $("#train_form").append(`<button id="train_button" class="std-button std-button-hover" `+
                             `style="width: 200px; height: 50px;"><span id="train_button_text"><i class="fa-solid fa-play" style="margin-right:3px"></i> Train</span></button>`);


    disable_training_submit();
    $("#train_button").click(function(e) {
        e.preventDefault();
        // currently disabled
        /* submit_training_request() */
    });

    $("#job_name_input").on("input", function(e) {
        update_training_submit();
    });

    $("#train_form").change(function() {
        console.log("updating submit");
        update_training_submit();
    });
}
