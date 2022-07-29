let viewing_results = false;
let active_results_tab_btn = "completed_results_tab_btn";
let cur_results;
let fetch_results_interval;
global_disabled = false;


function delete_request() {
    $("#modal_header_text").html("Are you sure?");
    $("#modal_message").html("Are you sure you want to delete this image set?");
    $("#result_modal").css("display", "block");

    $("#modal_message").append(`<div id="modal_button_container">
        <button id="confirm_delete" class="x-button x-button-hover" `+
        `style="width: 200px" onclick="confirm_delete_request()"><span>Delete</span></button>` +
        `<button id="cancel_delete" class="std-button std-button-hover" ` +
        `style="width: 200px" onclick="cancel_delete_request()"><span>Cancel</span></button>` +
        `</div>`);
}

function confirm_delete_request() {
    $.post($(location).attr('href'),
    {
        action: "delete_image_set",
        farm_name: $("#farm_combo").val(),
        field_name: $("#field_combo").val(),
        mission_date: $("#mission_combo").val(),
    },
    function(response, status) {

        if (response.error) { 
            $("#modal_header_text").html("Error");
            $("#modal_message").html(response.message);
            $("#result_modal").css("display", "block");
        }
        else {
            window.location.href = response.redirect;
        }
    });
}

function cancel_delete_request() {
    $("#modal_button_container").remove();
    close_modal();
}


function annotate_request() {

    $.post($(location).attr('href'),
    {
        action: "annotate_image_set",
        farm_name: $("#farm_combo").val(),
        field_name: $("#field_combo").val(),
        mission_date: $("#mission_combo").val(),
    },
    function(response, status) {

        if (response.error) {
            $("#modal_header_text").html("Error");
            $("#modal_message").html(response.message);
            $("#result_modal").css("display", "block");
        }
        else {
            window.location.href = response.redirect;
        }
    });
}

/*
function initialize_train_baseline() {


    //let container_height = "300px";
    //let container_width = "1000px";
    let col_width = "400px";

    for (farm_name of natsort(Object.keys(image_sets_data))) {
        for (field_name of natsort(Object.keys(image_sets_data[farm_name]))) {
            for (mission_date of natsort(Object.keys(image_sets_data[farm_name]))) {
                let image_set_name = farm_name + "::" + field_name + "::" + mission_date;
                let image_set_row_id = image_set_name + "_row";
                let overlay_color = "black";
                $("#image_sets_table").append(`<tr id=${image_set_row_id}>` +
                `<td><label class="table_label" ` +
                `style="width: ${col_width}; background-color: #2b3628;">` +
                `<table class="transparent_table">` +
                `<tr>` + 
                `<td style="width: 40px">` +
                    `<label class="switch">` +
                    `<input id=${image_set_name} type="checkbox"></input>` +
                    `<span class="switch_slider round"></span></label>` +
                `</td>` +
                `<td style="width: 100%">` +
                    `<div style="margin-left: 8px">${image_set_name}</div>` +
                `</td>` +
                `</tr>` +
                `</table>` +
                `</label>` +
                `</td>`+
                `</tr>`);
            }
        }
    }
}
*/

function show_results_tab() {

    let tab_ids = [
        "completed_results_tab_btn",
        "pending_results_tab_btn",
        "aborted_results_tab_btn"
    ];

    for (tab_btn_id of tab_ids) {
        let tab_id = tab_btn_id.substring(0, tab_btn_id.length - 4);
        $("#" + tab_id).hide();
        $("#" + tab_btn_id).removeClass("tab-btn-active");
    }

    $("#" + active_results_tab_btn).addClass("tab-btn-active");

    $("#completed_results").hide();
    $("#pending_results").hide();
    $("#aborted_results").hide();

    if (active_results_tab_btn === "completed_results_tab_btn") {
        $("#completed_results").show();
    }
    else if (active_results_tab_btn === "pending_results_tab_btn") {
        $("#pending_results").show();
    }
    else {
        $("#aborted_results").show();
    }

}


