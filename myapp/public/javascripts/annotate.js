

// import { bilinearInterpolation } from "simple-bilinear-interpolation";


let image_set_info;
let metadata;
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
let pending_predictions;
let predictions = {};
let cur_panel;
let cur_bounds = null;
let cur_status;

let cur_init_stage;
let init_annotation = null;
let annotation_guides = {};
//let waiting_for_restart = false;
let num_bg_areas = 0;
let REQ_INIT_ANNOTATIONS = 20;
let REQ_INIT_BG_AREAS = 5;

let map_url = null;

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
    $("#modal_head").empty();
    $("#modal_body").empty();

    $("#modal").css("display", "none");
}


function change_image(img_name) {
    
    cur_img_name = img_name;

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
    $("#image_set_table_init").empty();
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
        $("#image_set_table_init").append(item);

    }
}



function resize_px_str(px_str) {
    console.log(px_str);
    px_str = px_str.substring(11);
    let px_lst = px_str.split(",").map(x => parseFloat(x));
    let img_dims = viewer.world.getItemAt(0).getContentSize();
    let img_w = img_dims.x;
    let img_h = img_dims.y;
    console.log(px_str);
    console.log(px_lst);
    console.log("img_dims", img_dims);

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

    console.log("updated_px_str", updated_px_str);
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


function update_stage(stage) {
    cur_init_stage = stage;
    if (stage === "no_guide") {
        $("#annotation_instructions").html("Annotate a single plant.");
    }
    else if (stage === "fill_guide") {
        $("#annotation_instructions").html("Annotate all the plants contained " +
            "(partially or fully) within the red area.");
    }
    else if (stage === "no_bg_guide") {
        $("#annotation_instructions").html("Annotate a region without plants. Try to include difficult objects such as weeds!")
    }
    else if (stage === "submitted") {
        $("#annotation_instructions").html("Model is now being initialized.");
    }
}



function advance_init() {

    if (cur_init_stage === "no_guide") {
        

        let coords_str = init_annotation.target.selector.value;
        let coords = coords_str.substring(11).split(",").map(parseFloat);
        console.log("coords_str", coords_str);
        let image_shape = viewer.world._contentSize;
        console.log("image_shape", image_shape);
        //let overlayElement = document.createElement('div');
        //var overlay = viewer.viewport.imageToViewportRectangle(124.53097534179688,133.33065795898438,26.285736083984375,20.399093627929688); //absx, absy, abswidth, absheight);
        //let overlay = viewer.viewport.imageToViewportRectangle(0, 0, 0.1, 0.2); //absx, absy, abswidth, absheight);

        //console.log("bounds", viewer.world._contentSize);
        //let image_co = viewer.viewport.viewportToImageCoordinates(viewportPoint);

        let patch_size = get_patch_size(annotations);
        console.log("patch_size", patch_size);

        let centre_x = coords[0] + (coords[2] / 2);
        let centre_y = coords[1] + (coords[3] / 2);
        let px = Math.max(0, Math.min(centre_x - Math.round(patch_size / 2), image_shape.x - patch_size));
        let py = Math.max(0, Math.min(centre_y - Math.round(patch_size / 2), image_shape.y - patch_size));
        let width = Math.min(patch_size, image_shape.x - px);
        let height = Math.min(patch_size, image_shape.y - py);

        let overlay = {
            id: "guide_" + cur_img_name + "_" + annotation_guides[cur_img_name].length,
            px: px, //centre_x - 150,// / image_shape.x, //5472, //0,//125, //124.53097534179688,
            py: py, //centre_y - 150, // / image_shape.y, //3648, //0, //133, //133.33065795898438,
            width: width, //300, // image_shape.x, //5472, //260, //26.285736083984375,
            height: height, //300, // image_shape.y, //3648, //0.2,//200, //20.399093627929688,
            className: "annotation_guide"
        }

        annotation_guides[cur_img_name].push(overlay);



        //overlayElement.style.background = 'rgba(255, 0, 0, 0.3)'; 
        //let overlay = viewer.viewport.imageToViewportCoordinates(20, 20);
        //var tiledImage = viewer.world.getItemAt(0);
        /*
        var rect = new OpenSeadragon.Rect(overlay.px, overlay.py, overlay.width, overlay.height);
        rect = viewer.viewport.imageToViewportRectangle(rect);
        overlay.x = rect.x;
        overlay.y = rect.y;
        overlay.width = rect.width;
        overlay.height = rect.height;
        delete overlay.px;
        delete overlay.py;*/



        console.log("overlay", overlay);
        //viewer.addOverlay(overlay);
        viewer.addOverlay(overlay); //overlayElement, overlay); //,OpenSeadragon.OverlayPlacement.TOP_LEFT);

        update_stage("fill_guide");
    }
    else if (cur_init_stage === "fill_guide") {
        init_annotation = null;
        disable_buttons(["init_next_button"]);
        if (num_annotations < REQ_INIT_ANNOTATIONS) {
            update_stage("no_guide");
        }

        else {
            //submit_initialization_request();
            //update_stage("submitted");
            update_stage("no_bg_guide");
        }
    }
    else if (cur_init_stage === "no_bg_guide") {
        num_bg_areas++;

        let rev_annotations = {};
        for (image_name of Object.keys(annotations)) {
            rev_annotations[image_name] = {"annotations": []};
            for (annotation of annotations[image_name]["annotations"]) {
                const bodies = Array.isArray(annotation.body) ?
                                annotation.body : [ annotation.body ];
                            
                //const scoreTag = bodies.find(b => b.purpose == 'score');
                const highlightBody = bodies.find(b => b.purpose == 'highlighting');
                if (!highlightBody || highlightBody.value !== "COLOR_3") {
                    rev_annotations[image_name]["annotations"].push(annotation)
                }
            }
            if (rev_annotations[image_name]["annotations"].length > 0) {
                rev_annotations[image_name]["status"] = "started";
            }
            else {
                rev_annotations[image_name]["status"] = "unannotated";
            }
        }
        annotations = rev_annotations;
        
        anno.removeAnnotation(init_annotation);
        num_annotations--;
        // add_annotation = false;
        let coords_str = init_annotation.target.selector.value;
        let coords = coords_str.substring(11).split(",").map(parseFloat); //.map(Math.round);

        let overlay = {
            id: "guide_" + cur_img_name + "_" + annotation_guides[cur_img_name].length,
            px: coords[0],
            py: coords[1],
            width: coords[2],
            height: coords[3],
            className: "annotation_guide"
        }

        annotation_guides[cur_img_name].push(overlay);
        viewer.addOverlay(overlay);

        if (num_bg_areas < REQ_INIT_BG_AREAS) {

            init_annotation = null;
            disable_buttons(["init_next_button"]);
            update_stage("no_bg_guide");
        }
        else {
            submit_initialization_request();
            update_stage("submitted");
        }
    }


}

function create_anno() {


    anno = OpenSeadragon.Annotorious(viewer, {
        disableEditor: true,
        disableSelect: true, //false, //readOnly,
        readOnly: true, //false, //readOnly,
        formatter: formatter
    });


    anno.on('createAnnotation', function(annotation) {

        //annotations[cur_img_name]["annotations"] = anno.getAnnotations();
        //num_annotations++;
        //if (num_annotations <= REQ_INIT_ANNOTATIONS) {
        //if (cur_stage == "init") {
        let add_annotation = true;
        if (cur_view === "initialize") {
            //$("#num_annotations").html(REQ_INIT_ANNOTATIONS - num_annotations);
            if (cur_init_stage === "no_guide" || cur_init_stage === "no_bg_guide") {
                
                if (init_annotation) {
                    anno.removeAnnotation(annotation);
                    add_annotation = false;
                }
                else {
                    init_annotation = annotation;
                    enable_buttons(["init_next_button"]);
                }
            }
            /*
            else if (cur_init_stage === "fill_guide") {

            }*/
            // if (cur_init_stage === "no_bg_guide") {
            //     annotation["body"].push({"value": "COLOR_3", "purpose": "highlighting"});
            // }

        }


        /*
        if (num_annotations == REQ_INIT_ANNOTATIONS && !(data["baseline_initialized"])) {
            $("#initial_annotations_complete").show();
        }*/
        if (add_annotation) {
            annotations[cur_img_name]["annotations"] = anno.getAnnotations();
            num_annotations++;
        }


        update_image_status();
        set_image_status_combo();
        $("#save_icon").css("color", "#ed452b");
        create_image_set_table();
        /*
        if (cur_init_stage === "no_bg_guide") {
            advance_init();
        }*/
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

        if (cur_init_stage === "no_bg_guide") {
            selection.body.push({"value": "COLOR_3", "purpose": "highlighting"});
        }

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

        if (init_annotation) {
            init_annotation = annotation;
        }

        add_annotations();
    });

    /*
    anno.on('selectAnnotation', function(annotation, element) {
        console.log("selectAnnotation");
    });
    */

    //return anno;

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
            if (init_annotation) {
                init_annotation = null;
            }

            let selected = anno.getSelected();
            anno.removeAnnotation(selected);

            annotations[cur_img_name]["annotations"] = anno.getAnnotations();
            num_annotations--;
            /*
            if (num_annotations < REQ_INIT_ANNOTATIONS && !(data["baseline_initialized"])) {
                $("#num_annotations").html(REQ_INIT_ANNOTATIONS - num_annotations);
                $("#initial_annotations_complete").hide();
            }*/

            update_image_status();
            set_image_status_combo();
            $("#save_icon").css("color", "#ed452b");
            create_image_set_table();

        }

    }

    viewer.addHandler("open", function(event) {

        //console.log("cur_bounds", cur_bounds);
        //viewer.viewport.applyConstraints();
        console.log("viewer open handler called");
        //anno.clearAnnotations();

        let img_files_name = basename(event.source);
        let img_name = img_files_name.substring(0, img_files_name.length - 4);

        cur_img_name = img_name;
        console.log("cur_img_name", cur_img_name);

        $("#image_name").text(cur_img_name);
        set_image_status_combo();

        
        if (pending_predictions[cur_img_name]) {
            disable_buttons(["request_prediction_button"]);
        }
        else {
            enable_buttons(["request_prediction_button"]);
        }

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

        if (cur_view === "initialize") {
            for (overlay of annotation_guides[cur_img_name]) {
                viewer.addOverlay(overlay);
            }
        }

        if (cur_bounds)
            withFastOSDAnimation(viewer.viewport, function() {
                viewer.viewport.fitBounds(cur_bounds);
            });
        
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



function disable_buttons(button_ids) {

    for (button_id of button_ids) {
        console.log("disabling", button_id);
        $("#" + button_id).prop('disabled', true);
        $("#" + button_id).removeClass("table_button_hover");
        $("#" + button_id).css("opacity", 0.5);
        $("#" + button_id).css("cursor", "default");
    }
}


function enable_buttons(button_ids) {

    
    for (button_id of button_ids) {
        console.log("enabling", button_id);
        $("#" + button_id).prop('disabled', false);
        $("#" + button_id).addClass("table_button_hover");
        $("#" + button_id).css("opacity", 1);
        $("#" + button_id).css("cursor", "pointer");
    }
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
            console.log(response.error);
            map_url = null;
            draw_map_chart();
        }
        else {
            let timestamp = new Date().getTime();    

            map_url = "/plant_detection/usr/data/image_sets/" + image_set_info["farm_name"] + "/" + 
                            image_set_info["field_name"] + "/" + image_set_info["mission_date"] + 
                            "/maps/annotated_map.svg?t=" + timestamp;
            draw_map_chart();
        }
    });


}

