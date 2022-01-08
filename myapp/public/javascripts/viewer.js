
function set_sorted_uuids_and_names() {
    items = [];
    for (let i = 0; i < metadata["model_uuids"].length; i++) {
        items.push([metadata["model_uuids"][i], metadata["model_names"][i], metadata["prediction_dirnames"][i]]);
    }
    if (metadata["highlighted_param"] == null) {
        items.sort(function(first, second) {
            if (first[1] < second[1]) return -1;
            if (first[1] > second[1]) return 1;
            return 0;
        });
    }

    sorted_model_uuids = items.map(function(tup) {
        return tup[0];
    });
    sorted_model_names = items.map(function(tup) {
        return tup[1];
    });
    sorted_prediction_dirnames = items.map(function(tup) {
        return tup[2];
    });
}

function set_color_lookup() {

    let annotation_color = "#0080C0";
    let colors = ["#FF4040", "#FFC040", "#40C040", "#C080C0", "#00C0C0", "#C0C080", "#FFC0C0", "#408040", "#C08040", "#FF8040"];
    let overflow_color = "#A0A0A0"

    color_lookup["Annotations"] = annotation_color;


    let color_change_freq;
    if (metadata["replications"] == null) {
        color_change_freq = 1;
    } else {
        color_change_freq = metadata["replications"];
    }

    let color_index = 0;
    for (let i = 0; i < sorted_model_uuids.length; i++) {
        if (i > 0 && i % color_change_freq == 0) {
            color_index += 1;
        }
        if (color_index >= colors.length)
            color_lookup[sorted_model_uuids[i]] = overflow_color;
        else
            color_lookup[sorted_model_uuids[i]] = colors[color_index];

    }
}

function create_overlay_class(uuid) {
    let style = document.createElement("style");
    style.type = "text/css";
    let className = "overlay_style_" + uuid;

    /*1px auto " + color_lookup[uuid] + "; " +*/
    style.innerHTML = "." + className + " { opacity: 0.7; " +
                                            "filter: alpha(opacity=70); " +
                                            "outline: " + color_lookup[uuid] + " solid 2px; " + 
                                            "background-color: transparent; " +
                                            "font-size: 20px; " +
                                            "font-family: arial; " +
                                            "color: white; }";
    document.getElementsByTagName("head")[0].appendChild(style);
}

function set_overlay_classes() {

    create_overlay_class("Annotations");

    for (model_uuid of sorted_model_uuids) {
        create_overlay_class(model_uuid);
    }
}



