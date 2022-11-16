

let image_set_info;
//let job_config;
// let overlays;
let metadata;
let camera_specs;
let predictions;
let annotations;
let metrics;
//let dzi_dir;
let dzi_image_paths;
let excess_green_record;
let download_uuid = "";
let map_download_uuid = "";
/*
let sorted_overlay_names;
let sorted_overlay_ids;
let overlay_colors;*/
let dataset_images;
//let used_for = {};
let image_to_dzi;

/*
let image_names = {
    "all": [],
    "completed": [],
    "unannotated": [],
    "training/validation": [],
    "testing": []
};*/

let viewer;
let anno;
let cur_img_name;
let cur_region_index;
//let cur_img_list;
let cur_nav_list;
let cur_view;
let cur_map_model_uuid;

let map_url = null;
let pred_map_url = null;
let min_max_rec = null;

let voronoi_data = {
    "annotation": null,
    "prediction": null
};


function change_image(cur_nav_item) {

    let navigation_type = $("#navigation_dropdown").val();

    console.log("change_image", cur_nav_item);

    let pieces = cur_nav_item.split("/");
    cur_img_name = pieces[0];
    cur_region_index = parseInt(pieces[1]);
    
    let index = cur_nav_list.findIndex(x => x == cur_nav_item);
    if (index == 0) {
        disable_std_buttons(["prev_image_button"]);
    }
    else {
        enable_std_buttons(["prev_image_button"]);
    }
    if (index == cur_nav_list.length - 1) {
        disable_std_buttons(["next_image_button"]);
    }
    else {
        enable_std_buttons(["next_image_button"]);
    }

    $("#image_name").text(cur_img_name);
    $("#region_name").empty();
    if (navigation_type === "training_regions" || navigation_type === "test_regions") {

        let disp_region_index = cur_region_index + 1;
        let region_color;
        if (navigation_type === "training_regions") {
            region_color = overlay_colors["training_region"];
        }
        else {
            region_color = overlay_colors["test_region"];
        }

        $("#region_name").append(
            `<div style="width: 75px; background-color: ${region_color}; margin: 0px 2px; color: black; border: none" class="object_entry">` +
            `Region ` + disp_region_index +
            `</div>`
        );
    }

    if (viewer == null) {
        create_viewer("seadragon_viewer");
    }

    compute_voronoi();

    let dzi_image_path = image_to_dzi[cur_img_name];
    viewer.open(dzi_image_path);

    set_count_chart_data();
    set_score_chart_data();
    update_score_chart();
    update_count_chart();
}
/*
function set_prediction_overlay_color() {

    for (let image_name of Object.keys(predictions)) {
        for (let annotation of predictions[image_name]["annotations"]) {
            annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"})
        }
    }
    // for (const [overlay_name, overlay] of Object.entries(overlays)) {

    //     let color_id = overlay["color_id"];
    //     for (image_name of Object.keys(overlay["overlays"])) {
    //         for (annotation of overlay["overlays"][image_name]["annotations"]) {
    //             annotation["body"].push({"value": color_id, "purpose": "highlighting"})
    //         }
    //     }
    // }
}*/

/*

function create_overlays_table() {

    let models_col_width = "215px";

    //for (let i = 0; i < Object.keys(overlay_data); i++) {
    for (let overlay_name of Object.keys(overlay_colors)) {
        let overlay_color = overlay_colors[overlay_name];
        let overlay_id = overlay_name.toLowerCase();

        //let overlay_name = overlay_data[i]["name"];
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
*/
// function create_overlays_table() {

//     let models_col_width = "215px";
//     for (const [overlay_name, overlay] of Object.entries(overlays)) {
//         let overlay_color = overlay["color"];
//         let model_row_id = overlay_name + "_row";
//         $("#models_table").append(`<tr id=${model_row_id}>` +
//             `<td><label class="table_label" ` +
//             `style="width: ${models_col_width}; background-color: ${overlay_color};">` +
//             `<table class="transparent_table">` +
//             `<tr>` + 
//             `<td style="width: 40px">` +
//                 `<label class="switch">` +
//                 `<input id=${overlay_name} type="checkbox"></input>` +
//                 `<span class="switch_slider round"></span></label>` +
//             `</td>` +
//             `<td style="width: 100%">` +
//                 `<div style="margin-left: 8px">${overlay_name}</div>` +
//             `</td>` +
//             `</tr>` +
//             `</table>` +
//             `</label>` +
//             `</td>`+
//             `</tr>`);
//     }
// }


