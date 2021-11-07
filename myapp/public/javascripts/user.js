
function disable_input() {

    let buttons = ["#submit_button", "#group_button"];

    for (button of buttons) {
        $(button).prop('disabled', true);
        $(button).removeClass("button-hover");
        $(button).css("opacity", 0.5);
        $(button).css("cursor", "default");
    }

}

function enable_input() {

    let buttons = ["#submit_button", "#group_button"];

    for (button of buttons) {
        $(button).prop('disabled', false);
        $(button).addClass("button-hover");
        $(button).css("opacity", 1);
        $(button).css("cursor", "pointer");
    }

}


function delete_group(btn) {

    let btn_id = btn.id;
    let group_uuid = btn_id.substring(0, btn_id.length-4);

    $.post($(location).attr('href'),
    {
        action: "delete_group",
        group_uuid: group_uuid
    },
    
    function(response, status) {

        if (response.error) {
            $("#delete_error_message").text(response.message);
            $("#delete_error_message").show();
        }
        else {
            $("#right_panel").empty();

            let trial_name = $("#trial_combo").val();
            let mission_date = $("#mission_combo").val();
            let dataset_name = $("#dataset_combo").val();

            delete user_data[trial_name][mission_date][dataset_name]["user_groups"][group_uuid];

            $("#display_names").empty();
            display_group_names();
        }
    });

}

function show_group_details(group_uuid) {

    let group_key;
    if ($("#display_user_groups:checked").val()) {
        group_key = "user_groups";
    }
    else {
        group_key = "groups";
    }

    $.post($(location).attr('href'),
    {
        action: "get_group_data",
        group_uuid: group_uuid,
        group_key: group_key
    },
    
    function(response, status) {
        if (response.error) {
            $("#right_panel").empty();
            $("#right_panel").append(`<div>An error occurred while fetching the group data: ${response.error}</div>`);
        }
        else {

            let group_data = response.message;
            let group_name = group_data["group_name"];
            group_data = JSON.stringify(group_data, null, 4);

            $("#right_panel").empty();

            let config_area_height;
            if (group_key === "user_groups") {
                config_area_height = "520px";
            }
            else {
                config_area_height = "590px";
            }
            $("#right_panel").append(`<div id="details_title"></div>`);
            $("#right_panel").append(`<div id="configurations" class="scrollable_padded_area" ` +
                                          `style="height: ${config_area_height}";"></div>`);


            $("#details_title").append(
                `<h class="header2" style="font-size: 22px; text-align: center; word-wrap: break-word; color: white">` +
                `${group_name}</h>`);            

            $("#configurations").append(
                `<div class="config_head">GROUP CONFIGURATION</div>`+
                `<div class="config_content"><pre>${group_data}</pre></div>`);

            if ($("#display_user_groups:checked").val()) {
                let delete_btn_id = group_uuid + "_del";
                $("#right_panel").append(
                    `<hr>` +
                    `<div style="text-align: center">` +
                    `<button id="${delete_btn_id}" class="button button-hover" style="width: 75%" onclick="delete_group(this)">` +
                    `<span>Delete this Group</span></button>` +
                    `<p id="delete_error_message" align="center></p>` +
                    `</div>`);
            }


        }
    });
}


