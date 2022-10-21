

// import { bilinearInterpolation } from "simple-bilinear-interpolation";


let image_set_info;
let metadata;
let camera_specs;
let dzi_image_paths;
let annotations;
let image_to_dzi;

let viewer;
let anno;
let prediction_anno;
let cur_img_name;
let cur_img_list;
let cur_view;
let countdown_handle;
let ask_to_continue_handle;
let cur_update_num = -1;
//let pending_predictions;
let predictions;
let map_download_uuid = "";
// let metrics = {};

let cur_panel;
let cur_bounds = null;
//let cur_status;


let map_url = null;
let min_max_rec = null;

let num_training_images;
let model_unassigned = true;
let num_images_fully_trained_on;
let train_num_increased = false;

let waiting_for_model_switch = false;
let inspected_model_log;

// let overlay_colors = [
//     "#0080C0",        
//     "#FF4040"
// ];
// let overlay_names = [
//     "annotations",
//     "predictions"
// ];




function set_prediction_overlay_color() {

    for (let image_name of Object.keys(predictions)) {
        for (let annotation of predictions[image_name]["annotations"]) {
            annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"})
        }
    }
}
  






function change_image(img_name) {

    cur_img_name = img_name;

    let index = cur_img_list.findIndex(x => x == cur_img_name);
    if (index == 0) {
        disable_std_buttons(["prev_image_button"]);
    }
    else {
        enable_std_buttons(["prev_image_button"]);
    }
    if (index == cur_img_list.length - 1) {
        disable_std_buttons(["next_image_button"]);
    }
    else {
        enable_std_buttons(["next_image_button"]);
    }

    $("#image_name").text(cur_img_name);
    set_image_status_combo();

    if (cur_panel === "annotation") {
        show_annotation(true);
    }
    else if (cur_panel === "prediction") {
        show_prediction(true);
    }
    else {
        show_segmentation();
    }
}


function create_image_set_table() {

    let image_name_col_width = "180px";
    let image_status_col_width = "60px";

    cur_img_list = [];
    $("#image_set_table").empty();
    /*
    $("#image_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${image_name_col_width};">Name</div></th>` +
            //`<th><div class="table_header" style="width: ${image_status_col_width}">Annotation Status</div></th>` +
            //`<th><div class="table_header" style="width: ${image_dataset_col_width}">Assigned Dataset</div></th>` +
            `</tr>`);*/

    let abbreviation = {
        "unannotated": "Un.",
        "started": "St.",
        //"completed_for_training": "C. Tr.",
        "completed_for_training": "C. Fi.",
        "completed_for_testing": "C. Te."
    };



    for (let image_name of natsort(Object.keys(annotations))) {
        // let image_name = basename(dzi_image_path);
        // let extensionless_name = image_name.substring(0, image_name.length - 4);


        //let img_status = image_set_data["images"][extensionless_name]["status"];

        let image_status = annotations[image_name]["status"];
        let abbreviated_status = abbreviation[image_status];
        let image_color = status_color[image_status];
            
        let item = `<tr>` +
           
            //`<td><div>${extensionless_name}</div></td>` +
            //`<td><div class="table_entry std_tooltip" style="background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}` +
            //`<span class="std_tooltiptext">${image_status}</span></div></td>` +

            `<td><div class="table_entry std_tooltip" style="margin: 0px 1px; background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}</div></td>` +


            `<td><div class="table_button table_button_hover" style="width: ${image_name_col_width}; margin: 0px 1px;" ` +
            // `onclick="change_image('${dzi_image_path}')">${extensionless_name}</div></td>` +
             `onclick="change_image('${image_name}')">${image_name}</div></td>` +
            //`</div></td>` + 
            //`<td><div class="table_entry">${img_dataset}</div></td>` +
            `</tr>`;
        $("#image_set_table").append(item);

        cur_img_list.push(image_name);

    }
}



function resize_px_str(px_str) {
    px_str = px_str.substring(11);
    let px_lst = px_str.split(",").map(x => parseFloat(x));
    let img_dims = viewer.world.getItemAt(0).getContentSize();
    let img_w = img_dims.x;
    let img_h = img_dims.y;

    let box_min_x = Math.max(px_lst[0], 0);
    let box_min_y = Math.max(px_lst[1], 0);

    let box_max_x = Math.min(px_lst[0] + px_lst[2], img_w);
    let box_max_y = Math.min(px_lst[1] + px_lst[3], img_h);


    let box_centre_x = (box_max_x + box_min_x) / 2;
    let box_centre_y = (box_max_y + box_min_y) / 2;

    let box_w = box_max_x - box_min_x;
    let box_h = box_max_y - box_min_y;

    let min_dim = 4;
    if (box_w < min_dim) {

        let tentative_box_min_x = box_centre_x - Math.floor(min_dim / 2);
        let tentative_box_max_x = box_centre_x + Math.floor(min_dim / 2);
        if (tentative_box_min_x < 0) {
            box_min_x = 0;
            box_max_x = min_dim;
        }
        else if (tentative_box_max_x > img_w) {
            box_min_x = (img_w) - min_dim;
            box_max_x = img_w;
        }
        else {
            box_min_x = tentative_box_min_x;
            box_max_x = tentative_box_max_x;
        }
        
    }
    if (box_h < min_dim) {
        let tentative_box_min_y = box_centre_y - Math.floor(min_dim / 2);
        let tentative_box_max_y = box_centre_y + Math.floor(min_dim / 2);
        if (tentative_box_min_y < 0) {
            box_min_y = 0;
            box_max_y = min_dim;
        }
        else if (tentative_box_max_y > img_h) {
            box_min_y = (img_h) - min_dim;
            box_max_y = img_h;
        }
        else {
            box_min_y = tentative_box_min_y;
            box_max_y = tentative_box_max_y;
        }
    }

    box_w = box_max_x - box_min_x;
    box_h = box_max_y - box_min_y;

    let updated_px_str = "xywh=pixel:" + box_min_x + "," + box_min_y +
                         "," + box_w + "," + box_h;

    return updated_px_str;

}

function update_image_status() {
    let prev_status = annotations[cur_img_name]["status"];
    let num_image_annotations = annotations[cur_img_name]["annotations"].length;
    let new_status = prev_status;
    if (prev_status === "unannotated" && num_image_annotations > 0) {
        new_status = "started";
    }
    else if (prev_status === "started" && num_image_annotations == 0) {
        new_status = "unannotated";
    }
    annotations[cur_img_name]["status"] = new_status;
}

function set_image_status_combo() {

    let cur_image_status = annotations[cur_img_name]["status"];
    let num_annotations = annotations[cur_img_name]["annotations"].length;
    let image_status_options;
    if (cur_image_status === "completed_for_training") { //training") {
        image_status_options = ["completed_for_training"]; //training"];
    }
    else if (cur_image_status === "completed_for_testing") {
        if (num_annotations == 0) {
            image_status_options = ["unannotated", "completed_for_training", "completed_for_testing"];
        }
        else {
            image_status_options = ["started", "completed_for_training", "completed_for_testing"];
        }
    }
        /*
        if (num_annotations > 0) {
            image_status_options = ["started", "completed"];
        }
        else {
            image_status_options = ["unannotated", "completed"];
        }*/
    else if (cur_image_status === "started") {
        image_status_options = ["started", "completed_for_training", "completed_for_testing"];
    }
    else if (cur_image_status === "unannotated") {
        image_status_options = ["unannotated", "completed_for_training", "completed_for_testing"];
    }


    $("#status_combo").empty();
    $("#status_combo").css("background-color", status_color[cur_image_status]);
    for (let image_status of image_status_options) {
        let color = status_color[image_status];
        let text = status_to_text[image_status];
        //$("#status_combo").append(`<option style="background-color: ${color}" value="${image_status}">${image_status}</option>`);
        $("#status_combo").append(`<option style="background-color: ${color}" value="${image_status}">${text}</option>`);
        /*
        $("#status_combo").append($('<option style="background-color: red">', {
            value: image_status,
            text: image_status
        }));*/
    }
    $("#status_combo").val(cur_image_status);
}