function show_tab(sel_tab_btn_id) {

    let tab_ids = [
        "browse_tab_btn",
        "upload_tab_btn",
        "train_baseline_tab_btn"
    ];

    for (tab_btn_id of tab_ids) {
        let tab_id = tab_btn_id.substring(0, tab_btn_id.length - 4);
        $("#" + tab_id).hide();
        $("#" + tab_btn_id).removeClass("tab-btn-active");
    }

    $("#" + sel_tab_btn_id).addClass("tab-btn-active");

    $("#browse").hide();
    $("#upload").hide();
    $("#train_baseline").hide();

    if (sel_tab_btn_id === "browse_tab_btn") {
        //show_browse();
        //viewing_results = false;
        //active_results_tab_btn = "completed_results_tab_btn";
        $("#browse").show();
    }
    else if (sel_tab_btn_id === "upload_tab_btn") {
        //show_upload();
        //viewing_results = false;
        //active_results_tab_btn = "completed_results_tab_btn";
        $("#upload").show();
    }
    else {
        //show_train_baseline();
        $("#train_baseline").show();
    }

}

function show_image_set_tab(sel_tab_btn_id) {

    let image_set_tab_ids = [
        "overview_tab_btn",
        "results_tab_btn"
    ];

    for (tab_btn_id of image_set_tab_ids) {
        let tab_id = tab_btn_id.substring(0, tab_btn_id.length - 4);
        $("#" + tab_id).hide();
        $("#" + tab_btn_id).removeClass("tab-btn-active");
    }

    $("#" + sel_tab_btn_id).addClass("tab-btn-active");

    if (sel_tab_btn_id === "overview_tab_btn") {
        show_overview();
    }
    else {
        show_results();
    }
}



function update_make_model() {

    let inputs_to_check = ["make_input", "model_input"];
    for (input of inputs_to_check) {
        let input = $("#" + input).val();
        let input_length = input.length;
        if ((input_length < 3) || (input_length > 20)) {
            return false;
        }
        if (input === "???") {
            return false;
        }
    }
    return true;
}

function update_sensor() {

    let inputs_to_check = ["sensor_width_input", "sensor_height_input", "focal_length_input"];
    for (input of inputs_to_check) {
        let input_length = ($("#" + input).val()).length;
        if ((input_length < 1) || (input_length > 10)) {
            return false;
        }
        let input_val = $("#" + input).val();
        if (!(isNumeric(input_val))) {
            return false;
        }
        input_val = parseFloat(input_val);
        if (input_val <= 0) {
            return false;
        }
    }
    return true;
}

function edit_metadata(make, model) {

    $("#modal_header_text").html("Edit Camera Metadata");
    $("#modal_message").empty();

    $("#modal_message").append(`<div style="color: yellow; text-decoration: underline">WARNING</div><div style="text-align: justify">` +
        ` Changing a camera's metadata will affect all of the image sets that have been assigned to that camera.</div>`);
    $("#modal_message").append(`<div style="height: 20px"></div>`);

    add_make_model_fields("150px");
    add_sensor_fields("150px")
    

    let sensor_width_str = camera_specs[make][model]["sensor_width"];
    let sensor_height_str = camera_specs[make][model]["sensor_height"];
    let focal_length_str = camera_specs[make][model]["focal_length"];
    let sensor_width = parseFloat(sensor_width_str.substring(0, sensor_width_str.length - 3));
    let sensor_height = parseFloat(sensor_height_str.substring(0, sensor_height_str.length - 3));
    let focal_length = parseFloat(focal_length_str.substring(0, focal_length_str.length - 3));

    $("#make_input").val(make);
    $("#model_input").val(model);
    $("#sensor_width_input").val(sensor_width);
    $("#sensor_height_input").val(sensor_height);
    $("#focal_length_input").val(focal_length);

    $("#modal_message").append(`<div style="height: 20px"></div>`);
 
    $("#modal_message").append(`<table class="transparent_table"><tr>` +
        `<td>` +
        `<button class="table_button table_button_hover" style="width: 220px; height: 30px;" id="camera_update_button" ` +
        `onclick="update_camera()">`+
            `Update Metadata</button>` +
        `</td>` +
        `</tr></table>`);


        
    
    for (button_id of ["make_input", "model_input", "sensor_width_input", "sensor_height_input", "focal_length_input"]) {
        $("#" + button_id).on("input", function(e) {
            if (update_make_model() && update_sensor()) {
                enable_buttons(["camera_update_button"]);
            }
            else {
                disable_buttons(["camera_update_button"]);
            }
        });
    }

    $("#result_modal").css("display", "block");


}

