let valid_filter_values;
let applied_filters;

let viewers = {};
//let annos = {};
let overlays = {};
let annotations = {};
let regions = {};
let cur_bounds = {};

//let object_col_width = "150px";
//let username_col_width = "100px";
//let image_set_col_width = "100%";
//let inspect_button_width = "80px";
//let add_button_width = "80px"; 
//let remove_button_width = "80px";

let added_image_sets = [];

const MODEL_NAME_FORMAT = /[\s `!@#$%^&*()+\=\[\]{}.;':"\\|,<>\/?~]/;

let sort_options = [
    {"text": "Object Name", "value": "object_name"}, 
    {"text": "Set Owner", "value": "set_owner"},
    {"text": "Set Name", "value": "set_name"}
];

function set_filters() {

    valid_filter_values = {};
    applied_filters = {};
    let filter_keys = ["username", "farm_name", "field_name", "mission_date", "object_name"];

    for (let key of filter_keys) {
        applied_filters[key] = "-- All --";

        let values = [];
        if (key === "username") {
            for (let username of Object.keys(available_image_sets)) {
                values.push(username);
            }
        }
        else if (key === "farm_name") {
            for (let username of Object.keys(available_image_sets)) {
                for (let farm_name of Object.keys(available_image_sets[username])) {
                    values.push(farm_name);
                }
            }
        }
        else if (key === "field_name") {
            for (let username of Object.keys(available_image_sets)) {
                for (let farm_name of Object.keys(available_image_sets[username])) {
                    for (let field_name of Object.keys(available_image_sets[username][farm_name])) {
                        values.push(field_name);
                    }
                }
            }
        }
        else if (key === "mission_date") {
            for (let username of Object.keys(available_image_sets)) {
                for (let farm_name of Object.keys(available_image_sets[username])) {
                    for (let field_name of Object.keys(available_image_sets[username][farm_name])) {
                        for (let mission_date of Object.keys(available_image_sets[username][farm_name][field_name])) {
                            values.push(mission_date.substring(0, 4));
                        }
                    }
                }
            }
        }
        else if (key === "object_name") {
            for (let username of Object.keys(available_image_sets)) {
                for (let farm_name of Object.keys(available_image_sets[username])) {
                    for (let field_name of Object.keys(available_image_sets[username][farm_name])) {
                        for (let mission_date of Object.keys(available_image_sets[username][farm_name][field_name])) {
                            values.push(available_image_sets[username][farm_name][field_name][mission_date]["object_name"]);
                        }
                    }
                }
            }
        }



        values = [... new Set(values)];
        values = natsort(values);

        valid_filter_values[key] = values;
    }
}

function train_form_is_complete() {
    let inputs_to_check = ["model_name_input"];

    for (let input of inputs_to_check) {
        let input_val = $("#" + input).val();
        let input_length = input_val.length;
        if ((input_length < 3) || (input_length > 50)) {
            return false;
        }

        if (MODEL_NAME_FORMAT.test(input_val)) {
            return false;
        }

        if (input_val === "random_weights") {
            return false;
        }
    }
    if (added_image_sets.length == 0) {
        return false;
    }


    /*
    let num_image_sets = 0;
    $("#added_image_sets tr").each(function() {
        num_image_sets++;
    });*/

    let model_object = $("#model_object_input").val();
    if (!(objects["object_names"].includes(model_object))) {
        return false;
    }
/*
    if (num_image_sets == 0) {
        return false;
    }*/
    return true;
}


function update_train_form() {
    if (train_form_is_complete()) {
        enable_std_buttons(["submit_training_request"]);
    }
    else {
        disable_std_buttons(["submit_training_request"]);
    }
}



function show_train_tab(sel_tab_btn_id) {

    let image_set_tab_ids = [
        "submit_train_tab_btn",
        "available_train_tab_btn",
        "pending_train_tab_btn",
        "aborted_train_tab_btn"
    ];

    for (let tab_btn_id of image_set_tab_ids) {
        let tab_id = tab_btn_id.substring(0, tab_btn_id.length - 4);
        $("#" + tab_id).hide();
        $("#" + tab_btn_id).removeClass("tab-btn-active");
    }

    $("#" + sel_tab_btn_id).addClass("tab-btn-active");

    if (sel_tab_btn_id === "submit_train_tab_btn") {
        show_submit_train();
    }
    else if (sel_tab_btn_id === "available_train_tab_btn") {
        show_available_train();
    }
    else if (sel_tab_btn_id === "pending_train_tab_btn") {
        show_pending_train();
    }
    else {
        show_aborted_train();
    }
}

function show_submit_train() {
    viewing["train"] = "submit";
    $("#available_train_tab").hide();
    $("#pending_train_tab").hide();
    $("#aborted_train_tab").hide();
    $("#submit_train_tab").show("fast", function() {
        for (let id_prefix of ["inspect", "target"]) {
            if (id_prefix in viewers) {
                viewers[id_prefix].viewport.goHome();
            }
        }
    });
}



function show_pending_train() {
    viewing["train"] = "pending";
    $("#submit_train_tab").hide();
    $("#available_train_tab").hide();
    $("#aborted_train_tab").hide();
    $("#pending_train_tab").show();

    $("#pending_models_head").empty();
    $("#pending_models").empty();

    $.post($(location).attr('href'),
    {
        action: "fetch_my_models",
        model_state: "pending"
    },
    function(response, status) {

        if (response.error) {
            show_modal_message(`Error`, response.message);
        }
        else {
            
            if (response.models.length == 0) {
                $("#pending_models").append(
                    `<div>No Pending Models Found</div>`
                    // `<tr>` +
                    //     `<td><div>No Pending Models Found</div></td>` +
                    // `</tr>`
                );

            }
            else {

                // let model_name_width = "300px";
                // let model_public_width = "300px";
                // let model_loader_width = "300px";

                let models = response.models.sort(function(a, b) {
                    return b["log"]["model_name"] - a["log"]["model_name"];
                });

                $("#pending_models").append(
                    `<div class="scrollable_area" style="border-radius: 10px; height: 550px; width: 1200px; margin: 0 auto; overflow-y: scroll">` +
                        `<table id="pending_models_table" style="border-collapse: collapse"></table>` +
                    `</div>`
                );


                // $("#pending_models_head").append(
                //     `<tr>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_name_width}">Model Name</td>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_public_width}">Public?</td>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_loader_width}"></td>` +
                //     `</tr>`
                // );

                for (let model of models) {

                    create_model_entry(model["log"], "pending");
                    /*
                    let model_name = model["model_name"];
                    let is_public = model["public"] ? "Yes" : "No";


                    $("#pending_models").append(
                        `<tr>` +
                            `<td class="table_entry" style="width: ${model_name_width};">${model_name}</td>` +
                            `<td class="table_entry" style="width: ${model_public_width};">${is_public}</td>` +
                            `<td style="width: ${model_loader_width};">` +
                                `<div class="loader" style="width: 20px; height: 20px"></div>` +
                            `</td>` +
                        `</tr>`
                    );*/
                }
            }

        }
    });
}