// function create_image_set_table() {


//     let image_name_col_width = "180px";
//     let image_status_col_width = "60px";

//     $("#image_set_table").empty();

//     let filter_val = $("#filter_combo").val();

//     let abbreviation = {
//         "unannotated": "Un.",
//         "started": "St.",
//         "completed_for_training": "C. Tr.",
//         "completed_for_testing": "C. Te."
//     };

//     cur_img_list = [];
//     for (let image_name of natsort(Object.keys(annotations))) {
//         if ((filter_val === "all") || (annotations[image_name]["status"] === filter_val)) {

//             let image_status = annotations[image_name]["status"];
//             let abbreviated_status = abbreviation[image_status];
//             let image_color = status_color[image_status];

//             $("#image_set_table").append(`<tr>` +

//             `<td><div class="table_entry std_tooltip" style="margin: 0px 1px; background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}</div></td>` +
//             `<td><div class="table_button table_button_hover" style="width: ${image_name_col_width}; margin: 0px 1px;" ` +
//              `onclick="change_image('${image_name}')">${image_name}</div></td>` +
//             `</tr>`);

//             cur_img_list.push(image_name);
//         }
//     }
// }



// function update_overlays() {

//     anno.clearAnnotations();
//     if ($("#annotations").is(":checked")) {
//         for (let annotation of annotations[cur_img_name]["annotations"]) {
//             anno.addAnnotation(annotation);
//         }
//     }
//     let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
//     if ((cur_img_name in predictions) && ($("#predictions").is(":checked"))) {
//         for (let annotation of predictions[cur_img_name]["annotations"]) {

//             let bodies = Array.isArray(annotation.body) ?
//             annotation.body : [ annotation.body ];
//             let scoreTag = bodies.find(b => b.purpose == 'score');
//             if (!scoreTag || scoreTag.value >= slider_val) {
//                 anno.addAnnotation(annotation);
//             }
//         }
//     }
// }


function build_map() {
    disable_buttons(["build_map_button"]);
    $("#build_loader").show();
    //let sel_metric = $("input[type='radio'][name='metric']:checked").val();
    let sel_interpolation = $("input[type='radio'][name='interpolation']:checked").val();
    //let sel_model = $("input[type='radio'][name='map_model']:checked").val();
    let sel_pred_image_status = $("input[type='radio'][name='pred_image_status']:checked").val();
    //let comparison_type = $("input[type='radio'][name='comparison_type']:checked").val();

    //let include_annotated_map = $("input[type='radio'][name='include_annotated_map']:checked").val() === "yes";
    
    

    $.post($(location).attr('href'),
    {
        action: "build_map",
        //metric: sel_metric,
        interpolation: sel_interpolation,
        //model_uuid: sel_model,
        pred_image_status: sel_pred_image_status,
        annotation_version: $("#annotation_version_combo").val(),
        map_download_uuid: map_download_uuid
        //comparison_type: "side_by_side", //comparison_type
        //include_annotated_map: include_annotated_map 
        //image_set_data: JSON.stringify(image_set_data)
    },
    
    function(response, status) {
        $("#build_loader").hide();
        enable_buttons(["build_map_button"]);

        if (response.error) {
            show_modal_message("Error", "An error occurred while creating the density map.");
        }
        else {

            let map_download_uuid = response.map_download_uuid;
            //cur_map_model_uuid = sel_model;

            let timestamp = new Date().getTime();
            
            let base = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
                        image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/model/results/" +
                        image_set_info["timestamp"] + "/maps/" + map_download_uuid;

            map_url = base + "_annotated_map.svg?t=" + timestamp;


            // if (comparison_type === "diff") {
            //     pred_map_url = base + "difference_map.svg?t=" + timestamp;
            //     diff_map = true;
            // }
            // else {
            pred_map_url = base + "_predicted_map.svg?t=" + timestamp;
                // diff_map = false;
            // }


            let min_max_rec_url = base + "_min_max_rec.json?t=" + timestamp;
            min_max_rec = get_json(min_max_rec_url);

            draw_map_chart();
        }
    });


}

