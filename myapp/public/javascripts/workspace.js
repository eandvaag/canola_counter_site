// import BetterPolygon from '@recogito/annotorious-better-polygon';

//let update_time = 0;

let image_set_info;
let metadata;
let camera_specs;
let dzi_image_paths;
let annotations;
let image_to_dzi;
let predictions;
let overlay_appearance;
let tags;

let viewer;
let anno;
let overlay;
let prediction_anno;
let cur_img_name;
let cur_region_index;
let cur_nav_list;
let cur_view;

let cur_update_num = -1;
//let pending_predictions;
 // = {};
// let metrics = {};
let show_bookmarks = true;

let cur_panel;
let cur_bounds = null;
//let cur_status;


let map_url = null;
let min_max_rec = null;

let num_training_images;
let model_unassigned = true;
let num_images_fully_trained_on;
//let train_num_increased = false;
//let locked_training_images; // = [];

let waiting_for_model_switch = false;
let switch_model_data = {};



let selected_annotation_index = -1;
let selected_annotation = null;
let cur_edit_layer = "annotation";
let locked_training_regions; // = [];

//let num_training_regions;
let num_regions_fully_trained_on;

let d_rgb;
let rgb_ctx;

let annotations_dropzone;

let voronoi_data = {};

let gsd = null;
let cur_mouse_x;
let cur_mouse_y;

// let overlay_colors = [
//     "#0080C0",        
//     "#FF4040"
// ];
// let overlay_names = [
//     "annotations",
//     "predictions"
// ];


let cur_gridview_tiles;
let cur_gridview_tile_index;
let navigator_viewer;
let navigator_overview;
let grid_zoomed;


let snap_boxes_to_exg = false;

/*
function set_prediction_overlay_color() {

    for (let image_name of Object.keys(predictions)) {
        for (let annotation of predictions[image_name]["annotations"]) {
            annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"})
        }
    }
}
  */

function update_snap() {
    if (snap_boxes_to_exg) {
        console.log("setting background to none");
        $("#snap_button").css("background-color", "");
    }
    else {
        console.log("setting background to green");
        $("#snap_button").css("background-color", "#4c6645");
    }

    snap_boxes_to_exg = !(snap_boxes_to_exg);
}

let keydown_handler = async function(e) {
    if (e.keyCode == 83) {
        if (cur_edit_layer === "annotation") {
            update_snap();
            // snap_boxes_to_exg = true;


        
            // let px_str = selected_annotation.target.selector.value;
            // console.log(px_str);

            // snap_box_to_exg(px_str, async function(result) {
            //     console.log("NEW UPDATED", result);

            //     selected_annotation.target.selector.value = result;

            //     // Make sure to wait before saving!
            //     await anno.updateSelected(selected_annotation);
            //     anno.saveSelected();

            // });
        
        }
    }
}



let selected_keydown_handler = async function(e) {

    if (e.keyCode == 46) {

        let selected = anno.getSelected();
        if (selected != null) {

            anno.removeAnnotation(selected);
            anno.cancelSelected();

            //annotations[cur_img_name]["annotations"] = anno.getAnnotations();

            let sel_box_array;
            if (cur_edit_layer === "annotation") {
                sel_box_array = annotations[cur_img_name]["boxes"];
            }
            else if (cur_edit_layer === "region_of_interest") {
                sel_box_array = annotations[cur_img_name]["regions_of_interest"];
            }
            else if (cur_edit_layer === "training_region") {
                sel_box_array = annotations[cur_img_name]["training_regions"];

                // let num_regions = get_num_regions("training_regions");
                // if (num_regions == 1) {
                    
                //     let num_options = $('#navigation_dropdown').children('option').length;
                //     $("#navigation_dropdown").empty();
                //     if (num_options == 2) {
                //         $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
                //         //$("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
                //     }
                //     else if (num_options == 3) {
                //         $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
                //         //$("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
                //         $("#navigation_dropdown").append($("<option></option>").val("test_regions").text("Test Regions"));
                //     }
                // }
            }
            else {
                sel_box_array = annotations[cur_img_name]["test_regions"];

                // let num_regions = get_num_regions("test_regions");
                // if (num_regions == 1) {
                //     let num_options = $('#navigation_dropdown').children('option').length;
                //     $("#navigation_dropdown").empty();
                //     if (num_options == 2) {
                //         $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
                //         //$("#navigation_dropdown").append($("<option></option>").val("test_regions").text("Test Regions"));
                //     }
                //     else if (num_options == 3) {
                //         $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
                //         $("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
                //         //$("#navigation_dropdown").append($("<option></option>").val("test_regions").text("Test Regions"));
                //     }
                      
                // }

            }
            //if ((cur_edit_layer !== "training_region") || !(locked_training_regions[selected_annotation_index])) {


            if (cur_edit_layer === "region_of_interest") {
                // let nav_item = cur_img_name + "/" + selected_annotation_index;
                // for (let tag of Object.keys(tags)) {
                //     if (nav_item in tags[tag]) {
                //         delete tags[tag][nav_item];
                //         if (Object.keys(tags[tag]).length == 0) {
                //             delete tags[tag];
                //         }
                //     }
                // }
                // for (let tag of Object.keys(tags)) {
                //     tags[tag][cur_img_name].splice(selected_annotation_index, 1);
                // }

                // for (let tag of Object.keys(tags)) {
                //     for (let image_name of Object.keys(tags[tag])) {
                //         if (tags[tag][image_name].length == 0)
                //     }
                // }
                for (let tag_name of Object.keys(tags)) {
                    for (let nav_item of Object.keys(tags[tag_name])) {
                        let elements = nav_item.split("/");
                        let iter_region_index = parseInt(elements[1]);
                        // console.log(nav_item);
                        // console.log(cur_img_name);
                        // console.log(selected_annotation_index);
                        let cur_affected_nav_item = cur_img_name + "/" + selected_annotation_index;
                        // console.log(cur_affected_nav_item);
                        if (nav_item === cur_affected_nav_item) {
                            delete tags[tag_name][nav_item];
                        }
                        if (iter_region_index > selected_annotation_index) {
                            tags[tag_name][elements[0] + "/" + String(elements[1]-1)] = tags[tag_name][nav_item];
                            delete tags[tag_name][nav_item];
                        }
                    }
                    if (Object.entries(tags[tag_name]).length == 0) {
                        delete tags[tag_name];
                    }
                }
            }



            sel_box_array.splice(selected_annotation_index, 1);
            selected_annotation = null;
            selected_annotation_index = -1;

            update_navigation_dropdown();


            if (cur_edit_layer === "region_of_interest") {
                update_region_name();
                create_navigation_table();
            }
            else if (cur_edit_layer === "training_region") {
                locked_training_regions[cur_img_name].splice(selected_annotation_index, 1);
                update_region_name();
                create_navigation_table();
            }
            else if (cur_edit_layer === "test_region") {
                update_region_name();
                create_navigation_table();
            }
            else if ((cur_edit_layer === "annotation") && (sel_box_array.length == 0)) {
                annotations[cur_img_name]["source"] = "NA";
                //annotations[cur_img_name]["predictions_used_as_annotations"] = false;
            }
            

            

            // annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

            // update_image_status();
            // set_image_status_combo();
            $("#save_icon").css("color", "#ed452b");
            // create_image_set_table();
            //}
        }

    }



    else if (e.keyCode == 77) {

        //let selected = anno.getSelected();
        if ((selected_annotation != null) && (cur_edit_layer === "test_region")) {
            // anno.removeAnnotation(selected);
            // anno.cancelSelected();

            let held_annotation_index = selected_annotation_index;
            await anno.updateSelected(selected_annotation, true);

            
            let source_box_array;
            let target_box_array;
            let selected_region;
            let illegal_intersection = false;
            // if (cur_edit_layer === "training_region") {
            //     source_box_array = annotations[cur_img_name]["training_regions"];
            //     target_box_array = annotations[cur_img_name]["test_regions"];
            //     selected_region = source_box_array[held_annotation_index];
                
            //     loop1:
            //     for (let i = 0; i < annotations[cur_img_name]["training_regions"].length; i++) {
            //         if (i == held_annotation_index) {
            //             continue;
            //         }
            //         if ((box_intersects_region(selected_region, annotations[cur_img_name]["training_regions"][i]))) {
            //             illegal_intersection = true;
            //             break loop1;
            //         }
            //     }
            // }
            // else {
            source_box_array = annotations[cur_img_name]["test_regions"];
            target_box_array = annotations[cur_img_name]["training_regions"];
            selected_region = source_box_array[held_annotation_index];


            loop1:
            for (let region_key of ["training_regions", "test_regions"]) {
                for (let i = 0; i < annotations[cur_img_name][region_key].length; i++) {
                    if (i == held_annotation_index) {
                        continue;
                    }
                    if (box_intersects_region(selected_region, annotations[cur_img_name][region_key][i])) {
                        illegal_intersection = true;
                        break loop1;
                    }
                }
            }

            if (!(illegal_intersection)) {
                source_box_array.splice(held_annotation_index, 1);
                target_box_array.push(selected_region);
                selected_annotation = null;
                selected_annotation_index = -1;

                // if (cur_edit_layer === "training_region") {
                //     locked_training_regions[cur_img_name].splice(held_annotation_index, 1);
                // }
                // else {
                locked_training_regions[cur_img_name].push(false);
                // }

                

                update_navigation_dropdown();
                update_region_name();
                create_navigation_table();

                $("#save_icon").css("color", "#ed452b");

                //viewer.world.resetItems();
                viewer.raiseEvent('update-viewport');


            }

        }
    }


}