function show_model_config(model_uuid) {


    $("#right_panel").empty();
    $("#right_panel").append(`<div id="config_title"></div>`);
    $("#right_panel").append(`<div id="configurations" class="scrollable_padded_area" style="height: 590px";"></div>`);

    let trial_name = $("#trial_combo").val();
    let mission_date = $("#mission_combo").val();
    let dataset_name = $("#dataset_combo").val();

    let models_dict = user_data[trial_name][mission_date][dataset_name]["models"];
    let model_instance_name = models_dict[model_uuid]["instance_name"];
    let prediction_dirname = models_dict[model_uuid]["prediction_dirname"];

    let arch_url = "/usr/data/models/" + model_uuid + "/arch_config.json";
    let train_url = "/usr/data/models/" + model_uuid + "/training_config.json";
    let inference_url = "/usr/data/models/" + model_uuid + "/" + prediction_dirname + "/inference_config.json";

    let arch_config = JSON.stringify(get_config(arch_url), null, 4);
    let train_config = JSON.stringify(get_config(train_url), null, 4);
    let inference_config = JSON.stringify(get_config(inference_url), null, 4);

    $("#config_title").append(
        `<h class="header2" style="font-size: 22px; text-align: center; word-wrap: break-word; color: white">` +
        `${model_instance_name}</h>`);

    $("#configurations").append(
        `<div class="config_head">ARCHITECTURE CONFIGURATION</div>`+
        `<div class="config_content"><pre>${arch_config}</pre></div>`);
    $("#configurations").append(
        `<div class="config_head"">TRAINING CONFIGURATION</div>`+
        `<div class="config_content"><pre>${train_config}</pre></div>`);
    $("#configurations").append(
        `<div class="config_head">INFERENCE CONFIGURATION</div>`+
        `<div class="config_content"><pre>${inference_config}</pre></div>`);
}


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

function add_model_sorting_options() {

    let sorting_options = ["Lexicographic",
                           "Image Mean Abs. Diff. in Count (Asc.)",
                           "Image Mean Sq. Diff. in Count (Asc.)",
                           "Image R Squared (Desc.)",
                           "Image PASCAL VOC mAP (Desc.)",
                           "Image MS COCO mAP (Desc.)",
                           "Patch Mean Abs. Diff. in Count (Asc.)",
                           "Patch Mean Sq. Diff. in Count (Asc.)",
                           "Patch R Squared (Desc.)",
                           "Total Inference Time (s) (Asc.)",
                           "Per-Image Inference Time (s) (Asc.)",
                           "Per-Patch Inference Time (s) (Asc.)"];

    for (sorting_option of sorting_options) {
        $("#sort_combo").append($('<option>', {
            value: sorting_option,
            text: sorting_option
        }));
    }
    $("#sort_combo").val(sorting_options[0]);
}


function add_group_sorting_options() {

    let sorting_options = ["Lexicographic"];

    for (sorting_option of sorting_options) {
        $("#sort_combo").append($('<option>', {
            value: sorting_option,
            text: sorting_option
        }));
    }
    $("#sort_combo").val(sorting_options[0]);
}


function display_group_names() {

    let trial_name = $("#trial_combo").val();
    let mission_date = $("#mission_combo").val();
    let dataset_name = $("#dataset_combo").val();

    let sort_method = $("#sort_combo").val();

    if ($("#display_user_groups:checked").val()) {
        group_key = "user_groups";
    } else {
        group_key = "groups";
    }
    
    if ((!(group_key in user_data[trial_name][mission_date][dataset_name])) ||
        (Object.keys(user_data[trial_name][mission_date][dataset_name][group_key]).length == 0)) {
        $("#display_names").append(`<tr>` +
                                  `<th><div class="table_header">No Groups Found</div></th>`+
                                  `</tr>`)
    }
    else {
        let groups_dict = user_data[trial_name][mission_date][dataset_name][group_key];
        let group_uuids = Object.keys(groups_dict);


        let sorted_uuids;
        let sorted_names;
        if (sort_method === "Lexicographic") {

            let items = group_uuids.map(function(group_uuid) {
                return [group_uuid, groups_dict[group_uuid]["group_name"]];
            });
            items.sort(function(first, second) {
                if (first[1] < second[1]) return -1;
                if (first[1] > second[1]) return 1;
                return 0;
            });
            sorted_uuids = items.map(function(tup) {
                return tup[0];
            });
            sorted_names = items.map(function(tup) {
                return tup[1];
            });
        }
        else {
            // TODO
        }


        let title_width = Math.round(get_text_width("Group Name", "bold 16px arial"));
        let max_name_width = get_max_name_width(sorted_names, "16px arial");
        let name_col_width = Math.max(title_width, max_name_width) + 30 + "px";

        $("#display_names").append(`<tr>` +
            `<th><div class="table_header" style="text-align:center; width: ${name_col_width}">Group Name</div></th>` +
            `</tr>`);

        for (let i = 0; i < sorted_uuids.length; i++) {
            let group_uuid = sorted_uuids[i];
            let group_name = sorted_names[i];

            $("#display_names").append(`<tr>`+
                    `<td><div class="table_entry" style="text-align: left; width: ${name_col_width}"><label style="cursor: pointer">` +
                    `<input type="radio" class="cur_display_names" name="display_groups" value="${group_uuid}">` +
                    `   ${group_name}</label></div></td>`+
                    `</tr>`);
        }
    }
}

