function basename(path) {
    if (path.slice(-1) === "/") {
        path = path.substring(0, path.length - 1);
    }
    return path.split('/').reverse()[0];
}



function set_sorted_uuids_and_names() {
    items = [];
    for (let i = 0; i < metadata["model_uuids"].length; i++) {
        items.push([metadata["model_uuids"][i], metadata["model_names"][i]])
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
    style.innerHTML = "." + className + " { opacity: 0.7; " +
                                            "filter: alpha(opacity=70); " +
                                            "outline: 1px auto " + color_lookup[uuid] + "; " +
                                            "background-color: transparent;" +
                                            "font-size: 20px;" +
                                            "font-family: arial;" +
                                            "color: white; }";
    document.getElementsByTagName("head")[0].appendChild(style);
}

function set_overlay_classes() {

    create_overlay_class("Annotations");

    for (model_uuid of sorted_model_uuids) {
        create_overlay_class(model_uuid)
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

    $(".disp_names:checked").each(function(i, e) {

        is_annotations = $(this).val() === "Annotations";
        if (is_annotations) {
            if (sel_class in annotations[cur_img_name]["class_boxes"])
                boxes = annotations[cur_img_name]["class_boxes"][sel_class];
            else
                boxes = [];

        }
        else {
            if (sel_class in predictions[$(this).val()]["image_predictions"][cur_img_name]["pred_class_boxes"])
                boxes = predictions[$(this).val()]["image_predictions"][cur_img_name]["pred_class_boxes"][sel_class];
            else
                boxes = [];
            patch_coords = predictions[$(this).val()]["image_predictions"][cur_img_name]["patch_coords"];
        }
        let id;
        let score;
        for (let i = 0; i < boxes.length; i++) {
            id = $(this).val() + "_overlay_" + i;

            overlay = {
                id: id,
                px: boxes[i][1],
                py: boxes[i][0],
                width: boxes[i][3] - boxes[i][1],
                height: boxes[i][2] - boxes[i][0],
                className: "overlay_style_" + $(this).val()
            }

            if (!(is_annotations)) {
                score = predictions[$(this).val()]["image_predictions"][cur_img_name]["nms_pred_scores"][i];
                score = (Math.round(score * (10**2)) / (10**2)).toFixed(2);
                $("#left_container").append(`<div class="overlay_div" id="${id}">${score}</div>`);
                overlay["onDraw"] = function(position, size, element) {

                    if ($("#scores_checkbox").is(":checked")) {

                        let text = "0.00"; //$("#" + element.id).text(); //"0.00";
                        let font_family = "arial"; //$("#" + element.id).css("font-family");
                        let font_size = "20px"; //$("#" + element.id).css("font-size");
                        
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
                id = $(this).val() + "_patch_overlay_" + i

                overlay = {
                    id: id,
                    px: patch_coords[i][1],
                    py: patch_coords[i][0],
                    width: patch_coords[i][3] - patch_coords[i][1],
                    height: patch_coords[i][2] - patch_coords[i][0],
                    className: "overlay_style_" + $(this).val()
                }
                viewer.addOverlay(overlay);
            }
        }

    });

}





function update_containers() {


    let width = $(window).width();
    if (width < 1000) {
        $("#view_container").removeClass("grid-container-2");
        $("#view_container").addClass("grid-container-1");
        $("#view_container_2").removeClass("grid-container-2");
        $("#view_container_2").addClass("grid-container-1");
        if (metadata["group_user_saved"] || metadata["system_group"]) {
            $("#metadata_container").removeClass("grid-container-2");
            $("#metadata_container").addClass("grid-container-1");
        }
        $("#seadragon_viewer").css("height", "300px");
    }
    else {
        $("#view_container").removeClass("grid-container-1");
        $("#view_container").addClass("grid-container-2");
        $("#view_container_2").removeClass("grid-container-1");
        $("#view_container_2").addClass("grid-container-2");
        if (metadata["group_user_saved"] || metadata["system_group"]) {
            $("#metadata_container").removeClass("grid-container-1");
            $("#metadata_container").addClass("grid-container-2");
        }
        $("#seadragon_viewer").css("height", "600px");    
    }
}


function update_higlighted_param(key) {
    let items = key.split("::");
    let config_type = items[0];
    let config_keys = items[1].split("/");
    $(".disp_names").each(function(i, e) {
        let name = $(this).val();
        if (name !== "Annotations") {
            let config_id = name + "_conf";
            let conf_val;
            let key_exists = true;
            let d = configs[config_type][name];
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

    });
}


function add_class_names() {
    for (sorting_option of Object.keys(metadata["class_map"])) {
        $("#class_combo").append($('<option>', {
            value: sorting_option,
            text: sorting_option
        }));
    }
}


let metadata;
let predictions;
let configs;
let config_keys;
let loss_records;
let dzi_image_paths;
let annotations;

let items;
let sorted_model_uuids;
let sorted_model_names;
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




    set_sorted_uuids_and_names();
    add_class_names();
    set_color_lookup();
    set_overlay_classes();
    set_count_chart_data();
    set_loss_plot_data();
    set_metrics_plot_data();

    update_containers();
    draw_count_chart();

    add_training_sequence_options();
    draw_loss_plot();

    add_axis_options();
    add_axis_class_options("#x_axis_combo", "#x_axis_cls_combo");
    add_axis_class_options("#y_axis_combo", "#y_axis_cls_combo");

    draw_metrics_plot();


    $("#farm_name_entry").text(metadata["farm_name"]);
    $("#field_name_entry").text(metadata["field_name"]);
    $("#mission_date_entry").text(metadata["mission_date"]);
    $("#dataset_name_entry").text(metadata["dataset_name"]);

    let label_width = get_max_name_width(sorted_model_names, "16px Open Sans") + 60 + "px";
    let config_width = "400px"

    $("#model_list").append(
        `<tr><th><div class="table_header" style="width: ${label_width}">Model Name</div></th>`+
        `<th><div class="table_header" style="width: ${config_width}"><div style="display:inline; padding-right: 10px">` +
        `Highlighted Parameter:</div>` +
        `<input id="config_search" class="autocomplete"></div></div></th>`+
        `<tr>`);


    $("#model_list")
        .append(`<tr><td><label class="table_label" style="text-align: left; width: ${label_width}; background-color: ${color_lookup["Annotations"]};">` +
                `<input type="checkbox" class="disp_names" value="Annotations">` +
                `   Annotations</label>` +
                `<td><div class="table_entry" style="width: ${config_width}" hidden>` +
                `<pre style="font-size: 14px" hidden> --- </pre></div></td>` + 
                `</td></tr>`);

    for (let i = 0; i < sorted_model_uuids.length; i++) {

        let model_uuid = sorted_model_uuids[i];
        let model_name = sorted_model_names[i];
        let model_color = color_lookup[model_uuid];
        let config_id = model_uuid + "_conf";

        $("#model_list")
            .append(`<tr><td>` +
                    `<label class="table_label" ` +
                            `style="text-align: left; width: ${label_width}; background-color: ${model_color};">` +
                    `<input type="checkbox" class="disp_names" value=${model_uuid}>` +
                    `   ${model_name}</label>` +
                    `<td><div class="table_entry" style="width: ${config_width}">` +
                    `<pre id=${config_id} style="font-size: 14px"> --- </pre></div></td>` +
                    `</td></tr>`);

    }


    viewer = OpenSeadragon({
        id: "seadragon_viewer",
        sequenceMode: true,
        prefixUrl: "/plant_detection/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 100
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
        if ($("#loss_show_selected:checked").val()) {
            draw_loss_plot();
        }
        update_overlays();
    });


    $(window).resize(function() {
        update_containers();
        draw_count_chart();
        draw_loss_plot();
        draw_metrics_plot();
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
    })
});