function create_anno() {


    anno = OpenSeadragon.Annotorious(viewer, {
        disableEditor: true,
        disableSelect: true, //false, //readOnly,
        readOnly: true, //false, //readOnly,
        formatter: formatter
    });


    anno.on('createAnnotation', function(annotation) {

        annotations[cur_img_name]["annotations"] = anno.getAnnotations();

        // annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

        update_image_status();
        set_image_status_combo();
        $("#save_icon").css("color", "#ed452b");
        create_image_set_table();
    });

    anno.on('createSelection', async function(selection) {

        selection.target.source = window.location.href;

        selection.body = [{
            type: 'TextualBody',
            purpose: 'class',
            value: 'plant'
        }];

        let px_str = selection.target.selector.value;
        let updated_px_str = resize_px_str(px_str);

        selection.target.selector.value = updated_px_str;

        // Make sure to wait before saving!
        await anno.updateSelected(selection);
        anno.saveSelected();

        
    });

    anno.on('updateAnnotation', async function(annotation, previous) {

        let px_str = annotation.target.selector.value;
        let updated_px_str = resize_px_str(px_str);

        annotation.target.selector.value = updated_px_str;

        await anno.updateSelected(annotation);
        anno.saveSelected();

        annotations[cur_img_name]["annotations"] = anno.getAnnotations();
        $("#save_icon").css("color", "#ed452b");

        // annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

        add_annotations();
    });

}


function create_viewer_and_anno(viewer_id) {

    //$("#seadragon_viewer").empty();
/*
    let sources = [];
    for (let dzi_image_path of dzi_image_paths) {
        let src = new OpenSeadragon.DziTileSource({
            tilesUrl: dzi_image_path,
            maxLevel: 7
        });
        console.log(src);
        sources.push(src);
    }*/


    viewer = OpenSeadragon({
        id: viewer_id, //"seadragon_viewer",
        sequenceMode: true,
        prefixUrl: get_CC_PATH() + "/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 100,
        zoomPerClick: 1,
        nextButton: "next-btn",
        previousButton: "prev-btn",
        showNavigationControl: false,
        preserveViewport: true,
        //imageSmoothingEnabled: false,
        //minZoomLevel: 1,
        //maxZoomLevel: 7
        //minPixelRatio: 2
        //maxZoomPixelRatio: 20
        //homeFillsViewer: true
        //defaultZoomLevel: 1.1,
        //viewportMargins: 20
        //navigatorMaintainSizeRatio: true
    });

    create_anno();
    /*
    anno = OpenSeadragon.Annotorious(viewer, {
        disableEditor: true,
        formatter: formatter
    });*/
/*
    prediction_anno = OpenSeadragon.Annotorious(viewer, {
        disableEditor: true,
        disableSelect: true,
        readOnly: true,
        formatter: formatter
    });*/

    viewer.innerTracker.keyDownHandler = function(e) {

        if (e.keyCode == 46) {

            let selected = anno.getSelected();
            anno.removeAnnotation(selected);

            annotations[cur_img_name]["annotations"] = anno.getAnnotations();

            // annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

            update_image_status();
            set_image_status_combo();
            $("#save_icon").css("color", "#ed452b");
            create_image_set_table();

        }

    }

    viewer.addHandler("open", function(event) {

        if (cur_bounds) {
            withFastOSDAnimation(viewer.viewport, function() {
                viewer.viewport.fitBounds(cur_bounds);
            });
        }
        
    });

}

function withFastOSDAnimation(viewport, f) {

    // save old ones
    var oldValues = {};
    oldValues.centerSpringXAnimationTime = viewport.centerSpringX.animationTime;
    oldValues.centerSpringYAnimationTime = viewport.centerSpringY.animationTime;
    oldValues.zoomSpringAnimationTime = viewport.zoomSpring.animationTime;
    
    // set our new ones
    viewport.centerSpringX.animationTime =
      viewport.centerSpringY.animationTime =
      viewport.zoomSpring.animationTime =
      0.01;
    
    // callback
    f()
    
    // restore values
    viewport.centerSpringX.animationTime = oldValues.centerSpringXAnimationTime;
    viewport.centerSpringY.animationTime = oldValues.centerSpringYAnimationTime;
    viewport.zoomSpring.animationTime = oldValues.zoomSpringAnimationTime;
    }




function build_map() {
    disable_buttons(["build_map_button"]);
    $("#build_loader").show();
    //let sel_metric = $("input[type='radio'][name='metric']:checked").val();
    let sel_interpolation = $("input[type='radio'][name='interpolation']:checked").val();
    

    $.post($(location).attr('href'),
    {
        action: "build_map",
        interpolation: sel_interpolation,
        map_download_uuid: map_download_uuid
    },
    
    function(response, status) {
        $("#build_loader").hide();
        enable_buttons(["build_map_button"]);

        if (response.error) {  
            show_modal_message("Error", "An error occurred during the generation of the density map.");  
            // map_url = null;
            // draw_map_chart();
        }
        else {
            map_download_uuid = response.map_download_uuid;

            let timestamp = new Date().getTime();   
            
            let base = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
                    image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/maps/" + map_download_uuid;

            map_url = base + "_annotated_map.svg?t=" + timestamp;



            let min_max_rec_url = base + "_min_max_rec.json?t=" + timestamp;
            min_max_rec = get_json(min_max_rec_url);

            draw_map_chart();
        }
    });


}

function show_map() {
    cur_view = "map";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-image" style="padding-right: 10px; color: white;"></i>Image View`);

    //$("#initialize_container").hide();
    $("#image_view_container").hide();
    $("#map_view_container").show();


    let num_completed = 0;
    for (let image_name of Object.keys(annotations)) {
        
        if (annotations[image_name]["status"] == "completed_for_training" ||
            annotations[image_name]["status"] == "completed_for_testing") {
            num_completed++;
        }
    }

    if (num_completed >= 3) {
        $("#insufficient_annotation_container").hide();
        $("#map_builder_controls_container").show();
    }
    else {
        $("#map_builder_controls_container").hide();
        $("#insufficient_annotation_container").show();
    }

    //draw_map_chart();
}


function show_image(image_name) {
    cur_view = "image";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-location-dot" style="padding-right: 10px; color: white;"></i>Map View`);
    
    //$("#initialize_container").hide();
    $("#map_view_container").hide();
    $("#image_view_container").show();


    change_image(image_name);
    /*
    if (cur_panel === "annotation") {
        show_annotation(true);
    }
    else if (cur_panel === "prediction") {
        show_prediction(true);
    }*/
/*
    let dzi_image_path = image_to_dzi[cur_img_name];
    viewer.open(dzi_image_path);

    create_image_set_table();*/
}


function save_annotations() {

    $("#save_button").hide();
    $("#fake_save_button").show();


    $.post($(location).attr('href'),
    {
        action: "save_annotations",
        annotations: JSON.stringify(annotations),
        excess_green_record: JSON.stringify(excess_green_record),
        train_num_increased: train_num_increased ? "True" : "False"
    },
    
    function(response, status) {
        
        if (response.error) {
            //create_image_set_table();
            show_modal_message("Error", "Failed to save.");
        }
        else {
            train_num_increased = false;
            num_training_images = 0;
            for (image_name of Object.keys(annotations)) {
                if (annotations[image_name]["status"] === "completed_for_training") {
                    num_training_images++;
                }
            }
            if (model_unassigned) {
                $("#model_fully_trained").html("---");
                $("#model_fine_tuned").html("---");
            }
            else {
                if (num_training_images == num_images_fully_trained_on) {
                    $("#model_fully_trained").html("Yes");
                }
                else {
                    $("#model_fully_trained").html("No");
                }
                if (num_training_images > 0) {
                    $("#model_fine_tuned").html("Yes");
                }
                else {
                    $("#model_fine_tuned").html("No");
                }
            }
            
            create_image_set_table();
            $("#save_icon").css("color", "white");
            $("#fake_save_button").hide();
            $("#save_button").show();
        }
    });

}


function expired_session() {

    save_annotations();
    window.location.href = get_CC_PATH() + "/home/" + username;

}

function confirmed_continue() {
    clearInterval(countdown_handle);
    close_modal();
    ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000);
}

function ask_to_continue() {
    
    $("#modal_head").empty();
    $("#modal_body").empty();

    $("#modal_head").append(
        `<p>Refresh Annotation Session</p>`);
    

    $("#modal_body").append(`<p id="modal_message" align="left">` +
    `Your annotation session will expire in <span id="countdown_timer">180</span> seconds. Please confirm if you wish to continue annotating.</p>`);
    let countdown_val = 180;
    countdown_handle = window.setInterval(function() {
        countdown_val -= 1;
        $("#countdown_timer").html(countdown_val);

        if (countdown_val == 0) {
            clearInterval(countdown_handle);
            expired_session();
        }
    }, 1000);

    
    $("#modal_body").append(`<div id="modal_button_container">
        <button id="continue_annotate" class="std-button std-button-hover" `+
        `style="width: 200px" onclick="confirmed_continue()">Continue Annotating</button>` +
        `</div>`);

    
    $("#modal").css("display", "block");
}

/*
$(window).bind('beforeunload', function(event){

    $.post($(location).attr('href'),
    {
        action: "expired_lock_file"
    },
    
    function(response, status) {

    });
});*/