function next_image() {
    let image_names = natsort(Object.keys(annotations));
    let index = image_names.indexOf(cur_img_name) + 1;
    console.log("image_names", image_names);
    console.log("index", index);
    change_image(image_names[index]);
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

function show_initialize(image_name) {
    cur_view = "initialize";

    //$("#image_view_container").hide();
    $("#map_view_container").hide();
    $("#image_view_container").show();

    $("#ctl_left_panel").hide();
    $("#ctl_right_panel").hide();
    $("#init_left_panel").show();
    $("#init_right_panel").show();
    //$("#initialize_container").show();
    //$("#image_view_container").show();

    //change_image(image_name);
    //cur_img_name = img_name;
    //init_show_annotation();
    disable_buttons(["init_next_button"]);
    update_stage("no_guide");
    change_image(image_name);
}


function show_image(image_name) {
    cur_view = "image";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-location-dot" style="padding-right: 10px; color: white;"></i>Map View`);
    
    //$("#initialize_container").hide();
    $("#map_view_container").hide();
    $("#image_view_container").show();

    $("#init_left_panel").hide();
    $("#init_right_panel").hide();
    $("#ctl_left_panel").show();
    $("#ctl_right_panel").show();

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


function submit_initialization_request() {


    $.post($(location).attr('href'),
    {
        action: "initialize_model",
        annotations: JSON.stringify(annotations),
        annotation_guides: JSON.stringify(annotation_guides)
    },
    
    function(response, status) {

        if (response.error) {
            //create_image_set_table();
            show_modal_message("Error", "Request to initialize model has failed.");
        }
        else {
            show_modal_message("Success", response.message);
            $("#save_icon").css("color", "white");
            show_image(cur_img_name);
        }

    });
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

    /*
    if (num_annotations >= REQ_INIT_ANNOTATIONS && !data["baseline_initialized"]) {
        $("#init_panel").hide();
        $("#ctl_panel").show();
    }*/
    /*
        $.post($(location).attr('href'),
        {
            action: "request_weight_initialization"
        },
        function(response, status) {
            show_modal_message("A baseline model is being selected. You can continue annotating in the meantime.")

        });
    }*/
}



function refresh() {
    console.log("refreshing the lock file");
    
    $.post($(location).attr('href'),
    {
        action: "refresh_lock_file"
    },
    
    function(response, status) {

        if (response.error) {
            if (cur_view !== "initialize") {
                save_annotations();
            }
        }
        else {
            console.log("refreshed");
        }

    });
    
}

function expired_session() {

    if (cur_view !== "initialize") {
        save_annotations();
    }
    $.post($(location).attr('href'),
    {
        action: "expired_lock_file"
    },
    
    function(response, status) {  
        window.location.href = response.redirect;
    });
    
}

function confirm_continue() {
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
        `style="width: 200px" onclick="confirm_continue()"><span>Continue Annotating</span></button>` +
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
    let overlay_colors = [
        "#0080C0",        
        "#FF4040"
    ];
    let overlay_names = [
        "annotations",
        "predictions"
    ];
    for (let i = 0; i < overlay_names.length; i++) {
        let overlay_color = overlay_colors[i];
        let overlay_name = overlay_names[i];
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


function confirm_use_predictions() {
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
    console.log("setting read only status");
    anno.readOnly = annotations[cur_img_name]["status"] === "completed_for_training";
    add_annotations();


    let dzi_image_path = image_to_dzi[cur_img_name];
    
    
    viewer.open(dzi_image_path);
    //console.log(cur_bounds);
    


}



function retrieve_predictions() {

    $("#predictions_available").hide();
    $.post($(location).attr('href'),
    {
        action: "retrieve_prediction",
        image_name: cur_img_name
    },

    function(response, status) {
        console.log("got response");

        if (response.error) {
  
        }
        else {
            
            $("#predictions_available").show();
            predictions[cur_img_name] = response.predictions[cur_img_name];
            
            for (annotation of predictions[cur_img_name]["annotations"]) {
                annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"});
            }

            
            //$("#prediction_switch").prop("checked", true);
            //$("#prediction_switch").change();
        }
        add_annotations();
    });
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

    retrieve_predictions();
    
    
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

    let timestamp = new Date().getTime();

    let exg_src = "/plant_detection/usr/data/image_sets/" + image_set_info["farm_name"] + "/"
                    + image_set_info["field_name"] + "/" + image_set_info["mission_date"] + 
                    "/excess_green/" + cur_img_name + ".png"; //?t=" + timestamp;
    let rgb_src = "/plant_detection/usr/data/image_sets/" + image_set_info["farm_name"] + "/"
                    + image_set_info["field_name"] + "/" + image_set_info["mission_date"] + 
                    "/images/" + cur_img_name + image_set_info["image_ext"]; //".JPG"; //?t=" + timestamp;


    let min_val = excess_green_record[cur_img_name]["min_val"];
    let max_val = excess_green_record[cur_img_name]["max_val"];
    let sel_val = Number.parseFloat(excess_green_record[cur_img_name]["sel_val"]).toFixed(2);

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
        excess_green_record[cur_img_name]["sel_val"] = Number.parseFloat($("#threshold_slider").val()).toFixed(2);
        $("#threshold_slider_val").html( excess_green_record[cur_img_name]["sel_val"]);
    });

    $("#threshold_slider").change(function() {
        $("#save_icon").css("color", "#ed452b");
        excess_green_record[cur_img_name]["sel_val"] = Number.parseFloat($("#threshold_slider").val()).toFixed(2);
        $("#threshold_slider_val").html( excess_green_record[cur_img_name]["sel_val"]);
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

    exg_image.onload = function() {
        rgb_image.onload = function() {

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
        num_foreground = 0;
        for (var i=0; i<d_rgb.data.length; i+=4) {    
            // R=G=B=R>T?255:0
            /*
            if (d_exg.data[j] > threshold) {
                d_rgb.data[i] = 0;
                d_rgb.data[i+1] = 0;
                d_rgb.data[i+2] = 0;

            }*/
            is_foreground = d_exg.data[i] > threshold;
            d_rgb.data[i+3] = is_foreground ? 255 : 30;
            if (is_foreground) {
                num_foreground++;
            }
            //j++;
        }
        let percent_vegetation = ((num_foreground / (d_rgb.data.length / 4)) * 100).toFixed(2);
        excess_green_record[cur_img_name]["ground_cover_percentage"] = percent_vegetation;

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
        };
    };



    
    exg_image.src = exg_src;
    rgb_image.src = rgb_src;
}


function add_annotations() {
    console.log("add_annotations");
    anno.clearAnnotations();
    for (annotation of annotations[cur_img_name]["annotations"]) {
        if ((cur_panel !== "prediction") || ($("#annotations").is(":checked"))) {
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

/*
function confirm_restart_model() {
    $("#modal_button_container").empty();
    $("#restart_loader").show();
    
    //waiting_for_restart = true;
    $.post($(location).attr('href'),
    {
        action: "restart_model"
    },
    
    function(response, status) {
        console.log(response);
        //annotations = response.annotations;
    });
}

function restart_model() {

    $("#modal_head").empty();
    $("#modal_body").empty();

    $("#modal_head").append(
        `<p>Restart model?</p>`);

    $("#modal_body").append(`<p id="modal_message" align="left"></p>`);
    $("#modal_message").html("The model will be reset to its initial state. The status of all fully annotated images will be " + 
    "set to 'completed_for_testing'.");

    $("#modal_body").append(`<div id="modal_button_container">
    <button class="std-button std-button-hover" `+
    `id="modal_restart_button" style="width: 200px" onclick="confirm_restart_model()"><span>Restart</span></button>` +
    `<button class="std-button std-button-hover" ` +
    `id="modal_cancel_button" style="width: 200px" onclick="close_modal()"><span>Cancel</span></button>` +
    `</div>`);
    $("#modal_body").append(`<div id="restart_loader" class="loader" hidden></div>`);

    $("#modal_close").click(function() {
        close_modal();
    });

    $("#modal").css("display", "block");
}
*/


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
    excess_green_record = data["excess_green_record"];

    pending_predictions = {};
    for (image_name of Object.keys(annotations)) {
        pending_predictions[image_name] = false;
        annotation_guides[image_name] = [];
    }


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

    let socket = io();
    socket.emit('join_message', image_set_info["farm_name"] + "/" + image_set_info["field_name"] + "/" + image_set_info["mission_date"]);

    socket.on('status_change', function(status) {
        let update_num = status["update_num"];
        if (update_num > cur_update_num) {
            cur_update_num = update_num;
            cur_status = status["status"];
            let cur_num_trained_on = status["num_images_fully_trained_on"];
            
            $("#model_status").html(cur_status);

            let num_available = 0;
            for (image_name of Object.keys(annotations)) {
                if (annotations[image_name]["status"] == "completed_for_training") {
                    num_available++;
                }
            }
            if (cur_status === "uninitialized" || cur_status === "initializing") {
                $("#model_training_status").html("N/A");
            }
            else if (cur_num_trained_on == num_available) {
                $("#model_training_status").html("yes");
            }
            else {
                $("#model_training_status").html("no");
            }
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


        if ("prediction_image_names" in status) {

            let prediction_image_names = status["prediction_image_names"].split(",");

            console.log("pending_predictions", pending_predictions);
            console.log("prediction_image_names", prediction_image_names);
            /*
            let index = pending_predictions.indexOf(status["prediction_image_name"]);
            if (index !== -1) {
                pending_predictions.splice(index, 1);
            }*/
            if (prediction_image_names.length == 1) {
                let prediction_image_name = prediction_image_names[0];

                pending_predictions[prediction_image_name] = false;
                console.log("pending_predictions", pending_predictions);
                console.log(cur_img_name, prediction_image_name);
                if (cur_img_name === prediction_image_name) {
                    enable_buttons(["request_prediction_button"])
                    console.log("cur_panel", cur_panel);
                    if (cur_panel === "prediction") {
                        show_prediction();
                    }
                }
            }
            else {
                enable_buttons(["request_result_button"]);
                if (cur_panel === "prediction") {
                    show_prediction();
                }
            }
        }
    });






    //show_image();

    if (num_annotations > 0) {
        if ((!(metadata["missing"]["latitude"]) && !(metadata["missing"]["longitude"])) && (!(metadata["missing"]["area_m2"]))) {

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
    }
    else {
        show_modal_message("Welcome!", "Please follow the instructions to help the system initialize the detection model.");
        show_initialize(cur_img_name);
    }


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
        let message = "Hold the <i>SHIFT</i> key and drag the mouse to create a new annotation." +
        "<br><br>Use the <i>DELETE</i> key to remove annotations." + 
        "<br><br>Don't forget to save your work!"
        show_modal_message(head, message);
    })

    $("#home_button").click(function() {
        //save_annotations();
        $.post($(location).attr('href'),
        {
            action: "expired_lock_file"
        },
        
        function(response, status) {
            window.location.href = "/plant_detection/home";
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
        disable_buttons(["request_result_button"]);
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
                "The result request was successfully submitted. Upon completion, the " +
                "results will be preserved under this image set's 'Results' tab.");
            }
        });

    });


    $("#request_prediction_button").click(function() {

        disable_buttons(["request_prediction_button"]);
        console.log("pushing", cur_img_name);
        pending_predictions[cur_img_name] = true;
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
        `style="width: 200px" onclick="confirm_use_predictions()"><span>Continue</span></button>` +
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
    })




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


});
