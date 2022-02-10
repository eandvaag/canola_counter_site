
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

    $("#main_area").empty();
    $("#main_area").append(`<br>`);

    $("#main_area").append(`<div class="row"></div>`);
    $("#main_area").append(`<div class="col_left"><div class="col_label">Farm Name:</div></div>`);
    $("#main_area").append(`<div class="col_right"><select id="farm_combo" class="nonfixed_dropdown"></select></div>`);

    $("#main_area").append(`<div class="row"></div>`);
    $("#main_area").append(`<div class="col_left"><div class="col_label">Field Name:</div></div>`);
    $("#main_area").append(`<div class="col_right"><select id="field_combo" class="nonfixed_dropdown"></select></div>`);

    $("#main_area").append(`<div class="row"></div>`);
    $("#main_area").append(`<div class="col_left"><div class="col_label">Mission Date:</div></div>`);
    $("#main_area").append(`<div class="col_right"><select id="mission_combo" class="nonfixed_dropdown"></select></div>`);
    
    $("#main_area").append(`<br>`);
    $("#main_area").append(`<br>`);
    $("#main_area").append(`<br>`);
    
    $("#main_area").append(`<hr style="margin: 0px 0px">`);
    $("#main_area").append(`<div id="image_set_container">`);

    for (farm_name in image_sets_data) {
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

        for (field_name in image_sets_data[farm_name]) {
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

        for (mission_date in image_sets_data[farm_name][field_name]) {
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

    $("#tab_details").empty();
    $("#tab_details").append(
        `<button class="table_button table_button_hover" style="width: 200px" onclick="annotate_request()">`+
            `Annotate</button>`);
}

function show_train() {

    $("#tab_details").empty();
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

    console.log("found groups", image_sets_data[farm_name][field_name][mission_date]);

    let group_col_width = "300px";
    let started_col_width = "200px";
    let finished_col_width = "200px";

    $("#tab_details").empty();
    $("#tab_details").append(`<table class="transparent_table" id="image_set_table"></table>`);
    $("#image_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${group_col_width};">Groups</div></th>` +
            `<th><div class="table_header" style="width: ${started_col_width};">Started</div></th>` +
            `<th><div class="table_header" style="width: ${finished_col_width};">Finished</div></th>` +
            `<tr>`);
    for (group_uuid of image_sets_data[farm_name][field_name][mission_date]) {
        let group_url = "/plant_detection/usr/data/groups/" + group_uuid + ".json";
    
        let group_config = get_config(group_url);
        let group_config_str = JSON.stringify(group_config, null, 4);

        let group_name = group_config["group_name"];
        let start_time = group_config["start_time"];
        let end_time = group_config["end_time"];
        $("#image_set_table").append(`<tr>` +
        `<td><div class="table_button table_button_hover"` +
                `onclick="view_group('${group_uuid}')">${group_name}</div></td>` +
                `<td><div class="table_entry">${start_time}</div></td>` +   
                `<td><div class="table_entry">${end_time}</div></td>` +             
        //`<td><div>${extensionless_name}</div></td>` +
        //`<td><div class="table_entry">${image_status}</div></td>` +
        //`<td><div class="table_entry">${img_dataset}</div></td>` +
        `</tr>`);
    }

}

function view_group(group_uuid) {
    console.log("request to view group", group_uuid);


    $.post($(location).attr('href'),
    {
        farm_name: $("#farm_combo").val(),
        field_name: $("#field_combo").val(),
        mission_date: $("#mission_combo").val(),
        group_uuid: group_uuid,
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
        `<a class="nav"><span><i class="fa-regular fa-rectangle-list"></i> Overview</span></a></li>`);

    $("#image_set_tabs").append(
        `<li id="train_tab_btn" class="nav" onclick="show_image_set_tab(this.id)">` +
        `<a class="nav"><span><i class="fa-solid fa-bars-progress"></i> Train</span></a></li>`);

    $("#image_set_tabs").append(
        `<li id="results_tab_btn" class="nav" onclick="show_image_set_tab(this.id)">` +
        `<a class="nav"><span><i class="fa-solid fa-chart-line"></i> Results</span></a></li>`);
    $("#image_set_container").append(`<hr>`);

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