function add_sensor_fields(left_col_width_px) {

    $("#modal_message").append(
        `<table class="transparent_table">` +
        `<tr>` +
            `<th>` + 
                `<div class="table_head" style="width: ${left_col_width_px}">Sensor Width (mm)</div>` +
            `</th>` +
            `<th>` +
                `<div style="width: 250px">` +
                    `<input id="sensor_width_input" class="nonfixed_input">` +
                `</div>` +
            `</th>` +
        `</tr>` + 
        `<tr>` +
            `<th>` + 
                `<div class="table_head" style="width: ${left_col_width_px}">Sensor Height (mm)</div>` +
            `</th>` +
            `<th>` +
                `<div style="width: 250px">` +
                    `<input id="sensor_height_input" class="nonfixed_input">` +
                `</div>` +
            `</th>` +
        `</tr>` +
        `<tr>` +
            `<th>` + 
                `<div class="table_head" style="width: ${left_col_width_px}">Focal Length (mm)</div>` +
            `</th>` +
            `<th>` +
                `<div style="width: 250px">` +
                    `<input id="focal_length_input" class="nonfixed_input">` +
                `</div>` +
            `</th>` +
        `</tr>`
    );
}

function add_sensor_metadata(make, model) {


    $("#modal_header_text").html("Add Camera Metadata");
    $("#modal_message").empty();
    $("#modal_message").append(`<div>` +
        `This camera is not known to the system.<br>` +
        `Please provide the following information:</div>`);
    $("#modal_message").append(`<div style="height: 20px"></div>`);

    add_sensor_fields("150px");

    $("#modal_message").append(`<div style="height: 20px"></div>`);
    
    $("#modal_message").append(`<table class="transparent_table"><tr>` +
        `<td>` +
        `<button class="table_button table_button_hover" style="width: 220px; height: 30px;" id="camera_add_button" ` +
        `onclick="add_camera('${make}', '${model}')">`+
            `Add Camera</button>` +
        `</td>` +
        `</tr></table>`);

    
    for (button_id of ["sensor_width_input", "sensor_height_input", "focal_length_input"]) {
        $("#" + button_id).on("input", function(e) {
            if (update_sensor()) {
                enable_buttons(["camera_add_button"]);
            }
            else {
                disable_buttons(["camera_add_button"]);
            }
        });
    }
    disable_buttons(["camera_add_button"]);


    $("#result_modal").css("display", "block");

}

function add_make_model_fields(left_col_width_px) {
    $("#modal_message").append(
        `<table class="transparent_table">` +
        `<tr>` +
            `<th>` + 
                `<div class="table_head" style="width: ${left_col_width_px}">Make</div>` +
            `</th>` +
            `<th>` +
                `<div style="width: 250px">` +
                    `<input id="make_input" class="nonfixed_input">` +
                `</div>` +
            `</th>` +
        `</tr>` + 
        `<tr>` +
            `<th>` + 
                `<div class="table_head" style="width: ${left_col_width_px}">Model</div>` +
            `</th>` +
            `<th>` +
                `<div style="width: 250px">` +
                    `<input id="model_input" class="nonfixed_input">` +
                `</div>` +
            `</th>` +
        `</tr>`  

    );
}

function add_make_model_metadata() {

    $("#modal_header_text").html("Add Camera Metadata");
    $("#modal_message").empty();

    add_make_model_fields("60px");

    $("#modal_message").append(`<div style="height: 20px"></div>`);
    
    $("#modal_message").append(`<table class="transparent_table"><tr>` +
        `<td>` +
        `<button class="table_button table_button_hover" style="width: 220px; height: 30px;" id="camera_search_button" onclick="search_for_camera()">`+
            `Search For Camera</button>` +
        `</td>` +
        `</tr></table>`);


    for (input of ["make_input", "model_input"]) {
        $("#" + input).on("input", function(e) {
            if (update_make_model()) {
                enable_buttons(["camera_search_button"]);
            }
            else {
                disable_buttons(["camera_search_button"]);
            }
        });
    }

    disable_buttons(["camera_search_button"]);

    $("#result_modal").css("display", "block");

}