async function change_image(cur_nav_item) {

    await unselect_selected_annotation();

    //let region_text;
    
    // if (navigation_type === "images") {
    //     cur_img_name = cur_nav_item;
    //     cur_region_index = -1;
    //     region_text = "All";
    // }
    // else {
    //     let pieces = cur_nav_item.split("/");
    //     cur_img_name = pieces[0];
    //     cur_region_index = parseInt(pieces[1]);
    //     region_text = pieces[1];
    // }
    //console.log("cur_nav_item", cur_nav_item);

    document.getElementById(cur_nav_item + "_row").scrollIntoView({behavior: "smooth"});
    

    let pieces = cur_nav_item.split("/");
    cur_img_name = pieces[0];
    cur_region_index = parseInt(pieces[1]);
    
    //region_text = pieces[1] === "-1" ? "All" : pieces[1];

    //cur_img_name = img_name;

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
    //$("#region_name").text(region_text);

    update_region_name();
    update_count_combo(false);

    //if (cur_img_name in predictions) {
    set_count_chart_data();
    set_score_chart_data();
    update_score_chart();
    update_count_chart();
    //}
    
    // set_image_status_combo();

    // if (viewer == null) {
    //     create_viewer("seadragon_viewer");
    // }

    // let dzi_image_path = image_to_dzi[cur_img_name];
    // viewer.open(dzi_image_path);

    //set_cur_bounds();
    // if (cur_panel === "annotation" || cur_panel === "prediction") {
    //     //let navigation_type = $("#navigation_dropdown").val();
    //     if (navigation_type === "training_regions" || navigation_type === "test_regions") {
    //         //console.log("zooming to region");
    //         console.log("annotations", annotations);
    //         console.log("cur_img_name", cur_img_name);
    //         console.log("navigation_type", navigation_type);
    //         console.log("cur_region_index", cur_region_index);
    //         let bounds = annotations[cur_img_name][navigation_type][cur_region_index];
    //         console.log("bounds", bounds);
    //         let image_w = metadata["images"][cur_img_name]["width_px"];
    //         let image_h = metadata["images"][cur_img_name]["height_px"];
    //         let hw_ratio = image_h / image_w;
    //         let viewport_bounds = [
    //             bounds[1] / image_w,
    //             (bounds[0] / image_h) * hw_ratio,
    //             (bounds[3] - bounds[1]) / image_w,
    //             ((bounds[2] - bounds[0]) / image_h) * hw_ratio
    //         ];
    //         console.log("viewport_bounds", viewport_bounds);
    //         // let min_x = Math.floor(cur_bounds.x * overlay.imgWidth);
    //         // let min_y = Math.floor((cur_bounds.y / hw_ratio) * overlay.imgHeight);


    //         // let top_left = viewer.viewport.imageToViewportCoordinates(bounds[1], bounds[0]);
    //         // let bot_right = viewer.viewport.imageToViewportCoordinates(bounds[3], bounds[2]);

    //         //console.log("top_left", top_left);
    //         // let rect = new OpenSeadragon.Rect(
    //         //     top_left[0], 
    //         //     top_left[1], 
    //         //     (bot_right[0] - top_left[0]), 
    //         //     (bot_right[1] - top_left[1])
    //         // );
    //         //console.log("rect", rect);

    //         cur_bounds = new OpenSeadragon.Rect(
    //             viewport_bounds[0],
    //             viewport_bounds[1],
    //             viewport_bounds[2],
    //             viewport_bounds[3]
    //         );


    //         // bounds = annotations[cur_img_name][$("#navigation_dropdown").val()][cur_region_index];

            
    //         // let item_count = viewer.world.getItemCount();

    //         // while (item_count == 0) {
    //         //     item_count = viewer.world.getItemCount();
    //         // }
    //         // viewer.world.getItemAt(0).setClip(
    //         //     new OpenSeadragon.Rect(
    //         //         bounds[1],
    //         //         bounds[0],
    //         //         (bounds[3] - bounds[1]),
    //         //         (bounds[2] - bounds[0])
    //         //     )
    //         // );

    //         //cur_bounds = rect; //viewer.viewport.imageToViewportCoordinates(cur_bounds);


    //     }
    //     else {
    //         // viewer.open(dzi_image_path);
    //         cur_bounds = null;
    //     }

    //     //let bounds = annotations[cur_img_name][navigation_type][cur_region_index];



    //     //delay(100).then(() => viewer.raiseEvent('update-viewport'));
    // }

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

/*
function set_cur_img_list() {
    cur_img_list = [];
    for (let image_name of natsort(Object.keys(annotations))) {
        cur_img_list.push(image_name);
    }
}*/

// function create_image_set_table() {

//     let image_name_col_width = "180px";
//     let image_status_col_width = "60px";

//     //cur_img_list = [];
//     $("#image_set_table").empty();
//     /*
//     $("#image_set_table").append(`<tr>` +
//             `<th><div class="table_header" style="width: ${image_name_col_width};">Name</div></th>` +
//             //`<th><div class="table_header" style="width: ${image_status_col_width}">Annotation Status</div></th>` +
//             //`<th><div class="table_header" style="width: ${image_dataset_col_width}">Assigned Dataset</div></th>` +
//             `</tr>`);*/

//     let abbreviation = {
//         "unannotated": "Un.",
//         "started": "St.",
//         //"completed_for_training": "C. Tr.",
//         "completed_for_training": "C. Fi.",
//         "completed_for_testing": "C. Te."
//     };



//     for (let image_name of natsort(Object.keys(annotations))) {
//         // let image_name = basename(dzi_image_path);
//         // let extensionless_name = image_name.substring(0, image_name.length - 4);


//         //let img_status = image_set_data["images"][extensionless_name]["status"];

//         let image_status = annotations[image_name]["status"];
//         let abbreviated_status = abbreviation[image_status];
//         let image_color = status_color[image_status];
            
//         let item = `<tr>` +
           
//             //`<td><div>${extensionless_name}</div></td>` +
//             //`<td><div class="table_entry std_tooltip" style="background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}` +
//             //`<span class="std_tooltiptext">${image_status}</span></div></td>` +

//             `<td><div class="table_entry std_tooltip" style="margin: 0px 1px; background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}</div></td>` +


//             `<td><div class="table_button table_button_hover" style="width: ${image_name_col_width}; margin: 0px 1px;" ` +
//             // `onclick="change_image('${dzi_image_path}')">${extensionless_name}</div></td>` +
//              `onclick="change_image('${image_name}')">${image_name}</div></td>` +
//             //`</div></td>` + 
//             //`<td><div class="table_entry">${img_dataset}</div></td>` +
//             `</tr>`;
//         $("#image_set_table").append(item);

        

//     }
// }



function resize_poly_px_str(px_str) {
    
    let img_min_y;
    let img_min_x;
    let img_max_y;
    let img_max_x;
    // let navigation_type = "images";
    // if (navigation_type === "images") {
    let img_dims = viewer.world.getItemAt(0).getContentSize();
    img_min_y = 0;
    img_min_x = 0;
    img_max_y = img_dims.y;
    img_max_x = img_dims.x;
    // }
    // else {
    //     let img_bounds;
    //     if (navigation_type === "regions_of_interest") {
    //         img_bounds = get_bounding_box_for_polygon(poly);
    //     }
    //     else {
    //         img_bounds = annotations[cur_img_name][navigation_type][cur_region_index];
    //     }
    //     img_min_y = img_bounds[0];
    //     img_min_x = img_bounds[1];
    //     img_max_y = img_bounds[2];
    //     img_max_x = img_bounds[3];
    // }

    let start = px_str.indexOf('"');
    let end = px_str.lastIndexOf('"');

    let coords_str = px_str.substring(start+1, end);

    let less_than_min_y = 0;
    let more_than_max_y = 0;
    let less_than_min_x = 0;
    let more_than_max_x = 0;

    let revised_coords = [];
    let lst_of_coord_strs = coords_str.split(" ");
    for (let coord_str of lst_of_coord_strs) {
        let coords = coord_str.split(",").map(x => parseFloat(x));
        //console.log("coords", coords);

        if (coords[1] < img_min_y) {
            less_than_min_y++;
            //coords[1] = img_min_y;
        }
        if (coords[1] > img_max_y) {
            more_than_max_y++;
            //coords[1] = img_max_y;
        }
        if (coords[0] < img_min_x) {
            less_than_min_x++;
            //coords[0] = img_min_x;
        }
        if (coords[0] > img_max_x) {
            more_than_max_x++;
            //coords[0] = img_max_x;
        }
        revised_coords.push([(coords[0]), (coords[1])]); //[Math.round(coords[0]), Math.round(coords[1])]);

    }
    let num_coords = revised_coords.length;
    if ((less_than_min_y == num_coords) ||
        (more_than_max_y == num_coords) ||
        (less_than_min_x == num_coords) ||
        (more_than_max_x == num_coords)) {
        
        return "illegal";
    }
    else {
        if (polygon_is_self_intersecting(revised_coords)) {
            return "illegal";
        }

        let clip_polygon = [[0, 0], [img_max_x, 0], [img_max_x, img_max_y], [0, img_max_y]];
        revised_coords = clip_polygons(revised_coords, clip_polygon);
        //let unique_revised_coords = revised_coords.filter(onlyUnique);
        //let unique_revised_coords = [...new Set(revised_coords)];
        let rounded_revised_coords = [];
        let added_str_coords = [];
        for (let j = 0; j < revised_coords.length; j++) {
            let coord = [(revised_coords[j][0]), (revised_coords[j][1])]; //[Math.round(revised_coords[j][0]), Math.round(revised_coords[j][1])];
            let str_coord = JSON.stringify(coord);
            if (!(added_str_coords.includes(str_coord))) {
                rounded_revised_coords.push(coord);
                added_str_coords.push(str_coord);
            }
        }
        // rounded_revised_coords = revised_coords;

        // let bbox = get_bounding_box_for_polygon(rounded_revised_coords);
        // if ((bbox[2] - bbox[0] == 0) || (bbox[3] - bbox[1] == 0)) {
        //     return "illegal";
        // }
        if (rounded_revised_coords.length == 0) {
            return "illegal";
        }

        if (get_polygon_area(rounded_revised_coords) < 5) {
            return "illegal";            
        }

        let revised_coords_str = `<svg><polygon points="${rounded_revised_coords.map(xy => xy.join(',')).join(' ')}"></polygon></svg>`
        return revised_coords_str;
    }
}





function resize_px_str(px_str) {
    px_str = px_str.substring(11);
    let px_lst = px_str.split(",").map(x => parseFloat(x));
    

    let img_min_y;
    let img_min_x;
    let img_max_y;
    let img_max_x;
    let navigation_type = $("#navigation_dropdown").val();
    if (navigation_type === "images") {
        let img_dims = viewer.world.getItemAt(0).getContentSize();
        img_min_y = 0;
        img_min_x = 0;
        img_max_y = img_dims.y;
        img_max_x = img_dims.x;
    }
    else if (navigation_type == "regions_of_interest") {
        let region = annotations[cur_img_name][navigation_type][cur_region_index];
        let poly_bbox = get_bounding_box_for_polygon(region);
        img_min_y = poly_bbox[0];
        img_min_x = poly_bbox[1];
        img_max_y = poly_bbox[2];
        img_max_x = poly_bbox[3];

    }
    else {
        let img_bounds = annotations[cur_img_name][navigation_type][cur_region_index];
        img_min_y = img_bounds[0];
        img_min_x = img_bounds[1];
        img_max_y = img_bounds[2];
        img_max_x = img_bounds[3];
    }

    let box_min_x = px_lst[0];
    let box_min_y = px_lst[1];
    let box_max_x = px_lst[0] + px_lst[2];
    let box_max_y = px_lst[1] + px_lst[3];


    if (navigation_type === "regions_of_interest") {
        let box_pts = [
            [box_min_y, box_min_x],
            [box_min_y, box_max_x],
            [box_max_y, box_max_x],
            [box_max_y, box_min_x]
        ];
        let region = annotations[cur_img_name][navigation_type][cur_region_index];
        for (let pt of box_pts) {
            if (!(point_is_inside_polygon(pt, region))) {
                return "illegal";
            }
        }
    }
    else {
        if ((box_min_x < img_min_x && box_max_x < img_min_x) || 
            (box_min_x > img_max_x && box_max_x > img_max_x) ||
            (box_min_y < img_min_y && box_max_y < img_min_y) ||
            (box_min_y > img_max_y && box_max_y > img_max_y)) {

            return "illegal";
        }
    }


        box_min_x = Math.max(box_min_x, img_min_x);
        box_min_y = Math.max(box_min_y, img_min_y);

        box_max_x = Math.min(box_max_x, img_max_x);
        box_max_y = Math.min(box_max_y, img_max_y);


        let box_centre_x = (box_max_x + box_min_x) / 2;
        let box_centre_y = (box_max_y + box_min_y) / 2;

        let box_w = box_max_x - box_min_x;
        let box_h = box_max_y - box_min_y;


        let min_dim = 1;
        let max_dim = 800; //1600;
        if (box_w < min_dim) {

            let tentative_box_min_x = Math.floor(box_min_x); //box_centre_x - Math.floor(min_dim / 2);
            let tentative_box_max_x = tentative_box_min_x + 1; //box_centre_x + Math.floor(min_dim / 2);
            if (tentative_box_min_x < img_min_x) {
                box_min_x = img_min_x;
                box_max_x = img_min_x + min_dim;
            }
            else if (tentative_box_max_x > img_max_x) {
                box_min_x = (img_max_x) - min_dim;
                box_max_x = img_max_x;
            }
            else {
                box_min_x = tentative_box_min_x;
                box_max_x = tentative_box_max_x;
            }
            
        }

        if (cur_edit_layer === "annotation") { 
            if (box_w > max_dim) {

                let tentative_box_min_x = box_centre_x - Math.floor(max_dim / 2);
                let tentative_box_max_x = box_centre_x + Math.floor(max_dim / 2);
                if (max_dim > (img_max_x - img_min_x)) {
                    box_min_x = img_min_x;
                    box_max_x = img_max_x;
                }
                else if (tentative_box_min_x < img_min_x) {
                    box_min_x = img_min_x;
                    box_max_x = img_min_x + max_dim;
                }
                else if (tentative_box_max_x > img_max_x) {
                    box_min_x = (img_max_x) - max_dim;
                    box_max_x = img_max_x;
                }
                else {
                    box_min_x = tentative_box_min_x;
                    box_max_x = tentative_box_max_x;
                }
            }
        }


        if (box_h < min_dim) {
            let tentative_box_min_y = Math.floor(box_min_y); //box_centre_y - Math.floor(min_dim / 2);
            let tentative_box_max_y = tentative_box_min_y + 1; //box_centre_y + Math.floor(min_dim / 2);
            if (tentative_box_min_y < img_min_y) {
                box_min_y = img_min_y;
                box_max_y = img_min_y + min_dim;
            }
            else if (tentative_box_max_y > img_max_y) {
                box_min_y = (img_max_y) - min_dim;
                box_max_y = img_max_y;
            }
            else {
                box_min_y = tentative_box_min_y;
                box_max_y = tentative_box_max_y;
            }
        }

        if (cur_edit_layer === "annotation") { 
            if (box_h > max_dim) {

                let tentative_box_min_y = box_centre_y - Math.floor(max_dim / 2);
                let tentative_box_max_y = box_centre_y + Math.floor(max_dim / 2);
                if (max_dim > (img_max_y - img_min_y)) {
                    box_min_y = img_min_y;
                    box_max_y = img_max_y;
                }
                else if (tentative_box_min_y < img_min_y) {
                    box_min_y = img_min_y;
                    box_max_y = img_min_y + max_dim;
                }
                else if (tentative_box_max_y > img_max_y) {
                    box_min_y = (img_max_y) - max_dim;
                    box_max_y = img_max_y;
                }
                else {
                    box_min_y = tentative_box_min_y;
                    box_max_y = tentative_box_max_y;
                }
            }
        }


        box_w = box_max_x - box_min_x;
        box_h = box_max_y - box_min_y;

        let updated_px_str = "xywh=pixel:" + box_min_x + "," + box_min_y +
                            "," + box_w + "," + box_h;

        
        return updated_px_str;


}


function create_anno() {

    anno = OpenSeadragon.Annotorious(viewer, {
        disableEditor: true,
        disableSelect: true,
        readOnly: true,
        formatter: formatter,
        //crosshair: true
        //hotkey: ["Shift", "Alt"]
    });

    Annotorious.BetterPolygon(anno);

    if (cur_edit_layer === "region_of_interest") {
        anno.setDrawingTool("polygon");
    }
    else {
        anno.setDrawingTool("rect");
    }

    anno.on('cancelSelected', function(selection) {
        anno.updateSelected(selection, true);
    });

    anno.on('createAnnotation', function(annotation) {

        selected_annotation_index = -1
        selected_annotation = null;

        
        let px_str = annotation["target"]["selector"]["value"];

        let box;
        let illegal_box = false;
        if (cur_edit_layer === "region_of_interest") {
            let start = px_str.indexOf('"');
            let end = px_str.lastIndexOf('"');

            let coords_str = px_str.substring(start+1, end);
            let lst_of_coord_strs = coords_str.split(" ");
            box = [];
            for (let coord_str of lst_of_coord_strs) {
                let coords = coord_str.split(",").map(x => parseFloat(x));
                //box.push([Math.round(coords[1]), Math.round(coords[0])]);
                box.push([(coords[1]), (coords[0])]);
            }
        }
        else {
            px_str = px_str.substring(11);
            let px_lst = px_str.split(",").map(x => parseFloat(x));

            if (px_lst[0] == -1) {
                illegal_box = true;
            }
            else {

                box = [
                    // Math.round(px_lst[1]), 
                    // Math.round(px_lst[0]), 
                    // Math.round(px_lst[1] + px_lst[3]),
                    // Math.round(px_lst[0] + px_lst[2])
                    (px_lst[1]), 
                    (px_lst[0]), 
                    (px_lst[1] + px_lst[3]),
                    (px_lst[0] + px_lst[2])
                ];
            }
        }
        let sel_box_array;
        if (cur_edit_layer === "annotation") {
            sel_box_array = annotations[cur_img_name]["boxes"];
        }
        else if (cur_edit_layer == "region_of_interest") {
            sel_box_array = annotations[cur_img_name]["regions_of_interest"];
        }
        else if (cur_edit_layer === "training_region") {
            sel_box_array = annotations[cur_img_name]["training_regions"];
        }
        else {
            sel_box_array = annotations[cur_img_name]["test_regions"];
        }

        if (!(illegal_box)) {
            let illegal_intersection = false;
            if (cur_edit_layer === "annotation") {
                for (let i = 0; i < annotations[cur_img_name]["training_regions"].length; i++) {
                    if ((box_intersects_region(box, annotations[cur_img_name]["training_regions"][i])) && locked_training_regions[cur_img_name][i]) {
                        illegal_intersection = true;
                        break;
                    }
                }
            }
            else if (cur_edit_layer === "region_of_interest") {
                if (annotations[cur_img_name]["regions_of_interest"].length >= 99) {
                    illegal_intersection = true;
                }

                if (polygon_is_self_intersecting(box)) {
                    illegal_intersection = true;
                }
            }
            else if ((cur_edit_layer === "training_region") || (cur_edit_layer === "test_region")) {

                    loop1:
                    for (let region_key of ["training_regions", "test_regions"]) {
                        
                        if (annotations[cur_img_name][region_key].length >= 99) {
                            illegal_intersection = true;
                        }

                        for (let i = 0; i < annotations[cur_img_name][region_key].length; i++) {
                            if (box_intersects_region(box, annotations[cur_img_name][region_key][i])) {
                                illegal_intersection = true;
                                break loop1;
                            }
                        }
                    }
            }
            if (!(illegal_intersection)) {
                sel_box_array.push(box);
                update_navigation_dropdown();
                if (cur_edit_layer === "training_region") {
                    locked_training_regions[cur_img_name].push(false);
                    update_region_name();
                    create_navigation_table();
                }
                else if (cur_edit_layer === "annotation") {
                    if (annotations[cur_img_name]["source"] === "NA") {
                        annotations[cur_img_name]["source"] = "manually_annotated_from_scratch";
                    }
                    else if (annotations[cur_img_name]["source"] === "unmodified_model_predictions") {
                        annotations[cur_img_name]["source"] = "edited_model_predictions";
                    }
                    else if (annotations[cur_img_name]["source"] === "uploaded") {
                        annotations[cur_img_name]["source"] = "uploaded_and_edited";
                    }
                    if (cur_img_name in voronoi_data && "annotation" in voronoi_data[cur_img_name]) {
                        delete voronoi_data[cur_img_name]["annotation"];
                    }
                }
                else {
                    update_region_name();
                    create_navigation_table();
                }

                $("#save_icon").css("color", "#ed452b");
            }
        }

        anno.clearAnnotations();
        viewer.raiseEvent('update-viewport');
    });

    anno.on('createSelection', async function(selection) {

        selection.target.source = window.location.href;
        
        selection.body = [{
            type: 'TextualBody',
            purpose: 'class',
            value: 'object'
        }];

        let px_str = selection.target.selector.value;
        let updated_px_str;
        if (cur_edit_layer === "region_of_interest") {
            updated_px_str = resize_poly_px_str(px_str);
        }
        else { 
            updated_px_str = resize_px_str(px_str);
        }
        if (updated_px_str === "illegal") {
            anno.clearAnnotations();
        }
        else {
            if (cur_edit_layer === "annotation" && snap_boxes_to_exg) {

                snap_box_to_exg(updated_px_str, async function(result) {
                    console.log("NEW UPDATED", result);

                    selection.target.selector.value = result;

                    // Make sure to wait before saving!
                    await anno.updateSelected(selection);
                    anno.saveSelected();

                });
                // updated_px_str = await snap_box_to_exg(updated_px_str);
                // console.log("NEW UPDATED", updated_px_str);
            }
            else {


                selection.target.selector.value = updated_px_str;

                // Make sure to wait before saving!
                await anno.updateSelected(selection);
                anno.saveSelected();
            }
        }

    });

    anno.on('updateAnnotation', async function(annotation, previous) {

        let px_str = annotation.target.selector.value;
        let updated_px_str;
        if (cur_edit_layer === "region_of_interest") {
            updated_px_str = resize_poly_px_str(px_str);
        }
        else { 
            updated_px_str = resize_px_str(px_str);
        }

        if (updated_px_str !== "illegal") {

            annotation.target.selector.value = updated_px_str;

            let updated_box;
            if (cur_edit_layer === "region_of_interest") {
                let start = updated_px_str.indexOf('"');
                let end = updated_px_str.lastIndexOf('"');
            
                let coords_str = updated_px_str.substring(start+1, end);
                let lst_of_coord_strs = coords_str.split(" ");
                updated_box = [];
                for (let coord_str of lst_of_coord_strs) {
                    let coords = coord_str.split(",").map(x => parseFloat(x));
                    updated_box.push([coords[1], coords[0]]); //[Math.round(coords[1]), Math.round(coords[0])]);
                }

            }
            else {
                updated_px_str = updated_px_str.substring(11);
                let px_lst = updated_px_str.split(",").map(x => parseFloat(x));

                updated_box = [
                    // Math.round(px_lst[1]), 
                    // Math.round(px_lst[0]), 
                    // Math.round(px_lst[1] + px_lst[3]),
                    // Math.round(px_lst[0] + px_lst[2])
                    (px_lst[1]), 
                    (px_lst[0]), 
                    (px_lst[1] + px_lst[3]),
                    (px_lst[0] + px_lst[2])
                ];
            }

            let sel_box_array;
            if (cur_edit_layer === "annotation") {
                sel_box_array = annotations[cur_img_name]["boxes"];
            }
            else if (cur_edit_layer === "region_of_interest") {
                sel_box_array = annotations[cur_img_name]["regions_of_interest"];
            }
            else if (cur_edit_layer === "training_region") {
                sel_box_array = annotations[cur_img_name]["training_regions"];
            }
            else {
                sel_box_array = annotations[cur_img_name]["test_regions"];
            }

            let illegal_intersection = false;
            if (cur_edit_layer === "annotation") {
                for (let i = 0; i < annotations[cur_img_name]["training_regions"].length; i++) {
                    if ((box_intersects_region(updated_box, annotations[cur_img_name]["training_regions"][i])) && locked_training_regions[cur_img_name][i]) {
                        illegal_intersection = true;
                        break;
                    }
                }
            }
            else if (cur_edit_layer === "region_of_interest") {
                if (polygon_is_self_intersecting(updated_box)) {
                    illegal_intersection = true;
                }
            }
            else if ((cur_edit_layer === "training_region") || (cur_edit_layer === "test_region")) {
                loop1:
                for (let region_key of ["training_regions", "test_regions"]) {
                    for (let i = 0; i < annotations[cur_img_name][region_key].length; i++) {
                        if ((region_key === cur_edit_layer + "s") && (i == selected_annotation_index)) {
                            continue;
                        }
                        if (box_intersects_region(updated_box, annotations[cur_img_name][region_key][i])) {
                            illegal_intersection = true;
                            break loop1;
                        }
                    }
                }
            }
            if (!(illegal_intersection)) {
                let prev_box = sel_box_array[selected_annotation_index];
                sel_box_array[selected_annotation_index] = updated_box;

                if (!(arraysEqual(updated_box, prev_box))) {
                    $("#save_icon").css("color", "#ed452b");


                    if (cur_edit_layer === "annotation") {
                    
                        if (annotations[cur_img_name]["source"] === "unmodified_model_predictions") {
                            annotations[cur_img_name]["source"] = "edited_model_predictions";
                        }

                        if (cur_img_name in voronoi_data && "annotation" in voronoi_data[cur_img_name]) {
                            delete voronoi_data[cur_img_name]["annotation"];
                        }
                    }
                }
            }
        }

        selected_annotation_index = -1
        selected_annotation = null;
        anno.clearAnnotations();
        viewer.raiseEvent('update-viewport');
    });

}


function anno_and_pred_onRedraw() {

    let navigation_type = $("#navigation_dropdown").val();

    let boxes_to_add = {};
    if ((cur_panel === "annotation") || (cur_panel === "prediction")) {
        boxes_to_add["region_of_interest"] = {};
        boxes_to_add["region_of_interest"]["boxes"] = annotations[cur_img_name]["regions_of_interest"];
        boxes_to_add["training_region"] = {};
        boxes_to_add["training_region"]["boxes"] = annotations[cur_img_name]["training_regions"];
        boxes_to_add["test_region"] = {};
        boxes_to_add["test_region"]["boxes"] = annotations[cur_img_name]["test_regions"];
    }


    if ((cur_panel === "annotation") || (cur_panel === "prediction" && ($("#annotation").is(":checked")))) {
        boxes_to_add["annotation"] = {};
        boxes_to_add["annotation"]["boxes"] = annotations[cur_img_name]["boxes"];
    }

    if (((cur_panel == "prediction") && (cur_img_name in predictions)) && ($("#prediction").is(":checked"))) {
        boxes_to_add["prediction"] = {};
        boxes_to_add["prediction"]["boxes"] = predictions[cur_img_name]["boxes"];
        boxes_to_add["prediction"]["scores"] = predictions[cur_img_name]["scores"];
    }

    let slider_val = Number.parseFloat($("#confidence_slider").val());
        
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

    if ((cur_panel === "prediction") && (!($("#image_visible_switch").is(":checked")))) {
        let viewer_point_1 = viewer.viewport.imageToViewerElementCoordinates(
            new OpenSeadragon.Point(0, 0));
        let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(
                new OpenSeadragon.Point(overlay.imgWidth, overlay.imgHeight));
                
        overlay.context2d().fillStyle = "#222621";         
        overlay.context2d().fillRect(
            viewer_point_1.x - 10,
            viewer_point_1.y - 10,
            (viewer_point_2.x - viewer_point_1.x) + 20,
            (viewer_point_2.y - viewer_point_1.y) + 20,
        );
    }


    let voronoi_keys = [];
    if ($("#voronoi_annotation").is(":checked")) {
        voronoi_keys.push("annotation");
    }
    if ($("#voronoi_prediction").is(":checked")) {
        voronoi_keys.push("prediction");
    }

    if (cur_panel === "prediction") {
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
    }

    let draw_order = overlay_appearance["draw_order"];
    for (let key of draw_order) {

        if (!(key in boxes_to_add)) {
            continue;
        }
        
        overlay.context2d().strokeStyle = overlay_appearance["colors"][key];
        overlay.context2d().fillStyle = overlay_appearance["colors"][key] + "55";
        overlay.context2d().lineWidth = 2;


        if (key === "region_of_interest") {

            for (let i = 0; i < boxes_to_add["region_of_interest"]["boxes"].length; i++) {

                if ((cur_edit_layer === "region_of_interest") && (i == selected_annotation_index)) {
                    continue;
                }
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
            loop1:
            for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {
                if ((cur_edit_layer === key) && (i == selected_annotation_index)) {
                    continue;
                }

                let box = boxes_to_add[key]["boxes"][i];
                if (key === "prediction") {
                    let score = boxes_to_add[key]["scores"][i];
                    if (score <= slider_val) {
                        continue;
                    }
                }

                if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {

                    visible_inds.push(i);
                    if (visible_inds.length > MAX_BOXES_DISPLAYED) {
                        break loop1;
                    }
                }

            }

            if (visible_inds.length <= MAX_BOXES_DISPLAYED) {
                for (let ind of visible_inds) {
                    let box = boxes_to_add[key]["boxes"][ind];
                    let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                    let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));

                    overlay.context2d().strokeRect(
                        viewer_point.x,
                        viewer_point.y,
                        (viewer_point_2.x - viewer_point.x),
                        (viewer_point_2.y - viewer_point.y)
                    );

                    if (overlay_appearance["style"][key] == "fillRect") {
                        overlay.context2d().fillRect(
                            viewer_point.x,
                            viewer_point.y,
                            (viewer_point_2.x - viewer_point.x),
                            (viewer_point_2.y - viewer_point.y)
                        );
                    }
                }

                if ((key === "prediction") && ("prediction" in boxes_to_add) && ($("#scores_switch").is(":checked"))) {
                    for (let ind of visible_inds) {

                        let box = boxes_to_add[key]["boxes"][ind];
                        let score = boxes_to_add[key]["scores"][ind];
                        
                        let box_width_pct_of_image = (box[3] - box[1]) / overlay.imgWidth;
                        let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                        let box_height_pct_of_image = (box[3] - box[1]) / overlay.imgHeight;
                        let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;

                        if ((disp_width * disp_height) < 10) {
                            continue;
                        }

                        if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {

                            let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
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

    if (gsd != null) {
        let cur_zoom = viewer.viewport.viewportToImageZoom(viewer.viewport.getZoom(true));
        let measure_width = Math.max(50, 0.08 * container_size.x);
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

    if (cur_panel === "annotation") {
        if ((cur_mouse_x != null) && (cur_mouse_y != null)) {

            overlay.context2d().lineWidth = 2;
            overlay.context2d().strokeStyle = overlay_appearance["colors"][cur_edit_layer];
            overlay.context2d().beginPath();
            overlay.context2d().moveTo(0, cur_mouse_y);
            overlay.context2d().lineTo(overlay._containerWidth, cur_mouse_y);
            overlay.context2d().stroke();
            overlay.context2d().closePath();


            overlay.context2d().beginPath();
            overlay.context2d().moveTo(cur_mouse_x, 0);
            overlay.context2d().lineTo(cur_mouse_x, overlay._containerHeight);
            overlay.context2d().stroke();
            overlay.context2d().closePath();
        }
    }

    let zoom_level = viewer.viewport.getZoom(true);
    $("#zoom_level_setting").text(zoom_level.toFixed(2));
    if (zoom_level < 1.1) {
        disable_std_buttons(["engage_grid"]);
    }
    else {
        enable_std_buttons(["engage_grid"]);
    }






        // let top_left = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(bounds[1], bounds[0]));
        // let bot_right = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(bounds[3], bounds[2]));



        // let image_top_left = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(0, 0));
        // let image_bot_right = viewer.viewport.imageToViewerElementCoordinates(
        //     new OpenSeadragon.Point(metadata["images"][cur_img_name]["width_px"],
        //                             metadata["images"][cur_img_name]["height_px"]));
        // //console.log("upper_left", upper_left);
        // //console.log("overlay.imgWidth", overlay.imgWidth);
        // //console.log(viewer.world.getItemAt(0).getContentSize());
        // // let rect = new OpenSeadragon.Rect(
        // //     bounds[1] / overlay.imgWidth,
        // //     bounds[0] / overlay.imgHeight,
        // //     (bounds[3] - bounds[1]) / overlay.imgWidth,
        // //     (bounds[2] - bounds[0]) / overlay.imgHeight
        // // )
            
        // //    upper_left.x, upper_left.y, lower_right.x-upper_left.x, lower_right.y-upper_left.y);
        // overlay.context2d().fillStyle = "#222621";
        // overlay.context2d().strokeRect(
        //     image_top_left.x,// * container_size.x,
        //     image_top_left.y,// * container_size.y,
        //     image_bot_right.x, //(viewer_point_2.x - viewer_point.x),// * container_size.x,
        //     top_left.y //(viewer_point_2.y - viewer_point.y)// * container_size.y
        // );
        // // overlay.context2d().fillRect(
        // //     bot_right.x,// * container_size.x,
        // //     image_top_left.y,// * container_size.y,
        // //     image_bot_right.x, //(viewer_point_2.x - viewer_point.x),// * container_size.x,
        // //     image_bot_right.y //(viewer_point_2.y - viewer_point.y)// * container_size.y
        // // );
        // // overlay.context2d().fillRect(
        // //     image_top_left.x,// * container_size.x,
        // //     bot_right.y,// * container_size.y,
        // //     image_bot_right.x, //(viewer_point_2.x - viewer_point.x),// * container_size.x,
        // //     image_bot_right.y //(viewer_point_2.y - viewer_point.y)// * container_size.y
        // // );
        // // overlay.context2d().fillRect(
        // //     image_top_left.x,// * container_size.x,
        // //     image_top_left.y,// * container_size.y,
        // //     top_left.x, //(viewer_point_2.x - viewer_point.x),// * container_size.x,
        // //     image_bot_right.y //(viewer_point_2.y - viewer_point.y)// * container_size.y
        // // );
        // //console.log("rect", rect);
        // // withFastOSDAnimation(viewer.viewport, function() {
        // //     viewer.viewport.fitBounds(rect);
        // // });
        // //viewer.viewport.fitBounds(rect);
        // //delay(1000).then(() => viewer.viewport.fitBounds(rect));
          


}

// function create_lawnmower_viewer(viewer_id) {

//     lawnmower_viewer = OpenSeadragon({
//         id: viewer_id, //"seadragon_viewer",
//         sequenceMode: true,
//         prefixUrl: get_CC_PATH() + "/osd/images/",
//         tileSources: dzi_image_paths,
//         showNavigator: false,
//         maxZoomLevel: 1000,
//         zoomPerClick: 1,
//         nextButton: "next-btn",
//         previousButton: "prev-btn",
//         showNavigationControl: false,
//         //preserveViewport: true,
//         //homeFillsViewer: true,
//         //defaultZoomLevel: 1
//         //preserveViewport: true,
//         imageSmoothingEnabled: true, //true,
//         //minZoomLevel: 1,
//         //maxZoomLevel: 7
//         //minPixelRatio: 2
//         //maxZoomPixelRatio: 20
//         //homeFillsViewer: true
//         //defaultZoomLevel: 1.1,
//         //viewportMargins: 20
//         //navigatorMaintainSizeRatio: true
//     });
// }



function create_viewer(viewer_id) {

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
        maxZoomLevel: 1000,
        zoomPerClick: 1,
        nextButton: "next-btn",
        previousButton: "prev-btn",
        showNavigationControl: false,
        //preserveViewport: true,
        //homeFillsViewer: true,
        //defaultZoomLevel: 1
        //preserveViewport: true,
        imageSmoothingEnabled: true, //true,
        //minZoomLevel: 1,
        //maxZoomLevel: 7
        //minPixelRatio: 2
        //maxZoomPixelRatio: 20
        //homeFillsViewer: true
        //defaultZoomLevel: 1.1,
        //viewportMargins: 20
        //navigatorMaintainSizeRatio: true
        // showNavigator: true,
        // navigatorId: "navigator_div",
    });

    viewer.innerTracker.keyDownHandler = null;
    viewer.innerTracker.keyPressHandler = null;
    viewer.innerTracker.keyHandler = null;

    overlay = viewer.canvasOverlay({
        clearBeforeRedraw: true
    });

    /*
                
        onRedraw:function() {
    
            //let timestamp = Date.now();
            //if (timestamp - update_time > 1000) {
            //let max_dim = Math.max(overlay.imgWidth, overlay.imgHeight);
            
            //overlay.context2d().font = "0.01px serif";
            //overlay.context2d().fillStyle = "#FF4040";
            // overlay.context2d().fillText("Hello world",     
            //     1000 / max_dim,
            //     1000 / max_dim,
            //     0.01
            // );
    
    
    
                
                if (cur_img_name in predictions) {
                    
    
                    //delay(0.00001).then(() => {
    
                    //let canvas = viewer.drawer.canvas;
                    
                    //let ctx = viewer.drawer.context;
                    //ctx.clearRect(0, 0, this._containerWidth, this._containerHeight);
                    overlay.context2d().font = "bold 15px arial";
                    //ctx.fillStyle = "red"; //"#FF4040";
                    //ctx.strokeStyle = "red"; //"#FF4040";
                    //ctx.fillText("Hello world", 100, 100);
                    //ctx.lineWidth = 2;
    
    
    
    
                    //overlay.context2d().fillStyle = "#FF4040"; //"black"; //"#eb403477";
                    overlay.context2d().strokeStyle = "#FF4040"; //"red";
                    overlay.context2d().lineWidth = 2; //0.00001;
    
                    //let EXTRA_PAD = 10000;
    
                    cur_bounds = viewer.viewport.getBounds();
                    let container_size = viewer.viewport.getContainerSize();
                    let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
    
                    let hw_ratio = overlay.imgHeight / overlay.imgWidth;
                    //let bounds = [cur_bounds.x, cur_bounds.y, cur_bounds.width, cur_bounds.height];
                    let min_x = Math.floor(cur_bounds.x * overlay.imgWidth);// - EXTRA_PAD;
                    let min_y = Math.floor((cur_bounds.y / hw_ratio) * overlay.imgHeight);// - EXTRA_PAD;
                    let viewport_w = Math.ceil(cur_bounds.width * overlay.imgWidth);
                    let viewport_h = Math.ceil((cur_bounds.height / hw_ratio) * overlay.imgHeight);
                    let max_x = min_x + viewport_w;// + EXTRA_PAD;
                    let max_y = min_y + viewport_h;// + EXTRA_PAD;
                    //let max_dim = Math.max(overlay.imgWidth, overlay.imgHeight);
                    //console.log(min_y, min_x, max_y, max_x);
    
    
                    let num_drawn = 0;
                    //let added_boxes = [];
                    
                    for (let i = 0; i < predictions[cur_img_name]["boxes"].length; i++) {
                        //overlay.context2d().fillStyle = "red";
                        //overlay.context2d().strokeWidth = "1";
    
    
                        let box = predictions[cur_img_name]["boxes"][i];
    
                        let score = predictions[cur_img_name]["scores"][i];
                        if (score > slider_val) {
    
                            //let max_x = viewer.viewport.viewportToImageCoordinates(box[3] - overlay.imgWidth);
                            //let min_x = viewer.viewport.viewportToImageCoordinates(box[1] - overlay.imgWidth);
                            // let viewport_top_left = viewer.viewport.pointFromPixel(
                            //     new OpenSeadragon.Point(box[1] / overlay.imgWidth,
                            //     box[0] / overlay.imgWidth));
                            //let viewport_bottom_right = viewer.viewport.pointFromPixel(
                            //box[1] / overlay.imgWidth,
                            // box[0] / overlay.imgWidth);
    
                            let box_width_pct_of_image = (box[3] - box[1]) / overlay.imgWidth;
                            let disp_width = (box_width_pct_of_image / cur_bounds.width) * container_size.x;
    
    
                            if (disp_width < 0.5) {
                                overlay.clear();
                                return
                            }
    
                            //if (disp_width > 1) 
                            else {
    
    
    
                            //let box_disp_width = (box[3] - box[1]) / overlay.imgWidth;
                            //let box_disp_height = (box[2] - box[0]) / overlay.imgWidth;
    
                            //console.log(box_disp_width, box_disp_height);
    
                            //if (box_disp_width > 1e-5) {
    
                                if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
    
    
                                    //console.log("viewport_top_left", viewport_top_left);
    
                                    //overlay.context2d().strokeText(score, 
                                    //overlay.context2d().fillText("Hello world",     
                                    //    box[1],
                                    //    box[0]
                                    //);
                                    //if (num_drawn == 0) {
                                    //    let text_x = (((box[1] / overlay.imgWidth) - cur_bounds.x) * container_size.x) / ; // / cur_bounds.width) * container_size.x;
                                    //    let text_y = (((box[0] / overlay.imgHeight) - cur_bounds.y) / cur_bounds.height)  * container_size.y; // / cur_bounds.height) * container_size.y;
                                        //console.log("text_x, text_y", text_x, text_y);
                                    //}
                                    //if (num_drawn == 0) {
                                    //    console.log("text_x, text_y", text_x, text_y);
                                    //}
    
    
                                    let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                                    let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));
    
                                    //let score_text = score.toString().padEnd(4, "0");
    
                                    //added_boxes.push(box);
    
                                    
                                    // ctx.fillStyle = "white";
                                    // ctx.fillRect(
                                    //     viewer_point.x,// * container_size.x,
                                    //     viewer_point.y - 20,// * container_size.y,
                                    //     35, //ctx.measureText(score).width,// * container_size.x,
                                    //     20// * container_size.y
                                    // );
    
    
                                    // ctx.fillStyle = "black";
                                    // ctx.fillText(score_text, 
    
                                    //     viewer_point.x + 5,// * container_size.x, //text_x,
                                    //     viewer_point.y - 5// * container_size.y//text_y
                                    // );
    
    
                                    //ctx.globalCompositeOperation='destination-over';
    
    
    
                                    overlay.context2d().strokeRect(
                                        viewer_point.x,// * container_size.x,
                                        viewer_point.y,// * container_size.y,
                                        (viewer_point_2.x - viewer_point.x),// * container_size.x,
                                        (viewer_point_2.y - viewer_point.y)// * container_size.y
                                    );
    
                                    //overlay.context2d().fillStyle = "red";
                                    // overlay.context2d().strokeRect(
                                    //     box[1] / max_dim,// * container_size.x,
                                    //     box[0] / max_dim,// * container_size.y,
                                    //     (box[3] - box[1]) / max_dim,// * container_size.x,
                                    //     (box[2] - box[0]) / max_dim// * container_size.y
                                    // );
    
                                    //((box[1] / overlay.imgWidth) / cur_bounds.width) * container_size.x, 
                                    //((box[0] / overlay.imgHeight) / cur_bounds.height) * container_size.y);
    
                                    num_drawn++
                                }
                            //}
                            }
                        }
                    }
                    
                        
                    if ($("#scores_switch").is(":checked")) {
                        for (let i = 0; i < predictions[cur_img_name]["boxes"].length; i++) {
    
                            let box = predictions[cur_img_name]["boxes"][i];
                            let score = predictions[cur_img_name]["scores"][i];
                            if (score > slider_val) {
                                
                                let box_width_pct_of_image = (box[3] - box[1]) / overlay.imgWidth;
                                let disp_width = (box_width_pct_of_image / cur_bounds.width) * container_size.x;
    
    
                                if (disp_width > 1) {
                                    if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
    
    
                                        let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                                        //let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));
    
                                        let score_text = score.toString().padEnd(4, "0");
    
                                        // overlay.context2d().fillStyle = "white";
                                        // overlay.context2d().fillRect(
                                        //     box[1] / max_dim,// * container_size.x,
                                        //     box[0] / max_dim,// * container_size.y,
                                        //     (box[3] - box[1]) / max_dim,// * container_size.x,
                                        //     (box[2] - box[0]) / max_dim// * container_size.y
                                        // );
    
                                        // overlay.context2d().font = "bold 0.001em serif";
                                        
                                        // overlay.context2d().fillStyle = "black";
                                        // overlay.context2d().scale(10, 10);
                                        // overlay.context2d().fillText(score_text, 
    
                                        //     box[1] / max_dim, // + 5,// * container_size.x, //text_x,
                                        //     box[0] / max_dim //viewer_point.y - 5// * container_size.y//text_y
                                        // );
                                        
    
                                        overlay.context2d().fillStyle = "white";
                                        overlay.context2d().fillRect(
                                                viewer_point.x,// * container_size.x,
                                                viewer_point.y - 20,// * container_size.y,
                                                40, //ctx.measureText(score).width,// * container_size.x,
                                                20// * container_size.y
                                            );
    
    
    
    
                                            overlay.context2d().fillStyle = "black";
                                            overlay.context2d().fillText(score_text, 
    
                                                viewer_point.x + 5,// * container_size.x, //text_x,
                                                viewer_point.y - 5// * container_size.y//text_y
                                            );
                                    }
                                }
                            }
                        }
                    }
                            
                            
                            //i / 10000, i/ 10000, 0.0001, 0.0001);
                    //console.log("added boxes", num_drawn);
                    //update_time = Date.now();
                    //});
                //}
                }
        },
        clearBeforeRedraw: true
    });
*/








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

    

    //viewer.innerTracker.keyDownHandler = async function(e) {

/*
    viewer.addHandler("open", function(event) {

        if (cur_bounds) {
            withFastOSDAnimation(viewer.viewport, function() {
                viewer.viewport.fitBounds(cur_bounds);
            });
        }
        
    });*/

    // $("#seadragon_viewer").keydown(function(e) {
    //     keydown_handler(e);
    // });


    $("#seadragon_viewer").on("pointermove", function(event) {
        if (cur_panel === "annotation") {
            $("#seadragon_viewer").css("cursor", "none");
            cur_mouse_x = event.offsetX;
            cur_mouse_y = event.offsetY;
            overlay.clear();
            if ($("#engaged_grid_controls").is(":visible")) {
                gridview_onRedraw();
            }
            else {
                anno_and_pred_onRedraw();
            }
        }
        else {
            $("#seadragon_viewer").css("cursor", "default");
        }
    });

    // $("#seadragon_viewer").on("click", function(event) {
    //     console.log("mousedown");

    //     if (cur_panel === "annotation") {
    //         $("#seadragon_viewer").css("cursor", "none");
    //         cur_mouse_x = event.offsetX;
    //         cur_mouse_y = event.offsetY;
    //         overlay.clear();
    //         anno_and_pred_onRedraw();
    //     }
    //     else {
    //         $("#seadragon_viewer").css("cursor", "default");
    //     }
    // });



    // $("#seadragon_viewer").on("mousemove", function(event) {
    //     console.log("pointermove");

    //     let webPoint = {x: event.offsetX, y: event.offsetY};
    //     console.log(webPoint);
    //     // let viewportPoint = viewer.viewport.pointFromPixel(webPoint);
    //     // let imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);


    //     //console.log("webPoint", webPoint);
    //     //let webPoint = new OpenSeadragon.Point(image_x, image_y);
    //     // let viewer_point_1 = viewer.viewport.imageToViewerElementCoordinates(
    //     //     new OpenSeadragon.Point(0, 0));
    //     // let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(
    //     //         new OpenSeadragon.Point(overlay.imgWidth, overlay.imgHeight));



    //     // let p1 = viewer.viewport.imageToViewerElementCoordinates(
    //     //     new OpenSeadragon.Point(0, imagePoint[1]));
    //     // let p2 = viewer.viewport.imageToViewerElementCoordinates(
    //     //     new OpenSeadragon.Point(overlay.imgWidth, imagePoint[1]));         
    //     overlay.context2d().clearRect(0, 0, overlay._containerWidth, overlay.containerHeight);   
    //     overlay.context2d().beginPath();
    //     overlay.context2d().moveTo(0, webPoint.y); //p1.x, p1.y);
    //     overlay.context2d().lineTo(overlay._containerWidth, webPoint.y);
    //     overlay.context2d().stroke();
    //     overlay.context2d().closePath();
    // });

    
    viewer.addHandler('canvas-click', function(event) {
        //console.log("canvas-click");

    //$("#seadragon_viewer").click(function(event) { 
        //console.log("canvas-click");
        //let image_x = event.pageX - $(this).offset().left;
        //let image_y = event.pageY - $(this).offset().top;
        //event.stopPropagation();
    

        // The canvas-click event gives us a position in web coordinates.

        if (!(anno.readOnly)) {


            //console.log("canvas-click");

            //console.log("getting selected");
            //let selected = anno.getSelected();
            //console.log("got selected", selected);
            //if (selected == null) {

            /*
            if (selected_annotation != null) {
                anno.updateSelected(selected_annotation, true);
            }*/
            if (selected_annotation_index == -1) {
                //console.log("IF", selected_annotation_index, selected_annotation);

                //delay(1).then(() => anno.clearAnnotations());
                //let selected = anno.getSelected();

                /*
                if (selected_annotation_index != -1) {
                    let selected = anno.getSelected();
                    let px_str = selected.target.selector.value;
                    let updated_px_str = resize_px_str(px_str);
                    updated_px_str = updated_px_str.substring(11);
                    let px_lst = updated_px_str.split(",").map(x => parseFloat(x));
                    annotations[cur_img_name]["boxes"][selected_annotation_index] = [px_lst[1], px_lst[0], px_lst[1] + px_lst[3], px_lst[0] + px_lst[2]];

                }
                
                */
                //if (selected != null) {
                //    anno.updateSelected(selected, true);
                //await anno.updateSelected(selection);
                //anno.saveSelected();
                //anno.cancelSelected();
                //}

                //let edit_layer = $('input[name=edit_layer_radio]:checked').val();
                //console.log("edit_layer", edit_layer);


                

                let annotation_uuid = null;

   

                let webPoint = event.position;
                //console.log(typeof(webPoint));

                //console.log("webPoint", webPoint);
                //let webPoint = new OpenSeadragon.Point(image_x, image_y);
                let viewportPoint = viewer.viewport.pointFromPixel(webPoint);
                let imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
                //overlay.clear();

                //let prev_annotation_index = selected_annotation_index;
                selected_annotation_index = -1;
                //selected_annotation_index = -1;

                let inside_box = false;
                let candidate_box_areas = [];
                let candidate_box_indices = [];
                let sel_box_array;
                if (cur_edit_layer === "annotation") {
                    sel_box_array = annotations[cur_img_name]["boxes"];
                }
                else if (cur_edit_layer === "region_of_interest") {
                    sel_box_array = annotations[cur_img_name]["regions_of_interest"];
                }
                else if (cur_edit_layer === "training_region") {
                    sel_box_array = annotations[cur_img_name]["training_regions"];
                }
                else {
                    sel_box_array = annotations[cur_img_name]["test_regions"];
                }


                if (cur_edit_layer === "region_of_interest") {
                    for (let i = 0; i < sel_box_array.length; i++) {
                        let poly = sel_box_array[i];
                        if (point_is_inside_polygon([imagePoint.y, imagePoint.x], poly)) {
                            //console.log("inside");
                            inside_box = true;
                            let area = get_polygon_area(poly); //get_bounding_box_for_polygon(poly);
                            //let bbox_area = (bbox[3] - bbox[1]) * (bbox[2] - bbox[0]);
                            candidate_box_areas.push(area);
                            candidate_box_indices.push(i);
                        }
                    }

                }
                else {

                    for (let i = 0; i < sel_box_array.length; i++) {//annotations[cur_img_name]["boxes"].length; i++) {

                        //let box = annotations[cur_img_name]["boxes"][i];
                        let box = sel_box_array[i];
                        if ((imagePoint.x >= box[1] && imagePoint.x <= box[3]) && (imagePoint.y >= box[0] && imagePoint.y <= box[2])) {
                            


                            if ((cur_edit_layer !== "training_region") || (!(locked_training_regions[cur_img_name][i]))) {
                                inside_box = true;
                                //if (i == prev_annotation_index) {
                                //    break;
                                //}
                                //console.log("clicked on a box");


                                //annotations[cur_img_name]["boxes"].splice(i, 1);

                                let box_area = (box[3] - box[1]) * (box[2] - box[0]);

                                candidate_box_areas.push(box_area);
                                //selected_annotation_index = i;
                                candidate_box_indices.push(i);
                            }

                            //anno.addAnnotation(annotation);
                            //anno.createAnnotation(annotation);
                            //anno.saveSelected();
                            //await anno.updateSelected(annotation);
                            //anno.selectAnnotation(annotation_uuid);
                            //let sel_annotation = anno.getSelected();

                            //anno.selectAnnotation(annotation_uuid);


                            //anno.selectAnnotation(annotation_uuid);
                            //console.log("sel_annotation", sel_annotation);
                            //anno.selectAnnotation(annotation_uuid);
                            //break;
                            

                        }
                    }
                }
                if (candidate_box_indices.length > 0) {
                    selected_annotation_index = candidate_box_indices[argMin(candidate_box_areas)];
                }
                //console.log("prev, selected", prev_annotation_index, selected_annotation_index);

                //if (selected != null && !(inside_box)) {
                //    console.log("RETURNING");
                //    return;
                //}

                //viewer.raiseEvent('update-viewport');
                //console.log("update-viewport finished");


                if (inside_box) { // && (selected_annotation_index != prev_annotation_index)) {
                    let box = sel_box_array[selected_annotation_index];

                    if (cur_edit_layer === "annotation") {
                        for (let i = 0; i < annotations[cur_img_name]["training_regions"].length; i++) {
                            if ((box_intersects_region(box, annotations[cur_img_name]["training_regions"][i])) && (locked_training_regions[cur_img_name][i])) {

                                selected_annotation_index = -1;
                                return;
                            }
                        }
                    }
                    annotation_uuid = uuidv4();
                    let box_str;
                    let selector_type;
                    if (cur_edit_layer === "region_of_interest") {
                        let pt_strs = [];
                        for (let i = 0; i < box.length; i++) {
                            pt_strs.push(box[i][1] + "," + box[i][0]);
                        }
                        box_str = `<svg><polygon points="` + pt_strs.join(" ") + `"></polygon></svg>`;
                        selector_type = "SvgSelector";

                    }
                    else {
                        box_str = [box[1], box[0], (box[3] - box[1]), (box[2] - box[0])].join(",");
                        box_str = "xywh=pixel:" + box_str;
                        selector_type = "FragmentSelector";

                    }
                    selected_annotation = {
                        "type": "Annotation",
                        "body": [
                            {
                                type: 'TextualBody',
                                purpose: 'class',
                                value: 'object'
                            }
                        ],
                        "target": {
                            "source": "",
                            "selector": {
                                "type": selector_type,
                                "conformsTo": "http://www.w3.org/TR/media-frags/",
                                "value": box_str
                            }
                        },
                        "@context": "http://www.w3.org/ns/anno.jsonld",
                        "id": annotation_uuid
                    };

                    if (cur_edit_layer === "region_of_interest")  {
                        selected_annotation["body"].push({"value": "region_of_interest", "purpose": "highlighting"});
                    }
                    else if (cur_edit_layer === "training_region")  {
                        selected_annotation["body"].push({"value": "training_region", "purpose": "highlighting"});
                    }
                    else if (cur_edit_layer === "test_region") {
                        selected_annotation["body"].push({"value": "test_region", "purpose": "highlighting"});
                    }

                    /*
                    const secondFunction = async () => {
                        await anno.addAnnotation(selected_annotation);
                        anno.selectAnnotation(selected_annotation);
                    }
                    secondFunction();
                    */
                    anno.clearAnnotations();
                    anno.addAnnotation(selected_annotation); //.then(() => anno.selectAnnotation(selected_annotation));
                    // if (anno.getSelected() == null) {
                    //     anno.selectAnnotation(selected_annotation);
                    // }
                    delay(10).then(() => {
                        // sometimes the annotation is selected, but sometimes it isn't?? if not selected, select it now.
                        if (anno.getSelected() == null) {
                            anno.selectAnnotation(selected_annotation);
                        }
                    });

                    // delay(10).then(() => {
                    //     anno.selectAnnotation(selected_annotation);
                    //     //viewer.raiseEvent('update-viewport');
                    // });
                    //anno.selectAnnotation(selected_annotation);

                    // let selected = anno.getSelected();
                    // console.log("THERE IS THIS SELECTED", selected);
                    // if (selected == null) {
                    //     anno.selectAnnotation(selected_annotation);
                    // }
                    //anno.selectAnnotation(selected_annotation)
                    //anno.selectAnnotation(the_thing);
                    
                    //delay(1).then(() => anno.selectAnnotation(selected_annotation));

                    // add_the_annotation(annotation);
                    
                    //anno.selectAnnotation(annotation_uuid);
                

                }
                viewer.raiseEvent('update-viewport');
                /*
                if (inside_box) {
                    console.log("SELECTING AN ANNOTATION", selected_annotation);
                    anno.selectAnnotation(selected_annotation)
                    //delay(1).then(() => anno.selectAnnotation(selected_annotation));
                }*/
            //}


            //}

            
            //else {
                //anno.clearAnnotations();
                //selected_annotation_index = -1;
                //viewer.raiseEvent('update-viewport');

            //}
            //else {
                //anno.clearAnnotations();
                //selected_annotation_index = -1;
                //viewer.raiseEvent('update-viewport');
            }
            else {
                //console.log("ELSE", selected_annotation_index, selected_annotation);
                //let cur_selected = anno.getSelected();
                //anno.updateSelected(selected_annotation, true);
                
                let cur_selected = anno.getSelected();
                if (cur_selected == null) {
                    let webPoint = event.position;
                    let viewportPoint = viewer.viewport.pointFromPixel(webPoint);
                    let imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);

                    let px_str = selected_annotation.target.selector.value;
                    px_str = px_str.substring(11);
                    let px_lst = px_str.split(",").map(x => parseFloat(x));
                    let box = [
                        Math.round(px_lst[1]), 
                        Math.round(px_lst[0]), 
                        Math.round(px_lst[1] + px_lst[3]), 
                        Math.round(px_lst[0] + px_lst[2])
                    ];

                    if ((imagePoint.x >= box[1] && imagePoint.x <= box[3]) && (imagePoint.y >= box[0] && imagePoint.y <= box[2])) {
                        anno.clearAnnotations();
                        anno.addAnnotation(selected_annotation);
                        delay(10).then(() => anno.selectAnnotation(selected_annotation));
                        //anno.selectAnnotation(selected_annotation);
                    }
                    else {
                        selected_annotation_index = -1;
                        selected_annotation = null;
                        anno.clearAnnotations();
                        viewer.raiseEvent('update-viewport');
    
                    }

                }
                else {
                    anno.updateSelected(selected_annotation, true);
                }

            }
        }

    });



}




function build_map() {
    disable_buttons(["build_map_button"]);
    $("#build_loader").show();

    let sel_interpolation = $("input[type='radio'][name='interpolation']:checked").val();

    if (metadata["is_ortho"] === "yes") {
        map_chart_tile_size = $("#tile_size_slider").val();
    }
    else {
        map_chart_tile_size = "";
    }


    $.post($(location).attr('href'),
    {
        action: "build_map",
        interpolation: sel_interpolation,
        tile_size: map_chart_tile_size
    },
    
    function(response, status) {
        $("#build_loader").hide();
        enable_buttons(["build_map_button"]);

        if (response.error) {  
            show_modal_message("Error", "An error occurred during the generation of the density map.");  
        }
        else {

            let timestamp = new Date().getTime();   
            
            let base = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
                    image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/maps/" + sel_interpolation;

            map_url = base + "_predicted_map.svg?t=" + timestamp;

            let min_max_rec_url = base + "_min_max_rec.json?t=" + timestamp;

            $.getJSON(min_max_rec_url, function(data) {
                min_max_rec = data;
                draw_map_chart();
            });
        }
    });


}

async function show_map() {

    await unselect_selected_annotation();

    cur_bounds = null;
    overlay.onOpen = function() {};
    overlay.onRedraw = function() {};
    viewer = null;
    $("#seadragon_viewer").empty();


    cur_view = "map";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-image" style="padding-right: 10px; color: white;"></i>Image View`);

    //$("#initialize_container").hide();
    $("#image_view_container").hide();
    $("#map_view_container").show();

    let map_can_be_built = (Object.keys(predictions).length == Object.keys(annotations).length);
    // if (Object.keys(predictions).length == Object.keys(annotations).length) {
    //     if (metadata["is_ortho"] === "yes") {
    //         map_can_be_built = true;
    //     }
    //     else {
    //         if (Object.keys(annotations).length >= 3) {
    //             map_can_be_built = true;
    //         }
    //     }
    // }


    // let num_completed = 0;
    // for (let image_name of Object.keys(annotations)) {

    //     let image_width_px = metadata["images"][image_name]["width_px"];
    //     let image_height_px = metadata["images"][image_name]["height_px"];

    //     if (image_is_fully_annotated(annotations, image_name, image_width_px, image_height_px)) {
    //         num_completed++;
    //     }
        
    //     // if (annotations[image_name]["status"] == "completed_for_training" ||
    //     //     annotations[image_name]["status"] == "completed_for_testing") {
    //     //     num_completed++;
    //     // }
    // }

    if (map_can_be_built) {
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



    change_image(image_name + "/" + cur_region_index);
    //change_image(image_name + "/0");
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

function continue_with_save() {
    close_modal();
    save_annotations();
}

function save_annotations() {


    $("#save_button").hide();
    $("#fake_save_button").show();

    let new_training_regions = 0;
    for (let image_name of Object.keys(annotations)) {
        for (let i = 0; i < locked_training_regions[image_name].length; i++) {
            if (!(locked_training_regions[image_name][i])) {
                new_training_regions++;
            }
        }
        for (let key of ["boxes", "training_regions", "test_regions"]) {
            for (let i = 0; i < annotations[image_name][key].length; i++) {
                box = annotations[image_name][key][i];
                annotations[image_name][key][i] = [
                    Math.round(box[0]),
                    Math.round(box[1]),
                    Math.round(box[2]),
                    Math.round(box[3])
                ];
            }
        }
        for (let i = 0; i < annotations[image_name]["regions_of_interest"].length; i++) {
            //let roi = annotations[image_name]["regions_of_interest"][i];
            for (let j = 0; j < annotations[image_name]["regions_of_interest"][i].length; j++) {
                annotations[image_name]["regions_of_interest"][i][j] = [
                    Math.round(annotations[image_name]["regions_of_interest"][i][j][0]), 
                    Math.round(annotations[image_name]["regions_of_interest"][i][j][1])
                ];
            }

        }
    }
    if ((cur_panel === "annotation" || cur_panel === "prediction")) {
        overlay.clear();
        if ($("#engaged_grid_controls").is(":visible")) {
            gridview_onRedraw();
        }
        else {
            anno_and_pred_onRedraw();
        }
    }

    $.post($(location).attr('href'),
    {
        action: "save_annotations",
        annotations: JSON.stringify(annotations),
        excess_green_record: JSON.stringify(excess_green_record),
        tags: JSON.stringify(tags),
        is_public: metadata["is_public"],
        //train_num_increased: train_num_increased ? "True" : "False"
        num_training_regions_increased: new_training_regions > 0 ? "yes" : "no",
        object_name: metadata["object_name"]
    },
    
    function(response, status) {
        
        if (response.error) {
            //create_image_set_table();
            show_modal_message("Error", "An error occurred while saving: " + response.message);
        }
        else {
            //let model_fully_trained = true;
            for (let image_name of Object.keys(annotations)) {
                for (let i = 0; i < locked_training_regions[image_name].length; i++) {
                    locked_training_regions[image_name][i] = true;
                    // if (!(locked_training_regions[i])) {
                    //     locked_training_regions[i] = true;
                    //     //model_fully_trained = false;
                    // }
                }
            }


            /*
            train_num_increased = false;
            num_training_images = 0;
            for (image_name of Object.keys(annotations)) {
                if (annotations[image_name]["status"] === "completed_for_training") {
                    num_training_images++;
                }
            }*/

            let num_training_regions = get_num_regions(["training_regions"]);
            if (!(model_unassigned)) {


                let fully_trained = num_training_regions == num_regions_fully_trained_on;
                let fine_tuned = num_training_regions > 0;
                // let updated_fined_tuned_html;
                // if (fine_tuned) {
                //     if (fully_trained) {
                //         updated_fined_tuned_html = `Yes <i style="margin-left: 40px" class="fa-solid fa-check"></i>`;
                //     }
                //     else {
                //         updated_fined_tuned_html = `Yes<i style="margin-left: 40px" class="fa-solid fa-spinner fa-spin"></i>`;
                //     }
                // }
                // else {
                //     updated_fined_tuned_html = `No`;
                // }
                
                // //if (model_fully_trained)
                // // if ((num_training_regions == num_regions_fully_trained_on) && (num_training_regions > 0)) {
                // //     $("#model_fully_fine_tuned").html("Yes");
                // // }
                // // else {
                // //     $("#model_fully_fine_tuned").html("No");
                // // }
                // // if (num_training_regions > 0) {
                // //     $("#model_fine_tuned").html("Yes");
                // // }
                // // else {
                // //     $("#model_fine_tuned").html("No");
                // // }
                // if ($("#model_fine_tuned").html() !== updated_fined_tuned_html) {
                //     $("#model_fine_tuned").html(updated_fined_tuned_html);
                // }

                $("#regions_fully_fine_tuned_on").html(`Fully trained on <span style="color: white">${num_regions_fully_trained_on}</span> of <span style="color: white">${num_training_regions}</span> available fine-tuning regions.`);
            }
            
            //create_image_set_table();
            $("#save_icon").css("color", "white");
            $("#fake_save_button").hide();
            $("#save_button").show();
        }
    });

}


// function save_annotations_for_image_set() {

//     $("#save_button").hide();
//     $("#fake_save_button").show();


//     $.post($(location).attr('href'),
//     {
//         action: "save_annotations_for_image_set",
//         annotations: JSON.stringify(annotations),
//         excess_green_record: JSON.stringify(excess_green_record),
//         //is_ortho: metadata["is_ortho"],
//         //train_num_increased: train_num_increased ? "True" : "False"
//         num_training_images_increased: train_num_increased ? "yes" : "no"
//     },
    
//     function(response, status) {
        
//         if (response.error) {
//             //create_image_set_table();
//             show_modal_message("Error", "Failed to save.");
//         }
//         else {
            
//             //train_num_increased = false;
//             num_training_images = 0;
//             for (image_name of Object.keys(annotations)) {
//                 if (annotations[image_name]["status"] === "completed_for_training") {
//                     num_training_images++;
//                 }
//             }
//             if (model_unassigned) {
//                 $("#model_fully_trained").html("---");
//                 $("#model_fine_tuned").html("---");
//             }
//             else {
//                 if (num_training_images == num_images_fully_trained_on) {
//                     $("#model_fully_trained").html("Yes");
//                 }
//                 else {
//                     $("#model_fully_trained").html("No");
//                 }
//                 if (num_training_images > 0) {
//                     $("#model_fine_tuned").html("Yes");
//                 }
//                 else {
//                     $("#model_fine_tuned").html("No");
//                 }
//             }
            
//             create_image_set_table();
//             $("#save_icon").css("color", "white");
//             $("#fake_save_button").hide();
//             $("#save_button").show();
//         }
//     });

// }




// function confirmed_continue() {
//     clearInterval(countdown_handle);
//     close_modal();
//     ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000);
// }

// function ask_to_continue() {
    
//     $("#modal_head").empty();
//     $("#modal_body").empty();

//     $("#modal_head").append(
//         `<p>Refresh Annotation Session</p>`);
    

//     $("#modal_body").append(`<p id="modal_message" align="left">` +
//     `Your annotation session will expire in <span id="countdown_timer">180</span> seconds. Please confirm if you wish to continue annotating.</p>`);
//     let countdown_val = 180;
//     countdown_handle = window.setInterval(function() {
//         countdown_val -= 1;
//         $("#countdown_timer").html(countdown_val);

//         if (countdown_val == 0) {
//             clearInterval(countdown_handle);
//             expired_session();
//         }
//     }, 1000);

    
//     $("#modal_body").append(`<div id="modal_button_container">
//         <button id="continue_annotate" class="std-button std-button-hover" `+
//         `style="width: 200px" onclick="confirmed_continue()">Continue Annotating</button>` +
//         `</div>`);

    
//     $("#modal").css("display", "block");
// }

/*
$(window).bind('beforeunload', function(event){

    $.post($(location).attr('href'),
    {
        action: "expired_lock_file"
    },
    
    function(response, status) {

    });
});*/




function confirmed_use_predictions() {

    let navigation_type = $('#navigation_dropdown').val();

    /* Delete old boxes */
    let region;
    if (navigation_type === "images") {
        annotations[cur_img_name]["boxes"] = [];
        region = null;
    }
    else if (navigation_type == "regions_of_interest") {
        region = annotations[cur_img_name][navigation_type][cur_region_index];
        for (let i = 0; i < annotations[cur_img_name]["boxes"].length; i++) {
            let box = annotations[cur_img_name]["boxes"][i];
            // let box_poly = [[box[0], box[1]], [box[0], box[3]], [box[2], box[3]], [box[2], box[1]]];
            // let intersection_poly = clip_polygons(region, box_poly);
            // if (intersection_poly.length > 0) {
            //     annotations[cur_img_name]["boxes"].splice(i, 1);
            // }
            //let centre = [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];
            
            // not correct, but hopefully close enough
            if (point_is_inside_polygon([box[0], box[1]], region) ||
                point_is_inside_polygon([box[0], box[3]], region) ||
                point_is_inside_polygon([box[2], box[3]], region) ||
                point_is_inside_polygon([box[2], box[1]], region)
            ) {
            //if (point_is_inside_polygon(centre, region)) {
                annotations[cur_img_name]["boxes"].splice(i, 1);
            }
        }
    }
    else {
        region = annotations[cur_img_name][navigation_type][cur_region_index];
        for (let i = 0; i < annotations[cur_img_name]["boxes"].length; i++) {
            let box = annotations[cur_img_name]["boxes"][i];
            if (box_intersects_region(box, region)) {
                annotations[cur_img_name]["boxes"].splice(i, 1);
            }
        }
    }

    /* Add new boxes */
    let slider_val = Number.parseFloat($("#confidence_slider").val()); //.toFixed(2);
    for (let i = 0; i < predictions[cur_img_name]["scores"].length; i++) {
        if (predictions[cur_img_name]["scores"][i] > slider_val) {
            let box = predictions[cur_img_name]["boxes"][i];
            if (navigation_type === "images") {
                annotations[cur_img_name]["boxes"].push(box);
            }
            else if (navigation_type == "regions_of_interest") {
                //region = annotations[cur_img_name][navigation_type][cur_region_index];
                //let box_poly = [[box[0], box[1]], [box[0], box[3]], [box[2], box[3]], [box[2], box[1]]]; //[[box[0], box[1]], [box[0], box[3]], [box[2], box[3]], [box[2], box[1]]];
                // let box_poly = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]];
                // region.push(region[0]);
                // box_poly.push(box_poly[0]);
                // let intersection_poly = clip_polygons(region, box_poly);
                // console.log("intersection_poly", intersection_poly);
                // if (intersection_poly.length > 0) {
                //     annotations[cur_img_name]["boxes"].push(box);
                // }
                //let centre = [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];
                //if (point_is_inside_polygon(centre, region)) {
                if (point_is_inside_polygon([box[0], box[1]], region) ||
                    point_is_inside_polygon([box[0], box[3]], region) ||
                    point_is_inside_polygon([box[2], box[3]], region) ||
                    point_is_inside_polygon([box[2], box[1]], region)
                ) {
                    annotations[cur_img_name]["boxes"].push(box);
                }
            }



            else {
                if (box_intersects_region(box, region)) {
                    annotations[cur_img_name]["boxes"].push(box);
                }
            }
        }
    }
    annotations[cur_img_name]["source"] = "unmodified_model_predictions";
    //annotations[cur_img_name]["predictions_used_as_annotations"] = true;
    
/*
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
    }*/
    //$("#save_icon").css("color", "#ed452b");
    close_modal();
    //update_image_status();
    //set_image_status_combo();
    //return_to_annotate();

    // update_image_status();
    // set_image_status_combo();
    $("#save_icon").css("color", "#ed452b");
    // create_image_set_table();


    show_annotation();
}


async function show_annotation(change_image=false) {

    await unselect_selected_annotation();

    let prev_panel = cur_panel;

    $("#show_annotation_button").addClass("tab-btn-active");
    $("#show_prediction_button").removeClass("tab-btn-active");
    $("#show_segmentation_button").removeClass("tab-btn-active");

    
    // if (((viewer == null) || (force_reset)) || (cur_panel === "segmentation"))
    //     cur_bounds = null;
    // else
    //     cur_bounds = viewer.viewport.getBounds();


    cur_panel = "annotation";
    //$("#segmentation_viewer").hide();
    $("#prediction_panel").hide();
    $("#segmentation_panel").hide();
    //$("#seadragon_viewer").show();
    $("#annotation_panel").show();



    if (viewer == null) {
        $("#seadragon_viewer").empty();
        create_viewer("seadragon_viewer");
    }


    overlay.onOpen = function() {
        set_cur_bounds();
    };



    

    // let dzi_image_path = image_to_dzi[cur_img_name];
    // viewer.open(dzi_image_path);

    //$("#seadragon_viewer").empty();


    //create_viewer_and_anno("seadragon_viewer");
    cur_mouse_x = null;
    cur_mouse_y = null;


    
    overlay.onRedraw = anno_and_pred_onRedraw;

    viewer.zoomPerScroll = 1.2;
    viewer.panHorizontal = true;
    viewer.panVertical = true;


    // let navigation_type = $("#navigation_dropdown").val();
    //anno.readOnly = (navigation_type !== "images");
    anno.readOnly = false;

    // if (navigation_type !== "images") {
    //     disable_std_buttons(["gridview_button"]);
    // }
    // else {
    //     enable_std_buttons(["gridview_button"]);
    // }

    //anno.readOnly = false; //false; //annotations[cur_img_name]["status"] === "completed_for_training";
    //anno.disableSelect = true;

/*
    let navigation_type = $("#navigation_dropdown").val();
    if (navigation_type === "training_regions" || navigation_type === "test_regions") {
        console.log("zooming to region");
        let bounds = annotations[cur_img_name][navigation_type][cur_region_index];
        console.log("bounds", bounds);
        let upper_left = viewer.viewport.imageToViewportCoordinates(bounds[1], bounds[0]);
        let lower_right = viewer.viewport.imageToViewportCoordinates(bounds[3], bounds[2]);
        console.log("upper_left", upper_left);
        console.log("overlay.imgWidth", overlay.imgWidth);
        //console.log(viewer.world.getItemAt(0).getContentSize());
        let rect = new OpenSeadragon.Rect(
            bounds[1] / overlay.imgWidth,
            bounds[0] / overlay.imgHeight,
            (bounds[3] - bounds[1]) / overlay.imgWidth,
            (bounds[2] - bounds[0]) / overlay.imgHeight
        )
            
        //    upper_left.x, upper_left.y, lower_right.x-upper_left.x, lower_right.y-upper_left.y);
        console.log("rect", rect);
        // withFastOSDAnimation(viewer.viewport, function() {
        //     viewer.viewport.fitBounds(rect);
        // });
        //viewer.viewport.fitBounds(rect)
        //delay(1000).then(() => viewer.viewport.fitBounds(rect));
    }
    else {
        //viewer.world.resetItems();
        //overlay._updateCanvas();
        //viewer.raiseEvent('update-viewport');
    }*/
    //viewer.raiseEvent('update-viewport');
    //add_annotations();

    if (change_image || prev_panel == "segmentation") {
        let dzi_image_path = image_to_dzi[cur_img_name];
        viewer.open(dzi_image_path);      
    } 
    else {
        viewer.world.resetItems();
    }
    //let dzi_image_path = image_to_dzi[cur_img_name];
    //viewer.open(dzi_image_path);
    //viewer.viewport.goHome();



    if (!($("#control_panel").is(":visible"))) {
        $("#gridview_button").click();
    }
        // if ($("#control_panel").is(":visible")) {


}

async function unselect_selected_annotation() {
    if (selected_annotation != null) {
        
        let cur_selected = anno.getSelected();
        if (cur_selected == null) {
            anno.clearAnnotations();
            selected_annotation_index = -1;
            selected_annotation = null;
            viewer.raiseEvent('update-viewport');
        }
        else {
            await anno.updateSelected(selected_annotation, true);
        }
    }
}



async function show_prediction(change_image=false) {

    await unselect_selected_annotation();

    // let source_dimensions = viewer.world.getItemAt(0).source.dimensions;

    let prev_panel = cur_panel;

    $("#show_annotation_button").removeClass("tab-btn-active");
    $("#show_prediction_button").addClass("tab-btn-active");
    $("#show_segmentation_button").removeClass("tab-btn-active");

    // if (((viewer == null) || (force_reset)) || (cur_panel === "segmentation"))
    //     cur_bounds = null;
    // else
    //     cur_bounds = viewer.viewport.getBounds();

    // console.log("CUR BOUNDS", cur_bounds);


    /*
    else {
        let cur_selected = anno.getSelected();
        if (cur_selected == null) {
    }*/ //GET_BACK
    /*
    anno.clearAnnotations();
    viewer.raiseEvent('update-viewport');*/

    //anno.cancelSelected();
    //viewer.raiseEvent('update-viewport');
    
    cur_panel = "prediction";


    $("#annotation_panel").hide();
    $("#segmentation_panel").hide();
    $("#prediction_panel").show();
    //$("#seadragon_viewer").show();

    //$("#seadragon_viewer").empty();

    if (viewer == null) {
        $("#seadragon_viewer").empty();
        create_viewer("seadragon_viewer");
    }

    overlay.onOpen = function() {
        set_cur_bounds();
    };

    overlay.onRedraw = anno_and_pred_onRedraw;


    //let cur_bounds_str;
    // if (metadata["is_ortho"] == "yes") {
        //viewer.setControlsEnabled(false);
        //viewer.setMouseNavEnabled(false);
        //cur_bounds = viewer.viewport.getBounds();
        // console.log("cur_bounds", cur_bounds);
        // let min_px_coord = viewer.viewport.viewportToImageCoordinates(cur_bounds.x, cur_bounds.y);
        // let max_px_coord = viewer.viewport.viewportToImageCoordinates(cur_bounds.x + cur_bounds.width, cur_bounds.y + cur_bounds.height);

        // console.log("min_px_coord", min_px_coord);
        // console.log("max_px_coord", max_px_coord);        
        //console.log("source_dimensions", source_dimensions);
        // cur_bounds_str = [
        //     cur_bounds.x, cur_bounds.y, cur_bounds.width, cur_bounds.height
        //     //Math.max(0, Math.round(min_px_coord.y)), 
        //     //Math.max(0, Math.round(min_px_coord.x)), 
        //     //Math.min(source_dimensions.y, Math.round(max_px_coord.y)),
        //     //Math.min(source_dimensions.x, Math.round(max_px_coord.x))
        //     // Math.round(min_px_coord.y), Math.round(min_px_coord.x),  Math.round(max_px_coord.y),  Math.round(max_px_coord.x)
        // ].join(",");
        // show_modal_message(`Retrieving Predictions`, `<div id="retrieve_predictions_loader" class="loader"></div>`);
    // }
    // else {
    //     cur_bounds_str = "";
    // }


    $("#predictions_unavailable").hide();
    $("#predictions_available").hide();
    
    update_count_combo(false);
    set_count_chart_data();
    set_score_chart_data();
    update_score_chart();
    update_count_chart();
    


    if (cur_img_name in predictions) {
        $("#predictions_available").show();

        // set_count_chart_data();
        // set_score_chart_data();
        // update_score_chart();
        // update_count_chart();
    }
    else {
        $("#predictions_unavailable").show();
    }

    //compute_voronoi();

    viewer.zoomPerScroll = 1.2;
    anno.readOnly = true;
    
    if (change_image || prev_panel == "segmentation") {
        let dzi_image_path = image_to_dzi[cur_img_name];
        viewer.open(dzi_image_path);      
    } 
    else {
        viewer.world.resetItems();
    }
    
    
/*

    if (!(cur_img_name in predictions)) {
        $("#predictions_loading").show();
        //$("#seadragon_viewer").append(`<div class="loader"></div>`);

        $.post($(location).attr('href'),
        {
            action: "retrieve_predictions",
            image_name: cur_img_name, //update["prediction_image_names"]
            // is_ortho: metadata["is_ortho"],
            // viewport: cur_bounds_str
        },

        function(response, status) {
            $("#predictions_loading").hide();

            //close_modal();
            //viewer.setControlsEnabled(true);
            //viewer.setMouseNavEnabled(true);

            //$("#seadragon_viewer").empty();

            if (response.error) {
                //show_modal_message("Error", response.message);
                $("#predictions_unavailable").show();

            }
            else {
                predictions[cur_img_name] = response.predictions[cur_img_name];
                $("#predictions_available").show();

                //create_viewer_and_anno("seadragon_viewer");
                anno.readOnly = true;

                //let dzi_image_path = image_to_dzi[cur_img_name];
                //viewer.open(dzi_image_path);

                //viewer.viewport.goHome();
                
                //viewer.raiseEvent('update-viewport');
                viewer.world.resetItems();

                set_score_chart_data();
                set_count_chart_data();
                //update_score_chart();
                if ($("#score_chart_svg").length == 1) {
                    update_score_chart();
                }
                else {
                    draw_score_chart();
                }
                

                // set_count_chart_data();
                // set_score_chart_data();
                // update_count_chart();
                // update_score_chart();

                
                // console.log("got response", response);
                // if (response.predictions_exist) {
                //     predictions[cur_img_name] = response.predictions[cur_img_name];
                
                //     //for (let annotation of predictions[cur_img_name]["annotations"]) {
                //     //    annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"});
                //     //}

                //     $("#predictions_available").show();

                //     viewer.raiseEvent('update-viewport');

                // }
                // else {
                //     $("#predictions_unavailable").show();
                // }

                

                //overlay.onRedraw();

                //add_annotations();



                //let dzi_image_path = image_to_dzi[cur_img_name];
                //viewer.open(dzi_image_path);
                //viewer.viewport.fitBounds(cur_bounds);
                //overlay.resize();
                //overlay._updateCanvas();


                //console.log("overlay", overlay);



            }
        });
    }
    else {
        //create_viewer_and_anno("seadragon_viewer");
        anno.readOnly = true;

        //let dzi_image_path = image_to_dzi[cur_img_name];
        //viewer.open(dzi_image_path);
        //viewer.viewport.goHome();
        //viewer.raiseEvent('update-viewport');

        $("#predictions_available").show();
        //viewer.raiseEvent('update-viewport');
        viewer.world.resetItems();

        update_score_chart();
    }*/



    //retrieve_predictions();

    /*
    if (cur_img_name in predictions) {

    }
    else {
        
    }*/

}


async function show_segmentation() {

    await unselect_selected_annotation();

    $("#show_annotation_button").removeClass("tab-btn-active");
    $("#show_prediction_button").removeClass("tab-btn-active");
    $("#show_segmentation_button").addClass("tab-btn-active");

    cur_panel = "segmentation";


    $("#annotation_panel").hide();
    $("#prediction_panel").hide();
    $("#segmentation_panel").show();

    // if (segmentation_viewer == null) {

    //     segmentation_viewer = OpenSeadragon({
    //         id: "segmentation_viewer", //"seadragon_viewer",
    //         sequenceMode: true,
    //         prefixUrl: get_CC_PATH() + "/osd/images/",
    //         tileSources: dzi_image_paths,
    //         showNavigator: false,
    //         maxZoomLevel: 1000,
    //         zoomPerClick: 1,
    //         nextButton: "next-btn",
    //         previousButton: "prev-btn",
    //         showNavigationControl: false,
    //         //preserveViewport: true,
    //         //homeFillsViewer: true,
    //         //defaultZoomLevel: 1
    //         //preserveViewport: true,
    //         //imageSmoothingEnabled: false,
    //         //minZoomLevel: 1,
    //         //maxZoomLevel: 7
    //         //minPixelRatio: 2
    //         //maxZoomPixelRatio: 20
    //         //homeFillsViewer: true
    //         //defaultZoomLevel: 1.1,
    //         //viewportMargins: 20
    //         //navigatorMaintainSizeRatio: true
    //     });

        


    //     segmentation_viewer.addHandler('canvas-click', function(event) {

    //         $("#test_seg_viewer").hide();
    //         $("#seadragon_viewer").show();

    //         // $("#seadragon_viewer").empty();
    //         // create_viewer("seadragon_viewer");

    //         // let dzi_image_path = image_to_dzi[cur_img_name];
    //         // viewer.open(dzi_image_path);

    //         //overlay.onOpen = function() {

    //             let container_width = $("#seadragon_viewer").width();
    //             let container_height = $("#seadragon_viewer").height();

    //             console.log("CANVAS-CLICK");
            
        
    //             let webPoint = event.position;

    //             let viewportPoint = segmentation_viewer.viewport.pointFromPixel(webPoint);
    //             let imagePoint = segmentation_viewer.viewport.viewportToImageCoordinates(viewportPoint);

    //             console.log("image_point", imagePoint);


    //             let content_size = viewer.world.getItemAt(0).getContentSize();

            
    //             // let num_x_tiles = Math.ceil(content_size.x / container_size.x);
    //             // let num_y_tiles = Math.ceil(content_size.y / container_size.y);

    //             let tile_index_x = Math.floor(imagePoint.x / container_width);
    //             let tile_index_y = Math.floor(imagePoint.y / container_height);

    //             let tile_px_coords = [
    //                 tile_index_y * container_height,
    //                 tile_index_x * container_width,
    //                 (tile_index_y * container_height) + container_height,
    //                 (tile_index_x * container_width) + container_width
    //             ];

    //             console.log("tile_px_coords", tile_px_coords)

        
    //             console.log("content_size", content_size);
    //             let hw_ratio = content_size.y / content_size.x;
    //             let viewport_bounds = new OpenSeadragon.Rect(
    //                 tile_px_coords[1] / content_size.x,
    //                 (tile_px_coords[0] / content_size.y) * hw_ratio,
    //                 (tile_px_coords[3] - tile_px_coords[1]) / content_size.x,
    //                 ((tile_px_coords[2] - tile_px_coords[0]) / content_size.y) * hw_ratio
    //             );

    //             console.log("viewport_bounds", viewport_bounds);

    //             viewer.viewport.fitBounds(viewport_bounds);
    //         //};

    //         // delay(1000).then(() => {
    //         // $("#test_seg_viewer").show();
    //         // $("#seadragon_viewer").hide();
    //         // });

    //         //$("#test_seg_viewer").show();
    //         //$("#seadragon_viewer").hide();
            
    //         delay(10000).then(() => {
    //             let img = viewer.drawer.canvas.toDataURL("image/png");
    //             console.log(img);
    //             console.log(typeof(img));
                
    //             let canvas = document.createElement("canvas");
    //             canvas.id = "my_canvas";
    //             // let image_canvas = document.createElement("canvas");
    //             // let exg_ctx = canvas.getContext("2d");
    //             let rgb_ctx = canvas.getContext("2d");
            
            
            
    //             let rgb_image = new Image();
    //             rgb_image.src = img; //"/plant_detection/fake_url/image/png";
            
    //             rgb_image.onload = function() {
            
            
            
    //                 console.log("rgb_image.data (1)", rgb_image.data);
            
    //                 //let container_size = viewer.viewport.getContainerSize();
            
    //                 rgb_ctx.canvas.width = container_width;
    //                 rgb_ctx.canvas.height = container_height;
            
    //                 let w = rgb_ctx.canvas.width;
    //                 let h = rgb_ctx.canvas.height 
            
            
    //                 rgb_ctx.drawImage(rgb_image, 0, 0, w, h);      // Set image to Canvas context
    //                 var d_rgb = rgb_ctx.getImageData(0, 0, w, h);  // Get image Data from Canvas context
    //                 console.log("d_rgb.data", d_rgb.data);
            
                
    //                 let threshold = 0.16;
    //                 let num_foreground = 0;
    //                 let non_zero = [];
    //                 for (let i = 0; i < d_rgb.data.length; i += 4) {
    //                     r_val = d_rgb.data[i] / 255;
    //                     g_val = d_rgb.data[i+1] / 255;
    //                     b_val = d_rgb.data[i+2] / 255;
    //                     if ((r_val != 0 || g_val != 0) || b_val != 0) {
    //                         non_zero.push({"r_val": r_val, "g_val": g_val, "b_val": b_val}); //console.log("non zero pixel", r_val, g_val, b_val);
    //                     }
    //                     let exg_val = (2 * g_val) - r_val - b_val;
            
    //                     let is_foreground = exg_val > threshold;
    //                     d_rgb.data[i+3] = is_foreground ? 255 : 30;
            
    //                     if (is_foreground) {
    //                         num_foreground++;
    //                     }
                        
    //                 }
    //                 console.log("non_zero", non_zero);
    //                 console.log("num_foreground", num_foreground);
            
    //                 let percent_vegetation = ((num_foreground / (d_rgb.data.length / 4)) * 100).toFixed(2);
    //                 console.log("percent_vegetation", percent_vegetation);
    //                 //excess_green_record[cur_img_name]["ground_cover_percentage"] = parseFloat(percent_vegetation);
            
    //                 rgb_ctx.putImageData(d_rgb, 0, 0);
            
    //                 $("#seadragon_viewer").hide();
    //                 $("#test_seg_viewer").empty();
    //                 $("#test_seg_viewer").append(
    //                     rgb_ctx.canvas
    //                 );

    //                 $("#test_seg_viewer").show();

    //                 // $("#seadragon_viewer").empty();
    //                 // $("#seadragon_viewer").append(
    //                 //     rgb_ctx.canvas
    //                 // );
    //             };
    //         });
            
    //     });

    


    // }

    let cur_exg_val = excess_green_record[cur_img_name]["sel_val"];
    $("#threshold_slider_val").html(cur_exg_val.toFixed(2));
    $("#threshold_slider").val(cur_exg_val);

    // $("input[name=segmentation_radio][value='pan']").prop("checked", true).change();
    //$("#panning_enabled_status").html("No");
    // if (excess_green_values_are_all_the_same()) {
    //     disable_std_buttons(["apply_threshold_to_all_button"]);
    // }
    // else {
    //     enable_std_buttons(["apply_threshold_to_all_button"]);
    // }
    update_apply_current_threshold_to_all_images_button();
    cur_bounds = null;
    $("#enable_pan_button").click();
    //$("#pan_switch").prop("checked", true).change();

    // if (viewer == null) {
    //     $("#seadragon_viewer").empty();
    //     create_viewer("seadragon_viewer");
    // }

    // overlay.onOpen = function() {
    //     set_cur_bounds();
    //     let tiledImage = viewer.world.getItemAt(0);
    //     let targetZoom = tiledImage.source.dimensions.x / $("#seadragon_viewer").width();
    //     console.log("tiledImage.source.dimensions.x", tiledImage.source.dimensions.x);
    //     console.log("viewer.viewport.getContainerSize()", viewer.viewport.getContainerSize());
    //     viewer.viewport.zoomTo(targetZoom, null, true);
    // };

    // viewer.zoomPerScroll = 1;

    // //console.log("segmentation_viewer is opening", cur_img_name);
    // let dzi_image_path = image_to_dzi[cur_img_name];
    // viewer.open(dzi_image_path);

    // let tiledImage = viewer.world.getItemAt(0);
    // let targetZoom = tiledImage.source.dimensions.x / viewer.viewport.getContainerSize().x;
    // viewer.viewport.zoomTo(targetZoom, null, true);


    // segmentation_viewer.open(dzi_image_path);

    
    //viewer.world.resetItems();
}

function pan_viewport() {
    // console.log("pan_viewport");

    $("#segmentation_loader").hide();


    if (viewer == null) {
        $("#seadragon_viewer").empty();
        create_viewer("seadragon_viewer");
    }
    overlay.onRedraw = function() {};
    overlay.onOpen = function() {
        //set_cur_bounds();

        //console.log("viewer.viewport.getContainerSize()", viewer.viewport.getContainerSize());
        //viewer.viewport.zoomTo(targetZoom, null, true);
        //viewer.viewport.fitBounds(cur_bounds);
        // console.log("cur_bounds", cur_bounds);
        if (cur_bounds) {
            withFastOSDAnimation(viewer.viewport, function() {
                viewer.viewport.fitBounds(cur_bounds);
            });
        }
        else {
            let tiledImage = viewer.world.getItemAt(0);
            let viewer_width = $("#seadragon_viewer").width();
            let targetZoom = tiledImage.source.dimensions.x / viewer_width;
            viewer.viewport.zoomTo(targetZoom, null, true);
        }
    };

    anno.readOnly = true;
    viewer.zoomPerScroll = 1;
    //viewer.imageSmoothingEnabled = false;

    let dzi_image_path = image_to_dzi[cur_img_name];
    viewer.open(dzi_image_path);
    //viewer.viewport.fitBounds(cur_bounds);
    
}

function segment_viewport() {

    if (viewer != null) {
        cur_bounds = viewer.viewport.getBounds();

        // Make the img a global and check if it is null. If it is not just don't do this step.
        // This way we can call Segment multiple times instead of alternating between pan and segment.
        let img = viewer.drawer.canvas.toDataURL("image/png");
        // console.log(img);
        // console.log(typeof(img));
        
        let canvas = document.createElement("canvas");
        canvas.id = "my_canvas";
        // canvas.margin = "0px";
        // canvas.padding = "0px";
        // let image_canvas = document.createElement("canvas");
        // let exg_ctx = canvas.getContext("2d");
        rgb_ctx = canvas.getContext("2d");

        let container_width = $("#seadragon_viewer").width();
        let container_height = $("#seadragon_viewer").height();



        let rgb_image = new Image();
        rgb_image.src = img; //"/plant_detection/fake_url/image/png";

        rgb_image.onload = function() {



            // console.log("rgb_image.data (1)", rgb_image.data);

            //let container_size = viewer.viewport.getContainerSize();

            rgb_ctx.canvas.width = container_width
            rgb_ctx.canvas.height = container_height;

            let w = rgb_ctx.canvas.width;
            let h = rgb_ctx.canvas.height;

            rgb_ctx.drawImage(rgb_image, 0, 0, w, h);      // Set image to Canvas context
            d_rgb = rgb_ctx.getImageData(0, 0, w, h);  // Get image Data from Canvas context
            // console.log("d_rgb.data", d_rgb.data);

            draw_segmentation();
        }
    }
    else {
        draw_segmentation();
    }
    container_height = $("#seadragon_viewer").height();
}

function snap_box_to_exg(px_str, callback) {

    console.log("(1) snap_box_to_exg", px_str)

    px_str = px_str.substring(11);
    let px_lst = px_str.split(",").map(x => parseFloat(x));
    

    let img_min_y;
    let img_min_x;

    let img_dims = viewer.world.getItemAt(0).getContentSize();
    // let img_max_y;
    // let img_max_x;
    // let navigation_type = $("#navigation_dropdown").val();
    // if (navigation_type === "images") {
    //     let img_dims = viewer.world.getItemAt(0).getContentSize();
    //     img_min_y = 0;
    //     img_min_x = 0;
    //     img_max_y = img_dims.y;
    //     img_max_x = img_dims.x;
    // }
    // else if (navigation_type == "regions_of_interest") {
    //     let region = annotations[cur_img_name][navigation_type][cur_region_index];
    //     let poly_bbox = get_bounding_box_for_polygon(region);
    //     img_min_y = poly_bbox[0];
    //     img_min_x = poly_bbox[1];
    //     img_max_y = poly_bbox[2];
    //     img_max_x = poly_bbox[3];

    // }
    // else {
    //     let img_bounds = annotations[cur_img_name][navigation_type][cur_region_index];
    //     img_min_y = img_bounds[0];
    //     img_min_x = img_bounds[1];
    //     img_max_y = img_bounds[2];
    //     img_max_x = img_bounds[3];
    // }

    let box_min_x = Math.round(px_lst[0]);
    let box_min_y = Math.round(px_lst[1]);
    let box_w = Math.round(px_lst[2]);
    let box_h = Math.round(px_lst[3]);

    let box_max_x = box_min_x + box_w; //px_lst[0] + px_lst[2];
    let box_max_y = box_min_y + box_h; //px_lst[1] + px_lst[3];


    // let start_idx = ( (box_min_y * img_dims.x) + (box_min_x) ) * 4;

    let threshold = excess_green_record[cur_img_name]["sel_val"];
    let num_foreground = 0;
    // let non_zero = [];
    // let min_exg_set = false;
    // let min_exg_x = box_min_x;
    // let min_exg_y = box_min_y;
    // let max_exg_x = box_min_x+1;
    // let max_exg_y = box_min_y+1;



    let img = viewer.drawer.canvas.toDataURL("image/png");
    console.log("img", img);
    // console.log(img);
    // console.log(typeof(img));
    
    let canvas = document.createElement("canvas");
    canvas.id = "my_canvas";
    // canvas.margin = "0px";
    // canvas.padding = "0px";
    // let image_canvas = document.createElement("canvas");
    // let exg_ctx = canvas.getContext("2d");
    rgb_ctx = canvas.getContext("2d");

    // let container_width = $("#seadragon_viewer").width();
    // let container_height = $("#seadragon_viewer").height();


    let rgb_image = new Image();

    rgb_image.onload = function() {



        // console.log("rgb_image.data (1)", rgb_image.data);

        //let container_size = viewer.viewport.getContainerSize();
        container_width = $("#seadragon_viewer").width();
        container_height = $("#seadragon_viewer").height();

        rgb_ctx.canvas.width = container_width; //box_w; //container_width
        rgb_ctx.canvas.height = container_height; //box_h; //container_height;


        let w = rgb_ctx.canvas.width;
        let h = rgb_ctx.canvas.height;

        rgb_ctx.drawImage(rgb_image, 0, 0, w, h);  //box_min_x, box_min_y, box_w, box_h); //0, 0, w, h);      // Set image to Canvas context
        d_rgb = rgb_ctx.getImageData(0, 0, w, h);  // Get image Data from Canvas context







        console.log("d_rgb", d_rgb);

        // box_min_y and box_min_x need to be adjusted --> get min_x, min_y of current viewport and subtract



    // let tmp_d_rgb = rgb_ctx.getImageData(box_min_x, box_min_y, box_w, box_h);

        // for (let i = box_min_y; i < box_max_y; i++) {
        //     for (let j = box_min_x; j < box_max_x; j++) {
        let threshold = excess_green_record[cur_img_name]["sel_val"]; //11; //excess_green_record[cur_img_name]["sel_val"];
        let foreground_xs = [];
        let foreground_ys = [];
        // console.log("box_w, box_h", box_w, box_h);
        // console.log("w, h", w, h);
        // for (let i = 0; i < box_h; i++) {
            // for (let j = 0; j < box_w; j++) {

        // let viewer_bounds = viewer.viewport.getBounds();
        // // let container_size = viewer.viewport.getContainerSize();
    
        // let hw_ratio = overlay.imgHeight / overlay.imgWidth;
        // let canvas_min_x = Math.floor(viewer_bounds.x * overlay.imgWidth);
        // let canvas_min_y = Math.floor((viewer_bounds.y / hw_ratio) * overlay.imgHeight);

        // console.log("canvas_min_y, canvas_min_x", canvas_min_y, canvas_min_x);

        let min_viewer_pt = viewer.viewport.imageToViewerElementCoordinates(
            new OpenSeadragon.Point(box_min_x, box_min_y)
        );
        // console.log("min_viewer_pt", min_viewer_pt);
        let max_viewer_pt = viewer.viewport.imageToViewerElementCoordinates(
            new OpenSeadragon.Point(box_max_x, box_max_y)
        );

        let min_canvas_x = Math.round(min_viewer_pt.x);
        let min_canvas_y = Math.round(min_viewer_pt.y);
        let max_canvas_x = Math.round(max_viewer_pt.x);
        let max_canvas_y = Math.round(max_viewer_pt.y);

        console.log("min_canvas_x, min_canvas_y", min_canvas_x, min_canvas_y);
        console.log("max_canvas_x, max_canvas_y", max_canvas_x, max_canvas_y);


        let min_exg_x = max_canvas_x; //box_max_x;
        let min_exg_y = max_canvas_y; //box_max_y;
        let max_exg_x = min_canvas_x; //box_min_x;
        let max_exg_y = min_canvas_y; //box_min_y;

        // let start_y = box_min_y - canvas_min_y;
        // let start_x = box_min_x - canvas_min_x;
        // console.log("start_y, start_x", start_y, start_x);
        // for (let i = start_y; i < start_y + box_h; i++) { //box_min_y; i < box_max_y; i++) {
        //     for (let j = start_x; j < start_x + box_w; j++) { //box_min_x; j < box_max_x; j++) {

        for (let i = min_canvas_y; i < max_canvas_y; i++) { //box_min_y; i < box_max_y; i++) {
            for (let j = min_canvas_x; j < max_canvas_x; j++) { //box_min_x; j < box_max_x; j++) {


                // let idx = ( (i * box_w) + j ) * 4;
                // let canvas_i = i - canvas_min_y;
                // let canvas_j = j - canvas_min_x;
                let idx = ( (i * w) + j ) * 4;
                let r_val = d_rgb.data[idx] / 255;
                let g_val = d_rgb.data[idx+1] / 255;
                let b_val = d_rgb.data[idx+2] / 255;



                // if ((r_val != 0 || g_val != 0) || b_val != 0) {
                //     non_zero.push({"r_val": r_val, "g_val": g_val, "b_val": b_val});
                // }
                let exg_val = (2 * g_val) - r_val - b_val;
                // console.log(idx, exg_val);
                
        
                let is_foreground = exg_val > threshold;

                if (is_foreground) {
                    // console.log(i, j, idx, exg_val);
                    foreground_xs.push(j); // + canvas_min_y); //box_min_x + j);
                    foreground_ys.push(i); // + canvas_min_x); //box_min_y + i);

                    // if ((box_min_x + j) < min_exg_x) {
                    //     min_exg_x = box_min_x + j;
                    //     //console.log("updating min_x", )
                    // }
                    // if ((box_min_y + i) < min_exg_y) {
                    //     min_exg_y = box_min_y + i;
                    // }
                    // if ((box_min_x + j) > max_exg_x) {
                    //     max_exg_x = box_min_x + j;
                    // }
                    // if ((box_min_y + i) > max_exg_y) {
                    //     max_exg_y = box_min_y + i;
                    // }                             

                    if (j < min_exg_x) {
                        min_exg_x = j;
                        //console.log("updating min_x", )
                    }
                    if (i < min_exg_y) {
                        min_exg_y = i;
                    }
                    if (j > max_exg_x) {
                        max_exg_x = j;
                    }
                    if (i > max_exg_y) {
                        max_exg_y = i;
                    }


                    // if (!(min_exg_set)) {
                    //     min_exg_x = box_min_x + j;
                    //     min_exg_y = box_min_y + i;
                    //     max_exg_x = box_min_x + j+1;
                    //     max_exg_y = box_min_y + i+1;
                    //     min_exg_set = true;
                    // }
                    // else {

                    //     if ((box_min_x + j) > max_exg_x) {
                    //         max_exg_x = box_min_x + j;
                    //     }
                    //     if ((box_min_y + i) > max_exg_y) {
                    //         max_exg_y = box_min_y + i;
                    //     }
                    // }
                }
            }
        }

        // console.log(foreground_xs);
        // console.log(foreground_ys);
        // console.log(Math.min(foreground_xs))

        // min_exg_x = Math.min.apply(null, foreground_xs);
        // min_exg_y = Math.min.apply(null, foreground_ys);
        // max_exg_x = Math.max.apply(null, foreground_xs);
        // max_exg_y = Math.max.apply(null, foreground_ys);

        if ((min_exg_x >= max_exg_x) || (min_exg_y >= max_exg_y)) {
            console.log("snap failed, using org coords");
            box_min_x = px_lst[0];
            box_min_y = px_lst[1];
            box_max_x = px_lst[0] + px_lst[2];
            box_max_y = px_lst[1] + px_lst[3];
        }
        else {

            console.log("min_exg_x, min_exg_y", min_exg_x, min_exg_y);
            console.log("max_exg_x, max_exg_y", max_exg_x, max_exg_y);

            let min_box_pt = viewer.viewport.viewerElementToImageCoordinates(
                new OpenSeadragon.Point(min_exg_x, min_exg_y)
            );
            let max_box_pt = viewer.viewport.viewerElementToImageCoordinates(
                new OpenSeadragon.Point(max_exg_x, max_exg_y)
            );
            console.log("min_box_pt", min_box_pt);
            console.log("max_box_pt", max_box_pt);

            box_min_x = min_box_pt.x; //min_exg_x;
            box_min_y = min_box_pt.y; //min_exg_y;
    
            box_max_x = max_box_pt.x; //max_exg_x;
            box_max_y = max_box_pt.y; //max_exg_y;    
        }

        // if (!(min_exg_set)) {
        //     console.log("min_exg not set");
        //     if ((min_exg_x == box_max_x - 1) || (min_exg_y == box_max_y - 1)) {
        //         console.log("min is now at max border");
        //     }
        // }




        // for (let i = start_idx; i < d_rgb.data.length; i += 4) {
        //     r_val = d_rgb.data[i] / 255;
        //     g_val = d_rgb.data[i+1] / 255;
        //     b_val = d_rgb.data[i+2] / 255;
        //     if ((r_val != 0 || g_val != 0) || b_val != 0) {
        //         non_zero.push({"r_val": r_val, "g_val": g_val, "b_val": b_val});
        //     }
        //     let exg_val = (2 * g_val) - r_val - b_val;

        //     let is_foreground = exg_val > threshold;
        //     // d_rgb.data[i+3] = is_foreground ? 255 : 30;

        //     // if (is_foreground) {
        //     //     num_foreground++;
        //     // }
            
        // }

        // for (let i = start_idx; i < d_rgb.data.length; i += 4) {

        // }


        box_w = box_max_x - box_min_x;
        box_h = box_max_y - box_min_y;

        console.log("px_str", px_str);
        let updated_px_str = "xywh=pixel:" + box_min_x + "," + box_min_y +
                            "," + box_w + "," + box_h;




        // box_min_x = Math.max(box_min_x, img_min_x);
        // box_min_y = Math.max(box_min_y, img_min_y);

        // box_max_x = Math.min(box_max_x, img_max_x);
        // box_max_y = Math.min(box_max_y, img_max_y);

        console.log("(2) snap_box_to_exg", updated_px_str)

        // return updated_px_str;
        callback(updated_px_str);
    }



    rgb_image.src = img; //"/plant_detection/fake_url/image/png";


    // return px_str;


}


function draw_segmentation() {

    //$("#seadragon_viewer").css("height", "max-content");
    // container_height = $("#seadragon_viewer").height();
    // console.log("container_height", container_height);

    //$("#segmentation_loader").toggleClass('load-complete');
    //$("#segmentation_checkmark").toggle();
    //fitToContainer(rgb_ctx.canvas);



    
    let threshold = excess_green_record[cur_img_name]["sel_val"];
    let num_foreground = 0;
    let non_zero = [];
    for (let i = 0; i < d_rgb.data.length; i += 4) {
        r_val = d_rgb.data[i] / 255;
        g_val = d_rgb.data[i+1] / 255;
        b_val = d_rgb.data[i+2] / 255;
        if ((r_val != 0 || g_val != 0) || b_val != 0) {
            non_zero.push({"r_val": r_val, "g_val": g_val, "b_val": b_val});
        }
        let exg_val = (2 * g_val) - r_val - b_val;

        let is_foreground = exg_val > threshold;
        d_rgb.data[i+3] = is_foreground ? 255 : 30;

        if (is_foreground) {
            num_foreground++;
        }
        
    }
    // console.log("non_zero", non_zero);
    // console.log("num_foreground", num_foreground);

    // let percent_vegetation = ((num_foreground / (d_rgb.data.length / 4)) * 100).toFixed(2);
    // console.log("percent_vegetation", percent_vegetation);


    //excess_green_record[cur_img_name]["ground_cover_percentage"] = parseFloat(percent_vegetation);

    // let container_width = $("#seadragon_viewer").width();
    // let container_height = $("#seadragon_viewer").height();

    // console.log("container_width, container_height", container_width, container_height);
    rgb_ctx.putImageData(d_rgb, 0, 0);

    // container_height = $("#seadragon_viewer").height();
    // console.log("container_height", container_height);
    // $("#seadragon_viewer").hide();
    // $("#test_seg_viewer").empty();
    // $("#test_seg_viewer").append(
    //     rgb_ctx.canvas
    // );



    //$("#test_seg_viewer").show();
    //overlay = null;
    overlay.onOpen = function() {};
    overlay.onRedraw = function() {};
    viewer = null;
    //cur_bounds = null;
    let canvas_container_height = $("#seadragon_viewer").height() + "px";

    $("#seadragon_viewer").empty();
   /*$("#seadragon_viewer").css("display", "grid");*/
    //console.log($("#seadragon_viewer"));
    //console.log($("#seasdragon_viewer").css("display"));
    // container_height = $("#seadragon_viewer").height();
    // console.log("container_height", container_height);
    //$("#seadragon_viewer").css("height", "max-content");

    //$("#seadragon_viewer").css("display", "inline-block");


    // console.log("Appending canvas", rgb_ctx.canvas);
    $("#seadragon_viewer").append(
        `<div id="canvas_container" style="height: ${canvas_container_height}">`+
        //rgb_ctx.canvas +
        `</div>`

    );

    $("#canvas_container").append(rgb_ctx.canvas);
    container_width = $("#seadragon_viewer").width();
    container_height = $("#seadragon_viewer").height();

    // console.log("container_width, container_height", container_width, container_height);


    delay(1).then(() => {
        $("#segmentation_loader").toggleClass('load-complete');
        $("#segmentation_checkmark").toggle();

        enable_std_buttons(["segment_button"]);
    });


}







function update_results_name_input() {

    let format = /[`!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
    let inputs_to_check = ["results_name_input"];
    for (let input of inputs_to_check) {
        let input_length = ($("#" + input).val()).length;
        if ((input_length < 1) || (input_length > 50)) {
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

function submit_result_request() { //submit_prediction_request(image_names_str, regions_str) {

    let at_least_one_region = false;
    for (let region_key of ["regions_of_interest", "training_regions", "test_regions"]) {
        for (let image_name of Object.keys(annotations)) {
            if (annotations[image_name][region_key].length > 0) {
                at_least_one_region = true;
                break;
            }
        }
    }
    let full_image_label;
    if (metadata["is_ortho"] === "yes") {
        full_image_label = "Full Orthomosaic";
    }
    else {
        full_image_label = "All Images";
    }

    let left_col_width_px = "180px";
    show_modal_message("Submit Result Request", 
        `<div>Please confirm your request.` +
        ` Upon completion, your results will be preserved under this image set's` +
        ` <em>Results</em> tab (accessible from the home page).</div>` +
        `<div style="height: 30px"></div>` +
        `<table>` +
            `<tr>` +
                `<td>` + 
                    `<div class="table_head" style="width: ${left_col_width_px}; padding-right: 10px">Name</div>` +
                `</td>` +
                `<td>` +
                    `<div style="width: 330px">` +
                        `<input id="results_name_input" class="nonfixed_input" style="width: 100%" value="My Result">` +
                    `</div>` +
                `</td>` +
            `</tr>` +
            `<tr style="height: 5px">` +
            `</tr>` +
            `<tr>` +
                `<td>` + 
                    `<div class="table_head" style="width: ${left_col_width_px}; height: 85px; padding-right: 10px">Comment</div>` +
                `</td>` +
                `<td>` +
                    `<div style="width: 330px; height: 85px">` +
                        `<textarea id="results_comment_input" class="nonfixed_textarea" style="width: 100%" rows="4"></textarea>` +
                    `</div>` +
                `</td>` +
            `</tr>` + 
            `<tr id="results_region_radio_row">` +
                `<td>` +
                    `<div class="table_head" style="width: ${left_col_width_px}; height: 50px; padding-right: 10px">Prediction Target</div>` +
                `</td>` +
            // `<tr>` +
            //     `<td style="width: 50%"></td>` +
                `<td>` +
                    `<table style="border: 1px solid grey; width: 330px; height: 50px;" id="result_regions_radio_container">` +
                        `<tr>` +
                            `<td style="width: 50%"></td>` +
                            `<td>` +
                                `<label class="custom_radio_container" style="width: 160px; padding-left: 25px"> ${full_image_label}` +
                                    `<input type="radio" name="result_regions_radio" value="images" checked>` +
                                    `<span class="custom_radio"></span>` +
                                `</label>` +
                            `</td>` +
                            `<td><div style="width: 20px"></div></td>` +
                            `<td>` +
                                `<label class="custom_radio_container" style="width: 115px; padding-left: 25px"> All Regions` +
                                    `<input type="radio" name="result_regions_radio" value="regions">` +
                                    `<span class="custom_radio"></span>` +
                                `</label>` +
                            `</td>` +
                            `<td style="width: 50%"></td>` +
                        `</tr>` +
                    `</table>` +
                `</td>` +
                // `<td style="width: 50%"></td>` +
            `</tr>` +
            `<tr>` +
                `<td>` +
                    `<div class="table_head" style="width: ${left_col_width_px}; padding-right: 10px">Calc. Veg. Coverage</div>` +
                `</td>` +
                `<td>` +
                    `<div style="width: 330px; text-align: left; padding-left: 2px">` +
                        `<label for="calc_veg_coverage" class="container" style="display: inline; margin-bottom: 20px;">` +
                            `<input type="checkbox" id="calc_veg_coverage" name="calc_vegetation_coverage" checked>` +
                            `<span class="checkmark"></span>` +
                        `</label>` +
                    `</div>` +
                `</div>` +
            `</tr>` +
        `</table>` + 
        `<div style="height: 30px"></div>` +
        `<div id="modal_button_container" style="text-align: center">` +
        `<button id="confirm_results_request_button" class="std-button std-button-hover" `+
        `style="width: 200px">Submit Request</button></div>`
        /*
        `<button id="cancel_delete" class="std-button std-button-hover" ` +
        `style="width: 200px" onclick="cancel_delete_request()">Cancel</button>` +*/
        
        , 750);

    if (!(at_least_one_region)) {
        // $("input:radio[name=result_regions_radio]").prop("disabled", true);
        // $("#result_regions_radio_container").css("opacity", 0.5);
        $("#results_region_radio_row").hide();
    }

    $("#confirm_results_request_button").click(function() {


        let result_type_val = $('input[name=result_regions_radio]:checked').val();
        let result_regions_only = (result_type_val === "regions");
        let predict_on_images = !(result_regions_only);

        let res = get_image_list_and_region_list_for_predicting_on_all(predict_on_images);
        let image_list = res[0];
        let region_list = res[1];

        let calculate_vegetation_record = $("#calc_veg_coverage").is(':checked');


        if (region_list.length == 0) {
            show_modal_message(`Error`, `At least one region must exist before predictions for "all regions" can be requested.`);
        }


        submit_prediction_request_confirmed(image_list, region_list, true, result_regions_only, calculate_vegetation_record);
    });

    
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

function submit_prediction_request_confirmed(image_list, region_list, save_result, result_regions_only, calculate_vegetation_coverage) {
    // console.log("image_names_str", image_names_str);
    // console.log("regions_str", regions_str);


    disable_std_buttons(["request_result_button", "predict_single_button", "predict_all_button"]);


    $.post($(location).attr("href"),
    {
        action: "predict",
        image_names: JSON.stringify(image_list),
        regions: JSON.stringify(region_list),
        save_result: save_result ? "True" : "False",
        regions_only: result_regions_only ? "True" : "False",
        calculate_vegetation_coverage: calculate_vegetation_coverage ? "True" : "False",
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
        
            switch_model_data["inspected_model_log"] = response.model_log; //model_logs[parseInt(model_log_index)];
            // let inspected_annotations = response.annotations;
            // for (let image_name of Object.keys(inspected_annotations)) {
            //     for (let annotation of inspected_annotations[image_name]["annotations"]) {
            //         annotation["body"].push({"value": "COLOR_BRIGHT", "purpose": "highlighting"})
            //     }
            // }


            $("#model_select_back_button").show();
            $("#random_weights_button").hide();
        
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
                                `<button id="prev_ims_button" class="std-button std-button-hover" style="padding: 2px; font-size: 14px; width: 50px">` +
                                    `<i class="fa-solid fa-circle-chevron-left"></i>` +
                                `</button>` +
                            `</td>` +
                            `<td>` +
                                `<button id="next_ims_button" class="std-button std-button-hover" style="padding: 2px; font-size: 14px; width: 50px">` +
                                    `<i class="fa-solid fa-circle-chevron-right"></i>` +
                                `</button>` +
                            `</td>` +  
                        `<tr>` +
                    `</table>` +
                    `<td style="width: ${model_viewer_width}">` +
                    `<table>` +
                        `<tr>` +
                            `<td><h style="width: 180px" class="header2">Current Image Set</h></td>` +
                            `<td style="width: 100%"></td>` +
                            `<td>` +
                                `<button id="prev_cs_button" class="std-button std-button-hover" style="padding: 2px; font-size: 14px; width: 50px">` +
                                    `<i class="fa-solid fa-circle-chevron-left"></i>` +
                                `</button>` +
                            `</td>` +
                            `<td>` +
                                `<button id="next_cs_button" class="std-button std-button-hover" style="padding: 2px; font-size: 14px; width: 50px">` +
                                    `<i class="fa-solid fa-circle-chevron-right"></i>` +
                                `</button>` +
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
        
        
            let current_image_set_viewer = OpenSeadragon({
                id: "target_viewer", //"seadragon_viewer",
                sequenceMode: true,
                prefixUrl: get_CC_PATH() + "/osd/images/",
                tileSources: dzi_image_paths,
                showNavigator: false,
                maxZoomLevel: 1000,
                zoomPerClick: 1,
                nextButton: "next_cs_button",
                previousButton: "prev_cs_button",
                showNavigationControl: false,
                //preserveViewport: true,
                //imageSmoothingEnabled: false
            });


            //let current_image_set_cur_bounds = null;


            current_image_set_overlay = current_image_set_viewer.canvasOverlay({

                onOpen: function() {
                },
                onRedraw: function() {
                    let cur_tiles_url = current_image_set_viewer.source.tilesUrl;
                    let basename_url = basename(cur_tiles_url);
                    let current_image_set_image_name = basename_url.substring(0, basename_url.length-6);
                    //let region = model_image_set_regions[model_viewer.currentPage()];
                
                    let boxes_to_add = {};
                    boxes_to_add["region_of_interest"] = {};
                    boxes_to_add["region_of_interest"]["boxes"] = annotations[current_image_set_image_name]["regions_of_interest"];
                    boxes_to_add["training_region"] = {};
                    boxes_to_add["training_region"]["boxes"] = annotations[current_image_set_image_name]["training_regions"];
                    boxes_to_add["test_region"] = {};
                    boxes_to_add["test_region"]["boxes"] = annotations[current_image_set_image_name]["test_regions"]
                    boxes_to_add["annotation"] = {};
                    boxes_to_add["annotation"]["boxes"] = annotations[current_image_set_image_name]["boxes"];
                        
                    let viewer_bounds = current_image_set_viewer.viewport.getBounds();
                    let container_size = current_image_set_viewer.viewport.getContainerSize();

                    let hw_ratio = current_image_set_overlay.imgHeight / current_image_set_overlay.imgWidth;
                    let min_x = Math.floor(viewer_bounds.x * current_image_set_overlay.imgWidth);
                    let min_y = Math.floor((viewer_bounds.y / hw_ratio) * current_image_set_overlay.imgHeight);
                    let viewport_w = Math.ceil(viewer_bounds.width * current_image_set_overlay.imgWidth);
                    let viewport_h = Math.ceil((viewer_bounds.height / hw_ratio) * current_image_set_overlay.imgHeight);
                    let max_x = min_x + viewport_w;
                    let max_y = min_y + viewport_h;

                    let draw_order = ["region_of_interest", "training_region", "test_region", "annotation"];
                    
                    for (let key of draw_order) { 
                        
                        current_image_set_overlay.context2d().strokeStyle = overlay_appearance["colors"][key];
                        current_image_set_overlay.context2d().fillStyle = overlay_appearance["colors"][key] + "55";
                        current_image_set_overlay.context2d().lineWidth = 2;
                        //console.log("boxes_to_add", boxes_to_add, key);



                        if (key === "region_of_interest") {

                            for (let i = 0; i < boxes_to_add["region_of_interest"]["boxes"].length; i++) {

                                let region = boxes_to_add["region_of_interest"]["boxes"][i];
                                current_image_set_overlay.context2d().beginPath();
                                for (let j = 0; j < region.length; j++) {
                                    let pt = region[j];
                        
                                    let viewer_point = current_image_set_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(pt[1], pt[0]));
                                    
                                    if (j == 0) {
                                        current_image_set_overlay.context2d().moveTo(viewer_point.x, viewer_point.y);
                                    }
                                    else {
                                        current_image_set_overlay.context2d().lineTo(viewer_point.x, viewer_point.y);
                                    }
                                }

                        
                                current_image_set_overlay.context2d().closePath();
                                current_image_set_overlay.context2d().stroke();
                                if (overlay_appearance["style"][key] == "fillRect") {
                                    current_image_set_overlay.context2d().fill();
                                }
                        
                            }
                        }
                        else {


                            let visible_boxes = [];
                            for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {

                                let box = boxes_to_add[key]["boxes"][i];

                                //let box_width_pct_of_image = (box[3] - box[1]) / current_image_set_overlay.imgWidth;
                                //let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                                //let box_height_pct_of_image = (box[3] - box[1]) / current_image_set_overlay.imgHeight;
                                //let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;

                                // if ((disp_width * disp_height) < 0.5) {
                                //     continue;
                                // }

                                if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
                                    visible_boxes.push(box);
                                }
                            }
                            if (visible_boxes.length <= MAX_BOXES_DISPLAYED) {
                                for (let box of visible_boxes) {
                                    let viewer_point = current_image_set_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                                    let viewer_point_2 = current_image_set_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));
                                    
                                    current_image_set_overlay.context2d().strokeRect(
                                        viewer_point.x,
                                        viewer_point.y,
                                        (viewer_point_2.x - viewer_point.x),
                                        (viewer_point_2.y - viewer_point.y)
                                    );

                                    if (overlay_appearance["style"][key] == "fillRect") {
                                        current_image_set_overlay.context2d().fillRect(
                                            viewer_point.x,
                                            viewer_point.y,
                                            (viewer_point_2.x - viewer_point.x),
                                            (viewer_point_2.y - viewer_point.y)
                                        );
                                    }
                                }
                            }
                        }
                    }
                },
                clearBeforeRedraw: true
            });            


            // let target_anno = OpenSeadragon.Annotorious(target_viewer, {
            //     disableEditor: true,
            //     disableSelect: true,
            //     readOnly: true,
            //     formatter: formatter
            // });

            // target_viewer.addHandler("open", function(event) {
            //     let cur_dzi = basename(event.source)
            //     let cur_image_name = cur_dzi.substring(0, cur_dzi.length - 4);
            //     target_anno.clearAnnotations();
            //     for (let annotation of inspected_annotations[cur_image_name]["annotations"]) {
            //         target_anno.addAnnotation(annotation);
            //     }
            // });
        
            for (let i = 0; i < switch_model_data["inspected_model_log"]["image_sets"].length; i++) {
        
                let image_set = switch_model_data["inspected_model_log"]["image_sets"][i];
        
                let entry = create_image_set_details_table(
                    image_set["username"],
                    image_set["farm_name"],
                    image_set["field_name"],
                    image_set["mission_date"]
                );
        
        
        
        
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
            init_model_viewer();
            change_image_set(0);
            // change_image_set(0);
        }

    });



}


function init_model_viewer() {

    $("#model_viewer").empty();
    // create_viewer("seadragon_viewer");


    model_viewer = OpenSeadragon({
        id: "model_viewer", //"seadragon_viewer",
        sequenceMode: true,
        prefixUrl: get_CC_PATH() + "/osd/images/",
        //tileSources: model_image_set_dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 1000,
        zoomPerClick: 1,
        nextButton: "next_ims_button",
        previousButton: "prev_ims_button",
        showNavigationControl: false,
        //preserveViewport: true,
        //imageSmoothingEnabled: false
    });




    model_overlay = model_viewer.canvasOverlay({


        onOpen: function() {

            //viewers[id_prefix].world.resetItems();
            //console.log(viewers[id_prefix].currentPage());
            let region = model_image_set_regions[model_viewer.currentPage()];
            if (region != null) {

                let content_size = model_viewer.world.getItemAt(0).getContentSize();
                let image_w = content_size.x;
                let image_h = content_size.y;
                let hw_ratio = image_h / image_w;
                let viewport_bounds = [
                    region[1] / image_w,
                    (region[0] / image_h) * hw_ratio,
                    (region[3] - region[1]) / image_w,
                    ((region[2] - region[0]) / image_h) * hw_ratio
                ];
                //console.log("viewport_bounds", viewport_bounds);
            
                model_image_set_cur_bounds = new OpenSeadragon.Rect(
                    viewport_bounds[0],
                    viewport_bounds[1],
                    viewport_bounds[2],
                    viewport_bounds[3]
                );
            }
            else {
                model_image_set_cur_bounds = null;
            }
            //viewers[id_prefix].viewport.goHome();;

        },
        onRedraw: function() {
            let cur_tiles_url = model_viewer.source.tilesUrl;
            let basename_url = basename(cur_tiles_url);
            let model_image_set_image_name = basename_url.substring(0, basename_url.length-6);
            let region = model_image_set_regions[model_viewer.currentPage()];
        
            let boxes_to_add = {};
            // boxes_to_add["region_of_interest"] = {};
            // boxes_to_add["region_of_interest"]["boxes"] = model_image_set_annotations[model_image_set_image_name]["regions_of_interest"];
            // boxes_to_add["training_region"] = {};
            // boxes_to_add["training_region"]["boxes"] = model_image_set_annotations[model_image_set_image_name]["training_regions"];
            // boxes_to_add["test_region"] = {};
            // boxes_to_add["test_region"]["boxes"] = model_image_set_annotations[model_image_set_image_name]["test_regions"]
            boxes_to_add["annotation"] = {};
            boxes_to_add["annotation"]["boxes"] = model_image_set_annotations[model_image_set_image_name]["boxes"];
                
            let viewer_bounds = model_viewer.viewport.getBounds();
            let container_size = model_viewer.viewport.getContainerSize();

            let hw_ratio = model_overlay.imgHeight / model_overlay.imgWidth;
            let min_x = Math.floor(viewer_bounds.x * model_overlay.imgWidth);
            let min_y = Math.floor((viewer_bounds.y / hw_ratio) * model_overlay.imgHeight);
            let viewport_w = Math.ceil(viewer_bounds.width * model_overlay.imgWidth);
            let viewport_h = Math.ceil((viewer_bounds.height / hw_ratio) * model_overlay.imgHeight);
            let max_x = min_x + viewport_w;
            let max_y = min_y + viewport_h;

            //if (region != null) {
            //let cur_region = annotations[cur_img_name][navigation_type][cur_region_index];
            min_y = Math.max(min_y, region[0]);
            min_x = Math.max(min_x, region[1]);
            max_y = Math.min(max_y, region[2]);
            max_x = Math.min(max_x, region[3]);
            //}

            let draw_order;
            //if (region == null) {
            //    draw_order = ["annotation", "training_region", "test_region"];
            //}
            //else {
            draw_order = ["annotation"];
            //}
            for (let key of draw_order) { 
                
                model_overlay.context2d().strokeStyle = overlay_appearance["colors"][key];
                model_overlay.context2d().fillStyle = overlay_appearance["colors"][key] + "55";
                model_overlay.context2d().lineWidth = 2;
                //console.log("boxes_to_add", boxes_to_add, key);
                let visible_boxes = [];
                for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {

                    let box = boxes_to_add[key]["boxes"][i];

                    //let box_width_pct_of_image = (box[3] - box[1]) / model_overlay.imgWidth;
                    //let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                    //let box_height_pct_of_image = (box[3] - box[1]) / model_overlay.imgHeight;
                    //let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;

                    // if ((disp_width * disp_height) < 0.5) {
                    //     continue;
                    // }

                    if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
                        visible_boxes.push(box);
                    }
                }
                if (visible_boxes.length <= MAX_BOXES_DISPLAYED) {
                    for (let box of visible_boxes) {
                        let viewer_point = model_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                        let viewer_point_2 = model_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));
                        
                        model_overlay.context2d().strokeRect(
                            viewer_point.x,
                            viewer_point.y,
                            (viewer_point_2.x - viewer_point.x),
                            (viewer_point_2.y - viewer_point.y)
                        );

                        if (overlay_appearance["style"][key] == "fillRect") {
                            model_overlay.context2d().fillRect(
                                viewer_point.x,
                                viewer_point.y,
                                (viewer_point_2.x - viewer_point.x),
                                (viewer_point_2.y - viewer_point.y)
                            );
                        }
                    }
                }
            }

            if (region != null) {

                let image_px_width = model_overlay.imgWidth;
                let image_px_height = model_overlay.imgHeight;
        
                let inner_poly;
                let outer_poly = [
                    [0-1e6, 0-1e6], 
                    [0-1e6, image_px_width+1e6], 
                    [image_px_height+1e6, image_px_width+1e6],
                    [image_px_height+1e6, 0-1e6]
                ];

                inner_poly = [
                    [region[0], region[1]],
                    [region[0], region[3]],
                    [region[2], region[3]],
                    [region[2], region[1]]
                ];
        
                model_overlay.context2d().fillStyle = "#222621";
                model_overlay.context2d().beginPath();
        
                for (let poly of [outer_poly, inner_poly]) {
        
                    for (let i = 0; i < poly.length+1; i++) {
                        let pt = poly[(i)%poly.length];
                        let viewer_point = model_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(pt[1], pt[0]));
        
                        if (i == 0) {
                            model_overlay.context2d().moveTo(viewer_point.x, viewer_point.y);
                        }
                        else {
                            model_overlay.context2d().lineTo(viewer_point.x, viewer_point.y);
                        }
                    }
                    model_overlay.context2d().closePath();
        
                }
                model_overlay.context2d().mozFillRule = "evenodd";
                model_overlay.context2d().fill("evenodd");
            }


            if (model_image_set_cur_bounds != null) {

                if (region != null) {
        
                    model_viewer.world.getItemAt(0).setClip(
                        new OpenSeadragon.Rect(
                            region[1],
                            region[0],
                            (region[3] - region[1]),
                            (region[2] - region[0])
                        )
                    );
                }
        
        
                withFastOSDAnimation(model_viewer.viewport, function() {
                    model_viewer.viewport.fitBounds(model_image_set_cur_bounds);
                });
                model_image_set_cur_bounds = null;
            }

        },
        clearBeforeRedraw: true
    });
}
let model_viewer;
let model_overlay;
let model_image_set_annotations;
let model_image_set_regions;
let model_image_set_dzi_image_paths;
let model_image_set_cur_bounds;
function change_image_set(image_set_index) {
    let image_set = switch_model_data["inspected_model_log"]["image_sets"][parseInt(image_set_index)];
    $.post($(location).attr("href"),
    {
        action: "fetch_model_annotations",
        model_creator: switch_model_data["inspected_model_log"]["model_creator"],
        model_name: switch_model_data["inspected_model_log"]["model_name"],
        username: image_set["username"],
        farm_name: image_set["farm_name"],
        field_name: image_set["field_name"],
        mission_date: image_set["mission_date"]
    },
    function(response, status) {

        if (response.error) {
            show_modal_message("Error", response.message);
        }
        else {

            model_image_set_annotations = response.annotations;
            model_image_set_dzi_image_paths = [];
            model_image_set_regions = [];
            model_image_set_cur_bounds = null;
            for (let image_name of Object.keys(model_image_set_annotations)) {

                for (let region_key of ["training_regions", "test_regions"]) {
                    for (let i = 0; i < model_image_set_annotations[image_name][region_key].length; i++) {
                        model_image_set_dzi_image_paths.push(
                            get_CC_PATH() + "/usr/data/" + image_set["username"] + "/image_sets/" +
                                            image_set["farm_name"] + "/" +
                                            image_set["field_name"] + "/" +
                                            image_set["mission_date"] + "/" +
                                            "dzi_images" + "/" +
                                            image_name + ".dzi"
                        );
                        model_image_set_regions.push(model_image_set_annotations[image_name][region_key][i]);
                    }
                }
            }

            model_viewer.tileSources = model_image_set_dzi_image_paths;
            model_viewer.goToPage(0);

        }
    });
}


