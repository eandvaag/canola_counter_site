const MAX_EDGES_DISPLAYED = 30000;
const MAX_BOXES_DISPLAYED = 30000;


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

// let overlay_colors = {
//     "annotation": "#0080ff", // "#0080C0",
//     "prediction": "#FF4040",
//     "training_region": "#ff51eb", //"#f705bb",
//     "test_region": "#ffae00" //"#ffa200"
// };

let default_overlay_colors = {
    "annotation": "#0080ff",
    "prediction": "#ff4040",
    "training_region": "#ff51eb",
    "test_region": "#ffae00"
};
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

function get_json(url) {
    let json;
    $.ajax({
        url: url,
        async: false,
        dataType: 'json',
        success: function (ret_json) {
            json = ret_json;
        }
    });
    return json;
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

function can_calculate_density(metadata, camera_specs) {

    let make = metadata["camera_info"]["make"];
    let model = metadata["camera_info"]["model"];


    if (metadata["is_ortho"] === "yes") {
        return false;
    }

    if (((metadata["missing"]["latitude"]) || metadata["missing"]["longitude"]) || (metadata["camera_height"] === "")) {
        return false;
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
        let overlay_color = overlay_colors[overlay_id];
        let voronoi_id = "voronoi_" + overlay_id;
        let disp_overlay_text = disp_text[overlay_id]
        $("#overlays_table").append(
            `<tr style="background-color: ${overlay_color}">` +
                `<td style="border-radius: 30px 0px 0px 30px; border: 1px solid white; border-right: none">` +
                    `<div style="padding: 8px 32px;">${disp_overlay_text}</div>` +
                `</td>` +
                // `<td style="border-top: 1px solid white; border-bottom: 1px solid white;">` +
                //     `<div style="width: 15px"></div>` +
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




function create_navigation_table() {

    let navigation_type = $("#navigation_dropdown").val();

    $("#navigation_table").empty();
    cur_nav_list = [];

    if (navigation_type === "images") {

        for (let image_name of natsort(Object.keys(annotations))) {
            let nav_item = image_name + "/" + -1;
            let item = 
            `<tr>` +
                `<td>`+
                    `<div class="table_button table_button_hover" style="width: 245px;" ` +
                            `onclick="change_image('${nav_item}')">${image_name}</div>` +
                `</td>` +
            `</tr>`;
            $("#navigation_table").append(item);
            cur_nav_list.push(nav_item);

        }
    }
    else if (navigation_type === "training_regions" || navigation_type === "test_regions") {

        for (let image_name of natsort(Object.keys(annotations))) {

            for (let i = 0; i < annotations[image_name][navigation_type].length; i++) {
                let nav_item = image_name + "/" + i;
                let disp_region_index = i + 1;
                let region_color;
                if (navigation_type === "training_regions") {
                    region_color = overlay_colors["training_region"];
                }
                else {
                    region_color = overlay_colors["test_region"];
                }
                let item = 
                `<tr>` +
                    `<td>` +
                        `<div class="table_button table_button_hover" style="width: 245px" ` +
                            `onclick="change_image('${nav_item}')">` +
                            `<table>` +
                                `<tr>` +
                                    `<td>` +
                                        `<div style="width: 156px;">${image_name}</div>` +
                                    `</td>` +
                                    `<td>` +
                                        `<div style="width: 75px; background-color: ${region_color}; margin: 0px 2px; color: black; border: none" class="object_entry">Region ${disp_region_index}</div>` +
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
        console.log("annotations", annotations);
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

            $('#chart_combo').append($('<option>', {
                value: "AP (IoU=.50:.05:.95)",
                text: "AP (IoU=.50:.05:.95)"
            }));
            $('#chart_combo').append($('<option>', {
                value: "AP (IoU=.50)",
                text: "AP (IoU=.50)"
            }));
            $('#chart_combo').append($('<option>', {
                value: "AP (IoU=.75)",
                text: "AP (IoU=.75)"
            }));

            $('#chart_combo').append($('<option>', {
                value: "F1 Score (IoU=.50, conf>=.50)",
                text: "F1 Score (IoU=.50, conf>=.50)"
            }));
            $('#chart_combo').append($('<option>', {
                value: "F1 Score (IoU=.75, conf>=.50)",
                text: "F1 Score (IoU=.75, conf>=.50)"
            }));
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
            if (predictions[cur_img_name]["scores"][i] < slider_val) {
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


function show_color_modal() {

    show_modal_message(
        `Set Overlay Colours`,
        `<table>` +
            `<tr>` +
                `<td>` +
                    `<table style="border: 1px solid white; border-radius: 10px; margin: 10px; padding: 10px">` +
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 160px; text-align: right; margin-right: 10px" class="header2">Annotation</div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 120px; text-align: left">` +
                                    `<input style="width: 50px; margin: 0px" type="color" id="annotation_color" name="annotation_color" value="${overlay_colors['annotation']}">` +
                                `</div>` +
                            `</td>` +
                        `</tr>` +
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 160px; text-align: right; margin-right: 10px" class="header2">Prediction</div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 120px; text-align: left">` +
                                    `<input style="width: 50px; margin: 0px" type="color" id="prediction_color" name="prediction_color" value="${overlay_colors['prediction']}">` +
                                `</div>` +
                            `</td>` +
                        `</tr>` +
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 160px; text-align: right; margin-right: 10px" class="header2">Fine-Tuning Region</div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 120px; text-align: left">` +
                                    `<input style="width: 50px; margin: 0px" type="color" id="training_region_color" name="training_region_color" value="${overlay_colors['training_region']}">` +
                                `</div>` +
                            `</td>` +
                        `</tr>` +
                        `<tr>` +
                            `<td>` +
                                `<div style="width: 160px; text-align: right; margin-right: 10px" class="header2">Test Region</div>` +
                            `</td>` +
                            `<td>` +
                                `<div style="width: 120px; text-align: left">` +
                                    `<input style="width: 50px; margin: 0px" type="color" id="test_region_color" name="test_region_color" value="${overlay_colors['test_region']}">` +
                                `</div>` +
                            `</td>` +
                        `</tr>` +
                    `</table>` +
                `</td>` +
                `<td>` +
                    `<div style="width: 15px"></div>`  +
                `</td>` +
                `<td>` +
                    `<button class="std-button std-button-hover" style="width: 130px; font-size: 14px; padding: 5px 10px;" onclick="reset_colors_to_defaults()">Set Colours To System Defaults</button>` +
                `</td>` +
            `</tr>` +
        `</table>` +

        `<table>` +
            `<tr>` +
                `<td>` +
                    `<div class="table_head" style="width: 300px; text-align: right">Save Current Colours As My Defaults</div>` +
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
                    `<button class="std-button std-button-hover" onclick="apply_color_change()" style="width: 120px; margin-top: 15px">Apply</button>` +
                `</td>` +
            `</tr>` +
        `</table>`
        // tr
        // td 
        //     div(class="table_head" style="width: 200px; text-align: right") Make Model Public
        // td
        //     div(style="width: 250px; text-align: left")
        //         label(for="model_public" class="container" style="display: inline; margin-botton: 20px; margin-left: 12px")
        //             input(type="checkbox" id="model_public" name="model_public" checked)
        //             span(class="checkmark")

    ); 
}

function front_end_apply_color_change() {

    for (let overlay_name of ["annotation", "prediction", "training_region", "test_region"]) {
        console.log("getting", overlay_name);
        overlay_colors[overlay_name] = $("#" + overlay_name + "_color").val();
    }

    set_overlay_color_css_rules();
    if (viewer) {
        viewer.raiseEvent('update-viewport');
    }

    create_overlays_table();
    //set_count_chart_data();
    //set_score_chart_data();

    draw_count_chart();
    draw_score_chart();
    close_modal();
}

function apply_color_change() {
    let make_default = $("#make_colors_default").is(":checked");
    console.log("make_default?", make_default);

    let new_overlay_colors = {}
    for (let overlay_name of ["annotation", "prediction", "training_region", "test_region"]) {
        console.log("getting", overlay_name);
        new_overlay_colors[overlay_name] = $("#" + overlay_name + "_color").val();
    }

    if (make_default) {
        
        $.post(get_CC_PATH() + "/color_change/" + username,
        {
            overlay_colors: JSON.stringify(new_overlay_colors)
        },
        
        function(response, status) {
            if (response.error) {
                show_modal_message(`Error`, response.message);
            }
            else {
                front_end_apply_color_change();
            }
        });
    }
    else {
        front_end_apply_color_change();
    }


}

function reset_colors_to_defaults() {
    for (let overlay_name of ["annotation", "prediction", "training_region", "test_region"]) {
        console.log("setting", overlay_name);
        $("#" + overlay_name + "_color").val(default_overlay_colors[overlay_name]);
    }
}

function set_overlay_color_css_rules() {

    // let overlay_colors = {
    //     "annotation": "#0080ff", // "#0080C0",
    //     "prediction": "#FF4040",
    //     "training_region": "#ff51eb", //"#f705bb",
    //     "test_region": "#ffae00" //"#ffa200"
    // };

    let sheet = $("#main-stylesheet").get(0).sheet;
    let css_rules_num = sheet.cssRules.length;
    sheet.insertRule(".a9s-annotationlayer .a9s-annotation .a9s-inner { stroke: " + 
                    overlay_colors["annotation"] +
                    " !important; }", css_rules_num);

    sheet.insertRule(".a9s-annotationlayer .a9s-annotation .training_region .a9s-inner { stroke: " + 
                    overlay_colors["training_region"] +
                    " !important; }", css_rules_num+1);
    
    sheet.insertRule(".a9s-annotationlayer .a9s-annotation.training_region .a9s-inner { stroke: " + 
                    overlay_colors["training_region"] +
                    " !important; }", css_rules_num+2);


    sheet.insertRule(".a9s-annotationlayer .a9s-annotation .test_region .a9s-inner { stroke: " + 
                    overlay_colors["test_region"] +
                    " !important; }", css_rules_num+3);    
                    
    sheet.insertRule(".a9s-annotationlayer .a9s-annotation.test_region .a9s-inner { stroke: " + 
                    overlay_colors["test_region"] +
                    " !important; }", css_rules_num+4);


    sheet.insertRule(".custom_radio_container input:checked ~ .custom_radio#annotation_radio { background-color: " +
                    overlay_colors["annotation"] +
                    "}", css_rules_num+5);

    sheet.insertRule(".custom_radio_container input:checked ~ .custom_radio#training_region_radio { background-color: " +
                    overlay_colors["training_region"] +
                    "}", css_rules_num+6);

          
    sheet.insertRule(".custom_radio_container input:checked ~ .custom_radio#test_region_radio { background-color: " +
                        overlay_colors["test_region"] +
                        "}", css_rules_num+7);

    
}