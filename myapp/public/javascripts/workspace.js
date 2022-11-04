

// import { bilinearInterpolation } from "simple-bilinear-interpolation";

//let update_time = 0;

let image_set_info;
let metadata;
let camera_specs;
let dzi_image_paths;
let annotations;
let image_to_dzi;
let predictions;



let viewer;
let anno;
let overlay;
let prediction_anno;
let cur_img_name;
let cur_region_index;
let cur_nav_list;
let cur_view;
let countdown_handle;
let ask_to_continue_handle;
let cur_update_num = -1;
//let pending_predictions;
 // = {};
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

// let overlay_colors = [
//     "#0080C0",        
//     "#FF4040"
// ];
// let overlay_names = [
//     "annotations",
//     "predictions"
// ];




/*
function set_prediction_overlay_color() {

    for (let image_name of Object.keys(predictions)) {
        for (let annotation of predictions[image_name]["annotations"]) {
            annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"})
        }
    }
}
  */








function change_image(cur_nav_item) {

    //let region_text;
    let navigation_type = $("#navigation_dropdown").val();
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
    else {
        let img_bounds = annotations[cur_img_name][navigation_type][cur_region_index];
        img_min_y = img_bounds[0];
        img_min_x = img_bounds[1];
        img_max_y = img_bounds[2];
        img_max_x = img_bounds[3];
    }


    let box_min_x = Math.max(px_lst[0], img_min_x);
    let box_min_y = Math.max(px_lst[1], img_min_y);

    let box_max_x = Math.min(px_lst[0] + px_lst[2], img_max_x);
    let box_max_y = Math.min(px_lst[1] + px_lst[3], img_max_y);


    let box_centre_x = (box_max_x + box_min_x) / 2;
    let box_centre_y = (box_max_y + box_min_y) / 2;

    let box_w = box_max_x - box_min_x;
    let box_h = box_max_y - box_min_y;


    let min_dim = 4;
    let max_dim = 1600;
    if (box_w < min_dim) {

        let tentative_box_min_x = box_centre_x - Math.floor(min_dim / 2);
        let tentative_box_max_x = box_centre_x + Math.floor(min_dim / 2);
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
        let tentative_box_min_y = box_centre_y - Math.floor(min_dim / 2);
        let tentative_box_max_y = box_centre_y + Math.floor(min_dim / 2);
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

// function update_image_status() {
//     let prev_status = annotations[cur_img_name]["status"];
//     let num_image_annotations = annotations[cur_img_name]["boxes"].length;
//     let new_status = prev_status;
//     if (prev_status === "unannotated" && num_image_annotations > 0) {
//         new_status = "started";
//     }
//     else if (prev_status === "started" && num_image_annotations == 0) {
//         new_status = "unannotated";
//     }
//     annotations[cur_img_name]["status"] = new_status;
// }

// function set_image_status_combo() {

//     let cur_image_status = annotations[cur_img_name]["status"];
//     let num_annotations = annotations[cur_img_name]["boxes"].length;
//     let image_status_options;
//     if ((cur_image_status === "completed_for_training") && (locked_training_images[cur_img_name])) { //training") {
//         image_status_options = ["completed_for_training"]; //training"];
//     }
//     else if (((cur_image_status === "completed_for_training") && (!(locked_training_images[cur_image_name]))) || 
//                 (cur_image_status === "completed_for_testing")) {
//         if (num_annotations == 0) {
//             image_status_options = ["unannotated", "completed_for_training", "completed_for_testing"];
//         }
//         else {
//             image_status_options = ["started", "completed_for_training", "completed_for_testing"];
//         }
//     }
//         /*
//         if (num_annotations > 0) {
//             image_status_options = ["started", "completed"];
//         }
//         else {
//             image_status_options = ["unannotated", "completed"];
//         }*/
//     else if (cur_image_status === "started") {
//         image_status_options = ["started", "completed_for_training", "completed_for_testing"];
//     }
//     else if (cur_image_status === "unannotated") {
//         image_status_options = ["unannotated", "completed_for_training", "completed_for_testing"];
//     }


//     $("#status_combo").empty();
//     $("#status_combo").css("background-color", status_color[cur_image_status]);
//     for (let image_status of image_status_options) {
//         let color = status_color[image_status];
//         let text = status_to_text[image_status];
//         //$("#status_combo").append(`<option style="background-color: ${color}" value="${image_status}">${image_status}</option>`);
//         $("#status_combo").append(`<option style="background-color: ${color}" value="${image_status}">${text}</option>`);
//         /*
//         $("#status_combo").append($('<option style="background-color: red">', {
//             value: image_status,
//             text: image_status
//         }));*/
//     }
//     $("#status_combo").val(cur_image_status);
// }



function create_anno() {


    anno = OpenSeadragon.Annotorious(viewer, {
        disableEditor: true,
        disableSelect: true, //false, //readOnly,
        readOnly: true, //false, //readOnly,
        formatter: formatter
    });


    anno.on('createAnnotation', function(annotation) {
        console.log("createAnnotation");

        //annotations[cur_img_name]["annotations"] = anno.getAnnotations();
        console.log("annotation", annotation);
        //annotation

        // annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

        /*
        let box = updated_px_str.split(",");

        annotations[cur_img_name]["boxes"].push([box[1], box[0], box[1] + box[3], box[0] + box[2]]);
        viewer.raiseEvent('update-viewport');
        
*/
        selected_annotation_index = -1
        selected_annotation = null;

        
        let updated_px_str = annotation["target"]["selector"]["value"];
        updated_px_str = updated_px_str.substring(11);
        let px_lst = updated_px_str.split(",").map(x => parseFloat(x));
/*
        if ($("#add_training_region_button").is(":disabled")) {
            training_regions.push([
                parseFloat(px_lst[1].toFixed(2)), 
                parseFloat(px_lst[0].toFixed(2)), 
                parseFloat((px_lst[1] + px_lst[3]).toFixed(2)), 
                parseFloat((px_lst[0] + px_lst[2]).toFixed(2))
            ]);
        }*/

        let box = [
            // parseFloat(px_lst[1].toFixed(2)), 
            // parseFloat(px_lst[0].toFixed(2)), 
            // parseFloat((px_lst[1] + px_lst[3]).toFixed(2)), 
            // parseFloat((px_lst[0] + px_lst[2]).toFixed(2))

            Math.round(px_lst[1]), 
            Math.round(px_lst[0]), 
            Math.round(px_lst[1] + px_lst[3]),
            Math.round(px_lst[0] + px_lst[2])
        ];

        //let edit_layer = $('input[name=edit_layer_radio]:checked').val();

        // let update_save_icon = true;
        let sel_box_array;
        if (cur_edit_layer === "annotation") {
            // let intersects = false;
            // for (let i = 0; i < annotations[cur_img_name]["training_regions"].length; i++) {
            //     if ((locked_training_regions[i]) && 
            //         (box_intersects_region(box, annotations[cur_img_name]["training_regions"][i]))) {
            //         intersects = true;
            //         update_save_icon = false;
            //         break;
            //     }
            // }
            // if (!intersects) {
            //     annotations[cur_img_name]["boxes"].push(box);
            // }
            sel_box_array = annotations[cur_img_name]["boxes"];
        }
        else if (cur_edit_layer === "training_region") {
            //new_training_regions[cur_img_name].push(box);
            sel_box_array = annotations[cur_img_name]["training_regions"];
            //annotations[cur_img_name]["training_regions"].push(box);
            // let num_regions = get_num_regions("training_regions");
            // if (num_regions == 0) {
                
            //     let num_options = $('#navigation_dropdown').children('option').length;
            //     $("#navigation_dropdown").empty();
            //     if (num_options == 1) {
            //         $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
            //         $("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
            //     }
            //     else if (num_options == 2) {
            //         $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
            //         $("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
            //         $("#navigation_dropdown").append($("<option></option>").val("test_regions").text("Test Regions"));
            //     }


            //     //$("#navigation_dropdown").eq(0).before($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
            // }
            
        }
        else {
            sel_box_array = annotations[cur_img_name]["test_regions"]
            //annotations[cur_img_name]["test_regions"].push(box);

            // let num_regions = get_num_regions("test_regions");
            // if (num_regions == 0) {
            //     let num_options = $('#navigation_dropdown').children('option').length;
            //     $("#navigation_dropdown").empty();
            //     if (num_options == 1) {
            //         $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
            //         $("#navigation_dropdown").append($("<option></option>").val("test_regions").text("Test Regions"));
            //     }
            //     else if (num_options == 2) {
            //         $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
            //         $("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
            //         $("#navigation_dropdown").append($("<option></option>").val("test_regions").text("Test Regions"));
            //     }
                  
            // }
        }

        let illegal_intersection = false;
        if ((cur_edit_layer === "annotation") || (cur_edit_layer === "test_region")) {
            for (let i = 0; i < annotations[cur_img_name]["training_regions"].length; i++) {
                if (box_intersects_region(box, annotations[cur_img_name]["training_regions"][i])) {
                    illegal_intersection = true;
                    break;
                }
            }
        }
        else if (cur_edit_layer === "training_region") {
            console.log("checking for intersections with test regions");
            loop1:
            for (let region_key of ["training_regions", "test_regions"]) {
                for (let i = 0; i < annotations[cur_img_name][region_key].length; i++) {
                    if (box_intersects_region(box, annotations[cur_img_name][region_key][i])) {
                        illegal_intersection = true;
                        break loop1;
                    }
                }
            }
        }
        if (!(illegal_intersection)) {
            console.log("no illegal intersection detected");
            sel_box_array.push(box);
            update_navigation_dropdown();
            if (cur_edit_layer === "training_region") {
                locked_training_regions[cur_img_name].push(false);
            }
            $("#save_icon").css("color", "#ed452b");
        }

        

        
        console.log("annotations", annotations);
        anno.clearAnnotations();
        viewer.raiseEvent('update-viewport');





        // update_image_status();
        // set_image_status_combo();
        // if (update_save_icon) {
        //     $("#save_icon").css("color", "#ed452b");
        // }
        // create_image_set_table();
    });

    anno.on('createSelection', async function(selection) {
        console.log("createSelection");

        selection.target.source = window.location.href;

        
        selection.body = [{
            type: 'TextualBody',
            purpose: 'class',
            value: 'object'
        }];

        let px_str = selection.target.selector.value;
        let updated_px_str = resize_px_str(px_str);

        selection.target.selector.value = updated_px_str;

        // Make sure to wait before saving!

        await anno.updateSelected(selection);
        anno.saveSelected();
        //await anno.updateSelected(selection, true);





        
    });

    /*
    anno.on('cancelSelected', function(selection) {
        console.log("CANCEL SELECTED", selection);
        
        selected_annotation_index = -1
        selected_annotation = null;
        anno.clearAnnotations();
        viewer.raiseEvent('update-viewport');

    });*/

    anno.on('updateAnnotation', async function(annotation, previous) {
        console.log("UPDATE ANNOTATION");

        let px_str = annotation.target.selector.value;
        let updated_px_str = resize_px_str(px_str);

        annotation.target.selector.value = updated_px_str;

        //await anno.updateSelected(annotation);
        //anno.saveSelected();
        //await anno.updateSelected(selection, true);

        //let box = updated_px_str.split(",");
        updated_px_str = updated_px_str.substring(11);
        let px_lst = updated_px_str.split(",").map(x => parseFloat(x));

        console.log("updating box at index", selected_annotation_index);

        //annotations[cur_img_name]["boxes"][selected_annotation_index] 
        let updated_box = [
            // parseFloat(px_lst[1].toFixed(2)), 
            // parseFloat(px_lst[0].toFixed(2)), 
            // parseFloat((px_lst[1] + px_lst[3]).toFixed(2)), 
            // parseFloat((px_lst[0] + px_lst[2]).toFixed(2)),
            Math.round(px_lst[1]), 
            Math.round(px_lst[0]), 
            Math.round(px_lst[1] + px_lst[3]),
            Math.round(px_lst[0] + px_lst[2])
        ];


        // let prev_box;
        
        //let edit_layer = $('input[name=edit_layer_radio]:checked').val();
        let sel_box_array;
        // let update_save_icon = true;
        if (cur_edit_layer === "annotation") {
            sel_box_array = annotations[cur_img_name]["boxes"];
            // prev_box = sel_box_array[selected_annotation_index];
            // let intersects = false;
            // for (let i = 0; i < annotations[cur_img_name]["training_regions"].length; i++) {
            //     if ((locked_training_regions[i]) && 
            //     (box_intersects_region(updated_box, annotations[cur_img_name]["training_regions"][i]))) {
            //         intersects = true;
            //         update_save_icon = false;
            //         break;
            //     }
            // }
            // if (!intersects) {
            //     sel_box_array[selected_annotation_index] = updated_box;
            // }
            // sel_box_array[selected_annotation_index] = updated_box;
        }
        else if (cur_edit_layer === "training_region") {
            sel_box_array = annotations[cur_img_name]["training_regions"];
            // prev_box = sel_box_array[selected_annotation_index];
            // sel_box_array[selected_annotation_index] = updated_box;
        }
        else {
            sel_box_array = annotations[cur_img_name]["test_regions"];
            // prev_box = sel_box_array[selected_annotation_index];
            // sel_box_array[selected_annotation_index] = updated_box;
        }

        let illegal_intersection = false;
        if ((cur_edit_layer === "annotation") || (cur_edit_layer === "test_region")) {
            for (let i = 0; i < annotations[cur_img_name]["training_regions"].length; i++) {
                if ((box_intersects_region(updated_box, annotations[cur_img_name]["training_regions"][i]))) {
                    illegal_intersection = true;
                    break;
                }
            }
        }
        else if (cur_edit_layer === "training_region") {
            loop1:
            for (let region_key of ["training_regions", "test_regions"]) {
                for (let i = 0; i < annotations[cur_img_name][region_key].length; i++) {
                    if ((region_key === "training_regions") && (i == selected_annotation_index)) {
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
            }
            // $("#save_icon").css("color", "#ed452b");
        }



        // console.log("update_save_icon", update_save_icon);
        // if ((update_save_icon) && (!(arraysEqual(updated_box, prev_box)))) {
        //     $("#save_icon").css("color", "#ed452b");
        // }
        
        //console.log("annotations", annotations);

        //annotations[cur_img_name]["annotations"] = anno.getAnnotations();
        

        // annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

        selected_annotation_index = -1
        selected_annotation = null;
        anno.clearAnnotations();
        viewer.raiseEvent('update-viewport');
        //add_annotations();
    });

}

/*
async function add_the_annotation(selection) {
    anno.addAnnotation(selection);
    await anno.updateSelected(selection);
    anno.saveSelected();
}*/




function create_viewer(viewer_id) {
    console.log("create_viewer");

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
    });



    
    overlay = viewer.canvasOverlay({

        // onOpen: function() {
        //     set_cur_bounds();
        // },
        onRedraw: function() {
            console.log("onRedraw", selected_annotation_index, cur_edit_layer);


        
            let boxes_to_add = {};
            if ((cur_panel === "annotation") || (cur_panel === "prediction")) {
                boxes_to_add["training_region"] = {};
                boxes_to_add["training_region"]["boxes"] = annotations[cur_img_name]["training_regions"];
                boxes_to_add["test_region"] = {};
                boxes_to_add["test_region"]["boxes"] = annotations[cur_img_name]["test_regions"];
            }


            if ((cur_panel === "annotation") || (cur_panel === "prediction" && ($("#annotation").is(":checked")))) {
                boxes_to_add["annotation"] = {};
                boxes_to_add["annotation"]["boxes"] = annotations[cur_img_name]["boxes"];
            }

            //console.log("cur_panel", cur_panel);
            //console.log("cur_img_name", cur_img_name);
            //console.log("PREDICTIONS", predictions);
            //console.log($("#predictions").is(":checked"));
            //console.log("selected_annotation_index", selected_annotation_index);
            //console.log("selected_annotation", selected_annotation);
            //console.log("actual selected annotation", anno.getSelected());

            if (((cur_panel == "prediction") && (cur_img_name in predictions)) && ($("#prediction").is(":checked"))) {
                boxes_to_add["prediction"] = {};
                boxes_to_add["prediction"]["boxes"] = predictions[cur_img_name]["boxes"];
                boxes_to_add["prediction"]["scores"] = predictions[cur_img_name]["scores"];
            }
            //console.log("boxes_to_add", boxes_to_add);
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


            let draw_order = ["training_region", "test_region", "annotation", "prediction"];
            for (let key of draw_order) { //Object.keys(boxes_to_add)) {
                //console.log("ADDING", key);

                if (!(key in boxes_to_add)) {
                    continue;
                }


                overlay.context2d().strokeStyle = overlay_colors[key]; //"Annotations"]; //"#FF4040";
                overlay.context2d().lineWidth = 2;



                //for (let i = 0; i < annotations[cur_img_name]["boxes"].length; i++) {
                for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {
                    if ((cur_edit_layer === key) && (i == selected_annotation_index)) {
                        continue;
                    }

                    let box = boxes_to_add[key]["boxes"][i];
                    if (key === "prediction") {
                        let score = boxes_to_add[key]["scores"][i];
                        if (score < slider_val) {
                            continue;
                        }
                    }

                    let box_width_pct_of_image = (box[3] - box[1]) / overlay.imgWidth;
                    let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                    let box_height_pct_of_image = (box[3] - box[1]) / overlay.imgHeight;
                    let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;

                    if ((disp_width * disp_height) < 0.5) {
                        continue;
                    }

                    if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
                        let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                        let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));


                        
                        // if (key === "training_region" || key === "test_region") {

                        //     overlay.context2d().fillStyle = overlay_colors[key] + "22"; //"#0080C022";
                        //     overlay.context2d().fillRect(
                        //         viewer_point.x,// * container_size.x,
                        //         viewer_point.y,// * container_size.y,
                        //         (viewer_point_2.x - viewer_point.x),// * container_size.x,
                        //         (viewer_point_2.y - viewer_point.y)// * container_size.y
                        //     );
                        // }
                        //console.log("ADDING A BOX!");
                        
                        overlay.context2d().strokeRect(
                            viewer_point.x,// * container_size.x,
                            viewer_point.y,// * container_size.y,
                            (viewer_point_2.x - viewer_point.x),// * container_size.x,
                            (viewer_point_2.y - viewer_point.y)// * container_size.y
                        );
                    }
                }
            }

            if (("prediction" in boxes_to_add) && ($("#scores_switch").is(":checked"))) {
                for (let i = 0; i < boxes_to_add["prediction"]["boxes"].length; i++) {
    
                    let box = boxes_to_add["prediction"]["boxes"][i];
                    let score = boxes_to_add["prediction"]["scores"][i];
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
                        //let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));

                        let score_text = score.toFixed(2); //toString().padEnd(4, "0");

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
                                viewer_point.x - 1,// * container_size.x,
                                viewer_point.y - 20,// * container_size.y,
                                36, //ctx.measureText(score).width,// * container_size.x,
                                20// * container_size.y
                            );




                        overlay.context2d().fillStyle = "black";
                        overlay.context2d().fillText(score_text, 

                            viewer_point.x + 3,// * container_size.x, //text_x,
                            viewer_point.y - 5// * container_size.y//text_y
                        );
                    }
                }
            }

            
            let navigation_type = $("#navigation_dropdown").val();
            //console.log("cur_bounds", cur_bounds);
            if (navigation_type === "training_regions" || navigation_type === "test_regions") {

                //console.log("cur_bounds", cur_bounds);
                //console.log("viewer_bounds", viewer.viewport.getBounds());
                // let new_bounds = viewer.viewport.getBounds();
                // if (!(Object.is(cur_bounds, viewer.viewport.getBounds()))) {
                // if ((new_bounds.x != cur_bounds.x || new_bounds.y != cur_bounds.y) ||
                    // (new_bounds.width != cur_bounds.width || new_bounds.height != cur_bounds.height)) {
                    //console.log("zooming to region");
                
                //console.log("cur_bounds", cur_bounds);
                //if (cur_bounds != null) {
                    let region = annotations[cur_img_name][navigation_type][cur_region_index];
                    //console.log("bounds", bounds);
                    // let upper_left = viewer.viewport.imageToViewportCoordinates(bounds[1], bounds[0]);
                    // let lower_right = viewer.viewport.imageToViewportCoordinates(bounds[3], bounds[2]);

                    let image_px_width = metadata["images"][cur_img_name]["width_px"];
                    let image_px_height = metadata["images"][cur_img_name]["height_px"];


                    let rects = [
                        [0 -10 , 0 -10, region[0], image_px_width +10],
                        [0, region[3], image_px_height +10, image_px_width +10],
                        [region[2], 0 -10, image_px_height +10, image_px_width +10],
                        [0 -10, 0 -10, image_px_height +10, region[1]]

                    ];

                    //let bounds = annotations[cur_img_name][navigation_type][cur_region_index];


                    
                    
                    overlay.context2d().fillStyle = "#222621";
                    for (let rect of rects) {
                        let viewer_point = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(rect[1], rect[0]));
                        let viewer_point_2 = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(rect[3], rect[2]));
                        
                        overlay.context2d().fillRect(
                            viewer_point.x,// * container_size.x,
                            viewer_point.y,// * container_size.y,
                            (viewer_point_2.x - viewer_point.x),// * container_size.x,
                            (viewer_point_2.y - viewer_point.y)// * container_size.y
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


                //}
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
            

        },
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

    

    viewer.innerTracker.keyDownHandler = function(e) {
        //console.log("del fired");

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



                sel_box_array.splice(selected_annotation_index, 1);
                selected_annotation = null;
                selected_annotation_index = -1;

                update_navigation_dropdown();


                if (cur_edit_layer === "training_region") {
                    locked_training_regions[cur_img_name].splice(selected_annotation_index, 1);
                }

                
                if ((cur_edit_layer === "annotation") && (sel_box_array.length == 0)) {
                    annotations[cur_img_name]["predictions_used_as_annotations"] = false;
                }
                

                

                // annotations[cur_img_name]["update_time"] = parseInt(new Date().getTime() / 1000);

                // update_image_status();
                // set_image_status_combo();
                $("#save_icon").css("color", "#ed452b");
                // create_image_set_table();
                //}
            }

        }

    }