function display_model_names() {

    let trial_name = $("#trial_combo").val();
    let mission_date = $("#mission_combo").val();
    let dataset_name = $("#dataset_combo").val();

    let sort_method = $("#sort_combo").val();

    let key_lookup = {
        "Image Mean Abs. Diff. in Count (Asc.)": ["Image Mean Abs. Diff. in Count", "Cross-Class Weighted Sum", 2],
        "Image Mean Sq. Diff. in Count (Asc.)": ["Image Mean Sq. Diff. in Count", "Cross-Class Weighted Sum", 2],
        "Image R Squared (Desc.)": ["Image R Squared", "Cross-Class Weighted Sum", 2],
        "Image PASCAL VOC mAP (Desc.)": ["Image PASCAL VOC mAP", "---", 2],
        "Image MS COCO mAP (Desc.)": ["Image MS COCO mAP", "---", 2],
        "Patch Mean Abs. Diff. in Count (Asc.)": ["Patch Mean Abs. Diff. in Count", "Cross-Class Weighted Sum", 2],
        "Patch Mean Sq. Diff. in Count (Asc.)": ["Patch Mean Sq. Diff. in Count", "Cross-Class Weighted Sum", 2],
        "Patch R Squared (Desc.)": ["Patch R Squared", "Cross-Class Weighted Sum", 2],
        "Total Inference Time (s) (Asc.)": ["Total Inference Time (s)", "---", 2],
        "Per-Image Inference Time (s) (Asc.)": ["Per-Image Inference Time (s)", "---", 2],
        "Per-Patch Inference Time (s) (Asc.)": ["Per-Patch Inference Time (s)", "---", 6]
    };

    let models_dict = user_data[trial_name][mission_date][dataset_name]["models"];
    let model_uuids = Object.keys(models_dict);

    let sorted_uuids;
    let sorted_names;
    let sorted_vals;
    if (sort_method === "Lexicographic") {
        let items = model_uuids.map(function(model_uuid) {
            return [model_uuid, models_dict[model_uuid]["instance_name"]];
        });
        items.sort(function(first, second) {
            if (first[1] < second[1]) return -1;
            if (first[1] > second[1]) return 1;
            return 0;
        });
        sorted_uuids = items.map(function(tup) {
            return tup[0];
        });
        sorted_names = items.map(function(tup) {
            return tup[1];
        });
    }
    else {
        let metric_dictname = key_lookup[sort_method][0];
        let metric_cls_name = key_lookup[sort_method][1];
        let val;
        let items = [];
        for (model_uuid of model_uuids) {
            val = models_dict[model_uuid]["metrics"][metric_dictname][metric_cls_name];

            items.push([model_uuid,
                        models_dict[model_uuid]["instance_name"], 
                        val]);
        }

        items.sort(function(first, second) {
            return second[2] - first[2];
        });

        if (sort_method.substring(sort_method.length - 6) === "(Asc.)") {
            items.reverse();
        }

        sorted_uuids = items.map(function(item) {
            return item[0];
        });
        sorted_names = items.map(function(item) {
            return item[1];
        });
        sorted_vals = items.map(function(item) {
            let round = key_lookup[sort_method][2];
            return (Math.round(item[2] * (10**round)) / (10**round)).toFixed(round);
        });


    }

    let title_width = Math.round(get_text_width("Model Name", "bold 16px arial"));
    let max_name_width = get_max_name_width(sorted_names, "16px arial");
    let name_col_width = Math.max(title_width, max_name_width) + 30 + "px";

    let score_col_width = "120px";

    $("#display_names").append(`<tr>` +
            `<th><div class="table_header" style="width: ${name_col_width}">Model Name</div></th>` +
            `<th><div class="table_header" style="width: ${score_col_width}">Score</div></th>` +
            `</tr>`);

    for (let i = 0; i < sorted_uuids.length; i++) {
        let model_uuid = sorted_uuids[i];
        let model_name = sorted_names[i];
        let val_div = `<td><div class="table_entry" style="width: ${score_col_width}">` + " --- " + `</div></td>`;
        if (sort_method !== "Lexicographic") {
            val_div = `<td><div class="table_entry" style="width: ${score_col_width}">` + sorted_vals[i] + `</div></td>`;
        }
        $("#display_names").append(`<tr>`+
                `<td><div class="table_entry" style="text-align: left; width: ${name_col_width}"><label style="cursor: pointer">` +
                `<input type="checkbox" class="cur_display_names" value="${model_uuid}">` +
                `   ${model_name}</label></td></div>`+
                val_div + 
                `</tr>`);     
    }
}



