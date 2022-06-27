global_disabled = false;
/*

function update_containers() {
    let width = $(window).width();
    if (width < 1000) {
        $("#home_container").removeClass("grid-container-2");
        $("#home_container").addClass("grid-container-1");
    }
    else {
        $("#home_container").removeClass("grid-container-1");
        $("#home_container").addClass("grid-container-2");     
    }
}*/


function delete_request() {
    $("#modal_header_text").html("Are you sure?");
    $("#modal_message").html("Are you sure you want to delete this image set?");
    $("#result_modal").css("display", "block");

    $("#modal_body").append(`<div id="modal_button_container">
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
            //console.log("error occurred");
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
        $("#browse").show();
    }
    else if (sel_tab_btn_id === "upload_tab_btn") {
        //show_upload();
        $("#upload").show();
    }
    else {
        //show_train_baseline();
        $("#train_baseline").show();
    }

}

function show_image_set_tab(sel_tab_btn_id) {

    //let tab_btn_id = tab_btn.id;
    let image_set_tab_ids = [
        "overview_tab_btn",
        //"train_tab_btn",
        "results_tab_btn"
    ];
    /*
    let tabs = [];//["default_tab"];
    for (let i = 0; i < image_set_tab_ids; i++) {
        tabs.push(image_set_tab_ids[i]));
    }*/

    //let sel_tab = tab_btn_id.substring(0, tab_btn_id.length - 4);
    let sel_tab_id = sel_tab_btn_id.substring(0, sel_tab_btn_id.length - 4);

    for (tab_btn_id of image_set_tab_ids) {
        let tab_id = tab_btn_id.substring(0, tab_btn_id.length - 4);
        $("#" + tab_id).hide();
        $("#" + tab_btn_id).removeClass("tab-btn-active");
    }

    $("#" + sel_tab_btn_id).addClass("tab-btn-active");
    /*
    console.log("showing", sel_tab);
    $("#" + sel_tab).show();*/

    if (sel_tab_btn_id === "overview_tab_btn") {
        show_overview();
    }
    /*
    else if (sel_tab_btn_id === "train_tab_btn") {
        show_train();
    }*/
    else {
        show_results();
    }
}


function show_overview() {

    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();
    let job_url = "/plant_detection/usr/data/image_sets/" + farm_name + "/" + field_name + 
                    "/" + mission_date + "/annotations/annotations_w3c.json";
    let metadata_url = "/plant_detection/usr/data/image_sets/" + farm_name + "/" + field_name + 
                    "/" + mission_date + "/metadata/metadata.json";

    let annotations = get_json(job_url);
    let metadata = get_json(metadata_url);

    //annotations = JSON.stringify(annotations, null, 4);
    let total_annotations = 0;
    let total_images = 0;
    let completed = 0;
    let started = 0;
    let unannotated = 0;
    for (img_name in annotations) {
        total_annotations += annotations[img_name]["annotations"].length;
        total_images += 1;
        if (annotations[img_name]["status"] === "completed") {
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
    //$("#tab_details").append()
    //$("#tab_details").append(`<div style="height: 150px"></div>`);

    $("#tab_details").append(`<table class="transparent_table" style="height: 500px; width: 90%" id="image_set_table"></table>`);

    $("#image_set_table").append(`<tr>`+
    `<th style="width: 50%;" id="left_section">` +
        // `<table class="transparent_table" >` +
        //     `<tr style="height: 250px">` +
        //         `<th id="top_left"></th>` +
        //     `</tr>` +
        //     `<tr style="height: 250px">` +
        //         `<th id="bottom_left"></th>` +
        //     `</tr>` +
        // `</table>` +
    `</th>` +
    `<th style="width: 50%;" id="right_section">` +
        `<div style="height: 100px"></div>` +
        `<table id="right_table">` +
            `<tr id="top_row" style="height: 160px">` +
                `<th id="top_left" style="vertical-align: top;"></th>` +
                `<th id="top_right" style="vertical-align: top"></th>` +
            `</tr>` +
            `<tr id="bottom_row" style="height: 240px">` +
                `<th id="bottom_left" style="vertical-align: top;"></th>` +
                `<th id="bottom_right" style="vertical-align: top"></th>` +
            `</tr>` +
        `</table>` +
    `</th>` +
    // `<th style="width: 50%;" id="right_section">` +
    //     // `<table class="transparent_table" id="right_table">` +
    //     //     `<tr style="height: 250px">` +
    //     //         `<th id="top_right"></th>` +
    //     //     `</tr>` +
    //     //     `<tr style="height: 250px">` +
    //     //         `<th id="bottom_right"></th>` +
    //     //     `</tr>` +
    //     // `</table>` +
    // `</th>` +
    `<tr>`);
    //$("#tab_details").append(`<table class="transparent_table" id="image_set_table"></table>`);

    // $("#right_section").append(
    //     `<button class="std-button std-button-hover" style="width: 220px; height: 50px; margin:auto" onclick="annotate_request()">`+
    //         `<span><i class="fa-regular fa-clone" style="margin-right:8px"></i> Annotate</span></button>`);

    
    

    let make = metadata["camera_info"]["make"];
    let model = metadata["camera_info"]["model"];
    let sensor_height;
    let sensor_width;
    let focal_length;
    if (make in camera_specs && model in camera_specs[make]) {
        sensor_height = camera_specs[make][model]["sensor_height"];
        sensor_width = camera_specs[make][model]["sensor_width"];
        focal_length = camera_specs[make][model]["focal_length"];
    }
    else {
        make = "???";
        model = "???";
        sensor_height = "???";
        sensor_width = "???";
        focal_length = "???";
    }
    let flight_height = metadata["flight_height"];
    if (flight_height == "unknown") {
        flight_height = "???";
    }
    else {
        flight_height = flight_height + " m";
    }
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
            `<th><div class="table_head" style="width: ${label_width};">Flight height</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${flight_height}</div></th>` +
            `<tr>`);
    $("#flight_info_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Georeferenced</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${is_georeferenced}</div></th>` +
            `<tr>`);        

            
    $("#bottom_right").append(`<div style="text-decoration: underline;">Camera Specs</div><br>`);


    $("#bottom_right").append(`<table class="transparent_table" id="camera_specs_table"></table>`);
    $("#camera_specs_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Make</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${make}</div></th>` +
            `<tr>`);
    $("#camera_specs_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Model</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${model}</div></th>` +
            `<tr>`);
    $("#camera_specs_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Sensor height</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${sensor_height}</div></th>` +
            `<tr>`);
    $("#camera_specs_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Sensor width</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${sensor_width}</div></th>` +
            `<tr>`);
    $("#camera_specs_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Focal length</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${focal_length}</div></th>` +
            `<tr>`);


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
            `<tr>`);

    //$("#middle_section").append(`<br><hr style="width: 80%"><br>`);
    $("#bottom_left").append(`<div style="text-decoration: underline;">Images</div><br>`);
    $("#bottom_left").append(`<table class="transparent_table" id="image_stats_table"></table>`);

    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Total</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${total_images}</div></th>` +
            `<tr>`);  

    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Fully annotated</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${completed}</div></th>` +
            `<tr>`);       
    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Partially annotated</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${started}</div></th>` +
            `<tr>`);
    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Unannotated</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${unannotated}</div></th>` +
            `<tr>`);

            

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


