

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
let tags;
//let download_uuid = "";
let overlay_appearance;
/*
let sorted_overlay_names;
let sorted_overlay_ids;
let overlay_colors;*/
let dataset_images;
//let used_for = {};
let image_to_dzi;


let show_bookmarks = false;
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
// let pred_map_url = null;
let min_max_rec = null;

let voronoi_data = {
    "annotation": null,
    "prediction": null
};

let gsd = null;


function show_metrics_modal() {

    let metric_definitions_url = get_CC_PATH() + "/usr/shared/metric_definitions.svg";
    show_modal_message(`Metric Definitions`, 
    `<div class="scrollable_area" style="height: 400px">` +
        `<img src="${metric_definitions_url}"></img>` +
    `</div>`

    // `<table>` +
    //     `<tr>` +
    //         `<td>` +
    //             `<div style="width: 220px">Percent Count Error</div>` +
    //         `</td>` +
    //         `<td>` +
    //             `<div>$a \ne 0$</div>` +
    //             //`<div><math>( ( | (Predicted Count) - (Annotated Count) | ) / (Annotated Count) ) * 100</math></div>` + //( ( | (Predicted Count) - (Annotated Count) | ) / (Annotated Count) ) * 100`);
    //         `</td>` +
    //     `</tr>` +
    // `</table>`
    , 707);
}


