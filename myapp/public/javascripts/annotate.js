

// import { bilinearInterpolation } from "simple-bilinear-interpolation";


let image_set_info;
let metadata;
let camera_specs;
let dzi_image_paths;
let annotations;
let num_annotations;
let image_to_dzi;

let viewer;
let anno;
let prediction_anno;
let cur_img_name;
let cur_view;
let countdown_handle;
let ask_to_continue_handle;
let cur_update_num = -1;
//let pending_predictions;
let predictions;
// let metrics = {};

let cur_panel;
let cur_bounds = null;
let cur_status;


let map_url = null;
let min_max_rec = null;


// let overlay_colors = [
//     "#0080C0",        
//     "#FF4040"
// ];
// let overlay_names = [
//     "annotations",
//     "predictions"
// ];

let overlay_colors = {
    "annotations": "#0080C0",
    "predictions": "#FF4040",
};



function set_prediction_overlay_color() {

    for (image_name of Object.keys(predictions)) {
        for (annotation of predictions[image_name]["annotations"]) {
            annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"})
        }
    }
}

let formatter = function(annotation) {

    const bodies = Array.isArray(annotation.body) ?
    annotation.body : [ annotation.body ];
  
    const scoreTag = bodies.find(b => b.purpose == 'score');
    const highlightBody = bodies.find(b => b.purpose == 'highlighting');

    let is_checked = $("#score_switch").is(":checked");
    if (is_checked && (scoreTag && highlightBody)) {
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');

        // Overflow is set to visible, but the foreignObject needs >0 zero size,
        // otherwise FF doesn't render...
        foreignObject.setAttribute('width', '1px');
        foreignObject.setAttribute('height', '1px');

        foreignObject.innerHTML = `
        <div xmlns="http://www.w3.org/1999/xhtml" class="a9s-shape-label-wrapper">
            <div class="a9s-shape-label">
            ${scoreTag.value}
            </div>
        </div>`;

        return {
            element: foreignObject,
            className: scoreTag.value + " " + highlightBody.value,
        };
    }
    if (highlightBody) {
        return {
            className: highlightBody.value
        }
    }
  }
  



function show_modal_message(head, message) {

    $("#modal_head").empty();
    $("#modal_body").empty();

    $("#modal_head").append(
    `<span class="close close-hover" id="modal_close">&times;</span>` +
    `<p>` + head + `</p>`);

    $("#modal_body").append(`<p id="modal_message" align="left"></p>`);
    $("#modal_message").html(message);
    
    $("#modal_close").click(function() {
        close_modal();
    });

    $("#modal").css("display", "block");
}

function close_modal() {
    /*
    $("#modal_head").empty();
    $("#modal_body").empty();*/

    $("#modal").css("display", "none");
}


function change_image(img_name) {
    
    cur_img_name = img_name;

        
    // let img_files_name = basename(event.source);
    // let img_name = img_files_name.substring(0, img_files_name.length - 4);

    // cur_img_name = img_name;
    // console.log("cur_img_name", cur_img_name);

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


function create_image_set_table(table_id) {

    let image_name_col_width = "170px";
    let image_status_col_width = "60px";

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
        "completed_for_training": "C. Tr.",
        "completed_for_testing": "C. Te."
    };

    for (dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path);
        let extensionless_name = image_name.substring(0, image_name.length - 4);


        //let img_status = image_set_data["images"][extensionless_name]["status"];

        let image_status = annotations[extensionless_name]["status"];
        let abbreviated_status = abbreviation[image_status];
        
            
        let item = `<tr>` +
           
            //`<td><div>${extensionless_name}</div></td>` +
            `<td><div class="table_entry std_tooltip" style="cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}` +
            `<span class="std_tooltiptext">${image_status}</span></div></td>` +

            `<td><div class="table_button table_button_hover" style="width: ${image_name_col_width}" ` +
            // `onclick="change_image('${dzi_image_path}')">${extensionless_name}</div></td>` +
             `onclick="change_image('${extensionless_name}')">${extensionless_name}</div></td>` +
            //`</div></td>` + 
            //`<td><div class="table_entry">${img_dataset}</div></td>` +
            `</tr>`;
        $("#image_set_table").append(item);

    }
}