function get_filtered_model_list() {

    let filtered_models = [];
    for (let model of switch_model_data["models"]) {

        let keep = true;
        for (let filter_option of switch_model_data["filter_options"]) { //key of Object.keys(switch_model_data["filter_options"])) {
            // let comp;
            // if (key === "username") {
            //     comp = username;
            // }
            // else if (key === "farm_name") {
            //     comp = farm_name;
            // }
            // else if (key === "field_name") {
            //     comp = field_name;
            // }
            // else if (key === "mission_date") {
            //     comp = mission_date.substring(0, 4);
            // }
            // else if (key === "object_name") {
            //     comp = object_name;
            // }

            if ($("#" + filter_option + "_filter").val() == "-- All --" || $("#" + filter_option + "_filter").val() === model[filter_option]) {
                keep = true;
            }
            else {
                keep = false;
                break;
            }
        }
        if (keep) {
            filtered_models.push(model);
        }
    }

    //if (switch_model_data["filter_options"].length == 2) {
        let sort_combo_0_val = $("#sort_combo_0").val();
        let sort_combo_1_val = $("#sort_combo_1").val();
        filtered_models.sort(function(a, b) {
            return a[sort_combo_0_val].localeCompare(b[sort_combo_0_val], undefined, {numeric: true, sensitivity: 'base'}) || 
                   a[sort_combo_1_val].localeCompare(b[sort_combo_1_val], undefined, {numeric: true, sensitivity: 'base'});
        });
    // }
    // else {
    //     let sort_combo_0_val = $("#sort_combo_0").val();
    //     let sort_combo_1_val = $("#sort_combo_1").val();
    //     let sort_combo_2_val = $("#sort_combo_2").val();
    //     filtered_models.sort(function(a, b) {
    //         return a[sort_combo_0_val].localeCompare(b[sort_combo_0_val], undefined, {numeric: true, sensitivity: 'base'}) || 
    //                a[sort_combo_1_val].localeCompare(b[sort_combo_1_val], undefined, {numeric: true, sensitivity: 'base'}) ||
    //                a[sort_combo_2_val].localeCompare(b[sort_combo_2_val], undefined, {numeric: true, sensitivity: 'base'});
    //     });
    // }





    return filtered_models;
}