function update_overlays() {
    viewer.clearOverlays();

    let del_divs = document.getElementsByClassName('overlay_div');

    while (del_divs[0]) {
        del_divs[0].parentNode.removeChild(del_divs[0]);
    }

    let boxes;
    let show_patch_coords = true;
    let sel_class = $("#class_combo").val();


    let items = ["Annotations"].concat(sorted_model_uuids).concat(ensemble_uuids);

    console.log("items", items);
    let is_annotations;
    for (let i = 0; i < items.length; i++) {

        let item = items[i]
        let label_id = item + "_label";
        let label_handle = "#" + label_id;
        boxes = [];
        scores = [];
        console.log("checking", label_handle);
        if ($(label_handle).is(":checked")) {
            console.log("Adding " + label_handle);

            is_annotations = false;
            if (item === "Annotations") {
                is_annotations = true;
                if (sel_class in annotations[cur_img_name]["class_boxes"]) {
                    boxes = annotations[cur_img_name]["class_boxes"][sel_class];
                }
            }
            else if (ensemble_uuids.includes(item)) {
                console.log("adding ensemble");
                if (sel_class in ensemble_predictions[item]["image_predictions"][cur_img_name]["pred_class_boxes"]) {
                //if (sel_class in ensemble_predictions[item][cur_img_name]["singles_class_boxes"]) {    
                    boxes = ensemble_predictions[item]["image_predictions"][cur_img_name]["pred_class_boxes"][sel_class];
                    scores = ensemble_predictions[item]["image_predictions"][cur_img_name]["pred_class_scores"][sel_class];
                    //boxes = ensemble_predictions[item][cur_img_name]["singles_class_boxes"][sel_class];
                    //scores = ensemble_predictions[item][cur_img_name]["singles_class_scores"][sel_class];

                }

            }
            else {
                if (sel_class in predictions[item]["image_predictions"][cur_img_name]["pred_class_boxes"]) {
                    boxes = predictions[item]["image_predictions"][cur_img_name]["pred_class_boxes"][sel_class];
                    scores = predictions[item]["image_predictions"][cur_img_name]["pred_class_scores"][sel_class];
                }
                patch_coords = predictions[item]["image_predictions"][cur_img_name]["patch_coords"];
            }

            let box_id;
            let score;
            for (let i = 0; i < boxes.length; i++) {
                box_id = item + "_overlay_" + i;

                overlay = {
                    id: box_id,
                    px: boxes[i][1],
                    py: boxes[i][0],
                    width: boxes[i][3] - boxes[i][1],
                    height: boxes[i][2] - boxes[i][0],
                    className: "overlay_style_" + item
                }
                if (!(is_annotations)) {
                    score = (Math.round(scores[i] * (10**2)) / (10**2)).toFixed(2);
                    $("#right_container").append(`<div class="overlay_div" id="${box_id}">${score}</div>`);
                    overlay["onDraw"] = function(position, size, element) {

                        if ($("#scores_checkbox").is(":checked")) {

                            let text = "0.00";
                            let font_family = "arial";
                            let font_size = "20px";
                            
                            let text_width = Math.round(get_text_width(text, font_size + " " + font_family));

                            if (text_width > size.x) {
                                element.style.fontSize = "0px";
                            }
                            else {
                                element.style.fontSize = "20px";

                            }
                        } 
                        else {
                            element.style.fontSize = "0px";
                        }

                        this.style.left     = position.x + "px";
                        this.style.top      = position.y + "px";
                        this.style.position = "absolute";
                        this.style.display  = 'block';

                        if ( this.scales ) {
                            this.style.width  = size.x + "px";
                            this.style.height = size.y + "px";
                        }

                    }
                }
                viewer.addOverlay(overlay);
            }
            if ((!(is_annotations)) && ($("#patch_coords_checkbox").is(":checked"))) {
                for (let i = 0; i < patch_coords.length; i++) {
                    id = item + "_patch_overlay_" + i

                    overlay = {
                        id: id,
                        px: patch_coords[i][1],
                        py: patch_coords[i][0],
                        width: patch_coords[i][3] - patch_coords[i][1],
                        height: patch_coords[i][2] - patch_coords[i][0],
                        className: "overlay_style_" + item
                    }
                    viewer.addOverlay(overlay);
                }
            }
        }
    }
}


function update_containers() {


    let width = $(window).width();
    if (width < 1000) {
        $("#view_container").removeClass("grid-container-2");
        $("#view_container").addClass("grid-container-1");
        if (metadata["group_user_saved"] || metadata["system_group"]) {
            $("#metadata_container").removeClass("grid-container-2");
            $("#metadata_container").addClass("grid-container-1");
        }
        $("#seadragon_viewer").css("height", "300px");
    }
    else {
        $("#view_container").removeClass("grid-container-1");
        $("#view_container").addClass("grid-container-2");
        if (metadata["group_user_saved"] || metadata["system_group"]) {
            $("#metadata_container").removeClass("grid-container-1");
            $("#metadata_container").addClass("grid-container-2");
        }
        $("#seadragon_viewer").css("height", "650px");    
    }
}


