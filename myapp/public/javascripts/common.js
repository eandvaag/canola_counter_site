

const MAX_EDGES_DISPLAYED = 30000;
const MAX_BOXES_DISPLAYED = 30000;


const MAX_NUM_TILES = 50000;

let status_color = {
    "all": "#222621",
    "unannotated": "#222621",
    "started": "#79919c", //"#79839c", //"#7d8591", // "#848484", //"aa", //"#bbb",
    "completed_for_training": "#809c79", //"#7d917d", //"#45633d",
    "completed_for_testing": "#9c9179" //"#918b7d" //#998866" //#998866"
};

let status_to_text = {
    "all": "All",
    "unannotated": "Unannotated",
    "started": "Started",
    "completed_for_training": "Completed for Fine-Tuning",
    "completed_for_testing": "Completed for Testing",
};

let annotations_format_sample_text = 
'{\n' + 
'    "image_1": {\n' +
'        "annotations": [\n' +
'            [2, 4, 10, 9],\n' +
'            ...\n' +
'        ],\n' +
'        "fine_tuning_regions": [\n' +
'            [0, 1, 7, 9],\n' +
'            ...\n' +
'        ],\n' +
'        "test_regions": [\n' +
'            [11, 14, 23, 25],\n' +
'            ...\n' +
'        ]\n' +
'    },\n' +
'    "image_2": {\n' +
'        ...';


let predictions_format_sample_text = 
'{\n' + 
'    "image_1": {\n' +
'        "predictions": [\n' +
'            [2, 4, 10, 9],\n' +
'            ...\n' +
'        ],\n' +
'        "confidence_scores": [\n' +
'            0.83,\n' +
'            ...\n' +
'        ]\n' +
'    },\n' +
'    "image_2": {\n' +
'        ...';


// let overlay_colors = {
//     "annotation": "#0080ff", // "#0080C0",
//     "prediction": "#FF4040",
//     "training_region": "#ff51eb", //"#f705bb",
//     "test_region": "#ffae00" //"#ffa200"
// };

// let default_overlay_colors = {
//     "annotation": "#0080ff",
//     "prediction": "#ff4040",
//     "training_region": "#ff51eb",
//     "test_region": "#ffae00"
// };


let default_overlay_appearance = {
    "draw_order": ["training_region", "test_region", "annotation", "prediction"],
    "style": {
        "annotation": "strokeRect",
        "prediction": "strokeRect",
        "training_region": "strokeRect",
        "test_region": "strokeRect"
    },
    "colors": {
        "annotation": "#0080ff",
        "prediction": "#ff4040",
        "training_region": "#ff51eb",
        "test_region": "#ffae00"
    }
};

let new_overlay_appearance;
/*
let backend_color = {
    "Idle": "#222621",
    "Training": "#809c79",
    "Predicting": "#9c9179",
    "Restarting": "#802626"
}
*/


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
  
    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.
  
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }



function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

const argFact = (compareFn) => (array) => array.map((el, idx) => [el, idx]).reduce(compareFn)[1]

const argMax = argFact((min, el) => (el[0] > min[0] ? el : min))
const argMin = argFact((max, el) => (el[0] < max[0] ? el : max))

/**
  * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
  * 
  * @param {String} text The text to be rendered.
  * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
  * 
  * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
  */
