const MAX_EDGES_DISPLAYED = 30000;
const MAX_BOXES_DISPLAYED = 30000;

const MAX_NUM_TILES = 50000;


let annotations_format_sample_text = 
'{\n' + 
'    "image_1": {\n' +
'        "annotations": [\n' +
'            [2, 4, 10, 9],\n' +
'            ...\n' +
'        ],\n' +
'        "regions_of_interest": [\n' +
'            [\n' +
'               [6, 11],\n' +
'               [13, 21],\n' +
'               ...\n' +
'            ],\n' +
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


Date.prototype.isValid = function () {
    // An invalid date object returns NaN for getTime() and NaN is the only
    // object not strictly equal to itself.
    return this.getTime() === this.getTime();
};

function has_duplicates(array) {
    return (new Set(array)).size !== array.length;
}


let default_overlay_appearance = {
    "draw_order": ["region_of_interest", "training_region", "test_region", "annotation", "prediction"],
    "style": {
        "annotation": "strokeRect",
        "prediction": "strokeRect",
        "region_of_interest": "strokeRect",
        "training_region": "strokeRect",
        "test_region": "strokeRect"
    },
    "colors": {
        "annotation": "#0080ff",
        "prediction": "#ff4040",
        "region_of_interest": "#17c44b",
        "training_region": "#ff51eb",
        "test_region": "#ffae00"
    }
};