function update_higlighted_param(key) {
    let items = key.split("::");
    let config_type = items[0];
    let config_keys = items[1].split("/");
    /*
    $(".disp_names").each(function(i, e) {
        let name = $(this).val();
    */
    console.log("updating");
    for (let i = 0; i < sorted_model_uuids.length; i++) {
        let model_uuid = sorted_model_uuids[i];
        let config_id = model_uuid + "_conf";
        let conf_val;
        let key_exists = true;
        let d = configs[config_type][model_uuid];
        for (config_key of config_keys) {
            if (!(config_key in d)) {
                key_exists = false;
                break;
            }
            d = d[config_key];
        }
        if (!(key_exists)) {
            conf_val = "---";
        }
        else {
            conf_val = JSON.stringify(d, null, 4);
        }
        if ((conf_val[0] === "{") || (conf_val[0] === "[")) {
            $("#" + config_id).css("text-align", "left");
            $("#" + config_id).text(conf_val);
        }
        else {                      
            $("#" + config_id).css("text-align", "center");
            $("#" + config_id).text(conf_val);
        }

    }
}


function add_class_names() {
    for (sorting_option of Object.keys(metadata["class_map"])) {
        $("#class_combo").append($('<option>', {
            value: sorting_option,
            text: sorting_option
        }));
    }
}

function create_ensemble_and_model_headers() {

    let labels = sorted_model_names.concat(ensemble_names).concat("Annotations");
    let label_width = get_max_name_width(labels, "16px Open Sans") + 60 + "px";
    let config_width = "450px";

    $("#model_header").append(
        `<tr><th><div class="table_header" style="width: ${label_width}">Model Name</div></th>`+
        `<th><div class="table_header" style="width: ${config_width}"><div style="display:inline; padding-right: 10px">` +
        `Parameter Search:</div>` +
        `<input id="config_search" class="autocomplete"></div></div></th>`+
        `<tr>`);

    $("#ensemble_header").append(
        `<tr><th><div class="table_header" style="width: ${label_width}">Ensemble Name</div></th>`+
        `<th><div class="table_header" style="width: ${config_width}"><div style="display:inline; padding-right: 10px">` +
        `Parameter Search:</div>` +
        `<input id="ensemble_config_search" class="autocomplete"></div></div></th>`+
        `<tr>`);
}

function create_model_listing() {

    let labels = sorted_model_names.concat(ensemble_names).concat("Annotations");
    let label_width = get_max_name_width(labels, "16px Open Sans") + 60 + "px";
    let config_width = "450px";

    if (metadata["dataset_is_annotated"]) {
        $("#model_list")
            .append(`<tr><td><label class="table_label" style="text-align: left; width: ${label_width}; background-color: ${color_lookup["Annotations"]};">` +
                    `<input type="checkbox" id="Annotations_label">` +
                    `   Annotations</label></td>` +
                    `<td><div class="table_entry" style="width: ${config_width}" hidden>` +
                    `<pre style="font-size: 14px" hidden> --- </pre></div></td>` + 
                    `</tr>`);
    }

    for (let i = 0; i < sorted_model_uuids.length; i++) {

        let model_uuid = sorted_model_uuids[i];
        let model_name = sorted_model_names[i];
        let model_color = color_lookup[model_uuid];
        let label_id = model_uuid + "_label";
        let config_id = model_uuid + "_conf";

        $("#model_list")
            .append(`<tr><td>` +
                    `<label class="table_label" ` +
                            `style="text-align: left; width: ${label_width}; background-color: ${model_color};">` +
                    `<input type="checkbox" id=${label_id}>` +
                    `   ${model_name}</label></td>` +
                    `<td><div class="table_entry" style="width: ${config_width}">` +
                    `<pre id=${config_id} style="font-size: 14px"> --- </pre></div></td>` +
                    `</tr>`);
    }
}