function get_text_width(text, font) {
  // re-use canvas object for better performance
  const canvas = get_text_width.canvas || (get_text_width.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFontSize(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '16px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';
  
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}

function get_max_name_width(names, font) {
    let max_text_width = 0;
    for (let name of names) {
        let text_width = Math.round(get_text_width(name, font));
        if (text_width > max_text_width) {
            max_text_width = text_width;
        }
    }
    return max_text_width;
}

function basename(path) {
    if (path.slice(-1) === "/") {
        path = path.substring(0, path.length - 1);
    }
    return path.split('/').reverse()[0];
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}


function natsort(arr) {
    let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
    return arr.sort(collator.compare);
}

function range_map(old_val, old_min, old_max, new_min, new_max) {
    new_val = (((old_val - old_min) * (new_max - new_min)) / (old_max - old_min)) + new_min;
    return new_val;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

function timestamp_to_date(timestamp){
    // https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
    let a = new Date(timestamp * 1000);
    let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let year = a.getFullYear();
    let month = months[a.getMonth()];
    let date = a.getDate();
    let hour = a.getHours().toString().padStart(2, "0");
    let min = a.getMinutes().toString().padStart(2, "0");
    let sec = a.getSeconds().toString().padStart(2, "0");
    let time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }


  function get_patch_size(annotations) {
    //let box_areas = [];
    let box_area_sum = 0;
    let num_boxes = 0;
    for (let image_name of Object.keys(annotations)) {
        for (let annotation of annotations[image_name]["annotations"]) {
            let coords_str = annotation.target.selector.value;
            let coords = coords_str.substring(11).split(",").map(parseFloat);
            //box_areas.push(coords[2] * coords[3]);
            box_area_sum = box_area_sum + (coords[2] * coords[3]);
            num_boxes++;
        }
    }
    let mean_patch_area = box_area_sum / num_boxes;

    let patch_area = mean_patch_area * (90000 / 2296);
    let patch_size = Math.round(Math.sqrt(patch_area));
    return patch_size;
  }

function get_CC_PATH() {
    return "/" + window.location.pathname.split("/")[1];
}


function disable_close_buttons(button_ids) {

    for (let button_id of button_ids) {
        $("#" + button_id).prop("disabled", true);
        $("#" + button_id).removeClass("close-hover");
        $("#" + button_id).css("opacity", 0.5);
        $("#" + button_id).css("cursor", "default");
    }
}

function disable_x_buttons(button_ids) {
    for (let button_id of button_ids) {
        $("#" + button_id).prop("disabled", true);
        $("#" + button_id).removeClass("x-button-hover");
        $("#" + button_id).css("opacity", 0.5);
        $("#" + button_id).css("cursor", "default");
    }
}

function enable_x_buttons(button_ids) {

    for (let button_id of button_ids) {
        $("#" + button_id).prop("disabled", false);
        $("#" + button_id).addClass("x-button-hover");
        $("#" + button_id).css("opacity", 1);
        $("#" + button_id).css("cursor", "pointer");
    }
}

function disable_std_buttons(button_ids) {

    for (let button_id of button_ids) {
        $("#" + button_id).prop("disabled", true);
        $("#" + button_id).removeClass("std-button-hover");
        $("#" + button_id).css("opacity", 0.5);
        $("#" + button_id).css("cursor", "default");
    }
}

function enable_std_buttons(button_ids) {

    for (let button_id of button_ids) {
        $("#" + button_id).prop("disabled", false);
        $("#" + button_id).addClass("std-button-hover");
        $("#" + button_id).css("opacity", 1);
        $("#" + button_id).css("cursor", "pointer");
    }
}


function disable_buttons(button_ids) {

    for (let button_id of button_ids) {
        $("#" + button_id).prop("disabled", true);
        $("#" + button_id).removeClass("table_button_hover");
        $("#" + button_id).css("opacity", 0.5);
        $("#" + button_id).css("cursor", "default");
    }
}


function enable_buttons(button_ids) {

    for (let button_id of button_ids) {
        $("#" + button_id).prop("disabled", false);
        $("#" + button_id).addClass("table_button_hover");
        $("#" + button_id).css("opacity", 1);
        $("#" + button_id).css("cursor", "pointer");
    }
}



function escapeHtml(unsafe)
{
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         //.replace(/'/g, "&quot;"); //"&#039;");
         .replace(/'/g, "&#039;");
 }


 function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }


function calculate_tile_size_slider_range() {


    let image_name = Object.keys(annotations)[0];
    let image_height_px = metadata["images"][image_name]["height_px"];
    let image_width_px = metadata["images"][image_name]["width_px"];
    
    let make = metadata["camera_info"]["make"];
    let model = metadata["camera_info"]["model"];
    let camera_entry = camera_specs[make][model];

    let camera_height = metadata["camera_height"];
    let sensor_height = camera_entry["sensor_height"];
    let sensor_width = camera_entry["sensor_width"];
    let focal_length = camera_entry["focal_length"];
    let raw_image_height_px = camera_entry["image_height_px"];
    let raw_image_width_px = camera_entry["image_width_px"];


    let gsd_h = (camera_height * sensor_height) / (focal_length * raw_image_height_px);
    let gsd_w = (camera_height * sensor_width) / (focal_length * raw_image_width_px);

    let gsd = Math.min(gsd_h, gsd_w);

    let image_height_m = image_height_px * gsd;
    let image_width_m = image_width_px * gsd;

    // let values = [];

    let max_error = 0.25;
    // let starting_tile_size = 1.0;
    let i = 0;
    //let started = false;
    let starting_tile_size = 100;
    let min_tile_size = 100;

    while (true) {
        let tile_size = starting_tile_size - (i  * 0.25);
        if (tile_size <= 0) {
            break;
        }
        let num_y_tiles = Math.round(image_height_m / tile_size);
        let num_x_tiles = Math.round(image_width_m / tile_size);

        if ((num_y_tiles * num_x_tiles) < MAX_NUM_TILES) {
            min_tile_size = tile_size;
        }
        i += 1;
    }

    starting_tile_size = 0;
    let max_tile_size = 0;
    i = 0;

    while (true) {

        let tile_size = starting_tile_size + (i * 0.25);
        if (tile_size >= 100) {
            break;
        }
        let num_y_tiles = Math.round(image_height_m / tile_size);
        let num_x_tiles = Math.round(image_width_m / tile_size);
        let tile_height_m = image_height_m / num_y_tiles;
        let tile_width_m = image_width_m / num_x_tiles;
        let y_error = Math.abs(tile_height_m - tile_size);
        let x_error = Math.abs(tile_width_m - tile_size);

        if ((y_error > max_error) || (x_error > max_error)) {
            break;
        }
        max_tile_size = tile_size;
        i += 1;
    }


    if (max_tile_size - min_tile_size <= 0) {
        max_tile_size = min_tile_size;
    }




    // while (true) {
    //     let tile_size = lowest_tile_size + (i * 0.25);
    //     let num_y_tiles = Math.round(image_height_m / tile_size);
    //     let num_x_tiles = Math.round(image_width_m / tile_size);

    //     if (!(started)) {
    //         if ((num_y_tiles * num_x_tiles) < MAX_NUM_TILES) {
    //             started = true;
    //             values.push(tile_size);
    //         }
    //     }
    //     else {
    //         let tile_height_error = image_height_m / num_y_tiles;
    //         let tile_width_error = image_width_m / num_x_tiles;
    //         let y_error = Math.abs(tile_height_error - 1);
    //         let x_error = Math.abs(tile_width_error - 1);

    //         if ((y_error > max_error) || (x_error > max_error)) {
    //             break;
    //         }
            

    //     }

    // }

    return [min_tile_size, max_tile_size]; //Math.min(values), Math.max(values)];


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
    if (slider_val < 0.99) {
        slider_val = slider_val + 0.01;
        $("#confidence_slider").val(slider_val).change();
    }
}

function lower_tile_size_slider() {
    let slider_val = parseFloat($("#tile_size_slider").val());
    if (slider_val > $("#tile_size_slider").prop("min")) {
        slider_val = slider_val - 0.25;
        $("#tile_size_slider").val(slider_val).change();
    }
}

function raise_tile_size_slider() {
    let slider_val = parseFloat($("#tile_size_slider").val());
    if (slider_val < $("#tile_size_slider").prop("max")) {
        slider_val = slider_val + 0.25;
        $("#tile_size_slider").val(slider_val).change();
    }
}








function can_calculate_density(metadata, camera_specs) {

    let make = metadata["camera_info"]["make"];
    let model = metadata["camera_info"]["model"];

    if (metadata["is_ortho"] === "yes") {
        if (metadata["camera_height"] === "") {
            return false;
        }
    }
    else {
        if (metadata["missing"]["latitude"]) {
            return false;
        }
        if (metadata["missing"]["longitude"]) {
            return false;
        }
        if (metadata["camera_height"] === "") {
            return false;
        }
    }

    // if (metadata["is_ortho"] === "yes") {
    //     return false;
    // }

    // if (((metadata["missing"]["latitude"]) || metadata["missing"]["longitude"]) || (metadata["camera_height"] === "")) {
    //     return false;
    // }

    if (!(make in camera_specs)) {
        return false;
    }

    if (!(model in camera_specs[make])) {
        return false;
    }

    return true;

}


let formatter = function(annotation) {

    const bodies = Array.isArray(annotation.body) ?
    annotation.body : [ annotation.body ];
  
    const scoreTag = bodies.find(b => b.purpose == 'score');
    const highlightBody = bodies.find(b => b.purpose == 'highlighting');

    let is_checked = $("#scores_switch").is(":checked");
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
  





function create_image_set_details_table(username, farm_name, field_name, mission_date) {

    return  `<table style="font-size: 14px">` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Owner</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${username}</div>` +
                    `</td>` +
                `</tr>` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Farm Name</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${farm_name}</div>` +
                    `</td>` +
                `</tr>` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Field Name</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${field_name}</div>` +
                    `</td>` +
                `</tr>` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Mission Date</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${mission_date}</div>` +
                    `</td>` +
                `</tr>` +
            `</table>`;
}



function create_model_details_table(creator, model_name) {


    return  `<table style="font-size: 14px">` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Creator</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${creator}</div>` +
                    `</td>` +
                `</tr>` +
                `<tr>` +
                    `<td style="text-align: right">` +
                        `<div style="color: #ddccbb; font-weight: 400; width: 90px">Model Name</div>` +
                    `</td>` + 
                    `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                        `<div>${model_name}</div>` +
                    `</td>` +
                `</tr>` +
            `</table>`;
}



function box_intersects_region(box, region) {
    return ((box[1] < region[3] && box[3] > region[1]) && (box[0] < region[2] && box[2] > region[0]));
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




function create_overlays_table() {

    let models_col_width = "215px";
    let disp_text = {
        "annotation": "Annotations",
        "prediction": "Predictions"
    }

    let show_annotation = true;
    if ($("#annotation").length) {
        show_annotation = $("#annotation").is(":checked");
    }
    let show_voronoi_annotation = false;
    if ($("#voronoi_annotation").length) {
        show_voronoi_annotation = $("#voronoi_annotation").is(":checked");
    }
    let show_prediction = true;
    if ($("#prediction").length) {
        show_prediction = $("#prediction").is(":checked");
    }
    let show_voronoi_prediction = false;
    if ($("#voronoi_prediction").length) {
        show_voronoi_prediction = $("#voronoi_prediction").is(":checked");
    }


    $("#overlays_table").empty();
    $("#overlays_table").append(
        `<tr>` +
            `<td>` +
                `<div class="header2" style="width: 80px; font-size: 14px"></div>` +
            `</td>` +
            // `<td>` +
            //     `<div style="width: 15px"></div>` +
            // `</td>` +
            `<td>` +
                `<div class="header2" style="width: 60px; font-size: 14px">Boxes</div>` +
            `</td>` +
            `<td>` +
                `<div class="header2" style="width: 60px; font-size: 14px">Voronoi</div>` +
            `</td>` +
        `</tr>`
    );


    for (let overlay_id of ["annotation", "prediction"]) {
        let overlay_color = overlay_appearance["colors"][overlay_id];
        let voronoi_id = "voronoi_" + overlay_id;
        let disp_overlay_text = disp_text[overlay_id]
        $("#overlays_table").append(
            `<tr style="background-color: ${overlay_color}">` +
                `<td style="border-radius: 30px 0px 0px 30px; border: 1px solid white; border-right: none">` +
                    `<div style="padding: 8px 34px;">${disp_overlay_text}</div>` +
                `</td>` +
                // `<td style="border-top: 1px solid white; border-bottom: 1px solid white;">` +
                //     `<div style="width: 5px"></div>` +
                // `</td>` +
                `<td style="border-top: 1px solid white; border-bottom: 1px solid white;">` +
                    `<label class="switch">` +
                        `<input id=${overlay_id} type="checkbox"></input>` +
                        `<span class="switch_slider round"></span>` +
                    `</label>` +
                `</td>` +
                `<td style="border-radius: 0px 30px 30px 0px; border: 1px solid white; border-left: none">` +
                    `<label class="switch">` +
                        `<input id=${voronoi_id} type="checkbox"></input>` +
                        `<span class="switch_slider round"></span>` +
                    `</label>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td><div style="height: 1px"></div></td>` +
                `<td></td>` +
                `<td></td>` +
            `</tr>`
        );
    }

    if (show_annotation) {
        $("#annotation").prop("checked", true);
    }
    if (show_voronoi_annotation) {
        $("#voronoi_annotation").prop("checked", true);
    }
    if (show_prediction) {
        $("#prediction").prop("checked", true);
    }
    if (show_voronoi_prediction) {
        $("#voronoi_prediction").prop("checked", true);
    }



/*
    for (let overlay_id of ["annotation", "prediction"]) { //Object.keys(overlay_colors)) {
        let overlay_color = overlay_colors[overlay_id];
        //let overlay_id = overlay_name; //.toLowerCase();
        let disp_overlay_text = disp_text[overlay_id]

        let model_row_id = overlay_id + "_row";
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
                `<div style="margin-left: 8px">${disp_overlay_text}</div>` +
            `</td>` +
            `</tr>` +
            `</table>` +
            `</label>` +
            `</td>`+
            `</tr>`);
    }*/
}


// function is_uuid(str) {
//     let regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
//     return regexExp.test(str);
// }

function update_region_name() {
    let navigation_type = $("#navigation_dropdown").val();
    $("#region_name").empty();
    let region_element;
    if (navigation_type === "training_regions" || navigation_type === "test_regions") {

        let disp_region_index = cur_region_index + 1;
        let region_color;
        if (navigation_type === "training_regions") {
            region_color = overlay_appearance["colors"]["training_region"];
        }
        else {
            region_color = overlay_appearance["colors"]["test_region"];
        }


        region_element = create_region_element(region_color, disp_region_index);

        
    }
    else {
        let training_region_count = annotations[cur_img_name]["training_regions"].length;
        let test_region_count = annotations[cur_img_name]["test_regions"].length;
        region_element = create_regions_summary_element(cur_img_name, training_region_count, test_region_count, bookmark_button=true);
    }

    $("#region_name").append(
        region_element
    );

}

function bookmark() {
    let bookmark_status = ("bookmarked" in annotations[cur_img_name] && annotations[cur_img_name]["bookmarked"]);

    annotations[cur_img_name]["bookmarked"] = !(bookmark_status);

    $("#save_icon").css("color", "#ed452b");
    update_region_name();
    create_navigation_table();
}

function create_regions_summary_element(image_name, training_region_count, test_region_count, bookmark_button=false) {
    //console.log("bookmark_button?", bookmark_button)
    if (training_region_count > 0) {
        training_region_element = `<div style="width: 27px; height: 27px; background-color: ${overlay_appearance["colors"]["training_region"]}; color: black; border: none" class="object_entry"><div style="padding-left: 1px">${training_region_count}</div></div>`;
    }
    else {
        training_region_element =  `<div style="width: 27px; height: 27px; border: 1px solid white; border-radius: 50px"></div>`;
    }
    if (test_region_count > 0) {
        test_region_element = `<div style="width: 27px; height: 27px; background-color: ${overlay_appearance["colors"]["test_region"]}; color: black; border: none" class="object_entry"><div style="padding-left: 1px">${test_region_count}</div></div>`;
    }
    else {
        test_region_element =  `<div style="width: 27px; height: 27px; border: 1px solid white; border-radius: 50px"></div>`;
    }
    let bookmark_element;

    if (show_bookmarks) {

        if ("bookmarked" in annotations[image_name] && annotations[image_name]["bookmarked"]) {
            if (bookmark_button) {
                bookmark_element = `<div class="table_button table_button_hover" style="padding: 0px; margin: 0px; width: 20px; height: 27px; border: 1px solid white; background-color: #4c6645; cursor: pointer; border-radius: 3px;" ` +
                    `onclick="bookmark()">` +
                    `<i style="color: white; font-size: 12px; margin-top: 7px" class="fa-regular fa-bookmark"></i>` +
                `</div>`;
            }
            else {
                bookmark_element = `<div style="width: 20px; height: 27px; border: 1px solid white; background-color: #4c6645; border-radius: 3px;">` +
                    `<i style="color: white; font-size: 12px; margin-top: 7px" class="fa-regular fa-bookmark"></i>` +
                `</div>`;
            }

        }
        else {
            if (bookmark_button) {
                bookmark_element = `<div class="table_button table_button_hover" style="border-radius: 3px; padding: 0px; margin: 0px; border: none; cursor: pointer">` +
                    `<div style="opacity: 0.7; border: 1px solid white; border-radius: 3px; padding: 0px; margin: 0px; width: 20px; height: 27px;" ` +
                    `onclick="bookmark()">` +
                    `<i style="color: white; font-size: 12px; margin-top: 7px" class="fa-regular fa-bookmark"></i>` +
                    
                    
                    `</div></div>`;
            }
            else {
                bookmark_element = `<div style="width: 20px; height: 27px; border: 1px solid white; background-color: none; border-radius: 3px;">` +
                `</div>`;
            }
        }
    }

    //console.log(bookmark_element);


    let region_element =
    `<div style="width: 106px; margin: 0px 2px">` +
            `<table>` +

                `<tr>` +

                    `<td>` +
                        training_region_element +
                    `</td>` +
                    `<td>` +
                        `<div style="width: 2px"></div>` +
                    `</td>` +
                    `<td>` +
                        test_region_element +
                    `</td>`;

    if (show_bookmarks) {
        region_element = region_element +  
                    `<td>` +
                        `<div style="width: 2px"></div>` +
                    `</td>` +
                    `<td>` +
                        bookmark_element +
                    `</td>`

    }
    region_element = region_element +
                `</tr>` +
            `</table>` +
        `</div>`;
    
    return region_element;
}

function create_region_element(region_color, region_index) {

    let region_element = 
    `<div style="width: 106px">` +
        `<table>` +
            `<tr>` +
                `<td>` +
                    `<div style="width: 75px; height: 27px; background-color: ${region_color}; color: black; border: none" class="object_entry">Region ${region_index}</div>` +
                `</td>` +
            `</tr>` +
        `</table>` +
    `</div>`;
    return region_element;

}

function create_navigation_table() {

    let navigation_type = $("#navigation_dropdown").val();

    $("#navigation_table").empty();
    cur_nav_list = [];

    if (navigation_type === "images") {
        let image_names = Object.keys(annotations); //.sort();
        // all_uuid = true;
        // for (let image_name of image_names) {
        //     if (!(is_uuid(image_name))) {
        //         all_uuid = false;
        //         break;
        //     }
        // }
        // if (all_uuid) {
        //     image_names = image_names.sort();
        // }
        // else {
        image_names = natsort(image_names);
        //}

        //for (let image_name of natsort(Object.keys(annotations))) {
        for (let image_name of image_names) {
            let nav_item = image_name + "/" + -1;
            let row_id = nav_item + "_row";
            let training_region_count = annotations[image_name]["training_regions"].length;
            let test_region_count = annotations[image_name]["test_regions"].length;
            //let training_region_element;
            //if (training_region_count > 0) {
                // training_region_element = `<div style="width: 30px; background-color: ${overlay_appearance["colors"]["training_region"]}; margin: 0px 4px; color: black; border: none" class="object_entry">${training_region_count}</div>`;
            //}
            //else {
            //    training_region_element =  `<div style="width: 30px; margin: 0px 2px;"></div>`;
            //}
            let regions_summary_element = create_regions_summary_element(image_name, training_region_count, test_region_count, bookmark_button=false);
            let item = 
            `<tr id="${row_id}">` +
                `<td>` +
                    `<div class="table_button table_button_hover" style="width: 245px" ` +
                        `onclick="change_image('${nav_item}')">` +
                        `<table>` +
                            `<tr>` +
                                `<td>` +
                                    `<div style="width: 120px; text-align: left; margin-left: 10px">${image_name}</div>` +
                                `</td>` +
                                `<td>` +
                                    regions_summary_element +
                                `</td>` +
                                // `<td>` +
                                //     `<div style="width: 5px;</div>` +
                                // `</td>` +                                
                                // `<td>` +
                                //     `<div style="width: 30px; background-color: ${overlay_appearance["colors"]["test_region"]}; margin: 0px 4px; color: black; border: none" class="object_entry">${test_region_count}</div>` +
                                // `</td>` +
                            `</tr>` +
                        `</table>` +
                    `</div>` +
                `</td>` +
            `</tr>`;
            // `<tr id="${row_id}">` +
            //     `<td>`+
            //         `<div class="table_button table_button_hover" style="width: 245px;" ` +
            //                 `onclick="change_image('${nav_item}')">${image_name}</div>` +
            //     `</td>` +
            // `</tr>`;
            $("#navigation_table").append(item);
            cur_nav_list.push(nav_item);

        }
    }
    else if (navigation_type === "training_regions" || navigation_type === "test_regions") {

        for (let image_name of natsort(Object.keys(annotations))) {

            for (let i = 0; i < annotations[image_name][navigation_type].length; i++) {
                let nav_item = image_name + "/" + i;
                let row_id = nav_item + "_row";
                let disp_region_index = i + 1;
                let region_color;
                if (navigation_type === "training_regions") {
                    region_color = overlay_appearance["colors"]["training_region"];
                }
                else {
                    region_color = overlay_appearance["colors"]["test_region"];
                }

                let region_element = create_region_element(region_color, disp_region_index);
                let item = 
                `<tr id="${row_id}">` +
                    `<td>` +
                        `<div class="table_button table_button_hover" style="width: 245px" ` +
                            `onclick="change_image('${nav_item}')">` +
                            `<table>` +
                                `<tr>` +
                                    `<td>` +
                                        `<div style="width: 120px; text-align: left; margin-left: 10px">${image_name}</div>` +
                                    `</td>` +
                                    `<td>` +
                                        region_element + //`<div style="width: 75px; background-color: ${region_color}; margin: 0px 2px; color: black; border: none" class="object_entry">Region ${disp_region_index}</div>` +
                                    `</td>` +
                                `</tr>` +
                            `</table>` +
                        `</div>` +
                    `</td>` +
                `</tr>`;
                $("#navigation_table").append(item);
                cur_nav_list.push(nav_item);
            }
        }
    }
}



function update_navigation_dropdown() {

    let cur_navigation_val = $("#navigation_dropdown").val();
    let num_training_regions = get_num_regions("training_regions");
    let num_test_regions = get_num_regions("test_regions");
    $("#navigation_dropdown").empty();
    $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
    if (num_training_regions > 0 && num_test_regions > 0) {
        $("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
        $("#navigation_dropdown").append($("<option></option>").val("test_regions").text("Test Regions"));
    }
    else if (num_training_regions > 0) {
        $("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
    }
    else if (num_test_regions > 0) {
        $("#navigation_dropdown").append($("<option></option>").val("test_regions").text("Test Regions"));
    }
    $("#navigation_dropdown").val(cur_navigation_val);

}


function get_num_regions(region_key) {
    let num_regions = 0
    for (let image_name of Object.keys(annotations)) {
        num_regions += annotations[image_name][region_key].length;
    }
    return num_regions;
}


function image_is_fully_annotated_for_training(annotations, image_name, image_w, image_h) {
    if (annotations[image_name]["training_regions"].length == 0) {
        return false;
    }
    let training_region = annotations[image_name]["training_regions"][0];
    if (((training_region[0] == 0) && (training_region[1] == 0)) && ((training_region[2] == image_h) && (training_region[3] == image_w))) {
        return true;
    }
    return false;
}

function image_is_fully_annotated_for_testing(annotations, image_name, image_w, image_h) {
    if (annotations[image_name]["test_regions"].length == 0) {
        return false;
    }
    let test_region = annotations[image_name]["test_regions"][0];
    if (((test_region[0] == 0) && (test_region[1] == 0)) && ((test_region[2] == image_h) && (test_region[3] == image_w))) {
        return true;
    }
    return false;


    // for (let region of annotations[image_name]["test_regions"]) {
    //     if (((region[0] == 0) && (region[1] == 0)) && ((region[2] == image_h) && (region[3] == image_w))) {
    //         return true;
    //     }
    // }
    // return false;
}

function image_is_fully_annotated(annotations, image_name, image_w, image_h) {
    return (image_is_fully_annotated_for_training(annotations, image_name, image_w, image_h) || image_is_fully_annotated_for_testing(annotations, image_name, image_w, image_h));

/*
    let training_region = annotations[image_name]["training_regions"][0];
    if (((training_region[0] == 0) && (training_region[1] == 0)) && ((training_region[2] == image_h) && (training_region[3] == image_w))) {
        return true;
    }
    for (let region_key of ["training_regions", "test_regions"]) {
        for (let region of annotations[image_name][region_key]) {
            if (((region[0] == 0) && (region[1] == 0)) && ((region[2] == image_h) && (region[3] == image_w))) {
                return true;
            }
        }
    }
    return false;*/
}


function set_cur_bounds() {
    let navigation_type = $("#navigation_dropdown").val();


    // if (cur_panel === "annotation" || cur_panel === "prediction") {
    if (navigation_type === "training_regions" || navigation_type === "test_regions") {
        //console.log("annotations", annotations);
        // console.log("cur_img_name", cur_img_name);
        // console.log("navigation_type", navigation_type);
        // console.log("cur_region_index", cur_region_index);
        let bounds = annotations[cur_img_name][navigation_type][cur_region_index];
        // console.log("bounds", bounds);
        //let image_w = metadata["images"][cur_img_name]["width_px"];
        //let image_h = metadata["images"][cur_img_name]["height_px"];
        //let image_w = overlays[id_prefix].imgWidth;
        //let image_h = overlays[id_prefix].imgHeight;
        let content_size = viewer.world.getItemAt(0).getContentSize();
        let image_w = content_size.x;
        let image_h = content_size.y;

        let hw_ratio = image_h / image_w;
        let viewport_bounds = [
            bounds[1] / image_w,
            (bounds[0] / image_h) * hw_ratio,
            (bounds[3] - bounds[1]) / image_w,
            ((bounds[2] - bounds[0]) / image_h) * hw_ratio
        ];
        // console.log("viewport_bounds", viewport_bounds);

        cur_bounds = new OpenSeadragon.Rect(
            viewport_bounds[0],
            viewport_bounds[1],
            viewport_bounds[2],
            viewport_bounds[3]
        );
    }
    else if (map_zoom_bounds != null) {
        cur_bounds = new OpenSeadragon.Rect(
            map_zoom_bounds[0],
            map_zoom_bounds[1],
            map_zoom_bounds[2],
            map_zoom_bounds[3]
        );
        map_zoom_bounds = null;

    }
    else {
        cur_bounds = null;
    }
    // }

}






function update_count_combo(include_viewer_metrics) {
    let cur_combo_val;
    if ($("#chart_combo option").length > 0) {
        cur_combo_val = $("#chart_combo").val();
    }
    else {
        cur_combo_val = null;
    }
    $("#chart_combo").empty();
    

    $('#chart_combo').append($('<option>', {
        value: "Count",
        text: "Count"
    }));

    if (can_calculate_density(metadata, camera_specs)) {
        $('#chart_combo').append($('<option>', {
            value: "Count Per Square Metre",
            text: "Count Per Square Metre"
        }));
    }

    let navigation_type = $('#navigation_dropdown').val();
    if ((navigation_type === "training_regions" || navigation_type === "test_regions") ||
        (image_is_fully_annotated(annotations, cur_img_name, 
                                  metadata["images"][cur_img_name]["width_px"],
                                  metadata["images"][cur_img_name]["height_px"]))) {

        $('#chart_combo').append($('<option>', {
            value: "Percent Count Error",
            text: "Percent Count Error"
        }));

        if (include_viewer_metrics) {
            let metric_names = [
                "True Positives (IoU=.50, conf>.50)",
                "False Positives (IoU=.50, conf>.50)",
                "False Negatives (IoU=.50, conf>.50)",
                "Precision (IoU=.50, conf>.50)",
                "Recall (IoU=.50, conf>.50)",
                "Accuracy (IoU=.50, conf>.50)",
                "F1 Score (IoU=.50, conf>.50)",
                "AP (IoU=.50:.05:.95)",
                "AP (IoU=.50)",
                "AP (IoU=.75)"
            ];
            for (let metric_name of metric_names) {
                $('#chart_combo').append($('<option>', {
                    value: metric_name,
                    text: metric_name
                }));
            }


            // $('#chart_combo').append($('<option>', {
            //     value: "Precision (IoU=.50, conf>.50)",
            //     text: "Precision (IoU=.50, conf>.50)"
            // }));

            // $('#chart_combo').append($('<option>', {
            //     value: "Recall (IoU=.50, conf>.50)",
            //     text: "Recall (IoU=.50, conf>.50)"
            // }));

            // $('#chart_combo').append($('<option>', {
            //     value: "Accuracy (IoU=.50, conf>.50)",
            //     text: "Accuracy (IoU=.50, conf>.50)"
            // }));


            // $('#chart_combo').append($('<option>', {
            //     value: "F1 Score (IoU=.50, conf>.50)",
            //     text: "F1 Score (IoU=.50, conf>.50)"
            // }));
            // // $('#chart_combo').append($('<option>', {
            // //     value: "F1 Score (IoU=.75, conf>.50)",
            // //     text: "F1 Score (IoU=.75, conf>.50)"
            // // }));


            // $('#chart_combo').append($('<option>', {
            //     value: "AP (IoU=.50:.05:.95)",
            //     text: "AP (IoU=.50:.05:.95)"
            // }));
            // $('#chart_combo').append($('<option>', {
            //     value: "AP (IoU=.50)",
            //     text: "AP (IoU=.50)"
            // }));
            // $('#chart_combo').append($('<option>', {
            //     value: "AP (IoU=.75)",
            //     text: "AP (IoU=.75)"
            // }));
        }
    }

    if ((cur_combo_val != null) && ($("#chart_combo option[value='" + cur_combo_val + "']").length > 0)) {
        $("#chart_combo").val(cur_combo_val);
    }
    else {
        $("#chart_combo").val("Count");
    }
}




function compute_voronoi(target) {
    let bounds_min_y;
    let bounds_min_x;
    let bounds_max_y;
    let bounds_max_x;

    // let navigation_type = $("#navigation_dropdown").val();
    let slider_val = Number.parseFloat($("#confidence_slider").val());
    // if (navigation_type === "training_regions" || navigation_type === "test_regions") {
    //     let cur_region = annotations[cur_img_name][navigation_type][cur_region_index];
    //     bounds_min_y = cur_region[0];
    //     bounds_min_x = cur_region[1];
    //     bounds_max_y = cur_region[2];
    //     bounds_max_x = cur_region[3];
    // }
    // else {
    bounds_min_y = 0;
    bounds_min_x = 0;
    bounds_max_y = metadata["images"][cur_img_name]["height_px"];
    bounds_max_x = metadata["images"][cur_img_name]["width_px"];
    // }

    let bounds = {xl: bounds_min_x, xr: bounds_max_x, yt: bounds_min_y, yb: bounds_max_y};
    let points = [];
    //for (let predicted_box of predictions[cur_img_name]["boxes"]) {
    if (target === "prediction") {
        for (let i = 0; i < predictions[cur_img_name]["scores"].length; i++) {
            if (predictions[cur_img_name]["scores"][i] <= slider_val) {
                continue;
            }
            let box = predictions[cur_img_name]["boxes"][i];
            let centre_y = (box[0] + box[2]) / 2;
            let centre_x = (box[1] + box[3]) / 2;

            if ((centre_y > bounds_min_y && centre_y < bounds_max_y) &&
                (centre_x > bounds_min_x && centre_x < bounds_max_x)) {
                    points.push({
                        "x": centre_x,
                        "y": centre_y
                    });
            }
        }
    }
    //let annotated_points = [];
    else {
        for (let i = 0; i < annotations[cur_img_name]["boxes"].length; i++) {
            let box = annotations[cur_img_name]["boxes"][i];
            let centre_y = (box[0] + box[2]) / 2;
            let centre_x = (box[1] + box[3]) / 2;

            if ((centre_y > bounds_min_y && centre_y < bounds_max_y) &&
                (centre_x > bounds_min_x && centre_x < bounds_max_x)) {
                    points.push({
                        "x": centre_x,
                        "y": centre_y
                    });
            }
        }
    }

    if (points.length == 0) {
        return null;
    }
    else {
        let voronoi = new Voronoi();
        return voronoi.compute(points, bounds);
    }
}

function update_draw_order(button_id) {

    let pieces = button_id.split("-");
    let sel_overlay_name = pieces[0];
    let sel_direction = pieces[1];

    //console.log("overlay_name", sel_overlay_name);
    //console.log("direction", sel_direction);

    //console.log(new_overlay_appearance["draw_order"]);

    let i = 0;
    for (let overlay_name of new_overlay_appearance["draw_order"]) {
        if (overlay_name === sel_overlay_name) {
            //delete overlay_appearance["draw_order"][i];
            new_overlay_appearance["draw_order"].splice(i, 1);
            if (sel_direction === "up") {
                new_overlay_appearance["draw_order"].splice(i+1, 0, sel_overlay_name);
            }
            else {
                new_overlay_appearance["draw_order"].splice(i-1, 0, sel_overlay_name);
            }


            break;

        }
        i++;
    }
    // let index;
    // if (sel_direction === "up") {
    //     index = i + 1;        
    // }
    // else {
    //     index = i - 1;
    // }

    // overlay_appearance["draw_order"].splice(index, 0, sel_overlay_name);

    //console.log(new_overlay_appearance["draw_order"]);

    draw_customize_overlays_table(true);


}



function create_customize_overlay_row(overlay_name) {

    let overlay_name_to_display_name = {
        "prediction": "Predictions",
        "annotation": "Annotations",
        "training_region": "Fine-Tuning Regions",
        "test_region": "Test Regions"
    };
    let disp_name = overlay_name_to_display_name[overlay_name];
    let up_button_id = overlay_name + "-up";
    let down_button_id = overlay_name + "-down";
    let color_id = overlay_name + "-color";
    let checkbox_id = overlay_name + "-fillRect-checkbox";
    let overlay_color = new_overlay_appearance['colors'][overlay_name];


    let row = `<tr>` +//border-bottom: 1px solid #4c6645; height: 50px">` +
        // `<td>` +
    
        //     `<table>` +
        //         `<tr>` +
                //`<div style="border: 1px solid white">` +



                    `<td style="padding: 0px">` +
                        `<div style="height: 60px;">` +
                            `<table style="margin-top: 16px">` +
                                `<tr>` +
                                    `<td>` +
                                        `<button id="${up_button_id}" onclick="update_draw_order('${up_button_id}')" class="std-button std-button-hover" style="padding: 0px; margin: 0px; height: 20px; font-size: 14px; width: 40px">` +
                                            `<i class="fa-solid fa-caret-up"></i>` +
                                        `</button>` +
                                    `</td>` +
                                `</tr>` +
                                `<tr>` +
                                    `<td>` +
                                        `<button id="${down_button_id}" onclick="update_draw_order('${down_button_id}')" class="std-button std-button-hover" style="padding: 0px; margin: 0px; height: 20px; font-size: 14px; width: 40px">` +
                                            `<i class="fa-solid fa-caret-down"></i>` +
                                        `</button>` +
                                    `</td>` +
                                `</tr>` +
                            `</table>` +
                        `</div>` +
                    `</td>` +

                    `<td style="padding: 0px">` +
                        `<div style="height: 60px; width: 15px; border: 1px solid white; border-right: none; border-radius: 10px 0px 0px 10px"></div>` +
                    `</td>` +
                    // `<td>` +
                    //     `<div style="width: 15px;"></div>` +
                    // `</td>` +
                    `<td style="padding: 0px">` +
                        `<div style="height: 60px; width: 15px; border: 1px solid white; border-left: none; border-right: none"></div>` +
                    `</td>` +
                    `<td style="padding: 0px">` +
                        `<div style="height: 60px; width: 150px; border: 1px solid white; border-left: none; border-right: none">` +
                            `<div style="margin-top: 20px">${disp_name}</div>` +
                        `</div>` +
                    `</td>` +
                    `<td style="padding: 0px">` +
                        `<div style="height: 60px; width: 35px; border: 1px solid white; border-left: none; border-right: none"></div>` +
                    `</td>` +
                    `<td style="padding: 0px">` +
                        `<div style="width: 120px; text-align: left; height: 60px; border: 1px solid white; border-left: none; border-right: none">` +
                            `<input style="width: 50px; margin: 0px; margin-top: 18px" type="color" id="${color_id}" name="${color_id}" value="${overlay_color}">` +
                        `</div>` +
                    `</td>` +

                    `<td style="padding: 0px">` +
                        `<div style="height: 60px; border: 1px solid white; border-left: none; border-right: none">` +
                            `<table>` +
                                `<tr>` +
                                    `<td>` +
                                        `<div class="header2" style="padding: 0px; margin: 0px; font-size: 14px; width: 70px">Fill Rects?</div>` +
                                    `</td>` +
                                `</tr>` +
                                `<tr>` +
                                    `<td>` +
                                        `<div style="width: 70px;">` +
                                            `<label for="${checkbox_id}" class="container" style="display: inline; margin-left: 20px">` +
                                                `<input type="checkbox" id="${checkbox_id}" name="${checkbox_id}">` +
                                                `<span class="checkmark"></span>` +
                                            `</label>` +
                                        `</div>` +
                                    `</td>` +
                                `</tr>` +
                            `</table>` +
                        `</div>` +
                    `</td>` +
                

                    // `<td style="text-align: right">` +
                    //     `<div style="color: #ddccbb; font-weight: 400; width: 90px">Owner</div>` +
                    // `</td>` + 
                    // `<td style="text-align: left; padding-left: 15px; width: 100%;">` +
                    //     `<div>${username}</div>` +
                    // `</td>` +



                    // `<td style="width: 100%; padding: 0px">` +
                    //     // `<div></div>` +
                    // `</td>` +

                    `<td style="padding: 0px">` +
                        `<div style="height: 60px; width: 35px; border: 1px solid white; border-left: none; border-radius: 0px 10px 10px 0px"></div>` +
                    `</td>` +

                //`</div>` +
        //         `</tr>` +
        //     `</table>` +
        // `</td>` +
    `</tr>`;


    return row;



}

function draw_customize_overlays_table(redraw=true) {

    let checked = {};
    let colors = {};
    if (redraw) {
        for (let overlay_name of new_overlay_appearance["draw_order"]) {
            checked[overlay_name] = $("#" + overlay_name + "-fillRect-checkbox").is(":checked");
            colors[overlay_name] = $("#" + overlay_name + "-color").val();
        }
    }
    else {
        for (let overlay_name of new_overlay_appearance["draw_order"]) {
            checked[overlay_name] = new_overlay_appearance["style"][overlay_name] === "fillRect";
            colors[overlay_name] = new_overlay_appearance["colors"][overlay_name];
        }
    }
    //console.log("checked", checked);

    //console.log("redraw_customize");
    $("#customize_overlays_table").empty();

    for (let overlay_name of new_overlay_appearance["draw_order"].slice().reverse()) {

        let row = create_customize_overlay_row(overlay_name);
        $("#customize_overlays_table").append(row);

        //if (overlay_appearance["style"][overlay_name] === "fillRect") {
        //console.log("setting", overlay_name)
        $("#" + overlay_name + "-fillRect-checkbox").prop("checked", checked[overlay_name]);
        $("#" + overlay_name + "-color").val(colors[overlay_name]);
        //}
    }
    //console.log("disabling", overlay_appearance["draw_order"][0] + "_down");



    disable_std_buttons([new_overlay_appearance["draw_order"][0] + "-down"]);
    disable_std_buttons([new_overlay_appearance["draw_order"][new_overlay_appearance["draw_order"].length-1] + "-up"]);


}


function show_customize_overlays_modal() {

    new_overlay_appearance = overlay_appearance;
    let content = 

    `<table>` +
        `<tr>` +
            `<td style="width: 100%"></td>` +
            `<td>` +
                //`<div style="padding: 10px; border: 1px solid white">` +
                    `<button class="std-button std-button-hover" style="font-size: 14px; padding: 2px; width: 125px" onclick="reset_overlay_appearance_to_default()">Reset Settings To System Defaults</button>` +
                //`</div>` +
            `</td>` +
        `</tr>` +
    `</table>`+
    `<div style="height: 10px"></div>` +
    `<hr class="panel_line" style="width: 90%; margin: auto"></hr>` +
    `<div style="height: 10px"></div>` +

    `<table>` +
        `<tr>` +
            `<td>` +
                `<div class="header2" style="transform: rotate(-90deg); width: 100px">` +
                    `Draw Order` +
                `</div>` +
                // `<table style="width: 100px">` +
                //     `<tr>` +
                //         `<td>` +
                //             `<div class="header2" style="height: 15px; font-size: 14px; text-align: center">Top Layer</div>` +
                //         `</td>` +
                //     `</tr>` +
                //     `<tr>` +
                //         `<td>` +
                //             `<div style="height: 150px"></div>` +
                //         `</td>` +
                //     `</tr>` +
                //     `<tr>` +
                //         `<td>` +
                //             `<div class="header2" style="height: 15px; font-size: 14px; text-align: center">Bottom Layer</div>` +
                //         `</td>` +
                //     `</tr>` +
                // `</table>` +

            `</td>` +

            `<td>` +
                `<div style="width: 550px;">` +
                    `<table id="customize_overlays_table" style="border-collapse: separate; border-spacing: 0px 0px">`;

    // for (let overlay_name of overlay_appearance["draw_order"].slice().reverse()) {

    //     let row = create_customize_overlay_row(overlay_name);
    //     content = content + row;
    // }

    content = content + 
                    `</table>` +
                `</div>` +
            `</td>` +

        `</tr>` +
    `</table>` +
    `<div style="height: 10px"></div>` +
    `<hr class="panel_line" style="width: 90%; margin: auto"></hr>` +
    `<div style="height: 10px"></div>` +

    `<table>` +
        `<tr>` +
            `<td>` +
                `<div class="header2" style="width: 300px; text-align: right; font-size: 14px">Save Current Settings As My Defaults</div>` +
            `</td>` +
            `<td>` +
                `<div style="width: 100px; text-align: left; margin-top: -5px">` +
                    `<label for="make_colors_default" class="container" style="display: inline; margin-left: 12px">` +
                        `<input type="checkbox" id="make_colors_default" name="make_colors_default">` +
                        `<span class="checkmark"></span>` +
                    `</label>` +
                `</div>` +
            `</td>` +
        `</tr>` +
    `</table>` +

    `<table>` +
        `<tr>` +
            `<td>` +
                `<button class="std-button std-button-hover" onclick="apply_overlay_appearance_change()" style="width: 120px; margin-top: 15px">Apply</button>` +
            `</td>` +
        `</tr>` +
    `</table>`;




    
    show_modal_message(`Customize Overlay Appearance`, content);
    draw_customize_overlays_table(false);
}

// function show_color_modal() {

//     show_modal_message(
//         `Set Overlay Colours`,
//         `<table>` +
//             `<tr>` +
//                 `<td>` +
//                     `<table style="border: 1px solid white; border-radius: 10px; margin: 10px; padding: 10px">` +
//                         `<tr>` +
//                             `<td>` +
//                                 `<div style="width: 160px; text-align: right; margin-right: 10px" class="header2">Annotation</div>` +
//                             `</td>` +
//                             `<td>` +
//                                 `<div style="width: 120px; text-align: left">` +
//                                     `<input style="width: 50px; margin: 0px" type="color" id="annotation_color" name="annotation_color" value="${overlay_appearance['colors']['annotation']}">` +
//                                 `</div>` +
//                             `</td>` +
//                         `</tr>` +
//                         `<tr>` +
//                             `<td>` +
//                                 `<div style="width: 160px; text-align: right; margin-right: 10px" class="header2">Prediction</div>` +
//                             `</td>` +
//                             `<td>` +
//                                 `<div style="width: 120px; text-align: left">` +
//                                     `<input style="width: 50px; margin: 0px" type="color" id="prediction_color" name="prediction_color" value="${overlay_appearance['colors']['prediction']}">` +
//                                 `</div>` +
//                             `</td>` +
//                         `</tr>` +
//                         `<tr>` +
//                             `<td>` +
//                                 `<div style="width: 160px; text-align: right; margin-right: 10px" class="header2">Fine-Tuning Region</div>` +
//                             `</td>` +
//                             `<td>` +
//                                 `<div style="width: 120px; text-align: left">` +
//                                     `<input style="width: 50px; margin: 0px" type="color" id="training_region_color" name="training_region_color" value="${overlay_appearance['colors']['training_region']}">` +
//                                 `</div>` +
//                             `</td>` +
//                         `</tr>` +
//                         `<tr>` +
//                             `<td>` +
//                                 `<div style="width: 160px; text-align: right; margin-right: 10px" class="header2">Test Region</div>` +
//                             `</td>` +
//                             `<td>` +
//                                 `<div style="width: 120px; text-align: left">` +
//                                     `<input style="width: 50px; margin: 0px" type="color" id="test_region_color" name="test_region_color" value="${overlay_appearance['colors']['test_region']}">` +
//                                 `</div>` +
//                             `</td>` +
//                         `</tr>` +
//                     `</table>` +
//                 `</td>` +
//                 `<td>` +
//                     `<div style="width: 15px"></div>`  +
//                 `</td>` +
//                 `<td>` +
//                     `<button class="std-button std-button-hover" style="width: 130px; font-size: 14px; padding: 5px 10px;" onclick="reset_colors_to_defaults()">Set Colours To System Defaults</button>` +
//                 `</td>` +
//             `</tr>` +
//         `</table>` +

//         `<table>` +
//             `<tr>` +
//                 `<td>` +
//                     `<div class="table_head" style="width: 300px; text-align: right">Save Current Colours As My Defaults</div>` +
//                 `</td>` +
//                 `<td>` +
//                     `<div style="width: 100px; text-align: left; margin-top: -5px">` +
//                         `<label for="make_colors_default" class="container" style="display: inline; margin-left: 12px">` +
//                             `<input type="checkbox" id="make_colors_default" name="make_colors_default">` +
//                             `<span class="checkmark"></span>` +
//                         `</label>` +
//                     `</div>` +
//                 `</td>` +
//             `</tr>` +
//         `</table>` +

//         `<table>` +
//             `<tr>` +
//                 `<td>` +
//                     `<button class="std-button std-button-hover" onclick="apply_overlay_appearance_change()" style="width: 120px; margin-top: 15px">Apply</button>` +
//                 `</td>` +
//             `</tr>` +
//         `</table>`
//         // tr
//         // td 
//         //     div(class="table_head" style="width: 200px; text-align: right") Make Model Public
//         // td
//         //     div(style="width: 250px; text-align: left")
//         //         label(for="model_public" class="container" style="display: inline; margin-botton: 20px; margin-left: 12px")
//         //             input(type="checkbox" id="model_public" name="model_public" checked)
//         //             span(class="checkmark")

//     ); 
// }

function apply_front_end_appearance_change() {

    // for (let overlay_name of ["annotation", "prediction", "training_region", "test_region"]) {
    //     console.log("getting", overlay_name);
    //     overlay_appearance["colors"][overlay_name] = $("#" + overlay_name + "_color").val();
    // }

    overlay_appearance = new_overlay_appearance;

    set_overlay_color_css_rules();
    if (viewer) {
        viewer.raiseEvent('update-viewport');
    }

    create_overlays_table();
    //set_count_chart_data();
    //set_score_chart_data();

    update_region_name();
    create_navigation_table();

    draw_count_chart();
    draw_score_chart();
    draw_map_chart();
    close_modal();
}

function apply_overlay_appearance_change() {
    let make_default = $("#make_colors_default").is(":checked");
    //console.log("make_default?", make_default);

    //let new_overlay_appearance = default_overlay_appearance;
    for (let overlay_name of new_overlay_appearance["draw_order"]) {
        //console.log("getting", overlay_name);
        new_overlay_appearance["colors"][overlay_name] = $("#" + overlay_name + "-color").val();
        if ($("#" + overlay_name + "-fillRect-checkbox").is(":checked")) {
            new_overlay_appearance["style"][overlay_name] = "fillRect";
        }
        else {
            new_overlay_appearance["style"][overlay_name] = "strokeRect";
        }
    }

    if (make_default) {
        
        $.post(get_CC_PATH() + "/overlay_appearance_change/" + username,
        {
            overlay_appearance: JSON.stringify(new_overlay_appearance)
        },
        
        function(response, status) {
            if (response.error) {
                show_modal_message(`Error`, response.message);
            }
            else {
                apply_front_end_appearance_change();
            }
        });
    }
    else {
        apply_front_end_appearance_change();
    }


}

function reset_overlay_appearance_to_default() {
    new_overlay_appearance = default_overlay_appearance;
    // for (let overlay_name of ["annotation", "prediction", "training_region", "test_region"]) {
    //      console.log("setting", overlay_name);
    //      $("#" + overlay_name + "-fillRect-checkboxcolor").prop("checked", false);
    //      $("#" + overlay_name + "-color").val(default_overlay_appearance["colors"][overlay_name]);
    // }
    draw_customize_overlays_table(false);
}


function add_css_rule(rule) {
    let sheet = $("#main-stylesheet").get(0).sheet;
    let css_rules_num = sheet.cssRules.length;

    sheet.insertRule(rule, css_rules_num);
}

function set_overlay_color_css_rules() {

    // let overlay_colors = {
    //     "annotation": "#0080ff", // "#0080C0",
    //     "prediction": "#FF4040",
    //     "training_region": "#ff51eb", //"#f705bb",
    //     "test_region": "#ffae00" //"#ffa200"
    // };

    // let sheet = $("#main-stylesheet").get(0).sheet;
    // let css_rules_num = sheet.cssRules.length;
    let fill_rule;
    if (overlay_appearance["style"]["annotation"] === "fillRect") {
        fill_rule = "fill: " + overlay_appearance["colors"]["annotation"] + "55; ";
    }
    else {
        fill_rule = "fill: none; ";
    }
    add_css_rule(".a9s-annotationlayer .a9s-annotation.editable:hover .a9s-inner { " + 
    fill_rule + " }");

    add_css_rule(".a9s-annotationlayer .a9s-annotation .a9s-inner { " +
        "stroke: " + overlay_appearance["colors"]["annotation"] + " !important; " +
        fill_rule + 
    "}");

    if (overlay_appearance["style"]["training_region"] === "fillRect") {
        fill_rule = "fill: " + overlay_appearance["colors"]["training_region"] + "55; ";
    }
    else {
        fill_rule = "fill: none; ";
    }
    add_css_rule(".a9s-annotationlayer .a9s-annotation.editable .training_region:hover .a9s-inner { " + 
    fill_rule + " }");

    add_css_rule(".a9s-annotationlayer .a9s-annotation .training_region .a9s-inner { " + 
        "stroke: " + overlay_appearance["colors"]["training_region"] + " !important; " +
        fill_rule + 
    "}");
    
    add_css_rule(".a9s-annotationlayer .a9s-annotation.training_region .a9s-inner { " + 
        "stroke: " + overlay_appearance["colors"]["training_region"] + " !important; " +
        fill_rule + 
    "}");

    if (overlay_appearance["style"]["test_region"] === "fillRect") {
        fill_rule = "fill: " + overlay_appearance["colors"]["test_region"] + "55; ";

    }
    else {
        fill_rule = "fill: none; ";
    }
    add_css_rule(".a9s-annotationlayer .a9s-annotation.editable .test_region:hover .a9s-inner { " + 
        fill_rule + " }");

    add_css_rule(".a9s-annotationlayer .a9s-annotation .test_region .a9s-inner { " + 
        "stroke: " + overlay_appearance["colors"]["test_region"] + " !important; " +
        fill_rule + 
    "}");
                    
    add_css_rule(".a9s-annotationlayer .a9s-annotation.test_region .a9s-inner { " + 
        "stroke: " + overlay_appearance["colors"]["test_region"] + " !important; " +
        fill_rule + 
    "}");








    add_css_rule(".custom_radio_container input:checked ~ .custom_radio#annotation_radio { background-color: " +
        overlay_appearance["colors"]["annotation"] +
                    "}");

    add_css_rule(".custom_radio_container input:checked ~ .custom_radio#training_region_radio { background-color: " +
        overlay_appearance["colors"]["training_region"] +
                    "}");

          
    add_css_rule(".custom_radio_container input:checked ~ .custom_radio#test_region_radio { background-color: " +
        overlay_appearance["colors"]["test_region"] +
                        "}");




}


function set_heights() {
    $("#image_view_container").show();
    let max_height = 0;
    for (let image_name of Object.keys(annotations)) {
        $("#image_name").html(image_name);
        let table_height = $("#image_name_table").height();
        if (table_height > max_height) {
            max_height = table_height;
        };
    }
    $("#image_name_table").height(max_height);
    console.log("max_height", max_height);
    //$("#navigation_table_container").height(396 - max_height);
    //$("#navigation_table_container").height($("#seadragon_viewer").height() - max_height - 355);
}

