let valid_filter_values;
let applied_filters;

let viewers = {};
let annos = {};
let annotations = {};

let object_col_width = "150px";
let username_col_width = "100px";
let image_set_col_width = "100%";
let inspect_button_width = "80px";
let add_button_width = "80px"; 
let remove_button_width = "80px";

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
                            values.push(mission_date.substring(0, 4));
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

        valid_filter_values[key] = values;
    }
}

function train_form_is_complete() {
    let inputs_to_check = ["model_name_input"];

    for (let input of inputs_to_check) {
        let input_length = ($("#" + input).val()).length;
        if ((input_length < 3) || (input_length > 20)) {
            return false;
        }
    }
    let num_image_sets = 0;
    $("#added_image_sets tr").each(function() {
        num_image_sets++;
    });

    let model_object = $("#model_object_input").val();
    console.log(objects);
    if (!(objects["object_names"].includes(model_object))) {
        return false;
    }

    if (num_image_sets == 0) {
        return false;
    }
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
    $("#submit_train_tab").hide();
    $("#available_train_tab").hide();
    $("#aborted_train_tab").hide();
    $("#pending_train_tab").show();
}

function show_aborted_train() {
    $("#submit_train_tab").hide();
    $("#available_train_tab").hide();
    $("#pending_train_tab").hide();
    $("#aborted_train_tab").show();
}


function show_available_train() {
    $("#submit_train_tab").hide();
    $("#pending_train_tab").hide();
    $("#aborted_train_tab").hide();
    $("#available_train_tab").show();

    $("#available_models_head").empty();
    $("#available_models").empty();


    $.post($(location).attr('href'),
    {
        action: "fetch_my_models",
    },
    function(response, status) {
        console.log("got response", response);

        if (response.error) {
            show_modal_message(`Error`, response.message);
        }
        else {
            
            if (response.models.length == 0) {
                $("#available_models").append(
                    `<tr>` +
                        `<td><div class="table_text">No models found!</div></td>` +
                    `</tr>`
                );

            }
            else {

                let model_name_width = "200px";
                let model_public_width = "100px";
                let model_destroy_width = "200px";


                $("#available_models_head").append(
                    `<tr>` +
                        `<td class="table_entry" style="font-weight: bold; width: ${model_name_width}">Model Name</td>` +
                        `<td class="table_entry" style="font-weight: bold; width: ${model_public_width}">Public?</td>` +
                        `<td class="table_entry" style="font-weight: bold; width: ${model_destroy_width}">Destroy Model</td>` +
                    `</tr>`
                );

                for (let model of response.models) {
                    let model_name = model["model_name"];
                    let is_public = model["public"] ? "Yes" : "No";


                    $("#available_models").append(
                        `<tr>` +
                            `<td class="table_entry" style="width: ${model_name_width};">${model_name}</td>` +
                            `<td class="table_entry" style="width: ${model_public_width};">${is_public}</td>` +
                            `<td style="width: ${model_destroy_width};"><button class="x-button x-button-hover" style="width: 100px" ` +
                                    `onclick="delete_model_request('${model_name}')"><i class="fa-regular fa-circle-xmark"></i></button>` +
                            `</td>` +
                        `</tr>`
                    );
                }
            }

        }
    });
}