function create_modal_model_listing() {
    let labels = sorted_model_names;
    let label_width = get_max_name_width(labels, "16px Open Sans") + 60 + "px";

    for (let i = 0; i < sorted_model_uuids.length; i++) {

        let model_uuid = sorted_model_uuids[i];
        let model_name = sorted_model_names[i];
        let model_color = color_lookup[model_uuid];
        let label_id = model_uuid + "_modal_label";

        $("#modal_model_list")
            .append(`<tr><td>` +
                    `<label class="table_label" ` +
                            `style="text-align: left; width: ${label_width}; background-color: ${model_color};">` +
                    `<input type="checkbox" id=${label_id}>` +
                    `   ${model_name}</label>` +
                    `</td></tr>`);
    }
}

function create_ensemble_listing() {

    $("#ensemble_list").empty();

    let labels = sorted_model_names.concat(ensemble_names).concat("Annotations");
    let label_width = get_max_name_width(labels, "16px Open Sans") + 60 + "px";
    let config_width = "450px";

    for (let i = 0; i < ensemble_uuids.length; i++) {

        let ensemble_uuid = ensemble_uuids[i];
        let ensemble_name = ensemble_names[i];
        let ensemble_color = color_lookup[ensemble_uuid];
        let label_id = ensemble_uuid + "_label";
        let config_id = ensemble_uuid + "_conf";

        $("#ensemble_list")
            .append(`<tr><td>` +
                    `<label class="table_label" ` +
                            `style="text-align: left; width: ${label_width}; background-color: ${ensemble_color};">` +
                    `<input type="checkbox" id=${label_id}>` +
                    `   ${ensemble_name}</label></td>` +
                    `<td><div class="table_entry" style="width: ${config_width}">` +
                    `<pre id=${config_id} style="font-size: 14px"> --- </pre></div></td>` +
                    `</tr>`);
    }


}

function show_models() {
    console.log("showing models");
    $("#counts-tab-btn").removeClass("tab-btn-active");
    $("#loss-tab-btn").removeClass("tab-btn-active");
    $("#metrics-tab-btn").removeClass("tab-btn-active");
    $("#boxplot-tab-btn").removeClass("tab-btn-active");
    $("#model-tab-btn").addClass("tab-btn-active");
    $("#counts_tab").hide();
    $("#loss_tab").hide();
    $("#metrics_tab").hide();
    $("#boxplot_tab").hide();
    $("#models_tab").show();
}

function show_counts() {
    console.log("showing counts");
    $("#model-tab-btn").removeClass("tab-btn-active");
    $("#loss-tab-btn").removeClass("tab-btn-active");
    $("#metrics-tab-btn").removeClass("tab-btn-active");
    $("#boxplot-tab-btn").removeClass("tab-btn-active");
    $("#counts-tab-btn").addClass("tab-btn-active");
    $("#models_tab").hide();
    $("#loss_tab").hide();
    $("#metrics_tab").hide();
    $("#boxplot_tab").hide();
    $("#counts_tab").show();
    draw_count_chart();
}

function show_loss_plot() {
    console.log("showing loss plot");
    $("#model-tab-btn").removeClass("tab-btn-active");
    $("#counts-tab-btn").removeClass("tab-btn-active");
    $("#metrics-tab-btn").removeClass("tab-btn-active");
    $("#boxplot-tab-btn").removeClass("tab-btn-active");
    $("#loss-tab-btn").addClass("tab-btn-active");
    $("#models_tab").hide();
    $("#counts_tab").hide();
    $("#metrics_tab").hide();
    $("#boxplot_tab").hide();
    $("#loss_tab").show();
    draw_loss_plot();
}

function show_metrics_plot() {
    console.log("showing metrics");
    $("#model-tab-btn").removeClass("tab-btn-active");
    $("#counts-tab-btn").removeClass("tab-btn-active");
    $("#loss-tab-btn").removeClass("tab-btn-active");
    $("#boxplot-tab-btn").removeClass("tab-btn-active");
    $("#metrics-tab-btn").addClass("tab-btn-active");
    $("#models_tab").hide();
    $("#counts_tab").hide();
    $("#loss_tab").hide();
    $("#boxplot_tab").hide();
    $("#metrics_tab").show();
    draw_metrics_plot();
}

