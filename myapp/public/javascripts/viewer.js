

let image_set_info;
let job_config;
let overlays;
let metadata;
//let predictions;
let metrics;
let dzi_dir;
let dzi_image_paths;
let sorted_overlay_names;
let sorted_overlay_ids;
let overlay_colors;
let dataset_images;
let used_for = {};


let image_names = {
    "all": [],
    "completed": [],
    "unannotated": [],
    "training/validation": [],
    "testing": []
};

let viewer;
let anno;
let cur_img_name;
let cur_view;
let cur_map_model_uuid;

let map_url = null;
let pred_map_url = null;

function change_image(dzi_image_path) {
    viewer.open(dzi_image_path);
}


function overlay_initialization() {

    sorted_overlay_names = [];
    sorted_overlay_ids = [];

    let model_items = job_config["model_info"]
    model_items.sort(function(first, second) {
        if (first["model_name"] < second["model_name"]) return -1;
        if (first["model_name"] > second["model_name"]) return 1;
        return 0;
    });

    for (model_item of model_items) {
        sorted_overlay_names.push(model_item["model_name"]);
        sorted_overlay_ids.push(model_item["model_uuid"]); 
    }

    sorted_overlay_names = ["annotations", ...sorted_overlay_names];
    sorted_overlay_ids = ["annotations", ...sorted_overlay_ids];


    let colors = ["#0080C0",        
                  "#FF4040", 
                  "#f5a70b", 
                  "#b95fb9", 
                  "#02b863",
                  "#00C0C0", 
                  "#00695C",
                  "#FFC0C0", 
                  "#C08040", 
                  "#FF8040"];
    let overflow_color = "#A0A0A0";

    overlay_colors = {};
    for (let i = 0; i < sorted_overlay_names.length; i++) {
        if (i < colors.length)
            overlay_colors[sorted_overlay_names[i]] = colors[i];
        else
            overlay_colors[sorted_overlay_names[i]] = overflow_color;
    }

    let color_id;
    for (let i = 0; i < sorted_overlay_names.length; i++) {

        if (i < colors.length)
            color_id = "COLOR_" + i;
        else
            color_id = "COLOR_DEFAULT";

        //console.log("for loop started");
        for (img_name of Object.keys(overlays[sorted_overlay_ids[i]])) {
            for (annotation of overlays[sorted_overlay_ids[i]][img_name]["annotations"]) {
                annotation["body"].push({"value": color_id, "purpose": "highlighting"})
            }
        }
        //console.log("for loop finished");

    }

}

function adjust_to_opt(btn_id) {

    let overlay_id = btn_id.substring(0, btn_id.length - "_thresh".length);
    let thresh_val = metrics[overlay_id]["point"]["train_val_optimal_score_threshold"]["threshold_value"];
    //let thresh_val = 0.85;
    $("#confidence_slider").val(thresh_val);
    $("#confidence_slider").change();
}


function create_map_models_radio() {
    $("#map_selection_table").empty();
    let i = 0;
    for (model_info of job_config["model_info"]) {
        let model_uuid = model_info["model_uuid"];
        let model_name = model_info["model_name"];
        if (i == 0) {
            $("#map_selection_table").append(
                `<tr>` +
                    `<td>` +
                        `<label>${model_name}` +
                            `<input style="margin-left: 30px" type="radio" name="map_model" value="${model_uuid}" checked>` +
                            `<span class="custom_radio"></span>` +
                        `</label>` +
                    `</td>` +
                `</tr>`
            );

        }
        else {
            $("#map_selection_table").append(
                `<tr>` +
                    `<td>` +
                        `<label>${model_name}` +
                            `<input style="margin-left: 30px" type="radio" name="map_model" value="${model_uuid}">` +
                            `<span class="custom_radio"></span>` +
                        `</label>` +
                    `</td>` +
                `</tr>`
            );
        }
        i++;
    }

/*
    let num_completed = 0;
    for (image_name of Object.keys(overlays["annotations"])) {
        if (overlays["annotations"][image_name]["status"] == "completed") {
            num_completed++;
        }
    }*/

    /*
    if (num_completed >= 3) {

        $("#include_annotations_container").append(
            `<div class="header2" style="text-align: left; padding-left: 10px">Show Annotated Map</div>` +
            `<table class="transparent_table" style="border: 1px solid white; width: 260px">` +
                `<tr>` +
                    `<td>` +
                        `<label>Yes` +
                            `<input type="radio" name="include_annotated_map" value="yes" checked>` +
                            `<span class="custom_radio"></span>` +
                        `</label>` +
                    `</td>` +
                    `<td>` +
                        `<label>No` +
                            `<input type="radio" name="include_annotated_map" value="no">` +
                            `<span class="custom_radio"></span>` +
                        `</label>` +
                    `</td>` +
                `</tr>` +
            `</table>`
        );
        */

    //}
}