function create_overlays_table() {

    let models_col_width = "215px";

    for (let overlay_name of Object.keys(overlay_colors)) {
        let overlay_color = overlay_colors[overlay_name];
        let overlay_id = overlay_name.toLowerCase();

        let model_row_id = overlay_name + "_row";
        $("#overlays_table").append(`<tr id=${model_row_id}>` +
            `<td><label class="table_label" ` +
            `style="width: ${models_col_width}; background-color: ${overlay_color};">` +
            `<table class="transparent_table">` +
            `<tr>` + 
            `<td style="width: 40px">` +
                `<label class="switch">` +
                `<input id=${overlay_id} type="checkbox" checked></input>` +
                `<span class="switch_slider round"></span></label>` +
            `</td>` +
            `<td style="width: 100%">` +
                `<div style="margin-left: 8px">${overlay_name}</div>` +
            `</td>` +
            `</tr>` +
            `</table>` +
            `</label>` +
            `</td>`+
            `</tr>`);
    }
}


function confirmed_use_predictions() {
    annotations[cur_img_name]["annotations"] = [];

    let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
    for (let annotation of predictions[cur_img_name]["annotations"]) {
        let new_annotation = structuredClone(annotation);
        let bodies = Array.isArray(new_annotation.body) ? new_annotation.body : [ new_annotation.body ];
        let highlightBodyIndex = bodies.findIndex(b => b.purpose == 'highlighting');
        //let highlightBody = bodies[highlightBodyIndex];
        let scoreTagIndex = bodies.findIndex(b => b.purpose == 'score');
        let scoreTag = bodies[scoreTagIndex];

        if (scoreTag.value >= slider_val) {
            //let index = annotation["body"].indexOf(highlightBody);
            if (highlightBodyIndex !== -1) {
                new_annotation["body"].splice(highlightBodyIndex, 1);
            }
            if (scoreTagIndex !== -1) {
                new_annotation["body"].splice(scoreTagIndex, 1);
            }
            annotations[cur_img_name]["annotations"].push(new_annotation);
        }
    }
    //$("#save_icon").css("color", "#ed452b");
    close_modal();
    //update_image_status();
    //set_image_status_combo();
    //return_to_annotate();

    update_image_status();
    set_image_status_combo();
    $("#save_icon").css("color", "#ed452b");
    create_image_set_table();


    show_annotation();
}


function show_annotation(force_reset=false) {

    $("#show_annotation_button").addClass("tab-btn-active");
    $("#show_prediction_button").removeClass("tab-btn-active");
    $("#show_segmentation_button").removeClass("tab-btn-active");

    
    if (((viewer == null) || (force_reset)) || (cur_panel === "segmentation"))
        cur_bounds = null;
    else
        cur_bounds = viewer.viewport.getBounds();

    cur_panel = "annotation";
    //$("#segmentation_viewer").hide();
    $("#prediction_panel").hide();
    $("#segmentation_panel").hide();
    //$("#seadragon_viewer").show();
    $("#annotation_panel").show();

    $("#seadragon_viewer").empty();



    create_viewer_and_anno("seadragon_viewer");
    anno.readOnly = annotations[cur_img_name]["status"] === "completed_for_training";
    add_annotations();

    let dzi_image_path = image_to_dzi[cur_img_name];
    viewer.open(dzi_image_path);

}


function show_prediction(force_reset=false) {

    $("#show_annotation_button").removeClass("tab-btn-active");
    $("#show_prediction_button").addClass("tab-btn-active");
    $("#show_segmentation_button").removeClass("tab-btn-active");

    if (((viewer == null) || (force_reset)) || (cur_panel === "segmentation"))
        cur_bounds = null;
    else
        cur_bounds = viewer.viewport.getBounds();
    
    cur_panel = "prediction";


    $("#annotation_panel").hide();
    $("#segmentation_panel").hide();
    $("#prediction_panel").show();
    //$("#seadragon_viewer").show();

    $("#seadragon_viewer").empty();

        
    create_viewer_and_anno("seadragon_viewer");
    anno.readOnly = true;

    //retrieve_predictions();

    $("#predictions_unavailable").hide();
    $("#predictions_available").hide();
    if (cur_img_name in predictions) {
        $("#predictions_available").show();
        //set_count_chart_data();
        set_count_chart_data();
        set_score_chart_data();
        update_count_chart();
        update_score_chart();
    }
    else {
        $("#predictions_unavailable").show();
    }
    add_annotations();
    
    
    let dzi_image_path = image_to_dzi[cur_img_name];
    viewer.open(dzi_image_path);
}



