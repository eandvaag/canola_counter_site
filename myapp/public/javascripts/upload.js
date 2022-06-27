
let dropzone_handler;
let num_sent = 0;
let queued_filenames;
let errors = [];
let format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;

function clear_form() {
    $("#farm_input").val("");
    $("#field_input").val("");
    $("#mission_input").val("");
    $("#flight_height_input").val("");
    dropzone_handler.removeAllFiles();
}

function close_modal() {
    $("#modal_header_text").val("");
    $("#modal_message").val("");
    $("#result_modal").css("display", "none");
}

function disable_input() {

    global_disabled = true;

    let buttons = ["upload_button"];

    for (button of buttons) {
        $("#" + button).prop('disabled', true);
        $("#" + button).removeClass("std-button-hover");
        $("#" + button).css("opacity", 0.5);
        $("#" + button).css("cursor", "default");
    }


    let inputs = ["farm_input", "field_input", "mission_input", "flight_height_input"];

    for (input of inputs) {
        $("#" + input).prop("disabled", true);
        $("#" + input).css("opacity", 0.5);
    }

    $(".nav").css("pointer-events", "none");
    $(".nav").css("opacity", 0.5);

    $("#file-drop").addClass("disabled_dropzone");
    $("#file-drop").css("opacity", 0.7);
}

function disable_submit() {

    global_disabled = false;

    let buttons = ["upload_button"];

    for (button of buttons) {
        $("#" + button).prop('disabled', true);
        $("#" + button).removeClass("std-button-hover");
        $("#" + button).css("opacity", 0.5);
        $("#" + button).css("cursor", "default");
    }
}



function enable_input() {

    let buttons = ["upload_button"];

    for (button of buttons) {
        $("#" + button).prop('disabled', false);
        $("#" + button).addClass("std-button-hover");
        $("#" + button).css("opacity", 1);
        $("#" + button).css("cursor", "pointer");
    }

    let inputs = ["farm_input", "field_input", "mission_input", "flight_height_input"];

    for (input of inputs) {
        $("#" + input).prop("disabled", false);
        $("#" + input).css("opacity", 1.0);
    }

    $(".nav").css("pointer-events", "all");
    $(".nav").css("opacity", 1.0);


    $("#file-drop").removeClass("disabled_dropzone");
    $("#file-drop").css("opacity", 1.0);

}


function enable_submit() {

    let buttons = ["upload_button"];

    for (button of buttons) {
        $("#" + button).prop('disabled', false);
        $("#" + button).addClass("std-button-hover");
        $("#" + button).css("opacity", 1);
        $("#" + button).css("cursor", "pointer");
    }
}

function form_is_complete() {
    let inputs_to_check = ["farm_input", "field_input", "mission_input"];
    for (input of inputs_to_check) {
        let input_length = ($("#" + input).val()).length;
        if ((input_length < 3) || (input_length > 20)) {
            return false;
        }
    }
    
    let flight_height = $("#flight_height_input").val();
    if (flight_height !== "") {
        if (!isNumeric(flight_height)) {
            return false;
        }
        flight_height = parseFloat(flight_height);
        if (flight_height < 0.1 || flight_height > 100) {
            return false;
        }
    }
    if (dropzone_handler.files.length == 0) {
        return false;
    }
    return true;
}

function update_submit() {
    if (form_is_complete()) {
        enable_submit();
    }
    else {
        disable_submit();
    }
}


function initialize_upload() {

    disable_submit();

    dropzone_handler = new Dropzone("#file-drop", { 
        url: "/plant_detection/upload",
        autoProcessQueue: false,
        paramName: function(n) { return 'source_file[]'; },
        uploadMultiple: true,
        farm_name: '',
        field_name: '',
        mission_date: '',
        parallelUploads: 10,
        maxUploads: 10000
    });

    dropzone_handler.on("processing", function() {
        console.log("started processing");
        dropzone_handler.options.autoProcessQueue = true;
    });

    dropzone_handler.on("queuecomplete", function(files, response) {
        num_sent = 0;
        dropzone_handler.options.autoProcessQueue = false;

        if (dropzone_handler.getAcceptedFiles().length > 0) {
            console.log("An error occurred");
            $("#modal_header_text").html("Error");
            $("#modal_message").html("An error occurred during the upload process:<br>" + errors[0]);
            $("#result_modal").css("display", "block");
            errors = [];

            clear_form();
            enable_input();
            disable_submit();
            $("#upload_loader").hide();
        }

    });
    dropzone_handler.on("success", function(file, response) {    
        console.log("complete!");
        console.log("response", response);
        console.log("response.message", response.message);
        console.log("file", file);
        dropzone_handler.removeFile(file);
        if (dropzone_handler.getAcceptedFiles().length == 0) {
            console.log("All done!");
            $("#modal_header_text").html("Success!");
            $("#modal_message").html("Your image set was successfully uploaded!" +
                                     "<br>The image set should now appear in the <i>Browse</i> tab.");
            $("#result_modal").css("display", "block");
            console.log($("#farm_input").val());
            let uploaded_farm = $("#farm_input").val();
            let uploaded_field = $("#field_input").val();
            let uploaded_mission = $("#mission_input").val();
            if (!(uploaded_farm in image_sets_data)) {
                image_sets_data[uploaded_farm] = {};
            }
            if (!(uploaded_field in image_sets_data[uploaded_farm])) {
                image_sets_data[uploaded_farm][uploaded_field] = [];
            }
            image_sets_data[uploaded_farm][uploaded_field].push(uploaded_mission);
            initialize_browse();
            clear_form();
            enable_input();
            disable_submit();
            $("#upload_loader").hide();
        }
    });

    dropzone_handler.on("error", function(files, response) {

        console.log("error!");
        console.log("response", response);
        console.log("files", files);
        console.log("response.error", response.error);
        errors.push(response.error);
    });




    dropzone_handler.on("addedfile", function() {
        console.log("added file!");
        $("form").change();
    });

    dropzone_handler.on('sending', function(file, xhr, formData) {
        formData.append('farm_name', $("#farm_input").val());
        formData.append('field_name', $("#field_input").val());
        formData.append('mission_date', $("#mission_input").val());
        formData.append("queued_filenames", queued_filenames.join(","));
        formData.append('flight_height', $("#flight_height_input").val());
        num_sent++;
        formData.append("num_sent", num_sent.toString());
    });


    $("#upload_button").click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        disable_input();
        $("#upload_loader").show();

        queued_filenames = [];

        let illegal = false;
        for (f of dropzone_handler.getQueuedFiles()) {
            if (format.test(f.name)) {
                illegal = true;
            }
            queued_filenames.push(f.name);
        }
        if (illegal) {
            $("#modal_header_text").html("Error");
            $("#modal_message").html("One or more filenames contains illegal characters");
            $("#result_modal").css("display", "block");
            clear_form();
            enable_input();
            disable_submit();
            $("#upload_loader").hide();
        }
        else {
            dropzone_handler.processQueue();
        }
    });

    $("#farm_input").on("input", function(e) {
        update_submit();
    });

    $("#field_input").on("input", function(e) {
        update_submit();
    });

    $("#mission_input").on("input", function(e) {
        update_submit();
    });

    $("#flight_height_input").on("input", function(e) {
        update_submit();
    });

    $("#upload_form").change(function() {
        console.log("updating submit");
        update_submit();
    });

    $("#modal_close").click(function() {
        console.log("closing modal");
        close_modal();
    });
}
