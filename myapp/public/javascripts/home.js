
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
    $("#modal_message").html("Deleting the image set will remove all the images and annotations." +
                             "<br><br>Are you sure you want to delete this image set?");
    $("#result_modal").css("display", "block");

    $("#modal_body").append(`<div id="modal_button_container">
        <button id="confirm_delete" class="x-button x-button-hover" `+
        `style="width: 200px" onclick="confirm_delete_request()"><span>Delete</span></button>` +
        `<button id="cancel_delete" class="std-button std-button-hover" ` +
        `style="width: 200px" onclick="cancel_delete_request()"><span>Cancel</span></button>` +
        `</div>`);
}

function confirm_delete_request() {
    console.log("really deleting the image set");
    $.post($(location).attr('href'),
    {
        action: "delete_image_set",
        farm_name: $("#farm_combo").val(),
        field_name: $("#field_combo").val(),
        mission_date: $("#mission_combo").val(),
    },
    function(response, status) {
        if (response.error) { 
            console.log("error occurred", response.error);
        }
        else {
            console.log("successful deletion!");
            window.location.href = response.redirect;
        }
    });
}

function cancel_delete_request() {
    $("#modal_button_container").remove();
    close_modal();
}


function annotate_request() {

    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    window.location.href = "/plant_detection/annotate/" + farm_name + "/" +
                           field_name + "/" + mission_date;

/*
    $.post($(location).attr('href'),
    {
        farm_name: farm_name,
        field_name: field_name,
        mission_date: mission_date
    },
    function(response, status) {
        if (response.error) { 
            console.log(response.error);
        }
        else {
            window.location.href = response.redirect;
        }
    });
*/
}

function show_browse() {

    let left_col_width = "100px";
    let right_col_width = "250px";

    $("#main_area").empty();
    $("#main_area").append(`<br><br><br>`);

    $("#main_area").append(`<table class="transparent_table" id="combo_table"></table>`);
    $("#combo_table").append(`<tr>` +
        `<th><div class="table_head" style="width: ${left_col_width};">Farm Name:</div></th>` +
        `<th><div style="width: ${right_col_width};"><select id="farm_combo" class="nonfixed_dropdown"></select></div></th>` +
    `<tr>`);

    $("#combo_table").append(`<tr>` +
        `<th><div class="table_head" style="width: ${left_col_width};">Field Name:</div></th>` +
        `<th><div style="width: ${right_col_width};"><select id="field_combo" class="nonfixed_dropdown"></select></div></th>` +
    `<tr>`);

    $("#combo_table").append(`<tr>` +
    `<th><div class="table_head" style="width: ${left_col_width};">Mission Date:</div></th>` +
    `<th><div style="width: ${right_col_width};"><select id="mission_combo" class="nonfixed_dropdown"></select></div</th>` +
    `<tr>`);

    /*
    $("#main_area").append(`<div class="row"></div>`);
    $("#main_area").append(`<div class="col_left"><div class="col_label">Farm Name:</div></div>`);
    $("#main_area").append(`<div class="col_right"><select id="farm_combo" class="nonfixed_dropdown"></select></div>`);

    $("#main_area").append(`<div class="row"></div>`);
    $("#main_area").append(`<div class="col_left"><div class="col_label">Field Name:</div></div>`);
    $("#main_area").append(`<div class="col_right"><select id="field_combo" class="nonfixed_dropdown"></select></div>`);

    $("#main_area").append(`<div class="row"></div>`);
    $("#main_area").append(`<div class="col_left"><div class="col_label">Mission Date:</div></div>`);
    $("#main_area").append(`<div class="col_right"><select id="mission_combo" class="nonfixed_dropdown"></select></div>`);
    */
    $("#main_area").append(`<br>`);
    
    $("#main_area").append(`<hr style="margin: 0px 0px">`);
    $("#main_area").append(`<div id="image_set_container">`);

    for (farm_name of natsort(Object.keys(image_sets_data))) {
        $("#farm_combo").append($('<option>', {
            value: farm_name,
            text: farm_name
        }));
    }
    $("#farm_combo").prop("selectedIndex", -1);



    $("#farm_combo").change(function() {
        console.log("farm combo changed");

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

        for (mission_date of natsort(Object.keys(image_sets_data[farm_name][field_name]))) {
            $("#mission_combo").append($('<option>', {
                value: mission_date,
                text: mission_date
            }));
        }
        $("#mission_combo").val($("#mission_combo:first").val()).change();
    });

    $("#mission_combo").change(function() {
        show_image_set_details();
    });


    $("#modal_close").click(function() {
        console.log("closing modal");
        $("#modal_button_container").remove();
        close_modal();
    });
}