function show_segmentation_inner() {

    cur_panel = "segmentation";

    $("#show_annotation_button").removeClass("tab-btn-active");
    $("#show_prediction_button").removeClass("tab-btn-active");
    $("#show_segmentation_button").addClass("tab-btn-active");


    //$("#seadragon_viewer").hide();
    $("#annotation_panel").hide();
    $("#prediction_panel").hide();
    //$("#segmentation_viewer").show();
    $("#segmentation_panel").show();

    disable_std_buttons(["request_segment_button"]);
    $("#image_loader").show();

    //let timestamp = new Date().getTime();

    let exg_src = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/"
                    + image_set_info["field_name"] + "/" + image_set_info["mission_date"] + 
                    "/excess_green/" + cur_img_name + ".png"; //?t=" + timestamp;
    let rgb_src = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/"
                    + image_set_info["field_name"] + "/" + image_set_info["mission_date"] + 
                    "/images/" + cur_img_name + image_set_info["image_ext"]; // + "?t=" + timestamp; //".JPG"; //?t=" + timestamp;


    let min_val = excess_green_record[cur_img_name]["min_val"];
    let max_val = excess_green_record[cur_img_name]["max_val"];
    let sel_val = excess_green_record[cur_img_name]["sel_val"].toFixed(2);

    $("#threshold_slider_container").empty();
    $("#threshold_slider_container").append(
        `<input type="range" min="${min_val}" max="${max_val}" step="0.01" value="${sel_val}" class="slider" id="threshold_slider">`
    );
    $("#threshold_slider_val_container").empty();
    $("#threshold_slider_val_container").append(
        `<div id="threshold_slider_val" class="header2">${sel_val}</div>`
    );

    $("#threshold_slider").on("input", function() {
        $("#save_icon").css("color", "#ed452b");
        excess_green_record[cur_img_name]["sel_val"] = parseFloat(parseFloat($("#threshold_slider").val()).toFixed(2));
        $("#threshold_slider_val").html( excess_green_record[cur_img_name]["sel_val"]);
    });

    $("#threshold_slider").change(function() {
        $("#save_icon").css("color", "#ed452b");
        excess_green_record[cur_img_name]["sel_val"] = parseFloat(parseFloat($("#threshold_slider").val()).toFixed(2));
        $("#threshold_slider_val").html(excess_green_record[cur_img_name]["sel_val"]);
    });




    function raise_threshold_slider() {
        let slider_val = parseFloat($("#threshold_slider").val());
        if (slider_val < max_val) {
            slider_val = slider_val + 0.01;
            $("#threshold_slider").val(slider_val).change();
        }
    }
    function lower_threshold_slider() {
        let slider_val = parseFloat($("#threshold_slider").val());
        if (slider_val > min_val) {
            slider_val = slider_val - 0.01;
            $("#threshold_slider").val(slider_val).change();
        }
    }


    let threshold_handler;
    $("#threshold_score_down").off("mousedown");
    $("#threshold_score_down").mousedown(function() {
        lower_threshold_slider();
        threshold_handler = setInterval(lower_threshold_slider, 300);
    });

    $("#threshold_score_down").off("mouseup");
    $("#threshold_score_down").mouseup(function() {
        clearInterval(threshold_handler);
    }); 

    $("#threshold_score_up").off("mousedown");
    $("#threshold_score_up").mousedown(function() {
        raise_threshold_slider();
        threshold_handler = setInterval(raise_threshold_slider, 300);
    });

    $("#threshold_score_up").off("mouseup");
    $("#threshold_score_up").mouseup(function() {
        clearInterval(threshold_handler);
    });

    /*
    $("#threshold_slider").val(sel_val);
    $("#threshold_slider").slider("option", "min", min_val);
    $("#threshold_slider").slider("option", "max", max_val);
    $("#threshold_slider_val").html(sel_val);*/


    //var base64string = "data:image/png;base64,iVBOR..........",
    //threshold = 155, // 0..255

    let thresh_val = $("#threshold_slider").val();
    let threshold = range_map(thresh_val, -2, 2, 0, 255);

    let canvas = document.createElement("canvas");
    let image_canvas = document.createElement("canvas");
    let exg_ctx = canvas.getContext("2d");
    let rgb_ctx = canvas.getContext("2d");
    canvas.id = "my_canvas";
    let exg_image = new Image();
    let rgb_image = new Image();
    //let zoomCtx = $("#my_result").append(`<canvas></canvas>`).getContext("2d");

    let viewer_width = $("#seadragon_viewer").width();
    let viewer_height = $('#seadragon_viewer').height();

        
    exg_image.src = exg_src;
    rgb_image.src = rgb_src;

    let images_loaded = 0;



    let all_images_loaded = function() {

        let org_height = rgb_image.height;
        let org_width = rgb_image.width;
        // let frac_h = viewer_height / org_height;
        // let frac_w = viewer_width / org_width;
        // let rescale = Math.min(frac_h, frac_w);
        
        // let full_height = rescale * org_height;
        // let full_width = rescale * org_width;
        // rgb_image.id = "my_image";
        // rgb_image.height = full_height;
        // rgb_image.width = full_width;

        rgb_image.height = org_height;
        rgb_image.width = org_width;

        exg_image.height = org_height;
        exg_image.width = org_width;

        var w = rgb_ctx.canvas.width  = rgb_image.width,
            h = rgb_ctx.canvas.height = rgb_image.height;


        //rgb_ctx.globalAlpha = 0.2;
        //image_ctx.drawImage(org_image, 0, 0, w, h);
        //ctx.drawImage(image, 0, 0, w, h);      // Set image to Canvas context
        //var d = ctx.getImageData(0, 0, w, h);  // Get image Data from Canvas context
        
        rgb_ctx.drawImage(rgb_image, 0, 0, w, h);      // Set image to Canvas context
        var d_rgb = rgb_ctx.getImageData(0, 0, w, h);  // Get image Data from Canvas context

        exg_ctx.drawImage(exg_image, 0, 0, w, h);      // Set image to Canvas context
        var d_exg = exg_ctx.getImageData(0, 0, w, h);  // Get image Data from Canvas context

    /*
        for (var i=0; i<d.data.length; i+=4) { // 4 is for RGBA channels
            // R=G=B=R>T?255:0
            d.data[i] = d.data[i+1] = d.data[i+2] = d.data[i+1] > threshold ? 255 : 0;
        }*/
        //for (var i=0; i<d.data.length; i+=1) { // 4 is for RGBA channels
        
        //let j = 0;

        let num_foreground = 0;
        for (let i = 0; i < d_rgb.data.length; i += 4) {    
            // R=G=B=R>T?255:0
            /*
            if (d_exg.data[j] > threshold) {
                d_rgb.data[i] = 0;
                d_rgb.data[i+1] = 0;
                d_rgb.data[i+2] = 0;

            }*/
            
            let is_foreground = d_exg.data[i] > threshold;
            d_rgb.data[i+3] = is_foreground ? 255 : 30;

            if (is_foreground) {
                num_foreground++;
            }

            // let is_bg = d_exg.data[i] < threshold;
            // d_rgb.data[i+3] = is_bg ? 30 : 255;
            // if (!is_bg) {
            //     num_foreground++;
            // }
            //j++;
        }
        let percent_vegetation = ((num_foreground / (d_rgb.data.length / 4)) * 100).toFixed(2);
        excess_green_record[cur_img_name]["ground_cover_percentage"] = parseFloat(percent_vegetation);

        $("#ground_cover_text").html(percent_vegetation);
        update_ground_cover_chart();


        rgb_ctx.putImageData(d_rgb, 0, 0);             // Apply threshold conversion
        //document.body.appendChild(ctx.canvas); // Show result
        //$("#seadragon_viewer").append(ctx.canvas);
        
        let container_height = $("#seadragon_viewer").height() + "px";
        let container_width = $("#seadragon_viewer").width() + "px";

        /*
        $("#seadragon_viewer").append(
            `<div id="my_image_container" style="margin: auto auto; height: ${container_height}; width: ${container_width}">` +
            `</div>`
        );
        */
        //

        $("#image_loader").hide();

        /*
        $("#my_image_container").css("height", container_height);
        $("#my_image_container").css("width", container_width);
        $("#my_image_container").show();*/
        //}
        $("#my_image_container").empty();
        /*
        $("#my_image_container").append(
            org_image
        );*/

        
        $("#my_image_container").append(
            rgb_ctx.canvas
        );

        enable_std_buttons(["request_segment_button"]);
        

            //$("#right_panel").append(`<div id="my_result" style="border: 1px solid white; height: 280px"></div>`);
            //imageZoom("my_image", "my_result")
    //    };
    };


    exg_image.onload = function() {
        images_loaded++;
        if (images_loaded == 2) {
            all_images_loaded();
        }
    }

    rgb_image.onload = function() {
        images_loaded++;
        if (images_loaded == 2) {
            all_images_loaded();
        }
    }
    



}


function add_annotations() {
    anno.clearAnnotations();
    if ((cur_panel === "annotation") || (cur_panel === "prediction" && ($("#annotations").is(":checked")))) {
        for (let annotation of annotations[cur_img_name]["annotations"]) {
            anno.addAnnotation(annotation);
        }
    }
    let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
    if ((cur_panel == "prediction") && (cur_img_name in predictions)) {
        if ($("#predictions").is(":checked")) {
            for (let annotation of predictions[cur_img_name]["annotations"]) {

                let bodies = Array.isArray(annotation.body) ?
                annotation.body : [ annotation.body ];
                let scoreTag = bodies.find(b => b.purpose == 'score');
                if (!scoreTag || scoreTag.value >= slider_val) {
                    anno.addAnnotation(annotation);
                }
                
            }
        }
    }
}