function update_camera() {
    
    let make = $("#make_input").val();
    let model = $("#model_input").val();

    add_camera(make, model);

}
function add_camera(make, model) {
    console.log("adding camera...");

    let sensor_width = $("#sensor_width_input").val();
    let sensor_height = $("#sensor_height_input").val();
    let focal_length = $("#focal_length_input").val();

    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    $.post($(location).attr('href'),
    {
        action: "add_camera",
        make: make,
        model: model,
        sensor_width: sensor_width,
        sensor_height: sensor_height,
        focal_length: focal_length,
        farm_name: farm_name,
        field_name: field_name,
        mission_date: mission_date
    },
    function(response, status) {

        if (response.error) {
            $("#modal_header_text").html("Error");
            $("#modal_message").html(response.message);
        }
        else {
            camera_specs = response.camera_specs;
            show_overview();
            $("#modal_header_text").html("Success!");
            $("#modal_message").html("Success! The provided metadata has been successfully processed.<br><br>You may now close this window.");

        }
    });

}


function search_for_camera() {
    
    let make = $("#make_input").val();
    let model = $("#model_input").val();

    if (make in camera_specs && model in camera_specs[make]) {

        let sensor_width_str = camera_specs[make][model]["sensor_width"];
        let sensor_height_str = camera_specs[make][model]["sensor_height"];
        let focal_length_str = camera_specs[make][model]["focal_length"];

        let sensor_width = parseFloat(sensor_width_str.substring(0, sensor_width_str.length - 3));
        let sensor_height = parseFloat(sensor_height_str.substring(0, sensor_height_str.length - 3));
        let focal_length = parseFloat(focal_length_str.substring(0, focal_length_str.length - 3));

        let farm_name = $("#farm_combo").val();
        let field_name = $("#field_combo").val();
        let mission_date = $("#mission_combo").val();

        $.post($(location).attr('href'),
        {
            action: "add_camera",
            make: make,
            model: model,
            sensor_width: sensor_width,
            sensor_height: sensor_height,
            focal_length: focal_length,
            farm_name: farm_name,
            field_name: field_name,
            mission_date: mission_date
        },
        function(response, status) {

            if (response.error) {
                $("#modal_header_text").html("Error");
                $("#modal_message").html(response.message);
            }
            else {
                camera_specs = response.camera_specs;
                show_overview();
                $("#modal_header_text").html("Success!");
                $("#modal_message").html("Success! The provided make and model are known to the system.<br><br>You may now close this window.");
            }
        });

    }
    else {
        add_sensor_metadata(make, model);
    }
}