function show_boxplot() {
    console.log("showing boxplot");
    $("#model-tab-btn").removeClass("tab-btn-active");
    $("#counts-tab-btn").removeClass("tab-btn-active");
    $("#loss-tab-btn").removeClass("tab-btn-active");
    $("#metrics-tab-btn").removeClass("tab-btn-active");
    $("#boxplot-tab-btn").addClass("tab-btn-active");
    $("#models_tab").hide();
    $("#counts_tab").hide();
    $("#loss_tab").hide();
    $("#metrics_tab").hide();
    $("#boxplot_tab").show();
    draw_boxplot();
}


function disable_modal() {

    $("#ensemble_modal_close").css("cursor", "default");
    $("#ensemble_modal_close").removeClass("close-hover");
    $("#ensemble_modal_close").css("opacity", 0.5);

    $("#ensemble_name").prop("disabled", true);
    $("#ensemble_name").css("opacity", 0.5);
    
    $("#ensemble_color").prop("disabled", true);
    $("#ensemble_color").css("opacity", 0.5);
    $("#ensemble_color").css("cursor", "default");

    for (model_uuid of sorted_model_uuids) {
        let label_id = model_uuid + "_modal_label";
        $("#" + label_id).prop("disabled", true);
    }
    
    $("#ensemble_method_combo").prop("disabled", true);
    $("#ensemble_method_combo").css("opacity", 0.5);
    
    $("#ensemble_iou").prop("disabled", true);
    $("#ensemble_iou").css("opacity", 0.5);


    $("#modal_model_area").css("opacity", 0.5); 
    $("#ensemble_submit_btn").prop("disabled", true);
    $("#ensemble_submit_btn").removeClass("std-button-hover");
    $("#ensemble_submit_btn").css("opacity", 0.5);
    $("#ensemble_submit_btn").css("cursor", "default");

    $("#ensemble_loader").show();
}

function enable_modal() {

    $("#ensemble_modal_close").css("cursor", "pointer");
    $("#ensemble_modal_close").addClass("close-hover");
    $("#ensemble_modal_close").css("opacity", 1.0);

    $("#ensemble_name").prop("disabled", false);
    $("#ensemble_name").css("opacity", 1.0);

    $("#ensemble_color").prop("disabled", false);
    $("#ensemble_color").css("opacity", 1.0);
    $("#ensemble_color").css("cursor", "pointer");

    for (model_uuid of sorted_model_uuids) {
        let label_id = model_uuid + "_modal_label";
        $("#" + label_id).prop("disabled", false);
    }
    $("#modal_model_area").css("opacity", 1.0);

    $("#ensemble_submit_btn").prop("disabled", false);
    $("#ensemble_submit_btn").addClass("std-button-hover");
    $("#ensemble_submit_btn").css("opacity", 1.0);
    $("#ensemble_submit_btn").css("cursor", "pointer");

    $("#ensemble_method_combo").prop("disabled", false);
    $("#ensemble_method_combo").css("opacity", 1.0);

    $("#ensemble_iou").prop("disabled", false);
    $("#ensemble_iou").css("opacity", 1.0);

    $("#ensemble_loader").hide();
}

function close_ensemble_modal() {

    $("#ensemble_name").val("");

    $("#ensemble_color").val("#AD0093");
    for (model_uuid of sorted_model_uuids) {
        let label_id = model_uuid + "_modal_label";
        $("#" + label_id).prop("checked", false);
    }
    $("#ensemble_method_combo").val("consensus");
    $("#ensemble_iou").val("0.25");
    
    $("#modal_error_message").val("");
    $("#modal_error_message").hide();
    $("#ensemble_modal").css("display", "none");

    $("#ensemble_loader").hide();
}