function get_filtered_datasets() {

    let filtered_datasets = []; //{};
    for (let username of Object.keys(all_datasets)) {
        for (let farm_name of Object.keys(all_datasets[username])) {
            for (let field_name of Object.keys(all_datasets[username][farm_name])) {
                for (let mission_date of Object.keys(all_datasets[username][farm_name][field_name])) {

                    let object_name = all_datasets[username][farm_name][field_name][mission_date]["object_name"];
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
                        filtered_datasets[username][farm_name][field_name][mission_date] = all_datasets[username][farm_name][field_name][mission_date];
                        
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

    console.log("sort_combo_1_val", sort_combo_1_val);


    filtered_datasets.sort(function(a, b) {
        return a[sort_combo_1_val].localeCompare(b[sort_combo_1_val]) || 
               a[sort_combo_2_val].localeCompare(b[sort_combo_2_val]) ||
               a[sort_combo_3_val].localeCompare(b[sort_combo_3_val]);
               /* ||
               a.field_name.localeCompare(b.field_name) ||
               a.mission_date.localeCompare(b.mission_date);*/
    });

    return filtered_datasets;

}


function create_image_set_list() {

    $("#available_image_sets").empty();

    let filtered_datasets = get_filtered_datasets();

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

                    $("#available_image_sets").append(
                        `<tr style="border-bottom: 1px solid white; border-color: #4c6645;">` + 
                            `<td style="padding: 6px 0px"><div style="margin: 0px 18px 0px 8px; width: ${object_col_width};" class="object_entry">${object_name}</div></td>` +
                            `<td>`+
                                `<div class="table_entry" style="text-align: left; width: ${username_col_width}">${username}</div>` +
                            `</td>` +
                            `<td style="width: ${image_set_col_width}">` +
                                `<div class="table_entry" style="text-align: left;">${farm_name}<br>${field_name}<br>${mission_date}</div>` +
                            `</td>` +
                            `<td>` +
                                `<button onclick="inspect_image_set('${image_set_text_id}', false)" style="margin-right: 4px; padding: 2px; font-size: 14px; width: ${inspect_button_width}" class="std-button std-button-hover">Inspect</button>` +
                            `</td>` +
                            `<td>` +
                                `<button id="${add_button_id}" onclick="add_image_set('${add_button_id}', '${image_set_text_id}')" style="margin-right: 4px; padding: 2px; font-size: 14px; width: ${add_button_width};" class="std-button std-button-hover">Add</button>` +                         
                            `</td>` +
                        `</tr>`
                    );

                    $("#added_image_sets tr").each(function() {
                        let pieces = this.id.split(":");
                        let added_username = pieces[0];
                        let added_farm_name = pieces[1];
                        let added_field_name = pieces[2];
                        let added_mission_date = pieces[3];

                        if ((added_username === username && added_farm_name === farm_name) && 
                            (added_field_name == field_name && added_mission_date === mission_date)) {

                            disable_std_buttons([add_button_id.split(".").join("\\.")]);
                        }
                
                    });
                }
                /*
            }
        }
    }*/
}


function create_viewer_and_anno(id_prefix, dzi_image_paths) {


    viewers[id_prefix] = OpenSeadragon({
        id: id_prefix + "_viewer",
        sequenceMode: true,
        prefixUrl: get_CC_PATH() + "/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 100,
        zoomPerClick: 1,
        nextButton: id_prefix + "_next",
        previousButton: id_prefix + "_prev",
        showNavigationControl: false,
        //preserveViewport: true,
    });

    annos[id_prefix] = OpenSeadragon.Annotorious(viewers[id_prefix], {
        disableEditor: true,
        disableSelect: true,
        readOnly: true,
        formatter: formatter
    });

    viewers[id_prefix].addHandler("open", function(event) {
        let cur_dzi = basename(event.source)
        let cur_image_name = cur_dzi.substring(0, cur_dzi.length - 4);
        update_overlays(id_prefix, cur_image_name);
    });



}

function update_overlays(id_prefix, img_name) {
    annos[id_prefix].clearAnnotations();
    for (let annotation of annotations[id_prefix][img_name]["annotations"]) {
        annos[id_prefix].addAnnotation(annotation);
    }
}

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
            if (for_target) {
                id_prefix = "target";
                image_names = Object.keys(response.annotations);
            }
            else {
                id_prefix = "inspect";
                $("#inspected_set").html(disp_text);
                image_names = all_datasets[username][farm_name][field_name][mission_date]["annotated_images"];
            }

            //let annotated_images = all_datasets[username][farm_name][field_name][mission_date]["annotated_images"];
            for (let image_name of image_names) {
                let dzi_image_path = get_CC_PATH() + "/" + image_set_dir + "/dzi_images/" + image_name + ".dzi";
                dzi_image_paths.push(dzi_image_path);
            }

            for (let image_name of Object.keys(response.annotations)) {
                for (let annotation of response.annotations[image_name]["annotations"]) {
                    annotation["body"].push({"value": "COLOR_BRIGHT", "purpose": "highlighting"})
                }
            }
            if (!(id_prefix in viewers)) {
                create_viewer_and_anno(id_prefix, dzi_image_paths);
            }
            else {
                viewers[id_prefix].tileSources = dzi_image_paths;
            }

            annotations[id_prefix] = response.annotations;
            viewers[id_prefix].goToPage(0);            

        }

    });
}