function fetch_existing_user_group() {

    let group_uuid;
    $(".cur_display_names:checked").each(function(i, e) {
        group_uuid = $(this).val();
    });

    $.post($(location).attr('href'),
    {
        action: "fetch_existing_user_group",
        group_uuid: group_uuid
    },
    
    function(response, status) {

        if (response.error) { 
            $("#submit_error_message").text(response.message);
            $("#submit_error_message").show();
        }
        else {
            window.location.href = response.redirect;
        }
    });  
}


function fetch_system_group() {

    let trial_name = $("#trial_combo").val();
    let mission_date = $("#mission_combo").val();
    let dataset_name = $("#dataset_combo").val();
    let group_uuid;
    $(".cur_display_names:checked").each(function(i, e) {
        group_uuid = $(this).val();
    });

    $.post($(location).attr('href'),
    {
        action: "fetch_system_group",
        group_uuid: group_uuid,
        trial_name: trial_name,
        mission_date: mission_date,
        dataset_name: dataset_name
    },
    function(response, status) {
        if (response.error) { 
            $("#submit_error_message").text(response.message);
            $("#submit_error_message").show();
        }
        else {
            window.location.href = response.redirect;
        }
    });
}



function submit_new_user_group(group_name, group_description) {
    let model_instance_uuids = [];
    let model_instance_names = [];
    let prediction_dirnames = [];

    let trial_name = $("#trial_combo").val();
    let mission_date = $("#mission_combo").val();
    let dataset_name = $("#dataset_combo").val();

    $(".cur_display_names:checked").each(function(i, e) {
        let model_uuid = $(this).val();
        let models_dict = user_data[trial_name][mission_date][dataset_name]["models"]
        model_instance_uuids.push(model_uuid);
        model_instance_names.push(models_dict[model_uuid]["instance_name"]);
        prediction_dirnames.push(models_dict[model_uuid]["prediction_dirname"]);
    });

    let save_group = (group_name !== null && group_description !== null);

    $.post($(location).attr('href'),
    {
        action: "submit_new_user_group",
        trial_name: trial_name,
        mission_date: mission_date,
        dataset_name: dataset_name,
        model_instance_uuids: model_instance_uuids.join(","),
        model_instance_names: model_instance_names.join(","),
        prediction_dirnames: prediction_dirnames.join(","),
        save_group: save_group,
        group_name: group_name,
        group_description: group_description
    },
    
    function(response, status) {

        if (response.error) {        
            $("#modal_error_message").text(response.message);
            $("#modal_error_message").show();
        }
        else {
            window.location.href = response.redirect;
        }
    });
}


let cur_display_names = [];