function create_models_selection_table() {
    $("#models_table").empty();
    let filtered_models = get_filtered_model_list();
    for (let model of filtered_models) {
                    
        let model_name = model["model_name"];
        let model_creator = model["model_creator"];
        let model_object = model["model_object"];
        let model_details_table = create_model_details_table(model_creator, model_name);
        let button_id = model_creator + "." + model_name;
        let warn_icon;
        if (model["image_set_used_to_train_model"]) {
            warn_icon = //`<div style="color: yellow; border: 1px solid white; border-radius: 100%; padding: 4px 5px"><i class="fa-solid fa-triangle-exclamation"></i></div>`;
        
            `<div style="width: 35px">` +
                `<div style="margin: 0 auto; width: 26px; height: 26px; color: yellow; border: 1px solid white; border-radius: 100%;">` +
                //`<div style="color: yellow; border: 1px solid white; border-radius: 100%; padding: 4px 5px">` +
                    `<i class="fa-solid fa-triangle-exclamation" style="font-size: 15px; margin-left: 5px; margin-top: 4px;"></i>` +
                    //`<span class="std_tooltiptext" style="width: 300px; text-align: left">This model was trained on data from the current image set.</span>` +
                `</div>` +
            `</div>`;
        
            // `<td><div class="table_entry std_tooltip" style="background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}` +
            // `<span class="std_tooltiptext">${image_status}</span></div></td>` +

            // `<td><div class="table_entry std_tooltip" style="margin: 0px 1px; background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}</div></td>` +
        
        
        
        }
        else {
            warn_icon = `<div style="width: 35px"></div>`;
        }
        $("#models_table").append(
            `<tr style="border-bottom: 1px solid white; border-color: #4c6645;">` + 
                `<td>` +
                    `<div class="table_entry" style="width: 330px; text-align: left;">${model_details_table}</div>` +
                `</td>` +
                `<td>` +
                    `<div style="width: 5px"></div>` +
                `</td>` +
                `<td>` +
                    `<div style="width: 180px" class="object_entry">${model_object}</div>` +
                `</td>` +

                `<td style="width: 100%">` +
                    //`<div style="width: 100%"></div>` +
                `</td>` +
                `<td>` +
                    `<button id="${button_id}" onclick="select_model('${model_creator}', '${model_name}')" style="font-size: 14px; width: 80px" class="std-button std-button-hover">Select</button>` + 
                `</td>` +
                `<td>` +
                    `<div style="width: 5px"></div>` +
                `</td>` +
                `<td>` +
                    `<button onclick="show_model_details('${model_creator}', '${model_name}')" style="font-size: 14px; width: 80px" class="std-button std-button-hover">Inspect</button>` +
                `</td>` +
/*
                `<td>` +
                    `<table>` +
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 200px" class="object_entry">${model_object}</div>` +
                            `</td>` +
                        `</tr>` +
                        `<tr>` +
                            `<td>` +
                                `<table>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<button onclick="show_model_details('${model_creator}', '${model_name}')" style="padding: 2px; font-size: 14px; width: 100px" class="std-button std-button-hover">Inspect</button>` +
                                        `</td>` +
                                        `<td>` +
                                        
                                            `<button id="${button_id}" onclick="select_model('${model_creator}', '${model_name}')" style="padding: 2px; font-size: 14px; width: 100px" class="std-button std-button-hover">Select</button>` + 
                                        `</td>` +
                                    `</tr>` +
                                `</table>` +
                            `</td>` +
                        `</tr>` +
                    `</table>` +
                `</td>` +*/
                `<td>` +
                    `<div style="width: 5px"></div>` +
                `</td>` +
                `<td>` +
                    warn_icon +
                    //`<div style="width: 100%"></div>` +
                `</td>` +
                // `<td>` +
                //     `<div style="width: 5px"></div>` +
                // `</td>` +

                `<td>` +
                    `<div style="width: 5px"></div>` +
                `</td>` +



            `</tr>`);
    }
}