let metadata;
let predictions;
let ensemble_predictions = {};
let ensemble_uuids = [];
let ensemble_names = [];
let configs;
let config_keys;
let loss_records;
let dzi_image_paths;
let annotations;

let items;
let sorted_model_uuids;
let sorted_model_names;
let sorted_prediction_dirnames;
let color_lookup = {};

let viewer;
let svg_overlay;
let cur_img_name;



$(document).ready(function() {

    metadata = data["metadata"];
    predictions = data["predictions"];
    configs = data["configs"];
    config_keys = data["config_keys"];
    loss_records = data["loss_records"];
    dzi_image_paths = data["dzi_image_paths"];
    annotations = data["annotations"];

    cur_img_name = basename(dzi_image_paths[0]);
    cur_img_name = cur_img_name.substring(0, cur_img_name.length-4);

    if (metadata["system_group"]) {
        let group_name = metadata["group_name"];
        let group_description = metadata["group_description"];
        $("#metadata_container").removeClass("grid-container-1");
        $("#metadata_container").addClass("grid-container-2");
        $("#metadata_container").append(`<div class="half-round-item-2">` + 
                                        `<table class="transparent_table" style="float: left;" id="group_metadata_table"></table></div>`);
        $("#group_metadata_table").append(
            `<tr>` +
            `<td class="table_head">Group Name:</td>` + 
            `<td class="table_text">${group_name}</td>` + 
            `</tr>`);
        $("#group_metadata_table").append(
            `<tr>` +
            `<td class="table_head">Group Description:</td>` + 
            `<td class="table_text">${group_description}</td>` + 
            `</tr>`);
    }


    $("#ensemble_iou").val("0.25");

    set_sorted_uuids_and_names();
    add_class_names();
    set_color_lookup();
    set_overlay_classes();
    set_count_chart_data();
    set_loss_plot_data();
    set_metrics_plot_data();
    set_boxplot_data();
    add_boxplot_metric_options();
    add_boxplot_class_options();

    update_containers();

    add_training_sequence_options();

    add_axis_options();
    add_axis_class_options("#x_axis_combo", "#x_axis_cls_combo");
    add_axis_class_options("#y_axis_combo", "#y_axis_cls_combo");

    
    $("#farm_name_entry").text(metadata["farm_name"]);
    $("#field_name_entry").text(metadata["field_name"]);
    $("#mission_date_entry").text(metadata["mission_date"]);
    $("#dataset_name_entry").text(metadata["dataset_name"]);

    create_ensemble_and_model_headers();
    create_model_listing();
    create_modal_model_listing();

    viewer = OpenSeadragon({
        id: "seadragon_viewer",
        sequenceMode: true,
        prefixUrl: "/plant_detection/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 100,
        zoomPerClick: 1,
        nextButton: "next-button",
        previousButton: "prev-button",
        showNavigationControl: false
    });


    viewer.addHandler("open", function(event) {
        let img_files_name = basename(event.source);
        let img_name = img_files_name.substring(0, img_files_name.length - 4);
        $("#image_name").text(img_name);
        cur_img_name = img_name;
        update_overlays();
        update_count_chart();
    });

    if (metadata["highlighted_param"] !== null) {
        $("#config_search").val(metadata["highlighted_param"]);
        update_higlighted_param(metadata["highlighted_param"]);
    }

    $("#model_list").change(function() {
        if ($("#loss_show_selected").is(":checked")) {
            draw_loss_plot();
        }
        update_overlays();
    });

    $("#ensemble_list").change(function() {
        update_overlays();
    });


    $(window).resize(function() {
        update_containers();
        draw_count_chart();
        draw_loss_plot();
        draw_boxplot();
        if (metadata["dataset_is_annotated"]) {
            draw_metrics_plot();
        }
    });

    $("#config_search").autocomplete({
        source: config_keys,
        select: function(event, ui) {
            let key = ui["item"]["value"];
            update_higlighted_param(key);
            
        }
    });

    $("#x_axis_combo").change(function() {
        add_axis_class_options("#x_axis_combo", "#x_axis_cls_combo");
        update_metrics_plot();
    });
    $("#y_axis_combo").change(function() {
        add_axis_class_options("#y_axis_combo", "#y_axis_cls_combo");
        update_metrics_plot();
    });
    $("#x_axis_cls_combo").change(function() {
        update_metrics_plot();
    });
    $("#y_axis_cls_combo").change(function() {
        update_metrics_plot();
    });

    $("#boxplot_metric_combo").change(function() {
        add_boxplot_class_options();
        draw_boxplot();
    });
    $("#boxplot_class_combo").change(function() {
        draw_boxplot();
    });


    $("#scores_checkbox").change(function() {
        update_overlays();
    });
    $("#patch_coords_checkbox").change(function() {
        update_overlays();
    });

    $(".loss_radio").change(function() {
        draw_loss_plot();
    });

    $("#class_combo").change(function() {
        update_overlays();
        update_count_chart();
    });

    $("#sequence_combo").change(function() {
        draw_loss_plot();
    });

    $("#add_ensemble").click(function() {
        enable_modal();;
        $("#ensemble_modal").css("display", "block");
    });

    $("form").submit(function(e) {
        e.preventDefault();

        $("#modal_error_message").val("");
        $("#modal_error_message").hide();
        disable_modal();

        let ensemble_name = $("#ensemble_name").val();

        let label_id;
        let ensemble_model_uuids = [];
        let ensemble_prediction_dirnames = [];
        for (let i = 0; i < sorted_model_uuids.length; i++) {
            label_id = sorted_model_uuids[i] + "_modal_label";
            if ($("#" + label_id).is(":checked")) {
                ensemble_model_uuids.push(sorted_model_uuids[i]);
                ensemble_prediction_dirnames.push(sorted_prediction_dirnames[i]);
            }
        }

        let ensemble_method = $("#ensemble_method_combo").val();
        let inter_group_iou_thresh = $("#ensemble_iou").val();
        let intra_group_iou_thresh = $("#ensemble_iou").val();

        if (ensemble_model_uuids.length == 0) {
            $("#modal_error_message").text("Please select at least one model.");
            $("#modal_error_message").show();
            enable_modal();
        }
        else {

            $.post($(location).attr('href'),
            {
                ensemble_name: ensemble_name,
                model_uuids: ensemble_model_uuids.join(","),
                prediction_dirnames: ensemble_prediction_dirnames.join(","),
                ensemble_method: ensemble_method,
                inter_group_iou_thresh: inter_group_iou_thresh,
                intra_group_iou_thresh: intra_group_iou_thresh
            },
            
            function(response, status) {

                if (response.error) {       
                    $("#ensemble_loader").hide();
                    $("#ensemble_modal_close").css("cursor", "pointer");
                    $("#ensemble_modal_close").addClass("close-hover");
                    $("#ensemble_modal_close").css("opacity", 1.0);


                    $("#modal_error_message").text(response.message);
                    $("#modal_error_message").show();

                }
                else {
                    console.log("Got ensemble predictions", response);
                    let ensemble_uuid = response.ensemble_uuid;
                    ensemble_uuids.push(ensemble_uuid);
                    ensemble_names.push(ensemble_name);
                    ensemble_predictions[ensemble_uuid] = response.predictions;


                    color_lookup[ensemble_uuid] = $("#ensemble_color").val();
                    create_overlay_class(ensemble_uuid);
                    create_ensemble_listing();
                    set_count_chart_data();
                    draw_count_chart();

                    set_boxplot_data();
                    draw_boxplot();

                    close_ensemble_modal();

                }
            });
        }
    });


    $("#ensemble_modal_close").click(function() {
        if ($("#ensemble_modal_close").hasClass("close-hover")) {
            close_ensemble_modal();
        }
    })
});