function show_aborted_train() {
    viewing["train"] = "aborted";
    $("#submit_train_tab").hide();
    $("#available_train_tab").hide();
    $("#pending_train_tab").hide();
    $("#aborted_train_tab").show();

    $("#aborted_models_head").empty();
    $("#aborted_models").empty();


    $.post($(location).attr('href'),
    {
        action: "fetch_my_models",
        model_state: "aborted"
    },
    function(response, status) {

        if (response.error) {
            show_modal_message(`Error`, response.message);
        }
        else {
            
            if (response.models.length == 0) {
                $("#aborted_models").append(
                    `<div>No Aborted Models Found</div>`
                    // `<tr>` +
                    //     `<td><div>No Aborted Models Found</div></td>` +
                    // `</tr>`
                );

            }
            else {
                // let model_name_width = "300px";
                // let model_aborted_time_width = "300px";
                // let model_error_message_width = "300px";
                // let model_destroy_width = "300px"
                // let button_width = "100px";

                let models = response.models.sort(function(a, b) {
                    return b["log"]["model_name"] - a["log"]["model_name"];
                });

                $("#aborted_models").append(
                    `<div class="scrollable_area" style="border-radius: 10px; height: 550px; width: 1200px; margin: 0 auto; overflow-y: scroll">` +
                        `<table id="aborted_models_table" style="border-collapse: collapse"></table>` +
                    `</div>`
                );


                // $("#aborted_models_head").append(
                //     `<tr>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_name_width}">Model Name</td>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_aborted_time_width}">Aborted Time</td>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_error_message_width}">Error Message</td>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_destroy_width}">Destroy Model</td>` +
                //     `</tr>`
                // );

                for (let model of models) {

                    create_model_entry(model["log"], "aborted");
                    //let model_name = model["model_name"];
                    //let aborted_date = timestamp_to_date(model["aborted_time"]);
                    //let is_public = model["public"] ? "Yes" : "No";

/*
                    $("#aborted_models").append(
                        `<tr>` +
                            `<td class="table_entry" style="width: ${model_name_width};">${model_name}</td>` +
                            `<td class="table_entry" style="width: ${model_aborted_time_width};">${aborted_date}</td>` +
                            `<td style="width: ${model_error_message_width}">` +
                                `<div class="std-button std-button-hover" style="width: ${button_width}" ` +
                                    `onclick="show_modal_message('Error Message', \`${model["error_message"]}\`)">` +
                                    `<i class="fa-solid fa-circle-info"></i>` +
                                `</div>` +
                            `</td>` +
                            `<td style="width: ${model_destroy_width};"><button class="x-button x-button-hover" style="width: ${button_width}" ` +
                                `onclick="destroy_model_request('aborted', '${model_name}')"><i class="fa-regular fa-circle-xmark"></i></button>` +
                        `</td>` +
                        `</tr>`
                    );*/
                }
            }

        }
    });

}

function destroy_model_request(model_state, model_name) {


    show_modal_message(`Are you sure?`, `<div style="height: 30px">Are you sure you want to destroy this model?</div>` +
        `<div style="height: 20px"></div>` +
        `<div id="modal_button_container" style="text-align: center">` +
        `<button id="confirm_delete" class="x-button x-button-hover" `+
        `style="width: 150px" onclick="confirmed_model_destroy_request('${model_state}', '${model_name}')">Destroy</button>` +
        `<div style="display: inline-block; width: 10px"></div>` +
        `<button id="cancel_delete" class="std-button std-button-hover" ` +
        `style="width: 150px" onclick="close_modal()">Cancel</button>` +
        `<div style="height: 20px" id="loader_container"></div>` +
        `</div>`
    );

}

function confirmed_model_destroy_request(model_state, model_name) {

    $("#modal_close").off('click').on('click', function() {
        // do nothing
    });

    disable_x_buttons(["confirm_delete"]);
    disable_std_buttons(["cancel_delete"]);
    $("#loader_container").append(
        `<div class="loader"></div>`
    );

    
    $.post($(location).attr('href'),
    {
        action: "destroy_model",
        model_name: model_name,
        model_state: model_state
    },
    function(response, status) {

        if (response.error) {
            show_modal_message(`Error`, response.message);
            $("#modal_close").off('click').on('click', function() {
                close_modal();
            });
            
            //$("#modal_header_text").html("Error");
            //$("#modal_message").html(response.message);
            //$("#result_modal").css("display", "block");
        }
        else {
            close_modal();
            if (viewing["train"] === "available") {
                show_available_train();
            }
            else if (viewing["train"] === "aborted") {
                show_aborted_train();
            }
            //window.location.href = response.redirect;
        }
    });



}

function create_model_entry(model_log, model_status) {

    let model_name = model_log["model_name"];
    let is_public = capitalizeFirstLetter(model_log["public"]); //["public"] ? "Yes" : "No";
    let model_object = model_log["model_object"];


    let start_date;
    start_date = timestamp_to_date(model_log["submission_time"]);

    let disp_end_title; 
    let disp_end_date;
    if (model_status === "available") {
        disp_end_date = timestamp_to_date(model_log["training_end_time"]);
        disp_end_title = "End Time";
    }
    else if (model_status === "aborted") {
        disp_end_date = timestamp_to_date(model_log["aborted_time"]);
        disp_end_title = "Aborted Time";
    }
    else {
        disp_end_date = " ";
        disp_end_title = " ";
    }



    // let time_info = 
    // `<table style="font-size: 14px">` +
    //     `<tr>` +
    //             `<td style="height: 18px; text-align: right">` +
    //                 `<div style="color: #ddccbb; font-weight: 400; width: 120px">Training Start Time</div>` +
    //             `</td>` + 
    //             `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
    //                 `<div>${start_date}</div>` +
    //             `</td>` +
    //     `</tr>` +
    //     `<tr>` +
    //             `<td style="height: 18px; text-align: right">` +
    //                 `<div style="color: #ddccbb; font-weight: 400; width: 120px">${disp_end_title}</div>` +
    //             `</td>` + 
    //             `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
    //                 `<div>${disp_end_date}</div>` +
    //             `</td>` + 
    //     `</tr>` +
    // `</table>`;
    let row_uuid = uuidv4();
    let destroy_button_container_id = row_uuid + "_destroy_button_container";
    let error_button_container_id = row_uuid + "_error_button_container";


    let template = 
        `<tr style="border-bottom: 1px solid #4c6645; height: 70px">` +
            `<td><div style="width: 15px"></div></td>` + 
            `<td>` +
                `<table style="font-size: 14px">` +
                    `<tr>` +
                        `<td style="text-align: right">` +
                            `<div style="color: #ddccbb; font-weight: 400; width: 80px">Model Name</div>` +
                        `</td>` + 
                        `<td style="text-align: left; padding-left: 15px;">` +
                            `<div style="width: 150px">${model_name}</div>` +
                        `</td>` +
                    `</tr>` +
                        `<tr>` +
                        `<td style="text-align: right">` +
                            `<div style="color: #ddccbb; font-weight: 400; width: 80px">Public?</div>` +
                        `</td>` + 
                        `<td style="text-align: left; padding-left: 15px;">` +
                            `<div style="width: 150px">${is_public}</div>` +
                        `</td>` +
                    `</tr>` +
                `</table>` +
            `</td>` +
            `<td>` +
                `<div style="width: 5px"></div>` +
            `</td>` +
            `<td>` +
                `<table style="font-size: 14px">` +
                    `<tr>` +
                        `<td style="height: 18px; text-align: right">` +
                            `<div style="color: #ddccbb; font-weight: 400; width: 90px">Start Time</div>` +
                        `</td>` + 
                        `<td style="text-align: left; padding-left: 15px;">` +
                            `<div style="width: 140px">${start_date}</div>` +
                        `</td>` +
                    `</tr>` +
                    `<tr>` +
                        `<td style="height: 18px; text-align: right">` +
                            `<div style="color: #ddccbb; font-weight: 400; width: 90px">${disp_end_title}</div>` +
                        `</td>` + 
                        `<td style="text-align: left; padding-left: 15px;">` +
                            `<div style="width: 140px">${disp_end_date}</div>` +
                        `</td>` + 
                    `</tr>` +
                `</table>` +
            `<td>` +
                `<div style="width: 120px"></div>` +
            `</td>` +
            `<td>` +
                `<div style="width: 180px;" class="object_entry">${model_object}</div>` +
            `</td>` +
            `<td>` +
                `<div style="width: 25px"></div>` +
            `</td>` +
            // `<td>` +
            //     time_info +
            // `</td>` +



            `<td style="width: 100%">` +
            //     `<div class="table_entry" style="text-align: left;">${time_info}</div>` +
            `</td>` +

            `<td>` +
                `<div style="width: 15px"></div>` +
            `</td>` +
            `<td>` +
                `<table>` +
                    `<tr>` +
                        `<td>` +
                            `<div id="${error_button_container_id}">` +
                            `</div>` +
                        `</td>` +
                    `</tr>` +
                    `<tr>` +
                        `<td>` +
                            `<div id="${destroy_button_container_id}">` +
                            `</div>` +
                        `</td>` +
                    `</tr>` +
                `</table>` +

            `</td>` +

            `<td>` +
                `<div style="width: 15px"></div>` +
            `</td>` +
            // `<td style="width: 100%">` +
            // //     `<div class="table_entry" style="text-align: left;">${time_info}</div>` +
            // `</td>` +

            // `<td>` +
            //     `<div id="${destroy_button_container_id}">` +

            //     `</div>` +
            // `</td>` +
            // `<td>` +
            //     `<div style="width: 15px"></div>` +
            // `</td>` +
        `</tr>`;

    $("#" + model_status + "_models_table").append(template);
    if (model_status === "available") {
        
        $("#" + destroy_button_container_id).append(
            `<button class="x-button x-button-hover"` +
                `onclick="destroy_model_request('available', '${model_name}')"  style="width: 180px; font-size: 14px; padding: 3px;">` +//<i class="fa-regular fa-circle-xmark"></i></button>`


                `<i class="fa-regular fa-circle-xmark" style="margin-right: 14px"></i><div style="display: inline-block; text-align: left;">Destroy Model</div>` +
        
            `</button>`
        );


        // `<td style="width: ${model_destroy_width};"><button class="x-button x-button-hover" style="width: ${button_width}" ` +
        //             `onclick="destroy_model_request('available', '${model_name}')"><i class="fa-regular fa-circle-xmark"></i></button>` +
        //     `</td>` +
    }
    else if (model_status === "aborted") {

        let view_error_message_button_id = row_uuid + "_view_error_message_button";

        $("#" + destroy_button_container_id).append(
            `<button class="x-button x-button-hover"` +
                `onclick="destroy_model_request('aborted', '${model_name}')"  style="width: 180px; font-size: 14px; padding: 3px;">` +//<i class="fa-regular fa-circle-xmark"></i></button>`


                `<i class="fa-regular fa-circle-xmark" style="margin-right: 14px"></i><div style="display: inline-block; text-align: left; width: 130px">Destroy Model</div>` +
        
            `</button>`
        );

        $("#" + error_button_container_id).append(

            `<button class="std-button std-button-hover"` +
                `id="${view_error_message_button_id}" style="width: 180px; font-size: 14px; padding: 3px;">` +
                //`onclick="show_modal_message('Error Message', \`${model_log["error_message"]}\`)" style="width: 180px; font-size: 14px; padding: 3px;">` +//<i class="fa-regular fa-circle-xmark"></i></button>`
                `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 14px"></i><div style="display: inline-block; text-align: left; width: 130px">View Error Message</div>` +
            `</button>`
        );

        $("#" + view_error_message_button_id).click(function() {
            show_modal_message("Error Message", model_log["error_message"]);
        });
    }
    else {
        $("#" + destroy_button_container_id).append(
            `<div style="width: 100px"><div class="loader"></div></div>`
        );
    }
}