function select_model(model_creator, model_name) {
    let prev_model_creator = switch_model_data["selected_model"]["model_creator"];
    let prev_model_name = switch_model_data["selected_model"]["model_name"];

    if (prev_model_name !== null && prev_model_creator !== null) {
        let prev_button_id = prev_model_creator + "\\." + prev_model_name;
        enable_std_buttons([prev_button_id]);
    }

    switch_model_data["selected_model"] = {
        "model_creator": model_creator,
        "model_name": model_name

    }
    let button_id = model_creator + "\\." + model_name;
    disable_std_buttons([button_id]);
    enable_std_buttons(["submit_model_change"]);
}


function set_model_weights_to_random() {

    $.post($(location).attr("href"),
    {
        action: "switch_to_random_model"
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

}

function show_models() {


    switch_model_data["models"] = [];
    switch_model_data["selected_model"] = {
        "model_creator": null,
        "model_name": null
    };

    // if (show_public_models) {
    //     $("#show_my_models").removeClass("tab-btn-active");
    //     $("#show_public_models").addClass("tab-btn-active");
    //     $("#show_options").removeClass("tab-btn-active");
    // }
    // else {
    //     $("#show_my_models").addClass("tab-btn-active");
    //     $("#show_public_models").removeClass("tab-btn-active");
    //     $("#show_options").removeClass("tab-btn-active");
    // }
    $("#model_info").empty();
    $("#model_info").append(`<div class="loader"></div>`);

    let model_name_col_width = "250px";
    let model_creator_col_width = "150px";
    let details_col_width = "100px";
    let details_button_width = "80px";
    // let action;
    // if (show_public_models) {
    //     action = "fetch_public_models";
    // }
    // else {
    //     action = "fetch_my_models";
    // }

    $.post($(location).attr("href"),
    {
        action: "fetch_models",
    },
    function(response, status) {
        if (response.error) {
            show_modal_message("Error", response.message); //"An error occurred while fetching the models.");  
        }
        else {
            // console.log(response);
            $("#model_info").empty();

            switch_model_data["models"] = response.models;

            let models = switch_model_data["models"]; //_logs;
                        //[{"name": "foo", "creator": "erik"}, 
                        //  {"name": "bar", "creator": "erik"}, 
                        //  {"name": "baz0-0-0-0", "creator": "erik"}];
            
            if (models.length == 0) {
                $("#model_info").append(`<table><tr><td>No Models Found!</td></tr></table>`);
            }
            else {




                $("#model_info").append(
                    `<table>` +
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 5px"></div>` +
                            `</td>` +
                            `<td>` +
                                `<table>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<h class="header2" style="width: 150px; padding-left: 10px">Models</h>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<div class="scrollable_area" style="height: 350px; width: 800px; border: 1px solid white; overflow-y: scroll; border-radius: 10px;">` +
                                                `<table id="models_table" style="border-collapse: collapse;"></table>` +
                                            `</div>` +
                                        `</td>` +
                                    `</tr>` +
                                `</table>` +
                            `</td>` +
                            `<td style="width: 100%">` +
                                //`<div style="width: 5px"></div>` +
                            `</td>` +

                            `<td>` +
                                `<table>` + 
                                    // `<tr>` +
                                    //     `<td>` +
                                    //         `<button class="std-button std-button-hover">Auto-Select Model</button>` +
                                    //     `</td>` +
                                    // `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<h class="header2" style="width: 150px; padding-left: 10px">Filter</h>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<div style="height: 100px; border: 1px solid white; border-radius: 10px; padding: 10px">` +
                                                `<table id="filter_table"></table>` +
                                            `</div>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<div style="height: 5px"></div>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<h class="header2" style="width: 150px; padding-left: 10px">Sort Order</h>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<div style="height: 100px; border: 1px solid white; border-radius: 10px; padding: 10px">` +
                                                `<table id="sort_table"></table>` +
                                            `</div>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<div style="height: 25px"></div>` +
                                        `</td>` +
                                    `</tr>` +                                    
                                    `<tr>` +
                                        `<td>` +
                                            `<div style="height: 75px; border: 1px solid white; border-radius: 10px; padding: 10px">` +
                                                `<div style="display: inline; color: yellow; border: 1px solid white; border-radius: 100%; padding: 3px 4px">` +
                                                    `<i class="fa-solid fa-triangle-exclamation" style="font-size: 15px"></i>` +
                                                `</div>` +
                                                `<div style="margin-left: 5px; line-height: 1.6; display: inline; font-size: 11px"> This symbol indicates that the model was trained with data from the current image set. Be aware that test data from this image set may have been used during model training.` +
                                                //`<span class="std_tooltiptext" style="width: 300px; text-align: left">This model was trained on data from the current image set.</span>` +
                                                `</div>` +
                                            `</div>` +
                                        `</td>` +
                                    `</tr>` +

                                `</table>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 5px"></div>` +
                            `</td>` +
                        `</tr>` +
                    `</table>`);
                    $("#model_info").append(
                    `<div style="text-align: center;">` +
                        `<div style="height: 30px"></div>` +
                        `<button id="submit_model_change" class="std-button std-button-hover" style="width: 240px">Switch To Selected Model</button>` +
                        `<div style="height: 10px"></div>` +
                        `</div>`);
                disable_std_buttons(["submit_model_change"]);


                let filter_values = {
                    "model_object": [],
                    "model_name": [],
                    "model_creator": []
                };
                let default_creator = "-- All --";
                let default_object = "-- All --";
                for (let model of models) {
                    
                    let model_name = model["model_name"];
                    let model_creator = model["model_creator"];
                    let model_object = model["model_object"];

                    filter_values["model_name"].push(model_name);
                    filter_values["model_creator"].push(model_creator);
                    filter_values["model_object"].push(model_object);

                    if (model_object === metadata["object_name"]) { 
                        default_object = model_object;
                        if (model_creator === username) {
                            default_creator = model_creator;
                        }
                    }

                }

                //valid_filter_values["model_name"] = natsort([... new Set(values)]);
                // switch_model_data["filter_options"]
                // if (action === "fetch_my_models") {
                //     switch_model_data["filter_options"] = {
                //         "model_object": "Model Object",
                //         "model_name": "Model Name"
                //     };
                //     switch_model_data["sort_options"] = ["model_object", "model_name"];


                // }
                // else {
                let option_key_to_label = {
                    "model_object": "Model Object",
                    "model_creator": "Model Creator",
                    "model_name": "Model Name"
                }
                switch_model_data["filter_options"] = ["model_object", "model_creator"];
                // {
                //     "model_object": "Model Object",
                //     "model_creator": "Model Creator",
                //     //"model_name": "Model Name"
                // };
                switch_model_data["sort_options"] = ["model_object", "model_creator", "model_name"];

                // }

                for (let i = 0; i < switch_model_data["sort_options"].length; i++) {

                    
                    let select_id = "sort_combo_" + i;
                    //console.log("adding sort combo", select_id);
                    $("#sort_table").append(
                        `<tr>` +
                        
                            `<td>` +
                                `<div style="width: 50px"></div>` +//100px; text-align: right; margin-right: 10px; font-size: 14px"></div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="text-align: center; width: 200px">` + //style="width: 200px">` +
                                    `<select id="${select_id}" class="nonfixed_dropdown" style="font-size: 14px"></select>` +
                                `</div>` +
                            `</td>` +
                            `<td>` +
                            `<div style="width: 50px"></div>` +
                        `</td>` +
                        `</tr>`
                    );
                    for (let j = i; j < switch_model_data["sort_options"].length; j++) {
                        $("#" + select_id).append($('<option>', {
                            value: switch_model_data["sort_options"][j],
                            text: option_key_to_label[switch_model_data["sort_options"][j]]
                        }));
                    }

                    if (i < switch_model_data["sort_options"].length - 1) {
                        $("#" + select_id).change(function() {
                            let select_num = parseInt(select_id[select_id.length-1]);
                            //console.log("select_num", select_num);
                            let next_id = "sort_combo_" + (select_num+1);
                            let selected_vals = [];
                            for (let k = 0; k <= select_num; k++) {
                                selected_vals.push($("#sort_combo_" + k).val());
                            }
                            //console.log("selected_vals", selected_vals);
                            $("#" + next_id).empty();
                            for (let sort_option of switch_model_data["sort_options"]) {
                                if (!(selected_vals.includes(sort_option))) {
                                    $("#" + next_id).append($('<option>', {
                                        value: sort_option,
                                        text: option_key_to_label[sort_option]
                                    }));
                                }
                            }

                            $("#" + next_id).val($("#" + next_id + ":first").val()).change();
                        });
                    }
                    else {
                        $("#" + select_id).change(function() {
                            create_models_selection_table();
                        });
                    }

                }


                //console.log(filter_values);
                //console.log(switch_model_data["filter_options"]);

                for (let filter_option of switch_model_data["filter_options"]) {

                    let disp_text = option_key_to_label[filter_option]; //switch_model_data["filter_options"][key];
                    //console.log(disp_text);
                    let select_id = filter_option + "_filter";

                    $("#filter_table").append(
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 100px; text-align: right; margin-right: 10px; font-size: 14px">${disp_text}</div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 180px">` +
                                    `<select id="${select_id}" class="dropdown" style="font-size: 14px"></select>` +
                                `</div>` +
                            `</td>` +
                        `</tr>`
                    );



                    $("#" + select_id).append($('<option>', {
                        value: "-- All --",
                        text: "-- All --"
                    }));
                    let unique_filter_values = natsort([... new Set(filter_values[filter_option])]);
                    for (let value of unique_filter_values) {
                        $("#" + select_id).append($('<option>', {
                            value: value,
                            text: value
                        }));
                    }

                    // if (key === "model_object" && unique_filter_values.includes(metadata["object_name"])) {
                    //     $("#" + select_id).val(metadata["object_name"]);
                    // }
                    // else {
                    //     $("#" + select_id).prop("selectedIndex", 0);
                    // }

                    // if (key === "model_creator" && unique_filter_values.includes(username)) {
                    //     $("#" + select_id).val(username);
                    // }
                    // else {
                    //     $("#" + select_id).prop("selectedIndex", 0);
                    // }

                    $("#" + select_id).change(function() {
                        create_models_selection_table();
                    });
                }




                $("#model_object_filter").val(default_object);
                $("#model_creator_filter").val(default_creator);


                create_models_selection_table();


                



                /*
                table 
                tr 
                    //td(style="width: 50%")
                    td(style="width: 100%")
                    td
                        div(style="text-align: right; width: 90px; padding-right: 5px; text-decoration: underline") Sort Order 
                    
                    td
                        div(style="width: 450px")
                            select(id="sort_combo_1" class="nonfixed_dropdown" style="display: inline-block; width: 150px")
                                option(value="object_name") Object Name 
                                option(value="set_owner") Set Owner
                                option(value="set_name") Set Name
                            select(id="sort_combo_2" class="nonfixed_dropdown" style="display: inline-block; width: 150px")
                                option(value="set_owner") Set Owner 
                                option(value="set_name") Set Name
                            select(id="sort_combo_3" class="nonfixed_dropdown" style="display: inline-block;; width: 150px")
                                option(value="set_name") Set Name
                    //td
                    //    div(style="width: 60px")
                    td
                        button(class="std-button std-button-hover" onclick="show_filter()" style="font-size: 16px; padding: 2px; width: 90px; margin: 0px 5px")
                            i(class="fa-solid fa-filter" style="margin-right: 4px; font-size: 14px") 
                            |
                            | Filter

                */

                

/*
                    $("#models_table").append(`<tr>` +
                    `<td><div class="table_entry" style="font-weight: bold; width: ${model_name_col_width}">Name</div></td>` +
                    `<td><div class="table_entry" style="font-weight: bold; width: ${model_creator_col_width}">Creator</div></td></tr>`);

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

                    

                }*/
/*
                $(".models_radio").change(function() {
                    
                    enable_std_buttons(["submit_model_change"]);
                    //console.log("radio changed");
                });*/
            }

            $("#modal").css("display", "block");

            $("#submit_model_change").click(function() {

                
                let new_model_name = switch_model_data["selected_model"]["model_name"];
                let new_model_creator = switch_model_data["selected_model"]["model_creator"];
                possibly_switch_model(new_model_creator, new_model_name);

            });
        }
    });
}

function auto_select_model() {
    show_modal_message(`Model Auto-Select`,
    `<div>Auto-selection relies on annotations to pick the best model for the image set.` +
    ` A minimum of 10 annotations is required. More annotations will improve the system's ability to select the best model.</div>` +
    `<div style="height: 20px"></div>` +
    `<div id="modal_button_container" style="text-align: center">` +
        `<button class="std-button std-button-hover" `+
            `style="width: 150px" onclick="confirmed_auto_select_model()">Continue</button>` +
        `<div style="display: inline-block; width: 10px"></div>` +
        `<button class="std-button std-button-hover" ` +
                                `style="width: 150px" onclick="close_modal()">Cancel</button>` +
    `</div>`
    );
}
function confirmed_auto_select_model() {
    let num_annotations = 0;
    for (let image_name of Object.keys(annotations)) {
        num_annotations += annotations[image_name]["boxes"].length;
    }
    if (num_annotations < 10) {
        show_modal_message(`Error`, `A minimum of 10 objects must be annotated before auto-selection can be performed. Remember to click 'Save All Changes' to send your annotations to the server.`);
    }
    else {

        $.post($(location).attr('href'),
        {
            action: "auto_select_model",
            // annotations: JSON.stringify(annotations),
            //excess_green_record: JSON.stringify(excess_green_record),
            // is_public: metadata["is_public"],
            //train_num_increased: train_num_increased ? "True" : "False"
            //num_training_regions_increased: new_training_regions > 0 ? "yes" : "no",
            // object_name: metadata["object_name"]
        },
        
        function(response, status) {
            
            if (response.error) {
                //create_image_set_table();
                show_modal_message("Error", response.message);
            }
            else {
                close_modal();

            //     show_modal_message("Submitted", "Your auto-select request was successfully submitted.");
            }

        });
    }

}

function change_model() {
    show_modal_message(
        `Select Model`,
        `<div style="height: 500px">` +
            //`<div style="width: 100%">` +
            // `<div>` + 
            //     `<ul class="nav">` +
            //         `<li id="show_my_models" class="nav tab-btn-active" style="width: 150px" onclick="show_models(false)">` +
            //             `<a class="nav">My Models` +
            //                 //`<i class="fa-solid fa-pen-to-square"></i>` +
            //             `</a>` +
            //         `</li>` +

            //         `<li id="show_public_models" class="nav" style="width: 150px" onclick="show_models(true)">` +
            //             `<a class="nav">Public Models` +
            //                 //`<i class="fa-solid fa-pen-to-square"></i>` +
            //             `</a>` +
            //         `</li>` +

            //         `<li id="show_options" class="nav" style="width: 150px" onclick="show_other_models()">` +
            //         `<a class="nav">Options` +
            //             //`<i class="fa-solid fa-pen-to-square"></i>` +
            //         `</a>` +
            //     `</li>` +
            //     `</ul>` +
            // `</div>` +
            //`</div>` +
            `<div style="height: 35px">` +
                `<table>` +
                    // `<tr>` +
                    //     `<td style="height: 5px"><td>` +
                    // `</tr>` +           
                    `<tr>` +
                        `<td>` +
                            `<button id="model_select_back_button" onclick="change_model()" class="std-button std-button-hover" style="margin-bottom: 10px; margin-left: 10px; width: 100px; font-size: 13px; border-radius: 5px; display: none">` +
                                    `<i class="fa-solid fa-caret-left" style="margin-right: 5px"></i>` +
                                    `Back` +
                                //`</i>` +
                            `</button>` +
                            `</td>` +
                        `<td style="width: 100%">` +

                        `</td>` +
                        `<td>` +
                            `<button id="random_weights_button" onclick="set_model_weights_to_random()" class="std-button std-button-hover" style="width: 145px; font-size: 13px; border-radius: 5px;">` +
                                `<i class="fa-solid fa-dice" style="margin-right: 5px"></i>` +
                                    `Set Model Weights To Random Values` +
                                //`</i>` +
                            `</button>` +
                        `</td>` +
                        `<td>` +
                            `<div style="width: 5px"></div>` +
                        `</td>` +
                    `</tr>` +
                `</table>` +
            `</div>` +
            `<div id="model_info">` +
                
            `</div>` +
        `</div>`

    , modal_width=1200, display=false);

    $("#model_select_back_button").hide();
    $("#random_weights_button").show();

    show_models();
}



function add_prediction_buttons() {
    let navigation_type = $('#navigation_dropdown').val();
    let single_text; // = "Current Image";
    let all_text; // = "All Images";
    let multiple = Object.keys(annotations).length > 1;
    if (navigation_type === "images") {
        single_text = "Current Image";
        all_text = "All Images";
    }
    else {
        single_text = "Current Region";
        all_text = "All Regions";
        let num_regions = 0;
        for (let image_name of Object.keys(annotations)) {
            for (let region_key of ["regions_of_interest", "training_regions", "test_regions"]) {
                num_regions += annotations[image_name][region_key].length;
            }
        }
        multiple = num_regions > 1;
    }


    $("#predict_container").empty();
    if (multiple) {
        $("#predict_container").append(
            `<button id="predict_single_button" class="std-button std-button-hover" style="font-size: 16px; width: 130px; border-radius: 30px 0px 0px 30px">${single_text}</button>` +
            `<button id="predict_all_button" class="std-button std-button-hover" style="font-size: 16px; width: 130px; border-radius: 0px 30px 30px 0px; border-left: none">${all_text}</button>`
        );
    }
    else {
        $("#predict_container").append(
            `<button id="predict_single_button" class="std-button std-button-hover" style="font-size: 16px; width: 260px">${single_text}</button>` 
        );
    }
    // let cur_backend_status = $("#backend_status").html();
    // let predicting = cur_backend_status.substring(0, "Predicting".length) == "Predicting";
    // let cur_backend_username = $("#backend_username").html();
    // let cur_backend_farm_name = $("#backend_farm_name").html();
    // let cur_backend_field_name = $("#backend_field_name").html();
    // let cur_backend_mission_date = $("#backend_mission_date").html();

    // if (((((predicting && (cur_backend_username === username)) && 
    //                   (cur_backend_farm_name === farm_name)) &&
    //                   (cur_backend_field_name === field_name)) &&
    //                   (cur_backend_mission_date === mission_date))) {
    //     disable_std_buttons(["predict_single_button", "predict_all_button"]);
    // }
    // else {
    //     enable_std_buttons(["predict_single_button", "predict_all_button"]);
    // }

    // if (predicting) { //(model_unassigned || predicting) {
    //     disable_std_buttons(["predict_single_button", "predict_all_button"]);
    // }
    // else {
    //     enable_std_buttons(["predict_single_button", "predict_all_button"]);
    // }

    $("#predict_single_button").click(function() {
        // console.log("clicked predict_single_button");
        if (model_unassigned) {
            show_modal_message("No Model Selected", "A model must be selected before predictions can be generated.");
        }
        else {
            let navigation_type = $('#navigation_dropdown').val();
            let image_list;
            let region_list;
            if (navigation_type === "images") {
                let image_width = metadata["images"][cur_img_name]["width_px"];
                let image_height = metadata["images"][cur_img_name]["height_px"];
                image_list = [cur_img_name];
                region_list = [[[0, 0, image_height, image_width]]];
            }
            else {
                image_list = [cur_img_name];
                let region = annotations[cur_img_name][navigation_type][cur_region_index];
                region_list = [[region]];
            }

            submit_prediction_request_confirmed(image_list, region_list, false, false, false);
        }
    });

    $("#predict_all_button").click(function() {
        if (model_unassigned) {
            show_modal_message("No Model Selected", "A model must be selected before predictions can be generated.");
        }
        else {
            let navigation_type = $('#navigation_dropdown').val();
            let predict_on_images = navigation_type === "images";
            let res = get_image_list_and_region_list_for_predicting_on_all(predict_on_images);
            let image_list = res[0];
            let region_list = res[1];
            
            submit_prediction_request_confirmed(image_list, region_list, false, false, false);
        }
    });

}

function get_image_list_and_region_list_for_predicting_on_all(predict_on_images) {

    let image_list = [];
    let region_list = [];
    if (predict_on_images) {
        for (let image_name of Object.keys(annotations)) {
            let image_width = metadata["images"][image_name]["width_px"];
            let image_height = metadata["images"][image_name]["height_px"];
            image_list.push(image_name);
            region_list.push([[0, 0, image_height, image_width]]);
        }
    }
    else {
        for (let image_name of Object.keys(annotations)) {
            let image_region_list = [];
            for (let region_key of ["regions_of_interest", "training_regions", "test_regions"]) {
                for (let region of annotations[image_name][region_key]) {
                    image_region_list.push(region);
                }
            }
            if (image_region_list.length > 0) {
                image_list.push(image_name);
                region_list.push(image_region_list);
            }
        }
    }

    return [image_list, region_list];

}


function possibly_switch_model(model_creator, model_name) {
    let num_training_regions = get_num_regions("training_regions");
    if (num_training_regions > 0) {
        show_modal_message(`Warning! You might lose work!`,
        `<div>Please note that switching to a new model will cause the following changes to occur:</div>` +
            `<ul>` +
                `<li style="margin: 10px 0px">The current model weights will be destroyed and will be replaced with the newly selected model weights. Any fine-tuning work will be lost.` +
                
                `<li style="margin: 10px 0px">All fine-tuning regions will be changed to test regions. This allows you to decide which regions will be used to fine-tune the new model. You can change a test region into a fine-tuning region by selecting it and pressing the <span style='border: 1px solid white; font-size: 16px; padding: 0px 5px; margin: 0px 5px'>m</span> key.</li>` +
            `</ul>` +
        `<div style="height: 20px"></div>` +
        `<div id="modal_button_container" style="text-align: center">` +
            `<button class="std-button std-button-hover" `+
                    `style="width: 240px" onclick="switch_model('${model_creator}', '${model_name}')">Switch To Selected Model</button>` +
            `<div style="display: inline-block; width: 10px"></div>` +
            `<button class="std-button std-button-hover" ` +
                    `style="width: 150px" onclick="close_modal()">Cancel</button>` +
        `</div>`, 800
        );
    }
    else {
        switch_model(model_creator, model_name);
    }
}


function switch_model(model_creator, model_name) {

    $.post($(location).attr("href"),
    {
        action: "switch_model",
        model_name: model_name,
        model_creator: model_creator
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
}

function user_health_check() {
    $.post($(location).attr('href'),
    {
        action: "health_check"
    },

    function(response, status) {

        if (response.error) {
            $("#status_blob").removeClass("alive_blob");
            $("#status_blob").addClass("dead_blob");
            show_modal_message("Health Check Failed", response.message);
        }
        else {
            $("#status_blob").removeClass("dead_blob");
            $("#status_blob").addClass("alive_blob");
            show_modal_message("Health Check Succeeded", "The backend process is alive.");
        }
    });
}

function health_check() {
    $.post($(location).attr('href'),
    {
        action: "health_check"
    },

    function(response, status) {

        if (response.error) {
            $("#status_blob").removeClass("alive_blob");
            $("#status_blob").addClass("dead_blob");
        }
        else {
            $("#status_blob").removeClass("dead_blob");
            $("#status_blob").addClass("alive_blob");
        }
    });
}


function create_navigator_viewer() {
    navigator_viewer = OpenSeadragon({
        id: "navigator_viewer", //"seadragon_viewer",
        sequenceMode: true,
        prefixUrl: get_CC_PATH() + "/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 1000,
        zoomPerClick: 1,
        nextButton: "next-btn",
        previousButton: "prev-btn",
        showNavigationControl: false,
        //preserveViewport: true,
        //homeFillsViewer: true,
        //defaultZoomLevel: 1
        //preserveViewport: true,
        imageSmoothingEnabled: true, //true,
        //minZoomLevel: 1,
        //maxZoomLevel: 7
        //minPixelRatio: 2
        //maxZoomPixelRatio: 20
        //homeFillsViewer: true
        //defaultZoomLevel: 1.1,
        //viewportMargins: 20
        //navigatorMaintainSizeRatio: true
        // showNavigator: true,
        // navigatorId: "navigator_div",

        zoomPerScroll: 1,
        panHorizontal: false,
        panVertical: false
    });



    
    navigator_overlay = navigator_viewer.canvasOverlay({
        clearBeforeRedraw: true
    });
}

$(document).ready(function() {

    image_set_info = data["image_set_info"];
    dzi_image_paths = data["dzi_image_paths"];

    //dzi_image_paths.sort();
    /*(function(a, b) {
        return a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'});
    });*/
    annotations = data["annotations"];
    metadata = data["metadata"];
    camera_specs = data["camera_specs"];
    excess_green_record = data["excess_green_record"];
    predictions = data["predictions"];
    overlay_appearance = data["overlay_appearance"];
    tags = data["tags"];

    //window.setInterval(refresh, 90000); // 1.5 minutes
    ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000); // 2 hours
    $("body").click(function() {
        window.clearTimeout(ask_to_continue_handle);
        ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000);
    });
    health_check();
    setInterval(health_check, 60 * 1000); // 1 minute

    set_heights();
    resize_window();

   // $("#training_region_radio_container input:checked ~ .custom_radio").css("background-color", "black");

   //.custom_radio_container input:checked ~ .custom_radio.spec_black
    //$(".custom_radio_container").css("background-color", "black"); //"#809c79");


    set_overlay_color_css_rules();

    // if (metadata["is_ortho"] === "yes") {
    //     $("#predict_container").append(
    //         `<button id="predict_single_button" class="std-button std-button-hover" style="font-size: 16px; width: 260px">Predictions Only</button>` 
    //     );
    // }
    // else {
    //     $("#predict_container").append(
    //         `<button id="predict_single_button" class="std-button std-button-hover" style="font-size: 16px; width: 130px; border-radius: 30px 0px 0px 30px">Current Image</button>` +
    //         `<button id="predict_all_button" class="std-button std-button-hover" style="font-size: 16px; width: 130px; border-radius: 0px 30px 30px 0px; border-left: none">All Images</button>`
    //     );
    // }
    add_prediction_buttons();

    create_overlays_table();
    //set_prediction_overlay_color();

    create_navigator_viewer();

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
    cur_region_index = -1; //0; //-1;
    //set_cur_img_list();

    cur_view = "image";
    cur_panel = "annotation";


    if (metadata["is_ortho"] === "yes") {
        $("#apply_threshold_to_all_button").hide();
    }

    
    //create_viewer("seadragon_viewer");


    create_navigation_table();

    // let num_training_regions = get_num_regions(["training_regions"]);
    // if (num_training_regions > 0) {
    //     $("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
    // }

    // let num_test_regions = get_num_regions(["test_regions"]);
    // if (num_test_regions > 0) {
    //     $("#navigation_dropdown").append($("<option></option>").val("test_regions").text("Test Regions"));
    // }

    update_navigation_dropdown();

    //if (metadata["is_ortho"] === "yes") {
        //$("#ortho_navigation").show();
        //$("#status_table").hide();
    locked_training_regions = {};
    for (let image_name of Object.keys(annotations)) {
        locked_training_regions[image_name] = [];
        for (let i = 0; i < annotations[image_name]["training_regions"].length; i++) {
            locked_training_regions[image_name].push(true);
        }
    }

    if ((can_calculate_density(metadata, camera_specs))) {
        gsd = get_gsd();
    }

    // }
    // else {
    //     //$("#image_set_navigation").show();

    //     //create_image_set_table();

    //     locked_training_images = {};
    //     num_training_images = 0;
    //     for (image_name of Object.keys(annotations)) {
    //         if (annotations[image_name]["status"] === "completed_for_training") {
    //             num_training_images++;
    //         }
    //         locked_training_images[image_name] = (annotations[image_name]["status"] === "completed_for_training");
    //     }
    //     /*
    //     for (let image_name of Object.keys(annotations)) {
    //         locked_training_images[image_name] = (annotations[image_name]["status"] === "completed_for_training");
    //     }*/
    // }


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

        //console.log(update);

        if (update["auto_select_request"] === "True") {
            disable_std_buttons(["auto_select_button"]);
        }
        else {
            enable_std_buttons(["auto_select_button"]);
        }

        if (update["switch_request"] === "True") {
            waiting_for_model_switch = true;

            show_modal_message(`Please Wait`, 
            `<div id="switch_anno_message">Switching models...</div><div id="switch_anno_loader" class="loader"></div>`);
            $("#modal_close").hide();
        }
        else if (waiting_for_model_switch) {
            waiting_for_model_switch = false;
            //enable_std_buttons(["auto_select_button"]);
            //if (metadata["is_ortho"] === "yes") {
                //num_training_regions = 0;
            for (let image_name of Object.keys(annotations)) {
                for (let i = 0; i < annotations[image_name]["training_regions"].length; i++) {
                    annotations[image_name]["test_regions"].push(annotations[image_name]["training_regions"][i]);
                }
                annotations[image_name]["training_regions"] = [];
                locked_training_regions[image_name] = [];
            }
        
            
            update_navigation_dropdown();
            //$("#navigation_dropdown").val("images");
            //let init_image_name = basename(dzi_image_paths[0]);
            //init_image_name = init_image_name.substring(0, init_image_name.length - 4);
            //cur_region_index = -1;
            //}
            // else {
            //     num_training_images = 0;
            //     for (let image_name of Object.keys(annotations)) {
                    
            //         if (annotations[image_name]["status"] === "completed_for_training") {
            //             annotations[image_name]["status"] = "completed_for_testing"
            //         }
            //     }
            //     create_image_set_table();
            //     set_image_status_combo();
            // }
            cur_panel = "annotation";
            //change_image(init_image_name + "/-1");
            //show_annotation();

            $("#navigation_dropdown").val("images").change();
            close_modal();
        }

        //if (metadata["is_ortho"] === "yes") {
        num_regions_fully_trained_on = update["num_regions_fully_trained_on"];
        // }
        // else {
        //     num_images_fully_trained_on = update["num_images_fully_trained_on"];
        // }
        model_unassigned = (!("model_name" in update)) || (update["model_name"] === "---");

        let model_name;
        if ("model_name" in update) {
            model_name = update["model_name"];
        }
        else {
            model_name = "---";
        }
        $("#model_name").html(model_name);

        if (model_unassigned) {
            // $("#model_fully_fine_tuned").html("---");
            $("#model_details").hide();
            $("#no_model_message").show();
            //$("#regions_fully_fine_tuned_on").html(``);
            //$("#regions_fully_fine_tuned_on_container").css("border", "none");
            //disable_std_buttons(["request_result_button", "predict_single_button", "predict_all_button"]);
        }
        else {

            $("#model_details").show();
            $("#no_model_message").hide();

            let fully_trained;
            let fine_tuned;
            //if (metadata["is_ortho"] === "yes") {
            let num_training_regions = get_num_regions("training_regions");

            fully_trained = num_training_regions == num_regions_fully_trained_on;
            fine_tuned = num_training_regions > 0;
            // }
            // else {
            //     fully_trained = num_training_images == num_images_fully_trained_on;
            //     fine_tuned = num_training_images > 0;
            // }
            // if (fully_trained && fine_tuned) { //num_training_images == num_images_fully_trained_on) {
            //     $("#model_fully_fine_tuned").html("Yes");
            // }
            // else {
            //     $("#model_fully_fine_tuned").html("No");
            // }
            //let fully_fine_tuned = (fully_trained && fine_tuned);

            // let updated_fined_tuned_html;
            // if (fine_tuned) {
            //     if (fully_trained) {
            //         updated_fined_tuned_html = `Yes <i style="margin-left: 40px" class="fa-solid fa-check"></i>`;
            //     }
            //     else {
            //         updated_fined_tuned_html = `Yes<i style="margin-left: 40px" class="fa-solid fa-spinner fa-spin"></i>`;
            //     }
            // }
            // else {
            //     updated_fined_tuned_html = `No`;
            // }

            // if ($("#model_fine_tuned").html() !== updated_fined_tuned_html) {
            //     $("#model_fine_tuned").html(updated_fined_tuned_html);
            // }

            $("#regions_fully_fine_tuned_on").html(`Fully trained on <span style="color: white">${num_regions_fully_trained_on}</span> of <span style="color: white">${num_training_regions}</span> available fine-tuning regions.`);
        }

        if (update["outstanding_prediction_requests"] === "True") { //|| model_unassigned) {
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
            let display_statuses = ["Fine-Tuning", "Predicting", "Collecting Metrics", "Calculating Vegetation Coverage", 
                                    "Calculating Voronoi Areas", "Switching Models", "Selecting Model", "Idle", "Training"];
            let update_is_for_this_set = ((update_username === username && update_farm_name === image_set_info["farm_name"]) &&
            (update_field_name === image_set_info["field_name"] && update_mission_date === image_set_info["mission_date"]));

            //console.log("status", status);
            if (display_statuses.includes(status)) {
                //$("#backend_status").empty();
                if (status === "Predicting") {
                    //console.log(update);
                    $("#backend_status").html(`Predicting`); //`Predicting: <span style="text-align: right; display: inline-block; width: 45px;">${percent_complete}</span>`);
                    if ("percent_complete" in update) {
                        //let num_processed = parseInt(update["num_processed"]);
                        //let num_images = parseInt(update["num_images"]);
                        let percent_complete = (update["percent_complete"]) + "%";
                        /*
                        let percent_complete_length = percent_complete.length;
                        console.log(percent_complete_length);
                        if (percent_complete_length == 1) {
                            percent_complete = "  " + percent_complete;
                        }
                        else if (percent_complete_length == 2) {
                            percent_complete = " " + percent_complete;
                        }*/
                        // status = status + ":"; // + percent_complete + "%"; //": " + num_processed + " / " + num_images;
                        // $("#backend_status").append(`<table><tr><td>${status}</td><td style="text-align: right; width: 45px">${percent_complete}</td></tr></table>`);
                        //<div style="text-align: center">${status}<span style="float: right; color: yellow">${percent_complete}</span></div>`);
                        
                        $("#backend_status_details").html(percent_complete);
                    }
                    else if ("Saving Predictions" in update) {
                        $("#backend_status_details").html("Saving Predictions");
                    }
                }
                else if ((status === "Fine-Tuning") || (status === "Training")) {
                    let epochs_since_improvement = update["epochs_since_improvement"];
                    let epoch_word = "epochs";
                    if (epochs_since_improvement == 1) {
                        epoch_word = "epoch";
                    }
                    //$("#backend_status").html(`Fine-Tuning: <span style="text-align: right; display: inline-block; width: 360px;">${epochs_since_improvement} epochs since improvement</span>`);
                    $("#backend_status").html(status);
                    $("#backend_status_details").html(`${epochs_since_improvement} ${epoch_word} since improvement`);
                }
                else {
                    $("#backend_status").html(status);
                    $("#backend_status_details").html("");
                }

                $("#backend_update_time").html(date);
                // let seconds_since_update = update["seconds_since_last_update"];
                // let time_unit;
                // let units_since_update;
                // if (seconds_since_update > 604800) {
                //     units_since_update = Math.round(seconds_since_update / 604800);
                //     if (units_since_update == 1) {
                //         time_unit = "week";
                //     }
                //     else {
                //         time_unit = "weeks";
                //     }
                // }
                // else if (seconds_since_update > 86400) {
                //     units_since_update = Math.round(seconds_since_update / 86400);
                //     if (units_since_update == 1) {
                //         time_unit = "day";
                //     }
                //     else {
                //         time_unit = "days";
                //     }
                // }
                // else if (seconds_since_update > 3600) {
                //     units_since_update = Math.round(seconds_since_update / 3600);
                //     if (units_since_update == 1) {
                //         time_unit = "hour";
                //     }
                //     else {
                //         time_unit = "hours";
                //     }
                // }
                // else if (seconds_since_update > 60) {
                //     units_since_update = Math.round(seconds_since_update / 60);
                //     if (units_since_update == 1) {
                //         time_unit = "minute";
                //     }
                //     else {
                //         time_unit = "minutes";
                //     }
                // }
                // else {
                //     units_since_update = seconds_since_update;
                //     if (units_since_update == 1) {
                //         time_unit = "second";
                //     }
                //     else {
                //         time_unit = "seconds";
                //     }
                // }
                
                // $("#backend_update_time").html(`${units_since_update} ${time_unit} ago`);

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
                else if ("prediction_image_names" in update) {

                    /*
                    let prediction_image_names = update["prediction_image_names"].split(",");
                    for (let prediction_image_name of prediction_image_names) {
                        delete predictions[prediction_image_name];
                    }

                    if ((cur_panel === "prediction") && (prediction_image_names.includes(cur_img_name))) {
                        show_prediction(false);
                    }*/

                    
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
                                
                                /*
                                for (let annotation of predictions[prediction_image_name]["annotations"]) {
                                    annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"});
                                }*/

                                if (prediction_image_name in voronoi_data && "prediction" in voronoi_data[prediction_image_name]) {
                                    delete voronoi_data[prediction_image_name]["prediction"];
                                }
                            }

                            if ((cur_panel === "prediction") && (prediction_image_names.includes(cur_img_name))) {

                                show_prediction();
                                /*
                                
                                $("#predictions_unavailable").hide();
                                $("#predictions_available").show();
                                set_count_chart_data();
                                set_score_chart_data();
                                
                                update_count_chart();
                                update_score_chart();

                                add_annotations();*/
                            }
                        }
                    });
                    
                }

                // else if (status === "Selecting Model") {
                //     disable_std_buttons(["auto_select_button"]);

                // }

                else if (status === "Finished Selecting Model") {
                    // enable_std_buttons(["auto_select_button"]);
                    let model_creator = update["model_creator"];
                    let model_name = update["model_name"];
                    let server_message = update["message"];
                    show_modal_message("Finished Auto-Selecting Model",
                    `<div>` +
                        `<div>The following model has been auto-selected:</div>` +
                        `<div style="height: 10px"></div>` +
                        `<table style="border: 1px solid white; border-radius: 10px">` +
                            `<tr>` +
                                `<td>` + 
                                    `<div class="header2" style="font-size: 14px; width: 100px; text-align: right">Model Creator</div>` +
                                `</td>` +
                                `<td>` +
                                    `<div style="font-size: 14px; width: 200px; text-align: left; margin-left: 10px">${model_creator}</div>` +
                                `</td>` +
                            `</tr>` +
                            `<tr>` +
                                `<td>` + 
                                    `<div class="header2" style="font-size: 14px; width: 100px; text-align: right">Model Name</div>` +
                                `</td>` +
                                `<td>` +
                                    `<div style="font-size: 14px; width: 200px; text-align: left; margin-left: 10px">${model_name}</div>` +
                                `</td>` +
                            `</tr>` +
                        `</table>` +
                        `<div style="height: 20px"></div>` +
                        `<div style="border: 1px solid white; width: 95%; margin: 0 auto; padding: 2px 8px; border-radius: 10px">` +
                            `<table>` +
                                `<tr>` +
                                    `<td>` +
                                        `<div class="header2" style="font-size: 14px; width: 120px">Server Message:</div>` +
                                    `</td>` +
                                    `<td>` +
                                        `<div style="font-size: 14px; margin-left: 10px">${server_message}</div>` +
                                    `</td>` +
                                `</tr>` +
                            `</table>` +
                        `</div>` +
                        `<div style="height: 20px"></div>` +
                        `<div id="modal_button_container" style="text-align: center">` +
                            `<button class="std-button std-button-hover" `+
                                    `style="width: 240px" onclick="possibly_switch_model('${model_creator}', '${model_name}')">Switch To Selected Model</button>` +
                            `<div style="display: inline-block; width: 10px"></div>` +
                            `<button class="std-button std-button-hover" ` +
                                    `style="width: 150px" onclick="close_modal()">Cancel</button>` +
                        `</div>` +


                    `</div>`

                    );
                }
            }




        }

    });


    update_count_combo(false);

    // $('#chart_combo').append($('<option>', {
    //     value: "Count",
    //     text: "Count"
    // }));
    // $('#chart_combo').append($('<option>', {
    //     value: "Percent Count Error",
    //     text: "Percent Count Error"
    // }));
    // if (can_calculate_density(metadata, camera_specs)) {
    //     $('#chart_combo').append($('<option>', {
    //         value: "Count per square metre",
    //         text: "Count per square metre"
    //     }));
    // }


    $("#chart_combo").change(function() {
        set_count_chart_data();
        update_count_chart();
    });


    set_count_chart_data();
    set_score_chart_data();
    
    draw_count_chart();
    draw_score_chart();


    //draw_ground_cover_chart();
    
    // if (metadata["is_ortho"] === "yes") {
    //     $("#image_sugggestion_container").hide();
    // }
    // if (metadata["is_ortho"] === "no") {
    //     draw_ground_cover_chart();
    // }
    // else {
    //     $("#image_sugggestion_container").hide();


    //     $("#show_segmentation_button").hide();
    //     $("#show_annotation_button").css("width", "148px");
    //     $("#show_prediction_button").css("width", "148px");
    // }


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



    //show_image();
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
        }
        else {
            $("#map_tile_size_controls").hide();
        }
    }
    
    show_image(cur_img_name);
    
    //show_annotation();

    $("#save_button").click(async function() {
        // window.clearTimeout(ask_to_continue_handle);
        // ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000);

        await unselect_selected_annotation();


        // if (metadata["is_ortho"] === "yes") {
        let new_training_regions = 0;
        for (let image_name of Object.keys(annotations)) {
            for (let i = 0; i < locked_training_regions[image_name].length; i++) {
                if (!(locked_training_regions[image_name][i])) {
                    new_training_regions++;
                }
            }
        }
        if (new_training_regions > 0) {
            let msg;
            if (new_training_regions == 1) {
                msg = "You have added a new fine-tuning region. " +
                "Once the save operation completes, you will be prevented from editing this region.";
            }
            else {
                msg = "You have added new fine-tuning regions. " +
                "Once the save operation completes, you will be prevented from editing these regions.";
            }
            show_modal_message(
                `Notice`,
                `<div style="height: 30px">${msg}</div>` +
                `<div style="height: 20px"></div>` +
                `<div id="modal_button_container" style="text-align: center">` +
                    `<button id="confirm_save" class="std-button std-button-hover" `+
                            `style="width: 180px; margin: 2px" onclick="continue_with_save()">Continue with Save</button>` +
                    `<button id="cancel_delete" class="std-button std-button-hover" ` +
                            `style="width: 180px; margin: 2px" onclick="close_modal()">Cancel</button>` +
                    `<div style="height: 20px" id="loader_container"></div>` +
                `</div>`
            )
        }
        else {
            save_annotations();
        }

            //save_annotations_for_ortho();
        // }
        // else {

        //     let new_training_images = 0;
        //     for (let image_name of Object.keys(annotations)) {
        //         if ((annotations[image_name]["status"] === "completed_for_training") && (!(locked_training_images[image_name]))) {
        //             new_training_images++;
        //         }
        //     }
        //     if (new_training_images > 0) {
        //         let msg;
        //         if (new_training_images == 1) {
        //             msg = "You have marked an image as 'Completed for Fine-Tuning'. " +
        //             "Once the save operation completes, you will be unable to edit this image.";
        //         }
        //         else {
        //             msg = "You have marked multiple images as 'Completed for Fine-Tuning'. " +
        //             "Once the save operation completes, you will be unable to edit these images.";
        //         }
        //         show_modal_message(
        //             `Notice`,
        //             `<div style="height: 30px">${msg}</div>` +
        //             `<div style="height: 20px"></div>` +
        //             `<div id="modal_button_container" style="text-align: center">` +
        //                 `<button id="confirm_save" class="std-button std-button-hover" `+
        //                         `style="width: 180px; margin: 2px" onclick="save_annotations_for_image_set()">Continue with Save</button>` +
        //                 `<button id="cancel_delete" class="std-button std-button-hover" ` +
        //                         `style="width: 180px; margin: 2px" onclick="close_modal()">Cancel</button>` +
        //                 `<div style="height: 20px" id="loader_container"></div>` +
        //             `</div>`
        //         )
        //     }
        //     else {
        //         save_annotations_for_image_set();
        //     }
        // }
    });

    // $("#status_combo").change(function() {

    //     let new_status = $("#status_combo").val();
    //     if (new_status === "completed_for_training") {
    //         //train_num_increased = true;
    //         locked_training_images[cur_img_name] = true;
    //     }
    //     annotations[cur_img_name]["status"] = new_status;
    //     set_image_status_combo();
    //     $("#save_icon").css("color", "#ed452b");
    //     create_image_set_table();

    //     //$("#use_for_radio").prop('disabled', false);
    // });

    $("#next_tile_button").click(function() {
        grid_zoomed = false;
        //cur_lawnmower_tiles = lawnmower_tiles;
        if (cur_gridview_tile_index < cur_gridview_tiles.length-1) {
            cur_gridview_tile_index++;
        }
        // let dzi_image_path = image_to_dzi[cur_img_name];
        viewer.raiseEvent('update-viewport');
        
        // viewer.open(dzi_image_path);
        // cur_lawnmower_tile_index++; // = 0;
        $("#gridview_info").text(
            `Current Tile: ${cur_gridview_tile_index+1} / ${cur_gridview_tiles.length}`
        );

        if (cur_gridview_tile_index == cur_gridview_tiles.length-1) {
            disable_std_buttons(["next_tile_button"]);
        }

        enable_std_buttons(["prev_tile_button"]);


    });


    $("#prev_tile_button").click(function() {
        grid_zoomed = false;
        //cur_lawnmower_tiles = lawnmower_tiles;
        if (cur_gridview_tile_index > 0) {
            cur_gridview_tile_index--;
        }
        // let dzi_image_path = image_to_dzi[cur_img_name];
        viewer.raiseEvent('update-viewport');
        // viewer.open(dzi_image_path);
        // cur_lawnmower_tile_index--; // = 0;
        $("#gridview_info").text(
            `Current Tile: ${cur_gridview_tile_index+1} / ${cur_gridview_tiles.length}`
        );

        if (cur_gridview_tile_index == 0) {
            disable_std_buttons(["prev_tile_button"]);
        }
        enable_std_buttons(["next_tile_button"]);

    });

    $("#exit_gridview_button").click(function() {
        $("#control_panel").show();
        $("#gridview_panel").hide();

        // $('#navigation_dropdown').prop("disabled", false);
        // enable_buttons(["view_button_container"]);

        viewer.zoomPerScroll = 1.2;
        viewer.panHorizontal = true;
        viewer.panVertical = true;
        overlay.onRedraw = anno_and_pred_onRedraw;
        //viewer.world.resetItems();
        set_cur_bounds();

        let dzi_image_path = image_to_dzi[cur_img_name];
        viewer.open(dzi_image_path);
    })

    $("#gridview_button").click(function() {


        $("#control_panel").hide();
        $("#gridview_panel").show();

        $("#engage_grid").show();
        $("#disengage_grid").hide();
        $("#engaged_grid_controls").hide();

    
        $("#grid_overlap_percent_input").prop("disabled", false);
        $("#grid_setting_controls").css("opacity", 1.0);

        // $('#navigation_dropdown').prop("disabled", true);
        //disable_buttons(["view_button_container"]);

    });

    $("#disengage_grid").click(function() {
        $("#engage_grid").show();
        $("#disengage_grid").hide();
        $("#engaged_grid_controls").hide();

        $("#grid_overlap_percent_input").prop("disabled", false);
        $("#grid_setting_controls").css("opacity", 1.0);


        // $('#navigation_dropdown').prop("disabled", false);
        // enable_buttons(["view_button_container"]);

        viewer.zoomPerScroll = 1.2;
        viewer.panHorizontal = true;
        viewer.panVertical = true;
        overlay.onRedraw = anno_and_pred_onRedraw;
        //viewer.world.resetItems();


        let image_width_px = metadata["images"][cur_img_name]["width_px"];
        let image_height_px = metadata["images"][cur_img_name]["height_px"];


        let cur_tile = cur_gridview_tiles[cur_gridview_tile_index];
        let hw_ratio = image_height_px / image_width_px;
        
        let viewport_bounds = [
            cur_tile[1] / image_width_px,
            (cur_tile[0] / image_height_px) * hw_ratio,
            (cur_tile[3] - cur_tile[1]) / image_width_px,
            ((cur_tile[2] - cur_tile[0]) / image_height_px) * hw_ratio
        ];

        // map_zoom_bounds = [
        //     viewport_bounds[0],
        //     viewport_bounds[1],
        //     viewport_bounds[2],
        //     viewport_bounds[3]
        // ];
        cur_bounds = new OpenSeadragon.Rect(
            viewport_bounds[0],
            viewport_bounds[1],
            viewport_bounds[2],
            viewport_bounds[3]
        );


        let dzi_image_path = image_to_dzi[cur_img_name];
        viewer.open(dzi_image_path);
        // withFastOSDAnimation(viewer.viewport, function() {
        //     viewer.viewport.fitBounds(viewport_bounds);
        // });
    

    });


    $("#grid_overlap_percent_input").on("input", function(e) {
        if (update_grid_overlap_percent()) {
            enable_std_buttons(["engage_grid"]);
        }
        else {
            disable_std_buttons(["engage_grid"]);
        }
    });


    // $("#zoom_level_setting").on("input", function(e) {
    //     if (update_zoom_level()) {
    //         viewer.viewport.zoomTo(parseFloat($("#zoom_level_setting").val()));
    //     }
    //     else {
    //         viewer.viewport.zoomTo(viewer.viewport.getZoom());
    //     }

    //     // if (update_grid_overlap_percent()) {
    //     //     enable_std_buttons(["engage_grid"]);
    //     //     viewer.zoomTo($("#zoom_level_setting").val());
    //     // }
    //     // else {
    //     //     disable_std_buttons(["engage_grid"]);
    //     // }
    // });




    $("#engage_grid").click(function() {

        $("#engaged_grid_controls").show();


        $("#engage_grid").hide();
        $("#disengage_grid").show();

        $("#grid_overlap_percent_input").prop("disabled", true);
        $("#grid_setting_controls").css("opacity", 0.5);

        // disable_buttons(["view_button_container"]);


        let viewer_bounds = viewer.viewport.getBounds();
        // let container_size = viewer.viewport.getContainerSize();
    
        let hw_ratio = overlay.imgHeight / overlay.imgWidth;
        let min_x = Math.floor(viewer_bounds.x * overlay.imgWidth);
        let min_y = Math.floor((viewer_bounds.y / hw_ratio) * overlay.imgHeight);
        let viewport_w = Math.ceil(viewer_bounds.width * overlay.imgWidth);
        let viewport_h = Math.ceil((viewer_bounds.height / hw_ratio) * overlay.imgHeight);
        let max_x = min_x + viewport_w;
        let max_y = min_y + viewport_h;

        let tile_w = max_x - min_x;
        let tile_h = max_y - min_y;

        let tile_size = Math.min(tile_w, tile_h);

        // for (let image_name of Object.keys(annotations)) {

        let region_min_y;
        let region_min_x;
        let region_max_y;
        let region_max_x;

        let navigation_type = $("#navigation_dropdown").val()
        if (navigation_type === "images") {
            region_min_y = 0;
            region_min_x = 0
            region_max_y = metadata["images"][cur_img_name]["height_px"];
            region_max_x = metadata["images"][cur_img_name]["width_px"];
        }
        else if (navigation_type === "regions_of_interest") {
            let region = annotations[cur_img_name]["regions_of_interest"][cur_region_index];
            let region_bbox = get_bounding_box_for_polygon(region);
            region_min_y = region_bbox[0];
            region_min_x = region_bbox[1];
            region_max_y = region_bbox[2];
            region_max_x = region_bbox[3];
            // region_w = region_bbox[3] - region_bbox[1];
            // region_h = region_bbox[2] - region_bbox[0];
        }
        else {
            let region = annotations[cur_img_name][navigation_type][cur_region_index];
            region_min_y = region[0];
            region_min_x = region[1];
            region_max_y = region[2];
            region_max_x = region[3];
            // region_w = region[3] - region[1];
            // region_h = region[2] - region[0];
        }

        // let image_w = metadata["images"][cur_img_name]["width_px"];
        // let image_h = metadata["images"][cur_img_name]["height_px"];


        let tile_overlap_percent = parseFloat($("#grid_overlap_percent_input").val());
        let overlap_px = Math.floor(tile_size * tile_overlap_percent);

        // let incr = tile_size - overlap_px;
        // let w_covered = Math.max(image_w - tile_size, 0);
        // let num_w_tiles = Math.ceil(w_covered / incr) + 1;

        // let h_covered = Math.max(image_h - tile_size, 0);
        // let num_h_tiles = Math.ceil(h_covered / incr) + 1;

        // let num_tiles = num_w_tiles * num_h_tiles;

        let subject_polygon = [];
        if (navigation_type === "regions_of_interest") {
            let region = annotations[cur_img_name]["regions_of_interest"][cur_region_index];
            for (let c of region) {
                subject_polygon.push([c[1], c[0]]);
            }
        }

        let gridview_tiles = []
        let col_covered = false;
        let tile_min_y = region_min_y; //0;
        while (!col_covered) {
            let tile_max_y = tile_min_y + tile_size;
            // let max_content_y = tile_max_y;
            if (tile_max_y >= region_max_y) {
                //max_content_y = region_h;
                tile_max_y = region_max_y;
                tile_min_y = tile_max_y - tile_size;
                col_covered = true;
            }

            let row_covered = false;
            let tile_min_x = region_min_x; //0;
            while (!row_covered) {
                let tile_max_x = tile_min_x + tile_size;
                // let max_content_x = tile_max_x;
                if (tile_max_x >= region_max_x) {
                    tile_max_x = region_max_x;
                    tile_min_x = tile_max_x - tile_size;
                    // max_content_x = image_w;
                    row_covered = true;
                }

                let tile = [tile_min_y, tile_min_x, tile_max_y, tile_max_x];

                let add = true;
                if (navigation_type === "regions_of_interest") {

                    let clip_polygon = [
                        [tile_min_x, tile_min_y],
                        [tile_max_x, tile_min_y],
                        [tile_max_x, tile_max_y],
                        [tile_min_x, tile_max_y]
                    ];

                    let clipped_polygon = clip_polygons(subject_polygon, clip_polygon);
                    if (get_polygon_area(clipped_polygon) == 0) {
                        add = false;
                    }
                }

                    

                //     // let test_region = [];
                //     let region = annotations[cur_img_name]["regions_of_interest"][cur_region_index];
                //     // for (let i = 0; i < region.length; i++) {
                //     //     test_region.push(region[i]);
                //     // }
                //     // test_region.push([tile_min_y, tile_min_x]);
                //     // test_region.push([tile_min_y, tile_max_x]);
                //     // test_region.push([tile_max_y, tile_max_x]);
                //     // test_region.push([tile_max_y, tile_min_x]);
                //     // if (polygon_is_self_intersecting(test_region)) {
                //     //     add = true;
                //     // }
                //     // else {
                //     //     console.log("not self-intersecting")
                //     //     add = false;
                //     // }

                //     let test_tile_poly = [
                //         [[tile_min_x, tile_min_y], [tile_min_x, tile_max_y]],
                //         [[tile_min_x, tile_max_y], [tile_max_x, tile_max_y]],
                //         [[tile_max_x, tile_max_y], [tile_max_x, tile_min_y]],
                //         [[tile_max_x, tile_min_y], [tile_min_x, tile_min_y]]
                //     ];
                //     add = false;
                //     for (let i = 0; i < region.length; i++) {
                //         let reg_line_seg = [
                //             [region[i][1], region[i][0]],
                //             [region[(i+1)%region.length][1], region[(i+1)%region.length][0]]
                //         ];
                //         for (let line_seg of test_tile_poly) {
                //             if (intersect(line_seg[0], line_seg[1], reg_line_seg[0], reg_line_seg[1])) {
                //                 add = true;
                //                 break;
                //             }
                //         }
                //     }
                //     if (((point_is_inside_polygon([tile_min_y, tile_min_x], region)) &&
                //         (point_is_inside_polygon([tile_min_y, tile_max_x], region))) &&
                //         ((point_is_inside_polygon([tile_max_y, tile_max_x], region)) &&
                //         (point_is_inside_polygon([tile_max_y, tile_min_x], region)))) {
                //             add = true;
                //     }
                // }
                
                if (add) {
                    gridview_tiles.push(tile);
                }


                                
                tile_min_x += (tile_size - overlap_px);

                
            }

            tile_min_y += (tile_size - overlap_px);    
        }

        cur_gridview_tiles = gridview_tiles;
        cur_gridview_tile_index = 0;
        // }


        // console.log(lawnmower_tiles);


        // viewer.world.getItemAt(0).setClip(
        //     new OpenSeadragon.Rect(
        //         region[1],
        //         region[0],
        //         (region[3] - region[1]),
        //         (region[2] - region[0])
        //     )
        // );

        // zoom_to_tile(lawnmower_tiles[0]);


        viewer.zoomPerScroll = 1;
        viewer.panHorizontal = false;
        viewer.panVertical = false;
        //viewer.showNavigator = true;
        // anno.setDrawingEnabled(true);



        // $("#gridview_info").text(
        //     `Current Tile: ${cur_gridview_tile_index[cur_img_name]+1} / ${cur_gridview_tiles[cur_img_name].length}`
        // );

        // disable_std_buttons(["prev_tile_button"]);
        // if (cur_gridview_tiles[cur_img_name].length == 1) {
        //     disable_std_buttons(["next_tile_button"]);
        // }

        overlay.onOpen = function() {

            // let tile_index = cur_gridview_tiles[cur_img_name][cur_gridview_tile_index[cur_img_name]];
            $("#gridview_info").text(
                `Current Tile: ${cur_gridview_tile_index+1} / ${cur_gridview_tiles.length}`
            );

            if (cur_gridview_tile_index == 0) {
                disable_std_buttons(["prev_tile_button"]);
            }
            else {
                enable_std_buttons(["prev_tile_button"]);
            }

            if (cur_gridview_tile_index == cur_gridview_tiles.length - 1) {
                disable_std_buttons(["next_tile_button"]);
            }
            else {
                enable_std_buttons(["next_tile_button"]);
            }

            // enable_std_buttons(["next_tile_button"]);
            // disable_std_buttons(["prev_tile_button"]);
            // if (cur_gridview_tiles[cur_img_name].length == 1) {
            //     disable_std_buttons(["next_tile_button"]);
            // }
            grid_zoomed = false;
            navigator_viewer.open(dzi_image_path);
        }

        overlay.onRedraw = gridview_onRedraw;
        //viewer.world.resetItems();

        let dzi_image_path = image_to_dzi[cur_img_name];
        viewer.open(dzi_image_path);



    });

    $("#help_button").click(function() {

        let head = "Help";
        let message = `<div style="line-height: 150%; padding: 10px">&#8226; Hold the <span style='border: 1px solid white; font-size: 14px; padding: 5px 10px; margin: 0px 5px'>SHIFT</span> key and left mouse button to create a new annotation or region.` +
        `<br><br>&#8226; Click on an existing annotation / region to select it and change its boundaries.` +
        `<br><br>&#8226; Use the <span style='border: 1px solid white; font-size: 14px; padding: 5px 10px; margin: 0px 5px'>DELETE</span> key to remove whichever annotation / region is currently selected.` + 
        `<br><br>&#8226; When creating a region of interest, double click the left mouse button to complete the region.` +                
        `<br><br>&#8226; If a test region is selected, pressing the <span style='border: 1px solid white; font-size: 16px; padding: 5px 10px; margin: 0px 5px'>m</span> key will change that region into a fine-tuning region.` + 
        `<br><br>&#8226; Press the  <span style='border: 1px solid white; font-size: 16px; padding: 5px 10px; margin: 0px 5px'>s</span> key to toggle excess green annotation snapping. ` + 
        ` When active, newly drawn annotations will snap to the boundaries of the current excess green segmentation.` + 
        `<br><br>&#8226; Don't forget to save your work!</div>`;
        show_modal_message(head, message, modal_width=750);
    })

    $("#request_result_button").click(function() {
        if (model_unassigned) {
            show_modal_message("No Model Selected", "A model must be selected before predictions can be generated.");
        }
        else {
            let image_list = [];
            let region_list = [];
            for (let image_name of Object.keys(annotations)) {
                image_list.push(image_name);
                let image_height = metadata["images"][image_name]["height_px"];
                let image_width = metadata["images"][image_name]["width_px"];
                region_list.push([[0, 0, image_height, image_width]]);
            }


            //submit_prediction_request(JSON.stringify(image_list), JSON.stringify(region_list));
            submit_result_request();
        }
    });


    $("#use_predictions_button").click(function() {
        $("#modal_head").empty();
        $("#modal_body").empty();
    
        $("#modal_head").append(
        `<span class="close close-hover" id="modal_close">&times;</span>` +
        `<p>Are you sure?</p>`);
    
        let navigation_type = $('#navigation_dropdown').val();
        let roi;
        if (navigation_type === "images") {
            roi = "image";
        }
        else {
            roi = "region";
        }
        $("#modal_body").append(`<p id="modal_message" align="left"></p>`);
        $("#modal_message").html("This action will remove all existing annotations for this " + roi + ".");

        $("#modal_body").append(`<div id="modal_button_container">
        <button class="std-button std-button-hover" `+
        `style="width: 200px" onclick="confirmed_use_predictions()">Continue</button>` +
        `<div style="display: inline-block; width: 10px"></div>` +
        `<button class="std-button std-button-hover" ` +
        `style="width: 200px" onclick="close_modal()">Cancel</button>` +
        `</div>`);
        
        $("#modal_close").click(function() {
            close_modal();
        });
    
        $("#modal").css("display", "block");
    });

    
    $("#overlays_table").change(function() {
        //add_annotations();
        // if (($("#voronoi_annotation").is(":checked")) || ($("#voronoi_prediction").is(":checked"))) {
        //     if (voronoi_data)
        //     if (voronoi_data["annotation"] == null || voronoi_data["prediction"] == null) {
        //         compute_voronoi();
        //     }
        // }
        // else {
        //     voronoi_data["annotation"] = null;
        //     voronoi_data["prediction"] = null;
        // }

        viewer.raiseEvent('update-viewport');
    });


    $("#scores_switch").change(function() {
        viewer.raiseEvent('update-viewport');
        //add_annotations();
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



    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#confidence_slider_val").html("> " + slider_val);

        if (cur_img_name in voronoi_data && "prediction" in voronoi_data[cur_img_name]) {
            delete voronoi_data[cur_img_name]["prediction"];
        }

        viewer.raiseEvent('update-viewport');
        /*
        add_annotations();
        set_count_chart_data();
        update_count_chart();
        update_score_chart();*/
        set_count_chart_data();
        update_count_chart();
        update_score_chart();
    });

    $("#confidence_slider").on("input", function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#confidence_slider_val").html("> " + slider_val);
    });


    //let score_handler;
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




    // $("#threshold_slider").change(function() {
    //     $("#save_icon").css("color", "#ed452b");
    //     excess_green_record[cur_img_name]["sel_val"] = Number.parseFloat($("#threshold_slider").val()).toFixed(2);
    //     $("#threshold_slider_val").html(excess_green_record[cur_img_name]["sel_val"]);
    // });


    $("#apply_threshold_to_all_button").click(function() {
        disable_std_buttons(["apply_threshold_to_all_button"]);
        let cur_val = parseFloat(parseFloat($("#threshold_slider").val()).toFixed(2));

        for (let image_name of Object.keys(excess_green_record)) {
            // let min_val = excess_green_record[cur_img_name]["min_val"];
            // let max_val = excess_green_record[cur_img_name]["max_val"];
            let prev_val = excess_green_record[image_name]["sel_val"]; 
            excess_green_record[image_name]["sel_val"] = cur_val;
            // if (exg_val > max_val) {
            //     excess_green_record[image_name]["sel_val"] = max_val;
            // }
            // else if (exg_val < min_val) {
            //     excess_green_record[image_name]["sel_val"] = min_val;
            // }
            // else {
            //     excess_green_record[image_name]["sel_val"] = exg_val;
            // }

            if (prev_val != cur_val) {
                $("#save_icon").css("color", "#ed452b");
            }
        }
        //enable_std_buttons(["apply_threshold_to_all_button"]);
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


    // $("#suggest_image_button").click(function() {

    //     let candidates = [];
    //     for (let image_name of Object.keys(annotations)) {
    //         let image_width_px = metadata["images"][image_name]["width_px"];
    //         let image_height_px = metadata["images"][image_name]["height_px"];

    //         let fully_annotated_for_training = image_is_fully_annotated_for_training(annotations, image_name, image_width_px, image_height_px);
    //         //let status = annotations[image_name]["status"];

    //         if ((!(fully_annotated_for_training)) && (image_name in predictions)) {
    //             candidates.push(image_name);
    //         }
    //     }
    //     if (candidates.length <= 1) {
    //         if (num_training_images == Object.keys(annotations).length) {
    //             show_modal_message("Error", "Unable to recommend an image for fine-tuning -- all images have already been used for fine-tuning!");
    //         }
    //         else {
    //             show_modal_message("Error", "An insufficient number of images have predictions available for assessment." +
    //                            " Please generate predictions for more images and try again.");
    //         }
    //     }
    //     else {

    //         let qualities = [];
    //         for (let image_name of candidates) {
    //             let scores = predictions[image_name]["scores"];
    //             let bins = score_histogram(scores);
    //             bins[bins.length-1].x1 = 1.01;

    //             let r = evaluate_scores(bins, scores);
    //             let quality = r[0];
    //             qualities.push({
    //                 "quality": quality,
    //                 "image_name": image_name
    //             });
    //         }
    //         qualities.sort(function(a, b) {
    //             if (a.quality < b.quality) return -1;
    //             if (a.quality > b.quality) return 1;
    //             return 0;
    //         });

    //         let sel_image_name = qualities[0]["image_name"];

    //         $("#navigation_dropdown").val("images");
    //         $("#active_layer_table").css("opacity", 1.0);
    //         $("input:radio[name=edit_layer_radio]").prop("disabled", false);
    //         $("#show_segmentation_button").show();
    //         create_navigation_table();
    //         update_count_combo(false);
    //         add_prediction_buttons();
    //         change_image(sel_image_name + "/-1");
    //     }
    // });

    // $("input[name=segmentation_radio]").change(function(e) {

    //     let control_val = $('input[name=segmentation_radio]:checked').val();

    //     if (control_val === "segment") {
    //         segment_viewport();
    //     }
    //     else {
    //         pan_viewport();
    //     }
    // });

    // $("#pan_switch").change(function() {
    //     if ($("#pan_switch").is(":checked")) {
    //         $("#pan_switch").prop("disabled", true)
    //         $("#pan_switch").css("opacity", 0.5);
    //         pan_viewport();
    //     }
    // });

    $("#enable_pan_button").click(function() {

        //if ($("#panning_enabled_status").html() !== "Yes") {
        $("#panning_enabled_status").html("Yes");
        disable_std_buttons(["enable_pan_button"]);
        pan_viewport();
        //}
    });
    


    $("#segment_button").click(function() {
        // if ($("#pan_switch").is(":checked")) {
        //     $("#pan_switch").prop("checked", false);
        //     $("#pan_switch").prop("disabled", false)
        //     $("#pan_switch").css("opacity", 1.0);
        // }
        disable_std_buttons(["segment_button"]);

        if ($("#segmentation_loader").hasClass('load-complete')) {
            $("#segmentation_loader").toggleClass('load-complete');
            $("#segmentation_checkmark").toggle();
        }
        $("#segmentation_loader").show();
        /*
        $("#segmentation_loader").toggleClass('load-complete');
        $("#segmentation_checkmark").toggle();*/
        enable_std_buttons(["enable_pan_button"]);
        $("#panning_enabled_status").html("No");
        segment_viewport();

    });

    $("input[name=edit_layer_radio]").change(async function(e) {

        await unselect_selected_annotation();


        cur_edit_layer = $('input[name=edit_layer_radio]:checked').val();


        if (cur_edit_layer === "region_of_interest") {
            anno.setDrawingTool("polygon");
        }
        else {
            anno.setDrawingTool("rect");
        }

        if (cur_panel === "annotation") {
            overlay.clear();
            if ($("#engaged_grid_controls").is(":visible")) {
                gridview_onRedraw();
            }
            else {
                anno_and_pred_onRedraw();
            }
        }
    });


    //$("#add_training_region_button").click(function() {
    //    disable_std_buttons(["add_training_region_button"]);
/*
        $(".a9s-annotationlayer .a9s-annotation .a9s-inner").css("stroke", "black");
        $(".a9s-annotationlayer .a9s-annotation.editable.selected .a9s-inner .a9s-annotationlayer .a9s-annotation:hover .a9s-inner").css("stroke", "black");
*/
        /*
        $(".a9s-annotationlayer").css("stroke", "#f5a70b !important");
        $(".a9s-annotation").css("stroke", "#f5a70b !important");
        $(".a9s-inner").css("stroke", "#f5a70b !important");

        $(".a9s-annotationlayer").css("stroke", "#f5a70b !important");
        $(".a9s-annotation.editable.selected").css("stroke", "#f5a70b !important");
        $(".a9s-inner").css("stroke", "#f5a70b !important");
        $(".a9s-annotationlayer").css("stroke", "#f5a70b !important");
        $(".a9s-annotation:hover").css("stroke", "#f5a70b !important");
        $(".a9s-inner").css("stroke", "#f5a70b !important");
        */
    //    $(".std-button").css("background-color", "pink");


        /*  {
        stroke:#0080C0 !important;
        }*/
        /*
        .a9s-annotationlayer .a9s-annotation .a9s-inner {
            stroke:#0080C0 !important;
          }*/
    //});


    $("#navigation_dropdown").change(function() {
        create_navigation_table();
        update_count_combo(false);
        add_prediction_buttons();
        // disable_std_buttons(["prev_image_button"]);
        // if (cur_nav_list.length == 0) {
        //     disable_std_buttons(["next_image_button"]);
        // }

        let navigation_type = $("#navigation_dropdown").val();
        if ((navigation_type == "regions_of_interest") || (navigation_type === "training_regions" || navigation_type == "test_regions")) {
            
            $("input:radio[name=edit_layer_radio]").prop("disabled", true);
            // $("#annotation_label").prop("opacity", 0.5);
            // $("#training_region_label").prop("opacity", 0.5);
            // $("#test_region_label").prop("opacity", 0.5);
            $("#active_layer_table").css("opacity", 0.5);
            // $("input:radio[name=edit_layer_radio]").change();

            $("#show_segmentation_button").hide();
            // $("#show_annotation_button").css("width", "148px");
            // $("#show_prediction_button").css("width", "148px");



        }
        else {
            $("#active_layer_table").css("opacity", 1.0);
            $("input:radio[name=edit_layer_radio]").prop("disabled", false);



            $("#show_segmentation_button").show();

            // $("#show_annotation_button").css("width", "99px");
            // $("#show_prediction_button").css("width", "98px");
            // $("#show_segmentation_button").css("width", "99px");
        }
        if (cur_panel === "segmentation") {
            viewer = null;
            cur_panel = "annotation";
        }
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

        $("input:radio[name=edit_layer_radio]").filter("[value=annotation]").prop("checked", true).change();

    });








    $("#threshold_slider").on("input", function() {
        //$("#save_icon").css("color", "#ed452b");
        let cur_val = parseFloat($("#threshold_slider").val());
        //excess_green_record[cur_img_name]["sel_val"] = cur_val; //parseFloat(parseFloat($("#threshold_slider").val()).toFixed(2));
        $("#threshold_slider_val").html(cur_val.toFixed(2));
    });

    $("#threshold_slider").change(function() {
        $("#save_icon").css("color", "#ed452b");
        let cur_val = parseFloat($("#threshold_slider").val());
        excess_green_record[cur_img_name]["sel_val"] = cur_val; //parseFloat(parseFloat($("#threshold_slider").val()).toFixed(2));
        $("#threshold_slider_val").html(cur_val.toFixed(2));
        update_apply_current_threshold_to_all_images_button();

    });




    function raise_threshold_slider() {
        let slider_val = parseFloat($("#threshold_slider").val());
        if (slider_val < 2) {
            slider_val = slider_val + 0.01;
            $("#threshold_slider").val(slider_val).change();
        }
        // if (excess_green_values_are_all_the_same()) {
        //     disable_std_buttons(["apply_threshold_to_all_button"]);
        // }
        // else {
        //     enable_std_buttons(["apply_threshold_to_all_button"]);
        // }
        update_apply_current_threshold_to_all_images_button();
    }
    function lower_threshold_slider() {
        let slider_val = parseFloat($("#threshold_slider").val());
        if (slider_val > -2) {
            slider_val = slider_val - 0.01;
            $("#threshold_slider").val(slider_val).change();
        }
        // if (excess_green_values_are_all_the_same()) {
        //     disable_std_buttons(["apply_threshold_to_all_button"]);
        // }
        // else {
        //     enable_std_buttons(["apply_threshold_to_all_button"]);
        // }
        update_apply_current_threshold_to_all_images_button();
    }


    //let threshold_handler;
    //$("#threshold_score_down").off("mousedown");
    $("#threshold_score_down").click(function() {
        lower_threshold_slider();
        // threshold_handler = setInterval(lower_threshold_slider, 300);
    });

    // $("#threshold_score_down").off("mouseup");
    // $("#threshold_score_down").mouseup(function() {
    //     clearInterval(threshold_handler);
    // }); 

    // $("#threshold_score_up").off("mousedown");
    $("#threshold_score_up").click(function() {
        raise_threshold_slider();
        // threshold_handler = setInterval(raise_threshold_slider, 300);
    });

    // $("#threshold_score_up").off("mouseup");
    // $("#threshold_score_up").mouseup(function() {
    //     clearInterval(threshold_handler);
    // });

    $("#upload_annotations_button").click(function() {



        show_modal_message(`Upload Annotations`, 
            `<div>Annotations must be provided as a single JSON file. The file must follow the format below.</div>` +
            `<div style="height: 10px"></div>` +
            `<table>` +
                `<tr>` +
                    `<td>` +
                        `<div style="text-align: center; width: 350px;">` +
                            `<textarea class="json_text_area" style="width: 300px; margin: 0 auto; height: 270px">${annotations_format_sample_text}</textarea>` +
                        `</div>` +
                    `</td>` +
                    `<td>` +

                        `<ul>` +

                        `<li>All boxes must be encoded with four values (in <span style="font-weight: bold">pixel coordinates</span>):` +
                        `<br>` +
                        `<span style="margin-left: 75px; font-family: 'Lucida Console', Monaco, monospace;">[ x_min, y_min, x_max, y_max ]</span> ` + 
                        `</li>` +
                        `<br>` +
                        `<br>` +
                        `<li>All regions of interest must be encoded as lists of x, y coordinate pairs` +
                        `</li>` +
                        `<br>` +
                        `<br>` +
                        `<li>Images that are present in the image set but not found in the uploaded file will be unaffected by the upload process.` +
                        `</li>` +
                        `<br>` +
                        `<br>` +
                        `</li>` +

                        `</ul>` +

                    `</td>` +
                    `<td>` +
                        `<div style="width: 10px"></div>` +
                    `</td>` +
                `</tr>` +
            `</table>` +

            `<div style="height: 10px"></div>` +
            
            `<form id="annotations_upload_form" action="">` +
            `<table>` + 
                `<tr>` + 
                    // `<td>` +
                    //     `<div style="width: 50px"></div>` +
                    // `</td>` +
                    // `<td>` +
                    //     `<table>` +
                    //         `<tr>` +
                    //             `<td>` +
                    //                 `<h class="header2" style="width: 400px">Box Format</h>` +
                    //             `</td>` +
                    //         `</tr>` +
                    //         `<tr>` +
                    //             `<td>` +
                    //                 `<div style="margin-left: 20px">` +
                    //                     `<label class="custom_radio_container">[ x_min, y_min, x_max, y_max ]` +
                    //                         `<input type="radio" name="box_format_radio" value="[ x_min, y_min, x_max, y_max ]" checked>` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                     `<label class="custom_radio_container">[ x_min, y_min, width, height ]` +
                    //                         `<input type="radio" name="box_format_radio" value="[ x_min, y_min, width, height ]">` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                     `<label class="custom_radio_container">[ x_centre, y_centre, width, height ]` +
                    //                         `<input type="radio" name="box_format_radio" value="[ x_centre, y_centre, width, height ]">` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                 `</div>` +
                    //             `</td>` +
                    //         `</tr>` +
                    //     `</table>` +
                    //     //`<h class="header2">Coordinates Format</h>` +
                    //     `<table>` +
                    //         `<tr>` +
                    //             `<td>` +
                    //                 `<h class="header2" style="width: 400px">Coordinates Format</h>` +
                    //             `</td>` +
                    //         `</tr>` +
                    //         `<tr>` +
                    //             `<td>` +
                    //                 `<div style="margin-left: 20px">` +
                    //                     `<label class="custom_radio_container">Pixel Coordinates` +
                    //                         `<input type="radio" name="coordinates_format_radio" value="pixel_coordinates" checked>` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                     `<label class="custom_radio_container">Normalized Coordinates` +
                    //                         `<input type="radio" name="coordinates_format_radio" value="normalized_coordinates">` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                 `</div>` +
                    //             `</td>` +
                    //         `</tr>` +
                    //     `</table>` +
                    // `</td>` +
                    `<td>` +
                        `<div style="text-align: center">` +
                            `<div style="border: 1px solid white; border-radius: 8px; width: 425px; margin: 0 auto">` +
                                `<div id="annotations_dropzone" class="dropzone" style="height: 195px">` +
                                    `<div class="dz-message data-dz-message">` +
                                        `<span>Drop Annotations File Here</span>` +
                                    `</div>` +
                                `</div>`+
                            `</div>` +
                        `</div>` +
                    `</td>` +
                    // `<td>` +
                    //     `<div style="width: 50px"></div>` +
                    // `</td>` +
                `</tr>` +
            `</table>` +
            `</form>` +
            `<div style="height: 10px"></div>` +
            `<div style="text-align: center">` +
                `<button style="width: 250px;" class="std-button std-button-hover" id="submit_annotations_button">Upload Annotations</button>` +
            `</div>`, 950
        );

        disable_std_buttons(["submit_annotations_button"]);
        annotations_dropzone = new Dropzone("#annotations_dropzone", { 
            url: $(location).attr('href') + "/annotations_upload",
            autoProcessQueue: false,
            paramName: function(n) { return 'source_file[]'; },
            uploadMultiple: false,
            //chunking: true,
            //forceChunking: true,
            //chunkSize: 20000000,
            //parallelChunkUploads: false,
            //retryChunks: false,
            //retryChunksLimit: 3,
            //farm_name: '',
            //field_name: '',
            // mission_date: '',
            maxFilesize: 100
        });


        annotations_dropzone.on("success", function(file, response) {   

            annotations_dropzone.removeFile(file);
            if (annotations_dropzone.getAcceptedFiles().length == 0) {

                annotations_dropzone.removeAllFiles(true);
                //num_sent = 0;
                annotations_dropzone.options.autoProcessQueue = false;

                // TODO: 'refresh' page
                annotations = response.annotations;
                // cur_panel = "annotation";

                // let init_image_name = basename(dzi_image_paths[0]);
                // cur_img_name = init_image_name.substring(0, init_image_name.length - 4);
                // cur_region_index = -1;
                // cur_view = "image";
                // cur_panel = "annotation";
                //create_navigation_table();
            
                //update_navigation_dropdown();




                update_navigation_dropdown();
                $("#navigation_dropdown").val("images").change();
                show_modal_message(`Success!`, `The annotation file you uploaded has been successfully processed.`);




                //change_image()

                
            }
        });

        annotations_dropzone.on("error", function(file, response) {

            //num_sent = 0;
            annotations_dropzone.options.autoProcessQueue = false;

            if (typeof(response) == "object" && "error" in response) {
                upload_error = response.error;
            }
            else {
                upload_error = response;
            }

            show_modal_message(`Error`, `An error occured while processing the uploaded annotations:<br><br>` + upload_error);
            /*
            console.log(response);

            if (!upload_error) {

                if (typeof(response) == "object" && "error" in response) {
                    upload_error = response.error;
                }
                else {
                    upload_error = response;
                }
                dropzone_handlers[key].removeAllFiles(true);

                display_upload_error();
            }*/

        });




        annotations_dropzone.on("addedfile", function() {
            //$("form").change();
            enable_std_buttons(["submit_annotations_button"]);
        });

        // annotations_dropzone.on('sending', function(file, xhr, formData) {

        //     // let box_format = $("input:radio[name=box_format_radio]:checked").val();
        //     // let coordinates_format = $("input:radio[name=coordinates_format_radio]:checked").val();

        //     // formData.append('box_format', box_format);
        //     // formData.append('coordinates_format', coordinates_format);
        //     /*
        //     formData.append('farm_name', $("#farm_input").val());
        //     formData.append('field_name', $("#field_input").val());
        //     formData.append('mission_date', $("#mission_input").val());
        //     formData.append("object_name", $("#object_input").val());
        //     formData.append("is_public", ($("#upload_set_public").is(':checked')) ? "yes" : "no");
        //     formData.append("queued_filenames", queued_filenames.join(","));
        //     formData.append('camera_height', $("#camera_height_input").val());
        //     if (num_sent == 0) {
        //         upload_uuid = uuidv4();
        //     }
        //     formData.append('upload_uuid', upload_uuid);*/
        //     //num_sent++;
        //     //formData.append("num_sent", num_sent.toString());

        // });




        $("#submit_annotations_button").click(function(e) {

            e.preventDefault();
            e.stopPropagation();

            annotations_dropzone.options.autoProcessQueue = true;
            annotations_dropzone.processQueue();
        });






    })

    $("#download_annotations_button").click(function() {

        //let format_sample_text = JSON.stringify(
        //    format_sample, undefined, 4
        //);

        show_modal_message(`Download Annotations`, 
            `<div>Annotations will be downloaded as a single JSON file of the following format:</div>` +
            `<div style="height: 10px"></div>` +

            `<table>` +
                `<tr>` +
                    `<td>` +
                        `<div style="text-align: center; width: 300px;">` +
                            `<textarea class="json_text_area" style="width: 300px; margin: 0 auto; height: 270px">${annotations_format_sample_text}</textarea>` +
                        `</div>` +
                    `</td>` +
                    `<td>` +

                        `<ul>` +

                        `<li>All boxes are encoded with four values (in <span style="font-weight: bold">pixel coordinates</span>):` +
                        `<br>` +
                        `<br>` +
                        `<div style="text-align: center">` +
                            `<div style="font-family: 'Lucida Console', Monaco, monospace;">[ x_min, y_min, x_max, y_max ]</div> ` + 
                        `</div>` +
                        `</li>` +
                        `<br>` +
                        `<br>` +
                        `<li>All regions of interest are encoded as lists of x, y coordinate pairs` +
                        `</li>` +
                        `</ul>` +
                    `</td>` +
                `</tr>` +
            `</table>` +


            // `<div style="text-align: center">` +
            //     `<textarea class="json_text_area" style="width: 300px; margin: 0 auto; height: 255px">${format_sample_text}</textarea>` +
            // `</div>` +
            // `<div style="height: 10px"></div>` +


            // `<ul style="font-size: 14px">` +

            //     `<li>All boxes will be encoded with four values (in <span style="font-weight: bold">pixel coordinates</span>):` +
            //     `<br>` +
            //     `<span style="margin-left: 75px; font-family: 'Lucida Console', Monaco, monospace;">[ x_min, y_min, x_max, y_max ]</span> ` + 
            //     `</li>` +

            // `</ul>` +
            // `<table>` + 
            //     `<tr>` + 
            //         `<td>` +
            //             `<div style="width: 50%"></div>` +
            //         `</td>` +
                    // `<td>` +
                    // `<div style="margin: 0 auto">` +
                    //     `<table>` +
                    //         `<tr>` +
                    //             `<td>` +
                    //                 `<h class="header2" style="width: 300px">Box Format</h>` +
                    //             `</td>` +
                    //         `</tr>` +
                    //         `<tr>` +
                    //             `<td>` +
                    //                 `<div style="margin-left: 20px">` +
                    //                     `<label class="custom_radio_container">[ x_min, y_min, x_max, y_max ]` +
                    //                         `<input type="radio" name="box_format_radio" value="[ x_min, y_min, x_max, y_max ]" checked>` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                     `<label class="custom_radio_container">[ x_min, y_min, width, height ]` +
                    //                         `<input type="radio" name="box_format_radio" value="[ x_min, y_min, width, height ]">` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                     `<label class="custom_radio_container">[ x_centre, y_centre, width, height ]` +
                    //                         `<input type="radio" name="box_format_radio" value="[ x_centre, y_centre, width, height ]">` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                 `</div>` +
                    //             `</td>` +
                    //         `</tr>` +
                    //     `</table>` +
                    //     //`<h class="header2">Coordinates Format</h>` +
                    //     `<table>` +
                    //         `<tr>` +
                    //             `<td>` +
                    //                 `<h class="header2" style="width: 300px">Coordinates Format</h>` +
                    //             `</td>` +
                    //         `</tr>` +
                    //         `<tr>` +
                    //             `<td>` +
                    //                 `<div style="margin-left: 20px">` +
                    //                     `<label class="custom_radio_container">Pixel Coordinates` +
                    //                         `<input type="radio" name="coordinates_format_radio" value="pixel_coordinates" checked>` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                     `<label class="custom_radio_container">Normalized Coordinates` +
                    //                         `<input type="radio" name="coordinates_format_radio" value="normalized_coordinates">` +
                    //                         `<span class="custom_radio"></span>` +
                    //                     `</label>` +
                    //                 `</div>` +
                    //             `</td>` +
                    //         `</tr>` +
                    //     `</table>` +
                    // `</div>` +
                    // `</td>` +
            //         `<td>` +
            //             `<div style="width: 50%"></div>` +
            //         `</td>` +
            //     `</tr>` +
            // `</table>` +
            // `<h class="header2">Box Format</h>` +
            // `<table>` +
            //     `<tr>` +
            //         `<td>` +
            //             `<div style="width: 375px">` +
            //                 `<label class="custom_radio_container">[ x_min, y_min, x_max, y_max ]` +
            //                     `<input type="radio" name="box_format_radio" value="[ x_min, y_min, x_max, y_max ]" checked>` +
            //                     `<span class="custom_radio"></span>` +
            //                 `</label>` +
            //                 `<label class="custom_radio_container">[ x_min, y_min, width, height ]` +
            //                     `<input type="radio" name="box_format_radio" value="[ x_min, y_min, width, height ]">` +
            //                     `<span class="custom_radio"></span>` +
            //                 `</label>` +
            //                 `<label class="custom_radio_container">[ x_centre, y_centre, width, height ]` +
            //                     `<input type="radio" name="box_format_radio" value="[ x_centre, y_centre, width, height ]">` +
            //                     `<span class="custom_radio"></span>` +
            //                 `</label>` +
            //             `</div>` +
            //         `</td>` +
            //     `</tr>` +
            // `</table>` +
            // `<h class="header2">Coordinates Format</h>` +
            // `<table>` +
            //     `<tr>` +
            //         `<td>` +
            //             `<div  style="width: 375px">` +
            //                 `<label class="custom_radio_container">Pixel Coordinates` +
            //                     `<input type="radio" name="coordinates_format_radio" value="pixel_coordinates" checked>` +
            //                     `<span class="custom_radio"></span>` +
            //                 `</label>` +
            //                 `<label class="custom_radio_container">Normalized Coordinates` +
            //                     `<input type="radio" name="coordinates_format_radio" value="normalized_coordinates">` +
            //                     `<span class="custom_radio"></span>` +
            //                 `</label>` +
            //             `</div>` +
            //         `</td>` +
            //     `</tr>` +
            // `</table>` +
            `<div style="height: 20px"></div>` +
            `<div style="text-align: center">` +
                `<button style="width: 250px;" class="std-button std-button-hover" onclick="download_annotations()" id="prepare_download_button">Prepare Download</button>` +
            `</div>`
            , 950 //680
        );

    });


    $("body").keydown(function(e) {
        if (selected_annotation !== null) {
            selected_keydown_handler(e);
        }
        else if ($("#engaged_grid_controls").is(":visible")) {
            grid_keydown_handler(e);
        }
        else {
            keydown_handler(e);
        }
    });

    // $("body").mouseup(function(e) {
    //     let cur_selected = anno.getSelected();
    //     if (cur_selected == null) {
    //         viewer.raiseEvent('canvas-click');
    //     }
    //     //viewer.raiseEvent('canvas-click');
    // });
    //     console.log("mouseup");
    //     //let cur_selected = anno.getSelected();
    //     // console.log(cur_selected, selected_annotation_index);
    //     delay(10).then(() => {
    //         let cur_selected = anno.getSelected();
    //         if (cur_selected == null) {
            
    //             selected_annotation_index = -1;
    //             selected_annotation = null;
    //             anno.clearAnnotations();
    //             viewer.raiseEvent('update-viewport');
    //         }
    //     });




    //     // if (selected_annotation_index != -1) {
    //     //     anno.updateSelected(selected_annotation, true);
    //     // }
    //     //selected_annotation = null;
    //     //selected_annotation_index = -1;
    // });


    $("#image_visible_switch").change(function() {
        viewer.raiseEvent('update-viewport');
    });



});