/*
    viewer.addHandler("open", function(event) {

        if (cur_bounds) {
            withFastOSDAnimation(viewer.viewport, function() {
                viewer.viewport.fitBounds(cur_bounds);
            });
        }
        
    });*/


    
    viewer.addHandler('canvas-click', function(event) {
        // The canvas-click event gives us a position in web coordinates.

        if (cur_panel === "annotation") {
            console.log("CANVAS-CLICK", selected_annotation_index);

            //console.log("getting selected");
            //let selected = anno.getSelected();
            //console.log("got selected", selected);
            //if (selected == null) {

            /*
            if (selected_annotation != null) {
                anno.updateSelected(selected_annotation, true);
            }*/
            if (selected_annotation_index == -1) {

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


                anno.clearAnnotations();

                let annotation_uuid = null;
                let webPoint = event.position;

                //console.log("webPoint", webPoint);
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
                else if (cur_edit_layer === "training_region") {
                    sel_box_array = annotations[cur_img_name]["training_regions"];
                }
                else {
                    sel_box_array = annotations[cur_img_name]["test_regions"];
                }

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
                            if ((box_intersects_region(box, annotations[cur_img_name]["training_regions"][i]))) {

                                selected_annotation_index = -1;
                                return;
                            }
                        }
                    }

                    console.log("ADDING AN ANNOTATION");
                    annotation_uuid = uuidv4();
                    //let box = annotations[cur_img_name]["boxes"][selected_annotation_index];
                    
                    let box_str = [box[1], box[0], (box[3] - box[1]), (box[2] - box[0])].join(",");

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
                                "type": "FragmentSelector",
                                "conformsTo": "http://www.w3.org/TR/media-frags/",
                                "value": "xywh=pixel:" + box_str
                            }
                        },
                        "@context": "http://www.w3.org/ns/anno.jsonld",
                        "id": annotation_uuid
                    };



                    if (cur_edit_layer === "training_region")  {
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
                    anno.addAnnotation(selected_annotation); //.then(() => anno.selectAnnotation(selected_annotation));
                    //anno.selectAnnotation(selected_annotation);

                    delay(10).then(() => anno.selectAnnotation(selected_annotation));

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
                console.log("NON NULL ANNOTATION");
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
                        console.log("WEIRD (1): selecting what should be selected");
                        anno.clearAnnotations();
                        anno.addAnnotation(selected_annotation);
                        delay(10).then(() => anno.selectAnnotation(selected_annotation));
                        //anno.selectAnnotation(selected_annotation);
                    }
                    else {
                        console.log("WEIRD (2): removing all annotations")
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


    let num_completed = 0;
    for (let image_name of Object.keys(annotations)) {

        let image_width_px = metadata["images"][image_name]["width_px"];
        let image_height_px = metadata["images"][image_name]["height_px"];

        if (image_is_fully_annotated(annotations, image_name, image_width_px, image_height_px)) {
            num_completed++;
        }
        
        // if (annotations[image_name]["status"] == "completed_for_training" ||
        //     annotations[image_name]["status"] == "completed_for_testing") {
        //     num_completed++;
        // }
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

    set_heights();


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
    }

    console.log("attempting to save_annotations");
    $.post($(location).attr('href'),
    {
        action: "save_annotations",
        annotations: JSON.stringify(annotations),
        excess_green_record: JSON.stringify(excess_green_record),
        is_ortho: metadata["is_ortho"],
        is_public: metadata["is_public"],
        //train_num_increased: train_num_increased ? "True" : "False"
        num_training_regions_increased: new_training_regions > 0 ? "yes" : "no",
        object_name: metadata["object_name"]
    },
    
    function(response, status) {

        console.log("got response");
        
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
            if (model_unassigned) {
                $("#model_fully_trained").html("---");
                $("#model_fine_tuned").html("---");
            }
            else {
                //if (model_fully_trained)
                if (num_training_regions == num_regions_fully_trained_on) {
                    $("#model_fully_trained").html("Yes");
                }
                else {
                    $("#model_fully_trained").html("No");
                }
                if (num_training_regions > 0) {
                    $("#model_fine_tuned").html("Yes");
                }
                else {
                    $("#model_fine_tuned").html("No");
                }
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


function expired_session() {
/*
    if (metadata["is_ortho"] === "yes") {
        save_annotations_for_ortho();
    }
    else {
        save_annotations_for_image_set();
    }
*/
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




function confirmed_use_predictions() {

    let navigation_type = $('#navigation_dropdown').val();

    /* Delete old boxes */
    let region;
    if (navigation_type === "images") {
        annotations[cur_img_name]["boxes"] = [];
        region = null;
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
        if (predictions[cur_img_name]["scores"][i] >= slider_val) {
            let box = predictions[cur_img_name]["boxes"][i];
            if (navigation_type === "images") {
                annotations[cur_img_name]["boxes"].push(box);
            }

            else {
                if (box_intersects_region(box, region)) {
                    annotations[cur_img_name]["boxes"].push(box);
                }
            }
        }
    }

    annotations[cur_img_name]["predictions_used_as_annotations"] = true;
    
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


function show_annotation(change_image=false) {

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


    console.log("show_annotation");

    //create_viewer_and_anno("seadragon_viewer");
    viewer.zoomPerScroll = 1.2;
    anno.readOnly = false; //annotations[cur_img_name]["status"] === "completed_for_training";


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


}


async function show_prediction(change_image=false) {

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


    


    if (cur_img_name in predictions) {
        $("#predictions_available").show();

        set_count_chart_data();
        set_score_chart_data();
        update_score_chart();
        update_count_chart();
    }
    else {
        $("#predictions_unavailable").show();
    }

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


function show_segmentation() {

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

    $("#threshold_slider_val").html(excess_green_record[cur_img_name]["sel_val"]);
    $("#threshold_slider").val(excess_green_record[cur_img_name]["sel_val"]);

    // $("input[name=segmentation_radio][value='pan']").prop("checked", true).change();
    $("#panning_enabled_status").html("No");
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

    console.log("pan_viewport");


    if (viewer == null) {
        $("#seadragon_viewer").empty();
        create_viewer("seadragon_viewer");
    }

    overlay.onOpen = function() {
        //set_cur_bounds();

        //console.log("viewer.viewport.getContainerSize()", viewer.viewport.getContainerSize());
        //viewer.viewport.zoomTo(targetZoom, null, true);
        //viewer.viewport.fitBounds(cur_bounds);
        if (cur_bounds) {
            console.log("fitting to cur_bounds");
            withFastOSDAnimation(viewer.viewport, function() {
                viewer.viewport.fitBounds(cur_bounds);
            });
        }
        else {
            console.log("zooming to correct level");
            let tiledImage = viewer.world.getItemAt(0);
            let viewer_width = $("#seadragon_viewer").width();
            let targetZoom = tiledImage.source.dimensions.x / viewer_width;
            console.log("tiledImage.source.dimensions.x", tiledImage.source.dimensions.x);
            console.log("seadragon_viewer_width", viewer_width);
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

    console.log("segmenting the viewport");

    if (viewer != null) {
        cur_bounds = viewer.viewport.getBounds();

        // Make the img a global and check if it is null. If it is not just don't do this step.
        // This way we can call Segment multiple times instead of alternating between pan and segment.
        let img = viewer.drawer.canvas.toDataURL("image/png");
        // console.log(img);
        // console.log(typeof(img));
        
        let canvas = document.createElement("canvas");
        canvas.id = "my_canvas";
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

        rgb_ctx.canvas.width = container_width;
        rgb_ctx.canvas.height = container_height;

        let w = rgb_ctx.canvas.width;
        let h = rgb_ctx.canvas.height 


        rgb_ctx.drawImage(rgb_image, 0, 0, w, h);      // Set image to Canvas context
        d_rgb = rgb_ctx.getImageData(0, 0, w, h);  // Get image Data from Canvas context
        // console.log("d_rgb.data", d_rgb.data);

        draw_segmentation();
        }
    }
    else {
        draw_segmentation();
    }
}

function draw_segmentation() {
    console.log("draw_segmentation called");
    
    let threshold = excess_green_record[cur_img_name]["sel_val"]; //0.16;
    let num_foreground = 0;
    let non_zero = [];
    for (let i = 0; i < d_rgb.data.length; i += 4) {
        r_val = d_rgb.data[i] / 255;
        g_val = d_rgb.data[i+1] / 255;
        b_val = d_rgb.data[i+2] / 255;
        if ((r_val != 0 || g_val != 0) || b_val != 0) {
            non_zero.push({"r_val": r_val, "g_val": g_val, "b_val": b_val}); //console.log("non zero pixel", r_val, g_val, b_val);
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

    let percent_vegetation = ((num_foreground / (d_rgb.data.length / 4)) * 100).toFixed(2);
    console.log("percent_vegetation", percent_vegetation);
    //excess_green_record[cur_img_name]["ground_cover_percentage"] = parseFloat(percent_vegetation);

    rgb_ctx.putImageData(d_rgb, 0, 0);

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
    $("#seadragon_viewer").empty();
    $("#seadragon_viewer").append(
        rgb_ctx.canvas
    );



}

function my_seg_test() {

    // let img = viewer.drawer.canvas.toDataURL("image/png");
    // console.log("img", img);
    // let threshold = 0.2;
    // for (let i = 0; i < img.data.length; i += 4) {    
    //     console.log(data[i]);
    // //     let is_foreground = img.data[i] > threshold;
    // //     img.data[i+3] = is_foreground ? 255 : 30;

    // //     if (is_foreground) {
    // //         num_foreground++;
    // //     }
    // }

    let tiledImage = viewer.world.getItemAt(0); // Assuming you just have a single image in the viewer
    let targetZoom = tiledImage.source.dimensions.x / viewer.viewport.getContainerSize().x;
    viewer.viewport.zoomTo(targetZoom, null, true);

    // var w = rgb_ctx.canvas.width  = rgb_image.width,
    // h = rgb_ctx.canvas.height = rgb_image.height;

    //let container_size = viewer.viewport.getContainerSize();
    // rgb_ctx.drawImage(rgb_image, 0, 0, w, h);      // Set image to Canvas context
    //let img = overlay.context2d().getImageData(0, 0, container_size.x, container_size.y); 

    delay(1000).then(() => {
    let img = viewer.drawer.canvas.toDataURL("image/png");
    console.log(img);
    console.log(typeof(img));
    
    let canvas = document.createElement("canvas");
    canvas.id = "my_canvas";
    // let image_canvas = document.createElement("canvas");
    // let exg_ctx = canvas.getContext("2d");
    let rgb_ctx = canvas.getContext("2d");



    let rgb_image = new Image();
    rgb_image.src = img; //"/plant_detection/fake_url/image/png";

    rgb_image.onload = function() {



        console.log("rgb_image.data (1)", rgb_image.data);

        let container_size = viewer.viewport.getContainerSize();

        rgb_ctx.canvas.width = container_size.x;
        rgb_ctx.canvas.height = container_size.y;

        let w = rgb_ctx.canvas.width;
        let h = rgb_ctx.canvas.height 


        rgb_ctx.drawImage(rgb_image, 0, 0, w, h);      // Set image to Canvas context
        var d_rgb = rgb_ctx.getImageData(0, 0, w, h);  // Get image Data from Canvas context
        console.log("d_rgb.data", d_rgb.data);

    
        let threshold = 0.16;
        let num_foreground = 0;
        let non_zero = [];
        for (let i = 0; i < d_rgb.data.length; i += 4) {
            r_val = d_rgb.data[i] / 255;
            g_val = d_rgb.data[i+1] / 255;
            b_val = d_rgb.data[i+2] / 255;
            if ((r_val != 0 || g_val != 0) || b_val != 0) {
                non_zero.push({"r_val": r_val, "g_val": g_val, "b_val": b_val}); //console.log("non zero pixel", r_val, g_val, b_val);
            }
            let exg_val = (2 * g_val) - r_val - b_val;

            let is_foreground = exg_val > threshold;
            d_rgb.data[i+3] = is_foreground ? 255 : 30;

            if (is_foreground) {
                num_foreground++;
            }
            
        }
        console.log("non_zero", non_zero);
        console.log("num_foreground", num_foreground);

        let percent_vegetation = ((num_foreground / (d_rgb.data.length / 4)) * 100).toFixed(2);
        console.log("percent_vegetation", percent_vegetation);
        //excess_green_record[cur_img_name]["ground_cover_percentage"] = parseFloat(percent_vegetation);

        rgb_ctx.putImageData(d_rgb, 0, 0);

        $("#seadragon_viewer").hide();

        $("#test_seg_viewer").show();
        // $("#seadragon_viewer").append(
        //     `<div id="my_image_container"></div>`
        //     // class="scrollable_area" style="cursor: grab; height: ${container_height}; width: ${container_width}; border: none">` +
        //    // `</div>`
        // );


        $("#test_seg_viewer").append(
            rgb_ctx.canvas
        );



        /*
        let non_zero = [];
        for (let i = 0; i < rgb_image.data.length; i += 4) {
            r_val = rgb_image.data[i] / 255;
            g_val = rgb_image.data[i+1] / 255;
            b_val = rgb_image.data[i+2] / 255;
            if ((r_val != 0 || g_val != 0) || b_val != 0) {
                non_zero.push({"r_val": r_val, "g_val": g_val, "b_val": b_val}); //console.log("non zero pixel", r_val, g_val, b_val);
            }
        }
        console.log("non_zero", non_zero);*/

    };


    // img.onload = function() {


    //     console.log("started iterating");
    //     let num_foreground = 0;
    //     let is_foreground;
    //     let exg_val;
    //     let r_val, b_val, g_val;


    //     for (let i = 0; i < img.data.length; i += 4) {
    //         r_val = img.data[i] / 255;
    //         g_val = img.data[i+1] / 255;
    //         b_val = img.data[i+2] / 255;
    //         if ((r_val != 0 || g_val != 0) || b_val != 0) {
    //             console.log("non zero pixel", r_val, g_val, b_val);
    //         }
    //         exg_val = (2 * g_val) - r_val - b_val;
    //         is_foreground = exg_val > -10000;
    //         img.data[i+3] = is_foreground ? 255 : 30;
    //         //console.log(img.data[i]);
    //     //     let is_foreground = img.data[i] > threshold;
    //     //     img.data[i+3] = is_foreground ? 255 : 30;

    //         if (is_foreground) {
    //             num_foreground++;
    //         }
    //     }

    //     console.log("num_foreground", num_foreground);

    //     console.log("finished iterating");


    //     overlay.context2d().putImageData(img, 0, 0);
    // }



});

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


/*
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
}*/



function show_segmentation_old() {

    let container_height = $("#seadragon_viewer").height() + "px";
    let container_width = $("#seadragon_viewer").width() + "px";
    //cur_bounds = viewer.viewport.getBounds();
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
        
            switch_model_data["inspected_model_log"] = response.model_log; //model_logs[parseInt(model_log_index)];
            // let inspected_annotations = response.annotations;
            // for (let image_name of Object.keys(inspected_annotations)) {
            //     for (let annotation of inspected_annotations[image_name]["annotations"]) {
            //         annotation["body"].push({"value": "COLOR_BRIGHT", "purpose": "highlighting"})
            //     }
            // }
            console.log("inspected_model_log", switch_model_data["inspected_model_log"]);
        
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
                    console.log("onRedraw"); //, selected_annotation_index, cur_edit_layer);
                    let cur_tiles_url = current_image_set_viewer.source.tilesUrl;
                    let basename_url = basename(cur_tiles_url);
                    let current_image_set_image_name = basename_url.substring(0, basename_url.length-6);
                    //let region = model_image_set_regions[model_viewer.currentPage()];
                
                    let boxes_to_add = {};
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

                    let draw_order = ["annotation", "training_region", "test_region"];
                    for (let key of draw_order) { 
                        
                        current_image_set_overlay.context2d().strokeStyle = overlay_colors[key];
                        current_image_set_overlay.context2d().lineWidth = 2;
                        //console.log("boxes_to_add", boxes_to_add, key);
                        for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {

                            let box = boxes_to_add[key]["boxes"][i];

                            let box_width_pct_of_image = (box[3] - box[1]) / current_image_set_overlay.imgWidth;
                            let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                            let box_height_pct_of_image = (box[3] - box[1]) / current_image_set_overlay.imgHeight;
                            let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;

                            if ((disp_width * disp_height) < 0.5) {
                                continue;
                            }

                            if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
                                let viewer_point = current_image_set_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                                let viewer_point_2 = current_image_set_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));
                                
                                current_image_set_overlay.context2d().strokeRect(
                                    viewer_point.x,
                                    viewer_point.y,
                                    (viewer_point_2.x - viewer_point.x),
                                    (viewer_point_2.y - viewer_point.y)
                                );
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
            change_image_set(0);
        
        }

    });



}
function change_image_set(image_set_index) {
    //console.log("text", text);
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
            show_modal_message("Error", error.message);
        }
        else {

            let model_image_set_annotations = response.annotations;
            let model_image_set_dzi_image_paths = [];
            // let model_image_names = [];
            let model_image_set_regions = [];
            let model_image_set_cur_bounds = null;
            for (let image_name of Object.keys(model_image_set_annotations)) {
                // if (response.annotations[image_name]["training_regions"].length > 0 || response.annotations[image_name]["test_regions"].length > 0) {
                //     image_names.push(image_name);
                // }
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


            // for (let model_image_name of model_image_names) {
            //     let dzi_path = get_CC_PATH() + "/usr/data/" + image_set["username"] + "/image_sets/" +
            //                              image_set["farm_name"] + "/" +
            //                              image_set["field_name"] + "/" +
            //                              image_set["mission_date"] + "/" +
            //                              "dzi_images" + "/" +
            //                              model_image_name + ".dzi";
            //     model_dzi_image_paths.push(dzi_path);
            // }

        
            $("#model_viewer").empty();
        
            let model_viewer = OpenSeadragon({
                id: "model_viewer", //"seadragon_viewer",
                sequenceMode: true,
                prefixUrl: get_CC_PATH() + "/osd/images/",
                tileSources: model_image_set_dzi_image_paths,
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
                    console.log("onRedraw"); //, selected_annotation_index, cur_edit_layer);
                    let cur_tiles_url = model_viewer.source.tilesUrl;
                    let basename_url = basename(cur_tiles_url);
                    let model_image_set_image_name = basename_url.substring(0, basename_url.length-6);
                    let region = model_image_set_regions[model_viewer.currentPage()];
                
                    let boxes_to_add = {};
                    boxes_to_add["training_region"] = {};
                    boxes_to_add["training_region"]["boxes"] = model_image_set_annotations[model_image_set_image_name]["training_regions"];
                    boxes_to_add["test_region"] = {};
                    boxes_to_add["test_region"]["boxes"] = model_image_set_annotations[model_image_set_image_name]["test_regions"]
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

                    let draw_order;
                    if (region == null) {
                        draw_order = ["annotation", "training_region", "test_region"];
                    }
                    else {
                        draw_order = ["annotation"];
                    }
                    for (let key of draw_order) { 
                        
                        model_overlay.context2d().strokeStyle = overlay_colors[key];
                        model_overlay.context2d().lineWidth = 2;
                        //console.log("boxes_to_add", boxes_to_add, key);
                        for (let i = 0; i < boxes_to_add[key]["boxes"].length; i++) {

                            let box = boxes_to_add[key]["boxes"][i];

                            let box_width_pct_of_image = (box[3] - box[1]) / model_overlay.imgWidth;
                            let disp_width = (box_width_pct_of_image / viewer_bounds.width) * container_size.x;
                            let box_height_pct_of_image = (box[3] - box[1]) / model_overlay.imgHeight;
                            let disp_height = (box_height_pct_of_image / viewer_bounds.height) * container_size.y;

                            if ((disp_width * disp_height) < 0.5) {
                                continue;
                            }

                            if (((box[1] < max_x) && (box[3] > min_x)) && ((box[0] < max_y) && (box[2] > min_y))) {
                                let viewer_point = model_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[1], box[0]));
                                let viewer_point_2 = model_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(box[3], box[2]));
                                
                                model_overlay.context2d().strokeRect(
                                    viewer_point.x,
                                    viewer_point.y,
                                    (viewer_point_2.x - viewer_point.x),
                                    (viewer_point_2.y - viewer_point.y)
                                );
                            }
                        }
                    }

                    
                    // let region = annotations[cur_img_name][navigation_type][cur_region_index];

                    let image_px_width = model_overlay.imgWidth;
                    let image_px_height = model_overlay.imgHeight;

                    
                    if (region != null) {
                        let rects = [
                            [0 -10 , 0 -10, region[0], image_px_width +10],
                            [0, region[3], image_px_height +10, image_px_width +10],
                            [region[2], 0 -10, image_px_height +10, image_px_width +10],
                            [0 -10, 0 -10, image_px_height +10, region[1]]

                        ];

                        // let bounds = annotations[cur_img_name][$("#navigation_dropdown").val()][cur_region_index];
                        
                        model_overlay.context2d().fillStyle = "#222621";
                        for (let rect of rects) {
                            let viewer_point = model_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(rect[1], rect[0]));
                            let viewer_point_2 = model_viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(rect[3], rect[2]));
                            
                            model_overlay.context2d().fillRect(
                                viewer_point.x,
                                viewer_point.y,
                                (viewer_point_2.x - viewer_point.x),
                                (viewer_point_2.y - viewer_point.y)
                            );
                        }
                    


                        if (model_image_set_cur_bounds != null) {

                            model_viewer.world.getItemAt(0).setClip(
                                new OpenSeadragon.Rect(
                                    region[1],
                                    region[0],
                                    (region[3] - region[1]),
                                    (region[2] - region[0])
                                )
                            );

                            withFastOSDAnimation(model_viewer.viewport, function() {
                                model_viewer.viewport.fitBounds(model_image_set_cur_bounds);
                            });

                            model_image_set_cur_bounds = null;
                        }
                    }
                },
                clearBeforeRedraw: true
            });



            // let model_anno = OpenSeadragon.Annotorious(model_viewer, {
            //     disableEditor: true,
            //     disableSelect: true,
            //     readOnly: true,
            //     formatter: formatter
            // });

            // model_viewer.addHandler("open", function(event) {
            //     let cur_dzi = basename(event.source)
            //     let cur_image_name = cur_dzi.substring(0, cur_dzi.length - 4);
            //     //update_inspected_overlays(cur_image_name);

            //     model_anno.clearAnnotations();
            //     for (let annotation of image_set_annotations[cur_image_name]["annotations"]) {
            //         model_anno.addAnnotation(annotation);
            //     }
            // });
        }
    });
}