function show_available_train() {
    viewing["train"] = "available";
    $("#submit_train_tab").hide();
    $("#pending_train_tab").hide();
    $("#aborted_train_tab").hide();
    $("#available_train_tab").show();

    //$("#available_models_head").empty();
    $("#available_models").empty();


    $.post($(location).attr('href'),
    {
        action: "fetch_my_models",
        model_state: "available"
    },
    function(response, status) {

        if (response.error) {
            show_modal_message(`Error`, response.message);
        }
        else {
            
            if (response.models.length == 0) {
                $("#available_models").append(
                    `<div>No Available Models Found</div>`
                    // `<tr>` +
                    //     `<td><div>No Available Models Found</div></td>` +
                    // `</tr>`
                );

            }
            else {

                $("#available_models").append(
                    `<div class="scrollable_area" style="border-radius: 10px; height: 550px; width: 1200px; margin: 0 auto; overflow-y: scroll">` +
                        `<table id="available_models_table" style="border-collapse: collapse"></table>` +
                    `</div>`
                );
                // `<div id="completed_results" hidden>` +
                //     `<div style="height: 90px"></div>` +
                //     `<div class="scrollable_area" style="border-radius: 10px; height: ${completed_results_container_height}; width: 1200px; margin: 0 auto; overflow-y: scroll">` +
                //         `<table id="completed_results_table" style="border-collapse: collapse"></table>` +
                //     `</div>` +
                // `</div>` +




                let models = response.models.sort(function(a, b) {
                    return b["log"]["model_name"] - a["log"]["model_name"];
                });

                // let model_name_width = "300px";
                // let model_public_width = "300px";
                // let model_destroy_width = "300px";
                // let button_width = "100px";


                // $("#available_models_head").append(
                //     `<tr>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_name_width}">Model Name</td>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_public_width}">Public?</td>` +
                //         `<td class="table_entry" style="font-weight: bold; width: ${model_destroy_width}">Destroy Model</td>` +
                //     `</tr>`
                // );

                for (let model of models) {
                    create_model_entry(model["log"], "available");
/*
                    let model_name = model["log"]["model_name"];
                    let is_public = capitalizeFirstLetter(model["log"]["public"]); //["public"] ? "Yes" : "No";
                    let model_object = model["log"]["model_object"];


                    
                    $("#available_models_table").append(
                        `<tr style="border-bottom: 1px solid #4c6645; height: 70px">` +
                            `<td><div style="width: 25px"></div></td>` + 
                            `<td>` +
                                `<table style="font-size: 14px">` +
                                    `<tr>` +
                                        `<td style="text-align: right">` +
                                            `<div style="color: #ddccbb; font-weight: 400; width: 90px">Model Name</div>` +
                                        `</td>` + 
                                        `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                                            `<div>${model_name}</div>` +
                                        `</td>` +
                                    `</tr>` +
                                        `<tr>` +
                                        `<td style="text-align: right">` +
                                            `<div style="color: #ddccbb; font-weight: 400; width: 90px">Public?</div>` +
                                        `</td>` + 
                                        `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                                            `<div>${is_public}</div>` +
                                        `</td>` +
                                    `</tr>` +
                                `</table>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 45px"></div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 180px" class="object_entry">${model_object}</div>` +
                            `</td>` +



                            `<td style="width: 100%"></td>` +

                        

                        // `<tr>` +
                        //     `<td class="table_entry" style="width: ${model_name_width};">${model_name}</td>` +
                        //     `<td class="table_entry" style="width: ${model_public_width};">${is_public}</td>` +
                        //     `<td style="width: ${model_destroy_width};"><button class="x-button x-button-hover" style="width: ${button_width}" ` +
                        //             `onclick="destroy_model_request('available', '${model_name}')"><i class="fa-regular fa-circle-xmark"></i></button>` +
                        //     `</td>` +
                        `</tr>`
                    );*/
                }
            }

        }
    });
}