function create_models_table() {

    let models_col_width = "145px"; //"215px";
    let opt_col_width = "85px"

    for (let i = 0; i < sorted_overlay_names.length; i++) {
        let overlay_name = sorted_overlay_names[i];
        let overlay_id = sorted_overlay_ids[i];
        let overlay_color = overlay_colors[overlay_name];
        let opt_thresh_id = overlay_id + "_thresh";
        let model_row_id = overlay_id + "_row";
        console.log("overlay_color", overlay_color);
        $("#models_table").append(`<tr id=${model_row_id}>` +
            `<td><label class="table_label" ` +
            `style="width: ${models_col_width}; background-color: ${overlay_color};">` +
            //`<input id=${overlay_id} type="checkbox" style="cursor: pointer"></input>   ${overlay_name}</label>` +
           

            `<table class="transparent_table">` +
            `<tr>` + 
            `<td style="width: 40px">` +
                `<label class="switch">` +
                `<input id=${overlay_id} type="checkbox"></input>` +
                `<span class="switch_slider round"></span></label>` +
            `</td>` +
            `<td style="width: 100%">` +
                `<div style="margin-left: 8px">${overlay_name}</div>` +
            `</td>` +
            `</tr>` +
            `</table>` +
            `</label>` +

            //<span style="margin-left: 50px;">${overlay_name}</span>
            //span(class="switch_slider round" id="scores_checkbox")

           
           
            `</td>`+
            

/*
                    `<td><input class="table_label" type="checkbox">` +
                    ` ${overlay_name}</label></td>` +
                    */
/*

            `<td><div class="table_button table_button_hover" ` +
            `style="width: ${models_col_width}; background-color: ${overlay_color}"` +
                 `>${overlay_name}</div></td>` +*/
            `</tr>`);

        if (i > 0) {
            $("#" + model_row_id).append(
                `<td><div id=${opt_thresh_id} style="width: ${opt_col_width};" class="table_button table_button_hover"` +
                `onclick="adjust_to_opt('${opt_thresh_id}')">Opt thresh</div></td>`);

        }
    }
}


function create_image_set_table() {

    let image_name_col_width = "100px";
    let image_status_col_width = "150px";
    let image_dataset_col_width = "200px";

    $("#images_table").empty();
    /*
    $("#image_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${image_name_col_width};">Name</div></th>` +
            //`<th><div class="table_header" style="width: ${image_status_col_width}">Annotation Status</div></th>` +
            //`<th><div class="table_header" style="width: ${image_dataset_col_width}">Assigned Dataset</div></th>` +
            `</tr>`);*/
    //for (dzi_image_path of dzi_image_paths) {

    let filter_val = $("#filter_combo").val();
    let selected_image_names;
    if (filter_val === "all") {
        selected_image_names = image_names["all"];
    }
    else if (filter_val === "completed") {
        selected_image_names = image_names["completed"];
    }
    else if (filter_val === "unannotated") {
        selected_image_names = image_names["unannotated"];
    }
    else if (filter_val === "training/validation") {
        selected_image_names = image_names["training/validation"];
    }
    else {
        selected_image_names = image_names["testing"]
    }


    for (image_name of selected_image_names) {
        //let image_name = basename(dzi_image_path)
        //let extensionless_name = image_name.substring(0, image_name.length - 4);
        let dzi_image_path = dzi_dir + "/" + image_name + ".dzi";

        //let img_status = image_set_data["images"][extensionless_name]["status"];
        let image_status = overlays["annotations"][image_name]["status"];
        $("#images_table").append(`<tr>` +
            `<td><div class="table_button table_button_hover"` +
                 `onclick="change_image('${dzi_image_path}')">${image_name}</div></td>` +
            //`<td><div>${extensionless_name}</div></td>` +
            `<td><div class="table_entry" style="border: 1px solid white">${image_status}</div></td>` +
            //`<td><div class="table_entry">${img_dataset}</div></td>` +
            `</tr>`);
    }
}
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
  