function download_annotations() {

    // let box_format = $("input:radio[name=box_format_radio]:checked").val();
    // let coordinates_format = $("input:radio[name=coordinates_format_radio]:checked").val();

    // show_modal_message("Preparing Download", 
    //     `<div id="prep_download_message">Preparing download...</div><div id="prep_download_loader" class="loader"></div>` +
    //     `<div style="text-align: center; margin-top: 20px;"><a class="table_button table_button_hover" style="padding: 10px; border-radius: 30px" id="download_button" download="annotations.json" hidden>` +
    //     `<i class="fa-solid fa-file-arrow-down"></i><span style="margin-left: 10px">Download Annotations</span></a></div>`);

    show_modal_message("Preparing Download", 
        `<div style="height: 50px">` +
            `<div id="prep_download_message">Preparing spreadsheet...</div>` +
            `<div id="prep_download_loader" class="loader"></div>` +
            `<div style="text-align: center; margin-top: 20px"><a class="table_button table_button_hover" id="download_button" style="padding: 10px; border-radius: 30px" download="annotations.json" hidden>` +
                `<i class="fa-solid fa-file-arrow-down"></i><span style="margin-left: 10px">Download Annotations</span></a>` +
            `</div>` +
        `</div>`);


    $.post($(location).attr('href'),
    {
        action: "download_annotations",
        // box_format: box_format,
        // coordinates_format: coordinates_format
    },
    
    function(response, status) {

        $("#prep_download_loader").hide();

        if (response.error) {
            $("#modal_head_text").html("Error");
            $("#prep_download_message").html("An error occurred while generating the annotations file: " + response.message);
        }
        else {
            
            let download_path = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
            image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/annotations/download_annotations.json";
            // $("#modal_message").html(
            //     `<div>Your download is ready.</div>` +
            //     `<a href=${download_path} download="annotations.json" id="hidden_annotations_download">Download Annotations</a>`
            // );



            $("#download_button").attr("href", download_path);
            $("#modal_head_text").html("Ready For Download");
            $("#prep_download_message").html("The annotations file is ready for download.");
            $("#download_button").show();
            //$("#hidden_annotations_download").click();
        }
    });


}