function get_filtered_datasets() {

    let filtered_datasets = []; //{};
    for (let username of Object.keys(available_image_sets)) {
        for (let farm_name of Object.keys(available_image_sets[username])) {
            for (let field_name of Object.keys(available_image_sets[username][farm_name])) {
                for (let mission_date of Object.keys(available_image_sets[username][farm_name][field_name])) {

                    let object_name = available_image_sets[username][farm_name][field_name][mission_date]["object_name"];
                    //let keep = false;

                    let keep = true;
                    for (let key of Object.keys(valid_filter_values)) {
                        let comp;
                        if (key === "username") {
                            comp = username;
                        }
                        else if (key === "farm_name") {
                            comp = farm_name;
                        }
                        else if (key === "field_name") {
                            comp = field_name;
                        }
                        else if (key === "mission_date") {
                            comp = mission_date.substring(0, 4);
                        }
                        else if (key === "object_name") {
                            comp = object_name;
                        }

                        if (applied_filters[key] == "-- All --" || applied_filters[key] === comp) {
                            keep = true;
                        }
                        else {
                            keep = false;
                            break;
                        }
                    }

                    if (keep) {
                        if (!(username in filtered_datasets)) {
                            filtered_datasets[username] = {};
                        }
                        if (!(farm_name in filtered_datasets[username])) {
                            filtered_datasets[username][farm_name] = {};
                        }
                        if (!(field_name in filtered_datasets[username][farm_name])) {
                            filtered_datasets[username][farm_name][field_name] = {};
                        }
                        filtered_datasets[username][farm_name][field_name][mission_date] = available_image_sets[username][farm_name][field_name][mission_date];
                        
                        filtered_datasets.push({
                            "username": username,
                            "farm_name": farm_name,
                            "field_name": field_name,
                            "mission_date": mission_date,
                            "object_name": object_name,
                            "set_name": farm_name + " " + field_name + " " + mission_date,
                            "set_owner": username
                        });
                    
                    }
                    /*
                    let keep = (applied_filters["object_name"] == null || applied_filters["object_name"] === object_name) &&


                    }


                    for (let filter of filters) {
                        let key = filter["key"];
                        let val = filter["val"];
                        if (key === "username" && username === val) {
                            keep = true;
                            break;
                        }
                        else if (key === "farm_name" && farm_name === val) {
                            keep = true;
                            break;
                        }
                        else if (key === "field_name" && field_name === val) {
                            keep = true;
                            break;
                        }
                        else if (key === "misison_date" && mission_date === val) {
                            keep = true;
                            break;
                        }
                        else if (key === "object_name" && object_name === val) {
                            keep = true;
                            break;
                        }
                    }
                    if (keep) {
                        if (!(username in filtered_datasets)) {
                            filtered_datasets[username] = {};
                        }
                        if (!(farm_name in filtered_datasets[username])) {
                            filtered_datasets[username][farm_name] = {};
                        }
                        if (!(field_name in filtered_datasets[username][farm_name])) {
                            filtered_datasets[username][farm_name][field_name] = {};
                        }
                        filtered_datasets[username][farm_name][field_name][mission_date] = all_datasets[username][farm_name][field_name][mission_date];
                    }
*/
                }
            }
        }
    }

    let sort_combo_1_val = $("#sort_combo_1").val();
    let sort_combo_2_val = $("#sort_combo_2").val();
    let sort_combo_3_val = $("#sort_combo_3").val();

    filtered_datasets.sort(function(a, b) {
        return a[sort_combo_1_val].localeCompare(b[sort_combo_1_val], undefined, {numeric: true, sensitivity: 'base'}) || 
               a[sort_combo_2_val].localeCompare(b[sort_combo_2_val], undefined, {numeric: true, sensitivity: 'base'}) ||
               a[sort_combo_3_val].localeCompare(b[sort_combo_3_val], undefined, {numeric: true, sensitivity: 'base'});
               /* ||
               a.field_name.localeCompare(b.field_name) ||
               a.mission_date.localeCompare(b.mission_date);*/
    });

    return filtered_datasets;

}



function create_image_set_list() {

    $("#available_image_sets").empty();

    let filtered_datasets = get_filtered_datasets();
    //console.log("filtered_datasets", filtered_datasets);

    for (let filtered_dataset of filtered_datasets) {
        let username = filtered_dataset["username"];
        let farm_name = filtered_dataset["farm_name"];
        let field_name = filtered_dataset["field_name"];
        let mission_date = filtered_dataset["mission_date"];
        let object_name = filtered_dataset["object_name"];
        let image_set_text_id = username + ":" + farm_name + ":" + field_name + ":" + mission_date;
        //let image_set_text = farm_name + " | " + field_name + " | " + mission_date;
        let add_button_id = username + "." + farm_name + "." + field_name + "." + mission_date;



/*
    for (let username of Object.keys(filtered_datasets)) {
        for (let farm_name of Object.keys(filtered_datasets[username])) {
            for (let field_name of Object.keys(filtered_datasets[username][farm_name])) {
                for (let mission_date of Object.keys(filtered_datasets[username][farm_name][field_name])) {

                    
                    
                    
                    
                    
                    
                    let object_name = filtered_datasets[username][farm_name][field_name][mission_date]["object_name"];
                    let text = username + ":" + farm_name + ":" + field_name + ":" + mission_date;
                    let disp_text = username + " | " + farm_name + " | " + field_name + " | " + mission_date;
                    let add_button_id = username + "." + farm_name + "." + field_name + "." + mission_date;*/

                    let image_set_details = create_image_set_details_table(username, farm_name, field_name, mission_date);

                    $("#available_image_sets").append(
                        `<tr style="border-bottom: 1px solid #4c6645">` + 
                            //`<td style="padding: 6px 0px"><div style="margin: 0px 8px; width: ${object_col_width};" class="object_entry">${object_name}</div></td>` +
                            //`<td>`+
                            //    `<div class="table_entry" style="text-align: left; width: ${username_col_width}">${username}</div>` +
                            //`</td>` +
                            `<td style="width: 100%">` +
                                `<div class="table_entry" style="text-align: left;">${image_set_details}</div>` +
                            `</td>` +
                            `<td>` +
                                `<table>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<div style="width: 200px" class="object_entry">${object_name}</div>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<table>` +
                                                `<tr>` +
                                                    `<td>` +
                                                        `<button onclick="inspect_image_set('${image_set_text_id}', false)" style="padding: 2px; font-size: 14px; width: 100px" class="std-button std-button-hover">Inspect</button>` +
                                                    `</td>` +
                                                    `<td>` +
                                                        `<button id="${add_button_id}" onclick="add_image_set('${add_button_id}', '${image_set_text_id}')" style="padding: 2px; font-size: 14px; width: 100px" class="std-button std-button-hover">Add</button>` +                         
                                                    `</td>` +
                                                `</tr>` +
                                            `</table>` +
                                        `</td>` +
                                    `</tr>` +
                                `</table>` +
                            `</td>` +
                            `<td><div style="width: 5px;></div></td>` +


                            // `<td>` +
                            //     `<button onclick="inspect_image_set('${image_set_text_id}', false)" style="margin-right: 4px; padding: 2px; font-size: 14px; width: ${inspect_button_width}" class="std-button std-button-hover">Inspect</button>` +
                            // `</td>` +
                            // `<td>` +
                            //     `<button id="${add_button_id}" onclick="add_image_set('${add_button_id}', '${image_set_text_id}')" style="margin-right: 4px; padding: 2px; font-size: 14px; width: ${add_button_width};" class="std-button std-button-hover">Add</button>` +                         
                            // `</td>` +
                        `</tr>`
                    );

                    //$("#added_image_sets tr").each(function() {
                    for (let added_image_set of added_image_sets) {
                        //let pieces = this.id.split(":");
                        let added_username = added_image_set["username"]; //pieces[0];
                        let added_farm_name = added_image_set["farm_name"]; //pieces[1];
                        let added_field_name = added_image_set["field_name"]; //pieces[2];
                        let added_mission_date = added_image_set["mission_date"]; //pieces[3];

                        if ((added_username === username && added_farm_name === farm_name) && 
                            (added_field_name === field_name && added_mission_date === mission_date)) {

                            disable_std_buttons([add_button_id.split(".").join("\\.")]);
                        }
                
                    }
                }
                /*
            }
        }
    }*/
}