function update_overlays() {
    anno.clearAnnotations();
    console.log("update_overlays");
    let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
    for (overlay_id of sorted_overlay_ids) {
        if ($("#" + overlay_id).is(":checked")) {
            for (annotation of overlays[overlay_id][cur_img_name]["annotations"]) {
                //annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"})
                /*
                let tag = {
                    purpose: "score",
                    type: "TextualBody",
                    value: "0.94" //"MyTag"
                }
                annotation.body.push(tag);*/
                //annotation["TAG"] = "MY TEXT"
                //console.log(annotation)'

                let bodies = Array.isArray(annotation.body) ?
                annotation.body : [ annotation.body ];
                let scoreTag = bodies.find(b => b.purpose == 'score');
                if (!scoreTag || scoreTag.value >= slider_val) {
                    anno.addAnnotation(annotation);
                }
            }
        }

    }
/*
    if $("#annotations")
    for (annotation of annotations[cur_img_name]["annotations"]) {
        anno.addAnnotation(annotation);
    }*/
}

/*
function assemble_datasets() {
    dataset_images = {};
    for (image_set of job_config["inference_config"]["datasets"]){ //image_sets"]) {
        if ((image_set["farm_name"] === metadata["farm_name"] &&
             image_set["field_name"] === metadata["field_name"]) &&
             image_set["mission_date"] === metadata["mission_date"]) {
            dataset_images["training"] = natsort(image_set["training_image_names"]);
            dataset_images["validation"] = natsort(image_set["validation_image_names"]);
            dataset_images["test"] = natsort(image_set["test_image_names"]);
        }
    }
    dataset_images["all"] = natsort(Object.keys(data["overlays"]["annotations"]));
}
*/



/*
function show_image() {

    cur_view = "image";

    if ((!(metadata["missing"]["latitude"]) && !(metadata["missing"]["longitude"])) && (!(metadata["missing"]["area_m2"]))) {
        $("#view_button_container").empty();
        $("#view_button_container").append(
            `<button style="width: 140px; margin: 0px;" id="view_button" class="table_button table_button_hover">` +
            `<i class="fa-solid fa-location-dot" style="padding-right: 10px; color: white;"></i>Map View</button>`
        );


        $("#view_button").click(function() {
            if (cur_view == "image") {
                show_map();
            }
            else {
                show_image();
                change_image(image_to_dzi[cur_img_name]);
            }
        });
    }


    $("#left_panel").empty();
    $("#seadragon_viewer").empty();

    $("#left_panel").append(
        `<table class="transparent_table">` +
            `<tr>` +
                `<td style="text-align: left">` +
                    `<h class="header2" style="width: 80px">Image:</h>` +
                `</td>` +
                `<td style="width: 100%; text-align: left; padding-left: 12px">` +
                    `<h id="image_name"></h>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td style="text-align: left">` +
                    `<h class="header2" style="width: 80px">Status:</h>` +
                `</td>` +
                `<td style="width: 100%; text-align: left; padding-left: 12px">` +
                    `<h id="image_status"></h>` +
                `</td>` +
            `</tr>` +
            `<tr>` +
                `<td style="text-align: left">` +
                    `<h class="header2" style="width: 80px">Used for:</h>` +
                `</td>` +
                `<td style="width: 100%; text-align: left; padding-left: 12px">` +
                    `<h id="used_for"></h>` +
                `</td>` +
            `</tr>` +
        `</table>` +

        `<br>` +
        `<hr>` +
        `<br>` +

        `<table class="transparent_table" style="height: 40px">` +
            `<tr>` +
                `<td style="text-align: left">` +
                    `<h class="header2" style="width: 110px">Filter images:</h>` +
                `</td>` +
                `<td style="width: 100%">` +
                    `<select id="filter_combo" class="nonfixed_dropdown`



    );




                                        br
                                        hr
                                        br
                                        
                                        table(class="transparent_table" style="height: 40px")
                                            tr
                                                td(style="text-align: left;")
                                                    h(class="header2" style="width: 110px") Filter images: 
                                                td(style="width:100%")
                                                    select(id="filter_combo" class="nonfixed_dropdown")
                                                        option all
                                                        option completed
                                                        option unannotated
                                                        option training/validation 
                                                        option testing

                                        br
                                        div(class="scrollable_area" style="height: 425px; border:none")
                                            table(id="images_table")

                                        br
                                        hr
                                        div(style="height: 5px")

                                        a(class="table_button table_button_hover" style="padding: 5px 10px;" id="download_button" download)
                                            i(class="fa fa-download fa-sm")
                                            span(style="margin-left: 10px") Download Counts 
                                        
                                        div(style="height: 5px")              
}
*/