function show_results() {

    let job_col_width = "500px";


    $.post($(location).attr('href'),
    {
        action: "fetch_results",
        farm_name: $("#farm_combo").val(),
        field_name: $("#field_combo").val(),
        mission_date: $("#mission_combo").val(),
    },
    function(response, status) {

        console.log("response", response);

        if (response.results.length > 0) {
            response.results.sort().reverse();

            $("#tab_details").empty();
            $("#tab_details").append(`<div style="height: 120px"></div>`);
            $("#tab_details").append(`<table class="transparent_table" id="image_set_table_head"></table>`);
            for (result of response.results) {
                let date = timestamp_to_date(result);
                
                $("#image_set_table_head").append(`<tr>` +

                `<td><div class="std-button std-button-hover" style="width: ${job_col_width};" ` +
                    `onclick="view_result('${result}')"><span>${date}</span></div></td>` +
                    `</tr>`);
            }
        }
        else {
            $("#tab_details").empty();
            $("#tab_details").append(`<div style="height: 120px"></div>`);
            $("#tab_details").append(`<div>No Results Found</div>`);
        }
    });

}

function view_result(timestamp) {
    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    window.location.href = "/plant_detection/viewer/" + 
                           farm_name + "/" + field_name + "/" + mission_date + "/" + timestamp;

}

function show_image_set_details() {

    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();
/*
    let img_set_url = "/plant_detection/usr/data/image_sets/" + 
                        farm_name + "/" + field_name + "/" + mission_date + "/" +
                        "image_set_data.json";

    let cur_img_set_config = get_json(img_set_url);

*/
    $("#image_set_container").empty();

    $("#image_set_container").append(`<ul class="nav" id="image_set_tabs"></ul>`);

    $("#image_set_tabs").append(
        `<li id="overview_tab_btn" class="nav tab-btn-active" onclick="show_image_set_tab(this.id)">` +
        `<a class="nav"><span><i class="fa-regular fa-rectangle-list" style="margin-right:3px"></i> Overview</span></a></li>`);
/*
    $("#image_set_tabs").append(
        `<li id="train_tab_btn" class="nav" onclick="show_image_set_tab(this.id)">` +
        `<a class="nav"><span><i class="fa-solid fa-play" style="margin-right:3px"></i> Train</span></a></li>`);
*/
    $("#image_set_tabs").append(
        `<li id="results_tab_btn" class="nav" onclick="show_image_set_tab(this.id)">` +
        `<a class="nav"><span><i class="fa-solid fa-chart-line" style="margin-right:3px"></i> Results</span></a></li>`);
    /*$("#image_set_container").append(`<hr>`);*/

    $("#image_set_container").append(`<div id="tab_details"></div>`);

    show_image_set_tab("overview_tab_btn");

/*
    $("#scrollable_training_area").append(
        `<div id=${sequence_id} style="display: none"></div>`);

    $("#overview_id").append(
        `<button class="table_button table_button_hover" onclick="annotate_request()">`+
            `Annotate</button>`);

*/
        
}


/*
                                    button(id="save_button" class="table_button table_button_hover")

                                    i(id="save_icon" class="fa-solid fa-floppy-disk" style="padding-right: 8px; color: white")
                                    |
                                    | Save All Changes
                                    */
/*
    $("#right_panel").append(`<button id="annotate_button" class="std-button std-button-hover" `+
                               `onclick="annotate_request()">`+
                                `<span>Annotate</span></button>`);*/


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

    //update_containers();


    $("#browse_tab_btn").click(function() {
        if (!global_disabled)
            show_tab("browse_tab_btn");
    });

    $("#upload_tab_btn").click(function() {
        if (!global_disabled)
            show_tab("upload_tab_btn");
    });

    $("#train_baseline_tab_btn").click(function() {
        if (!global_disabled)
            show_tab("train_baseline_tab_btn");
    });


    $("#mission_combo").change(function() {
        show_image_set_details();
    });


    $("#modal_close").click(function() {
        $("#modal_button_container").remove();
        close_modal();
    });

    initialize_browse();
    initialize_upload();
    initialize_train_baseline();

});