function show_overview() {

    viewing_results = false;

    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();
    let job_url = "/plant_detection/usr/data/" + username + "/image_sets/" + farm_name + "/" + field_name + 
                    "/" + mission_date + "/annotations/annotations_w3c.json";
    let metadata_url = "/plant_detection/usr/data/" + username + "/image_sets/" + farm_name + "/" + field_name + 
                    "/" + mission_date + "/metadata/metadata.json";

    let annotations = get_json(job_url);
    let metadata = get_json(metadata_url);

    let total_annotations = 0;
    let total_images = 0;
    let completed = 0;
    let started = 0;
    let unannotated = 0;
    for (img_name in annotations) {
        total_annotations += annotations[img_name]["annotations"].length;
        total_images += 1;
        if (annotations[img_name]["status"] === "completed_for_training" || annotations[img_name]["status"] === "completed_for_testing") {
            completed += 1;
        }
        else if (annotations[img_name]["status"] === "started") {
            started += 1;
        }   
        else {
            unannotated += 1;
        }     
    }
    let label_width = "200px";
    let value_width = "200px";

    $("#tab_details").empty();

    $("#tab_details").append(`<table class="transparent_table" style="height: 500px; width: 90%" id="image_set_table"></table>`);

    $("#image_set_table").append(`<tr>`+
    `<th style="width: 50%;" id="left_section">` +
    `</th>` +
    `<th style="width: 50%;" id="right_section">` +
        `<div style="height: 70px"></div>` +
        `<table id="right_table">` +
            `<tr id="top_row" style="height: 160px">` +
                `<th id="top_left" style="vertical-align: top;"></th>` +
                `<th id="top_right" style="vertical-align: top"></th>` +
            `</tr>` +
            `<tr id="bottom_row" style="height: 270px">` +
                `<th id="bottom_left" style="vertical-align: top;"></th>` +
                `<th id="bottom_right" style="vertical-align: top"></th>` +
            `</tr>` +
        `</table>` +
    `</th>` +
    `<tr>`);

    let make = metadata["camera_info"]["make"];
    let model = metadata["camera_info"]["model"];

    let flight_height = metadata["flight_height"];

    let is_georeferenced;
    if (metadata["missing"]["latitude"] || metadata["missing"]["longitude"]) {
        is_georeferenced = "No";
    }
    else {
        is_georeferenced = "Yes";
    }
    $("#top_right").append(`<div style="text-decoration: underline;">Flight Information</div><br>`);
    $("#top_right").append(`<table class="transparent_table" id="flight_info_table"></table>`);

    $("#flight_info_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Flight Height</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${flight_height}</div></th>` +
            `</tr>`);
    $("#flight_info_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Georeferenced</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${is_georeferenced}</div></th>` +
            `</tr>`);        

            
    $("#bottom_right").append(`<div style="text-decoration: underline;">Camera Metadata</div><br>`);


    $("#bottom_right").append(`<table class="transparent_table" id="camera_specs_table"></table>`);


    if (make == "???" || model == "???") {

        $("#bottom_right").append(`<table class="transparent_table" id="missing_specs_table"></table>`);

        $("#missing_specs_table").append(`<tr>` +
        `<td style="height: 20px"></td>` +
        `</tr>`);


        $("#missing_specs_table").append(`<tr>` +
            `<th><div class="table_head">Metadata could not be extracted.</div></th>` +
            `</tr>`);
        $("#missing_specs_table").append(`<tr>` +
            `<td style="height: 10px"></td>` +
            `</tr>`);

        $("#missing_specs_table").append(`<tr>` +
            `<td>` +
            `<button class="std-button std-button-hover" style="width: 220px; height: 30px;" onclick="add_make_model_metadata()">`+
                `Add Metadata</button>` +
            `</td>` +
            `</tr>`);
    }
    else {

        $("#camera_specs_table").append(`<tr>` +
                `<th><div class="table_head" style="width: ${label_width};">Make</div></th>` +
                `<th><div class="table_text" style="width: ${value_width};">${make}</div></th>` +
                `</tr>`);
        $("#camera_specs_table").append(`<tr>` +
                `<th><div class="table_head" style="width: ${label_width};">Model</div></th>` +
                `<th><div class="table_text" style="width: ${value_width};">${model}</div></th>` +
                `</tr>`);


        if (make in camera_specs && model in camera_specs[make]) {

            let sensor_height = camera_specs[make][model]["sensor_height"];
            let sensor_width = camera_specs[make][model]["sensor_width"];
            let focal_length = camera_specs[make][model]["focal_length"];

            $("#camera_specs_table").append(`<tr>` +
                    `<th><div class="table_head" style="width: ${label_width};">Sensor Width</div></th>` +
                    `<th><div class="table_text" style="width: ${value_width};">${sensor_width}</div></th>` +
                    `</tr>`);
            $("#camera_specs_table").append(`<tr>` +
                    `<th><div class="table_head" style="width: ${label_width};">Sensor Height</div></th>` +
                    `<th><div class="table_text" style="width: ${value_width};">${sensor_height}</div></th>` +
                    `</tr>`);
            $("#camera_specs_table").append(`<tr>` +
                    `<th><div class="table_head" style="width: ${label_width};">Focal Length</div></th>` +
                    `<th><div class="table_text" style="width: ${value_width};">${focal_length}</div></th>` +
                    `</tr>`);

            $("#bottom_right").append(`<table class="transparent_table" id="missing_specs_table"></table>`);

            $("#missing_specs_table").append(`<tr>` +
            `<td style="height: 20px"></td>` +
            `</tr>`);

            $("#missing_specs_table").append(`<tr>` +
                `<td>` +
                `<button class="std-button std-button-hover" style="width: 220px; height: 30px;" ` +
                `onclick="edit_metadata('${make}', '${model}')">`+
                    `Edit Metadata</button>` +
                `</td>` +
                `</tr>`);


        }

        else {

            $("#bottom_right").append(`<table class="transparent_table" id="missing_specs_table"></table>`);

            $("#missing_specs_table").append(`<tr>` +
            `<td style="height: 20px"></td>` +
            `</tr>`);

            $("#missing_specs_table").append(`<tr>` +
            `<th><div class="table_head">This camera is not known to the system.</div></th>` +
            `</tr>`);

            $("#missing_specs_table").append(`<tr>` +
            `<td style="height: 10px"></td>` +
            `</tr>`);

            $("#missing_specs_table").append(`<tr>` +
                `<td>` +
                `<button class="std-button std-button-hover" style="width: 220px; height: 30px;" ` +
                `onclick="add_sensor_metadata('${make}', '${model}')">`+
                    `Add Metadata</button>` +
                `</td>` +
                `</tr>`);

        }

    }


    $("#left_section").append(
                `<table class="transparent_table" id="left_table">` +
                `<tr>` +
                `<td>` +
                `<button class="std-button std-button-hover" style="width: 220px; height: 50px;" onclick="annotate_request()">`+
                    `<span><i class="fa-regular fa-clone" style="margin-right:8px"></i>Annotate</span></button>` +
                `</td>` +
                `</tr>` +
                `</table>`);

    $("#top_left").append(`<div style="text-decoration: underline;">Annotations</div><br>`);
    $("#top_left").append(`<table class="transparent_table" id="annotation_stats_table"></table>`);

    $("#annotation_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Total</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${total_annotations}</div></th>` +
            `</tr>`);

    $("#bottom_left").append(`<div style="text-decoration: underline;">Images</div><br>`);
    $("#bottom_left").append(`<table class="transparent_table" id="image_stats_table"></table>`);

    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Total</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${total_images}</div></th>` +
            `</tr>`);  

    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Fully Annotated</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${completed}</div></th>` +
            `</tr>`);       
    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Partially Annotated</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${started}</div></th>` +
            `</tr>`);
    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Unannotated</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${unannotated}</div></th>` +
            `</tr>`);

            

    if (total_annotations == 0) {
        $("#left_table").append(
            `<tr style="height: 80px">` +
            `<td>` +
            `<button class="x-button x-button-hover" style="width: 220px; height: 35px;" onclick="delete_request()">`+
                `<span><i class="fa-regular fa-circle-xmark" style="margin-right:8px"></i>Delete Image Set</span></button>` +
            `</td>` +
            `</tr>`);
    
    }
}


