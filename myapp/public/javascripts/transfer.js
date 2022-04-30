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

let metrics = [
    "MS COCO mAP",
    "PASCAL VOC mAP",
    "Image Mean Abs. Diff. in Count",
    "Image Mean Abs. Diff. in Count at Optimal Score Thresh.",
    "Image Mean Percent Error in Count",
    "Image Mean Percent Error in Count at Optimal Score Thresh.",
    "Optimal Score Thresh."
]

let image_set_stats;

$(document).ready(function() {



    let image_set_stats_url = "/plant_detection/usr/data/runs/display/image_set_stats.json";
    image_set_stats = get_config(image_set_stats_url);


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

        for (metric of metrics) { //natsort(Object.keys(results["results"][methods[0]]))) {
            $("#metric_combo").append($('<option>', {
                value: metric,
                text: metric
            }));
        }

        if (sel_metric !== null) {
            $("#metric_combo").val(sel_metric);
        }

        $("#image_set_info").empty();
        
        
        let num_annotated_images = image_set_stats[sel_farm][sel_field][sel_mission]["num_annotated_images"];
        let num_annotations = image_set_stats[sel_farm][sel_field][sel_mission]["num_annotations"];
        
        //let num_annotated_images = 37;
        //let num_annotations = 2991;

        
        $("#image_set_info").append(
            `<div style="border: 1px solid white; margin: 0px 10px">` + 
            `<div style="font-size: 18px; text-decoration: underline; padding: 5px 0px">Image Set Information</div>` +
            `<table class="transparent_table">` + 
                `<tr>` + 
                    `<td style="text-align: right; padding: 5px 0px">` +
                        `<h style="font-size: 18px; display: block; width: 250px">Number of annotated images:</h>` +
                    `</td>` +
                    `<td style="font-size: 18px; width: 100%; text-align: left; padding-left: 15px">` +
                        `<h>${num_annotated_images}</h>` +
                    `</td>` +
                `</tr>` +
                `<tr>` + 
                    `<td style="text-align: right;  padding: 5px 0px">` +
                        `<h style="font-size: 18px; display: block; width: 250px">Number of annotations:</h>` +
                    `</td>` +
                    `<td style="font-size: 18px; width: 100%; text-align: left;  padding-left: 15px">` +
                        `<h>${num_annotations}</h>` +
                    `</td>` +
                `</tr>` +
            `<table>` + 
            `</div>`
        );
        
        
        /*
            
            
            `<p>${num_annotated_images}</p>`);*/



/*
        tr
        td(style="text-align: left; width: 120px")
            h(class="header2" style="width: 150px") Filter by score: 

        td(style="width: 100%")
            div(class="slidecontainer")
*/


        draw_transfer_chart();
    });
    
    $("#metric_combo").change(function() {
        sel_metric = $("#metric_combo").val();
        update_transfer_chart();
    });
});