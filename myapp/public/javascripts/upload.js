

let upload_uuid;
let dropzone_handlers = {};
let num_sent = 0;
let queued_filenames;
//let upload_error = null;
// let errors = [];
let upload_input_format = /[\s `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;


const FILE_FORMAT = /[\s `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
const FARM_FIELD_MISSION_FORMAT = /[\s `!@#$%^&*()+\=\[\]{}.;':"\\|,<>\/?~]/;


function clear_form() {
    $("#farm_input").val("");
    $("#field_input").val("");
    $("#mission_input").val("");
    $("#camera_height_input").val("");
    $("#object_input").prop("selectedIndex", -1);
    for (let key of Object.keys(dropzone_handlers)) {
        dropzone_handlers[key].removeAllFiles();
    }
    disable_x_buttons(["remove_image_set_files"]);
    disable_x_buttons(["remove_orthomosaic_files"]);
    disable_std_buttons(["upload_button"]);
}

/*
function close_modal() {
    $("#modal_header_text").val("");
    $("#modal_message").val("");
    $("#result_modal").css("display", "none");
}*/

function disable_input() {

    global_disabled = true;

    // let buttons = ["upload_button"];

    // for (let button of buttons) {
    //     $("#" + button).prop('disabled', true);
    //     $("#" + button).removeClass("std-button-hover");
    //     $("#" + button).css("opacity", 0.5);
    //     $("#" + button).css("cursor", "default");
    // }

    disable_std_buttons(["upload_button"]);


    let inputs = ["farm_input", "field_input", "mission_input", "object_input", "camera_height_input"];

    for (let input of inputs) {
        $("#" + input).prop("disabled", true);
        $("#" + input).css("opacity", 0.5);
    }

    $("#upload_set_public").prop("disabled", true);

    $(".checkmark").css("opacity", 0.5);
    $(".checkmark").css("cursor", "default");
    $(".container").css("cursor", "default");

    $(".nav").css("pointer-events", "none");
    $(".nav").css("opacity", 0.5);

    // $("#file-drop").addClass("disabled_dropzone");
    // $("#file-drop").css("opacity", 0.7);

    let handler_name;
    if ($("#image_set_tab").is(":visible")) {
        handler_name = "image_set";
        disable_x_buttons(["remove_image_set_files"]);
    }
    else {
        handler_name = "orthomosaic";
        disable_x_buttons(["remove_orthomosaic_files"]);
    }

    $("#" + handler_name + "_dropzone").addClass("disabled_dropzone");
    $("#" + handler_name + "_dropzone").css("opacity", 0.7);


}

// function disable_submit() {

//     global_disabled = false;

//     // let buttons = ["upload_button"];

//     disable_std_buttons(["upload_button"]);

//     // for (let button of buttons) {
//     //     $("#" + button).prop('disabled', true);
//     //     $("#" + button).removeClass("std-button-hover");
//     //     $("#" + button).css("opacity", 0.5);
//     //     $("#" + button).css("cursor", "default");
//     // }
// }



function enable_input() {

    // let buttons = ["upload_button"];

    // for (let button of buttons) {
    //     $("#" + button).prop('disabled', false);
    //     $("#" + button).addClass("std-button-hover");
    //     $("#" + button).css("opacity", 1);
    //     $("#" + button).css("cursor", "pointer");
    // }

    enable_std_buttons(["upload_button"]);

    let inputs = ["farm_input", "field_input", "mission_input", "object_input", "camera_height_input"];

    for (let input of inputs) {
        $("#" + input).prop("disabled", false);
        $("#" + input).css("opacity", 1.0);
    }

    $("#upload_set_public").prop("disabled", false);

    $(".checkmark").css("opacity", 1.0);
    $(".checkmark").css("cursor", "pointer");
    $(".container").css("cursor", "pointer");

    $(".nav").css("pointer-events", "all");
    $(".nav").css("opacity", 1.0);

    let handler_name;
    if ($("#image_set_tab").is(":visible")) {
        handler_name = "image_set";
    }
    else {
        handler_name = "orthomosaic";
    }

    $("#" + handler_name + "_dropzone").removeClass("disabled_dropzone");
    $("#" + handler_name + "_dropzone").css("opacity", 1.0);

}


// function enable_submit() {

//     // let buttons = ["upload_button"];

//     // for (let button of buttons) {
//     //     $("#" + button).prop('disabled', false);
//     //     $("#" + button).addClass("std-button-hover");
//     //     $("#" + button).css("opacity", 1);
//     //     $("#" + button).css("cursor", "pointer");
//     // }
//     enable_std_buttons(["upload_button"]);
// }


function test_farm_name() {
    let input_val = $("#farm_input").val();
    let input_length = input_val.length;
    if (input_length == 0) {
        return [false, "A farm name must be provided."];
    }
    if (input_length < 3) {
        return [false, "The provided farm name is too short. At least 3 characters are required."];
    }
    if (input_length > 20) {
        return [false, "The provided farm name is too long. 20 characters is the maximum allowed length."];
    }
    if (FARM_FIELD_MISSION_FORMAT.test(input_val)) {
        return [false, "The provided farm name contains invalid characters. White space and most special characters are not allowed."];
    }
    return [true, ""];
}


function test_field_name() {
    let input_val = $("#field_input").val();
    let input_length = input_val.length;
    if (input_length == 0) {
        return [false, "A field name must be provided."];
    }
    if (input_length < 3) {
        return [false, "The provided field name is too short. At least 3 characters are required."];
    }
    if (input_length > 20) {
        return [false, "The provided field name is too long. 20 characters is the maximum allowed length."];
    }
    if (FARM_FIELD_MISSION_FORMAT.test(input_val)) {
        return [false, "The provided field name contains invalid characters. White space and most special characters are not allowed."];
    }
    return [true, ""];
}

function test_mission_date() {
    let input_val = $("#mission_input").val();
    let input_length = input_val.length;
    if (input_length == 0) {
        return [false, "A mission date must be provided."];
    }
    if (input_length < 3) {
        return [false, "The provided mission date is too short."];
    }
    if (input_length > 20) {
        return [false, "The provided mission date is too long."];
    }
    if (FARM_FIELD_MISSION_FORMAT.test(input_val)) {
        return [false, "The provided mission date contains invalid characters."];
    }
    let date = new Date(input_val);
    if (!(date.isValid())) {
        return [false, "The provided mission date is invalid."]
    }
    return [true, ""];
    
}

function test_model_object() {

    let input_val = $("#object_input").val();
    if (input_val == null) {
        return [false, "A target object name must be provided."];
    }
    let input_length = input_val.length;
    if (input_length == 0) {
        return [false, "A target object name must be provided."];
    }
    if (!(objects["object_names"].includes(input_val))) {
        return [false, "The provided image set target object does not match one of the recognized options."];
    }
    return [true, ""];
}

function test_camera_height() {
    let camera_height = $("#camera_height_input").val();
    if (camera_height !== "") {
        if (!isNumeric(camera_height)) {
            return [false, "The provided camera height must be a numeric value."];
        }
        camera_height = parseFloat(camera_height);
        if (camera_height < 0.01) {
            return [false, "The provided camera height is too small. The height cannot be less than 0.01 metres."];
        }
        if (camera_height > 1000) {
            return [false, "The provided camera height is too large. The height cannot exceed 1000 metres."];
        }
    }
    return [true, ""];
}


/*
function check_text_inputs() {
    let inputs_to_check = ["farm_input", "field_input", "mission_input"];
    for (let input of inputs_to_check) {
        let input_val = $("#" + input).val();
        let input_length = input_val.length;
        if ((input_length < 3) || (input_length > 20)) {
            return false;
        }
        if (upload_input_format.test(input_val)) {
            return false;
        }
    }


    let model_object = $("#object_input").val();
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
}*/

// function dropzone_contains_files() {
//     /*

//     */
//     let handler_name;
//     if ($("#image_set_tab").is(":visible")) {
//         handler_name = "image_set";
//     }
//     else {
//         handler_name = "orthomosaic";
//     }

//     if (dropzone_handlers[handler_name].files.length == 0) {
//         return false;
//     }
//     return true;
// }

function update_submit() {
    let handler_name;
    let remove_all_id;
    if ($("#image_set_tab").is(":visible")) {
        handler_name = "image_set";
        remove_all_id = "remove_image_set_files";
    }
    else {
        handler_name = "orthomosaic";
        remove_all_id = "remove_orthomosaic_files";
    }


    if (dropzone_handlers[handler_name].files.length > 0) {
        enable_x_buttons([remove_all_id]);
        enable_std_buttons(["upload_button"]);

    }
    else {
        disable_x_buttons([remove_all_id]);
        disable_std_buttons(["upload_button"]);
    }
}




function create_orthomosaic_dropzone() {


    if (dropzone_handlers["orthomosaic"]) {
        dropzone_handlers["orthomosaic"].destroy();
    }

    $("#orthomosaic_tab").empty();

    $("#orthomosaic_tab").append(
        `<table>` +
            `<tr>` +
                `<td style="width: 100%"></td>` +
                `<td>` +
                    `<div id="remove_orthomosaic_files" class="x-button x-button-hover" style="width: 140px; font-size: 14px; padding: 2px; margin: 2px" onclick="remove_all_files()">` +
                        `<i class="fa-solid fa-circle-minus" style="padding-right: 5px"></i>` +
                            `Remove All Files` +
                    `</div>` +
                `</td>` +
            `</tr>` +
        `</table>` +
        `<div id="orthomosaic_dropzone" class="dropzone" style="height: 350px">` +
            `<div class="dz-message data-dz-message">` +
                `<span>Drop Orthomosaic Here</span>` +
            `</div>` +
            `<div id="orthomosaic_upload_loader" class="loader" hidden></div>` +
        `</div>`
    );
    disable_x_buttons(["remove_orthomosaic_files"]);

    dropzone_handlers["orthomosaic"] = new Dropzone("#orthomosaic_dropzone", { 
        url: get_CC_PATH() + "/orthomosaic_upload",
        autoProcessQueue: false,
        paramName: function(n) { return 'source_file[]'; },
        uploadMultiple: false,
        chunking: true,
        forceChunking: true,
        chunkSize: 20000000,
        parallelChunkUploads: false,
        retryChunks: false,
        retryChunksLimit: 3,
        farm_name: '',
        field_name: '',
        mission_date: '',
        maxFilesize: 200000,
        addRemoveLinks: true,
        dictRemoveFile: "Remove File",
        dictCancelUpload: ""
        // parallelUploads: 10,
        // maxUploads: 10000,
        // maxFilesize: 100000
    });

/*
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
        formData.append("is_public", ($("#upload_set_public").is(':checked')) ? "yes" : "no");
        formData.append("queued_filenames", queued_filenames.join(","));
        formData.append('camera_height', $("#camera_height_input").val());
        if (num_sent == 0) {
            upload_uuid = uuidv4();
        }
        formData.append('upload_uuid', upload_uuid);
        num_sent++;
        formData.append("num_sent", num_sent.toString());

    });
*/
}

function remove_all_files() {
    if (!(global_disabled)) {
        if ($("#image_set_tab").is(":visible")) {
            dropzone_handlers["image_set"].removeAllFiles(true);
            // disable_x_buttons(["remove_image_set_files"]);
        }
        else {
            dropzone_handlers["orthomosaic"].removeAllFiles(true);
            // disable_x_buttons(["remove_orthomosaic_files"]);
        }
    }
    //update_submit();

}

function create_image_set_dropzone() {


    // div(id="image_set_dropzone" class="dropzone" style="height: 375px")
    //                                                 div(class="dz-message data-dz-message")
    //                                                     span Drop Images Here 
    //                                                 div(id="image_set_upload_loader" class="loader" hidden)




    if (dropzone_handlers["image_set"]) {
        dropzone_handlers["image_set"].destroy();
    }

    $("#image_set_tab").empty();

    $("#image_set_tab").append(
        //`<div style="height: 35px"></div>` +
        `<table>` +
            `<tr>` +
                `<td style="width: 100%"></td>` +
                `<td>` +
                    `<div id="remove_image_set_files" class="x-button x-button-hover" style="width: 140px; font-size: 14px; padding: 2px; margin: 2px" onclick="remove_all_files()">` +
                        `<i class="fa-solid fa-circle-minus" style="padding-right: 5px"></i>` +
                            `Remove All Files` +
                    `</div>` +
                `</td>` +
            `</tr>` +
        `</table>` +
           
        //`</div>` +
        `<div id="image_set_dropzone" class="dropzone" style="height: 350px">` +
            `<div class="dz-message data-dz-message">` +
                `<span>Drop Images Here</span>` +
            `</div>` +
            `<div id="image_set_upload_loader" class="loader" hidden></div>` +
        `</div>`
    );
    disable_x_buttons(["remove_image_set_files"]);
    // div(id="image_set_dropzone" class="dropzone" style="height: 375px")
    //                                                 div(class="dz-message data-dz-message")
    //                                                     span Drop Images Here 
    //                                                 div(id="image_set_upload_loader" class="loader" hidden)
    dropzone_handlers["image_set"] = new Dropzone("#image_set_dropzone", { 
        url: get_CC_PATH() + "/image_set_upload",
        autoProcessQueue: false,
        paramName: function(n) { return 'source_file[]'; },
        uploadMultiple: true,
        farm_name: '',
        field_name: '',
        mission_date: '',
        parallelUploads: 10,
        maxUploads: 10000,
        maxFilesize: 450,
        addRemoveLinks: true,
        dictRemoveFile: "Remove File",
        dictCancelUpload: "",
        //disablePreviews: true
        //addRemoveLinks: true
    });

}

function add_dropzone_listeners() {

    for (let key of Object.keys(dropzone_handlers)) {


        dropzone_handlers[key].on("success", function(file, response) {   

            dropzone_handlers[key].removeFile(file);
            if (dropzone_handlers[key].getAcceptedFiles().length == 0) {

                dropzone_handlers[key].removeAllFiles(true);
                num_sent = 0;
                dropzone_handlers[key].options.autoProcessQueue = false;

                show_modal_message(`Success!`, `<div align="center">Your image set has been successfully uploaded.<br>Additional processing is now being performed.` +
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
                //disable_submit();
                update_submit();
                global_disabled = false;
                //disable_std_buttons(["upload_button"]);

                $("#" + key + "_upload_loader").hide();
            }
        });

        dropzone_handlers[key].on("error", function(file, response) {

            // if (!upload_error) {
            let upload_error;

            if (typeof(response) == "object" && "error" in response) {
                upload_error = response.error;
            }
            else {
                upload_error = response;
            }
            // dropzone_handlers[key].removeAllFiles(true);
            // if ($("#image_set_tab").is(":visible")) {
            //     disable_x_buttons("remove_image_set_files");
            // }
            // else {
            //     disable_x_buttons("remove_orthomosaic_files");
            // }
            // let cur_files = [];
            // for (f of dropzone_handlers[key].files) {
            //     cur_files.push(f);
            // }
            // dropzone_handlers[key].removeAllFiles(true);
            // for (let f of cur_files) {
            //     dropzone_handlers[key].enqueueFile(f);
            // }


            // let handler_name;

        
            num_sent = 0;
            dropzone_handlers[key].options.autoProcessQueue = false;
            dropzone_handlers[key].removeAllFiles(true);
            // if ($("#image_set_tab").is(":visible")) {
            //     disable_x_buttons(["remove_image_set_files"]);
            // }
            // else {
            //     disable_x_buttons(["remove_orthomosaic_files"]);
            // }


            // for (let f of queued_filenames) {
            //     console.log(f);
            //     dropzone_handlers[key].enqueueFile(f);
            // }
            // let dropzoneFilesCopy = dropzone_handlers[key].files.slice(0);
            //$.each(dropzoneFilesCopy, function(_, file) {
            // for (let f of dropzoneFilesCopy) {
            //     console.log(file);
            //     file.status = "queued";
            // }



            // let dropzoneFilesCopy = dropzone_handlers[key].files.slice(0);
            // dropzone_handlers[key].removeAllFiles();
            // $.each(dropzoneFilesCopy, function(_, file) {
            //     if (file.status === Dropzone.ERROR) {
            //         file.status = undefined;
            //         file.accepted = undefined;
            //     }
            //     dropzone_handlers[key].addFile(file);
            // });

        
            show_modal_message(`Error`, upload_error);
            /*
            `<p style="font-weight: bold">` +
                `An error occurred during the upload:</p>` + upload_error);
            */
            //clear_form();
            enable_input();
            //disable_submit();
            update_submit();
            global_disabled = false;
            $("#" + key + "_upload_loader").hide();


            // if (upload_error !== "Upload is no longer active.") {
            //     display_upload_error(upload_error);
            // }
            // }

        });

        // dropzone_handlers[key].on("processing", function() {
        //     console.log("processing");

        // });


        // dropzone_handlers[key].on("drop", function(f) {
        //     console.log("drop", f);
        // });

        dropzone_handlers[key].on("removedfile", function(file) {
            if (!(global_disabled)) {
                update_submit();
            }
        });

        dropzone_handlers[key].on("addedfile", function() {
            // console.log("addedFile");
            // console.log("getAcceptedFiles()", dropzone_handlers["image_set"].getAcceptedFiles());
            // console.log("getRejectedFiles()", dropzone_handlers["image_set"].getRejectedFiles());
            // console.log("getQueuedFiles()", dropzone_handlers["image_set"].getQueuedFiles());
            // console.log("getUploadingFiles()", dropzone_handlers["image_set"].getUploadingFiles());
            // console.log(dropzone_handlers[key].files.length);
            // console.log(dropzone_handlers[key].files);
            if (dropzone_handlers[key].options.autoProcessQueue) {
                let upload_error = "A file was added after the upload was initiated. Please ensure that all files have been added to the queue before pressing the 'Upload' button."
                dropzone_handlers[key].removeAllFiles(true);


                if ($("#image_set_tab").is(":visible")) {
                    create_image_set_dropzone();
                }
                else {
                    create_orthomosaic_dropzone();
                }

                // let handler_name;
                // if ($("#image_set_tab").is(":visible")) {
                //     handler_name = "image_set";
                // }
                // else {
                //     handler_name = "orthomosaic";
                // }
            
                num_sent = 0;
                dropzone_handlers[key].options.autoProcessQueue = false;
            
                show_modal_message(`Error`, 
                    `<div>${upload_error}</div>` +
                    `<div style="height: 10px"></div>` +
                    `<div style="text-align: center">` +
                        `<button class="std-button std-button-hover" onclick="window.location.reload()" style="width: 150px">Reload Page</button>` +
                    `</div>`
                );
                $("#modal_close").hide();
                clear_form();
                enable_input();
                //disable_submit();
                update_submit();
                global_disabled = false;
                //disable_std_buttons(["upload_button"]);
                $("#" + key + "_upload_loader").hide();

                //display_upload_error(upload_error);
            }
            else {
                if ($("#image_set_tab").is(":visible")) {
                    enable_x_buttons(["remove_image_set_files"]);
                }
                else {
                    enable_x_buttons(["remove_orthomosaic_files"]);
                }

                $("form").change();
            }
        });


        dropzone_handlers[key].on('sending', function(file, xhr, formData) {
            formData.append('farm_name', $("#farm_input").val());
            formData.append('field_name', $("#field_input").val());
            formData.append('mission_date', $("#mission_input").val());
            formData.append("object_name", $("#object_input").val());
            formData.append("is_public", ($("#upload_set_public").is(':checked')) ? "yes" : "no");

            formData.append("queued_filenames",  queued_filenames.join(","));
            //formData.append("num_remaining", dropzone_handlers[handler_name].getQueuedFiles().length - 1);
            formData.append('camera_height', $("#camera_height_input").val());
            if (num_sent == 0) {
                upload_uuid = uuidv4();
            }
            formData.append('upload_uuid', upload_uuid);
            num_sent++;
            formData.append("num_sent", num_sent.toString());

        });

    }



}

/*
function display_upload_error(upload_error) {

    let handler_name;
    if ($("#image_set_tab").is(":visible")) {
        handler_name = "image_set";
    }
    else {
        handler_name = "orthomosaic";
    }

    num_sent = 0;
    dropzone_handlers[handler_name].options.autoProcessQueue = false;

    show_modal_message(`Error`, `Error:<br>` + upload_error);
    //clear_form();
    enable_input();
    //disable_submit();
    $("#" + handler_name + "_upload_loader").hide();
}*/





function show_upload_tab(active_tab_btn) {

    let tab_ids = [
        "image_set_tab_btn",
        "orthomosaic_tab_btn"
    ];

    for (let tab_btn_id of tab_ids) {
        let tab_id = tab_btn_id.substring(0, tab_btn_id.length - 4);
        $("#" + tab_id).hide();
        $("#" + tab_btn_id).removeClass("tab-btn-active");
    }

    $("#" + active_tab_btn).addClass("tab-btn-active");

    $("#image_set_tab").hide();
    $("#orthomosaic_tab").hide();

    if (active_tab_btn === "image_set_tab_btn") {
        if (!global_disabled) {
            $("#image_set_tab").show();
            update_submit();
        }
    }
    else {
        if (!global_disabled) {
            $("#orthomosaic_tab").show();
            update_submit();
        }
    }

}










function initialize_upload() {

    create_image_set_dropzone();
    create_orthomosaic_dropzone();
    // $("#orthomosaic_tab").hide();

    add_dropzone_listeners();

    //disable_submit();
    global_disabled = false;
    disable_std_buttons(["upload_button"]);

    for (let object_name of objects["object_names"]) {
        $("#object_input").append($('<option>', {
            value: object_name,
            text: object_name
        }));
    }
    $("#object_input").prop("selectedIndex", -1);



    $("#upload_button").click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        let handler_name;
        if ($("#image_set_tab").is(":visible")) {
            handler_name = "image_set";
        }
        else {
            handler_name = "orthomosaic";
        }



        disable_input();
        $("#" + handler_name + "_upload_loader").show();

        queued_filenames = [];

        if (handler_name === "orthomosaic" && dropzone_handlers[handler_name].getQueuedFiles().length != 1) {
            show_modal_message(`Error`, `Only one orthomosaic can be uploaded at a time.`);
            //for (let key of Object.keys(dropzone_handlers)) {
            //dropzone_handlers["orthomosaic"].removeAllFiles();
            //}
            //clear_form();
            enable_input();
            // update_submit();
            update_submit();
            global_disabled = false;
            $("#" + handler_name + "_upload_loader").hide();
            return;
        }
        let res;
        res = test_farm_name();
        if (res[0]) {
            res = test_field_name();
        }
        if (res[0]) {
            res = test_mission_date();
        }
        if (res[0]) {
            res = test_model_object();
        }
        if (res[0]) {
            res = test_camera_height();
        }
        if (res[0]) {
            for (let f of dropzone_handlers[handler_name].getQueuedFiles()) {
                if (FILE_FORMAT.test(f.name)) {
                    res = [false, "One or more filenames contains illegal characters. White space and most special characters are not allowed."];
                }
                //if (has_duplicates()
            }
        }
        if (res[0]) {
            for (let f of dropzone_handlers[handler_name].getQueuedFiles()) {
                queued_filenames.push(f.name);
            }
            if (has_duplicates(queued_filenames)) {
                res = [false, "The image set contains duplicate filenames."];
            }
        }

        if (!(res[0])) {
            queued_filenames = [];
            show_modal_message(`Error`, res[1]);
            //show_modal_message(`Error`, `One or more filenames contains illegal characters. White space and most special characters are not allowed`);
            //$("#modal_header_text").html("Error");
            //$("#modal_message").html("One or more filenames contains illegal characters");
            //$("#result_modal").css("display", "block");
            //clear_form();
            //dropzone_handlers[handler_name].removeAllFiles();
            enable_input();
            // update_submit();
            update_submit();
            global_disabled = false;
            $("#" + handler_name + "_upload_loader").hide();
            return;
        }

        $("#" + handler_name + "_dropzone").animate({ scrollTop: 0 }, "fast");
        //upload_error = null;
        dropzone_handlers[handler_name].options.autoProcessQueue = true;
        dropzone_handlers[handler_name].processQueue();

    });

    // $("#farm_input").on("input", function(e) {
    //     update_submit();
    // });

    // $("#field_input").on("input", function(e) {
    //     update_submit();
    // });

    // $("#mission_input").on("input", function(e) {
    //     update_submit();
    // });

    // $("#camera_height_input").on("input", function(e) {
    //     update_submit();
    // });

    $("#upload_form").change(function() {
        update_submit();
    });


    $("#image_set_tab_btn").click(function() {
        show_upload_tab("image_set_tab_btn");
    });

    $("#orthomosaic_tab_btn").click(function() {
        show_upload_tab("orthomosaic_tab_btn");
    });
}