function fetch_results(farm_name, field_name, mission_date) {

    $.post($(location).attr('href'),
    {
        action: "fetch_results",
        farm_name: farm_name,
        field_name: field_name,
        mission_date: mission_date,
    },
    function(response, status) {
        if (response.error) {
            $("#modal_header_text").html("Error");
            $("#modal_message").html("Error occurred while fetching image set results.");
            $("#result_modal").css("display", "block");
        }
        else {
            console.log("response", response);
            cur_results = response;
            if (viewing_results) {
                show_results();
            }
        }

    });

}

function show_error_message(head_text, body_text) {
    $("#modal_header_text").html(head_text);
    $("#modal_message").html(body_text);
    $("#result_modal").css("display", "block");
}

function delete_result(result_type, result_id) {

    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    $.post($(location).attr('href'),
    {
        action: "delete_result",
        farm_name: farm_name,
        field_name: field_name,
        mission_date: mission_date,
        result_type: result_type,
        result_id: result_id
    },
    function(response, status) {

        if (response.error) {
            show_error_message("Error", "An error occurred while deleting the result.");
        }
        fetch_results(farm_name, field_name, mission_date);
        //show_results();
    });
}

function show_results() {

    viewing_results = true;


    console.log("cur_results", cur_results);

    $("#tab_details").empty();

    $("#tab_details").append(`<div style="height: 40px"></div>`);
    $("#tab_details").append(`<div id="results_area" style="border-top: 1px solid white"></div>`);
    $("#results_area").append(
        `<ul class="nav" id="results_nav">` +
            `<li id="completed_results_tab_btn" class="nav">` +
                `<a class="nav"><span><i class="fa-solid fa-circle-check" style="margin-right: 3px"></i> Completed</span></a>` +
            `</li>` +
            `<li id="pending_results_tab_btn" class="nav">` +
                `<a class="nav"><span><i class="fa-solid fa-clock" style="margin-right: 3px"></i> Pending</span></a>` +
            `</li>` +
            `<li id="aborted_results_tab_btn" class="nav">` +
                `<a class="nav"><span><i class="fa-solid fa-circle-xmark" style="margin-right: 3px"></i> Aborted</span></a>` +
            `</li>` +
        `</ul>` +
        
        `<div id="completed_results" hidden><div style="height: 90px"></div>` +
        `<table class="transparent_table" style="padding-right: 20px">` +
            `<tr><td class="table_entry" style="font-weight: bold; width: 220px">Start Time</td>` +
                `<td class="table_entry" style="font-weight: bold; width: 220px">End Time</td>` +
                `<td class="table_entry" style="font-weight: bold; width: 180px">View Result</td>` +
                `<td class="table_entry" style="font-weight: bold; width: 180px">Delete Result</td>` +
            `</tr></table>` +
        `<div style="height: 375px; overflow-y: scroll">` +
        `<table class="transparent_table" id="completed_table"></table></div></div>` +

        `<div id="pending_results" hidden><div style="height: 90px"></div>` +
        `<table class="transparent_table" style="padding-right: 20px">` +
        `<tr><td class="table_entry" style="font-weight: bold; width: 220px">Start Time</td>` +
        `<td class="table_entry" style="font-weight: bold; width: 220px"></td></tr></table>` +
        `<div style="height: 375px; overflow-y: scroll">` +
        `<table class="transparent_table" id="pending_table"></table></div></div>` +

        `<div id="aborted_results" hidden><div style="height: 90px"></div>` +
        `<table class="transparent_table" style="padding-right: 20px">`+
        `<tr><td class="table_entry" style="font-weight: bold; width: 220px">Start Time</td>` +
        `<td class="table_entry" style="font-weight: bold; width: 220px">Aborted Time</td>` +
        `<td class="table_entry" style="font-weight: bold; width: 180px">View Error</td>` +
        `<td class="table_entry" style="font-weight: bold; width: 180px">Delete</td>` +
        `</tr></table>` +
        `<div style="height: 375px; overflow-y: scroll">` +
        `<table class="transparent_table" id="aborted_table"></table></div></div>`
    );
    let completed_results = cur_results.completed_results.sort(function(a, b) {
        return b["start_time"] - a["start_time"];
    });
    if (completed_results.length > 0) {
        for (result of completed_results) {
            let start_date = timestamp_to_date(result["start_time"]);
            let end_date = timestamp_to_date(result["end_time"]);
            $("#completed_table").append(
                `<tr>` +
                    `<td class="table_entry" style="width: 220px">` + start_date + `</td>` +
                    `<td class="table_entry" style="width: 220px">` + end_date + `</td>` +
                    `<td style="width: 180px"><div class="std-button std-button-hover" style="width: 100px" ` +
                        `onclick="view_result('${result["end_time"]}')"><i class="fa-solid fa-magnifying-glass-arrow-right"></i></div></td>` +
                    `<td style="width: 180px"><div class="x-button x-button-hover" style="width: 100px" ` +
                        `onclick="delete_result('completed', '${result["end_time"]}')"><i class="fa-regular fa-circle-xmark"></i></div></td>` +                        
                `</tr>`
            );
        }
    }
    else {
        $("#completed_results").empty();
        $("#completed_results").append(`<div style="height: 120px"></div>`);
        $("#completed_results").append(`<div>No Completed Results Found</div>`);
    }
    let pending_results = cur_results.pending_results.sort(function(a, b) {
        return b["start_time"] - a["start_time"];
    });
    if (pending_results.length > 0) {
        for (result of pending_results) {
            let start_date = timestamp_to_date(result["start_time"]);
            $("#pending_table").append(
                `<tr>` +
                    `<td class="table_entry" style="width: 220px">` + start_date + `</td>` +
                    `<td style="width: 220px"><div class="loader" style="width: 20px; height: 20px"></div></td>` +
                `</tr>`
            );
        }
    }
    else {
        $("#pending_results").empty();
        $("#pending_results").append(`<div style="height: 120px"></div>`);
        $("#pending_results").append(`<div>No Pending Results Found</div>`);
    }
    let aborted_results = cur_results.aborted_results.sort(function(a, b) {
        return b["start_time"] - a["start_time"];
    });
    if (aborted_results.length > 0) {
        for (result of aborted_results) {
            let start_date = timestamp_to_date(result["start_time"]);
            let aborted_date = timestamp_to_date(result["aborted_time"]);
            $("#aborted_table").append(
                `<tr>` +
                    `<td class="table_entry" style="width: 220px">` + start_date + `</td>` +
                    `<td class="table_entry" style="width: 220px">` + aborted_date + `</td>` +
                    `<td style="width: 180px"><div class="std-button std-button-hover" style="width: 100px" ` +
                        `onclick="show_error_message('Error Message', '${result["error_message"]}')"><i class="fa-solid fa-circle-info"></i></div></td>` +
                    `<td style="width: 180px"><div class="x-button x-button-hover" style="width: 100px" ` +
                        `onclick="delete_result('aborted', '${result["request_uuid"]}')"><i class="fa-regular fa-circle-xmark"></i></div></td>` +       
                `</tr>`
            );
        }
    }
    else {
        $("#aborted_results").empty();
        $("#aborted_results").append(`<div style="height: 120px"></div>`);
        $("#aborted_results").append(`<div>No Aborted Results Found</div>`);
    }



    $("#completed_results_tab_btn").click(function() {
        active_results_tab_btn = "completed_results_tab_btn";
        show_results_tab();
    });

    $("#pending_results_tab_btn").click(function() {
        active_results_tab_btn = "pending_results_tab_btn";
        show_results_tab();
    });

    $("#aborted_results_tab_btn").click(function() {
        active_results_tab_btn = "aborted_results_tab_btn";
        show_results_tab();
    });

    show_results_tab();

}

