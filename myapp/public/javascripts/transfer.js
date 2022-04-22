let results;
let sel_metric = null;

function get_config(url) {
    let config;
    $.ajax({
        url: url,
        async: false,
        dataType: 'json',
        success: function (r_config) {
            config = r_config;
        }
    });
    return config;
}

$(document).ready(function() {

    for (farm_name of natsort(Object.keys(image_sets_data))) {
        $("#farm_combo").append($('<option>', {
            value: farm_name,
            text: farm_name
        }));
    }
    $("#farm_combo").prop("selectedIndex", -1);



    $("#farm_combo").change(function() {

        let farm_name = $(this).val();

        $("#field_combo").empty();
        $("#mission_combo").empty();
        $("#metric_combo").empty();
        $("#transfer_chart").empty();

        for (field_name of natsort(Object.keys(image_sets_data[farm_name]))) {
            $("#field_combo").append($('<option>', {
                value: field_name,
                text: field_name
            }));
        }
        $("#field_combo").val($("#field_combo:first").val()).change();
    });

    $("#field_combo").change(function() {

        let farm_name = $("#farm_combo").val();
        let field_name = $(this).val();

        $("#mission_combo").empty();
        $("#metric_combo").empty();
        $("#transfer_chart").empty();

        for (mission_date of natsort(image_sets_data[farm_name][field_name])) {
            $("#mission_combo").append($('<option>', {
                value: mission_date,
                text: mission_date
            }));
        }
        $("#mission_combo").val($("#mission_combo:first").val()).change();
    });

    $("#mission_combo").change(function() {
        let sel_farm = $("#farm_combo").val();
        let sel_field = $("#field_combo").val();
        let sel_mission = $("#mission_combo").val();

        let results_url = "/plant_detection/usr/data/runs/display/" + 
                          sel_farm + "/" + sel_field + "/" + sel_mission + "/results.json";
        results = get_config(results_url);

        console.log("got results", results);

        $("#metric_combo").empty();
        $("#transfer_chart").empty();

        let methods = Object.keys(results["results"]);

        for (metric of natsort(Object.keys(results["results"][methods[0]]))) {
            $("#metric_combo").append($('<option>', {
                value: metric,
                text: metric
            }));
        }

        if (sel_metric !== null) {
            $("#metric_combo").val(sel_metric);
        }
        draw_transfer_chart();
    });
    
    $("#metric_combo").change(function() {
        sel_metric = $("#metric_combo").val();
        update_transfer_chart();
    });
});