function show_map() {

    cur_bounds = null;
    overlay.onOpen = function() {};
    overlay.onRedraw = function() {};
    viewer = null;
    $("#seadragon_viewer").empty();

    cur_view = "map";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-image" style="padding-right: 10px; color: white;"></i>Image View`);

    $("#image_view_container").hide();
    $("#map_view_container").show();
    
    
    //create_map_models_radio();
    $("#map_builder_controls_container").show();


    let num_completed = 0;
    for (let image_name of Object.keys(annotations)) {

        let image_width_px = metadata["images"][image_name]["width_px"];
        let image_height_px = metadata["images"][image_name]["height_px"];

        if (image_is_fully_annotated(annotations, image_name, image_width_px, image_height_px)) {
            num_completed++;
        }
    }
    if (num_completed >= 3) {
        $("#sufficient_annotation_options").show();
    }
    //else {
        //$("#map_builder_controls_container").hide();
        //$("#insufficient_annotation_container").show();
    //}

    
    //draw_map_chart();

    //build_map();
}


function show_image(image_name) {
    cur_view = "image";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-location-dot" style="padding-right: 10px; color: white;"></i>Map View`);
    
    $("#map_view_container").hide();
    $("#image_view_container").show();

    set_heights();
    change_image(image_name + "/" + cur_region_index);
    
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


function create_viewer() {

    viewer = OpenSeadragon({
        id: "seadragon_viewer",
        sequenceMode: true,
        prefixUrl: get_CC_PATH() + "/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 100,
        zoomPerClick: 1,
        nextButton: "next-button",
        previousButton: "prev-button",
        showNavigationControl: false
    });


    
    overlay = viewer.canvasOverlay({

        onOpen: function() {
            set_cur_bounds();
        },
        onRedraw: function() {
            //console.log("onRedraw", selected_annotation_index, cur_edit_layer);

        
            let boxes_to_add = {};
            boxes_to_add["training_region"] = {};
            boxes_to_add["training_region"]["boxes"] = annotations[cur_img_name]["training_regions"];
            boxes_to_add["test_region"] = {};
            boxes_to_add["test_region"]["boxes"] = annotations[cur_img_name]["test_regions"]


            if ($("#annotation").is(":checked")) {
                boxes_to_add["annotation"] = {};
                boxes_to_add["annotation"]["boxes"] = annotations[cur_img_name]["boxes"];
            }

            if ($("#prediction").is(":checked")) {
                boxes_to_add["prediction"] = {};
                boxes_to_add["prediction"]["boxes"] = predictions[cur_img_name]["boxes"];
                boxes_to_add["prediction"]["scores"] = predictions[cur_img_name]["scores"];
            }

            let slider_val = Number.parseFloat($("#confidence_slider").val()); //.toFixed(2);
                
            let viewer_bounds = viewer.viewport.getBounds();
            let container_size = viewer.viewport.getContainerSize();

            let hw_ratio = overlay.imgHeight / overlay.imgWidth;
            let min_x = Math.floor(viewer_bounds.x * overlay.imgWidth);
            let min_y = Math.floor((viewer_bounds.y / hw_ratio) * overlay.imgHeight);
            let viewport_w = Math.ceil(viewer_bounds.width * overlay.imgWidth);
            let viewport_h = Math.ceil((viewer_bounds.height / hw_ratio) * overlay.imgHeight);
            let max_x = min_x + viewport_w;
            let max_y = min_y + viewport_h;

            overlay.context2d().font = "14px arial";

            //let hide_image = true;
            if (!($("#image_visible_switch").is(":checked"))) {
                let viewer_point_1 = viewer.viewport.imageToViewerElementCoordinates(
                    new OpenSeadragon.Point(0, 0));
                let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(
                        new OpenSeadragon.Point(overlay.imgWidth, overlay.imgHeight));
                        
                overlay.context2d().fillStyle = "#222621";         
                overlay.context2d().fillRect(
                    viewer_point_1.x,
                    viewer_point_1.y,
                    (viewer_point_2.x - viewer_point_1.x),
                    (viewer_point_2.y - viewer_point_1.y)
                );
            }


            let voronoi_keys = [];
            if ($("#voronoi_annotation").is(":checked")) {
                voronoi_keys.push("annotation");
            }
            if ($("#voronoi_prediction").is(":checked")) {
                voronoi_keys.push("prediction");
            }

            for (let key of voronoi_keys) {
                if (!(cur_img_name in voronoi_data)) {
                    voronoi_data[cur_img_name] = {};
                }
                if (!(key in voronoi_data[cur_img_name])) {
                    voronoi_data[cur_img_name][key] = compute_voronoi(key);
                }
                if (voronoi_data[cur_img_name][key] != null) {
                    let visible_edges = [];
                    for (let edge of voronoi_data[cur_img_name][key].edges) {


                        let line_box_min_x = Math.min(edge.va.x, edge.vb.x);
                        let line_box_min_y = Math.min(edge.va.y, edge.vb.y);
                        let line_box_max_x = Math.max(edge.va.x, edge.vb.x);
                        let line_box_max_y = Math.max(edge.va.y, edge.vb.y);
                        if (((line_box_min_x < max_x) && (line_box_max_x > min_x)) && ((line_box_min_y < max_y) && (line_box_max_y > min_y))) {
                            visible_edges.push(edge);
                        }
                
                    }
                    if (visible_edges.length < MAX_EDGES_DISPLAYED) {
                        for (let edge of visible_edges) {
                            overlay.context2d().strokeStyle = overlay_colors[key];
                            overlay.context2d().lineWidth = 2;
                    
                            let viewer_point_1 = viewer.viewport.imageToViewerElementCoordinates(
                                new OpenSeadragon.Point(edge.va.x, edge.va.y));
                            let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(
                                    new OpenSeadragon.Point(edge.vb.x, edge.vb.y));    
                    
                            overlay.context2d().beginPath();
                            overlay.context2d().moveTo(viewer_point_1.x, viewer_point_1.y);
                            overlay.context2d().lineTo(viewer_point_2.x, viewer_point_2.y);
                            overlay.context2d().closePath();
                            overlay.context2d().stroke();
                        }
                    }
                }
            }





            let draw_order = ["training_region", "test_region", "annotation", "prediction"];
            for (let key of draw_order) {

                if (!(key in boxes_to_add)) {
                    continue;
                }

                overlay.context2d().strokeStyle = overlay_colors[key];
                overlay.context2d().lineWidth = 2;
                let visible_inds = [];
                for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {

                    let box = boxes_to_add[key]["boxes"][i];
                    if (key === "prediction") {
                        let score = boxes_to_add[key]["scores"][i];
                        if (score < slider_val) {
                            continue;
                        }
                    }

                    //let box_width_pct_of_image = (box[3] - box[1]) / overlay.imgWidth;
                    //let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                    //let box_height_pct_of_image = (box[3] - box[1]) / overlay.imgHeight;
                    //let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;

                    // if ((disp_width * disp_height) < 0.5) {
                    //     continue;
                    // }

                    if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
                        
                        visible_inds.push(i);
                        
                        // let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                        // let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));

                        
                        // overlay.context2d().strokeRect(
                        //     viewer_point.x,
                        //     viewer_point.y,
                        //     (viewer_point_2.x - viewer_point.x),
                        //     (viewer_point_2.y - viewer_point.y)
                        // );
                    }
                }

                if (visible_inds.length < MAX_BOXES_DISPLAYED) {
                    for (let ind of visible_inds) {
                        let box = boxes_to_add[key]["boxes"][ind];
                        let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                        let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));

                        overlay.context2d().strokeRect(
                            viewer_point.x,// * container_size.x,
                            viewer_point.y,// * container_size.y,
                            (viewer_point_2.x - viewer_point.x),// * container_size.x,
                            (viewer_point_2.y - viewer_point.y)// * container_size.y
                        );
                    }





                    if ((key === "prediction") && ("prediction" in boxes_to_add) && ($("#scores_switch").is(":checked"))) {
                        for (let ind of visible_inds) {

                            let box = boxes_to_add[key]["boxes"][ind];
                            let score = boxes_to_add[key]["scores"][ind];

                            if (score < slider_val) {
                                continue;
                            }
                            
                            let box_width_pct_of_image = (box[3] - box[1]) / overlay.imgWidth;
                            let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                            let box_height_pct_of_image = (box[3] - box[1]) / overlay.imgHeight;
                            let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;
        
                            if ((disp_width * disp_height) < 10) {
                                continue;
                            }
        
                            if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
        
        
                                let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
        
                                let score_text = score.toFixed(2);
        
                                overlay.context2d().fillStyle = "white";
                                overlay.context2d().fillRect(
                                        viewer_point.x - 1,
                                        viewer_point.y - 20,
                                        36,
                                        20
                                    );
        
                                overlay.context2d().fillStyle = "black";
                                overlay.context2d().fillText(score_text, 
        
                                    viewer_point.x + 3,
                                    viewer_point.y - 5
                                );
                            }
                        }
                    }

                }
            }

            
            let navigation_type = $("#navigation_dropdown").val();
            if (navigation_type === "training_regions" || navigation_type === "test_regions") {

                let region = annotations[cur_img_name][navigation_type][cur_region_index];

                let image_px_width = metadata["images"][cur_img_name]["width_px"];
                let image_px_height = metadata["images"][cur_img_name]["height_px"];


                let rects = [
                    [0, 0, region[0], image_px_width],
                    [0, region[3], image_px_height, image_px_width],
                    [region[2], 0, image_px_height, image_px_width],
                    [0, 0, image_px_height, region[1]]

                ];
                
                overlay.context2d().fillStyle = "#222621";
                for (let rect of rects) {
                    let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(rect[1], rect[0]));
                    let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(rect[3], rect[2]));
                    
                    overlay.context2d().fillRect(
                        viewer_point.x,
                        viewer_point.y,
                        (viewer_point_2.x - viewer_point.x),
                        (viewer_point_2.y - viewer_point.y)
                    );
                }


                if (cur_bounds != null) {
                    viewer.world.getItemAt(0).setClip(
                        new OpenSeadragon.Rect(
                            region[1],
                            region[0],
                            (region[3] - region[1]),
                            (region[2] - region[0])
                        )
                    );

                    withFastOSDAnimation(viewer.viewport, function() {
                        viewer.viewport.fitBounds(cur_bounds);
                    });
                    cur_bounds = null;
                }
            }
        },
        clearBeforeRedraw: true
    });


    // anno = OpenSeadragon.Annotorious(viewer, {
    //     disableEditor: true,
    //     disableSelect: true,
    //     readOnly: true,
    //     formatter: formatter
    // });

    // viewer.addHandler("open", function(event) {

    //     let cur_status = annotations[cur_img_name]["status"];

    //     $("#image_name").text(cur_img_name);
    //     $("#image_status").text(status_to_text[cur_status]);

    //     update_overlays();
    //     update_count_chart();
    //     update_score_chart();

    // });

}