function create_viewer(id_prefix, dzi_image_paths) {

    $("#" + id_prefix + "_viewer").empty();


    viewers[id_prefix] = OpenSeadragon({
        id: id_prefix + "_viewer",
        sequenceMode: true,
        prefixUrl: get_CC_PATH() + "/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 1000,
        zoomPerClick: 1,
        nextButton: id_prefix + "_next",
        previousButton: id_prefix + "_prev",
        showNavigationControl: false,
        //preserveViewport: true,
    });



    overlays[id_prefix] = viewers[id_prefix].canvasOverlay({

        onOpen: function() {

            //viewers[id_prefix].world.resetItems();
            let region = regions[id_prefix][viewers[id_prefix].currentPage()];
            if (region != null) {
                // let image_w = overlays[id_prefix].imgWidth;
                // let image_h = overlays[id_prefix].imgHeight;

                let content_size = viewers[id_prefix].world.getItemAt(0).getContentSize();
                let image_w = content_size.x;
                let image_h = content_size.y;
                let hw_ratio = image_h / image_w;
                let viewport_bounds = [
                    region[1] / image_w,
                    (region[0] / image_h) * hw_ratio,
                    (region[3] - region[1]) / image_w,
                    ((region[2] - region[0]) / image_h) * hw_ratio
                ];
            
                cur_bounds[id_prefix] = new OpenSeadragon.Rect(
                    viewport_bounds[0],
                    viewport_bounds[1],
                    viewport_bounds[2],
                    viewport_bounds[3]
                );
            }
            else {
                cur_bounds[id_prefix] = null;
            }
            //viewers[id_prefix].viewport.goHome();;

        },
        onRedraw: function() {
            if (id_prefix in viewers) {
                let cur_tiles_url = viewers[id_prefix].source.tilesUrl;
                let basename_url = basename(cur_tiles_url);
                let cur_img_name = basename_url.substring(0, basename_url.length-6);
                let region = regions[id_prefix][viewers[id_prefix].currentPage()];
            
                let boxes_to_add = {};
                boxes_to_add["region_of_interest"] = {};
                boxes_to_add["region_of_interest"]["boxes"] = annotations[id_prefix][cur_img_name]["regions_of_interest"];
                boxes_to_add["training_region"] = {};
                boxes_to_add["training_region"]["boxes"] = annotations[id_prefix][cur_img_name]["training_regions"];
                boxes_to_add["test_region"] = {};
                boxes_to_add["test_region"]["boxes"] = annotations[id_prefix][cur_img_name]["test_regions"]
                boxes_to_add["annotation"] = {};
                boxes_to_add["annotation"]["boxes"] = annotations[id_prefix][cur_img_name]["boxes"];
                    
                let viewer_bounds = viewers[id_prefix].viewport.getBounds();
                let container_size = viewers[id_prefix].viewport.getContainerSize();

                let hw_ratio = overlays[id_prefix].imgHeight / overlays[id_prefix].imgWidth;
                let min_x = Math.floor(viewer_bounds.x * overlays[id_prefix].imgWidth);
                let min_y = Math.floor((viewer_bounds.y / hw_ratio) * overlays[id_prefix].imgHeight);
                let viewport_w = Math.ceil(viewer_bounds.width * overlays[id_prefix].imgWidth);
                let viewport_h = Math.ceil((viewer_bounds.height / hw_ratio) * overlays[id_prefix].imgHeight);
                let max_x = min_x + viewport_w;
                let max_y = min_y + viewport_h;

                //overlays[id_prefix].context2d().font = "14px arial";

                if (region != null) {
                    min_y = Math.max(min_y, region[0]);
                    min_x = Math.max(min_x, region[1]);
                    max_y = Math.min(max_y, region[2]);
                    max_x = Math.min(max_x, region[3]);
                }
                

                let draw_order;
                if (region == null) {
                    draw_order = ["region_of_interest", "training_region", "test_region", "annotation"];
                }
                else {
                    draw_order = ["annotation"];
                }
                for (let key of draw_order) { 
                    // let strokeStyle;
                    // if (key === "annotation" || region != null) {
                    //     strokeStyle = overlay_colors[key];
                    // }
                    // else {
                    //     strokeStyle = "#22f222";
                    // }
                    
                    overlays[id_prefix].context2d().strokeStyle = overlay_appearance["colors"][key];
                    overlays[id_prefix].context2d().fillStyle = overlay_appearance["colors"][key] + "55";
                    overlays[id_prefix].context2d().lineWidth = 2;




                    if (key === "region_of_interest") {

                        for (let i = 0; i < boxes_to_add["region_of_interest"]["boxes"].length; i++) {

                            let region = boxes_to_add["region_of_interest"]["boxes"][i];
                            overlays[id_prefix].context2d().beginPath();
                            for (let j = 0; j < region.length; j++) {
                                let pt = region[j];
                    
                                let viewer_point = viewers[id_prefix].viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(pt[1], pt[0]));
                                
                                if (j == 0) {
                                    overlays[id_prefix].context2d().moveTo(viewer_point.x, viewer_point.y);
                                }
                                else {
                                    overlays[id_prefix].context2d().lineTo(viewer_point.x, viewer_point.y);
                                }
                            }

                    
                            overlays[id_prefix].context2d().closePath();
                            overlays[id_prefix].context2d().stroke();
                            if (overlay_appearance["style"][key] == "fillRect") {
                                overlays[id_prefix].context2d().fill();
                            }
                    
                        }
                    }
                    else {


                        let visible_boxes = [];
                        for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {

                            let box = boxes_to_add[key]["boxes"][i];

                            // let box_width_pct_of_image = (box[3] - box[1]) / overlays[id_prefix].imgWidth;
                            // let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                            // let box_height_pct_of_image = (box[3] - box[1]) / overlays[id_prefix].imgHeight;
                            // let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;

                            // if ((disp_width * disp_height) < 0.5) {
                            //     continue;
                            // }

                            if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
                                visible_boxes.push(box);
                            }
                        }
                        if (visible_boxes.length <= MAX_BOXES_DISPLAYED) {
                            for (let box of visible_boxes) {
                                
                                let viewer_point = viewers[id_prefix].viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                                let viewer_point_2 = viewers[id_prefix].viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));
                                
                                overlays[id_prefix].context2d().strokeRect(
                                    viewer_point.x,// * container_size.x,
                                    viewer_point.y,// * container_size.y,
                                    (viewer_point_2.x - viewer_point.x),// * container_size.x,
                                    (viewer_point_2.y - viewer_point.y)// * container_size.y
                                );
                                //}
                                if (overlay_appearance["style"][key] == "fillRect") {
                                    overlays[id_prefix].context2d().fillRect(
                                        viewer_point.x,// * container_size.x,
                                        viewer_point.y,// * container_size.y,
                                        (viewer_point_2.x - viewer_point.x),// * container_size.x,
                                        (viewer_point_2.y - viewer_point.y)// * container_size.y
                                    );
                                }
                            }
                        }
                    }
                }

                if (region != null) {

                    //let region = annotations[cur_img_name][navigation_type][cur_region_index];

                    let image_px_width = overlays[id_prefix].imgWidth;
                    let image_px_height = overlays[id_prefix].imgHeight;
            
                    let inner_poly;
                    let outer_poly = [
                        [0-1e6, 0-1e6], 
                        [0-1e6, image_px_width+1e6], 
                        [image_px_height+1e6, image_px_width+1e6],
                        [image_px_height+1e6, 0-1e6]
                    ];
            
                    // if (navigation_type === "regions_of_interest") {
                    //     inner_poly = region;
                    // }
                    // else { 
                    inner_poly = [
                        [region[0], region[1]],
                        [region[0], region[3]],
                        [region[2], region[3]],
                        [region[2], region[1]]
                    ];
                    // }
            
                    overlays[id_prefix].context2d().fillStyle = "#222621";
                    overlays[id_prefix].context2d().beginPath();
            
                    for (let poly of [outer_poly, inner_poly]) {
            
                        for (let i = 0; i < poly.length+1; i++) {
                            let pt = poly[(i)%poly.length];
                            let viewer_point = viewers[id_prefix].viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(pt[1], pt[0]));
            
                            if (i == 0) {
                                overlays[id_prefix].context2d().moveTo(viewer_point.x, viewer_point.y);
                            }
                            else {
                                overlays[id_prefix].context2d().lineTo(viewer_point.x, viewer_point.y);
                            }
                        }
                        overlays[id_prefix].context2d().closePath();
            
                    }
                    overlays[id_prefix].context2d().mozFillRule = "evenodd";
                    overlays[id_prefix].context2d().fill("evenodd");
                }




                if (cur_bounds[id_prefix] != null) {

                    if (region != null) {
            
                        //let region = annotations[cur_img_name][navigation_type][cur_region_index];
            
                        // if (navigation_type === "regions_of_interest") {
                        //     region = get_bounding_box_for_polygon(region);
                        // }
            
                        viewers[id_prefix].world.getItemAt(0).setClip(
                            new OpenSeadragon.Rect(
                                region[1],
                                region[0],
                                (region[3] - region[1]),
                                (region[2] - region[0])
                            )
                        );
                    }
            
            
                    withFastOSDAnimation(viewers[id_prefix].viewport, function() {
                        viewers[id_prefix].viewport.fitBounds(cur_bounds[id_prefix]);
                    });
                    cur_bounds[id_prefix] = null;
                }








                /*
                
                // let region = annotations[cur_img_name][navigation_type][cur_region_index];

                let image_px_width = overlays[id_prefix].imgWidth;
                let image_px_height = overlays[id_prefix].imgHeight;

                
                if (region != null) {

                    let rects = [
                        [0-1e6 , 0-1e6, region[0], image_px_width+1e6],
                        [0-1e6, region[3], image_px_height+1e6, image_px_width+1e6],
                        [region[2], 0-1e6, image_px_height+1e6, image_px_width+1e6],
                        [0-1e6, 0-1e6, image_px_height+1e6, region[1]]
                    ];

                    // let bounds = annotations[cur_img_name][$("#navigation_dropdown").val()][cur_region_index];
                    
                    overlays[id_prefix].context2d().fillStyle = "#222621";
                    for (let rect of rects) {
                        let viewer_point = viewers[id_prefix].viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(rect[1], rect[0]));
                        let viewer_point_2 = viewers[id_prefix].viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(rect[3], rect[2]));
                        
                        overlays[id_prefix].context2d().fillRect(
                            viewer_point.x,
                            viewer_point.y,
                            (viewer_point_2.x - viewer_point.x),
                            (viewer_point_2.y - viewer_point.y)
                        );
                    }
                


                    if (cur_bounds[id_prefix] != null) {
                        //let my_bounds = cur_bounds[id_prefix];
                        
                        // withFastOSDAnimation(viewers[id_prefix].viewport, function() {
                        //     viewers[id_prefix].viewport.fitBounds(my_bounds); //cur_bounds[id_prefix]);
                        // });
                        // viewers[id_prefix].world.resetItems();

                        viewers[id_prefix].world.getItemAt(0).setClip(
                            new OpenSeadragon.Rect(
                                region[1],
                                region[0],
                                (region[3] - region[1]),
                                (region[2] - region[0])
                            )
                        );

                        // viewers[id_prefix].viewport.fitBounds(new OpenSeadragon.Rect(
                        //     0, 0, 1, hw_ratio
                        // ));

                        //delay(1000).then(() => {
                        withFastOSDAnimation(viewers[id_prefix].viewport, function() {
                            viewers[id_prefix].viewport.fitBounds(cur_bounds[id_prefix]); //cur_bounds[id_prefix]);
                        });

                        cur_bounds[id_prefix] = null;
                        //});
                        //cur_bounds[id_prefix] = null;
                    }
                }

                */
            }
        },
        clearBeforeRedraw: true
    });

    // annos[id_prefix] = OpenSeadragon.Annotorious(viewers[id_prefix], {
    //     disableEditor: true,
    //     disableSelect: true,
    //     readOnly: true,
    //     formatter: formatter
    // });

    // viewers[id_prefix].addHandler("open", function(event) {
    //     let cur_dzi = basename(event.source)
    //     let cur_image_name = cur_dzi.substring(0, cur_dzi.length - 4);
    //     update_overlays(id_prefix, cur_image_name);
    // });



}