function resize_px_str(px_str) {
    // console.log(px_str);
    px_str = px_str.substring(11);
    let px_lst = px_str.split(",").map(x => parseFloat(x));
    let img_dims = viewer.world.getItemAt(0).getContentSize();
    let img_w = img_dims.x;
    let img_h = img_dims.y;
    // console.log(px_str);
    // console.log(px_lst);
    // console.log("img_dims", img_dims);

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

    // console.log("updated_px_str", updated_px_str);
    return updated_px_str;

}

function update_image_status() {
    console.log("update_image_status");
    let prev_status = annotations[cur_img_name]["status"];
    let num_image_annotations = annotations[cur_img_name]["annotations"].length;
    let new_status = prev_status;
    if (prev_status === "unannotated" && num_image_annotations > 0) {
        new_status = "started";
    }
    else if (prev_status === "started" && num_image_annotations == 0) {
        new_status = "unannotated";
    }
    console.log("new_status", new_status);
    annotations[cur_img_name]["status"] = new_status;
}

function set_image_status_combo() {

    let cur_image_status = annotations[cur_img_name]["status"];
    //let num_annotations = annotations[cur_img_name]["annotations"].length;
    let image_status_options;
    if (cur_image_status === "completed_for_training") {
        image_status_options = ["completed_for_training"];
    }
    else if (cur_image_status === "completed_for_testing") {
        image_status_options = ["completed_for_training", "completed_for_testing"];
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
    for (image_status of image_status_options) {
        $("#status_combo").append($('<option>', {
            value: image_status,
            text: image_status
        }));
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


        console.log("createAnnotation");

        annotations[cur_img_name]["annotations"] = anno.getAnnotations();
        num_annotations++;

        annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

        update_image_status();
        set_image_status_combo();
        $("#save_icon").css("color", "#ed452b");
        create_image_set_table();
    });

    anno.on('createSelection', async function(selection) {

        console.log("createSelection");

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


        console.log("updateAnnotation");
        let px_str = annotation.target.selector.value;
        let updated_px_str = resize_px_str(px_str);

        annotation.target.selector.value = updated_px_str;

        await anno.updateSelected(annotation);
        anno.saveSelected();

        annotations[cur_img_name]["annotations"] = anno.getAnnotations();
        $("#save_icon").css("color", "#ed452b");

        annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

        add_annotations();
    });

}