function disable_build() {

    let buttons = ["#build_map_button"];

    for (button of buttons) {
        $(button).prop('disabled', true);
        $(button).removeClass("table_button_hover");
        $(button).css("opacity", 0.5);
        $(button).css("cursor", "default");
    }
}


function enable_build() {

    let buttons = ["#build_map_button"];

    for (button of buttons) {
        $(button).prop('disabled', false);
        $(button).addClass("table_button_hover");
        $(button).css("opacity", 1);
        $(button).css("cursor", "pointer");
    }
}



function build_map() {
    disable_build();
    $("#build_loader").show();
    //let sel_metric = $("input[type='radio'][name='metric']:checked").val();
    let sel_interpolation = $("input[type='radio'][name='interpolation']:checked").val();
    let sel_model = $("input[type='radio'][name='map_model']:checked").val();
    let sel_pred_image_status = $("input[type='radio'][name='pred_image_status']:checked").val();


    //let include_annotated_map = $("input[type='radio'][name='include_annotated_map']:checked").val() === "yes";
    //console.log("include_annotated_map", include_annotated_map);
    //console.log("sel_metric", sel_metric);
    console.log("sel_interpolation", sel_interpolation);
    
    

    $.post($(location).attr('href'),
    {
        action: "build_map",
        //metric: sel_metric,
        interpolation: sel_interpolation,
        model_uuid: sel_model,
        pred_image_status: sel_pred_image_status
        //include_annotated_map: include_annotated_map 
        //image_set_data: JSON.stringify(image_set_data)
    },
    
    function(response, status) {
        $("#build_loader").hide();
        enable_build();
        if (response.error) {    
            console.log("error occurred");
        }
        else {
            console.log("showing map");
            cur_map_model_uuid = sel_model;

            let timestamp = new Date().getTime();   

            map_url = "/plant_detection/usr/data/results/" + image_set_info["farm_name"] + "/" + 
                            image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/" +
                            job_config["job_uuid"] + "/" + sel_model + "/maps/annotated_map.svg?t=" + timestamp;

            pred_map_url = "/plant_detection/usr/data/results/" + image_set_info["farm_name"] + "/" + 
                            image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/" +
                            job_config["job_uuid"] + "/" + sel_model + "/maps/predicted_map.svg?t=" + timestamp;

            console.log("showing map");
            draw_map_chart();
        }
    });


}

