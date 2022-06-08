

// import { bilinearInterpolation } from "simple-bilinear-interpolation";


let image_set_info;
let metadata;
let dzi_image_paths;
let annotations;
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

let map_url = null;

let formatter = function(annotation) {

    const bodies = Array.isArray(annotation.body) ?
    annotation.body : [ annotation.body ];
  
    const scoreTag = bodies.find(b => b.purpose == 'score');
    const highlightBody = bodies.find(b => b.purpose == 'highlighting');

    let is_checked = $("#scores_checkbox").is(":checked");
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


function change_image(dzi_image_path) {
    // if (viewer == null) {
    //     create_viewer_and_anno();
    // }
    console.log("changing to", dzi_image_path);
    viewer.open(dzi_image_path);

    //$("#predict_button").show();
    //$("#retrieve_button").show();
    //$("#use_predictions_button").hide();
    //$("#continue_annotation_button").hide();

    $("#segmentation_viewer").hide();
    $("#segmentation_panel").hide();
    $("#seadragon_viewer").show();
    $("#annotation_panel").show();
    

    $("#prediction_view_panel").hide();
    $("#annotation_edit_panel").show();

    
    //if (pending_predictions.includes(cur_img_name)) {
    //    disable_buttons([$("#predict_button")]);
    //}
}

function create_image_set_table() {

    let image_name_col_width = "100px";
    let image_status_col_width = "150px";
    let image_dataset_col_width = "200px";

    $("#image_set_table").empty();
    /*
    $("#image_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${image_name_col_width};">Name</div></th>` +
            //`<th><div class="table_header" style="width: ${image_status_col_width}">Annotation Status</div></th>` +
            //`<th><div class="table_header" style="width: ${image_dataset_col_width}">Assigned Dataset</div></th>` +
            `</tr>`);*/
    for (dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path);
        let extensionless_name = image_name.substring(0, image_name.length - 4);

        //let img_status = image_set_data["images"][extensionless_name]["status"];

        let image_status = annotations[extensionless_name]["status"];
        $("#image_set_table").append(`<tr>` +
            `<td><div class="table_button table_button_hover"` +
                 `onclick="change_image('${dzi_image_path}')">${extensionless_name}</div></td>` +
            //`<td><div>${extensionless_name}</div></td>` +
            `<td><div class="table_entry" style="border: 1px solid white">${image_status}</div></td>` +
            //`<td><div class="table_entry">${img_dataset}</div></td>` +
            `</tr>`);

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
    let prev_status = annotations[cur_img_name]["status"];
    let num_annotations = annotations[cur_img_name]["annotations"].length;
    let new_status = prev_status;
    if (prev_status === "unannotated" && num_annotations > 0) {
        new_status = "started";
    }
    else if (prev_status === "started" && num_annotations == 0) {
        new_status = "unannotated";
    }
    annotations[cur_img_name]["status"] = new_status;
}

function set_image_status_combo() {

    let cur_status = annotations[cur_img_name]["status"];
    let num_annotations = annotations[cur_img_name]["annotations"].length;
    let image_status_options;
    if (cur_status === "completed_for_training" || cur_status === "completed_for_testing") {
        image_status_options = [cur_status];
        /*
        if (num_annotations > 0) {
            image_status_options = ["started", "completed"];
        }
        else {
            image_status_options = ["unannotated", "completed"];
        }*/
    }
    else if (cur_status === "started") {
        image_status_options = ["started", "completed_for_training", "completed_for_testing"];
    }
    else if (cur_status === "unannotated") {
        image_status_options = ["unannotated", "completed_for_training", "completed_for_testing"];
    }

    $("#status_combo").empty();
    for (image_status of image_status_options) {
        $("#status_combo").append($('<option>', {
            value: image_status,
            text: image_status
        }));
    }
    $("#status_combo").val(cur_status);
}



function create_anno(readOnly) {


    anno = OpenSeadragon.Annotorious(viewer, {
        disableEditor: true,
        disableSelect: readOnly,
        readOnly: readOnly,
        formatter: formatter
    });


    anno.on('createAnnotation', function(annotation) {

        annotations[cur_img_name]["annotations"] = anno.getAnnotations();

        update_image_status();
        set_image_status_combo();
        $("#save_icon").css("color", "#ed452b");
        create_image_set_table();
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

        anno.clearAnnotations();

        for (annotation of annotations[cur_img_name]["annotations"]) {
            anno.addAnnotation(annotation);
        }
    });

    return anno;

}


function create_viewer_and_anno() {

    //$("#seadragon_viewer").empty();


    viewer = OpenSeadragon({
        id: "seadragon_viewer",
        sequenceMode: true,
        prefixUrl: "/plant_detection/osd/images/",
        tileSources: dzi_image_paths,
        showNavigator: false,
        maxZoomLevel: 100,
        zoomPerClick: 1,
        nextButton: "next-button",
        previousButton: "prev-button",
        showNavigationControl: false
    });

    anno = OpenSeadragon.Annotorious(viewer, {
        disableEditor: true,
        formatter: formatter
    });
/*
    prediction_anno = OpenSeadragon.Annotorious(viewer, {
        disableEditor: true,
        disableSelect: true,
        readOnly: true,
        formatter: formatter
    });*/

    viewer.innerTracker.keyDownHandler = function(e) {

        if (e.keyCode == 46) {
            let selected = anno.getSelected();
            anno.removeAnnotation(selected);

            annotations[cur_img_name]["annotations"] = anno.getAnnotations();
            update_image_status();
            set_image_status_combo();
            create_image_set_table();
            $("#save_icon").css("color", "#ed452b");

        }

    }

    viewer.addHandler("open", function(event) {
        console.log("viewer open handler called");
        anno.clearAnnotations();

        let img_files_name = basename(event.source);
        let img_name = img_files_name.substring(0, img_files_name.length - 4);

        cur_img_name = img_name;
        console.log("cur_img_name", cur_img_name);

        $("#image_name").text(cur_img_name);
        set_image_status_combo();

        
        if (pending_predictions[cur_img_name]) {
            disable_buttons(["predict_button"]);
        }
        else {
            enable_buttons(["predict_button"]);
        }


        //$("#use_for_radio").prop('disabled', ((annotations[cur_img_name]["available_for_training"]) || 
        //                                      (annotations[cur_img_name]["status"] !== "completed"))); 
        //((annotations[cur_img_name]["available_for_training"]) || 
        //                                    (annotations[cur_img_name]["status"] !== "completed")));


        for (annotation of annotations[cur_img_name]["annotations"]) {
            anno.addAnnotation(annotation);
        }

    });


    anno = create_anno(false);



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

function show_map() {
    cur_view = "map";
    save_annotations();


    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-image" style="padding-right: 10px; color: white;"></i>Image View`);

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


function show_image() {
    cur_view = "image";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-location-dot" style="padding-right: 10px; color: white;"></i>Map View`);
    
    $("#map_view_container").hide();
    $("#image_view_container").show();

    create_image_set_table();
}

function save_annotations() {


    $.post($(location).attr('href'),
    {
        action: "save_annotations",
        annotations: JSON.stringify(annotations),
    },
    
    function(response, status) {

        if (response.error) {
            create_image_set_table();
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
            save_annotations();
        }
        else {
            console.log("refreshed");
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


function confirm_use_predictions() {
    annotations[cur_img_name]["annotations"] = predictions[cur_img_name]["annotations"];

    for (annotation of predictions[cur_img_name]["annotations"]) {    
        let bodies = Array.isArray(annotation.body) ?
        annotation.body : [ annotation.body ];
        let highlightBody = bodies.find(b => b.purpose == 'highlighting');

        let index = annotation["body"].indexOf(highlightBody);
        if (index !== -1) {
            annotation["body"].splice(index, 1);
        }

    }
    $("#save_icon").css("color", "#ed452b");
    close_modal();
    return_to_annotate();
}




function return_to_annotate() {

    anno.readOnly = false;
    anno.clearAnnotations();

    for (annotation of annotations[cur_img_name]["annotations"]) {
        anno.addAnnotation(annotation);
    }

    //$("#predict_button").show();
    //$("#retrieve_button").show();
    //$("#use_predictions_button").hide();
    //$("#continue_annotation_button").hide();

    $("#prediction_view_panel").hide();
    $("#annotation_edit_panel").show();

    //$("#predict_button").html("Request Prediction");
    //$("#retrieve_button").html("Show Most Recent Predictions");
    

}
function magnify(imgID, zoom) {
    var img, glass, w, h, bw;
    img = document.getElementById(imgID);
    /*create magnifier glass:*/
    glass = document.createElement("DIV");
    glass.setAttribute("class", "img-magnifier-glass");
    /*insert magnifier glass:*/
    img.parentElement.insertBefore(glass, img);
    /*set background properties for the magnifier glass:*/
    glass.style.backgroundImage = "url('" + img.src + "')";
    glass.style.backgroundRepeat = "no-repeat";
    glass.style.backgroundSize = (img.width * zoom) + "px " + (img.height * zoom) + "px";
    bw = 3;
    w = glass.offsetWidth / 2;
    h = glass.offsetHeight / 2;
    /*execute a function when someone moves the magnifier glass over the image:*/
    glass.addEventListener("mousemove", moveMagnifier);
    img.addEventListener("mousemove", moveMagnifier);
    /*and also for touch screens:*/
    glass.addEventListener("touchmove", moveMagnifier);
    img.addEventListener("touchmove", moveMagnifier);
    function moveMagnifier(e) {
      var pos, x, y;
      /*prevent any other actions that may occur when moving over the image*/
      e.preventDefault();
      /*get the cursor's x and y positions:*/
      pos = getCursorPos(e);
      x = pos.x;
      y = pos.y;
      /*prevent the magnifier glass from being positioned outside the image:*/
      if (x > img.width - (w / zoom)) {x = img.width - (w / zoom);}
      if (x < w / zoom) {x = w / zoom;}
      if (y > img.height - (h / zoom)) {y = img.height - (h / zoom);}
      if (y < h / zoom) {y = h / zoom;}
      /*set the position of the magnifier glass:*/
      glass.style.left = (x - w) + "px";
      glass.style.top = (y - h) + "px";
      /*display what the magnifier glass "sees":*/
      glass.style.backgroundPosition = "-" + ((x * zoom) - w + bw) + "px -" + ((y * zoom) - h + bw) + "px";
    }
    function getCursorPos(e) {
      var a, x = 0, y = 0;
      e = e || window.event;
      /*get the x and y positions of the image:*/
      a = img.getBoundingClientRect();
      /*calculate the cursor's x and y coordinates, relative to the image:*/
      x = e.pageX - a.left;
      y = e.pageY - a.top;
      /*consider any page scrolling:*/
      x = x - window.pageXOffset;
      y = y - window.pageYOffset;
      return {x : x, y : y};
    }
  }

function imageZoom(imgID, resultID) {

    //let margin_x = (($("#seadragon_viewer").outerWidth() - $("#my_image_container").outerWidth()) / 2);
    //let margin_y = (($("#seadragon_viewer").outerHeight() - $("#my_image_container").outerHeight()) / 2) - 1;

    let margin_x = (($("#segmentation_viewer").outerWidth() - $("#my_image_container").outerWidth()) / 2);
    let margin_y = (($("#segmentation_viewer").outerHeight() - $("#my_image_container").outerHeight()) / 2) - 1;

    console.log("segmentation_viewer outer width", $("#segmentation_viewer").outerWidth());
    console.log("my_image_container outer width", $("#my_image_container").outerWidth());
    console.log("segmentation_viewer outer height", $("#segmentation_viewer").outerHeight());
    console.log("my_image_container outer height", $("#my_image_container").outerHeight());

    console.log("margin_x", margin_x);
    console.log("margin_y", margin_y);


    var img, lens, result, cx, cy;
    img = document.getElementById(imgID);
    result = document.getElementById(resultID);
    /*create lens:*/
    lens = document.createElement("DIV");
    lens.setAttribute("class", "img-zoom-lens");
    /*insert lens:*/
    img.parentElement.insertBefore(lens, img);
    /*calculate the ratio between result DIV and lens:*/
    cx = result.offsetWidth / lens.offsetWidth;
    cy = result.offsetHeight / lens.offsetHeight;
    /*set background properties for the result DIV:*/
    result.style.backgroundImage = "url('" + img.src + "')";
    result.style.backgroundSize = (img.width * cx) + "px " + (img.height * cy) + "px";
    //result.style.backgroundSize = (result.width * cx) + "px " + (result.height * cy) + "px";

    /*execute a function when someone moves the cursor over the image, or the lens:*/
    lens.addEventListener("mousemove", moveLens);
    img.addEventListener("mousemove", moveLens);
    /*and also for touch screens:*/
    lens.addEventListener("touchmove", moveLens);
    img.addEventListener("touchmove", moveLens);
    function moveLens(e) {
      var pos, x, y;
      /*prevent any other actions that may occur when moving over the image:*/
      e.preventDefault();
      /*get the cursor's x and y positions:*/
      pos = getCursorPos(e);
      /*calculate the position of the lens:*/
      x = pos.x - (lens.offsetWidth / 2) + margin_x;
      y = pos.y - (lens.offsetHeight / 2) + margin_y;
      /*prevent the lens from being positioned outside the image:*/
      if (x > img.width + margin_x - lens.offsetWidth) {x = img.width + margin_x  - lens.offsetWidth;}
      if (x < margin_x) {x = margin_x;}
      if (y > img.height + margin_y - lens.offsetHeight) {y = img.height + margin_y - lens.offsetHeight;}
      if (y < margin_y) {y = margin_y;}
      /*set the position of the lens:*/
      lens.style.left = x + "px";
      lens.style.top = y + "px";
      /*display what the lens "sees":*/
      result.style.backgroundPosition = "-" + ((x - margin_x) * cx) + "px -" + ((y - margin_y) * cy) + "px";
    }
    function getCursorPos(e) {
      var a, x = 0, y = 0;
      e = e || window.event;
      /*get the x and y positions of the image:*/
      a = img.getBoundingClientRect();
      /*calculate the cursor's x and y coordinates, relative to the image:*/
      x = e.pageX - a.left;
      y = e.pageY - a.top;
      /*consider any page scrolling:*/
      x = x - window.pageXOffset;
      y = y - window.pageYOffset;
      return {x : x, y : y};
    }
  }



function show_segmentation() {
    console.log("test button clicked");

    let timestamp = new Date().getTime();

    let image_src = "/plant_detection/usr/data/image_sets/" + image_set_info["farm_name"] + "/"
                    + image_set_info["field_name"] + "/" + image_set_info["mission_date"] + 
                    "/segmentations/" + cur_img_name + ".png?t=" + timestamp;
    //let image_src = "/plant_detection/usr/data/tmp_out_test.png?t=" + timestamp;

    $("#seadragon_viewer").hide();
    $("#annotation_panel").hide();
    $("#segmentation_viewer").show();
    $("#segmentation_panel").show();

    $("#segmentation_viewer").empty();
    $("#my_result").css("backgroundImage", "none");
    //$("#seadragon_viewer").empty();


    let viewer_width = $("#segmentation_viewer").width(); //+ "px";
    let viewer_height = $('#segmentation_viewer').height(); // + "px";

    /*
    $("#seadragon_viewer").append(
       // `<div style="width: 650px; height: 650px; display: block">` +
        //`<div style="position: relative;">` +
        //`<div style="width: ${width}; height: ${height}; overflow-x: auto; overflow-y: auto;">`  +
        `<div style="width: ${width}; height: ${height};">` +
            //`<img id="myimage" src="${image_src}" width="325px" height="325px"></img>` +
            //`<div id="myresult" style="width: 325px; height: 325px;"></div>` +
            //`<img id="myimage" src="${image_src}" width="5000" height="5000"></img>` +
            `<img id="myimage" src="${image_src}" width="${width}" height="${height}"></img>` +
            //`<div id="myresult" style="width: 0px; height: 0px;"></div>` +
        `</div>`);*/


    let my_image = new Image();
    let org_height;
    let org_width;
    my_image.onload = function() {
        org_height = my_image.height;
        org_width = my_image.width;
        //alert('The image size is ' + width + '*' + height);
        console.log("org_height", org_height);

        
        frac_h = viewer_height / org_height;
        frac_w = viewer_width / org_width;
        let rescale = Math.min(frac_h, frac_w);
        
        console.log("viewer_height", viewer_height);
        console.log("viewer_width", viewer_width);
        console.log("frac_h", frac_h);
        console.log("frac_w", frac_w);
        console.log("rescale", rescale);
        let zoom_level = 15;
        let full_height = rescale * org_height;
        let full_width = rescale * org_width;
        my_image.id = "my_image";
        my_image.height = full_height;
        my_image.width = full_width;

        
        /*$("#seadragon_viewer").append(
            `<div id="my_image_container" style="position: relative;">` +
            `</div>`
        );*/
        /*
        $("#seadragon_viewer").append(
            `<table><tr><td id="seg_table"></td></tr></table>`
        );*/
        let container_height = full_height + "px";
        let container_width = full_width + "px";
        /*
        $("#seadragon_viewer").append(
            `<div id="external_container" style="margin: auto; height: ${container_height}; width: ${container_width}">` +
            `<div id="my_image_container"></div></div>`
        );*/
        //$("#segmentation_viewer").append(
        $("#segmentation_viewer").append(
            `<div id="my_image_container" style="margin: auto auto; height: ${container_height}; width: ${container_width}">` +
            `</div>`
        );
        $("#my_image_container").append(
            my_image
        );

        //$("#right_panel").append(`<div id="my_result" style="border: 1px solid white; height: 280px"></div>`);
        imageZoom("my_image", "my_result");
        //magnify("my_image", 10);

/*
        my_image.height = full_height * zoom_level;
        my_image.width = full_width * zoom_level;
        
        viewer_height = viewer_height + "px";
        viewer_width = viewer_width + "px";
        
        $("#seadragon_viewer").append(
            `<div id="my_image_container" style="width: ${viewer_width}; height: ${viewer_height}; overflow-x: auto; overflow-y: auto;"></div>`
        );
        $("#my_image_container").append(
            my_image
        );
        //magnify("my_image", 10);
*/
    };


    my_image.src = image_src;

        //`</div>`);

    //$("#right_panel").append(`<div id="myresult" style="border: 1px solid white; height: 280px"></div>`);

        // `<table class="transparent_table">` +
        //     `<tr>` +
        //         `<td>` +
        //             `<img id="myimage" src="${image_src}" width="425px" height="425px"></img>` +
        //         `</td>` +
        //         `<td>` +
        //             `<div id="myresult" style="width: 425px; height: 425px;"></div>` +
        //         `</td>` +
        //     `</tr>` +
        // `</table>`);

    //
}





$(document).ready(function() {
    window.setInterval(refresh, 90000); // 1.5 minutes
    ask_to_continue_handle = window.setTimeout(ask_to_continue, 7200000); // 2 hours




    image_set_info = data["image_set_info"];
    dzi_image_paths = data["dzi_image_paths"];
    annotations = data["annotations"];
    metadata = data["metadata"];

    pending_predictions = {};
    for (image_name of Object.keys(annotations)) {
        pending_predictions[image_name] = false;
    }


    let socket = io();
    socket.emit('join_message', image_set_info["farm_name"] + "/" + image_set_info["field_name"] + "/" + image_set_info["mission_date"]);

    socket.on('status_change', function(status) {
        let update_num = status["update_num"];
        if (update_num > cur_update_num) {
            cur_update_num = update_num;
            let cur_status = status["status"];
            let cur_num_trained_on = status["num_images_fully_trained_on"];
            
            $("#model_status").html(cur_status);

            let num_available = 0;
            for (image_name of Object.keys(annotations)) {
                if (annotations[image_name]["status"] == "completed_for_training") {
                    num_available++;
                }
            }
            if (cur_num_trained_on == num_available) {
                $("#model_training_status").html("yes");
            }
            else {
                $("#model_training_status").html("no");
            }

            if ("prediction_image_name" in status) {
                console.log("pending_predictions", pending_predictions);
                /*
                let index = pending_predictions.indexOf(status["prediction_image_name"]);
                if (index !== -1) {
                    pending_predictions.splice(index, 1);
                }*/
                pending_predictions[status["prediction_image_name"]] = false;
                console.log("pending_predictions", pending_predictions);
                console.log(cur_img_name, status["prediction_image_name"]);
                if (cur_img_name === status["prediction_image_name"]) {
                    enable_buttons(["predict_button"]);
                }
            }
        }
    });


    $("#image_set_name").text(image_set_info["farm_name"] + "  |  " + 
                              image_set_info["field_name"] + "  |  " + 
                              image_set_info["mission_date"]);

    image_to_dzi = {};
    for (dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path)
        let extensionless_name = image_name.substring(0, image_name.length - 4);
        image_to_dzi[extensionless_name] = dzi_image_path;
    }


    cur_img_name = basename(dzi_image_paths[0]);
    cur_view = "image";


    if ((!(metadata["missing"]["latitude"]) && !(metadata["missing"]["longitude"])) && (!(metadata["missing"]["area_m2"]))) {

        $("#view_button_container").append(
            `<button style="width: 140px; margin: 0px;" id="view_button" class="table_button table_button_hover">` +
            `<div id="view_button_text"></div></button>`
        );


        $("#view_button").click(function() {
            if (cur_view == "image") {
                show_map();
            }
            else {
                show_image();
            }
        });
    }



    create_viewer_and_anno();
    show_image();

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

    $("#predict_button").click(function() {

        disable_buttons(["predict_button"]);
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

    $("#retrieve_button").click(function() {


        $.post($(location).attr('href'),
        {
            action: "retrieve_prediction",
            image_name: cur_img_name
        },

        function(response, status) {
            console.log("got response");

            if (response.error) {
                show_modal_message("Error", response.message);
            }
            else {
                console.log("showing predictions");
                predictions[cur_img_name] = response.predictions[cur_img_name];

                anno.clearAnnotations();

                //$("#right_panel").css("background-color", "pink"); //#222621;")
                //$("#predict_button").html("Use Predictions as Annotations");
                //$("#retrieve_button").html("Continue Annotating");

                //$("#predict_button").hide();
                //$("#retrieve_button").hide();
                //$("#use_predictions_button").show();
                //$("#continue_annotation_button").show();

                $("#annotation_edit_panel").hide();
                $("#prediction_view_panel").show();
                
                anno.readOnly = true;
                //create_anno(true);
                for (annotation of annotations[cur_img_name]["annotations"]) {
                    anno.addAnnotation(annotation);
                }
                
                for (annotation of predictions[cur_img_name]["annotations"]) {
                    
                    annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"})
                    
                    //console.log(annotation);
                    anno.addAnnotation(annotation); //, {readOnly: true}); //, true);
                }

                //create_anno(false);

                //anno.readOnly = false;
                

            }
        });
    });

    $("#continue_annotation_button").click(function() {
        return_to_annotate();
    });

    $("#segment_button").click(function() {
        show_segmentation();
    });

    $("#threshold_slider").on("input", function() {
        let slider_val = Number.parseFloat($("#threshold_slider").val()).toFixed(2);
        $("#slider_val").html(slider_val);
    });

    $("#request_segment_button").click(function() {
        console.log("requesting segmentation");

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


        });

    });


});