function create_viewer_and_anno(viewer_id) {

    //$("#seadragon_viewer").empty();


    viewer = OpenSeadragon({
        id: viewer_id, //"seadragon_viewer",
        sequenceMode: true,
        prefixUrl: "/plant_detection/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 100,
        zoomPerClick: 1,
        nextButton: "next-button",
        previousButton: "prev-button",
        showNavigationControl: false,
        prserveViewport: true
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

            console.log("deleteAnnotation");

            let selected = anno.getSelected();
            anno.removeAnnotation(selected);

            annotations[cur_img_name]["annotations"] = anno.getAnnotations();
            num_annotations--;

            annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

            update_image_status();
            set_image_status_combo();
            $("#save_icon").css("color", "#ed452b");
            create_image_set_table();

        }

    }

    viewer.addHandler("open", function(event) {

        //console.log("cur_bounds", cur_bounds);
        //viewer.viewport.applyConstraints();
        //console.log("viewer open handler called");
        //anno.clearAnnotations();

        /*
        let img_files_name = basename(event.source);
        let img_name = img_files_name.substring(0, img_files_name.length - 4);

        cur_img_name = img_name;
        console.log("cur_img_name", cur_img_name);

        $("#image_name").text(cur_img_name);
        set_image_status_combo();

        */

        /*
        if (pending_predictions[cur_img_name]) {
            disable_buttons(["request_prediction_button"]);
        }
        else {
            enable_buttons(["request_prediction_button"]);
        }*/



        //console.log(cur_bounds);

        //$("#use_for_radio").prop('disabled', ((annotations[cur_img_name]["available_for_training"]) || 
        //                                      (annotations[cur_img_name]["status"] !== "completed"))); 
        //((annotations[cur_img_name]["available_for_training"]) || 
        //                                    (annotations[cur_img_name]["status"] !== "completed")));

/*
        for (annotation of annotations[cur_img_name]["annotations"]) {
            anno.addAnnotation(annotation);
        }*/

        //viewer.viewport.zoomTo(5, null, true);
        //viewer.viewport.zoomTo(1, null, true);
        //viewer.viewport.applyConstraints();

        if (cur_bounds) {
            withFastOSDAnimation(viewer.viewport, function() {
                viewer.viewport.fitBounds(cur_bounds);
            });
        }
        
    });


    //anno = create_anno();



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

    //console.log("sel_metric", sel_metric);
    console.log("sel_interpolation", sel_interpolation);
    
    

    $.post($(location).attr('href'),
    {
        action: "build_map",
        interpolation: sel_interpolation
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
            let timestamp = new Date().getTime();   
            
            let base = "/plant_detection/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
                    image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/maps/"

            map_url = base + "annotated_map.svg?t=" + timestamp;



            let min_max_rec_url = base + "min_max_rec.json?t=" + timestamp;
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
    for (image_name of Object.keys(annotations)) {
        
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

    draw_map_chart();
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


    $.post($(location).attr('href'),
    {
        action: "save_annotations",
        annotations: JSON.stringify(annotations),
        excess_green_record: JSON.stringify(excess_green_record)
    },
    
    function(response, status) {

        if (response.error) {
            //create_image_set_table();
            show_modal_message("Error", "Failed to save.");
        }
        else {
            console.log("Annotations Saved!");
            create_image_set_table();
            $("#save_icon").css("color", "white");
        }
    });

}



function refresh() {
    console.log("refreshing the lock file");
    
    $.post($(location).attr('href'),
    {
        action: "refresh_lock_file"
    },
    
    function(response, status) {

        if (response.error) {
            show_modal_message("Error", "Your annotation session has failed to refresh. " +
                                        "The system will now attempt to save your annotations to prevent the loss of any work.");
            save_annotations();
        }

    });
    
}

function expired_session() {

    save_annotations();

    $.post($(location).attr('href'),
    {
        action: "expired_lock_file"
    },
    
    function(response, status) {  
        window.location.href = response.redirect;
    });
    
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
            console.log("timer finished");
            expired_session();
        }
    }, 1000);

    
    $("#modal_body").append(`<div id="modal_button_container">
        <button id="continue_annotate" class="std-button std-button-hover" `+
        `style="width: 200px" onclick="confirmed_continue()"><span>Continue Annotating</span></button>` +
        `</div>`);

    
    $("#modal").css("display", "block");
}


$(window).bind('beforeunload', function(event){

    $.post($(location).attr('href'),
    {
        action: "expired_lock_file"
    },
    
    function(response, status) {

    });
});