// function switch_to_voronoi() {
//     voronoi_data["show"] = true;
//     //overlay.onRedraw = redraw_voronoi;
//     viewer.raiseEvent("update-viewport");
// }

// function redraw_voronoi() {
//     console.log("voronoi_diagram", voronoi_diagram);

//     // let bounds_min_y;
//     // let bounds_min_x;
//     // let bounds_max_y;
//     // let bounds_max_x;

//     // let navigation_type = $("#navigation_dropdown").val();
//     // if (navigation_type === "training_regions" || navigation_type === "test_regions") {
//     //     let cur_region = annotations[cur_img_name][navigation_type][cur_region_index];
//     //     bounds_min_y = cur_region[0];
//     //     bounds_min_x = cur_region[1];
//     //     bounds_max_y = cur_region[2];
//     //     bounds_max_x = cur_region[3];
//     // }
//     // else {
//     //     bounds_min_y = 0;
//     //     bounds_min_x = 0;
//     //     bounds_max_y = metadata["images"][cur_img_name]["width_px"];
//     //     bounds_max_x = metadata["images"][cur_img_name]["height_px"];
//     // }

//     // let points = [];
//     // for (let predicted_box of predictions[cur_img_name]["boxes"]) {
//     //     let centre_y = (predicted_box[0] + predicted_box[2]) / 2;
//     //     let centre_x = (predicted_box[1] + predicted_box[3]) / 2;

