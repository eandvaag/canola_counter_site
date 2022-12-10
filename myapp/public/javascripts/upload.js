

let upload_uuid;
let dropzone_handlers = {};
let num_sent = 0;
let queued_filenames;
//let upload_error = null;
// let errors = [];
let upload_input_format = /[\s `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;

function clear_form() {
    $("#farm_input").val("");
    $("#field_input").val("");
    $("#mission_input").val("");
    $("#camera_height_input").val("");
    $("#object_input").prop("selectedIndex", -1);
    for (let key of Object.keys(dropzone_handlers)) {
        dropzone_handlers[key].removeAllFiles();
    }
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
    }
    else {
        handler_name = "orthomosaic";
    }

    $("#" + handler_name + "_dropzone").addClass("disabled_dropzone");
    $("#" + handler_name + "_dropzone").css("opacity", 0.7);


}

function disable_submit() {

    global_disabled = false;

    // let buttons = ["upload_button"];

    disable_std_buttons(["upload_button"]);

    // for (let button of buttons) {
    //     $("#" + button).prop('disabled', true);
    //     $("#" + button).removeClass("std-button-hover");
    //     $("#" + button).css("opacity", 0.5);
    //     $("#" + button).css("cursor", "default");
    // }
}



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


function enable_submit() {

    // let buttons = ["upload_button"];

    // for (let button of buttons) {
    //     $("#" + button).prop('disabled', false);
    //     $("#" + button).addClass("std-button-hover");
    //     $("#" + button).css("opacity", 1);
    //     $("#" + button).css("cursor", "pointer");
    // }
    enable_std_buttons(["upload_button"]);
}

function form_is_complete() {
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
    let handler_name;
    if ($("#image_set_tab").is(":visible")) {
        handler_name = "image_set";
    }
    else {
        handler_name = "orthomosaic";
    }

    if (dropzone_handlers[handler_name].files.length == 0) {
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




function create_orthomosaic_dropzone() {


    if (dropzone_handlers["orthomosaic"]) {
        dropzone_handlers["orthomosaic"].destroy();
    }

    $("#orthomosaic_tab").empty();

    $("#orthomosaic_tab").append(
        `<div id="orthomosaic_dropzone" class="dropzone" style="height: 375px">` +
            `<div class="dz-message data-dz-message">` +
                `<span>Drop Orthomosaic Here</span>` +
            `</div>` +
            `<div id="orthomosaic_upload_loader" class="loader" hidden></div>` +
        `</div>`
    );


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
        maxFilesize: 200000
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
        `<div id="image_set_dropzone" class="dropzone" style="height: 375px">` +
            `<div class="dz-message data-dz-message">` +
                `<span>Drop Images Here</span>` +
            `</div>` +
            `<div id="image_set_upload_loader" class="loader" hidden></div>` +
        `</div>`
    );
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
                disable_submit();
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
            dropzone_handlers[key].removeAllFiles(true);
            if (upload_error !== "Upload is no longer active.") {
                display_upload_error(upload_error);
            }
            // }

        });

        // dropzone_handlers[key].on("processing", function() {
        //     console.log("processing");

        // });


        // dropzone_handlers[key].on("drop", function(f) {
        //     console.log("drop", f);
        // });


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
                disable_submit();
                $("#" + key + "_upload_loader").hide();

                //display_upload_error(upload_error);
            }
            else {
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
    clear_form();
    enable_input();
    disable_submit();
    $("#" + handler_name + "_upload_loader").hide();
}





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

    disable_submit();

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
            dropzone_handlers["orthomosaic"].removeAllFiles();
            //}
            //clear_form();
            enable_input();
            update_submit();
            $("#" + handler_name + "_upload_loader").hide();
            return;
        }

        let illegal = false;
        for (let f of dropzone_handlers[handler_name].getQueuedFiles()) {
            if (upload_input_format.test(f.name)) {
                illegal = true;
            }
            queued_filenames.push(f.name);
        }
        if (illegal) {
            show_modal_message(`Error`, `One or more filenames contains illegal characters.`);
            //$("#modal_header_text").html("Error");
            //$("#modal_message").html("One or more filenames contains illegal characters");
            //$("#result_modal").css("display", "block");
            //clear_form();
            dropzone_handlers[handler_name].removeAllFiles();
            enable_input();
            update_submit();
            $("#" + handler_name + "_upload_loader").hide();
            return;
        }

        //upload_error = null;
        dropzone_handlers[handler_name].options.autoProcessQueue = true;
        dropzone_handlers[handler_name].processQueue();

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


    $("#image_set_tab_btn").click(function() {
        show_upload_tab("image_set_tab_btn");
    });

    $("#orthomosaic_tab_btn").click(function() {
        show_upload_tab("orthomosaic_tab_btn");
    });
}