// function update_overlays(id_prefix, img_name) {
//     annos[id_prefix].clearAnnotations();
//     for (let annotation of annotations[id_prefix][img_name]["annotations"]) {
//         annos[id_prefix].addAnnotation(annotation);
//     }
// }

function inspect_image_set(image_set_text_id, for_target) {

    let pieces = image_set_text_id.split(":");
    let username = pieces[0];
    let farm_name = pieces[1];
    let field_name = pieces[2];
    let mission_date = pieces[3];
    let image_set_dir = "usr/data/" + username + "/image_sets/" + farm_name + "/" + field_name + "/" + mission_date;
    let disp_text = username + " | " + farm_name + " | " + field_name + " | " + mission_date;

    $.post($(location).attr('href'),
    {
        action: "get_annotations",
        username: username,
        farm_name: farm_name,
        field_name: field_name,
        mission_date: mission_date
    },
    function(response, status) {

        if (response.error) {
            show_modal_message(`Error`, response.message);
        }
        else {
            let dzi_image_paths = [];
            let image_names;
            let id_prefix;
            let cur_regions;
            if (for_target) {
                id_prefix = "target";
                image_names = Object.keys(response.annotations);
                cur_regions = Array(image_names.length).fill(null);
            }
            else {
                id_prefix = "inspect";
                $("#inspected_set").html(disp_text);
                //image_names = all_datasets[username][farm_name][field_name][mission_date]["annotated_images"];
                image_names = [];
                cur_regions = [];
                for (let image_name of Object.keys(response.annotations)) {
                    // if (response.annotations[image_name]["training_regions"].length > 0 || response.annotations[image_name]["test_regions"].length > 0) {
                    //     image_names.push(image_name);
                    // }
                    for (let i = 0; i < response.annotations[image_name]["training_regions"].length; i++) {
                        image_names.push(image_name);
                        cur_regions.push(response.annotations[image_name]["training_regions"][i]);
                    }
                    for (let i = 0; i < response.annotations[image_name]["test_regions"].length; i++) {
                        image_names.push(image_name);
                        cur_regions.push(response.annotations[image_name]["test_regions"][i]);
                    }
                }

            }
            $("#" + id_prefix + "_prev").show();
            $("#" + id_prefix + "_next").show();

            //let annotated_images = all_datasets[username][farm_name][field_name][mission_date]["annotated_images"];
            for (let image_name of image_names) {
                let dzi_image_path = get_CC_PATH() + "/" + image_set_dir + "/dzi_images/" + image_name + ".dzi";
                dzi_image_paths.push(dzi_image_path);
            }
            /*
            for (let image_name of Object.keys(response.annotations)) {
                for (let annotation of response.annotations[image_name]["annotations"]) {
                    annotation["body"].push({"value": "COLOR_BRIGHT", "purpose": "highlighting"})
                }
            }*/
            regions[id_prefix] = cur_regions;

            if (!(id_prefix in viewers)) {
                create_viewer(id_prefix, dzi_image_paths);
            }
            else {
                viewers[id_prefix].tileSources = dzi_image_paths;
            }

            
            annotations[id_prefix] = response.annotations;
            //viewers[id_prefix].open(dzi_image_paths[0]);
            viewers[id_prefix].goToPage(0);

        }

    });
}


function remove_image_set(button_id) {
    /*
    let tr = el.parentNode.parentNode;
    tr.remove();

    enable_std_buttons([button_id.split(".").join("\\.")]);*/


    let pieces = button_id.split(".");
    let username = pieces[0];
    let farm_name = pieces[1];
    let field_name = pieces[2];
    let mission_date = pieces[3];

    let row_id =  username + "\\:" + farm_name + "\\:" + field_name + "\\:" + mission_date;

    $("#" + row_id).remove();
    enable_std_buttons([button_id.split(".").join("\\.")]);

    for (let i = 0; i < added_image_sets.length; i++) {
        let added_image_set = added_image_sets[i];
        if ((added_image_set["username"] === username && added_image_set["farm_name"] === farm_name) &&
            (added_image_set["field_name"] === field_name && added_image_set["mission_date"] === mission_date)) {
            added_image_sets.splice(i, 1);
            break;
        }
    }

    update_annotation_stats();

    //let added_objects = [];

    let added_objects = [];
    for (let added_image_set of added_image_sets) {
        let added_object = added_image_set["object_name"];
        added_objects.push(added_object);
    }
    /*
    $("#added_image_sets tr").each(function() {
        let pieces = this.id.split(":");
        let added_object = all_datasets[pieces[0]][pieces[1]][pieces[2]][pieces[3]]["object_name"];
        added_objects.push(added_object);
    });*/
    if ([... new Set(added_objects)].length == 1) {
        $("#model_object_input").val(added_objects[0]);
    }
    else {
        $("#model_object_input").prop("selectedIndex", -1);
    }

    update_train_form();

}