function view_result(timestamp) {
    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    window.location.href = "/plant_detection/viewer/" + username + "/" +
                           farm_name + "/" + field_name + "/" + mission_date + "/" + timestamp;

}

function show_image_set_details() {

    active_results_tab_btn = "completed_results_tab_btn";

    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    clearInterval(fetch_results_interval);
    fetch_results(farm_name, field_name, mission_date);
    fetch_results_interval = setInterval(function() { fetch_results(farm_name, field_name, mission_date); }, 30000); // 30 seconds

    $("#image_set_container").empty();

    $("#image_set_container").append(`<ul class="nav" id="image_set_tabs"></ul>`);

    $("#image_set_tabs").append(
        `<li id="overview_tab_btn" class="nav tab-btn-active" onclick="show_image_set_tab(this.id)">` +
        `<a class="nav"><span><i class="fa-regular fa-rectangle-list" style="margin-right:3px"></i> Overview</span></a></li>`);

    $("#image_set_tabs").append(
        `<li id="results_tab_btn" class="nav" onclick="show_image_set_tab(this.id)">` +
        `<a class="nav"><span><i class="fa-solid fa-chart-line" style="margin-right:3px"></i> Results</span></a></li>`);

    $("#image_set_container").append(`<div id="tab_details"></div>`);

    show_image_set_tab("overview_tab_btn");
        
}