//     //     if ((centre_y > bounds_min_y && centre_y < bounds_max_y) &&
//     //         (centre_x > bounds_min_x && centre_x < bounds_max_x)) {

//     //             let viewer_point = viewer.viewport.imageToViewerElementCoordinates(
//     //                 new OpenSeadragon.Point(centre_x, centre_y));
//     //             points.push(viewer_point);
//     //     }
//     // }
//     // console.log("points", points);
//     // for (let i = 1; i < points.length; i++) {
//     //     overlay.context2d().beginPath();
//     //     overlay.context2d().moveTo(points[i-1].x, points[i-1].y);
//     //     overlay.context2d().lineTo(points[i].x, points[i].y);
//     //     overlay.context2d().closePath();
//     //     overlay.context2d().stroke();
//     // }

//     for (let edge of voronoi_diagram.edges) {
//         overlay.context2d().strokeStyle = "red"; //overlay_colors[key];
//         overlay.context2d().lineWidth = 2;

//         let viewer_point_1 = viewer.viewport.imageToViewerElementCoordinates(
//             new OpenSeadragon.Point(edge.va.x, edge.va.y));
//         let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(
//                 new OpenSeadragon.Point(edge.vb.x, edge.vb.y));    

//         overlay.context2d().beginPath();
//         overlay.context2d().moveTo(viewer_point_1.x, viewer_point_1.y);
//         overlay.context2d().lineTo(viewer_point_2.x, viewer_point_2.y);
//         overlay.context2d().closePath();
//         overlay.context2d().stroke();