let new_overlay_appearance;


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function arraysEqual(a, b) {
    // if (a === b) return true;
    // if (a == null || b == null) return false;
    // if (a.length !== b.length) return false;
  
    // // If you don't care about the order of the elements inside
    // // the array, you should sort both arrays here.
    // // Please note that calling sort on an array will modify that array.
    // // you might want to clone your array first.
  
    // for (var i = 0; i < a.length; ++i) {
    //   if (a[i] !== b[i]) return false;
    // }
    // return true;

    return JSON.stringify(a) === JSON.stringify(b);
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


function get_gsd() {
  
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

    return Math.min(gsd_h, gsd_w);

}

function calculate_tile_size_slider_range() {

    let image_name = Object.keys(annotations)[0];
    let image_height_px = metadata["images"][image_name]["height_px"];
    let image_width_px = metadata["images"][image_name]["width_px"];

    let image_height_m = image_height_px * gsd;
    let image_width_m = image_width_px * gsd;

    let max_error = 0.25;
    let i = 0;
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

    return [min_tile_size, max_tile_size];


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

function point_is_inside_box_region(pt, region) {
    return ((pt[0] > region[0]) && (pt[0] < region[2])) && ((pt[1] > region[1]) && (pt[1] < region[3]));

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
}


function update_region_name() {
    let navigation_type = $("#navigation_dropdown").val();
    $("#region_name").empty();
    let region_element;
    if ((navigation_type == "regions_of_interest") || (navigation_type === "training_regions" || navigation_type === "test_regions")) {

        let disp_region_index = cur_region_index + 1;
        let region_color;
        if (navigation_type === "regions_of_interest") {
            region_color = overlay_appearance["colors"]["region_of_interest"];
            region_element = create_region_of_interest_element(region_color, disp_region_index);
        }
        else if (navigation_type === "training_regions") {
            region_color = overlay_appearance["colors"]["training_region"];
            region_element = create_region_element(region_color, disp_region_index);
        }
        else {
            region_color = overlay_appearance["colors"]["test_region"];
            region_element = create_region_element(region_color, disp_region_index);
        }
  
    }
    else {
        let region_of_interest_count = annotations[cur_img_name]["regions_of_interest"].length;
        let training_region_count = annotations[cur_img_name]["training_regions"].length;
        let test_region_count = annotations[cur_img_name]["test_regions"].length;
        region_element = create_regions_summary_element(cur_img_name, region_of_interest_count, training_region_count, test_region_count, bookmark_button=true);
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

function create_regions_summary_element(image_name, region_of_interest_count, training_region_count, test_region_count, bookmark_button=false) {

    if (bookmark_button) {
        if ("bookmarked" in annotations[image_name] && annotations[image_name]["bookmarked"]) {
            bookmark_element = 
            `<div class="table_button table_button_hover" style="padding: 0px; margin: 2px; width: 96px; height: 25px; border: 1px solid white; background-color: #4c6645; cursor: pointer; border-radius: 20px 0px 0px 20px;" ` +
                `onclick="bookmark()">` +
                `<i style="color: white; font-size: 12px; margin-top: 5px" class="fa-regular fa-bookmark"></i><span style="font-size: 13px; padding-left: 7px">Bookmark</span>` +
            `</div>`;
        }
        else {
            bookmark_element = 
            `<div class="table_button table_button_hover" style="padding: 0px; margin: 2px; width: 96px; height: 25px; border: 1px solid white; background-color: none; cursor: pointer; border-radius: 20px 0px 0px 20px;" ` +
                `onclick="bookmark()">` +
                `<i style="color: white; font-size: 12px; margin-top: 5px" class="fa-regular fa-bookmark"></i><span style="font-size: 13px; padding-left: 7px">Bookmark</span>` +
            `</div>`;
        }
    }

    let disp_region_of_interest_count = "";
    if (region_of_interest_count > 0) {
        disp_region_of_interest_count = region_of_interest_count;
    }
    let disp_training_region_count = "";
    if (training_region_count > 0) {
        disp_training_region_count = training_region_count;
    }
    let disp_test_region_count = "";
    if (test_region_count > 0) {
        disp_test_region_count = test_region_count;
    }

    let region_element = 
        `<div style="width: 106px; margin: 0px 2px">` +
            `<table>` +

                `<tr>` +
                    `<td>` +
                        `<div style="width: 27px; height: 27px; border: 2px solid ${overlay_appearance["colors"]["region_of_interest"]}; color: white; border-radius: 20px">` +
                            `<div style="font-size: 12px; padding-top: 5px;">${disp_region_of_interest_count}</div>` +
                        `</div>` +
                    `</td>` +
                    `<td>` +
                        `<div style="width: 27px; height: 27px; border: 2px solid ${overlay_appearance["colors"]["training_region"]}; color: white; border-radius: 20px">` +
                            `<div style="font-size: 12px; padding-top: 5px;">${disp_training_region_count}</div>` +
                        `</div>` +
                    `</td>` +
                    `<td>` +
                        `<div style="width: 27px; height: 27px; border: 2px solid ${overlay_appearance["colors"]["test_region"]}; color: white; border-radius: 20px">` +
                            `<div style="font-size: 12px; padding-top: 5px;">${disp_test_region_count}</div>` +
                        `</div>` +
                    `</td>` +
                 `</tr>`  +
            `</table>`;

    if (show_bookmarks && bookmark_button) {
        region_element = region_element +  
            `<table>` +
                `<tr>` +
                    `<td>` +
                        bookmark_element +
                    `</td>` +
                `</tr>` +
            `</table>`;

    }

    region_element = region_element +
        `</div>`;
    
    return region_element;
}

function create_region_element(region_color, region_index) {

    let region_element = 
    `<div style="width: 106px">` +
        `<table>` +
            `<tr>` +
                `<td>` +
                    `<div style="width: 75px; height: 27px; color: white; border: 2px solid ${region_color}; padding-top: 3px" class="object_entry">Region ${region_index}</div>` +
                `</td>` +
            `</tr>` +
        `</table>` +
    `</div>`;
    return region_element;
}

function create_region_of_interest_element(region_color, region_index) {

    let btn_func;
    if (window.location.pathname.split("/")[2] === "workspace") {
        btn_func = "edit_tags()";
    }
    else {
        btn_func = "view_tags()";
    }
    let region_element = 
    `<div style="width: 106px">` +
        `<table>` +
            `<tr>` +
                `<td>` +
                    `<div style="width: 75px; height: 27px; color: white; border: 2px solid ${region_color}; padding-top: 3px" class="object_entry">Region ${region_index}</div>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td>` +
                    `<button onclick="` + btn_func + `" style="width: 75px; font-size: 12px; padding: 4px; border-radius: 20px" class="table_button table_button_hover">` +
                        `<i class="fa-solid fa-tags" style="margin-right: 5px"></i>Tags` +
                    `</button>` +
                `</td>` +
            `</tr>` +
        `</table>` +
    `</div>`;
    return region_element;

}


function autocomplete(inp, arr) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
          /*check if the item starts with the same letters as the text field value:*/
          if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            /*create a DIV element for each matching element:*/
            b = document.createElement("DIV");
            /*make the matching letters bold:*/
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            /*insert a input field that will hold the current array item's value:*/
            b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
            /*execute a function when someone clicks on the item value (DIV element):*/
            b.addEventListener("click", function(e) {
                /*insert the value for the autocomplete text field:*/
                inp.value = this.getElementsByTagName("input")[0].value;
                /*close the list of autocompleted values,
                (or any other open lists of autocompleted values:*/
                closeAllLists();
            });
            a.appendChild(b);
          }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          /*If the arrow DOWN key is pressed,
          increase the currentFocus variable:*/
          currentFocus++;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 38) { //up
          /*If the arrow UP key is pressed,
          decrease the currentFocus variable:*/
          currentFocus--;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 13) {
          /*If the ENTER key is pressed, prevent the form from being submitted,*/
          e.preventDefault();
          if (currentFocus > -1) {
            /*and simulate a click on the "active" item:*/
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
      /*a function to classify an item as "active":*/
      if (!x) return false;
      /*start by removing the "active" class on all items:*/
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      /*add class "autocomplete-active":*/
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      /*a function to remove the "active" class from all autocomplete items:*/
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    function closeAllLists(elmnt) {
      /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
  }


let tag_input_format = /[`'"]/;

function view_tags() {
    show_modal_message(`Tags`, 
    `<div>` +
        `<h class="header2" style="margin-left: 20px; width: 300px">Tags For This Region</h>` +
        `<div class="scrollable_area" style="height: 250px; width: 650px; overflow-y: scroll; margin: 0 auto; border: 1px solid white; border-radius: 10px">` +
            `<div id="current_tags_table"></div>` +
        `</div>` +
    `</div>`, modal_width=700
    );
    add_tags_to_tag_table(removable=false);
}

function edit_tags() {
    show_modal_message(`Add and Remove Tags`, 
    
    `<div>` +
        `<h class="header2" style="margin-left: 20px; width: 300px">Add A Tag To This Region</h>` +
        `<div style="width: 650px; margin: 0 auto">` +
            `<div style="border: 1px solid white; border-radius: 10px 10px; padding-top: 15px">` +
                `<table>` +
                    `<tr>` +
                        `<td>` +
                            `<div class="table_head" style="width: 100px; margin-right: 10px">Tag Name</div>` +
                        `</td>` +
                        `<td>` +
                            `<div style="width: 200px" class="autocomplete">` +
                                `<input id="tag_name" class="nonfixed_input" style="width: 100%" autocomplete="off">` +
                            `</div>` +
                        `</td>` +
                    `</tr>` +
                    `<tr>` +
                        `<td>` +
                            `<div style="height: 3px"></div>` +
                        `</td>` +
                    `</tr>` +            
                    `<tr>` +
                        `<td>` +
                            `<div class="table_head" style="width: 100px; margin-right: 10px">Tag Value</div>` +
                        `</td>` +
                        `<td>` +
                            `<div style="width: 200px" class="autocomplete">` +
                                `<input id="tag_value" class="nonfixed_input" style="width: 100%" autocomplete="off">` +
                            `</div>` +
                        `</td>` +
                    `</tr>` +
                `</table>` +
                `<div style="height: 15px"></div>` +
                `<button id="add_tag_button" class="std-button std-button-hover" style="border: none; border-top: 1px solid white; width: 100%; margin: 0; border-radius: 0px 0px 10px 10px; font-size: 14px">Add Tag</button>` + 
            `</div>` +
            
        `</div>` +
        `<div style="height: 50px"></div>` +
        `<hr class="panel_line">` +
        `<div style="height: 20px"></div>` +

        `<h class="header2" style="margin-left: 20px; width: 300px">Current Tags For This Region</h>` +
        `<div class="scrollable_area" style="height: 250px; width: 650px; overflow-y: scroll; margin: 0 auto; border: 1px solid white; border-radius: 10px">` +
            `<div id="current_tags_table"></div>` +
        `</div>` +
    `</div>`, modal_width=700
    );

    add_tags_to_tag_table(removable=true);
    disable_std_buttons(["add_tag_button"]);

    for (let input_id of ["tag_name", "tag_value"]) {
        $("#" + input_id).on("input", function(e) {
            if (update_tag_input()) {
                enable_std_buttons(["add_tag_button"]);
            }
            else {
                disable_std_buttons(["add_tag_button"]);
            }
        });
    }

    $("#add_tag_button").click(function() {
        let tag_name = $("#tag_name").val();
        let tag_value = $("#tag_value").val();
        let nav_item = cur_img_name + "/" + cur_region_index;
        if (!(tag_name in tags)) {
            tags[tag_name] = {};
        }
        tags[tag_name][nav_item] = tag_value;
        add_tags_to_tag_table(removable=true);

        $("#tag_name").val("");
        $("#tag_value").val("");
        disable_std_buttons(["add_tag_button"]);
        autocomplete(document.getElementById("tag_name"), Object.keys(tags));
        $("#save_icon").css("color", "#ed452b");
    });

    autocomplete(document.getElementById("tag_name"), Object.keys(tags));

}


function update_tag_input() {
    let inputs_to_check = ["tag_name", "tag_value"];
    for (let input of inputs_to_check) {
        let input_val = $("#" + input).val();
        let input_length = input_val.length;
        if ((input_length < 1) || (input_length > 20)) {
            return false;
        }
        if (tag_input_format.test(input_val)) {
            return false;
        }
    }
    return true;
}


function add_tags_to_tag_table(removable) {

    let nav_item = cur_img_name + "/" + cur_region_index;

    $("#current_tags_table").empty();

    for (let tag of Object.keys(tags)) {
        if (nav_item in tags[tag]) {
            let x_btn_td;
            if (removable) {
                x_btn_td =  `<td style="border: 1px solid white; border-radius: 0px 25px 25px 0px; padding: 0px;">` +
                                `<button class="x-button x-button-hover" onclick="remove_tag('${tag}')" style="border-radius: 0px 25px 25px 0px; border: none; width: 35px; font-size: 18px; height: 50px;"><i class="fa-regular fa-circle-xmark"></i></button>` +
                            `</td>`;
            }
            else {
                x_btn_td =  `<td style="border: 1px solid white; border-radius: 0px 25px 25px 0px; padding: 0px; border-left: none">` +
                                `<div style="width: 35px; height: 50px;"></div>` +
                            `</td>`;
            }
            $("#current_tags_table").append(
                `<div style="height: 50px; margin: 10px;">` +
                    `<table>` +
                        `<tr>` +
                            `<td style="border: 1px solid white; border-radius: 25px 0px 0px 25px; border-right: none">` +
                                `<table style="font-size: 14px">` +
                                    `<tr>` +
                                        `<td style="text-align: right">` +
                                            `<div style="color: #ddccbb; font-weight: 400; width: 280px">${tag}</div>` +
                                        `</td>` + 
                                        `<td style="text-align: left; padding-left: 15px; width: 280px;">` +
                                            `<div>${tags[tag][nav_item]}</div>` +
                                        `</td>` +
                                    `</tr>` +
                                `</table>` +
                            `</td>` +
                            x_btn_td +
                        `</tr>` +
                    `</table>` +
                `</div>`
            );
        }
    }
}

function remove_tag(tag_name) {
    let nav_item = cur_img_name + "/" + cur_region_index;
    delete tags[tag_name][nav_item];
    if (Object.entries(tags[tag_name]).length == 0) {
        delete tags[tag_name];
    }
    add_tags_to_tag_table(removable=true);
    autocomplete(document.getElementById("tag_name"), Object.keys(tags));
    $("#save_icon").css("color", "#ed452b");
}


function create_navigation_table() {

    let navigation_type = $("#navigation_dropdown").val();

    $("#navigation_table").empty();
    cur_nav_list = [];

    if (navigation_type === "images") {
        let image_names = Object.keys(annotations);
        image_names = natsort(image_names);

        for (let image_name of image_names) {
            let nav_item = image_name + "/" + -1;
            let row_id = nav_item + "_row";
            let region_of_interest_count = annotations[image_name]["regions_of_interest"].length;
            let training_region_count = annotations[image_name]["training_regions"].length;
            let test_region_count = annotations[image_name]["test_regions"].length;

            let regions_summary_element = create_regions_summary_element(image_name, region_of_interest_count, training_region_count, test_region_count, bookmark_button=false);
            let image_entry_style = "width: 245px";
            if (show_bookmarks && ("bookmarked" in annotations[image_name] && annotations[image_name]["bookmarked"])) {
                image_entry_style = "width: 245px; border-radius: 20px 1px 1px 20px; border: 1px solid #99cc8b; background-color: #99cc8b11";
            }
            
            let item = 
            `<tr id="${row_id}">` +
                `<td>` +
                    `<div class="table_button table_button_hover" style="${image_entry_style}" ` +
                        `onclick="change_image('${nav_item}')">` +
                        `<table>` +
                            `<tr>` +
                                `<td>` +
                                    `<div style="width: 120px; text-align: left; margin-left: 10px">${image_name}</div>` +
                                `</td>` +
                                `<td>` +
                                    regions_summary_element +
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
    else if ((navigation_type === "regions_of_interest") || (navigation_type === "training_regions" || navigation_type === "test_regions")) {

        for (let image_name of natsort(Object.keys(annotations))) {

            for (let i = 0; i < annotations[image_name][navigation_type].length; i++) {
                let nav_item = image_name + "/" + i;
                let row_id = nav_item + "_row";
                let disp_region_index = i + 1;
                let region_color;
                if (navigation_type === "regions_of_interest") {
                    region_color = overlay_appearance["colors"]["region_of_interest"];
                }
                else if (navigation_type === "training_regions") {
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
                                        region_element + 
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
    let num_regions_of_interest = get_num_regions("regions_of_interest");
    let num_training_regions = get_num_regions("training_regions");
    let num_test_regions = get_num_regions("test_regions");
    $("#navigation_dropdown").empty();
    $("#navigation_dropdown").append($("<option></option>").val("images").text("Images"));
    if (num_regions_of_interest > 0) {
        $("#navigation_dropdown").append($("<option></option>").val("regions_of_interest").text("Regions of Interest"));
    }
    if (num_training_regions > 0) {
        $("#navigation_dropdown").append($("<option></option>").val("training_regions").text("Fine-Tuning Regions"));
    }
    if (num_test_regions > 0) {
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
}

function image_is_fully_annotated(annotations, image_name, image_w, image_h) {
    return (image_is_fully_annotated_for_training(annotations, image_name, image_w, image_h) || image_is_fully_annotated_for_testing(annotations, image_name, image_w, image_h));
}


function set_cur_bounds() {
    let navigation_type = $("#navigation_dropdown").val();

    if ((navigation_type === "regions_of_interest") || (navigation_type === "training_regions" || navigation_type === "test_regions")) {

        let bounds = annotations[cur_img_name][navigation_type][cur_region_index];

        if (navigation_type === "regions_of_interest") {
            bounds = get_bounding_box_for_polygon(bounds);
        }

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

    let fully_annotated = image_is_fully_annotated(annotations, cur_img_name, 
                            metadata["images"][cur_img_name]["width_px"],
                            metadata["images"][cur_img_name]["height_px"])
    if ((navigation_type !== "images") || (fully_annotated)) {

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
                // "AP (IoU=.50:.05:.95)",
                // "AP (IoU=.50)",
                // "AP (IoU=.75)"
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

    let slider_val = Number.parseFloat($("#confidence_slider").val());

    bounds_min_y = 0;
    bounds_min_x = 0;
    bounds_max_y = metadata["images"][cur_img_name]["height_px"];
    bounds_max_x = metadata["images"][cur_img_name]["width_px"];

    let bounds = {xl: bounds_min_x, xr: bounds_max_x, yt: bounds_min_y, yb: bounds_max_y};
    let points = [];

    if (target === "prediction") {
        if (cur_img_name in predictions) {
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
    }
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

    let i = 0;
    for (let overlay_name of new_overlay_appearance["draw_order"]) {
        if (overlay_name === sel_overlay_name) {
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
    draw_customize_overlays_table(true);
}



function create_customize_overlay_row(overlay_name) {

    let overlay_name_to_display_name = {
        "prediction": "Predictions",
        "annotation": "Annotations",
        "region_of_interest": "Regions of Interest",
        "training_region": "Fine-Tuning Regions",
        "test_region": "Test Regions"
    };
    let disp_name = overlay_name_to_display_name[overlay_name];
    let up_button_id = overlay_name + "-up";
    let down_button_id = overlay_name + "-down";
    let color_id = overlay_name + "-color";
    let checkbox_id = overlay_name + "-fillRect-checkbox";
    let overlay_color = new_overlay_appearance['colors'][overlay_name];


    let row = `<tr>` +
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
                `<td style="padding: 0px">` +
                    `<div style="height: 60px; width: 35px; border: 1px solid white; border-left: none; border-radius: 0px 10px 10px 0px"></div>` +
                `</td>` +
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

    $("#customize_overlays_table").empty();

    for (let overlay_name of new_overlay_appearance["draw_order"].slice().reverse()) {

        let row = create_customize_overlay_row(overlay_name);
        $("#customize_overlays_table").append(row);

        $("#" + overlay_name + "-fillRect-checkbox").prop("checked", checked[overlay_name]);
        $("#" + overlay_name + "-color").val(colors[overlay_name]);
    }

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
                `<button class="std-button std-button-hover" style="font-size: 14px; padding: 2px; width: 125px" onclick="reset_overlay_appearance_to_default()">Reset Settings To System Defaults</button>` +
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
            `</td>` +

            `<td>` +
                `<div style="width: 550px;">` +
                    `<table id="customize_overlays_table" style="border-collapse: separate; border-spacing: 0px 0px">`;

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


function apply_front_end_appearance_change() {

    overlay_appearance = new_overlay_appearance;

    set_overlay_color_css_rules();
    if (viewer) {
        viewer.raiseEvent('update-viewport');
    }

    create_overlays_table();

    update_region_name();
    create_navigation_table();

    draw_count_chart();
    draw_score_chart();
    draw_map_chart();
    close_modal();
}

function apply_overlay_appearance_change() {
    let make_default = $("#make_colors_default").is(":checked");

    for (let overlay_name of new_overlay_appearance["draw_order"]) {
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
    draw_customize_overlays_table(false);
}


function add_css_rule(rule) {
    let sheet = $("#main-stylesheet").get(0).sheet;
    let css_rules_num = sheet.cssRules.length;

    sheet.insertRule(rule, css_rules_num);
}

function set_overlay_color_css_rules() {

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


    if (overlay_appearance["style"]["region_of_interest"] === "fillRect") {
        fill_rule = "fill: " + overlay_appearance["colors"]["region_of_interest"] + "55; ";

    }
    else {
        fill_rule = "fill: none; ";
    }
    add_css_rule(".a9s-annotationlayer .a9s-annotation.editable .region_of_interest:hover .a9s-inner { " + 
        fill_rule + " }");

    add_css_rule(".a9s-annotationlayer .a9s-annotation .region_of_interest .a9s-inner { " + 
        "stroke: " + overlay_appearance["colors"]["region_of_interest"] + " !important; " +
        fill_rule + 
    "}");
                    
    add_css_rule(".a9s-annotationlayer .a9s-annotation.region_of_interest .a9s-inner { " + 
        "stroke: " + overlay_appearance["colors"]["region_of_interest"] + " !important; " +
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

    add_css_rule(".custom_radio_container input:checked ~ .custom_radio#region_of_interest_radio { background-color: " +
        overlay_appearance["colors"]["region_of_interest"] +
                        "}");


}


function set_heights() {
    $("#image_view_container").show();
    let max_height = 62; //0;
    for (let image_name of Object.keys(annotations)) {
        $("#image_name").html(image_name);
        let table_height = $("#image_name_table").height();
        if (table_height > max_height) {
            max_height = table_height;
        };
    }
    $("#image_name_table").height(max_height);
}