function initialize_browse() {



    $("#farm_combo").empty();
    $("#field_combo").empty();
    $("#mission_combo").empty();
    $("#image_set_container").empty();

    for (farm_name of natsort(Object.keys(image_sets_data))) {
        $("#farm_combo").append($('<option>', {
            value: farm_name,
            text: farm_name
        }));
    }
    $("#farm_combo").prop("selectedIndex", -1);



    $("#farm_combo").change(function() {

        let farm_name = $(this).val();

        $("#field_combo").empty();
        $("#mission_combo").empty();
        $("#right_panel").empty();

        for (field_name of natsort(Object.keys(image_sets_data[farm_name]))) {
            $("#field_combo").append($('<option>', {
                value: field_name,
                text: field_name
            }));
        }
        $("#field_combo").val($("#field_combo:first").val()).change();
    });

    $("#field_combo").change(function() {

        let farm_name = $("#farm_combo").val();
        let field_name = $(this).val();

        $("#mission_combo").empty();
        $("#right_panel").empty();

        for (mission_date of natsort(image_sets_data[farm_name][field_name])) {
            $("#mission_combo").append($('<option>', {
                value: mission_date,
                text: mission_date
            }));
        }
        $("#mission_combo").val($("#mission_combo:first").val()).change();
    });
}

$(document).ready(function() {

    $("#browse_tab_btn").click(function() {
        if (!global_disabled)
            show_tab("browse_tab_btn");
    });

    $("#upload_tab_btn").click(function() {
        if (!global_disabled)
            show_tab("upload_tab_btn");
    });

    /*
    $("#train_baseline_tab_btn").click(function() {
        if (!global_disabled)
            show_tab("train_baseline_tab_btn");
    });*/



    $("#mission_combo").change(function() {
        show_image_set_details();
    });


    $("#modal_close").click(function() {
        $("#modal_button_container").remove();
        close_modal();
    });

    initialize_browse();
    initialize_upload();
    //initialize_train_baseline();

});