function get_filtered_model_list() {

    let filtered_models = [];
    for (let model of switch_model_data["models"]) {

        let keep = true;
        for (let key of Object.keys(switch_model_data["filter_options"])) {
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

            if ($("#" + key + "_filter").val() == "-- All --" || $("#" + key + "_filter").val() === model[key]) {
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

    if (Object.keys(switch_model_data["filter_options"]).length == 2) {
        let sort_combo_0_val = $("#sort_combo_0").val();
        let sort_combo_1_val = $("#sort_combo_1").val();
        filtered_models.sort(function(a, b) {
            return a[sort_combo_0_val].localeCompare(b[sort_combo_0_val]) || 
                   a[sort_combo_1_val].localeCompare(b[sort_combo_1_val]);
        });
    }
    else {
        let sort_combo_0_val = $("#sort_combo_0").val();
        let sort_combo_1_val = $("#sort_combo_1").val();
        let sort_combo_2_val = $("#sort_combo_2").val();
        filtered_models.sort(function(a, b) {
            return a[sort_combo_0_val].localeCompare(b[sort_combo_0_val]) || 
                   a[sort_combo_1_val].localeCompare(b[sort_combo_1_val]) ||
                   a[sort_combo_2_val].localeCompare(b[sort_combo_2_val]);
        });
    }





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
        $("#models_table").append(
            `<tr style="border-bottom: 1px solid white; border-color: #4c6645;">` + 
                `<td style="width: 100%">` +
                    `<div class="table_entry" style="text-align: left;">${model_details_table}</div>` +
                `</td>` +
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
                `</td>` +
                `<td><div style="width: 5px"></div></td>` +



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

    console.log("you selected", model_creator, model_name);
    switch_model_data["selected_model"] = {
        "model_creator": model_creator,
        "model_name": model_name

    }
    let button_id = model_creator + "\\." + model_name;
    disable_std_buttons([button_id]);
    enable_std_buttons(["submit_model_change"]);
}

function show_models(show_public_models) {

    switch_model_data["models"] = [];
    switch_model_data["selected_model"] = {
        "model_creator": null,
        "model_name": null
    };

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

            switch_model_data["models"] = response.models

            let models = switch_model_data["models"]; //_logs;
                        //[{"name": "foo", "creator": "erik"}, 
                        //  {"name": "bar", "creator": "erik"}, 
                        //  {"name": "baz0-0-0-0", "creator": "erik"}];
            
            if (models.length == 0) {
                $("#models_info").append(`<tr><td>No Models Found!</td></tr>`);
            }
            else {




                $("#model_info").append(
                    `<table style="width: 100%">` +
                        `<tr>` +
                            `<td>` +
                                `<table id="navigate_table" style="width: 400px">` + 
                                    `<tr>` +
                                        `<td>` +
                                            `<h class="header2" style="width: 150px; padding-left: 10px">Filter</h>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<div style="height: 100px">` +
                                                `<table id="filter_table"></table>` +
                                            `</div>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<h class="header2" style="width: 150px; padding-left: 10px">Sort Order</h>` +
                                        `</td>` +
                                    `</tr>` +
                                    `<tr>` +
                                        `<td>` +
                                            `<div style="height: 190px">` +
                                                `<table id="sort_table"></table>` +
                                            `</div>` +
                                        `</td>` +
                                    `</tr>` +
                                `</table>` +
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
                                            `<div class="scrollable_area" style="height: 350px; width: 700px; border: 1px solid white; overflow-y: scroll">` +
                                                `<table id="models_table" style="border-collapse: collapse;"></table>` +
                                            `</div>` +
                                        `</td>` +
                                    `</tr>` +
                                `</table>` +
                            `</td>` +
                        `</tr>` +
                    `</table>`);
                    $("#model_info").append(
                    `<div style="text-align: center;">` +
                        `<div style="height: 10px"></div>` +
                        `<button id="submit_model_change" class="std-button std-button-hover" style="width: 140px">Switch Model</button>` +
                        `<div style="height: 10px"></div>` +
                        `</div>`);
                disable_std_buttons(["submit_model_change"]);


                let filter_values = {
                    "model_object": [],
                    "model_name": [],
                    "model_creator": []
                };
                for (let model of models) {
                    
                    let model_name = model["model_name"];
                    let model_creator = model["model_creator"];
                    let model_object = model["model_object"];

                    filter_values["model_name"].push(model_name);
                    filter_values["model_creator"].push(model_creator);
                    filter_values["model_object"].push(model_object);

                }

                //valid_filter_values["model_name"] = natsort([... new Set(values)]);
                switch_model_data["filter_options"]
                if (action === "fetch_my_models") {
                    switch_model_data["filter_options"] = {
                        "model_object": "Model Object",
                        "model_name": "Model Name"
                    };
                    switch_model_data["sort_options"] = ["model_object", "model_name"];


                }
                else {
                    switch_model_data["filter_options"] = {
                        "model_object": "Model Object",
                        "model_creator": "Model Creator",
                        "model_name": "Model Name"
                    };
                    switch_model_data["sort_options"] = ["model_object", "model_creator", "model_name"];

                }

                for (let i = 0; i < switch_model_data["sort_options"].length; i++) {

                    
                    let select_id = "sort_combo_" + i;
                    //console.log("adding sort combo", select_id);
                    $("#sort_table").append(
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 120px; text-align: right; margin-right: 10px"></div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 250px">` +
                                    `<select id="${select_id}" class="dropdown"></select>` +
                                `</div>` +
                            `</td>` +
                        `</tr>`
                    );
                    for (let j = i; j < switch_model_data["sort_options"].length; j++) {
                        $("#" + select_id).append($('<option>', {
                            value: switch_model_data["sort_options"][j],
                            text: switch_model_data["filter_options"][switch_model_data["sort_options"][j]]
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
                                        text: switch_model_data["filter_options"][sort_option]
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
                for (let key of Object.keys(switch_model_data["filter_options"])) {

                    let disp_text = switch_model_data["filter_options"][key];
                    //console.log(disp_text);
                    let select_id = key + "_filter";

                    $("#filter_table").append(
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 120px; text-align: right; margin-right: 10px">${disp_text}</div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 250px">` +
                                    `<select id="${select_id}" class="dropdown"></select>` +
                                `</div>` +
                            `</td>` +
                        `</tr>`
                    );



                    $("#" + select_id).append($('<option>', {
                        value: "-- All --",
                        text: "-- All --"
                    }));
                    let unique_filter_values = natsort([... new Set(filter_values[key])]);
                    for (let value of unique_filter_values) {
                        $("#" + select_id).append($('<option>', {
                            value: value,
                            text: value
                        }));
                    }

                    if (key === "model_object" && unique_filter_values.includes(metadata["object_name"])) {
                        $("#" + select_id).val(metadata["object_name"]);
                    }
                    else {
                        $("#" + select_id).prop("selectedIndex", 0);
                    }

                    $("#" + select_id).change(function() {
                        create_models_selection_table();
                    });
                }


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

            $("#submit_model_change").click(function() {
                let new_model_name = switch_model_data["selected_model"]["model_name"];
                let new_model_creator = switch_model_data["selected_model"]["model_creator"];
                //console.log("models", models);
                // for (let model of models) {
                //let model_radio = $("input[name=models_radio]");
                //let sel_id = model_radio.filter(":checked").val();
                //new_model_creator = sel_id.split(":")[0];
                //new_model_name = sel_id.split(":")[1];

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
    $("#navigation_table_container").height(396 - max_height);
}

$(document).ready(function() {
    //window.setInterval(refresh, 90000); // 1.5 minutes
    ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000); // 2 hours


   // $("#training_region_radio_container input:checked ~ .custom_radio").css("background-color", "black");

   //.custom_radio_container input:checked ~ .custom_radio.spec_black
    //$(".custom_radio_container").css("background-color", "black"); //"#809c79");

    image_set_info = data["image_set_info"];
    dzi_image_paths = data["dzi_image_paths"];
    annotations = data["annotations"];
    metadata = data["metadata"];
    camera_specs = data["camera_specs"];
    excess_green_record = data["excess_green_record"];
    predictions = data["predictions"];



    create_overlays_table();
    //set_prediction_overlay_color();

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
        console.log("update", update);


        if (update["switch_request"] === "True") {
            waiting_for_model_switch = true;

            show_modal_message(`Please Wait`, 
            `<div id="switch_anno_message">Switching models...</div><div id="switch_anno_loader" class="loader"></div>`);
            $("#modal_close").hide();
        }
        else if (waiting_for_model_switch) {
            waiting_for_model_switch = false;
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
            //disable_std_buttons(["request_result_button", "predict_single_button", "predict_all_button"]);
        }
        else {
            let fully_trained;
            let fine_tuned;
            //if (metadata["is_ortho"] === "yes") {
            console.log("ANNOTATIONS", annotations);
            console.log("CUR_IMG_NAME", cur_img_name);
            console.log("ANNOTATIONS[CUR_IMG_NAME]", annotations[cur_img_name]);
            let num_training_regions = get_num_regions("training_regions");

            fully_trained = num_training_regions == num_regions_fully_trained_on;
            fine_tuned = num_training_regions > 0;
            // }
            // else {
            //     fully_trained = num_training_images == num_images_fully_trained_on;
            //     fine_tuned = num_training_images > 0;
            // }
            if (fully_trained) { //num_training_images == num_images_fully_trained_on) {
                $("#model_fully_trained").html("Yes");
            }
            else {
                $("#model_fully_trained").html("No");
            }
            if (fine_tuned) {
                $("#model_fine_tuned").html("Yes");
            }
            else {
                $("#model_fine_tuned").html("No");
            }
        }

        if (update["outstanding_prediction_requests"] === "True" || model_unassigned) {
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
                    //let num_processed = parseInt(update["num_processed"]);
                    //let num_images = parseInt(update["num_images"]);
                    let percent_complete = Math.round(parseFloat(update["percent_complete"]) * 100) + "%";
                    /*
                    let percent_complete_length = percent_complete.length;
                    console.log(percent_complete_length);
                    if (percent_complete_length == 1) {
                        percent_complete = "  " + percent_complete;
                    }
                    else if (percent_complete_length == 2) {
                        percent_complete = " " + percent_complete;
                    }*/
                    status = status + ":"; // + percent_complete + "%"; //": " + num_processed + " / " + num_images;
                    $("#backend_status").append(`<table><tr><td>${status}</td><td style="text-align: right; width: 45px">${percent_complete}</td></tr></table>`);
                    //<div style="text-align: center">${status}<span style="float: right; color: yellow">${percent_complete}</span></div>`);
                }
                else {
                    $("#backend_status").append(`<div>${status}</div>`);
                }
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
    
    if (metadata["is_ortho"] === "yes") {
        $("#image_sugggestion_container").hide();
    }
    // if (metadata["is_ortho"] === "no") {
    //     draw_ground_cover_chart();
    // }
    // else {
    //     $("#image_sugggestion_container").hide();


    //     $("#show_segmentation_button").hide();
    //     $("#show_annotation_button").css("width", "148px");
    //     $("#show_prediction_button").css("width", "148px");
    // }





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

    $("#save_button").click(async function() {
        window.clearTimeout(ask_to_continue_handle);
        ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000);

        
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




    $("#request_segment_button").click(function() {
        show_segmentation_inner();
    });


    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#confidence_slider_val").html(slider_val);
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
        let cur_nav_item = cur_img_name + "/" + cur_region_index;
        let index = cur_nav_list.findIndex(x => x == cur_nav_item) + 1;
        change_image(cur_nav_list[index]);
    });

    $("#prev_image_button").click(function() {
        let cur_nav_item = cur_img_name + "/" + cur_region_index;
        let index = cur_nav_list.findIndex(x => x == cur_nav_item) - 1;
        change_image(cur_nav_list[index]);
    });


    $("#suggest_image_button").click(function() {

        let candidates = [];
        for (let image_name of Object.keys(annotations)) {
            let image_width_px = metadata["images"][image_name]["width_px"];
            let image_height_px = metadata["images"][image_name]["height_px"];

            let fully_annotated = image_is_fully_annotated(annotations, image_name, image_width_px, image_height_px);
            //let status = annotations[image_name]["status"];
            if ((!(fully_annotated)) && (image_name in predictions)) {
                candidates.push(image_name);
                //console.log("found candidate", image_name);
            }
        }
        console.log("candidates", candidates);
        if (candidates.length <= 1) {
            show_modal_message("Error", "An insufficient number of images have predictions available for assessment." +
                               " Please generate predictions for more images and try again.");
        }
        else {

            //set_score_chart_data();



            let qualities = [];
            for (let image_name of candidates) {
                let scores = predictions[image_name]["scores"];
                let bins = score_histogram(scores);
                bins[bins.length-1].x1 = 1.01;

                let r = evaluate_scores(bins, scores);
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
            console.log("I choose", sel_image_name);

            change_image(sel_image_name + "/-1");
        }
    });

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
        if ($("#panning_enabled_status").html() !== "Yes") {
            $("#panning_enabled_status").html("Yes");
            pan_viewport();
        }
    });
    


    $("#segment_button").click(function() {
        // if ($("#pan_switch").is(":checked")) {
        //     $("#pan_switch").prop("checked", false);
        //     $("#pan_switch").prop("disabled", false)
        //     $("#pan_switch").css("opacity", 1.0);
        // }
        $("#panning_enabled_status").html("No");
        segment_viewport();
    });

    $("input[name=edit_layer_radio]").change(async function(e) {
        //e.preventDefault();

        console.log("edit layer radio changed");

        /*
        if (selected_annotation != null) {
            await anno.updateSelected(selected_annotation, true);
        }*/
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


        console.log("changing edit layer");
        cur_edit_layer = $('input[name=edit_layer_radio]:checked').val();
/*
        anno.clearAnnotations();
        viewer.raiseEvent('update-viewport');*/
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
        // disable_std_buttons(["prev_image_button"]);
        // if (cur_nav_list.length == 0) {
        //     disable_std_buttons(["next_image_button"]);
        // }
        //console.log("CUR NAV LIST", cur_nav_list);

        let navigation_type = $("#navigation_dropdown").val();
        console.log("navigation_type", navigation_type);
        if (navigation_type === "training_regions" || navigation_type == "test_regions") {
            console.log("SETTING");
            $("input:radio[name=edit_layer_radio]").filter("[value=annotation]").prop("checked", true);
            $("input:radio[name=edit_layer_radio]").prop("disabled", true);
            // $("#annotation_label").prop("opacity", 0.5);
            // $("#training_region_label").prop("opacity", 0.5);
            // $("#test_region_label").prop("opacity", 0.5);
            $("#active_layer_table").css("opacity", 0.5);
            $("input:radio[name=edit_layer_radio]").change();

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
        change_image(cur_nav_list[0]);

    });








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
        if (slider_val < 2) {
            slider_val = slider_val + 0.01;
            $("#threshold_slider").val(slider_val).change();
        }
    }
    function lower_threshold_slider() {
        let slider_val = parseFloat($("#threshold_slider").val());
        if (slider_val > -2) {
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

});

