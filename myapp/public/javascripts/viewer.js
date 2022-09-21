

let image_set_info;
let job_config;
// let overlays;
let metadata;
let camera_specs;
let predictions;
let annotations;
let metrics;
let dzi_dir;
let dzi_image_paths;
let excess_green_record;
let download_uuid = "";
let map_download_uuid = "";
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
let cur_img_list;
let cur_view;
let cur_map_model_uuid;

let map_url = null;
let pred_map_url = null;
let min_max_rec = null;




function change_image(image_name) {
    cur_img_name = image_name;
    
    let index = cur_img_list.findIndex(x => x == cur_img_name);
    if (index == 0) {
        disable_std_buttons(["prev_image_button"]);
    }
    else {
        enable_std_buttons(["prev_image_button"]);
    }
    if (index == cur_img_list.length - 1) {
        disable_std_buttons(["next_image_button"]);
    }
    else {
        enable_std_buttons(["next_image_button"]);
    }


    $("#seadragon_viewer").empty();
    create_viewer_and_anno();
    viewer.open(image_to_dzi[cur_img_name]);
}

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
}


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


function create_image_set_table() {


    let image_name_col_width = "180px";
    let image_status_col_width = "60px";

    $("#image_set_table").empty();

    let filter_val = $("#filter_combo").val();

    let abbreviation = {
        "unannotated": "Un.",
        "started": "St.",
        "completed_for_training": "C. Tr.",
        "completed_for_testing": "C. Te."
    };

    cur_img_list = [];
    for (let image_name of natsort(Object.keys(annotations))) {
        if ((filter_val === "all") || (annotations[image_name]["status"] === filter_val)) {

            let image_status = annotations[image_name]["status"];
            let abbreviated_status = abbreviation[image_status];
            let image_color = status_color[image_status];

            $("#image_set_table").append(`<tr>` +

            `<td><div class="table_entry std_tooltip" style="margin: 0px 1px; background-color: ${image_color}; cursor: default; position: relative; width: ${image_status_col_width}; border: 1px solid white">${abbreviated_status}</div></td>` +
            `<td><div class="table_button table_button_hover" style="width: ${image_name_col_width}; margin: 0px 1px;" ` +
             `onclick="change_image('${image_name}')">${image_name}</div></td>` +
            `</tr>`);

            cur_img_list.push(image_name);
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
    if ($("#annotations").is(":checked")) {
        for (let annotation of annotations[cur_img_name]["annotations"]) {
            anno.addAnnotation(annotation);
        }
    }
    let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
    if ((cur_img_name in predictions) && ($("#predictions").is(":checked"))) {
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


function build_map() {
    disable_buttons(["build_map_button"]);
    $("#build_loader").show();
    //let sel_metric = $("input[type='radio'][name='metric']:checked").val();
    let sel_interpolation = $("input[type='radio'][name='interpolation']:checked").val();
    //let sel_model = $("input[type='radio'][name='map_model']:checked").val();
    let sel_pred_image_status = $("input[type='radio'][name='pred_image_status']:checked").val();
    //let comparison_type = $("input[type='radio'][name='comparison_type']:checked").val();

    //let include_annotated_map = $("input[type='radio'][name='include_annotated_map']:checked").val() === "yes";
    
    

    $.post($(location).attr('href'),
    {
        action: "build_map",
        //metric: sel_metric,
        interpolation: sel_interpolation,
        //model_uuid: sel_model,
        pred_image_status: sel_pred_image_status,
        annotation_version: $("#annotation_version_combo").val(),
        map_download_uuid: map_download_uuid
        //comparison_type: "side_by_side", //comparison_type
        //include_annotated_map: include_annotated_map 
        //image_set_data: JSON.stringify(image_set_data)
    },
    
    function(response, status) {
        $("#build_loader").hide();
        enable_buttons(["build_map_button"]);

        if (response.error) {
            show_modal_message("Error", "An error occurred while creating the density map.");
        }
        else {

            let map_download_uuid = response.map_download_uuid;
            //cur_map_model_uuid = sel_model;

            let timestamp = new Date().getTime();
            
            let base = get_CC_PATH() + "/usr/data/" + username + "/image_sets/" + image_set_info["farm_name"] + "/" + 
                        image_set_info["field_name"] + "/" + image_set_info["mission_date"] + "/model/results/" +
                        image_set_info["timestamp"] + "/maps/" + map_download_uuid;

            map_url = base + "_annotated_map.svg?t=" + timestamp;


            // if (comparison_type === "diff") {
            //     pred_map_url = base + "difference_map.svg?t=" + timestamp;
            //     diff_map = true;
            // }
            // else {
            pred_map_url = base + "_predicted_map.svg?t=" + timestamp;
                // diff_map = false;
            // }


            let min_max_rec_url = base + "_min_max_rec.json?t=" + timestamp;
            min_max_rec = get_json(min_max_rec_url);

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
    for (let image_name of Object.keys(annotations)) {
        let status = annotations[image_name]["status"];
        if (status === "completed_for_training" || status === "completed_for_testing") {
            num_completed++;
        }
    }
    if (num_completed >= 3) {
        $("#sufficient_annotation_options").show();
    }
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
        prefixUrl: get_CC_PATH() + "/osd/images/",
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

        let cur_status = annotations[cur_img_name]["status"];

        $("#image_name").text(cur_img_name);
        $("#image_status").text(status_to_text[cur_status]);

        update_overlays();
        update_count_chart();
        update_score_chart();

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


    for (let image_status of Object.keys(status_color)) {
        let color = status_color[image_status];
        let text = status_to_text[image_status];
        $("#filter_combo").append(`<option style="background-color: ${color}" value="${image_status}">${text}</option>`);
    }



    $("#request_csv_button").click(function() {

        let farm_name = image_set_info["farm_name"];
        let field_name = image_set_info["field_name"];
        let mission_date = image_set_info["mission_date"];
        let timestamp = image_set_info["timestamp"];

        show_modal_message("Preparing Download", 
        `<div id="prep_csv_message">Preparing CSV file...</div><div id="prep_csv_loader" class="loader"></div>` +
        `<div style="text-align: center; margin-top: 20px"><a class="table_button table_button_hover" id="download_button" hidden>` +
        `<i class="fa fa-download fa-sm"></i><span style="margin-left: 10px">Download Results</span></a></div>`);

        $("#modal_close").hide();

        $.post($(location).attr('href'),
        {
            action: "create_csv",
            download_uuid: download_uuid,
            annotation_version: $("#annotation_version_combo").val()
        },
        
        function(response, status) {
            $("#prep_csv_loader").hide();
            $("#modal_close").show();

            if (response.error) {
                $("#modal_head_text").html("Error");
                $("#prep_csv_message").html("An error occurred while generating the results file.");

            }
            else {
                $("#modal_head_text").html("Ready For Download");
                $("#prep_csv_message").html("Your results file has been created. Click the button to download the results.");
                $("#download_button").show();
    
                download_uuid = response.download_uuid;

                let download_path = get_CC_PATH() + "/download/" + 
                                    username + "/" +
                                    farm_name + "/" + 
                                    field_name + "/" + 
                                    mission_date + "/" +
                                    timestamp + "/" + 
                                    download_uuid;


                $("#download_button").attr("href", download_path);


                let close_timeout_handler = setTimeout(function() {
                    $("#modal_close").click();
                }, 3600 * 1000);

                $("#modal_close").click(function() {
                    clearTimeout(close_timeout_handler);
                    close_modal();
                });

            }

        });
    })

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

    disable_std_buttons(["prev_image_button"]);
    if (dzi_image_paths.length == 1) {
        disable_std_buttons(["next_image_button"]);
    }

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
        // $('#chart_combo').append(`<option value="Count per square meter">Count / m&sup2;</option>`);
    }
    $('#chart_combo').append($('<option>', {
        value: "MS COCO mAP",
        text: "MS COCO mAP"
    }));
    // $('#chart_combo').append($('<option>', {
    //     value: "PASCAL VOC mAP",
    //     text: "PASCAL VOC mAP"
    // }));
    // $('#chart_combo').append($('<option>', {
    //     value: "Ground Cover Percentage",
    //     text: "Ground Cover Percentage"
    // }));


    cur_view = "image";

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
    


    //let img_files_name = basename(dzi_image_paths[0]);
    //cur_img_name = img_files_name.substring(0, img_files_name.length - 4);

    //assemble_datasets();
    // overlay_initialization();
    set_prediction_overlay_color();
    //create_image_set_table(); //dataset_images["all"]);
    create_image_set_table();
    
    create_overlays_table();
    set_count_chart_data();
    set_score_chart_data();
    draw_count_chart();
    draw_score_chart();

    create_viewer_and_anno();

    //show_image();


    $("#overlays_table").change(function() {
        update_overlays();
    });


    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);
        $("#slider_val").html(slider_val);
        update_overlays();
        set_count_chart_data();
        update_score_chart();
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

    $("#next_image_button").click(function() {

        let index = cur_img_list.findIndex(x => x == cur_img_name) + 1;
        // if (index > 0) {
        //     enable_std_buttons(["prev_image_button"]);
        // }
        // if (index == dzi_image_paths.length - 1) {
        //     disable_std_buttons(["next_image_button"]);
        // }
        change_image(cur_img_list[index]);
    
    });

    $("#prev_image_button").click(function() {

        let index = cur_img_list.findIndex(x => x == cur_img_name) - 1;
        // if (index < dzi_image_paths.length - 1) {
        //     enable_std_buttons(["next_image_button"]);
        // }
        // if (index == 0) {
        //     disable_std_buttons(["prev_image_button"]);
        // }
        change_image(cur_img_list[index]);
    
    });


    $("#annotation_version_combo").change(function() {
        let version = $("#annotation_version_combo").val();

        show_modal_message("Please Wait", 
        `<div id="switch_anno_message">Switching annotation versions...</div><div id="switch_anno_loader" class="loader"></div>`);

        $("#modal_close").hide();

        // a(class="table_button table_button_hover" style="padding: 5px 10px;" id="download_button" download)
        //     i(class="fa fa-download fa-sm")
        //     span(style="margin-left: 10px") Download Results 

        download_uuid = "";
        $.post($(location).attr('href'),
        {
            action: "switch_annotation_version",
            // username: username,
            // farm_name: farm_name,
            // field_name: field_name,
            // mission_date: mission_date,
            // results_timestamp: timestamp,
            annotation_version: version
        },
        
        function(response, status) {
            if (response.error) {
                show_modal_message("Error", "An error occurred while switching annotation versions.");
                if (version === "most_recent") {
                    $("#annotation_version_combo").val("preserved");
                }
                else {
                    $("#annotation_version_combo").val("most_recent");
                }
            }
            else {
                annotations = response["annotations"];
                metrics = response["metrics"];
                excess_green_record = response["excess_green_record"];
                download_uuid = response["download_uuid"];

                //$("#filter_combo").val("all");

                $("#chart_container").empty();
                $("#interpolation_linear").prop("checked", true);
                $("#pred_image_status_all").prop("checked", true);


                $("#filter_combo").val("all").change();
                //create_image_set_table();
                //create_overlays_table();
                set_count_chart_data();
                set_score_chart_data();
                update_count_chart();
                update_score_chart();
            
                // $("#seadragon_viewer").empty();
                // create_viewer_and_anno();

                let init_image_name = basename(dzi_image_paths[0]);
                //cur_img_name = init_image_name.substring(0, init_image_name.length - 4);
                change_image(init_image_name.substring(0, init_image_name.length - 4));

                $("#modal_close").click();
            }


        });
    });




});