function change_image(cur_nav_item) {


    document.getElementById(cur_nav_item + "_row").scrollIntoView({behavior: "smooth"});

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

    update_region_name();
    // $("#region_name").empty();
    // if (navigation_type === "training_regions" || navigation_type === "test_regions") {

    //     let disp_region_index = cur_region_index + 1;
    //     let region_color;
    //     if (navigation_type === "training_regions") {
    //         region_color = overlay_appearance["colors"]["training_region"];
    //     }
    //     else {
    //         region_color = overlay_appearance["colors"]["test_region"];
    //     }

    //     $("#region_name").append(
    //         `<div style="width: 75px; background-color: ${region_color}; margin: 0px 2px; color: black; border: none" class="object_entry">` +
    //         `Region ` + disp_region_index +
    //         `</div>`
    //     );
    // }

    if (viewer == null) {
        create_viewer("seadragon_viewer");
    }

    //compute_voronoi();

    let dzi_image_path = image_to_dzi[cur_img_name];
    viewer.open(dzi_image_path);

    update_count_combo(true);
    //update_count_combo(true);

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




// function fetch_map() {
    
//     let sel_interpolation = $("input[name=interpolation_radio]:checked").val();
//     console.log("fetch_map", sel_interpolation);
//     let timestamp = new Date().getTime();
            
//     let base = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
//                 image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/model/results/" +
//                 image_set_info["result_uuid"] + "/maps/" + sel_interpolation;

//     map_url = base + "_predicted_map.svg?t=" + timestamp;

//     let min_max_rec_url = base + "_min_max_rec.json?t=" + timestamp;

//     $.getJSON(min_max_rec_url, function(data) {
//         min_max_rec = data;
//         draw_map_chart();
//     });
// }

function build_map() {
    disable_buttons(["build_map_button"]);
    $("#build_loader").show();
    
    let sel_interpolation = $("input[name=interpolation_radio]:checked").val();


    let interpolated_value = "obj_density";

    if (metadata["is_ortho"] === "yes") {
        map_chart_tile_size = $("#tile_size_slider").val();
    }
    else {
        map_chart_tile_size = "";
        interpolated_value = $("input[name=interpolated_value_radio]:checked").val();
    }

    $.post($(location).attr('href'),
    {
        action: "build_map",
        interpolation: sel_interpolation,
        interpolated_value: interpolated_value,
        tile_size: map_chart_tile_size
    },
    
    function(response, status) {
        $("#build_loader").hide();
        enable_buttons(["build_map_button"]);

        if (response.error) {
            show_modal_message("Error", "An error occurred during the generation of the density map.")
        }
        else {
            
            let timestamp = new Date().getTime();   
            
            let base = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
                    image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/model/results/" +
                    image_set_info["result_uuid"] + "/maps/" + sel_interpolation;

            map_url = base + "_predicted_map.svg?t=" + timestamp;

            let min_max_rec_url = base + "_min_max_rec.json?t=" + timestamp;

            $.getJSON(min_max_rec_url, function(data) {
                min_max_rec = data;
                draw_map_chart();
            });
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

    draw_map_chart();



    // let num_completed = 0;
    // for (let image_name of Object.keys(annotations)) {

    //     let image_width_px = metadata["images"][image_name]["width_px"];
    //     let image_height_px = metadata["images"][image_name]["height_px"];

    //     if (image_is_fully_annotated(annotations, image_name, image_width_px, image_height_px)) {
    //         num_completed++;
    //     }
    // }
    // if (num_completed >= 3) {
    //     $("#sufficient_annotation_options").show();
    // }
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

    //set_heights();
    change_image(image_name + "/" + cur_region_index);
    
}







function create_viewer() {

    viewer = OpenSeadragon({
        id: "seadragon_viewer",
        sequenceMode: true,
        prefixUrl: get_CC_PATH() + "/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 1000,
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

            let navigation_type = $("#navigation_dropdown").val();
        
            let boxes_to_add = {};
            boxes_to_add["region_of_interest"] = {};
            boxes_to_add["region_of_interest"]["boxes"] = annotations[cur_img_name]["regions_of_interest"];
            boxes_to_add["region_of_interest"] = {};
            boxes_to_add["region_of_interest"]["boxes"] = annotations[cur_img_name]["regions_of_interest"];
            boxes_to_add["training_region"] = {};
            boxes_to_add["training_region"]["boxes"] = annotations[cur_img_name]["training_regions"];
            boxes_to_add["test_region"] = {};
            boxes_to_add["test_region"]["boxes"] = annotations[cur_img_name]["test_regions"]


            if ($("#annotation").is(":checked")) {
                boxes_to_add["annotation"] = {};
                boxes_to_add["annotation"]["boxes"] = annotations[cur_img_name]["boxes"];
            }

            if ((cur_img_name in predictions) && ($("#prediction").is(":checked"))) {
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

            if (cur_region_index != -1) {

                let cur_region = annotations[cur_img_name][navigation_type][cur_region_index];
                if (navigation_type == "regions_of_interest") {
                    cur_region = get_bounding_box_for_polygon(cur_region);
                }
                min_y = Math.max(min_y, cur_region[0]);
                min_x = Math.max(min_x, cur_region[1]);
                max_y = Math.min(max_y, cur_region[2]);
                max_x = Math.min(max_x, cur_region[3]);
            }

            overlay.context2d().font = "14px arial";

            //let hide_image = true;
            if (!($("#image_visible_switch").is(":checked"))) {
                let viewer_point_1 = viewer.viewport.imageToViewerElementCoordinates(
                    new OpenSeadragon.Point(0, 0));
                let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(
                        new OpenSeadragon.Point(overlay.imgWidth, overlay.imgHeight));
                        
                overlay.context2d().fillStyle = "#222621";         
                overlay.context2d().fillRect(
                    viewer_point_1.x - 10,
                    viewer_point_1.y - 10,
                    (viewer_point_2.x - viewer_point_1.x) + 20, //2,
                    (viewer_point_2.y - viewer_point_1.y) + 20//2
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
                    if (visible_edges.length <= MAX_EDGES_DISPLAYED) {
                        for (let edge of visible_edges) {
                            overlay.context2d().strokeStyle = overlay_appearance["colors"][key];
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





            let draw_order = overlay_appearance["draw_order"]; // ["training_region", "test_region", "prediction", "annotation"]; //, "prediction"];
            for (let key of draw_order) {

                if (!(key in boxes_to_add)) {
                    continue;
                }

                overlay.context2d().strokeStyle = overlay_appearance["colors"][key];
                overlay.context2d().fillStyle = overlay_appearance["colors"][key] + "55";
                overlay.context2d().lineWidth = 2;


                if (key === "region_of_interest") {

                    for (let i = 0; i < boxes_to_add["region_of_interest"]["boxes"].length; i++) {

                        let region = boxes_to_add["region_of_interest"]["boxes"][i];
                        overlay.context2d().beginPath();
                        for (let j = 0; j < region.length; j++) {
                            let pt = region[j];
                
                            let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(pt[1], pt[0]));
                            
                            if (j == 0) {
                                overlay.context2d().moveTo(viewer_point.x, viewer_point.y);
                            }
                            else {
                                overlay.context2d().lineTo(viewer_point.x, viewer_point.y);
                            }
                        }

                
                        overlay.context2d().closePath();
                        overlay.context2d().stroke();
                        if (overlay_appearance["style"][key] == "fillRect") {
                            overlay.context2d().fill();
                        }
                
                    }
                }
                else {







                    let visible_inds = [];

                    for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {

                        let box = boxes_to_add[key]["boxes"][i];
                        if (key === "prediction") {
                            let score = boxes_to_add[key]["scores"][i];
                            if (score <= slider_val) {
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

                    if (visible_inds.length <= MAX_BOXES_DISPLAYED) {
                        for (let ind of visible_inds) {
                            let box = boxes_to_add[key]["boxes"][ind];
                            let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                            let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));

                            
                            //if (overlay_appearance["style"][key] == "strokeRect") {
                            overlay.context2d().strokeRect(
                                viewer_point.x,// * container_size.x,
                                viewer_point.y,// * container_size.y,
                                (viewer_point_2.x - viewer_point.x),// * container_size.x,
                                (viewer_point_2.y - viewer_point.y)// * container_size.y
                            );
                            //}
                            if (overlay_appearance["style"][key] == "fillRect") {
                                overlay.context2d().fillRect(
                                    viewer_point.x,// * container_size.x,
                                    viewer_point.y,// * container_size.y,
                                    (viewer_point_2.x - viewer_point.x),// * container_size.x,
                                    (viewer_point_2.y - viewer_point.y)// * container_size.y
                                );
                            }
                            //overlay.context2d().strokeRect(
                            // draw_func(
                            //     viewer_point.x,// * container_size.x,
                            //     viewer_point.y,// * container_size.y,
                            //     (viewer_point_2.x - viewer_point.x),// * container_size.x,
                            //     (viewer_point_2.y - viewer_point.y)// * container_size.y
                            // );
                        }





                        if ((key === "prediction") && ("prediction" in boxes_to_add) && ($("#scores_switch").is(":checked"))) {
                            for (let ind of visible_inds) {

                                let box = boxes_to_add[key]["boxes"][ind];
                                let score = boxes_to_add[key]["scores"][ind];

                                // if (score < slider_val) {
                                //     continue;
                                // }
                                
                                let box_width_pct_of_image = (box[3] - box[1]) / overlay.imgWidth;
                                let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                                let box_height_pct_of_image = (box[3] - box[1]) / overlay.imgHeight;
                                let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;
            
                                if ((disp_width * disp_height) < 10) {
                                    continue;
                                }
            
                                if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
            
            
                                    let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
            
                                    //let score_text = score.toFixed(2);
                                    let score_text = (Math.ceil(score * 100) / 100).toFixed(2);
            
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
            }

            if ((navigation_type === "regions_of_interest") || (navigation_type === "training_regions" || navigation_type === "test_regions")) {

                let region = annotations[cur_img_name][navigation_type][cur_region_index];
                let image_px_width = metadata["images"][cur_img_name]["width_px"];
                let image_px_height = metadata["images"][cur_img_name]["height_px"];
        
                let inner_poly;
                let outer_poly = [
                    [0-1e6, 0-1e6], 
                    [0-1e6, image_px_width+1e6], 
                    [image_px_height+1e6, image_px_width+1e6],
                    [image_px_height+1e6, 0-1e6]
                ];
        
                if (navigation_type === "regions_of_interest") {
                    inner_poly = region;
                }
                else { 
                    inner_poly = [
                        [region[0], region[1]],
                        [region[0], region[3]],
                        [region[2], region[3]],
                        [region[2], region[1]]
                    ];
                }
        
                overlay.context2d().fillStyle = "#222621";
                overlay.context2d().beginPath();
        
                for (let poly of [outer_poly, inner_poly]) {
        
                    for (let i = 0; i < poly.length+1; i++) {
                        let pt = poly[(i)%poly.length];
                        let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(pt[1], pt[0]));
        
                        if (i == 0) {
                            overlay.context2d().moveTo(viewer_point.x, viewer_point.y);
                        }
                        else {
                            overlay.context2d().lineTo(viewer_point.x, viewer_point.y);
                        }
                    }
                    overlay.context2d().closePath();
        
                }
                overlay.context2d().mozFillRule = "evenodd";
                overlay.context2d().fill("evenodd");
            }
            if (cur_bounds != null) {

                if ((navigation_type === "regions_of_interest") || (navigation_type === "training_regions" || navigation_type === "test_regions")) {

                    let region = annotations[cur_img_name][navigation_type][cur_region_index];
        
                    if (navigation_type === "regions_of_interest") {
                        region = get_bounding_box_for_polygon(region);
                    }
        
                    viewer.world.getItemAt(0).setClip(
                        new OpenSeadragon.Rect(
                            region[1],
                            region[0],
                            (region[3] - region[1]),
                            (region[2] - region[0])
                        )
                    );
                }

                withFastOSDAnimation(viewer.viewport, function() {
                    viewer.viewport.fitBounds(cur_bounds);
                });
                cur_bounds = null;
            }
            
            if (gsd !== null) {
                let cur_zoom = viewer.viewport.viewportToImageZoom(viewer.viewport.getZoom(true));
                let measure_width = Math.max(50, 0.08 * container_size.x); //Math.min(100, 0)
                let measure_width_m = (gsd / cur_zoom) * measure_width;
                let unit;
                let measure_width_metric;
                if (measure_width_m < 1) {
                    measure_width_metric = measure_width_m * 100;
                    unit = "cm";
                }
                else {
                    measure_width_metric = measure_width_m;
                    unit = "m";
                }
                let measure_width_text = (Math.ceil(measure_width_metric * 100) / 100).toFixed(2) + " " + unit;


                overlay.context2d().fillStyle = "rgb(255, 255, 255, 0.7)";
                overlay.context2d().fillRect(
                    container_size.x - measure_width - 20,
                    container_size.y - 30,
                    measure_width + 20,
                    30
                );
                overlay.context2d().fillStyle = "black";
                overlay.context2d().fillRect(
                    container_size.x - measure_width - 10,
                    container_size.y - 8,
                    measure_width,
                    2
                );
                overlay.context2d().fillRect(
                    container_size.x - measure_width - 10,
                    container_size.y - 10,
                    1,
                    4
                );
                overlay.context2d().fillRect(
                    container_size.x - 10,
                    container_size.y - 10,
                    1,
                    4
                );

                overlay.context2d().fillText(measure_width_text, 
                    container_size.x - measure_width - 10,
                    container_size.y - 15
                );
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



// function set_heights() {
//     let max_height = 0;
//     for (let image_name of Object.keys(annotations)) {
//         $("#image_name").html(image_name);
//         let table_height = $("#image_name_table").height();
//         if (table_height > max_height) {
//             max_height = table_height;
//         };
//     }
//     $("#image_name_table").height(max_height);
//     $("#navigation_table_container").height(523 - max_height);
//     //$("#navigation_table_container").height(550 - max_height);
// }

function resize_window() {
    //console.log("resize");
    let new_viewer_height = window.innerHeight - $("#header_table").height() - 100;
    //console.log(new_viewer_height);
    $("#seadragon_viewer").height(new_viewer_height);
    $("#chart_container").height(new_viewer_height);
    let image_name_table_height = $("#image_name_table").height();
    let result_name_height = $("#result_name").height();
    //console.log(image_name_table_height);
    let new_navigation_table_container_height = new_viewer_height - image_name_table_height - result_name_height - 205; //175; //195;

    //console.log(new_navigation_table_container_height);
    let min_navigation_table_height = 510;
    if (new_navigation_table_container_height < min_navigation_table_height) {
        new_navigation_table_container_height = min_navigation_table_height;
    }
    $("#navigation_table_container").height(new_navigation_table_container_height);
}



function show_download_metrics() {

    $("#metrics_tab").addClass("tab-btn-active");
    $("#raw_outputs_tab").removeClass("tab-btn-active");
    $("#areas_tab").removeClass("tab-btn-active");

    let metrics_download_path = get_CC_PATH() + 
                                "/usr/data/" + 
                                username + 
                                "/image_sets/" + 
                                image_set_info["farm_name"] + "/" + 
                                image_set_info["field_name"] + "/" + 
                                image_set_info["mission_date"] + 
                                "/model/results/" + 
                                image_set_info["result_uuid"] + 
                                "/metrics.xlsx";

    $("#download_info_area").empty();
    $("#download_button_area").empty();

    let download_list;
    if ("regions_only" in request && request["regions_only"]) {
        download_list = 
        `<ul style="list-style-type: none; margin: 0px; padding: 0px">` +
            `<li><div style="display: inline-block; width: 100px"><em>Regions</em></div>Metrics for regions. Each row contains metrics for one region in the image set.</li>` +
            `<div style="height: 25px"></div>` +
            `<li><div style="display: inline-block; width: 100px"><em>Stats</em></div>Summary statistics for the entire image set.</li>` +
        `</ul>`;
    }
    else {
        download_list = 
        `<ul style="list-style-type: none; margin: 0px; padding: 0px">` +
            `<li><div style="display: inline-block; width: 100px"><em>Images</em></div>Metrics for images. Each row contains metrics for one image in the image set.</li>` +
            `<div style="height: 25px"></div>` +
            `<li><div style="display: inline-block; width: 100px"><em>Regions</em></div>Metrics for regions. Each row contains metrics for one region in the image set.</li>` +
            `<div style="height: 25px"></div>` +
            `<li><div style="display: inline-block; width: 100px"><em>Stats</em></div>Summary statistics for the entire image set.</li>` +
        `</ul>`;
    }

    $("#download_info_area").append(

        // `<table>` +
            // `<tr style="width: 100%"></td>` +

            // `<tr>` +
        `<table>` +
            `<tr>` +
                `<td>` +
                    `<div style="height: 70px"></div>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td>` +
                    `<div>An <em>.xlsx</em> file containing metrics is available for download. This file contains the following sheets:</div>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td>` +
                    `<div style="height: 35px"></div>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td>` +
                    download_list +
                `</td>` +
            `</tr>` +
            // `<tr>` +
            //     `<td>` +
            //         `<div style="height: 30px"></div>` +
            //     `</td>` +
            // `</tr>` +
            // `<tr>` +
            //     `<td>` +
            //         `<div style="text-align: center">` +
            //             `<a class="std-button std-button-hover" style="width: 250px;" href="${metrics_download_path}" download="metrics.xlsx">Download Metrics</a>` +
            //         `</div>` +
            //     `</td>` +
            // `</tr>` +


        `</table>`




            // `</tr>` +

            // `<tr style="width: 100%"></td>` +

        // `</table>`

        // `<div style="margin: 0 auto">` +
        //     `<div>An <em>.xlsx</em> file containing metrics is available for download. This file contains three sheets:` +
        //     `</div>` +
        //     `<div style="height: 10px"></div>` +
        //     `<ul>` +
        //     `<li><div style="display: inline-block; width: 80px"><em>Images:</em></div>Metrics for images. Each row contains metrics for one image in the image set.</li>` +
        //     `<br>` +
        //     `<li><div style="display: inline-block; width: 80px"><em>Regions:</em></div>Metrics for regions. Each row contains metrics for one region in the image set.</li>` +
        //     `<br>` +
        //     `<li><div style="display: inline-block; width: 80px"><em>Stats:</em></div>Summary statistics for the entire image set.</li>` +
        //     `</ul>` +

        //     `<div style="height: 10px"></div>` +
        //     `<div style="text-align: center">` +
        //         `<a class="std-button std-button-hover" style="width: 250px;" href="${metrics_download_path}" download="metrics.xlsx">Download Metrics</a>` +
        //     `</div>` +
        // `</div>`

    );

    $("#download_button_area").append(
        `<div style="text-align: center">` +
            `<a class="std-button std-button-hover" style="width: 280px;" href="${metrics_download_path}" download="metrics.xlsx">` +
            `<i class="fa-solid fa-file-arrow-down" style="padding-right: 15px"></i>Download Metrics</a>` +
        `</div>`
    );
}


function show_download_areas() {

    $("#metrics_tab").removeClass("tab-btn-active");
    $("#raw_outputs_tab").removeClass("tab-btn-active");
    $("#areas_tab").addClass("tab-btn-active");

    let areas_download_path = get_CC_PATH() + 
                                "/usr/data/" + 
                                username + 
                                "/image_sets/" + 
                                image_set_info["farm_name"] + "/" + 
                                image_set_info["field_name"] + "/" + 
                                image_set_info["mission_date"] + 
                                "/model/results/" + 
                                image_set_info["result_uuid"] + 
                                "/areas.xlsx";

    
    $("#download_info_area").empty();
    $("#download_button_area").empty();

    let image_object_areas_entry;
    let image_voronoi_areas_entry;
    let voronoi_notice;
    if ("regions_only" in request && request["regions_only"]) {
        image_object_areas_entry = ``;
        image_voronoi_areas_entry = ``;
        voronoi_notice = `For the Voronoi area sheets, only the Voronoi areas that do not touch the boundaries of the regions are included.`;
    }
    else {
        image_object_areas_entry = 
        `<tr>` +
            `<td>` +
                `<div style="width: 200px"><em>Image Object Areas</em></div>` +
            `</td>` +
            `<td>` +
                `<div>This sheet contains the areas of the predicted bounding boxes (in square metres) for each image.</div>` +
            `</td>` +
        `</tr>`;
        image_voronoi_areas_entry =
        `<tr>` +
            `<td>` +
                `<div style="width: 200px"><em>Image Voronoi Areas</em></div>` +
            `</td>` +
            `<td>` +
                `<div>Voronoi partitions are constructed from the predicted bounding boxes of each image. This sheet contains the areas from the Voronoi partitions (in square metres).</div>` +
            `</td>` +
        `</tr>`;

        voronoi_notice = `For the Voronoi area sheets, only the Voronoi areas that do not touch the boundaries of the images / regions are included.`;
    }
    $("#download_info_area").append(
        `<table>` +
            `<tr>` +
                `<td>` +
                    `<div style="height: 20px"></div>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td style="width: 800px">` +
                    `<div>An <em>.xlsx</em> file is available for download. The file contains the following sheets:</div>` +
                    `<div style="height: 10px"></div>` +
                    `<table style="border-spacing: 0px 30px">` +
                        image_object_areas_entry + 
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 200px"><em>Region Object Areas</em></div>` +
                            `</td>` +
                            `<td>` +
                                `<div>This sheet contains the areas of the predicted bounding boxes (in square metres) for each region.</div>` +
                            `</td>` +
                        `</tr>` +
                        image_voronoi_areas_entry + 
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 200px"><em>Region Voronoi Areas</em></div>` +
                            `</td>` +
                            `<td>` +
                                `<div>Voronoi partitions are constructed from the predicted bounding boxes of each region. This sheet contains the areas from the Voronoi partitions (in square metres).</div>` +
                            `</td>` +
                        `</tr>` +


                    `</table>` +
                    
                    // `<ul>` + 
                    //     `<li><div style="display: inline-block; width: 170px"><em>Image Object Areas:</em></div>This sheet contains the areas of the predicted bounding boxes (in square metres) for each image.</li>` +
                    //     `<br>` +
                    //     `<li><div style="display: inline-block; width: 170px"><em>Region Object Areas:</em></div>This sheet contains the areas of the predicted bounding boxes (in square metres) for each region.</li>` +
                    //     `<br>` +
                    //     `<li><div style="display: inline-block; width: 170px"><em>Image Voronoi Areas:</em></div>Voronoi partitions are constructed from the predicted bounding boxes of each image. This sheet contains the areas from the Voronoi partitions (in square metres).</li>` +                        
                    //     `<br>` +
                    //     `<li><div style="display: inline-block; width: 170px"><em>Region Voronoi Areas:</em></div>Voronoi partitions are constructed from the predicted bounding boxes of each region. This sheet contains the areas from the Voronoi partitions (in square metres).</li>` +        
                    
                    //     // `<li>"Voronoi areas" are the area values (in square metres) assigned to each object within an image / region according to a Voronoi partition.</li>` +
                    //     // `<br>` +
                    //     // `<li> A polygon must be fully contained within the boundaries of the image / region for it to be included (this is done to avoid edge effects).</li>` +
                    //     // `<br>` +
                    //     // `<li>The <em>.xlsx</em> file contains two sheets. The first sheet lists the Voronoi areas within each image (each image is a separate column).` +
                    //     //     `The second sheet lists the Voronoi areas within each region (each region is a separate column).</li>` +
                    // `</ul>` +
                    `<div style="height: 10px"></div>` +
                    `<ul>` +
                        `<li><em>Note</em>: ${voronoi_notice}</li>` +
                    `</ul>` +
                    //`<div><em>Note</em>: For the Voronoi area sheets, only the Voronoi areas that do not touch any boundaries of the image / region are included.</div>` +
                `</td>` +
            `</tr>` +
            // `<tr>` +
            //     `<td>` +
            //         `<div style="height: 30px"></div>` +
            //     `</td>` +
            // `</tr>` +
            // `<tr>` +
            //     `<td>` +
            //         `<div style="text-align: center">` +
            //             `<a class="std-button std-button-hover" style="width: 300px;" href="${voronoi_areas_download_path}" download="voronoi_areas.xlsx">Download Voronoi Areas</a>` +
            //         `</div>` +
            //     `</td>` +
            // `</tr>` +


        `</table>`
    );

    $("#download_button_area").append(
        `<div style="text-align: center">` +
            `<a class="std-button std-button-hover" style="width: 280px;" href="${areas_download_path}" download="areas.xlsx">` +
            `<i class="fa-solid fa-file-arrow-down" style="padding-right: 15px"></i>Download Areas</a>` +
        `</div>`
    );
}


function show_download_raw_outputs() {

    $("#metrics_tab").removeClass("tab-btn-active");
    $("#raw_outputs_tab").addClass("tab-btn-active");
    $("#areas_tab").removeClass("tab-btn-active");

    let raw_outputs_download_path = get_CC_PATH() + 
                                "/usr/data/" + 
                                username + 
                                "/image_sets/" + 
                                image_set_info["farm_name"] + "/" + 
                                image_set_info["field_name"] + "/" + 
                                image_set_info["mission_date"] + 
                                "/model/results/" + 
                                image_set_info["result_uuid"] + 
                                "/raw_outputs.zip";

    
    $("#download_info_area").empty();
    $("#download_button_area").empty();
    $("#download_info_area").append(
        `<table>` +
            `<tr>` +
                `<td>` +
                    `<div style="height: 5px"></div>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td>` +
                    `<div>A <em>.zip</em> file containing the raw annotations and predictions (two JSON files) is available for download.</div>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td>` +
                    `<div style="height: 5px"></div>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td>` +
                    `<table>` +
                        `<tr>` +
                            `<td>` +
                                `<h class="header2" style="font-size: 16px">Annotations format:</h>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 35px"></div>` +
                            `</td>` +
                            `<td>` +
                                `<h class="header2" style="font-size: 16px">Predictions format:</h>` +
                            `</td>` +
                        `</tr>` +
                        
                        `<tr>` +
                            `<td>` +
                                `<div style="text-align: center; width: 300px;">` +
                                    `<textarea class="json_text_area" style="width: 300px; margin: 0 auto; height: 270px">${annotations_format_sample_text}</textarea>` +
                                `</div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 35px"></div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="text-align: center; width: 300px;">` +
                                    `<textarea class="json_text_area" style="width: 300px; margin: 0 auto; height: 270px">${predictions_format_sample_text}</textarea>` +
                                `</div>` +

                            `</td>` +
                        `</tr>` +
                    `</table>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td>` +
                //     `<div>Boxes are encoded with four values (in <span style="font-weight: bold">pixel coordinates</span>): ` +
                //         //`<br>` +
                //         //`<div style="text-align: center">` +
                //             `<span style="margin-left: 4px; font-family: 'Lucida Console', Monaco, monospace;">[ x_min, y_min, x_max, y_max ]</span> ` + 
                //         //`</div>` +
                //     `</div>` +
                // `</td>` +
                // `<td>` +
                //     `<div>Regions of interest are encoded as lists of x, y coordinate pairs` +
                //     `</div>` +
                    `<ul>` +
                        `<li>All boxes are encoded with four values (in <span style="font-weight: bold">pixel coordinates</span>):` +
                        `<span style="font-family: 'Lucida Console', Monaco, monospace;"> [ x_min, y_min, x_max, y_max ]` + 
                        `</span>` +
                        `</li>` +
                        `<br>` +
                        `<li>All regions of interest are encoded as lists of x, y coordinate pairs` +
                        `</li>` +
                    `</ul>` +
                `</td>` +

            `</tr>` +

            // `<tr>` +
            //     `<td>` +
            //         `<div style="height: 30px"></div>` +
            //     `</td>` +
            // `</tr>` +
            // `<tr>` +
            //     `<td>` +
            //         `<div style="text-align: center">` +
            //             `<a class="std-button std-button-hover" style="width: 250px;" href="${raw_outputs_download_path}" download>Download Raw Outputs</a>` +
            //         `</div>` +
            //     `</td>` +
            // `</tr>` +


        `</table>`
    );

    $("#download_button_area").append(
       // `<div style="height: 50px"></div>` +
        `<div style="text-align: center">` +
            `<a class="std-button std-button-hover" style="width: 280px;" href="${raw_outputs_download_path}" download>`+
                `<i class="fa-solid fa-file-arrow-down" style="padding-right: 15px"></i>Download Raw Outputs</a>` +
        `</div>`
    );
}

$(document).ready(function() {
    
    image_set_info = data["image_set_info"];
    //job_config = data["job_config"];
    //overlays = data["overlays"];
    excess_green_record = data["excess_green_record"];
    tags = data["tags"];
    annotations = data["annotations"];
    predictions = data["predictions"];
    metadata = data["metadata"];
    camera_specs = data["camera_specs"];
    metrics = data["metrics"];
    request = data["request"];
    //dzi_dir = data["dzi_dir"];
    dzi_image_paths = data["dzi_image_paths"];
    overlay_appearance = data["overlay_appearance"];

    ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000); // 2 hours
    $("body").click(function() {
        window.clearTimeout(ask_to_continue_handle);
        ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000);
    });


    let disp_result_name = request["results_name"];
    let result_text_width = get_text_width(request["results_name"], "normal 20px arial");
    //console.log("result_text_width", result_text_width);
    if (result_text_width > (270*2)) {
        $("#result_name").css("height", "40px");
        disp_result_name = disp_result_name.substring(0, 10) + " ... " + disp_result_name.substring(disp_result_name.length-10);
    }
    else if (result_text_width > 270) {
        $("#result_name").css("height", "40px");
    }

    $("#result_name").text(disp_result_name); //data["request"]["results_name"]);


    let result_type;
    if (request["regions_only"]) {
        result_type = "Predicted On All Regions";
    }
    else {
        if (metadata["is_ortho"] === "yes") {
            result_type = "Predicted On Entire Orthomosaic";
        }
        else {
            result_type = "Predicted On All Images";
        }
    }
    $("#result_type").text(result_type);


    if (("calculate_vegetation_record" in request) && (!(request["calculate_vegetation_record"]))) {
        $("#map_perc_veg_row").hide();
        $("#map_perc_veg_obj_row").hide();
        $("#map_perc_veg_non_obj_row").hide();
    }


    set_heights();
    resize_window();

    if ((can_calculate_density(metadata, camera_specs))) {
        gsd = get_gsd();
    }
    // for (let image_status of Object.keys(status_color)) {
    //     let color = status_color[image_status];
    //     let text = status_to_text[image_status];
    //     $("#filter_combo").append(`<option style="background-color: ${color}" value="${image_status}">${text}</option>`);
    // }

    $("#request_raw_outputs_button").click(function() {
        let raw_outputs_download_path = get_CC_PATH() + 
            "/usr/data/" + 
            username + 
            "/image_sets/" + 
            image_set_info["farm_name"] + "/" + 
            image_set_info["field_name"] + "/" + 
            image_set_info["mission_date"] + 
            "/model/results/" + 
            image_set_info["result_uuid"] + 
            "/raw_outputs.zip";

        show_modal_message(`Download Raw Outputs`,

        `<div>A <em>.zip</em> file containing the raw annotations and predictions (two JSON files) is available for download.` +
        `</div>` +
        `<div style="height: 10px"></div>` +

        `<table>` +
            `<tr>` +
                `<td>` +
                    `<h class="header2" style="font-size: 16px">Annotations format:</h>` +
                `</td>` +
                `<td>` +
                    `<div style="width: 35px"></div>` +
                `</td>` +
                `<td>` +
                    `<h class="header2" style="font-size: 16px">Predictions format:</h>` +
                `</td>` +
            `</tr>` +
            
            `<tr>` +
                `<td>` +
                    `<div style="text-align: center; width: 300px;">` +
                        `<textarea class="json_text_area" style="width: 300px; margin: 0 auto; height: 270px">${annotations_format_sample_text}</textarea>` +
                    `</div>` +
                `</td>` +
                `<td>` +
                    `<div style="width: 35px"></div>` +
                `</td>` +
                `<td>` +
                    `<div style="text-align: center; width: 300px;">` +
                        `<textarea class="json_text_area" style="width: 300px; margin: 0 auto; height: 270px">${predictions_format_sample_text}</textarea>` +
                    `</div>` +

                `</td>` +
            `</tr>` +
        `</table>` +

        `<ul>` +
        `<li>All boxes will be encoded with four values (in <span style="font-weight: bold">pixel coordinates</span>): ` +
        `<br>` +
        `<div style="text-align: center">` +
        `<div style="font-family: 'Lucida Console', Monaco, monospace;">[ x_min, y_min, x_max, y_max ]</div> ` + 
        `</div>` +
        `</li>` +
        `</ul>` +
        `<div style="height: 10px"></div>` +
        `<div style="text-align: center">` +
            `<a class="std-button std-button-hover" style="width: 250px;" href="${raw_outputs_download_path}" download>Download Raw Outputs</a>` +
        `</div>`

            // `<table style="margin: auto; width: 500px">` +
            //     `<tr>` +

            //         `<td>` +
            //             `<h class="header2" style="text-align: right; width: 200px; margin-right: 10px">File Format</h>` +
            //         `</td>` +
            //         `<td style="width: 100%">` +
            //             `<select id="file_format_dropdown" class="nonfixed_dropdown" style="display: inline-block; width: 200px">` +
            //                 `<option value="json">JSON</option>` +
            //                 `<option value="shapefile">Shapefile</option>` +
            //             `</select>` +
            //         `</td>` +
            //     `</tr>` +
            // `</table>` +
            // `<div id="file_download_content"></div>` +
            // `<button id="prepare_download">Prepare Download</button>`
        
        , 750);

        // $("#file_format_dropdown").change(function() {
        //     $("#file_download_content").empty();
        //     let file_format = $("#file_format_dropdown").val();
        //     if (file_format === "json") {
        //         $("#file_download_content").html("JSON!");
        //     }
        //     else {
        //         $("#file_download_content").html("SHAPEFILE!");
        //     }
        // });

        // $("#file_format_dropdown").val("json").change();

        // $("#prepare_download").click(function() {
        //     $.post($(location).attr('href'),
        //     {
        //         action: "prepare_raw_outputs_download",
        //         file_format: $("#file_format_dropdown").val()
        //     },
        //     function(response, status) {

        //         if (response.error) {
        //             show_modal_message(`Error`, response.message);
        //         }
        // });


    });


    // let base = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
    // image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/model/results/" +

    $("#view_download_options_button").click(function() {
        show_modal_message(
            `Download Options`,
            `<div style="height: 550px; border: 1px solid white; border-radius: 0px 0px 15px 15px">` +
                `<div style="width: 100%">` +
                    `<div>` + 
                        `<ul class="nav" id="download_nav_list">` +
                            `<li id="metrics_tab" class="nav tab-btn-active" style="width: 130px" onclick="show_download_metrics()">` +
                                `<a class="nav">Metrics` +
                                    //`<i class="fa-solid fa-pen-to-square"></i>` +
                                `</a>` +
                            `</li>` +
        
                            `<li id="raw_outputs_tab" class="nav" style="width: 130px" onclick="show_download_raw_outputs()">` +
                                `<a class="nav">Raw Outputs` +
                                    //`<i class="fa-solid fa-pen-to-square"></i>` +
                                `</a>` +
                            `</li>` +
        

                        `</ul>` +
                    `</div>` +
                `</div>` +
                `<div style="height: 60px"></div>` +
                `<div id="download_info_area" style="height: 450px"></div>` +
                `<div id="download_button_area">/div>` +
            `</div>`
            
            , modal_width=1000, display=true
        );

        if (data["areas_spreadsheet_exists"]) {
            $("#download_nav_list").append(
                `<li id="areas_tab" class="nav" style="width: 130px" onclick="show_download_areas()">` +
                    `<a class="nav">Areas` +
                        //`<i class="fa-solid fa-pen-to-square"></i>` +
                    `</a>` +
                `</li>`
            );
        }

            

        show_download_metrics();

    });




    $("#request_metrics_button").click(function() {
        let metrics_download_path = get_CC_PATH() + 
            "/usr/data/" + 
            username + 
            "/image_sets/" + 
            image_set_info["farm_name"] + "/" + 
            image_set_info["field_name"] + "/" + 
            image_set_info["mission_date"] + 
            "/model/results/" + 
            image_set_info["result_uuid"] + 
            "/metrics.xlsx";

        show_modal_message(`Download Metrics`,
        `<div>An <em>.xlsx</em> file containing metrics is available for download. This file contains three sheets:` +
        `</div>` +
        `<div style="height: 10px"></div>` +
        `<ul>` +
        `<li><div style="display: inline-block; width: 80px"><em>Images:</em></div>Metrics for images. Each row contains metrics for one image in the image set.</li>` +
        `<br>` +
        `<li><div style="display: inline-block; width: 80px"><em>Regions:</em></div>Metrics for regions. Each row contains metrics for one region in the image set.</li>` +
        `<br>` +
        `<li><div style="display: inline-block; width: 80px"><em>Stats:</em></div>Summary statistics for the entire image set.</li>` +
        `</ul>` +

        `<div style="height: 10px"></div>` +
        `<div style="text-align: center">` +
            `<a class="std-button std-button-hover" style="width: 250px;" href="${metrics_download_path}" download="metrics.xlsx">Download Metrics</a>` +
        `</div>`

        , 750);
    });



    // let download_path = get_CC_PATH() + "/download/" + 
    //                                 username + "/" +
    //                                 farm_name + "/" + 
    //                                 field_name + "/" + 
    //                                 mission_date + "/" +
    //                                 result_uuid + "/" + 
    //                                 download_uuid;


    //$("#download_metrics_button").attr("href", metrics_download_path);



    // $("#request_metrics_button").click(function() {

    //     let farm_name = image_set_info["farm_name"];
    //     let field_name = image_set_info["field_name"];
    //     let mission_date = image_set_info["mission_date"];
    //     let result_uuid = image_set_info["result_uuid"];

    //     show_modal_message("Preparing Download", 
    //     `<div style="height: 50px">` +
    //         `<div id="prep_spreadsheet_message">Preparing spreadsheet...</div>` +
    //         `<div id="prep_spreadsheet_loader" class="loader"></div>` +
    //         `<div style="text-align: center; margin-top: 20px"><a class="table_button table_button_hover" id="download_button" style="padding: 10px; border-radius: 30px" hidden>` +
    //             `<i class="fa-solid fa-file-arrow-down"></i><span style="margin-left: 10px">Download Results</span></a>` +
    //         `</div>` +
    //     `</div>`);

    //     $("#modal_close").hide();

    //     $.post($(location).attr('href'),
    //     {
    //         action: "create_spreadsheet",
    //         download_uuid: download_uuid,
    //         // annotation_version: $("#annotation_version_combo").val()
    //     },
        
    //     function(response, status) {
    //         $("#prep_spreadsheet_loader").hide();
    //         $("#modal_close").show();

    //         if (response.error) {
    //             $("#modal_head_text").html("Error");
    //             $("#prep_spreadsheet_message").html("An error occurred while generating the results file.");

    //         }
    //         else {
    //             $("#modal_head_text").html("Ready For Download");
    //             $("#prep_spreadsheet_message").html("Your results file has been created. Click the button to download the results.");
    //             $("#download_button").show();
    
    //             download_uuid = response.download_uuid;

    //             let download_path = get_CC_PATH() + "/download/" + 
    //                                 username + "/" +
    //                                 farm_name + "/" + 
    //                                 field_name + "/" + 
    //                                 mission_date + "/" +
    //                                 result_uuid + "/" + 
    //                                 download_uuid;


    //             $("#download_button").attr("href", download_path);


    //             let close_timeout_handler = setTimeout(function() {
    //                 $("#modal_close").click();
    //             }, 3600 * 1000);

    //             $("#modal_close").click(function() {
    //                 clearTimeout(close_timeout_handler);
    //                 close_modal();
    //             });

    //         }

    //     });
    // })



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


    $("#tile_size_slider").change(function() {
        let slider_val = Number.parseFloat($("#tile_size_slider").val()).toFixed(2);
        $("#tile_size_slider_val").html(slider_val + " m");
    });

    $("#tile_size_slider").on("input", function() {
        let slider_val = Number.parseFloat($("#tile_size_slider").val()).toFixed(2);
        $("#tile_size_slider_val").html(slider_val + " m");
    });

    $("#tile_size_down").click(function() {
        lower_tile_size_slider();
    });

    $("#tile_size_up").click(function() {
        raise_tile_size_slider();
    });



    if (can_calculate_density(metadata, camera_specs)) {
        if (metadata["is_ortho"] === "yes" || Object.keys(annotations).length >= 3) {

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

        if (metadata["is_ortho"] === "yes") {
            let tile_size_range = calculate_tile_size_slider_range();
            $("#tile_size_slider").prop("min", tile_size_range[0]);
            $("#tile_size_slider").prop("max", tile_size_range[1]);
            $("#tile_size_slider").prop("value", tile_size_range[0]);
            $("#tile_size_slider_val").html(tile_size_range[0] + " m");
            $("#map_tile_size_controls").show();
            $("#interpolated_value_controls").hide();
        }
        else {
            $("#map_tile_size_controls").hide();
            $("#interpolated_value_controls").show();
        }
    }  



    // $("input[name=interpolation_radio]").change(function(e) {
    //     interpolation_radio_update();

    // });
    

    // interpolation_radio_update();


    //$("input[name=interpolation_radio]").val("linear").change();
    


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
    //draw_map_chart();

    show_image(cur_img_name);

    //create_viewer_and_anno();

    //show_image();


    $("#overlays_table").change(function() {
        viewer.raiseEvent('update-viewport');
    });


    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#confidence_slider_val").html("> " + slider_val);
        
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
        $("#confidence_slider_val").html("> " + slider_val);
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



    // let score_handler;
    $("#score_down").click(function() {
        lower_slider();
        //score_handler = setInterval(lower_slider, 300);
    });

    // $("#score_down").mouseup(function() {
    //     clearInterval(score_handler);
    // }); 

    $("#score_up").click(function() {
        raise_slider();
        //score_handler = setInterval(raise_slider, 300);
    });

    // $("#score_up").mouseup(function() {
    //     clearInterval(score_handler);
    // });

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


    // $("#annotation_version_combo").change(function() {
    //     let version = $("#annotation_version_combo").val();

    //     show_modal_message("Please Wait", 
    //     `<div id="switch_anno_message">Switching annotation versions. This may take a few minutes.</div><div style="height: 10px"></div><div id="switch_anno_loader" class="loader"></div>`);

    //     $("#modal_close").hide();

    //     // a(class="table_button table_button_hover" style="padding: 5px 10px;" id="download_button" download)
    //     //     i(class="fa fa-download fa-sm")
    //     //     span(style="margin-left: 10px") Download Results 

    //     download_uuid = "";
    //     $.post($(location).attr('href'),
    //     {
    //         action: "switch_annotation_version",
    //         // username: username,
    //         // farm_name: farm_name,
    //         // field_name: field_name,
    //         // mission_date: mission_date,
    //         // results_timestamp: timestamp,
    //         annotation_version: version
    //     },
        
    //     function(response, status) {
    //         if (response.error) {
    //             show_modal_message("Error", "An error occurred while switching annotation versions.");
    //             if (version === "most_recent") {
    //                 $("#annotation_version_combo").val("preserved");
    //             }
    //             else {
    //                 $("#annotation_version_combo").val("most_recent");
    //             }
    //         }
    //         else {
    //             annotations = response["annotations"];
    //             metrics = response["metrics"];
    //             excess_green_record = response["excess_green_record"];
    //             download_uuid = response["download_uuid"];

    //             //$("#filter_combo").val("all");

    //             $("#chart_container").empty();
    //             $("#interpolation_linear").prop("checked", true);
    //             $("#pred_image_status_all").prop("checked", true);


    //             $("#filter_combo").val("all").change();
    //             //create_image_set_table();
    //             //create_overlays_table();
    //             set_count_chart_data();
    //             set_score_chart_data();
    //             // update_count_chart();
    //             // update_score_chart();

    //             if (cur_img_name in voronoi_data && "annotation" in voronoi_data[cur_img_name]) {
    //                 delete voronoi_data[cur_img_name]["annotation"];
    //             }
            
    //             // $("#seadragon_viewer").empty();
    //             // create_viewer_and_anno();

    //             let init_image_name = basename(dzi_image_paths[0]);
    //             //cur_img_name = init_image_name.substring(0, init_image_name.length - 4);
    //             change_image(init_image_name.substring(0, init_image_name.length - 4) + "/-1");

    //             $("#modal_close").click();
    //         }


    //     });
    // });


    $("#navigation_dropdown").change(function() {
        create_navigation_table();
        update_count_combo(true);

        let disp_nav_item = null;
        for (let nav_item of cur_nav_list) {
            let image_name = nav_item.split("/")[0];
            if (image_name === cur_img_name) {
                disp_nav_item = nav_item;
                break;
            }
        }
        if (disp_nav_item == null) {
            change_image(cur_nav_list[0]);
        }
        else {
            change_image(disp_nav_item);
        }

        //change_image(cur_nav_list[0]);
    });

    $("#image_visible_switch").change(function() {
        viewer.raiseEvent('update-viewport');
    });




});

$(window).resize(function() {
    resize_window();
});