function add_image_set(button_id, image_set_text_id) {

    disable_std_buttons([button_id.split(".").join("\\.")]);
    let pieces = image_set_text_id.split(":");
    let username = pieces[0];
    let farm_name = pieces[1];
    let field_name = pieces[2];
    let mission_date = pieces[3];
    //let image_set_text = username + " | " + farm_name + " | " + field_name + " | " + mission_date;
    let row_id =  username + ":" + farm_name + ":" + field_name + ":" + mission_date;
    let object_name = available_image_sets[username][farm_name][field_name][mission_date]["object_name"];
    let image_set_details = create_image_set_details_table(username, farm_name, field_name, mission_date);

    added_image_sets.push({
        "username": username,
        "farm_name": farm_name,
        "field_name": field_name,
        "mission_date": mission_date,
        //"num_annotations": all_datasets[username][farm_name][field_name][mission_date]["num_annotations"],
        //"num_annotations": get_num_useable_boxes(annotations),
        //"annotated_images": all_datasets[username][farm_name][field_name][mission_date]["annotated_images"],
        "num_useable_boxes": available_image_sets[username][farm_name][field_name][mission_date]["num_useable_boxes"],
        "object_name": available_image_sets[username][farm_name][field_name][mission_date]["object_name"]
    });

    $("#added_image_sets").append(
        `<tr style="border-bottom: 1px solid white; border-color: #4c6645;" id="${row_id}">` + 

            `<td style="width: 100%">` +
                `<div class="table_entry" style="text-align: left;">${image_set_details}</div>` +
            `</td>` +
            
            `<td>` +
                `<table>` +
                    `<tr>` +
                        `<td>` +
                            `<div style="width: 200px" class="object_entry">${object_name}</div>` +
                        `</td>` +
                    `</tr>` +
                    `<tr>` +
                        `<td>` +
                            `<table>` +
                                `<tr>` +
                                    `<td>` +
                                        `<button onclick="inspect_image_set('${image_set_text_id}', false)" style="padding: 2px; font-size: 14px; width: 100px" class="std-button std-button-hover">Inspect</button>` +
                                    `</td>` +
                                    `<td>` +
                                        `<button onclick="remove_image_set('${button_id}')" style="padding: 2px; font-size: 14px; width: 100px" class="x-button x-button-hover">Remove</button>` + 
                                    `</td>` +
                                `</tr>` +
                            `</table>` +
                        `</td>` +
                    `</tr>` +
                `</table>` +
            `</td>` +
            `<td><div style="width: 5px"></div></td>` +    
        
        /*
        `<td>`+
            `<div class="table_entry" style="text-align: left; width: ${username_col_width}">${username}</div>` +
        `</td>` +
        `<td>` +
            `<div class="table_entry" style="text-align: left; width: ${image_set_col_width}">${image_set_text}</div>` +
        `</td>` +
        `<td>` +
            `<button onclick="inspect_image_set('${image_set_text_id}', false)" style="margin: 0px 1px; padding: 2px; font-size: 14px; width: ${inspect_button_width}" class="std-button std-button-hover">Inspect</button>` +
        `</td>` +
        `<td>` +
            `<button onclick="remove_image_set(this, '${button_id}')" style="margin: 0px 1px; padding: 2px; font-size: 14px; width: ${remove_button_width};" class="x-button x-button-hover">Remove</button>` +                         
        `</td>` +*/
        `</tr>`
    );

    update_annotation_stats();

    let added_objects = [];
    for (let added_image_set of added_image_sets) {
        let added_object = added_image_set["object_name"];
        added_objects.push(added_object);
    }

/*
    $("#added_image_sets tr").each(function() {
        let pieces = this.id.split(":");
        let added_object = all_datasets[pieces[0]][pieces[1]][pieces[2]][pieces[3]]["object_name"];
        added_objects.push(added_object);
    });*/
    if ([... new Set(added_objects)].length == 1) {
        $("#model_object_input").val(added_objects[0]);
    }
    else {
        $("#model_object_input").prop("selectedIndex", -1);
    }

    update_train_form();
}

function update_annotation_stats() {
    //let num_images = 0;
    let num_useable_boxes = 0;

    for (let added_image_set of added_image_sets) {
        /*
        let username = added_image_set["username"];
        let farm_name = added_image_set["farm_name"];
        let field_name = added_image_set["field_name"];
        let mission_date = added_image_set["mission_date"];

        let entry = all_datasets[username][farm_name][field_name][mission_date];
        num_images += entry["annotated_images"].length;
        num_annotations += entry["num_annotations"];*/

        //num_images += added_image_set["annotated_images"].length;
        //num_annotations += added_image_set["num_annotations"];
        num_useable_boxes += added_image_set["num_useable_boxes"];
    }

    //$("#added_images").html(num_images);
    $("#added_annotations").html(num_useable_boxes);
}

function clear_train_form() {
    for (let added_image_set of added_image_sets) {
        let username = added_image_set["username"];
        let farm_name = added_image_set["farm_name"];
        let field_name = added_image_set["field_name"];
        let mission_date = added_image_set["mission_date"];
        let add_button_id = username + "\\." + farm_name + "\\." + field_name + "\\." + mission_date;
        enable_std_buttons([add_button_id]);
    }
    added_image_sets = [];

    //$("#added_images").html(0);
    $("#added_annotations").html(0);

    $("#inspected_set").html("");
    //create_viewer("inspect", []);

    delete viewers["inspect"];
    $("#inspect_viewer").empty();
    $("#inspect_prev").hide();
    $("#inspect_next").hide();
    //disable_std_buttons(["inspect_prev", "inspect_next"]);

    //viewers["inspect"].tileSources = [];

    
    //create_viewer("target", []);
    delete viewers["target"];
    $("#target_viewer").empty();
    $("#target_farm_combo").prop("selectedIndex", -1);
    $("#target_field_combo").prop("selectedIndex", -1);
    $("#target_mission_combo").prop("selectedIndex", -1);
    //viewers["target"].tileSources = [];
    $("#target_prev").hide();
    $("#target_next").hide();

    $("#model_name_input").val("");
    $("#model_object_input").prop("selectedIndex", -1);
    $("#added_image_sets").empty();
    $('#model_public').prop('checked', true);
    disable_std_buttons(["submit_training_request"]);
}