//     }


// }


function set_heights() {
    let max_height = 0;
    for (let image_name of Object.keys(annotations)) {
        $("#image_name").html(image_name);
        let table_height = $("#image_name_table").height();
        console.log("table_height", table_height);
        if (table_height > max_height) {
            max_height = table_height;
        };
    }
    console.log("max_height", max_height);
    $("#image_name_table").height(max_height);
    $("#navigation_table_container").height(523 - max_height);
    //$("#navigation_table_container").height(550 - max_height);
}




$(document).ready(function() {
    
    image_set_info = data["image_set_info"];
    //job_config = data["job_config"];
    //overlays = data["overlays"];
    excess_green_record = data["excess_green_record"];
    annotations = data["annotations"];
    predictions = data["predictions"];
    metadata = data["metadata"];
    camera_specs = data["camera_specs"];
    metrics = data["metrics"];
    //dzi_dir = data["dzi_dir"];
    dzi_image_paths = data["dzi_image_paths"];


    // for (let image_status of Object.keys(status_color)) {
    //     let color = status_color[image_status];
    //     let text = status_to_text[image_status];
    //     $("#filter_combo").append(`<option style="background-color: ${color}" value="${image_status}">${text}</option>`);
    // }



    $("#request_spreadsheet_button").click(function() {

        let farm_name = image_set_info["farm_name"];
        let field_name = image_set_info["field_name"];
        let mission_date = image_set_info["mission_date"];
        let timestamp = image_set_info["timestamp"];

        show_modal_message("Preparing Download", 
        `<div style="height: 50px">` +
            `<div id="prep_spreadsheet_message">Preparing spreadsheet...</div>` +
            `<div id="prep_spreadsheet_loader" class="loader"></div>` +
            `<div style="text-align: center; margin-top: 20px"><a class="table_button table_button_hover" id="download_button" style="padding: 10px; border-radius: 30px" hidden>` +
                `<i class="fa-solid fa-file-arrow-down"></i><span style="margin-left: 10px">Download Results</span></a>` +
            `</div>` +
        `</div>`);

        $("#modal_close").hide();

        $.post($(location).attr('href'),
        {
            action: "create_spreadsheet",
            download_uuid: download_uuid,
            annotation_version: $("#annotation_version_combo").val()
        },
        
        function(response, status) {
            $("#prep_spreadsheet_loader").hide();
            $("#modal_close").show();

            if (response.error) {
                $("#modal_head_text").html("Error");
                $("#prep_spreadsheet_message").html("An error occurred while generating the results file.");

            }
            else {
                $("#modal_head_text").html("Ready For Download");
                $("#prep_spreadsheet_message").html("Your results file has been created. Click the button to download the results.");
                $("#download_button").show();
    
                download_uuid = response.download_uuid;

                let download_path = get_CC_PATH() + "/download/" + 
                                    username + "/" +
                                    farm_name + "/" + 
                                    field_name + "/" + 
                                    mission_date + "/" +
                                    timestamp + "/" + 
                                    download_uuid;


                $("#download_button").attr("href", download_path);


                let close_timeout_handler = setTimeout(function() {
                    $("#modal_close").click();
                }, 3600 * 1000);

                $("#modal_close").click(function() {
                    clearTimeout(close_timeout_handler);
                    close_modal();
                });

            }

        });
    })


    $("#result_name").text(data["request"]["results_name"]);

    let farm_name = image_set_info["farm_name"];
    let field_name = image_set_info["field_name"];
    let mission_date = image_set_info["mission_date"];

    image_to_dzi = {};
    for (let dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path);
        let extensionless_name = image_name.substring(0, image_name.length - 4);
        image_to_dzi[extensionless_name] = dzi_image_path;
    }
    let init_image_name = basename(dzi_image_paths[0]);
    cur_img_name = init_image_name.substring(0, init_image_name.length - 4);
    cur_region_index = -1;
    console.log("cur_img_name", cur_img_name);

    disable_std_buttons(["prev_image_button"]);
    if (dzi_image_paths.length == 1) {
        disable_std_buttons(["next_image_button"]);
    }

    $("#image_set_name").text(farm_name + "  |  " + 
                              field_name + "  |  " + 
                              mission_date);

    update_count_combo(true);

    // $('#chart_combo').append($('<option>', {
    //     value: "PASCAL VOC mAP",
    //     text: "PASCAL VOC mAP"
    // }));
    // $('#chart_combo').append($('<option>', {
    //     value: "Ground Cover Percentage",
    //     text: "Ground Cover Percentage"
    // }));


    cur_view = "image";

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
    


    //let img_files_name = basename(dzi_image_paths[0]);
    //cur_img_name = img_files_name.substring(0, img_files_name.length - 4);

    //assemble_datasets();
    // overlay_initialization();
    //set_prediction_overlay_color();
    //create_image_set_table(); //dataset_images["all"]);
    //create_image_set_table();
    create_navigation_table();
    update_navigation_dropdown();
    
    create_overlays_table();
    set_count_chart_data();
    set_score_chart_data();
    draw_count_chart();
    draw_score_chart();

    show_image(cur_img_name);

    //create_viewer_and_anno();

    //show_image();


    $("#overlays_table").change(function() {
        console.log("overlay change");
        viewer.raiseEvent('update-viewport');
    });


    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#slider_val").html(slider_val);
        
        if (cur_img_name in voronoi_data && "prediction" in voronoi_data[cur_img_name]) {
            delete voronoi_data[cur_img_name]["prediction"];
        }
        viewer.raiseEvent('update-viewport');
        set_count_chart_data();
        update_count_chart();
        update_score_chart();
        
    });

    $("#confidence_slider").on("input", function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#slider_val").html(slider_val);
    });

    $("#scores_switch").change(function() {
        viewer.raiseEvent('update-viewport');
    });

    $("#chart_combo").change(function() {
        set_count_chart_data();
        update_count_chart();
    });

    /*
    $("#filter_combo").change(function() {
        $("#filter_combo").css("background-color", status_color[$("#filter_combo").val()]);
        create_image_set_table();
        if (cur_img_list.length > 0) {
            $("#image_set_table_container").scrollTop(0);
            $("#right_panel").show();
            $("#image_navigation_buttons").show();
            // disable_std_buttons(["prev_image_button"]);
            // if (cur_img_list.length == 1) {
            //     disable_std_buttons(["next_image_button"]);
            // }
            change_image(cur_img_list[0]);
        }
        else {
            $("#image_name").text("");
            $("#image_status").text("");
            $("#seadragon_viewer").empty();
            $("#right_panel").hide();
            $("#image_navigation_buttons").hide();
        }
    });
    */



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

    $("#next_image_button").click(function() {
        let cur_nav_item = cur_img_name + "/" + cur_region_index;
        let index = cur_nav_list.findIndex(x => x == cur_nav_item) + 1;
        change_image(cur_nav_list[index]);
    });

    $("#prev_image_button").click(function() {
        let cur_nav_item = cur_img_name + "/" + cur_region_index;
        let index = cur_nav_list.findIndex(x => x == cur_nav_item) - 1;
        change_image(cur_nav_list[index]);
    });


    $("#annotation_version_combo").change(function() {
        let version = $("#annotation_version_combo").val();

        show_modal_message("Please Wait", 
        `<div id="switch_anno_message">Switching annotation versions. This may take a few minutes.</div><div style="height: 10px"></div><div id="switch_anno_loader" class="loader"></div>`);

        $("#modal_close").hide();

        // a(class="table_button table_button_hover" style="padding: 5px 10px;" id="download_button" download)
        //     i(class="fa fa-download fa-sm")
        //     span(style="margin-left: 10px") Download Results 

        download_uuid = "";
        $.post($(location).attr('href'),
        {
            action: "switch_annotation_version",
            // username: username,
            // farm_name: farm_name,
            // field_name: field_name,
            // mission_date: mission_date,
            // results_timestamp: timestamp,
            annotation_version: version
        },
        
        function(response, status) {
            if (response.error) {
                show_modal_message("Error", "An error occurred while switching annotation versions.");
                if (version === "most_recent") {
                    $("#annotation_version_combo").val("preserved");
                }
                else {
                    $("#annotation_version_combo").val("most_recent");
                }
            }
            else {
                annotations = response["annotations"];
                metrics = response["metrics"];
                excess_green_record = response["excess_green_record"];
                download_uuid = response["download_uuid"];

                //$("#filter_combo").val("all");

                $("#chart_container").empty();
                $("#interpolation_linear").prop("checked", true);
                $("#pred_image_status_all").prop("checked", true);


                $("#filter_combo").val("all").change();
                //create_image_set_table();
                //create_overlays_table();
                set_count_chart_data();
                set_score_chart_data();
                // update_count_chart();
                // update_score_chart();

                if (cur_img_name in voronoi_data && "annotation" in voronoi_data[cur_img_name]) {
                    delete voronoi_data[cur_img_name]["annotation"];
                }
            
                // $("#seadragon_viewer").empty();
                // create_viewer_and_anno();

                let init_image_name = basename(dzi_image_paths[0]);
                //cur_img_name = init_image_name.substring(0, init_image_name.length - 4);
                change_image(init_image_name.substring(0, init_image_name.length - 4) + "/-1");

                $("#modal_close").click();
            }


        });
    });


    $("#navigation_dropdown").change(function() {
        create_navigation_table();
        update_count_combo(true);

        let navigation_type = $("#navigation_dropdown").val();
        console.log("navigation_type", navigation_type);
        change_image(cur_nav_list[0]);
    });

    $("#image_visible_switch").change(function() {
        viewer.raiseEvent('update-viewport');
    });




});