$(document).ready(function(){

    disable_input();
    update_containers();

    for (const trial_name in user_data) {
        $("#trial_combo").append($('<option>', {
            value: trial_name,
            text: trial_name
        }));
    }

    $("#trial_combo").prop("selectedIndex", -1);


    $("#display_select").change(function() {

        let trial_name = $("#trial_combo").val();
        let mission_date = $("#mission_combo").val();
        let dataset_name = $("#dataset_combo").val()

        $("#right_panel").empty();
        cur_display_names = [];


        if ($("#display_models:checked").val()) {
            $("#sort_combo").empty();
            $("#display_names").empty();

            if ((trial_name && mission_date) && dataset_name) {
                add_model_sorting_options();
                display_model_names();
            }
        }
        else {
            $("#sort_combo").empty();
            $("#display_names").empty();

            if ((trial_name && mission_date) && dataset_name) {
                add_group_sorting_options();
                display_group_names();
            }
        }
    });

    $("#trial_combo").change(function() {

        let trial_name = $(this).val();

        $("#mission_combo").empty();
        $("#dataset_combo").empty();
        $("#sort_combo").empty();
        $("#display_names").empty();
        $("#right_panel").empty();
        cur_display_names = [];

        for (const mission_date in user_data[trial_name]) {
            $("#mission_combo").append($('<option>', {
                value: mission_date,
                text: mission_date
            }));
        }

        $("#mission_combo").prop("selectedIndex", -1);
    });


    $("#mission_combo").change(function() {

        let trial_name = $("#trial_combo").val();
        let mission_name = $(this).val();

        $("#dataset_combo").empty();
        $("#sort_combo").empty();
        $("#display_names").empty();
        $("#right_panel").empty();
        cur_display_names = [];

        for (const dataset_name in user_data[trial_name][mission_name]) {
            $("#dataset_combo").append($('<option>', {
                value: dataset_name,
                text: dataset_name
            }));
        }

        $("#dataset_combo").prop("selectedIndex", -1);
    });


    $("#dataset_combo").change(function() {

        let trial_name = $("#trial_combo").val();
        let mission_date = $("#mission_combo").val();
        let dataset_name = $(this).val();

        $("#sort_combo").empty();
        $("#display_names").empty();
        $("#right_panel").empty();
        cur_display_names = [];


        if ($("#display_models:checked").val()) {
            add_model_sorting_options();
            display_model_names();
        }
        else {
            add_group_sorting_options();
            display_group_names();
        }
    });

    $("#sort_combo").change(function() {
        $("#display_names").empty();
        $("#right_panel").empty();
        cur_display_names = [];

        if ($("#display_models:checked").val()) {
            display_model_names();
        }
        else {
            display_group_names();
        }
    });

    $("#display_names").change(function() {

        $("#right_panel").empty();

        let prev_display_names = cur_display_names;
        cur_display_names = [];
        let newly_checked = null;
        let name;

        $(".cur_display_names:checked").each(function(i, e) {
            name = $(this).val();
            cur_display_names.push(name);
            if (!(prev_display_names.includes(name))) {
                newly_checked = name;
            }
        });

        if (newly_checked !== null) {
            if ($("#display_models:checked").val()) {
                show_model_config(newly_checked);
            }
            else {
                show_group_details(newly_checked);
            }
        }

        if (cur_display_names.length > 0) {
            enable_input();
        }
        else {
            disable_input();
        }
    });



    $("#submit_button").click(function(e) {

        if ($("#display_models:checked").val()) {
            $("#save_modal").css("display", "block");
        }
        else if ($("#display_user_groups:checked").val()) {
            fetch_existing_user_group()
        }
        else {
            fetch_system_group();
        }
    });

    $("#save_yes_button").click(function() {
        $("#group_configuration").show();
    });

    $("#save_no_button").click(function() {
        submit_new_user_group(null, null);
    });



    $('form').submit(function(e) {
        e.preventDefault();
        
        let group_name = $("#group_name").val();
        let group_desc = $("#group_description").val();
        if (group_name.length > 35) {
            $("#modal_error_message").text("Group name exceeds maximum allowed length.");
        }
        else if (group_desc.length > 200) {
            $("#modal_error_message").text("Group description exceeds maximum allowed length.");
        }
        else {
            submit_new_user_group(group_name, group_desc);
        }
    });

    $("#save_modal_close").click(function() {
        $("#group_configuration").hide();
        $("#group_name").val('');
        $("#group_description").val('');
        $("#modal_error_message").hide();
        $("#save_modal").css("display", "none");
    });

    $(window).resize(function() {
        update_containers();
    });
});