function update_apply_current_threshold_to_all_images_button() {
    if (excess_green_values_are_all_the_same()) {
        disable_std_buttons(["apply_threshold_to_all_button"]);
    }
    else {
        enable_std_buttons(["apply_threshold_to_all_button"]);
    }
}

function excess_green_values_are_all_the_same() {
    let image_names = Object.keys(excess_green_record);
    for (let i = 1; i < image_names.length; i++) {
        if (excess_green_record[image_names[i]]["sel_val"] != excess_green_record[image_names[i-1]]["sel_val"]) {
            return false;
        }
    }
    return true;
}

function resize_window() {
    //console.log("resize");
    let new_viewer_height = window.innerHeight - $("#header_table").height() - 100;
    $("#seadragon_viewer").height(new_viewer_height);
    $("#chart_container").height(new_viewer_height);
    let image_name_table_height = $("#image_name_table").height();
    //console.log(image_name_table_height);
    let new_navigation_table_container_height = new_viewer_height - image_name_table_height - 345; //370; //345; //20;
    //console.log(new_navigation_table_container_height);
    let min_navigation_table_height = 310;
    if (new_navigation_table_container_height < min_navigation_table_height) {
        new_navigation_table_container_height = min_navigation_table_height;
    }
    $("#navigation_table_container").height(new_navigation_table_container_height);
}



