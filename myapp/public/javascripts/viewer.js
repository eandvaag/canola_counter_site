

let image_set_info;
let job_config;
let overlays;
let metadata;
let camera_specs;
let predictions;
let annotations;
let metrics;
let dzi_dir;
let dzi_image_paths;
let excess_green_record;
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
let cur_view;
let cur_map_model_uuid;

let map_url = null;
let pred_map_url = null;
// let diff_map = false;
let min_max_rec = null;






function change_image(image_name) {
    console.log("change_image", image_name);
    cur_img_name = image_name;
    $("#seadragon_viewer").empty();
    create_viewer_and_anno();
    viewer.open(image_to_dzi[cur_img_name]);
}

function overlay_initialization() {

    for (const [overlay_name, overlay] of Object.entries(overlays)) {

        let color_id = overlay["color_id"];
        for (image_name of Object.keys(overlay["overlays"])) {
            for (annotation of overlay["overlays"][image_name]["annotations"]) {
                annotation["body"].push({"value": color_id, "purpose": "highlighting"})
            }
        }
    }
}


function create_overlays_table() {

    let models_col_width = "215px";
    for (const [overlay_name, overlay] of Object.entries(overlays)) {
        let overlay_color = overlay["color"];
        let model_row_id = overlay_name + "_row";
        $("#models_table").append(`<tr id=${model_row_id}>` +
            `<td><label class="table_label" ` +
            `style="width: ${models_col_width}; background-color: ${overlay_color};">` +
            `<table class="transparent_table">` +
            `<tr>` + 
            `<td style="width: 40px">` +
                `<label class="switch">` +
                `<input id=${overlay_name} type="checkbox"></input>` +
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


function create_image_set_table() {


    let image_name_col_width = "170px";
    let image_status_col_width = "60px";

    $("#image_set_table").empty();
    /*
    $("#image_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${image_name_col_width};">Name</div></th>` +
            //`<th><div class="table_header" style="width: ${image_status_col_width}">Annotation Status</div></th>` +
            //`<th><div class="table_header" style="width: ${image_dataset_col_width}">Assigned Dataset</div></th>` +
            `</tr>`);*/
    //for (dzi_image_path of dzi_image_paths) {

    let filter_val = $("#filter_combo").val();
    console.log("filter_val", filter_val);
    /*
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
    }*/


    let abbreviation = {
        "unannotated": "Un.",
        "started": "St.",
        "completed_for_training": "C. Tr.",
        "completed_for_testing": "C. Te."
    };

    for (image_name of natsort(Object.keys(annotations))) {
        if ((filter_val === "all") || (annotations[image_name]["status"] === filter_val)) {

            //for (image_name of selected_image_names) {
            //let image_name = basename(dzi_image_path)
            //let extensionless_name = image_name.substring(0, image_name.length - 4);
            //let dzi_image_path = dzi_dir + "/" + image_name + ".dzi";

            //let img_status = image_set_data["images"][extensionless_name]["status"];
            let image_status = annotations[image_name]["status"];
            let abbreviated_status = abbreviation[image_status];
            $("#image_set_table").append(`<tr>` +
           
            //`<td><div>${extensionless_name}</div></td>` +
            `<td><div class="table_entry std_tooltip" style="cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}` +
            `<span class="std_tooltiptext">${image_status}</span></div></td>` +

            `<td><div class="table_button table_button_hover" style="width: ${image_name_col_width}" ` +
            // `onclick="change_image('${dzi_image_path}')">${extensionless_name}</div></td>` +
             `onclick="change_image('${image_name}')">${image_name}</div></td>` +
            //`</div></td>` + 
            //`<td><div class="table_entry">${img_dataset}</div></td>` +
            `</tr>`);
        }
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

        //rounded_score = scoreTag.value.toFixed(2);

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
    //for (overlay_id of sorted_overlay_ids) {
    console.log("overlays", overlays);
    for (const [overlay_name, overlay] of Object.entries(overlays)) {
        if (cur_img_name in overlay["overlays"] && $("#" + overlay_name).is(":checked")) {
            for (annotation of overlay["overlays"][cur_img_name]["annotations"]) {
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
    //let sel_model = $("input[type='radio'][name='map_model']:checked").val();
    let sel_pred_image_status = $("input[type='radio'][name='pred_image_status']:checked").val();
    let comparison_type = $("input[type='radio'][name='comparison_type']:checked").val();

    //let include_annotated_map = $("input[type='radio'][name='include_annotated_map']:checked").val() === "yes";
    //console.log("include_annotated_map", include_annotated_map);
    //console.log("sel_metric", sel_metric);
    console.log("sel_interpolation", sel_interpolation);
    
    

    $.post($(location).attr('href'),
    {
        action: "build_map",
        //metric: sel_metric,
        interpolation: sel_interpolation,
        //model_uuid: sel_model,
        pred_image_status: sel_pred_image_status,
        comparison_type: "side_by_side", //comparison_type
        //include_annotated_map: include_annotated_map 
        //image_set_data: JSON.stringify(image_set_data)
    },
    
    function(response, status) {
        $("#build_loader").hide();
        enable_build();

        if (response.error) {    
            console.log("error occurred");
            // diff_map = false;
            pred_map_url = null;
            map_url = null;
            draw_map_chart();
        }
        else {
            console.log("showing map");
            //cur_map_model_uuid = sel_model;

            let timestamp = new Date().getTime();
            
            let base = "/plant_detection/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
                        image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/model/results/" +
                        image_set_info["timestamp"] + "/maps/";

            map_url = base + "annotated_map.svg?t=" + timestamp;


            // if (comparison_type === "diff") {
            //     pred_map_url = base + "difference_map.svg?t=" + timestamp;
            //     diff_map = true;
            // }
            // else {
            pred_map_url = base + "predicted_map.svg?t=" + timestamp;
                // diff_map = false;
            // }


            let min_max_rec_url = base + "min_max_rec.json?t=" + timestamp;
            min_max_rec = get_json(min_max_rec_url);

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
    
    
    //create_map_models_radio();
    $("#map_builder_controls_container").show();


    let num_completed = 0;
    for (image_name of Object.keys(annotations)) {
        let status = annotations[image_name]["status"];
        if (status === "completed_for_training" || status === "completed_for_testing") {
            num_completed++;
        }
    }
    console.log("num_completed", num_completed);
    if (num_completed >= 3) {
        $("#sufficient_annotation_options").show();
    }
    //else {
        //$("#map_builder_controls_container").hide();
        //$("#insufficient_annotation_container").show();
    //}

    
    draw_map_chart();
}


function show_image(image_name) {
    cur_view = "image";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-location-dot" style="padding-right: 10px; color: white;"></i>Map View`);
    
    $("#map_view_container").hide();
    $("#image_view_container").show();

    change_image(image_name);
    
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


function create_viewer_and_anno() {

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
        

        //let img_files_name = basename(event.source);
        //let img_name = img_files_name.substring(0, img_files_name.length - 4);

        //let img_status = image_set_data["images"][img_name]["status"];
        //console.log("img_status", img_status);
        //cur_img_name = img_name;
        let cur_status = annotations[cur_img_name]["status"];
        //let use = used_for[cur_img_name];

        $("#image_name").text(cur_img_name);
        $("#image_status").text(cur_status);
        //$("#used_for").text(use);




        update_overlays();
        update_count_chart();

    });

}

$(document).ready(function() {
    
    image_set_info = data["image_set_info"];
    job_config = data["job_config"];
    //overlays = data["overlays"];
    excess_green_record = data["excess_green_record"];
    annotations = data["annotations"];
    predictions = data["predictions"];
    metadata = data["metadata"];
    camera_specs = data["camera_specs"];
    metrics = data["metrics"];
    dzi_dir = data["dzi_dir"];
    dzi_image_paths = data["dzi_image_paths"];

    overlays = {
        "annotations": {   
            "overlays": annotations,
            "color_id": "COLOR_0",
            "color": "#0080C0",
        },
        "predictions": {
            "overlays": predictions,
            "color_id": "COLOR_1",
            "color": "#FF4040",
        }
    };

    /*
    let download_path = "/plant_detection/usr/data/results/" + image_set_info["farm_name"] + "/" +
    image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/" +
                        job_config["job_uuid"] + "/results.xlsx";*/

    let farm_name = image_set_info["farm_name"];
    let field_name = image_set_info["field_name"];
    let mission_date = image_set_info["mission_date"];
    let timestamp = image_set_info["timestamp"];
    
    let download_path = "/plant_detection/usr/data/" + username + "/image_sets/" + farm_name + "/" +
                        field_name + "/" + mission_date + "/model/results/" + timestamp + "/results.csv";
    
    console.log("download_path", download_path);
    $("#download_button").attr("href", download_path);

    image_to_dzi = {};
    for (dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path);
        let extensionless_name = image_name.substring(0, image_name.length - 4);
        image_to_dzi[extensionless_name] = dzi_image_path;
    }
    let init_image_name = basename(dzi_image_paths[0]);
    cur_img_name = init_image_name.substring(0, init_image_name.length - 4);



    $("#image_set_name").text(farm_name + "  |  " + 
                              field_name + "  |  " + 
                              mission_date);



    $('#chart_combo').append($('<option>', {
        value: "Count",
        text: "Count"
    }));
    if (can_calculate_density(metadata, camera_specs)) {
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
    $('#chart_combo').append($('<option>', {
        value: "Ground Cover Percentage",
        text: "Ground Cover Percentage"
    }));


    /*
    let test_reserved_images = [];
    for (image_set_conf of job_config["training"]["image_sets"]) {
        if (((image_set_conf["farm_name"] === image_set_info["farm_name"]) &&
            (image_set_conf["field_name"] === image_set_info["field_name"])) &&
            (image_set_conf["mission_date"] === image_set_info["mission_date"])) {
                test_reserved_images = image_set_conf["test_reserved_images"];
                break;
            }
    }*/

/*

    image_names["all"] = natsort(Object.keys(data["overlays"]["annotations"]));
    for (image_name of image_names["all"]) {

        let status = data["overlays"]["annotations"][image_name]["status"];
        if (status === "completed") {
            image_names["completed"].push(image_name);

            if (test_reserved_images.includes(image_name)) {
                image_names["testing"].push(image_name)
                used_for[image_name] = "testing";
            }
            else {
                image_names["training/validation"].push(image_name);
                used_for[image_name] = "training/validation";
            }

        }
        else if (status === "unannotated") {
            image_names["unannotated"].push(image_name);
            used_for[image_name] = "NA";
        }
    }*/


    cur_view = "image";

    if (can_calculate_density(metadata, camera_specs)) {

        $("#view_button_container").show();

        $("#view_button").click(function() {

            console.log("Clicked view button");

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
    overlay_initialization();
    //create_image_set_table(); //dataset_images["all"]);
    create_image_set_table();
    
    create_overlays_table();
    set_count_chart_data();
    draw_count_chart();

    create_viewer_and_anno();

    //show_image();


    $("#models_table").change(function() {
        update_overlays();
    });


    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        console.log("slider_val is", slider_val);
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
    });

    $("#download_button").click(function() {
        console.log("downloading results");
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



});