function show_filter() {
    show_modal_message("Filter Image Sets", `<table id="filter_table"></table>`);

    let display_text = {
        "username": "Set Owner",
        "farm_name": "Farm Name",
        "field_name": "Field Name",
        "mission_date": "Mission Year",
        "object_name": "Object Name"
    };


    for (let key of ["username", "farm_name", "field_name", "mission_date", "object_name"]) {


        $("#filter_table").append(
            `<tr>` +
                `<td>` +
                    `<h class="header2" style="width: 150px; text-align: right; margin-right: 10px">${display_text[key]}</h>` +
                `</td>` +
                `<td>` +
                    `<div style="width: 250px">` +
                        `<select id="${key}" class="dropdown"></select>` +
                    `</div>` +
                `</td>` +
            `</tr>`
        );


        $("#" + key).append($('<option>', {
            value: "-- All --",
            text: "-- All --"
        }));
        for (let value of valid_filter_values[key]) {
            $("#" + key).append($('<option>', {
                value: value,
                text: value
            }));
        }
    }
/*
    applied_filters["object_name"] = null;
    applied_filters["username"] = null;
    applied_filters["farm_name"] = null;
    applied_filters["field_name"] = null;
    applied_filters["mission_date"] = null;*/


    for (let key of Object.keys(valid_filter_values)) {
        $("#" + key).val(applied_filters[key]);
        $("#" + key).change(function() {
            applied_filters[key] = $("#" + key).val();
            create_image_set_list();
        }); 
    }
    /*
    $("#object_name").change(function() {
        applied_filters["object_name"] = $("#object_name").val();
        create_image_set_list();
    });*/




    /*
    $("#filter_key").change(function() {

        let key = $(this).val();
        let values = [];
        $("#filter_val").empty();

        if (key === "username") {
            for (let username of Object.keys(all_datasets)) {
                values.push(username);
            }
        }
        else if (key === "farm_name") {
            for (let username of Object.keys(all_datasets)) {
                for (let farm_name of Object.keys(all_datasets[username])) {
                    values.push(farm_name);
                }
            }
        }
        else if (key === "field_name") {
            for (let username of Object.keys(all_datasets)) {
                for (let farm_name of Object.keys(all_datasets[username])) {
                    for (let field_name of Object.keys(all_datasets[username][farm_name])) {
                        values.push(field_name);
                    }
                }
            }
        }
        else if (key === "mission_date") {
            for (let username of Object.keys(all_datasets)) {
                for (let farm_name of Object.keys(all_datasets[username])) {
                    for (let field_name of Object.keys(all_datasets[username][farm_name])) {
                        for (let mission_date of Object.keys(all_datasets[username][farm_name][field_name])) {
                            values.push(mission_date);
                        }
                    }
                }
            }
        }
        else if (key === "object_name") {
            for (let username of Object.keys(all_datasets)) {
                for (let farm_name of Object.keys(all_datasets[username])) {
                    for (let field_name of Object.keys(all_datasets[username][farm_name])) {
                        for (let mission_date of Object.keys(all_datasets[username][farm_name][field_name])) {
                            values.push(all_datasets[username][farm_name][field_name][mission_date]["object_name"]);
                        }
                    }
                }
            }
        }



        values = [... new Set(values)];
        values = natsort(values);
        for (let value of values) {
            $("#filter_val").append($('<option>', {
                value: value,
                text: value
            }));
        }
    });

    $("#add_filter").click(function() {
        let key_col_width = "100px";
        let val_col_width = "300px";
        let key = $("#filter_key").val();
        let val = $("#filter_val").val();
        //filters[val] = 
        filters.push({
            "key": key,
            "val": val
        });
        $("#added_filters").append(
            `<td style="width: ${key_col_width}">` +
                `<div class="table_entry" style="text-align: left;">` +
                `${key}` +
                `</div>` +
            `</td>` +
            `<td style="width: ${val_col_width}">` +
                `<div class="table_entry" style="text-align: left;">` +
                `${val}` +
                `</div>` +
            `</td>`  

        );
        create_image_set_list();

    });*/

}


function initialize_train() {


    // create_viewer("inspect", []);
    // create_viewer("target", []);
    //create_viewer_and_anno("inspect");
    //create_viewer_and_anno("target");

    $("#inspect_prev").hide();
    $("#inspect_next").hide();
    $("#target_prev").hide();
    $("#target_next").hide();

    disable_std_buttons(["submit_training_request"]);
    set_filters();
    create_image_set_list();

    for (let object_name of objects["object_names"]) {
        $("#model_object_input").append($('<option>', {
            value: object_name,
            text: object_name
        }));
    }
    $("#model_object_input").prop("selectedIndex", -1);

    $("#model_object_input").change(function() {
        update_train_form();
    });


    $("#target_farm_combo").empty();
    $("#target_field_combo").empty();
    $("#target_mission_combo").empty();

    for (let farm_name of natsort(Object.keys(image_sets_data))) {
        $("#target_farm_combo").append($('<option>', {
            value: farm_name,
            text: farm_name
        }));
    }
    $("#target_farm_combo").prop("selectedIndex", -1);



    $("#target_farm_combo").change(function() {

        let farm_name = $(this).val();

        $("#target_field_combo").empty();
        $("#target_mission_combo").empty();

        for (let field_name of natsort(Object.keys(image_sets_data[farm_name]))) {
            $("#target_field_combo").append($('<option>', {
                value: field_name,
                text: field_name
            }));
        }
        $("#target_field_combo").val($("#target_field_combo:first").val()).change();
    });

    $("#target_field_combo").change(function() {

        let farm_name = $("#target_farm_combo").val();
        let field_name = $(this).val();

        $("#target_mission_combo").empty();

        for (let mission_date of natsort(Object.keys(image_sets_data[farm_name][field_name]))) {
            $("#target_mission_combo").append($('<option>', {
                value: mission_date,
                text: mission_date
            }));
        }
        $("#target_mission_combo").val($("#target_mission_combo:first").val()).change();
    });
    $("#target_mission_combo").change(function() {
        let farm_name = $("#target_farm_combo").val();
        let field_name = $("#target_field_combo").val();
        let mission_date = $("#target_mission_combo").val();
        let text = username + ":" + farm_name + ":" + field_name + ":" + mission_date;
        inspect_image_set(text, true);
    });

    $("#model_name_input").on("input", function(e) {
        update_train_form();
    });


    $("#submit_training_request").click(function() {

        disable_std_buttons(["submit_training_request"]);
        /*
        let image_sets = [];


        $("#added_image_sets tr").each(function() {
            let pieces = this.id.split(":");
            image_sets.push({
                "username": pieces[0],
                "farm_name": pieces[1],
                "field_name": pieces[2],
                "mission_date": pieces[3],
                "images": all_datasets[pieces[0]][pieces[1]][pieces[2]][pieces[3]]["annotated_images"]
            });
        });*/

        let submitted_image_sets = [];
        for (let added_image_set of added_image_sets) {
            submitted_image_sets.push({
                "username": added_image_set["username"],
                "farm_name": added_image_set["farm_name"],
                "field_name": added_image_set["field_name"],
                "mission_date": added_image_set["mission_date"],
                "object_name": added_image_set["object_name"]
            });
        }

        let model_name = $("#model_name_input").val();
        let model_object = $("#model_object_input").val();

        let is_public = ($("#model_public").is(':checked')) ? "yes" : "no";

        $.post($(location).attr('href'),
        {
            action: "train",
            model_name: model_name,
            model_object: model_object,
            image_sets: submitted_image_sets,
            is_public: is_public
        },
    
        function(response, status) {

            if (response.error) {  

                clear_train_form();
                show_modal_message("Error", response.message);  
    
            }
            else {

                clear_train_form();
                show_modal_message("Success", response.message);
    
            }
        });
    });

    $("#sort_combo_1").change(function() {
        let sort_combo_1_val = $("#sort_combo_1").val();

        $("#sort_combo_2").empty();
        for (let sort_option of sort_options) {
            if (sort_option["value"] !== sort_combo_1_val) {
                $("#sort_combo_2").append($('<option>', {
                    value: sort_option["value"],
                    text: sort_option["text"]
                }));
            }
        }
        $("#sort_combo_2").val($("#sort_combo_2:first").val()).change();
    })

    $("#sort_combo_2").change(function() {
        let sort_combo_1_val = $("#sort_combo_1").val();
        let sort_combo_2_val = $("#sort_combo_2").val();

        $("#sort_combo_3").empty();
        for (let sort_option of sort_options) {
            if (sort_option["value"] !== sort_combo_1_val && sort_option["value"] !== sort_combo_2_val) {
                $("#sort_combo_3").append($('<option>', {
                    value: sort_option["value"],
                    text: sort_option["text"]
                }));
            }
        }
        $("#sort_combo_3").val($("#sort_combo_3:first").val()).change();
    });

    $("#sort_combo_3").change(function() {
        create_image_set_list();
    });
    
}