$(window).resize(function() {
    resize_window();
});


function zoom_to_tile(tile) {

    cur_region = tile;

    
    
    // let hw_ratio = overlay.imgHeight / overlay.imgWidth;
    // let image_w = metadata["images"][cur_img_name]["width_px"];
    // let image_h = metadata["images"][cur_img_name]["height_px"];






    // // let region = annotations[cur_img_name][navigation_type][cur_region_index];
    // let image_px_width = metadata["images"][cur_img_name]["width_px"];
    // let image_px_height = metadata["images"][cur_img_name]["height_px"];

    // let inner_poly;
    // let outer_poly = [
    //     [0-1e6, 0-1e6], 
    //     [0-1e6, image_px_width+1e6], 
    //     [image_px_height+1e6, image_px_width+1e6],
    //     [image_px_height+1e6, 0-1e6]
    // ];

    // inner_poly = [
    //     [tile[0], tile[1]],
    //     [tile[0], tile[3]],
    //     [tile[2], tile[3]],
    //     [tile[2], tile[1]]
    // ];

    // overlay.context2d().fillStyle = "ffffff"; //"#22262155";
    // overlay.context2d().beginPath();

    // for (let poly of [outer_poly, inner_poly]) {

    //     for (let i = 0; i < poly.length+1; i++) {
    //         let pt = poly[(i)%poly.length];
    //         let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(pt[1], pt[0]));

    //         if (i == 0) {
    //             overlay.context2d().moveTo(viewer_point.x, viewer_point.y);
    //         }
    //         else {
    //             overlay.context2d().lineTo(viewer_point.x, viewer_point.y);
    //         }
    //     }
    //     overlay.context2d().closePath();

    // }
    // overlay.context2d().mozFillRule = "evenodd";
    // overlay.context2d().fill("evenodd");




    // let viewport_bounds = [
    //     tile[1] / image_w,
    //     (tile[0] / image_h) * hw_ratio,
    //     (tile[3] - tile[1]) / image_w,
    //     ((tile[2] - tile[0]) / image_h) * hw_ratio
    // ];

    // let zoom_bounds = new OpenSeadragon.Rect(
    //     viewport_bounds[0],
    //     viewport_bounds[1],
    //     viewport_bounds[2],
    //     viewport_bounds[3]
    // );
            
    // viewer.world.getItemAt(0).setClip(
    //     new OpenSeadragon.Rect(
    //         tile[1],
    //         tile[0],
    //         (tile[3] - tile[1]),
    //         (tile[2] - tile[0])
    //     )
    // );

    // withFastOSDAnimation(viewer.viewport, function() {
    //     viewer.viewport.fitBounds(zoom_bounds);
    // });



}



function gridview_onRedraw() {

    let navigation_type = $("#navigation_dropdown").val();

    let boxes_to_add = {};

    boxes_to_add["region_of_interest"] = {};
    boxes_to_add["region_of_interest"]["boxes"] = annotations[cur_img_name]["regions_of_interest"];
    boxes_to_add["training_region"] = {};
    boxes_to_add["training_region"]["boxes"] = annotations[cur_img_name]["training_regions"];
    boxes_to_add["test_region"] = {};
    boxes_to_add["test_region"]["boxes"] = annotations[cur_img_name]["test_regions"];
    boxes_to_add["annotation"] = {};
    boxes_to_add["annotation"]["boxes"] = annotations[cur_img_name]["boxes"];

        
    let viewer_bounds = viewer.viewport.getBounds();
    let container_size = viewer.viewport.getContainerSize();

    let hw_ratio = overlay.imgHeight / overlay.imgWidth;
    let min_x = Math.floor(viewer_bounds.x * overlay.imgWidth);
    let min_y = Math.floor((viewer_bounds.y / hw_ratio) * overlay.imgHeight);
    let viewport_w = Math.ceil(viewer_bounds.width * overlay.imgWidth);
    let viewport_h = Math.ceil((viewer_bounds.height / hw_ratio) * overlay.imgHeight);
    let max_x = min_x + viewport_w;
    let max_y = min_y + viewport_h;

    // if (cur_region_index != -1) {

    //     let cur_region = annotations[cur_img_name][navigation_type][cur_region_index];
    //     if (navigation_type == "regions_of_interest") {
    //         cur_region = get_bounding_box_for_polygon(cur_region);
    //     }
    //     min_y = Math.max(min_y, cur_region[0]);
    //     min_x = Math.max(min_x, cur_region[1]);
    //     max_y = Math.min(max_y, cur_region[2]);
    //     max_x = Math.min(max_x, cur_region[3]);
    // }
    let image_w_px = metadata["images"][cur_img_name]["width_px"];
    let image_h_px = metadata["images"][cur_img_name]["height_px"];



    let cur_tile = cur_gridview_tiles[cur_gridview_tile_index];



    overlay.context2d().font = "14px arial";


    let draw_order = overlay_appearance["draw_order"];
    for (let key of draw_order) {

        if (!(key in boxes_to_add)) {
            continue;
        }
        
        overlay.context2d().strokeStyle = overlay_appearance["colors"][key];
        overlay.context2d().fillStyle = overlay_appearance["colors"][key] + "55";
        overlay.context2d().lineWidth = 2;


        if (key === "region_of_interest") {

            for (let i = 0; i < boxes_to_add["region_of_interest"]["boxes"].length; i++) {

                if ((cur_edit_layer === "region_of_interest") && (i == selected_annotation_index)) {
                    continue;
                }
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
            loop1:
            for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {
                if ((cur_edit_layer === key) && (i == selected_annotation_index)) {
                    continue;
                }

                let box = boxes_to_add[key]["boxes"][i];

                if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {

                    visible_inds.push(i);
                    if (visible_inds.length > MAX_BOXES_DISPLAYED) {
                        break loop1;
                    }
                }

            }

            if (visible_inds.length <= MAX_BOXES_DISPLAYED) {
                for (let ind of visible_inds) {
                    let box = boxes_to_add[key]["boxes"][ind];
                    let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                    let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));

                    overlay.context2d().strokeRect(
                        viewer_point.x,
                        viewer_point.y,
                        (viewer_point_2.x - viewer_point.x),
                        (viewer_point_2.y - viewer_point.y)
                    );

                    if (overlay_appearance["style"][key] == "fillRect") {
                        overlay.context2d().fillRect(
                            viewer_point.x,
                            viewer_point.y,
                            (viewer_point_2.x - viewer_point.x),
                            (viewer_point_2.y - viewer_point.y)
                        );
                    }
                }
            }
        }
    }




    delete boxes_to_add["annotation"];
    navigator_overlay.clear(); 

    draw_order = overlay_appearance["draw_order"];
    for (let key of draw_order) {

        if (!(key in boxes_to_add)) {
            continue;
        }
        
        navigator_overlay.context2d().strokeStyle = overlay_appearance["colors"][key];
        navigator_overlay.context2d().fillStyle = overlay_appearance["colors"][key] + "55";
        navigator_overlay.context2d().lineWidth = 2;


        if (key === "region_of_interest") {

            for (let i = 0; i < boxes_to_add["region_of_interest"]["boxes"].length; i++) {

                if ((cur_edit_layer === "region_of_interest") && (i == selected_annotation_index)) {
                    continue;
                }
                let region = boxes_to_add["region_of_interest"]["boxes"][i];

                navigator_overlay.context2d().beginPath();
                for (let j = 0; j < region.length; j++) {
                    let pt = region[j];
        
                    let viewer_point = navigator_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(pt[1], pt[0]));
                    
                    if (j == 0) {
                        navigator_overlay.context2d().moveTo(viewer_point.x, viewer_point.y);
                    }
                    else {
                        navigator_overlay.context2d().lineTo(viewer_point.x, viewer_point.y);
                    }
                }
        
                navigator_overlay.context2d().closePath();
                navigator_overlay.context2d().stroke();
                if (overlay_appearance["style"][key] == "fillRect") {
                    navigator_overlay.context2d().fill();
                }
        
            }
        
        }
        else {
            for (let box of boxes_to_add[key]["boxes"]) {
                let viewer_point = navigator_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                let viewer_point_2 = navigator_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));

                navigator_overlay.context2d().strokeRect(
                    viewer_point.x,
                    viewer_point.y,
                    (viewer_point_2.x - viewer_point.x),
                    (viewer_point_2.y - viewer_point.y)
                );

                if (overlay_appearance["style"][key] == "fillRect") {
                    navigator_overlay.context2d().fillRect(
                        viewer_point.x,
                        viewer_point.y,
                        (viewer_point_2.x - viewer_point.x),
                        (viewer_point_2.y - viewer_point.y)
                    );
                }
            }
        }
    }












    // if ((navigation_type === "regions_of_interest") || (navigation_type === "training_regions" || navigation_type === "test_regions")) {

    //     let region = annotations[cur_img_name][navigation_type][cur_region_index];
    //     let image_px_width = metadata["images"][cur_img_name]["width_px"];
    //     let image_px_height = metadata["images"][cur_img_name]["height_px"];

    let inner_poly;
    let outer_poly;

    if (navigation_type !== "images") {
        outer_poly = [
            [0-1e6, 0-1e6], 
            [0-1e6, image_w_px+1e6], 
            [image_h_px+1e6, image_w_px+1e6],
            [image_h_px+1e6, 0-1e6]
        ];

        let region = annotations[cur_img_name][navigation_type][cur_region_index];

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




    outer_poly = [
        [0-1e6, 0-1e6], 
        [0-1e6, image_w_px+1e6], 
        [image_h_px+1e6, image_w_px+1e6],
        [image_h_px+1e6, 0-1e6]
    ];

    // if (navigation_type === "regions_of_interest") {
    //     inner_poly = region;
    // }
    // else { 
    //     inner_poly = [
    //         [region[0], region[1]],
    //         [region[0], region[3]],
    //         [region[2], region[3]],
    //         [region[2], region[1]]
    //     ];
    // }
    inner_poly = [      
        [cur_tile[0], cur_tile[1]],
        [cur_tile[0], cur_tile[3]],
        [cur_tile[2], cur_tile[3]],
        [cur_tile[2], cur_tile[1]]
    ];

    overlay.context2d().fillStyle = "rgb(0, 0, 0, 0.5)"; // "#222621";
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





    let border_viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(cur_tile[1], cur_tile[0]));
    let border_viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(cur_tile[3], cur_tile[2]));
    overlay.context2d().lineWidth = 1;
    overlay.context2d().strokeStyle = "rgb(255, 255, 255, 1.0)";
    overlay.context2d().strokeRect(
        border_viewer_point.x,
        border_viewer_point.y,
        (border_viewer_point_2.x - border_viewer_point.x),
        (border_viewer_point_2.y - border_viewer_point.y)
    );




    
    // let navigator_container_size = navigator_viewer.viewport.getContainerSize();
    //context2d().clear(); //clearRect(0, 0, navigator_container_size, navigator_container_size); //canvas.width, canvas.height);
    let viewer_point = navigator_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(cur_tile[1], cur_tile[0]));
    let viewer_point_2 = navigator_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(cur_tile[3], cur_tile[2]));
    navigator_overlay.context2d().lineWidth = 1;
    navigator_overlay.context2d().strokeStyle = "rgb(255, 255, 255, 1.0)";
    navigator_overlay.context2d().strokeRect(
        viewer_point.x,
        viewer_point.y,
        (viewer_point_2.x - viewer_point.x),
        (viewer_point_2.y - viewer_point.y)
    );




    // }
    // if (cur_bounds != null) {

    //     if ((navigation_type === "regions_of_interest") || (navigation_type === "training_regions" || navigation_type === "test_regions")) {

    //         let region = annotations[cur_img_name][navigation_type][cur_region_index];

    //         if (navigation_type === "regions_of_interest") {
    //             region = get_bounding_box_for_polygon(region);
    //         }

    //         viewer.world.getItemAt(0).setClip(
    //             new OpenSeadragon.Rect(
    //                 region[1],
    //                 region[0],
    //                 (region[3] - region[1]),
    //                 (region[2] - region[0])
    //             )
    //         );
    //     }


    //     withFastOSDAnimation(viewer.viewport, function() {
    //         viewer.viewport.fitBounds(cur_bounds);
    //     });
    //     cur_bounds = null;
    // }


    let viewport_bounds = [
        cur_tile[1] / image_w_px,
        (cur_tile[0] / image_h_px) * hw_ratio,
        (cur_tile[3] - cur_tile[1]) / image_w_px,
        ((cur_tile[2] - cur_tile[0]) / image_h_px) * hw_ratio
    ];

    let zoom_bounds = new OpenSeadragon.Rect(
        viewport_bounds[0],
        viewport_bounds[1],
        viewport_bounds[2],
        viewport_bounds[3]
    );
            
    if (!(grid_zoomed)) {
        // viewer.world.getItemAt(0).setClip(
        //     new OpenSeadragon.Rect(
        //         cur_tile[1],
        //         cur_tile[0],
        //         (cur_tile[3] - cur_tile[1]),
        //         (cur_tile[2] - cur_tile[0])
        //     )
        // );
        
        withFastOSDAnimation(viewer.viewport, function() {
            viewer.viewport.fitBounds(zoom_bounds);
        });

        grid_zoomed = true;
    }



    if (gsd != null) {
        let cur_zoom = viewer.viewport.viewportToImageZoom(viewer.viewport.getZoom(true));
        let measure_width = Math.max(50, 0.08 * container_size.x);
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

    // if (cur_panel === "annotation") {
    if ((cur_mouse_x != null) && (cur_mouse_y != null)) {

        overlay.context2d().lineWidth = 2;
        overlay.context2d().strokeStyle = overlay_appearance["colors"][cur_edit_layer];
        overlay.context2d().beginPath();
        overlay.context2d().moveTo(0, cur_mouse_y);
        overlay.context2d().lineTo(overlay._containerWidth, cur_mouse_y);
        overlay.context2d().stroke();
        overlay.context2d().closePath();


        overlay.context2d().beginPath();
        overlay.context2d().moveTo(cur_mouse_x, 0);
        overlay.context2d().lineTo(cur_mouse_x, overlay._containerHeight);
        overlay.context2d().stroke();
        overlay.context2d().closePath();
    }
    // }



}


function update_grid_overlap_percent() {

    let input_length = ($("#grid_overlap_percent_input").val()).length;
    if ((input_length < 1) || (input_length > 10)) {
        return false;
    }
    let input_val = $("#grid_overlap_percent_input").val();
    if (!(isNumeric(input_val))) {
        return false;
    }
    input_val = parseFloat(input_val);
    if (input_val < 0) {
        return false;
    }

    if (input_val > 0.95) {
        return false;
    }

    return true;

}

// function update_zoom_level() {

//     let input_length = ($("#zoom_level_setting").val()).length;
//     if ((input_length < 1) || (input_length > 10)) {
//         return false;
//     }
//     let input_val = $("#zoom_level_setting").val();
//     if (!(isNumeric(input_val))) {
//         return false;
//     }
//     input_val = parseFloat(input_val);
//     if (input_val < viewer.viewport.minZoomLevel) {
//         return false;
//     }

//     if (input_val > viewer.viewport.maxZoomLevel) {
//         return false;
//     }

//     return true;

// }


function grid_keydown_handler(e) {
    if ((e.keyCode == 88) || ((e.keyCode == 39) || (e.keyCode == 32))) {
        $("#next_tile_button").click();
    }
    if ((e.keyCode == 90) || (e.keyCode == 37)) {//(e.keyCode == 32) {
        $("#prev_tile_button").click();
    }
    // if ((e.keyCode == 38) || (e.keyCode == 40)) {//(e.keyCode == 32) {
    // }

}