function show_tab(sel_tab_btn_id) {

    let tab_ids = [
        "browse_tab_btn",
        "upload_tab_btn"
    ];

    let sel_tab_id = sel_tab_btn_id.substring(0, sel_tab_btn_id.length - 4);

    for (tab_btn_id of tab_ids) {
        let tab_id = tab_btn_id.substring(0, tab_btn_id.length - 4);
        $("#" + tab_id).hide();
        $("#" + tab_btn_id).removeClass("tab-btn-active");
    }

    $("#" + sel_tab_btn_id).addClass("tab-btn-active");

    if (sel_tab_btn_id === "browse_tab_btn") {
        show_browse();
    }
    else {
        show_upload();
    }

}

function show_image_set_tab(sel_tab_btn_id) {

    //let tab_btn_id = tab_btn.id;
    console.log("sel_tab_btn_id", sel_tab_btn_id);
    let image_set_tab_ids = [
        "overview_tab_btn",
        "train_tab_btn",
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
    else if (sel_tab_btn_id === "train_tab_btn") {
        show_train();
    }
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
        
    let annotations = get_config(job_url);
    //annotations = JSON.stringify(annotations, null, 4);

    console.log("annotations", annotations);
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

    $("#tab_details").append(`<table class="transparent_table" style="height: 500px" id="image_set_table"></table>`);

    $("#image_set_table").append(`<tr>`+
    `<th style="width: 750px;"><div id="annotate_section"></th>` +
    `<th style="width: 750px;"><div id="stats_section"></div></th>` +
    `<tr>`);
    //$("#tab_details").append(`<table class="transparent_table" id="image_set_table"></table>`);

    $("#stats_section").append(`<div style="text-decoration: underline;">Annotations</div><br>`);
    $("#stats_section").append(`<table class="transparent_table" id="annotation_stats_table"></table>`);

    $("#annotation_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Total</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${total_annotations}</div></th>` +
            /*`<th><div class="table_entry" style="width: ${finished_col_width};">Finished</div></th>` +*/
            `<tr>`);

    $("#stats_section").append(`<br><hr style="width: 80%"><br>`);
    $("#stats_section").append(`<div style="text-decoration: underline;">Images</div><br>`);
    $("#stats_section").append(`<table class="transparent_table" id="image_stats_table"></table>`);

    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Total</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${total_images}</div></th>` +
            /*`<th><div class="table_entry" style="width: ${finished_col_width};">Finished</div></th>` +*/
            `<tr>`);  

    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Fully annotated</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${completed}</div></th>` +
            /*`<th><div class="table_entry" style="width: ${finished_col_width};">Finished</div></th>` +*/
            `<tr>`);       
    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Partially annotated</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${started}</div></th>` +
            /*`<th><div class="table_entry" style="width: ${finished_col_width};">Finished</div></th>` +*/
            `<tr>`);
    $("#image_stats_table").append(`<tr>` +
            `<th><div class="table_head" style="width: ${label_width};">Unannotated</div></th>` +
            `<th><div class="table_text" style="width: ${value_width};">${unannotated}</div></th>` +
            /*`<th><div class="table_entry" style="width: ${finished_col_width};">Finished</div></th>` +*/
            `<tr>`);
    $("#annotate_section").append(
        `<button class="std-button std-button-hover" style="width: 220px; height: 50px;" onclick="annotate_request()">`+
            `<span><i class="fa-regular fa-clone" style="margin-right:8px"></i> Annotate</span></button>`);
    $("#annotate_section").append(`<br><br>`);
    $("#annotate_section").append(
        `<button class="x-button x-button-hover" style="width: 220px; height: 35px;" onclick="delete_request()">`+
            `<span><i class="fa-regular fa-circle-xmark" style="margin-right:8px"></i> Delete Image Set</span></button>`);

}


function get_config(url) {
    let config;
    $.ajax({
        url: url,
        async: false,
        dataType: 'json',
        success: function (r_config) {
            config = r_config;
        }
    });
    return config;
}


function show_results() {

    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    console.log("found jobs", image_sets_data[farm_name][field_name][mission_date]);

    let job_col_width = "200px";
    let started_col_width = "180px";
    let finished_col_width = "180px";


    let job_recs = [];
    for (job_uuid of image_sets_data[farm_name][field_name][mission_date]) {
        let job_url = "/plant_detection/usr/data/jobs/" + job_uuid + ".json";
    
        let job_config = get_config(job_url);

        if ("end_time" in job_config) {
            let job_config_str = JSON.stringify(job_config, null, 4);

            let job_rec = {
                "job_uuid": job_config["job_uuid"],
                "job_name": job_config["job_name"],
                "start_time": job_config["start_time"],
                "end_time": job_config["end_time"]
            }
            job_recs.push(job_rec);

        }
    }

    $("#tab_details").empty();
    $("#tab_details").append(`<div style="height: 120px"></div>`);
    //$("#tab_details").append(`<br>`);
    if (job_recs.length > 0) {
        $("#tab_details").append(`<table class="transparent_table" style="height: 380px" id="image_set_table"></table>`);
        $("#image_set_table").append(`<tr>` +
                `<th><div class="table_header" style="width: ${job_col_width};">Job Name</div></th>` +
                `<th><div class="table_header" style="width: ${started_col_width};">Started</div></th>` +
                `<th><div class="table_header" style="width: ${finished_col_width};">Finished</div></th>` +
                `<tr>`);

        for (job_rec of job_recs) {
            let job_uuid = job_rec["job_uuid"];
            let job_name = job_rec["job_name"];
            let start_time = job_rec["start_time"];
            let end_time = job_rec["end_time"];
            $("#image_set_table").append(`<tr>` +
            `<td><button class="std-button std-button-hover" ` +
                    `onclick="view_job('${job_uuid}')"><span>${job_name}</span></button></td>` +
                    `<td><div class="table_center_text">${start_time}</div></td>` +   
                    `<td><div class="table_center_text">${end_time}</div></td>` +
            `</tr>`);
        }
    }
    else {
        $("#tab_details").append(`<div>No Results Found</div>`);
    }

}

function view_job(job_uuid) {
    console.log("request to view job", job_uuid);


    $.post($(location).attr('href'),
    {
        action: "view_job",
        farm_name: $("#farm_combo").val(),
        field_name: $("#field_combo").val(),
        mission_date: $("#mission_combo").val(),
        job_uuid: job_uuid,
    },
    function(response, status) {
        if (response.error) { 
            console.log("error occurred", response.error);
        }
        else {
            window.location.href = response.redirect;
        }
    });
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

    $("#image_set_tabs").append(
        `<li id="train_tab_btn" class="nav" onclick="show_image_set_tab(this.id)">` +
        `<a class="nav"><span><i class="fa-solid fa-play" style="margin-right:3px"></i> Train</span></a></li>`);

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




$(document).ready(function() {

    //update_containers();

    console.log("image_sets_data", image_sets_data);

    show_browse();




/*
    $(window).resize(function() {
        update_containers();
    });*/






});