function show_segmentation() {

    let container_height = $("#seadragon_viewer").height() + "px";
    let container_width = $("#seadragon_viewer").width() + "px";
    cur_bounds = viewer.viewport.getBounds();
    $("#seadragon_viewer").empty();
    $("#seadragon_viewer").append(
        `<div id="my_image_container" class="scrollable_area" style="cursor: grab; height: ${container_height}; width: ${container_width}; border: none">` +
        `</div>`
    );
    let pos = { top: 0, left: 0, x: 0, y: 0};

    const ele = document.getElementById('my_image_container');
    const mouseDownHandler = function(e) {

        ele.style.cursor = 'grabbing';
        ele.style.userSelect = 'none';

        pos = {
            left: this.scrollLeft,
            top: this.scrollTop,
            x: e.clientX,
            y: e.clientY
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };


    const mouseMoveHandler = function (e) {
        // How far the mouse has been moved
        const dx = e.clientX - pos.x;
        const dy = e.clientY - pos.y;

        // Scroll the element
        ele.scrollTop = pos.top - dy;
        ele.scrollLeft = pos.left - dx;
    };

    const mouseUpHandler = function () {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    
        ele.style.cursor = 'grab';
        ele.style.removeProperty('user-select');
    };

    ele.addEventListener('mousedown', mouseDownHandler);

    show_segmentation_inner();
}



function lower_slider() {
    let slider_val = parseFloat($("#confidence_slider").val());
    if (slider_val > 0.25) {
        slider_val = slider_val - 0.01;
        $("#confidence_slider").val(slider_val).change();
    }
}

function raise_slider() {
    let slider_val = parseFloat($("#confidence_slider").val());
    if (slider_val < 1.0) {
        slider_val = slider_val + 0.01;
        $("#confidence_slider").val(slider_val).change();
    }
}


function update_results_name_input() {

    let format = /[`!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
    let inputs_to_check = ["results_name_input"];
    for (let input of inputs_to_check) {
        let input_length = ($("#" + input).val()).length;
        if ((input_length < 1) || (input_length > 20)) {
            return false;
        }

        if (format.test($("#" + input).val())) {
            return false;
        }
    }
    return true;
}

function update_results_comment_input() {

    let format = /[`!@#$%^&*\=\[\]{}|<>?~]/;
    let inputs_to_check = ["results_comment_input"];
    for (let input of inputs_to_check) {
        let input_length = ($("#" + input).val()).length;
        if ((input_length > 255)) {
            return false;
        }

        if (format.test($("#" + input).val())) {
            return false;
        }
    }
    return true;
}

function submit_prediction_request(image_names) {


    let left_col_width_px = "160px";
    show_modal_message("Confirm Request", 
        `<div>Please confirm your request.` +
        ` Upon completion, your results will be preserved under this image set's` +
        ` <em>Results</em> tab (accessible from the home page).</div>` +
        `<div style="height: 30px"></div>` +
        `<table class="transparent_table">` +
        `<tr>` +
            `<td>` + 
                `<div class="table_head" style="width: ${left_col_width_px}; padding-right: 10px">Name</div>` +
            `</td>` +
            `<td>` +
                `<div style="width: 350px">` +
                    `<input id="results_name_input" class="nonfixed_input" value="My Result">` +
                `</div>` +
            `</td>` +
        `</tr>` +
        `<tr style="height: 5px">` +
        `</tr>` +
        `<tr>` +
            `<td>` + 
                `<div class="table_head" style="width: ${left_col_width_px}; height: 100px; padding-right: 10px">Comment</div>` +
            `</td>` +
            `<td>` +
                `<div style="width: 350px; height: 100px">` +
                    `<textarea id="results_comment_input" class="nonfixed_textarea" rows="4"></textarea>` +
                `</div>` +
            `</td>` +
        `</tr>` + 
        `</table>` + 
        `<div style="height: 30px"></div>` +
        `<div id="modal_button_container" style="text-align: center">` +
        `<button id="confirm_results_request_button" class="std-button std-button-hover" `+
        `style="width: 200px" onclick="submit_prediction_request_confirmed('${image_names}', true)">Submit Request</button></div>`
        /*
        `<button id="cancel_delete" class="std-button std-button-hover" ` +
        `style="width: 200px" onclick="cancel_delete_request()">Cancel</button>` +*/
        
        );

    
    for (let input_id of ["results_name_input"]) {
        $("#" + input_id).on("input", function(e) {
            if (update_results_name_input() && update_results_comment_input()) {
                enable_std_buttons(["confirm_results_request_button"]);
            }
            else {
                disable_std_buttons(["confirm_results_request_button"]);
            }
        });
    }

    for (let input_id of ["results_comment_input"]) {
        $("#" + input_id).on("input", function(e) {
            if (update_results_name_input() && update_results_comment_input()) {
                enable_std_buttons(["confirm_results_request_button"]);
            }
            else {
                disable_std_buttons(["confirm_results_request_button"]);
            }
        });
    }


}

function submit_prediction_request_confirmed(image_names_str, save_result) {

    disable_std_buttons(["request_result_button", "predict_single_button", "predict_all_button"]);

    $.post($(location).attr("href"),
    {
        action: "predict",
        image_names: image_names_str,
        save_result: save_result ? "True" : "False",
        results_name: $("#results_name_input").val(),
        results_comment: $("#results_comment_input").val()
    },
    function(response, status) {
        close_modal();
        if (response.error) {
            show_modal_message("Error", response.message);
        }
    });



}

function show_model_details(model_creator, model_name) {

    console.log("show_model_details", model_creator, model_name);
    $.post($(location).attr("href"),
    {
        action: "inspect_model",
        model_creator: model_creator,
        model_name: model_name
    },
    function(response, status) {

        if (response.error) {
            show_modal_message("Error", "An error occurred while fetching the model details.");
        }

        else {
            //console.log("show_public_models", show_public_models);
            //console.log("model_log_index", typeof(model_log_index));
            //model_log_index = parseInt(model_log_index);
        
            inspected_model_log = response.model_log; //model_logs[parseInt(model_log_index)];
            let inspected_annotations = response.annotations;
            for (let image_name of Object.keys(inspected_annotations)) {
                for (let annotation of inspected_annotations[image_name]["annotations"]) {
                    annotation["body"].push({"value": "COLOR_BRIGHT", "purpose": "highlighting"})
                }
            }
            console.log("inspected_model_log", inspected_model_log);
        
            $("#model_info").empty();
        /*
            $("#models_table").append(`<tr><td style="width: 200px">` +
                `<button style="width: 200px" class="std-button std-button-hover" onclick="show_models(${show_public_models})">` +
                    `<i class="fa-solid fa-angle-left" style="padding-right: 8px"></i>Back to Model List</button></td>` +
                    `<td style="width: 100%"></td></tr>`);
        */
            $("#model_info").append(`<table id="details_table"></table>`);
        
            let image_sets_col_width = "240px";
            let image_set_entry_width = "240px";
            let model_viewer_width = "450px";
            let target_viewer_width = "450px";
            let viewer_height = "390px";
            $("#details_table").append(
                `<tr>` +
                    `<td style="width: ${image_sets_col_width}; padding-left: 8px"><h class="header2">Model Image Sets</h></td>` +
                    `<td style="width: ${model_viewer_width}">` +
                    `<table>` +
                        `<tr>` +
                            `<td><h style="width: 180px" class="header2">Model Image Set</h></td>` +
                            `<td style="width: 100%"></td>` +
                            `<td>` +
                                `<button id="prev_ims_button" class="std-button std-button-hover" style="padding: 2px; font-size: 14px; width: 80px">Previous</button>` +
                            `</td>` +
                            `<td>` +
                                `<button id="next_ims_button" class="std-button std-button-hover" style="padding: 2px; font-size: 14px; width: 80px">Next</button>` +
                            `</td>` +  
                        `<tr>` +
                    `</table>` +
                    `<td style="width: ${model_viewer_width}">` +
                    `<table>` +
                        `<tr>` +
                            `<td><h style="width: 180px" class="header2">Current Image Set</h></td>` +
                            `<td style="width: 100%"></td>` +
                            `<td>` +
                                `<button id="prev_cs_button" class="std-button std-button-hover" style="padding: 2px; font-size: 14px; width: 80px">Previous</button>` +
                            `</td>` +
                            `<td>` +
                                `<button id="next_cs_button" class="std-button std-button-hover" style="padding: 2px; font-size: 14px; width: 80px">Next</button>` +
                            `</td>` +  
                        `<tr>` +
                    `</table>` +
                    `</tr>` +
                        
                    //`<td><h style="width: ${target_viewer_width}" class="header2">Current Image Set</h></td>` +
                `</tr>`);
        
        
            $("#details_table").append(
                `<tr>` +
                    `<td>` +
                        `<div class="scrollable_area" style="height: ${viewer_height}; border: none; overflow-y: scroll">` +
                            `<table id="model_image_sets"></table>` +
                        `</div>` +
                    `</td>` +
                        
                    
                    //`<table id="model_image_sets" class="scrollable_area" style="width: ${image_sets_col_width}"></table></td>` +
                    `<td><div id="model_viewer" class="viewer" style="height: ${viewer_height}; width: ${model_viewer_width}"></div></td>` +
                    `<td><div id="target_viewer" class="viewer" style="height: ${viewer_height}; width: ${target_viewer_width}"></div></td>` +        `</tr>`
            );
        
        /*
            $("#details_table").append(
                `<tr>` +
                    `<td></td>` +
                    `<td>` +
                        `<table><tr>` +
                            `<td style="width:50%">` +
                                `<button id="prev_ims_button" class="std-button std-button-hover" style="width: 100%">Previous</button>` +
                            `</td>` +
                            `<td style="width:50%">` +
                                `<button id="next_ims_button" class="std-button std-button-hover" style="width: 100%">Next</button>` +
                            `</td>` +                    
                        `</tr></table>` +
                    `</td>` +
        
                    `<td>` +
                        `<table><tr>` +
                            `<td style="width:50%">` +
                                `<button id="prev_cs_button" class="std-button std-button-hover" style="width: 100%">Previous</button>` +
                            `</td>` +
                            `<td style="width:50%">` +
                                `<button id="next_cs_button" class="std-button std-button-hover" style="width: 100%">Next</button>` +
                            `</td>` +                    
                        `</tr></table>` +
                    `</td>` +
            
            
                //`<td><div id="target_viewer" class="viewer" style="height: 300px; width: 400px"></div></td>` +
                `</tr>`
                );*/
        
        
            let target_viewer = OpenSeadragon({
                id: "target_viewer", //"seadragon_viewer",
                sequenceMode: true,
                prefixUrl: get_CC_PATH() + "/osd/images/",
                tileSources: dzi_image_paths,
                showNavigator: false,
                maxZoomLevel: 100,
                zoomPerClick: 1,
                nextButton: "next_cs_button",
                previousButton: "prev_cs_button",
                showNavigationControl: false,
                preserveViewport: true,
                //imageSmoothingEnabled: false
            });


            let target_anno = OpenSeadragon.Annotorious(target_viewer, {
                disableEditor: true,
                disableSelect: true,
                readOnly: true,
                formatter: formatter
            });

            target_viewer.addHandler("open", function(event) {
                let cur_dzi = basename(event.source)
                let cur_image_name = cur_dzi.substring(0, cur_dzi.length - 4);
                target_anno.clearAnnotations();
                for (let annotation of inspected_annotations[cur_image_name]["annotations"]) {
                    target_anno.addAnnotation(annotation);
                }
            });
        
            for (let i = 0; i < inspected_model_log["image_sets"].length; i++) {
        
                let image_set = inspected_model_log["image_sets"][i];
        
                let entry = `<table class="transparent_table" style="font-size: 14px">` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Username</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${image_set["username"]}</div>` +
                    `</td>` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Farm Name</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${image_set["farm_name"]}</div>` +
                    `</td>` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Field Name</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${image_set["field_name"]}</div>` +
                    `</td>` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Mission Date</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${image_set["mission_date"]}</div>` +
                    `</td>`;
        
        
        
        
                $("#model_image_sets").append(`<tr>` +
                
                    //`<td><div>${extensionless_name}</div></td>` +
                    //`<td><div class="table_entry std_tooltip" style="background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}` +
                    //`<span class="std_tooltiptext">${image_status}</span></div></td>` +
        
                    //`<td><div class="table_entry std_tooltip" style="margin: 0px 1px; background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}</div></td>` +
        
        
                    `<td><div class="table_button table_button_hover" style="width: ${image_set_entry_width}; margin: 0px 1px;" ` +
                    // `onclick="change_image('${dzi_image_path}')">${extensionless_name}</div></td>` +
                    `onclick="change_image_set('${i}')">` +
                    entry +
                    `</div></td>` +
                    //`</div></td>` + 
                    //`<td><div class="table_entry">${img_dataset}</div></td>` +
                    `</tr>`);
            }
            change_image_set(0);
        
        }

    });



}
function change_image_set(image_set_index) {
    //console.log("text", text);
    let image_set = inspected_model_log["image_sets"][parseInt(image_set_index)];
    $.post($(location).attr("href"),
    {
        action: "fetch_annotations",
        username: image_set["username"],
        farm_name: image_set["farm_name"],
        field_name: image_set["field_name"],
        mission_date: image_set["mission_date"]
    },
    function(response, status) {

        if (response.error) {
            show_modal_message("Error", "An error occurred while fetching the image set annotations.");
        }
        else {

            let image_set_annotations = response.annotations;
            for (let image_name of Object.keys(image_set_annotations)) {
                for (let annotation of image_set_annotations[image_name]["annotations"]) {
                    annotation["body"].push({"value": "COLOR_BRIGHT", "purpose": "highlighting"})
                }
            }


            let model_dzi_image_paths = [];
            for (let image_name of image_set["images"]) {
                let dzi_path = get_CC_PATH() + "/usr/data/" + image_set["username"] + "/image_sets/" +
                                         image_set["farm_name"] + "/" +
                                         image_set["field_name"] + "/" +
                                         image_set["mission_date"] + "/" +
                                         "dzi_images" + "/" +
                                         image_name + ".dzi";
                model_dzi_image_paths.push(dzi_path);
            }
        
            $("#model_viewer").empty();
        
            let model_viewer = OpenSeadragon({
                id: "model_viewer", //"seadragon_viewer",
                sequenceMode: true,
                prefixUrl: get_CC_PATH() + "/osd/images/",
                tileSources: model_dzi_image_paths,
                showNavigator: false,
                maxZoomLevel: 100,
                zoomPerClick: 1,
                nextButton: "next_ims_button",
                previousButton: "prev_ims_button",
                showNavigationControl: false,
                preserveViewport: true,
                //imageSmoothingEnabled: false
            });


            let model_anno = OpenSeadragon.Annotorious(model_viewer, {
                disableEditor: true,
                disableSelect: true,
                readOnly: true,
                formatter: formatter
            });

            model_viewer.addHandler("open", function(event) {
                let cur_dzi = basename(event.source)
                let cur_image_name = cur_dzi.substring(0, cur_dzi.length - 4);
                //update_inspected_overlays(cur_image_name);

                model_anno.clearAnnotations();
                for (let annotation of image_set_annotations[cur_image_name]["annotations"]) {
                    model_anno.addAnnotation(annotation);
                }
            });
        }
    });
}


function show_models(show_public_models) {

    if (show_public_models) {
        $("#show_my_models").removeClass("tab-btn-active");
        $("#show_public_models").addClass("tab-btn-active");
    }
    else {
        $("#show_my_models").addClass("tab-btn-active");
        $("#show_public_models").removeClass("tab-btn-active");
    }
    $("#model_info").empty();
    $("#model_info").append(`<div class="loader"></div>`);

    let model_name_col_width = "250px";
    let model_creator_col_width = "150px";
    let details_col_width = "100px";
    let details_button_width = "80px";
    let action;
    if (show_public_models) {
        action = "fetch_public_models";
    }
    else {
        action = "fetch_my_models";
    }

    $.post($(location).attr("href"),
    {
        action: action,
    },
    function(response, status) {
        if (response.error) {
            show_modal_message("Error", "An error occurred while fetching the models.");  
        }
        else {
            $("#model_info").empty();
            $("#model_info").append(
            `<div class="scrollable_area" style="height: 400px; border: none; overflow-y: scroll">` +
                `<table id="models_table"></table>` +
            `</div>` +
            `<div style="text-align: center;">` +
                `<div style="height: 10px"></div>` +
                `<button id="submit_model_change" class="std-button std-button-hover" style="width: 140px">Switch Model</button>` +
                `<div style="height: 10px"></div>` +
                `</div>`);

            $("#models_table").empty();
            let models = response.models; //_logs;
                        //[{"name": "foo", "creator": "erik"}, 
                        //  {"name": "bar", "creator": "erik"}, 
                        //  {"name": "baz0-0-0-0", "creator": "erik"}];
            
            if (models.length == 0) {
                $("#models_table").append(`<tr><td>No Models Found!</td></tr>`);
            }
            else {
                /*if (public_models) {*/
                    $("#models_table").append(`<tr>` +
                    `<td><div class="table_entry" style="font-weight: bold; width: ${model_name_col_width}">Name</div></td>` +
                    `<td><div class="table_entry" style="font-weight: bold; width: ${model_creator_col_width}">Creator</div></td></tr>`);
                /*}
                else {
                    $("#models_table").append(`<tr>` +
                    `<td><div class="table_entry" style="font-weight: bold; width: ${model_name_col_width};">Name</div></td></tr>`);
                }*/
                for (let i = 0; i < models.length; i++) {
                    let model_name = models[i]["model_name"];
                    let model_creator = models[i]["model_creator"];
                    let model_id = model_creator + ":" + model_name;
                    let button_id = "btn_" + model_id;

                    $("#models_table").append(`<tr>` +

                    // `<td>` +
                    // `<label class="radio_container">${model_name}` +
                    //     `<input type="radio" name="${model_name}" value="${model_name}">` +
                    //     `<span class="custom_radio"></span>` +
                    // `</label>` +
                        `<td><div class="table_entry" style="text-align: left; width: ${model_name_col_width}">` +
                            `<input type="radio" id="${model_id}" value="${model_id}" class="models_radio" name="models_radio">` +
                            `<label for="${model_id}">${model_name}</label>` +
                        `</div></td>` +
                        `<td><div class="table_entry" style="text-align: center; width: ${model_creator_col_width}">${model_creator}` +
                        `</div></td>` +
                        `<td><button id="${button_id}" onclick="show_model_details('${model_creator}', '${model_name}')" ` +
                              `class="std-button std-button-hover" style="padding: 2px; font-size: 14px; width: ${details_button_width}">Inspect` +
                        `</button></td>` +
                    `</tr>`);

                    disable_std_buttons(["submit_model_change"]);

                    //$("#models_table").on("click", "#"+button_id, function() {

                }/*
                $.each(model_logs, function(i, model_log) {
                    let model_name = model_log["model_name"];
                    let model_creator = model_log["model_creator"];
                    let model_id = model_creator + ":" + model_name;
                    let button_id = "btn_" + model_id;

                    console.log("adding listener for ", button_id);
                    $("#" + button_id).on("click", function() {
                        console.log("button_clicked");
                        //show_model_details(show_public_models, model_log);
                    });
                });*/

                $(".models_radio").change(function() {
                    
                    enable_std_buttons(["submit_model_change"]);
                    //console.log("radio changed");
                });
            }

            $("#submit_model_change").click(function() {
                let new_model_name;
                let new_model_creator;
                //console.log("models", models);
                // for (let model of models) {
                let model_radio = $("input[name=models_radio]");
                let sel_id = model_radio.filter(":checked").val();
                new_model_creator = sel_id.split(":")[0];
                new_model_name = sel_id.split(":")[1];

                    //     new_model_name = model["name"];
                    //     new_model_creator = model["creator"];
                    //     break;
                    // }
                // }
                console.log("switching to model", new_model_name);

                $.post($(location).attr("href"),
                {
                    action: "switch_model",
                    model_name: new_model_name,
                    model_creator: new_model_creator
                },
                function(response, status) {

                    if (response.error) {
                        show_modal_message(`Error`, response.message);
                    }
                    else {
                        waiting_for_model_switch = true;
                        //num_training_images = 0;
                        show_modal_message(`Please Wait`, 
                        `<div id="switch_anno_message">Switching models...</div><div id="switch_anno_loader" class="loader"></div>`);
                        $("#modal_close").hide();
                        /*
                        $("#modal_close").hide();
                        $("#model_name").html(new_model_name);
                        $("#model_fully_trained").html("Yes");
                        $("#model_fine_tuned").html("No");
                        $("#train_block_text").html("No");
                        $("#train_block_switch").prop('disabled', false);
                        $("#train_block_label").css("opacity", 1);
                        $("#train_block_slider").css("cursor", "pointer");
                        $("#train_block_switch").prop("checked", false);*/

                        //close_modal();
                    }
                });
            });
        }
    });
}
/*
function submit_model_change() {
    //for (let model_name of model_names) {
    let new_model_name;
    $("#models_radio").each(function() {
        if ($("#" + this.id).is(":checked")) {
            new_model_name = model_name; //console.log(model_name, "is checked");
            break;
        }
    });

    console.log("switching to model", new_model_name);
}*/

function change_model() {
    show_modal_message(
        `Select Model`,
        `<div style="border: 1px solid white; height: 500px">` +
            //`<div style="width: 100%">` +
            `<div>` + 
                `<ul class="nav">` +
                    `<li id="show_my_models" class="nav tab-btn-active" style="width: 150px" onclick="show_models(false)">` +
                        `<a class="nav">My Models` +
                            //`<i class="fa-solid fa-pen-to-square"></i>` +
                        `</a>` +
                    `</li>` +

                    `<li id="show_public_models" class="nav" style="width: 150px" onclick="show_models(true)">` +
                        `<a class="nav">Public Models` +
                            //`<i class="fa-solid fa-pen-to-square"></i>` +
                        `</a>` +
                    `</li>` +
                `</ul>` +
            `</div>` +
            //`</div>` +
            `<div style="height: 50px"></div>` +
            `<div id="model_info">` +
                
            `</div>` +
        `</div>`

    , modal_width=1200);

    show_models(false);
}

$(document).ready(function() {
    //window.setInterval(refresh, 90000); // 1.5 minutes
    ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000); // 2 hours





    create_overlays_table();


    image_set_info = data["image_set_info"];
    dzi_image_paths = data["dzi_image_paths"];
    annotations = data["annotations"];
    metadata = data["metadata"];
    camera_specs = data["camera_specs"];
    excess_green_record = data["excess_green_record"];
    predictions = data["predictions"];

    set_prediction_overlay_color();

    /*
    pending_predictions = {};
    for (image_name of Object.keys(annotations)) {
        pending_predictions[image_name] = false;
    }*/
    disable_std_buttons(["prev_image_button"]);
    if (dzi_image_paths.length == 1) {
        disable_std_buttons(["next_image_button"]);
    }

    $("#image_set_name").text(image_set_info["farm_name"] + "  |  " + 
                              image_set_info["field_name"] + "  |  " + 
                              image_set_info["mission_date"]);

    image_to_dzi = {};
    for (let dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path);
        let extensionless_name = image_name.substring(0, image_name.length - 4);
        image_to_dzi[extensionless_name] = dzi_image_path;
    }

    let init_image_name = basename(dzi_image_paths[0]);
    cur_img_name = init_image_name.substring(0, init_image_name.length - 4);

    cur_view = "image";
    cur_panel = "annotation";

    create_image_set_table();

    


    num_training_images = 0;
    for (image_name of Object.keys(annotations)) {
        if (annotations[image_name]["status"] === "completed_for_training") {
            num_training_images++;
        }
    }

    /*
    if (data["baseline_initialized"]) {
        $("#init_panel").hide();
        $("#ctl_panel").show();
    }
    else {
        $("#num_annotations").html(REQ_INIT_ANNOTATIONS - num_annotations);
    }*/

    // let socket = io();
    let socket = io(
    "", {
        path: get_CC_PATH() + "/socket.io"
    });

    socket.emit("join_workspace", username + "/" + image_set_info["farm_name"] + "/" + image_set_info["field_name"] + "/" + image_set_info["mission_date"]);

    socket.on("workspace_occupied", function(update) {
        window.location.href = get_CC_PATH() + "/home/" + username;
    });

    socket.on("image_set_status_change", function(update) {
        console.log("update", update);


        if (update["switch_request"] === "True") {
            waiting_for_model_switch = true;

            show_modal_message(`Please Wait`, 
            `<div id="switch_anno_message">Switching models...</div><div id="switch_anno_loader" class="loader"></div>`);
            $("#modal_close").hide();
        }
        else if (waiting_for_model_switch) {
            num_training_images = 0;
            for (let image_name of Object.keys(annotations)) {
                
                if (annotations[image_name]["status"] === "completed_for_training") {
                    annotations[image_name]["status"] = "completed_for_testing"
                }
            }
            waiting_for_model_switch = false;
            create_image_set_table();
            set_image_status_combo();
            close_modal();
        }

        num_images_fully_trained_on = update["num_images_fully_trained_on"];
        model_unassigned = (!("model_name" in update)) || (update["model_name"] === "---");

        console.log("model_unassigned", model_unassigned);

        let model_name;
        if ("model_name" in update) {
            model_name = update["model_name"];
        }
        else {
            model_name = "---";
        }
        $("#model_name").html(model_name);

        if (model_unassigned) {
            $("#model_fully_trained").html("---");
            $("#model_fine_tuned").html("---");
            disable_std_buttons(["request_result_button", "predict_single_button", "predict_all_button"]);
        }
        else {
            if (num_training_images == num_images_fully_trained_on) {
                $("#model_fully_trained").html("Yes");
            }
            else {
                $("#model_fully_trained").html("No");
            }
            if (num_training_images > 0) {
                $("#model_fine_tuned").html("Yes");
            }
            else {
                $("#model_fine_tuned").html("No");
            }
        }

        if (update["outstanding_prediction_requests"] === "True") {
            disable_std_buttons(["request_result_button", "predict_single_button", "predict_all_button"]);
        }
        else {
            enable_std_buttons(["request_result_button", "predict_single_button", "predict_all_button"]);
        }
        if (model_unassigned) {
            $("#train_block_text").html("---");
            $("#train_block_switch").prop("checked", false);
            $("#train_block_switch").prop('disabled', true);
            $("#train_block_label").css("opacity", 0.5);
            $("#train_block_slider").css("cursor", "default");
        }
        else {
            //$("#train_block_label").show();


            if (update["sys_training_blocked"] === "True") {
                $("#train_block_text").html("Yes");
                $("#train_block_switch").prop("checked", true);

                $("#train_block_switch").prop('disabled', true);
                $("#train_block_label").css("opacity", 0.5);
                $("#train_block_slider").css("cursor", "default");

                $("#train_block_message").html("Training blocked due to system error.");

            }

            else {

                $("#train_block_switch").prop('disabled', false);
                $("#train_block_label").css("opacity", 1);
                $("#train_block_slider").css("cursor", "pointer");

                $("#train_block_message").html("");

                if (update["usr_training_blocked"] === "True") {
                    $("#train_block_text").html("Yes");
                    $("#train_block_switch").prop("checked", true);
                }
                else {
                    $("#train_block_text").html("No");
                    $("#train_block_switch").prop("checked", false);
                }
            }
        }



    });

    socket.on("scheduler_status_change", function(update) {

        let update_timestamp = parseInt(update["timestamp"]);
        let update_num = parseInt(update["update_num"]);
        if (update_num > cur_update_num) {

            cur_update_num = update_num;
            let status = update["status"];
            let update_username = update["username"];
            let update_farm_name = update["farm_name"];
            let update_field_name = update["field_name"];
            let update_mission_date = update["mission_date"];
            let date = timestamp_to_date(update_timestamp);
            let display_statuses = ["Fine-Tuning", "Predicting", "Switching Model", "Idle", "Training"];
            let update_is_for_this_set = ((update_username === username && update_farm_name === image_set_info["farm_name"]) &&
            (update_field_name === image_set_info["field_name"] && update_mission_date === image_set_info["mission_date"]));

            if (display_statuses.includes(status)) {
                $("#backend_status").empty();
                if (status === "Predicting") {
                    let num_processed = parseInt(update["num_processed"]);
                    let num_images = parseInt(update["num_images"]);
                    status = status + ": " + num_processed + " / " + num_images;
                }
                $("#backend_status").append(`<div>${status}</div>`);
                $("#backend_update_time").html(date);

                if (update_is_for_this_set) {
                    $("#backend_details").css("opacity", 1.0);
                }
                else {
                    $("#backend_details").css("opacity", 0.5);
                }

                $("#backend_username").html(update_username);
                $("#backend_farm_name").html(update_farm_name);
                $("#backend_field_name").html(update_field_name);
                $("#backend_mission_date").html(update_mission_date);

            }


            if (update_is_for_this_set) {

                console.log("got update for this set", update);

                if ("error_message" in update) {
                    let error_message = `An error occurred during ` + update["error_setting"] + 
                                            `:<br><br>` + update["error_message"];
                

                    if (update["error_setting"] === "prediction") {
                        error_message = error_message + `<br><br>Please report this error to the site administrator.`;
                    }
                    else if (update["error_setting"] === "training") {
                        error_message = error_message + `<br><br>The model will be prevented from training until the error is resolved. Please contact the site administrator.`;
                    }

                    show_modal_message("Error", error_message);

                }
                if ("prediction_image_names" in update) {
                    let prediction_image_names = update["prediction_image_names"].split(",");
                    //for (prediction_image_name of prediction_image_names) {
                    $.post($(location).attr('href'),
                    {
                        action: "retrieve_predictions",
                        image_names: update["prediction_image_names"]
                    },
                
                    function(response, status) {
                
                        if (response.error) {
                            show_modal_message("Error", response.message);
                
                        }
                        else {

                            for (let prediction_image_name of prediction_image_names) {
                                predictions[prediction_image_name] = response.predictions[prediction_image_name];
                                // if (response.metrics[prediction_imadd_annotatage_name] !== "") {
                                //     metrics[prediction_image_name] = response.metrics[prediction_image_name];
                                // }
                                
                                for (let annotation of predictions[prediction_image_name]["annotations"]) {
                                    annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"});
                                }
                            }

                            if ((cur_panel === "prediction") && (prediction_image_names.includes(cur_img_name))) {
                                
                                $("#predictions_unavailable").hide();
                                $("#predictions_available").show();
                                set_count_chart_data();
                                set_score_chart_data();
                                
                                update_count_chart();
                                update_score_chart();

                                add_annotations();
                            }
                        }
                    });
                }
            }



        }

    });



    $('#chart_combo').append($('<option>', {
        value: "Count",
        text: "Count"
    }));
    if (can_calculate_density(metadata, camera_specs)) {
        $('#chart_combo').append($('<option>', {
            value: "Count per square metre",
            text: "Count per square metre"
        }));
    }


    $("#chart_combo").change(function() {
        set_count_chart_data();
        update_count_chart();
    });


    set_count_chart_data();
    set_score_chart_data();
    
    draw_count_chart();
    draw_score_chart();

    draw_ground_cover_chart();





    //show_image();
    if (can_calculate_density(metadata, camera_specs)) {

        $("#view_button_container").show();


        $("#view_button").click(function() {
            if (cur_view == "image") {
                show_map();
            }
            else {
                show_image(cur_img_name);
            }
        });
    }
    show_image(cur_img_name);

    $("#save_button").click(function() {
        window.clearTimeout(ask_to_continue_handle);
        ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000);
        save_annotations();
    });

    $("#status_combo").change(function() {

        let new_status = $("#status_combo").val();
        if (new_status === "completed_for_training") {
            train_num_increased = true;
        }
        annotations[cur_img_name]["status"] = new_status;
        set_image_status_combo();
        $("#save_icon").css("color", "#ed452b");
        create_image_set_table();

        //$("#use_for_radio").prop('disabled', false);
    });


    $("#help_button").click(function() {

        let head = "Help";
        let message = "&#8226; Hold the <i>SHIFT</i> key and drag the mouse to create a new annotation." +
        "<br><br>&#8226; Click on an existing annotation to select it and change its boundaries." +
        "<br><br>&#8226; Use the <i>DELETE</i> key to remove a selected annotation." + 
        "<br><br>&#8226; Don't forget to save your work!";
        show_modal_message(head, message);
    })

    $("#request_result_button").click(function() {
        submit_prediction_request(Object.keys(annotations).join(","));
    });

    $("#predict_single_button").click(function() {
        submit_prediction_request_confirmed([cur_img_name].join(","), false);
    });

    $("#predict_all_button").click(function() {
        submit_prediction_request_confirmed(Object.keys(annotations).join(","), false);
    })

    $("#use_predictions_button").click(function() {
        $("#modal_head").empty();
        $("#modal_body").empty();
    
        $("#modal_head").append(
        `<span class="close close-hover" id="modal_close">&times;</span>` +
        `<p>Are you sure?</p>`);
    
        $("#modal_body").append(`<p id="modal_message" align="left"></p>`);
        $("#modal_message").html("This action will remove all existing annotations for this image.");

        $("#modal_body").append(`<div id="modal_button_container">
        <button class="std-button std-button-hover" `+
        `style="width: 200px" onclick="confirmed_use_predictions()">Continue</button>` +
        `<button class="std-button std-button-hover" ` +
        `style="width: 200px" onclick="close_modal()">Cancel</button>` +
        `</div>`);
        
        $("#modal_close").click(function() {
            close_modal();
        });
    
        $("#modal").css("display", "block");
    });

    $("#overlays_table").change(function() {
        add_annotations();
    });


    $("#scores_switch").change(function() {
        add_annotations();
    });

    $("#train_block_switch").click(function() {
        
        let block_training = $("#train_block_switch").is(":checked");
        let block_op;
        if (block_training) {
            $("#train_block_text").html("Yes");
            block_op = "block";
        }
        else {
            $("#train_block_text").html("No");
            block_op = "unblock";
        }
        
        $.post($(location).attr('href'),
        {
            action: "block_training",
            block_op: block_op
        },
        
        function(response, status) {

            if (response.error) {
                if (block_training) {
                    $("#train_block_text").html("No");
                }
                else {
                    $("#train_block_text").html("Yes");
                }
                $("#train_block_switch").change();
                show_modal_message("Error", "An error occurred during the attempt to block training.")
            }

        });
    });




    $("#request_segment_button").click(function() {
        show_segmentation_inner();
    });


    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#confidence_slider_val").html(slider_val);
        add_annotations();
        set_count_chart_data();
        update_count_chart();
        update_score_chart();
    });

    $("#confidence_slider").on("input", function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#confidence_slider_val").html(slider_val);
    });


    let score_handler;
    $("#score_down").mousedown(function() {
        lower_slider();
        score_handler = setInterval(lower_slider, 300);
    });

    $("#score_down").mouseup(function() {
        clearInterval(score_handler);
    }); 

    $("#score_up").mousedown(function() {
        raise_slider();
        score_handler = setInterval(raise_slider, 300);
    });

    $("#score_up").mouseup(function() {
        clearInterval(score_handler);
    });




    // $("#threshold_slider").change(function() {
    //     $("#save_icon").css("color", "#ed452b");
    //     excess_green_record[cur_img_name]["sel_val"] = Number.parseFloat($("#threshold_slider").val()).toFixed(2);
    //     $("#threshold_slider_val").html(excess_green_record[cur_img_name]["sel_val"]);
    // });


    $("#apply_threshold_to_all_button").click(function() {
        let exg_val = parseFloat(parseFloat($("#threshold_slider").val()).toFixed(2));

        for (let image_name of Object.keys(excess_green_record)) {
            let min_val = excess_green_record[cur_img_name]["min_val"];
            let max_val = excess_green_record[cur_img_name]["max_val"];
            let cur_val = excess_green_record[image_name]["sel_val"]; 
            if (exg_val > max_val) {
                excess_green_record[image_name]["sel_val"] = max_val;
            }
            else if (exg_val < min_val) {
                excess_green_record[image_name]["sel_val"] = min_val;
            }
            else {
                excess_green_record[image_name]["sel_val"] = exg_val;
            }

            if (cur_val != exg_val) {
                $("#save_icon").css("color", "#ed452b");
            }
        }
    });


    
    $("#next_image_button").click(function() {
        let index = cur_img_list.findIndex(x => x == cur_img_name) + 1;
        change_image(cur_img_list[index]);
    });

    $("#prev_image_button").click(function() {
        let index = cur_img_list.findIndex(x => x == cur_img_name) - 1;
        change_image(cur_img_list[index]);
    });


    $("#suggest_image_button").click(function() {

        let num_candidates = 0;
        for (let image_name of Object.keys(annotations)) {
            let status = annotations[image_name]["status"];
            if ((status === "unannotated" || status === "started") && (image_name in predictions)) {
                num_candidates++;
            }
        }

        if (num_candidates <= 1) {
            show_modal_message("Error", "An insufficient number of images have predictions available for assessment." +
                               " Please generate predictions for more images and try again.");
        }
        else {

            set_score_chart_data();

            let qualities = [];
            for (let image_name of Object.keys(score_chart_data)) {
                let r = evaluate_scores(score_chart_data[image_name]["bins"], score_chart_data[image_name]["scores"]);
                let quality = r[0];
                qualities.push({
                    "quality": quality,
                    "image_name": image_name
                });
            }
            qualities.sort(function(a, b) {
                if (a.quality < b.quality) return -1;
                if (a.quality > b.quality) return 1;
                return 0;
            });

            let sel_image_name = qualities[0]["image_name"];

            change_image(sel_image_name);
        }


    });

});