function create_overlays_table() {

    let models_col_width = "215px";

    for (overlay_name of Object.keys(overlay_colors)) {
        let overlay_color = overlay_colors[overlay_name];

        let model_row_id = overlay_name + "_row";
        $("#overlays_table").append(`<tr id=${model_row_id}>` +
            `<td><label class="table_label" ` +
            `style="width: ${models_col_width}; background-color: ${overlay_color};">` +
            `<table class="transparent_table">` +
            `<tr>` + 
            `<td style="width: 40px">` +
                `<label class="switch">` +
                `<input id=${overlay_name} type="checkbox" checked></input>` +
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
    for (annotation of predictions[cur_img_name]["annotations"]) {    
        let bodies = Array.isArray(annotation.body) ? annotation.body : [ annotation.body ];
        let highlightBodyIndex = bodies.findIndex(b => b.purpose == 'highlighting');
        let highlightBody = bodies[highlightBodyIndex];
        let scoreTagIndex = bodies.findIndex(b => b.purpose == 'score');
        let scoreTag = bodies[scoreTagIndex];

        if (scoreTag.value >= slider_val) {
            //let index = annotation["body"].indexOf(highlightBody);
            if (highlightBodyIndex !== -1) {
                annotation["body"].splice(highlightBodyIndex, 1);
            }
            if (scoreTagIndex !== -1) {
                annotation["body"].splice(scoreTagIndex, 1);
            }
            annotations[cur_img_name]["annotations"].push(annotation);
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
    //console.log("setting read only status");
    anno.readOnly = false; //annotations[cur_img_name]["status"] === "completed_for_training";
    add_annotations();


    let dzi_image_path = image_to_dzi[cur_img_name];
    
    
    viewer.open(dzi_image_path);
    //console.log(cur_bounds);
    


}



// function retrieve_predictions() {

//     $("#predictions_available").hide();
//     $.post($(location).attr('href'),
//     {
//         action: "retrieve_prediction",
//         image_name: cur_img_name
//     },

//     function(response, status) {
//         console.log("got response");

//         if (response.error) {
//             // show_modal_message("Error", response.message);
  
//         }
//         else {
            
//             $("#predictions_available").show();
//             predictions[cur_img_name] = response.predictions[cur_img_name];
//             if (response.metrics !== "") {
//                 metrics[cur_img_name] = response.metrics[cur_img_name];
//             }
            
//             for (annotation of predictions[cur_img_name]["annotations"]) {
//                 annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"});
//             }

            
//             //$("#prediction_switch").prop("checked", true);
//             //$("#prediction_switch").change();
//             set_count_chart_data();
//             update_count_chart();
//         }
//         add_annotations();


//     });
// }

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

    $("#predictions_available").hide();
    if (cur_img_name in predictions) {
        $("#predictions_available").show();
        set_count_chart_data();
        update_count_chart();
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

    disable_buttons(["request_segment_button"]);
    $("#image_loader").show();

    console.log("test button clicked");

    //let timestamp = new Date().getTime();

    let exg_src = "/plant_detection/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/"
                    + image_set_info["field_name"] + "/" + image_set_info["mission_date"] + 
                    "/excess_green/" + cur_img_name + ".png"; //?t=" + timestamp;
    let rgb_src = "/plant_detection/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/"
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
        console.log("raise_threshold_slider");
        let slider_val = parseFloat($("#threshold_slider").val());
        if (slider_val < max_val) {
            slider_val = slider_val + 0.01;
            $("#threshold_slider").val(slider_val).change();
        }
    }
    function lower_threshold_slider() {
        console.log("lower_threshold_slider");
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
    console.log("threshold", threshold);

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

        console.log("all images are loaded");


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
        
        //console.log(d.data);

    /*
        for (var i=0; i<d.data.length; i+=4) { // 4 is for RGBA channels
            // R=G=B=R>T?255:0
            d.data[i] = d.data[i+1] = d.data[i+2] = d.data[i+1] > threshold ? 255 : 0;
        }*/
        //for (var i=0; i<d.data.length; i+=1) { // 4 is for RGBA channels
        
        //let j = 0;

        console.log("calculating foreground percentage");
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
        console.log("finished calculating foreground percentage");
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

        enable_buttons(["request_segment_button"]);
        

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
    console.log("add_annotations");
    anno.clearAnnotations();
    if ((cur_panel === "annotation") || (cur_panel === "prediction" && ($("#annotations").is(":checked")))) {
        for (annotation of annotations[cur_img_name]["annotations"]) {
            anno.addAnnotation(annotation);
        }
    }
    let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
    if ((cur_panel == "prediction") && (cur_img_name in predictions)) {
        if ($("#predictions").is(":checked")) {
            for (annotation of predictions[cur_img_name]["annotations"]) {

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


// function confirmed_restart_model() {
//     // $("#modal_button_container").empty();
//     // $("#restart_loader").show();
    
//     //waiting_for_restart = true;
//     $.post($(location).attr('href'),
//     {
//         action: "restart_model"
//     },
    
//     function(response, status) {
//         console.log(response);
//         //annotations = response.annotations;
//     });
// }

// function restart_model() {
// /*
//     $("#modal_head").empty();
//     $("#modal_body").empty();
// */
//     $("#restart_requested_switch").prop("checked", false);

//     show_modal_message(`Restart model?`, 
//     `<p>When this restart request is processed, the model will be reset to its initial state. Additionally, the status of all fully annotated images will be ` + 
//     `set to <em>completed_for_testing</em>.</p>` + 
//     `<div style="text-align: center">
//     <button class="std-button std-button-hover" `+
//     `id="modal_restart_button" style="width: 200px" onclick="confirmed_restart_model()">Restart</button>` +
//     `<button class="std-button std-button-hover" ` +
//     `id="modal_cancel_button" style="width: 200px" onclick="close_modal()">Cancel</button>` +
//     `</div>`);

//     // $("#modal_head").append(
//     //     `<p>Restart model?</p>`);
// /*
//     $("#modal_body").append(`<p id="modal_message" align="left"></p>`);
//     $("#modal_message").html(`When this restart request is processed, the model will be reset to its initial state. Additionally, the status of all fully annotated images will be ` + 
//     `set to <em>completed_for_testing</em>.`);

//     $("#modal_body").append(`<div id="modal_button_container">
//     <button class="std-button std-button-hover" `+
//     `id="modal_restart_button" style="width: 200px" onclick="confirmed_restart_model()"><span>Restart</span></button>` +
//     `<button class="std-button std-button-hover" ` +
//     `id="modal_cancel_button" style="width: 200px" onclick="close_modal()"><span>Cancel</span></button>` +
//     `</div>`);
// */

//     // $("#modal_body").append(`<div id="restart_loader" class="loader" hidden></div>`);

//     // $("#modal_close").click(function() {
//     //     close_modal();
//     // });

//     $("#modal").css("display", "block");
// }


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

$(document).ready(function() {
    window.setInterval(refresh, 90000); // 1.5 minutes
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


    $("#image_set_name").text(image_set_info["farm_name"] + "  |  " + 
                              image_set_info["field_name"] + "  |  " + 
                              image_set_info["mission_date"]);

    image_to_dzi = {};
    for (dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path);
        let extensionless_name = image_name.substring(0, image_name.length - 4);
        image_to_dzi[extensionless_name] = dzi_image_path;
    }

    let init_image_name = basename(dzi_image_paths[0]);
    cur_img_name = init_image_name.substring(0, init_image_name.length - 4);

    console.log(cur_img_name);
    cur_view = "image";
    cur_panel = "annotation";

    create_image_set_table();

    
    num_annotations = 0;
    for (image_name of Object.keys(annotations)) {
        num_annotations += annotations[image_name]["annotations"].length;
    }
    console.log("num_annotations", num_annotations);
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
        path: "/plant_detection/socket.io"
    });
    // let socket = io("172.16.1.71:8220/plant_detection");
    //"https://plotreel.usask.ca", {
    //    path: "/plant_detection/annotate/sally/MORSE/Dugout/2022-05-27"
    //});

    socket.emit("join_annotate", username + "/" + image_set_info["farm_name"] + "/" + image_set_info["field_name"] + "/" + image_set_info["mission_date"]);

    socket.on("status_change", function(status) {
        console.log("status", status);

        if (status["error"] === 'True') {
            let error_message = `An error occurred during ` + status["error_setting"] + 
            `:<br><br>` + status["error_message"];
            

            if (status["error_setting"] === "prediction") {
                error_message = error_message + `<br><br>Please report this error to the site administrator.`;
            }
            else if (status["error_setting"] === "training") {
                error_message = error_message + `<br><br>The model will be prevented from training until the error is resolved. Please contact the site administrator.`;
            }

            show_modal_message("Error", error_message);
        }

        let update_num = parseInt(status["update_num"]);
        if (update_num > cur_update_num) {
            cur_update_num = update_num;
            cur_status = status["status"];
            // let cur_num_trained_on = parseInt(status["num_images_fully_trained_on"]);
            
            $("#model_status").html(cur_status);

            // let num_available = 0;
            // for (image_name of Object.keys(annotations)) {
            //     if (annotations[image_name]["status"] == "completed_for_training") {
            //         num_available++;
            //     }
            // }
            /*
            if (cur_status === "uninitialized" || cur_status === "initializing") {
                $("#model_training_status").html("N/A");
            }*/
            //if (cur_num_trained_on == num_available) {
            if (status["fully_trained"] === "True") {
                $("#model_training_status").html("yes");
            }
            else {
                $("#model_training_status").html("no");
            }
        

            /*
            if ("restarted" in status) {
                for (image_name of Object.keys(annotations)) {
                    if (annotations[image_name]["status"] === "completed_for_training") {
                        annotations[image_name]["status"] = "completed_for_testing";
                    }
                }
                close_modal();
                create_image_set_table();
                set_image_status_combo();
            }*/
            /*
            if (cur_status === "predicting") {
                disable_buttons(["request_prediction_button", "request_result_button"]);
            }
            else {
                enable_buttons(["request_prediction_button", "request_result_button"]);
            }*/



            if (status["outstanding_prediction_requests"] === "True") {
                disable_buttons(["request_prediction_button", "request_result_button"]);
            }
            else {
                enable_buttons(["request_prediction_button", "request_result_button"]);
            }


            if (status["sys_training_blocked"] === "True") {
                $("#train_block_text").html("yes");
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

                if (status["usr_training_blocked"] === "True") {
                    $("#train_block_text").html("yes");
                    $("#train_block_switch").prop("checked", true);
                }
                else {
                    $("#train_block_text").html("no");
                    $("#train_block_switch").prop("checked", false);
                }
            }

            // if (status["restart_requested"] === "True") {
            //     $("#restart_requested_text").html("yes");
            //     $("#restart_requested_switch").prop("checked", true);
            //     $("#restart_requested_switch").prop('disabled', true);
            //     $("#restart_requested_label").css("opacity", 0.5);
            //     $("#restart_requested_slider").css("cursor", "default");
            // }
            // else {

            //     $("#restart_requested_switch").prop('disabled', false);
            //     $("#restart_requested_label").css("opacity", 1);
            //     $("#restart_requested_slider").css("cursor", "pointer");
            //     $("#restart_requested_text").html("no");
            //     $("#restart_requested_switch").prop("checked", false);
            // }

            if ("prediction_image_names" in status) {
                let prediction_image_names = status["prediction_image_names"].split(",");
                //for (prediction_image_name of prediction_image_names) {
                $.post($(location).attr('href'),
                {
                    action: "retrieve_predictions",
                    image_names: status["prediction_image_names"]
                },
            
                function(response, status) {
                    console.log("got response");
                    console.log(response);
            
                    if (response.error) {
                        show_modal_message("Error", response.message);
            
                    }
                    else {

                        for (prediction_image_name of prediction_image_names) {
                            predictions[prediction_image_name] = response.predictions[prediction_image_name];
                            // if (response.metrics[prediction_image_name] !== "") {
                            //     metrics[prediction_image_name] = response.metrics[prediction_image_name];
                            // }
                            
                            for (annotation of predictions[prediction_image_name]["annotations"]) {
                                annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"});
                            }
                        }

                        if ((cur_panel === "prediction") && (prediction_image_names.includes(cur_img_name))) {
                            //show_prediction();

                            //if (cur_img_name in predictions) {
                            $("#predictions_available").show();
                            set_count_chart_data();
                            update_count_chart();
                            //}
                            add_annotations();
                        }
                    }
                });
                //}


            }


            // if (("prediction_image_names" in status) && (cur_panel === "prediction")) {
                
            // }


            /*
            if (cur_status === "training") {
                $("#train_block_switch").prop('disabled', true);
                $("#train_block_label").css("opacity", 0.5);
                $("#train_block_slider").css("cursor", "default");
            }
            else {
                $("#train_block_switch").prop('disabled', false);
                $("#train_block_label").css("opacity", 1);
                $("#train_block_slider").css("cursor", "pointer");
            }*/
        }


/*
        let train_block_switch_active = $("#train_block_switch").is(":checked");
        let flip_switch = false;
        if (status["training_blocked"] === "True") {
            $("#train_block_text").html("yes");
            if (!train_block_switch_active) {
                flip_switch = true;
            }

        }
        else {
            $("#train_block_text").html("no");
            if (train_block_switch_active) {
                flip_switch = false;
            }
        }
        console.log("flip_switch", flip_switch);*/

        /*
        if ("prediction_image_names" in status) {

            let prediction_image_names = status["prediction_image_names"].split(",");

            console.log("pending_predictions", pending_predictions);
            console.log("prediction_image_names", prediction_image_names);
            
            //let index = pending_predictions.indexOf(status["prediction_image_name"]);
            //if (index !== -1) {
            //    pending_predictions.splice(index, 1);
            //}
            if (prediction_image_names.length == 1) {
                let prediction_image_name = prediction_image_names[0];

                pending_predictions[prediction_image_name] = false;
                console.log("pending_predictions", pending_predictions);
                console.log(cur_img_name, prediction_image_name);
                if (cur_img_name === prediction_image_name) {
                    //enable_buttons(["request_prediction_button"])
                    console.log("cur_panel", cur_panel);
                    if (cur_panel === "prediction") {
                        show_prediction();
                    }
                }
            }
            else {
                //enable_buttons(["request_result_button"]);
                if (cur_panel === "prediction") {
                    show_prediction();
                }
            }
        }*/
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
    // $('#chart_combo').append($('<option>', {
    //     value: "MS COCO mAP",
    //     text: "MS COCO mAP"
    // }));
    // $('#chart_combo').append($('<option>', {
    //     value: "PASCAL VOC mAP",
    //     text: "PASCAL VOC mAP"
    // }));

    $("#chart_combo").change(function() {
        set_count_chart_data();
        update_count_chart();
    });


    set_count_chart_data();
    draw_count_chart();

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



    //show_annotation();




    
    //let test_annotation = {'type': 'Annotation', 'body': [{'type': 'TextualBody', 'purpose': 'class', 'value': 'plant'}], 'target': {'source': 'https://plotreel.usask.ca/plant_detection/annotate/BlaineLake/HornerWest/undefined', 'selector': {'type': 'FragmentSelector', 'conformsTo': 'http://www.w3.org/TR/media-frags/', 
    //'value': 'xywh=pixel:124.53097534179688,133.33065795898438,26.285736083984375,20.399093627929688'}}, '@context': 'http://www.w3.org/ns/anno.jsonld', 'id': '#53750c2c-0af8-4429-881d-9b9abfbe1de7'};
    //anno.addAnnotation(test_annotation, false);
    /*
    var overlayElement = document.createElement('div');
    
    var location = new OpenSeadragon.Rect(
        //124.53097534179688 
        0, 0, 1, 0.1 //10000, 10000 //1000, 1000
        //124.53097534179688,133.33065795898438,26.285736083984375,20.399093627929688
      );
    viewer.addOverlay(overlayElement, location);*/


    $("#save_button").click(function() {
        window.clearTimeout(ask_to_continue_handle);
        ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000);
        save_annotations();
    });

    $("#status_combo").change(function() {

        annotations[cur_img_name]["status"] = $("#status_combo").val();
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

    $("#home_button").click(function() {
        //save_annotations();
        $.post($(location).attr('href'),
        {
            action: "expired_lock_file"
        },
        
        function(response, status) {
            window.location.href = "/plant_detection/home/" + username;
        });
    })

    $("#log_out").click(function() {
        //save_annotations();
        $.post($(location).attr('href'),
        {
            action: "expired_lock_file"
        },
        
        function(response, status) {
            window.location.href = "/plant_detection/logout";
        });
    });

    $("#request_result_button").click(function() {
        disable_buttons(["request_prediction_button", "request_result_button"]);
        $.post($(location).attr("href"),
        {
            action: "get_result"
        },
        function(response, status) {
            if (response.error) {
                show_modal_message("Error", response.message);
            }
            else {
                show_modal_message("Success", 
                `<div>Your request was successfully submitted. Upon completion, the ` +
                `results will be preserved under this image set's <em>Results</em> tab (accessible from the home page).</div>`);
            }
        });

    });


    $("#request_prediction_button").click(function() {

        disable_buttons(["request_prediction_button", "request_result_button"]);
        //console.log("pushing", cur_img_name);
        //pending_predictions[cur_img_name] = true;
        $.post($(location).attr('href'),
        {
            action: "predict",
            image_name: cur_img_name
        },

        function(response, status) {
            console.log("got response");
            
        });
    });

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
        `style="width: 200px" onclick="confirmed_use_predictions()"><span>Continue</span></button>` +
        `<button class="std-button std-button-hover" ` +
        `style="width: 200px" onclick="close_modal()"><span>Cancel</span></button>` +
        `</div>`);
        
        $("#modal_close").click(function() {
            close_modal();
        });
    
        $("#modal").css("display", "block");
    });

    /*
    $("#use_for_radio").change(function() {
        //let use_for = $("input[type='radio'][name='use_for_training']:checked").val();
        annotations[cur_img_name]["available_for_training"] = true;
    })*/

    /*
    $("#prediction_switch").change(function() {
        add_annotations();
    });*/

    $("#overlays_table").change(function() {
        add_annotations();
    });


    $("#score_switch").change(function() {
        add_annotations();
    });

    // $("#restart_requested_switch").click(function() {
    //     console.log("restart switch clicked");
    //     restart_model();
    // });

    $("#train_block_switch").click(function() {
        
        console.log("train block switch clicked");
        let block_training = $("#train_block_switch").is(":checked");
        let block_op;
        if (block_training) {
            $("#train_block_text").html("yes");
            block_op = "block";
        }
        else {
            $("#train_block_text").html("no");
            block_op = "unblock";
        }
        //$("#train_block_switch").prop('disabled', false);
        //$("#train_block_switch").change();
        //$("#train_block_switch").prop('disabled', true);

        
        $.post($(location).attr('href'),
        {
            action: "block_training",
            block_op: block_op
        },
        
        function(response, status) {

            if (response.error) {
                if (block_training) {
                    $("#train_block_text").html("no");
                }
                else {
                    $("#train_block_text").html("yes");
                }
                $("#train_block_switch").change();
                show_modal_message("Error", "An error occurred during the attempt to block training.")
            }

        });
    });




    $("#request_segment_button").click(function() {
        console.log("requesting segmentation");
        show_segmentation_inner();
        /*

        let threshold_val = Number.parseFloat($("#threshold_slider").val()).toFixed(2).toString();
        $.post($(location).attr('href'),
        {
            action: "segment",
            image_name: cur_img_name,
            threshold: threshold_val
        },

        function(response, status) {
            if (response.error) {
                console.log("error");
            }
            else {
                show_segmentation();
            }

        });*/

    });


    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#confidence_slider_val").html(slider_val);
        add_annotations();
        set_count_chart_data();
        update_count_chart();
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
        //console.log("setting all to ", exg_val);
        for (image_name of Object.keys(excess_green_record)) {
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


});

