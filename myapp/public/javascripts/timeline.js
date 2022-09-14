let annotations;
let predictions;
let metadata;
let camera_specs;

let sorted_timestamps;

let metric_text_lookup = {
    "pred_count": "Predicted Count",
    "pred_density": "Predicted Count / m&sup2;",
    "score_quality": "Estimated Quality of Scores",
    "pred_count_minus_annotated_count": "Predicted Count - Annotated Count",
    "pred_density_minus_annotated_density": "(Predicted Count / m&sup2;) - (Annotated Count / m&sup2;)"
}

function add_metric_combo_options() {
    let status_val = $("#status_combo").val();

    let prev_metric = $("#metric_combo").val();

    $("#metric_combo").empty();

    let options;
    if ((status_val == "all" || status_val == "unannotated") || status_val == "started") {
        if (can_calculate_density(metadata, camera_specs)) {
            options = ["pred_count", "pred_density", "score_quality"];
        }
        else {
            options = ["pred_count", "score_quality"];
        }
    }
    else {
        if (can_calculate_density) {
            options = ["pred_count", "pred_density", "pred_count_minus_annotated_count", 
                        "pred_density_minus_annotated_density", "score_quality"];
        }
        else {
            options = ["pred_count", "pred_count_minus_annotated_count", "score_quality"];
        }
    }

    for (option of options) {
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

    sorted_timestamps = Object.keys(predictions).sort();

    for (image_status of Object.keys(status_color)) {
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

        //$("#metric_combo").change();

        draw_timeline_chart();
    });

    $("#metric_combo").change(function() {
        update_timeline_chart();
    });
   


});