function remove_image_set(el, button_id) {
    let tr = el.parentNode.parentNode;
    tr.remove();

    enable_std_buttons([button_id.split(".").join("\\.")]);

    update_annotation_stats();

    let added_objects = [];
    $("#added_image_sets tr").each(function() {
        let pieces = this.id.split(":");
        let added_object = all_datasets[pieces[0]][pieces[1]][pieces[2]][pieces[3]]["object_name"];
        added_objects.push(added_object);
    });
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
    let image_set_text = username + " | " + farm_name + " | " + field_name + " | " + mission_date;
    let row_id =  username + ":" + farm_name + ":" + field_name + ":" + mission_date;
    let object_name = all_datasets[username][farm_name][field_name][mission_date]["object_name"];

    $("#added_image_sets").append(
        `<tr style="border-bottom: 1px solid white; border-color: #4c6645;" id="${row_id}">` + 
        `<td style="padding: 6px 0px"><div style="margin: 0px 18px 0px 8px; width: ${object_col_width};" class="object_entry">${object_name}</div></td>` +
        `<td>`+
            `<div class="table_entry" style="text-align: left; width: ${username_col_width}">${username}</div>` +
        `</td>` +
        `<td style="width: ${image_set_col_width}">` +
            `<div class="table_entry" style="text-align: left;">${farm_name}<br>${field_name}<br>${mission_date}</div>` +
        `</td>` +
        `<td>` +
            `<button onclick="inspect_image_set('${image_set_text_id}', false)" style="margin-right: 4px; padding: 2px; font-size: 14px; width: ${inspect_button_width}" class="std-button std-button-hover">Inspect</button>` +
        `</td>` +
        `<td>` +
            `<button onclick="remove_image_set(this, '${button_id}')" style="margin-right: 4px; padding: 2px; font-size: 14px; width: ${add_button_width};" class="x-button x-button-hover">Remove</button>` +                         
        `</td>` +        
        
        
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
    $("#added_image_sets tr").each(function() {
        let pieces = this.id.split(":");
        let added_object = all_datasets[pieces[0]][pieces[1]][pieces[2]][pieces[3]]["object_name"];
        added_objects.push(added_object);
    });
    if ([... new Set(added_objects)].length == 1) {
        $("#model_object_input").val(added_objects[0]);
    }
    else {
        $("#model_object_input").prop("selectedIndex", -1);
    }

    update_train_form();
}

function update_annotation_stats() {
    let num_images = 0;
    let num_annotations = 0;
    $("#added_image_sets tr").each(function() {
        //console.log(this);
        let pieces = this.id.split(":");
        let entry = all_datasets[pieces[0]][pieces[1]][pieces[2]][pieces[3]];
        num_images += entry["annotated_images"].length;
        num_annotations += entry["num_annotations"];
    });

    $("#added_images").html(num_images);
    $("#added_annotations").html(num_annotations);
}

function clear_train_form() {
    $("#model_name_input").val("");
    $("#added_image_sets").empty();
    $('#public_checkbox').prop('checked', true);
}



function show_filter() {
    show_modal_message("Filter Image Sets", `<table id="filter_table"></table>`);

    let display_text = {
        "username": "Username",
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

    //create_viewer_and_anno("inspect");
    //create_viewer_and_anno("target");

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
        });

        let model_name = $("#model_name_input").val();
        let model_object = ("#model_object_input").val();

        let public;
        if ($("#public_checkbox").is(':checked')) {
            public = "yes";
        }
        else {
            public = "no";
        }

        $.post($(location).attr('href'),
        {
            action: "train",
            model_name: model_name,
            model_object: model_object,
            image_sets: image_sets,
            public: public
        },
    
        function(response, status) {
    
            if (response.error) {  

                clear_train_form();
                show_modal_message("Error", "An error occurred while submitting the training request.");  
    
            }
            else {

                clear_train_form();
                show_modal_message("Success", "Your training request has been successfully submitted.");
    
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
//});


