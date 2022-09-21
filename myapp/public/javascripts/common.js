

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
    "completed_for_training": "Completed for Training",
    "completed_for_testing": "Completed for Testing",
};

let overlay_colors = {
    "Annotations": "#0080C0",
    "Predictions": "#FF4040"
};
/*
let backend_color = {
    "Idle": "#222621",
    "Training": "#809c79",
    "Predicting": "#9c9179",
    "Restarting": "#802626"
}
*/

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