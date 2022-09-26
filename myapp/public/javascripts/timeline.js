let annotations;
let predictions;
let metadata;
let camera_specs;
let mAP_calculation_state = "started";

let sorted_timestamps;

let metric_text_lookup = {
    "pred_count": "Predicted Count",
    "pred_density": "Predicted Count / m&sup2;",
    "score_quality": "Estimated Quality of Scores",
    "pred_count_minus_annotated_count": "Predicted Count - Annotated Count",
    "pred_density_minus_annotated_density": "(Predicted Count / m&sup2;) - (Annotated Count / m&sup2;)",
    "percent_count_error": "Percent Count Error",
    "MS_COCO_mAP": "MS COCO mAP"
}

function calculate_mAP() {

    $.post($(location).attr('href'),
    {
        action: "calculate_mAP"
    },
    
    function(response, status) {

        if (response.error) {
            mAP_calculation_state = "error";
        }
        else {

            let metrics = response.metrics;

            timeline_data["MS_COCO_mAP"] = [];
            for (let image_name of Object.keys(annotations)) {
                let completed = ((annotations[image_name]["status"] === "completed_for_training") || (annotations[image_name]["status"] === "completed_for_testing"));
                if (completed) {
                    let mAP_vals = [];
                    let i = 0;
                    for (let timestamp of sorted_timestamps) {
                        let mAP_val = metrics[timestamp][image_name]["MS COCO mAP"];
                        mAP_vals.push([i, mAP_val]);
                        i++;
                    }

                    timeline_data["MS_COCO_mAP"].push({
                        "image_name": image_name,
                        "values": mAP_vals
                    });
                }
            }

            mAP_calculation_state = "finished";
        }

        let cur_metric = $("#metric_combo").val();
        if (cur_metric === "MS_COCO_mAP") {
            update_timeline_chart();
        }
        
    });
}

function add_metric_combo_options() {

    let status_val = $("#status_combo").val();

    let prev_metric = $("#metric_combo").val();

    $("#metric_combo").empty();

    let options;
    let include_density = can_calculate_density(metadata, camera_specs);
    if ((status_val == "all" || status_val == "unannotated") || status_val == "started") {
        if (include_density) {
            options = ["pred_count", "pred_density", "score_quality"];
        }
        else {
            options = ["pred_count", "score_quality"];
        }
    }
    else {
        if (include_density) {
            options = ["pred_count", "pred_density", "pred_count_minus_annotated_count", 
                        "pred_density_minus_annotated_density", "percent_count_error", "MS_COCO_mAP", "score_quality"];
        }
        else {
            options = ["pred_count", "pred_count_minus_annotated_count", "percent_count_error", "MS_COCO_mAP", "score_quality"];
        }
    }

    for (let option of options) {
        let text = metric_text_lookup[option];
        $("#metric_combo").append(`<option value=${option}>${text}</option>`);
    }

    if (options.includes(prev_metric)) {
        $("#metric_combo").val(prev_metric);
    }
    else {
        $("#metric_combo").val(options[0]);
    }

}


$(document).ready(function() {

    annotations = data["annotations"];
    predictions = data["predictions"];

    metadata = data["metadata"];
    camera_specs = data["camera_specs"];

    let pieces = window.location.pathname.split("/"); //
    let farm_name = pieces[pieces.length - 3];
    let field_name = pieces[pieces.length - 2];
    let mission_date = pieces[pieces.length - 1];
    $("#image_set_name").text(farm_name + "  |  " + 
                              field_name + "  |  " + 
                              mission_date);

    sorted_timestamps = Object.keys(predictions).sort();

    calculate_mAP();

    for (let image_status of Object.keys(status_color)) {
        let color = status_color[image_status];
        let text = status_to_text[image_status];
        $("#status_combo").append(`<option style="background-color: ${color}" value="${image_status}">${text}</option>`);
    }

    add_metric_combo_options();
    set_timeline_data();
    draw_timeline_chart();


    $("#status_combo").change(function() {
        $("#status_combo").css("background-color", status_color[$("#status_combo").val()]);

        add_metric_combo_options();
        draw_timeline_chart();
    });

    $("#metric_combo").change(function() {
        update_timeline_chart();
    });
   


});