function show_map() {
    cur_view = "map";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-image" style="padding-right: 10px; color: white;"></i>Image View`);

    $("#image_view_container").hide();
    $("#map_view_container").show();
    
    
    create_map_models_radio();
    $("#map_builder_controls_container").show();

/*
    let num_completed = 0;
    for (image_name of Object.keys(annotations)) {
        if (annotations[image_name]["status"] == "completed") {
            num_completed++;
        }
    }

    if (num_completed >= 3) {

    }
    else {
        $("#map_builder_controls_container").hide();
        $("#insufficient_annotation_container").show();
    }
*/
    
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

$(document).ready(function() {
    
    image_set_info = data["image_set_info"];
    job_config = data["job_config"];
    overlays = data["overlays"];
    //predictions = data["predictions"];
    metadata = data["metadata"];
    metrics = data["metrics"];
    dzi_dir = data["dzi_dir"];
    dzi_image_paths = data["dzi_image_paths"];


    let download_path = "/plant_detection/usr/data/results/" + job_config["target_farm_name"] + "/" +
                        job_config["target_field_name"] + "/" + job_config["target_mission_date"] + "/" +
                        job_config["job_uuid"] + "/results.xlsx";
    
    //let download_path = "/plant_detection/usr/data/results.xlsx";
    console.log("download_path", download_path);
    $("#download_button").attr("href", download_path);


    $("#image_set_name").text(image_set_info["farm_name"] + "  |  " + 
                              image_set_info["field_name"] + "  |  " + 
                              image_set_info["mission_date"]);



    $('#chart_combo').append($('<option>', {
        value: "Count",
        text: "Count"
    }));
    if (!(metadata["missing"]["area_m2"])) {
        $('#chart_combo').append($('<option>', {
            value: "Count per square metre",
            text: "Count per square metre"
        }));
    }
    $('#chart_combo').append($('<option>', {
        value: "MS COCO mAP",
        text: "MS COCO mAP"
    }));
    $('#chart_combo').append($('<option>', {
        value: "PASCAL VOC mAP",
        text: "PASCAL VOC mAP"
    }));




    image_names["all"] = natsort(Object.keys(data["overlays"]["annotations"]));
    for (image_name of image_names["all"]) {

        let status = data["overlays"]["annotations"][image_name]["status"];
        if (status === "completed") {
            image_names["completed"].push(image_name);


            if (job_config["test_reserved_images"].includes(image_name)) {
                image_names["testing"].push(image_name)
                used_for[image_name] = "testing";
            }
            else if (job_config["training_validation_images"].includes(image_name)) {
                image_names["training/validation"].push(image_name);
                used_for[image_name] = "training/validation";
            }
            else {
                used_for[image_name] = "NA";
            }

        }
        else if (status === "unannotated") {
            image_names["unannotated"].push(image_name);
            used_for[image_name] = "NA";
        }
 
    }


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
    


    let img_files_name = basename(dzi_image_paths[0]);
    cur_img_name = img_files_name.substring(0, img_files_name.length - 4);

    //assemble_datasets();
    overlay_initialization();
    //create_image_set_table(); //dataset_images["all"]);
    create_models_table();
    set_count_chart_data();
    draw_count_chart();


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
        disableSelect: true,
        readOnly: true,
        formatter: formatter
    });

    viewer.addHandler("open", function(event) {
        

        let img_files_name = basename(event.source);
        let img_name = img_files_name.substring(0, img_files_name.length - 4);

        //let img_status = image_set_data["images"][img_name]["status"];
        //console.log("img_status", img_status);
        cur_img_name = img_name;
        let cur_status = overlays["annotations"][cur_img_name]["status"];
        let use = used_for[cur_img_name];

        $("#image_name").text(cur_img_name);
        $("#image_status").text(cur_status);
        $("#used_for").text(use);




        update_overlays();
        update_count_chart();
        //update_overlays();
        //update_count_chart();
    });


    show_image();


    $("#models_table").change(function() {
        update_overlays();
    });


    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);

        $("#slider_val").html(slider_val);
        update_overlays();
        set_count_chart_data();
        update_count_chart();
    });

    $("#confidence_slider").on("input", function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#slider_val").html(slider_val);
    });

    $("#scores_checkbox").change(function() {
        update_overlays();
    });

    $("#chart_combo").change(function() {
        set_count_chart_data();
        update_count_chart();
    });

    $("#filter_combo").change(function() {
        create_image_set_table();
    })

});