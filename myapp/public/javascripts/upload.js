let upload_uuid;
let dropzone_handler;
let num_sent = 0;
let queued_filenames;
let upload_error = null;
// let errors = [];
let format = /[\s `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;

function clear_form() {
    $("#farm_input").val("");
    $("#field_input").val("");
    $("#mission_input").val("");
    $("#camera_height_input").val("");
    dropzone_handler.removeAllFiles();
}

/*
function close_modal() {
    $("#modal_header_text").val("");
    $("#modal_message").val("");
    $("#result_modal").css("display", "none");
}*/

function disable_input() {

    global_disabled = true;

    let buttons = ["upload_button"];

    for (let button of buttons) {
        $("#" + button).prop('disabled', true);
        $("#" + button).removeClass("std-button-hover");
        $("#" + button).css("opacity", 0.5);
        $("#" + button).css("cursor", "default");
    }


    let inputs = ["farm_input", "field_input", "mission_input", "camera_height_input"];

    for (let input of inputs) {
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

    for (let button of buttons) {
        $("#" + button).prop('disabled', true);
        $("#" + button).removeClass("std-button-hover");
        $("#" + button).css("opacity", 0.5);
        $("#" + button).css("cursor", "default");
    }
}



function enable_input() {

    let buttons = ["upload_button"];

    for (let button of buttons) {
        $("#" + button).prop('disabled', false);
        $("#" + button).addClass("std-button-hover");
        $("#" + button).css("opacity", 1);
        $("#" + button).css("cursor", "pointer");
    }

    let inputs = ["farm_input", "field_input", "mission_input", "camera_height_input"];

    for (let input of inputs) {
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

    for (let button of buttons) {
        $("#" + button).prop('disabled', false);
        $("#" + button).addClass("std-button-hover");
        $("#" + button).css("opacity", 1);
        $("#" + button).css("cursor", "pointer");
    }
}

function form_is_complete() {
    let inputs_to_check = ["farm_input", "field_input", "mission_input"];
    for (let input of inputs_to_check) {
        let input_val = $("#" + input).val();
        let input_length = input_val.length;
        if ((input_length < 3) || (input_length > 20)) {
            return false;
        }
        if (format.test(input_val)) {
            return false;
        }
    }


    let model_object = $("#object_input").val();
    console.log(objects);
    if (!(objects["object_names"].includes(model_object))) {
        return false;
    }
    
    let camera_height = $("#camera_height_input").val();
    if (camera_height !== "") {
        if (!isNumeric(camera_height)) {
            return false;
        }
        camera_height = parseFloat(camera_height);
        if (camera_height < 0.01 || camera_height > 1000) {
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


function display_upload_error() {

    num_sent = 0;
    dropzone_handler.options.autoProcessQueue = false;

    show_modal_message(`Error`, `An error occurred during the upload process:<br>` + upload_error);
    clear_form();
    enable_input();
    disable_submit();
    $("#upload_loader").hide();
}


function initialize_upload() {

    disable_submit();

    for (let object_name of objects["object_names"]) {
        $("#object_input").append($('<option>', {
            value: object_name,
            text: object_name
        }));
    }
    $("#object_input").prop("selectedIndex", -1);


    dropzone_handler = new Dropzone("#file-drop", { 
        url: get_CC_PATH() + "/upload",
        autoProcessQueue: false,
        paramName: function(n) { return 'source_file[]'; },
        uploadMultiple: true,
        farm_name: '',
        field_name: '',
        mission_date: '',
        parallelUploads: 10,
        maxUploads: 10000,
        maxFilesize: 100000
    });

    dropzone_handler.on("success", function(file, response) {   

        dropzone_handler.removeFile(file);
        if (dropzone_handler.getAcceptedFiles().length == 0) {

            dropzone_handler.removeAllFiles(true);
            num_sent = 0;
            dropzone_handler.options.autoProcessQueue = false;

            show_modal_message(`Success!`, `<div align="center">Your images have been successfully uploaded.<br>Additional processing is now being performed.` +
            `<br><br>The image set can now be viewed in the <i>Browse</i> tab.</div>`);

            let uploaded_farm = $("#farm_input").val();
            let uploaded_field = $("#field_input").val();
            let uploaded_mission = $("#mission_input").val();
            if (!(uploaded_farm in image_sets_data)) {
                image_sets_data[uploaded_farm] = {};
            }
            if (!(uploaded_field in image_sets_data[uploaded_farm])) {
                image_sets_data[uploaded_farm][uploaded_field] = {};
            }
            image_sets_data[uploaded_farm][uploaded_field][uploaded_mission] = {
                "status": "processing"
            };
            //.push(uploaded_mission);
            initialize_browse();
            clear_form();
            enable_input();
            disable_submit();
            $("#upload_loader").hide();
        }
    });

    dropzone_handler.on("error", function(file, response) {

        console.log(response);

        if (!upload_error) {

            upload_error = response.error;
            dropzone_handler.removeAllFiles(true);

            display_upload_error();
        }

    });




    dropzone_handler.on("addedfile", function() {
        $("form").change();
    });

    dropzone_handler.on('sending', function(file, xhr, formData) {
        formData.append('farm_name', $("#farm_input").val());
        formData.append('field_name', $("#field_input").val());
        formData.append('mission_date', $("#mission_input").val());
        formData.append("object_name", $("#object_input").val());
        formData.append("queued_filenames", queued_filenames.join(","));
        formData.append('camera_height', $("#camera_height_input").val());
        if (num_sent == 0) {
            upload_uuid = uuidv4();
        }
        formData.append('upload_uuid', upload_uuid);
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
        for (let f of dropzone_handler.getQueuedFiles()) {
            if (format.test(f.name)) {
                illegal = true;
            }
            queued_filenames.push(f.name);
        }
        if (illegal) {
            show_modal_message(`Error`, `One or more filenames contains illegal characters.`);
            //$("#modal_header_text").html("Error");
            //$("#modal_message").html("One or more filenames contains illegal characters");
            //$("#result_modal").css("display", "block");
            clear_form();
            enable_input();
            disable_submit();
            $("#upload_loader").hide();
        }
        else {
            upload_error = null;
            dropzone_handler.options.autoProcessQueue = true;
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

    $("#camera_height_input").on("input", function(e) {
        update_submit();
    });

    $("#upload_form").change(function() {
        update_submit();
    });
}
