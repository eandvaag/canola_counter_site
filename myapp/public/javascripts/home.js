


function update_containers() {
    let width = $(window).width();
    if (width < 1000) {
        $("#home_container").removeClass("grid-container-2");
        $("#home_container").addClass("grid-container-1");
    }
    else {
        $("#home_container").removeClass("grid-container-1");
        $("#home_container").addClass("grid-container-2");     
    }
}

function annotate_request() {

    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    window.location.href = "/plant_detection/annotate/" + farm_name + "/" +
                           field_name + "/" + mission_date;

/*
    $.post($(location).attr('href'),
    {
        farm_name: farm_name,
        field_name: field_name,
        mission_date: mission_date
    },
    function(response, status) {
        if (response.error) { 
            console.log(response.error);
        }
        else {
            window.location.href = response.redirect;
        }
    });
*/
}


function show_image_set_details() {

    console.log("showing image set details")
    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    let img_set_url = "/plant_detection/usr/data/image_sets/" + 
                        farm_name + "/" + field_name + "/" + mission_date + "/" +
                        "image_set_data.json";
    cur_img_set_config = get_json(img_set_url);

    let image_set_name = farm_name + "  |  " + field_name + "  |  " + mission_date;

    $("#right_panel").empty()

    $("#right_panel").append(`<div><h class="header2" `+
                           `style="font-size: 22px; text-align: center; white-space: pre-wrap; color: white">`+
                           `${image_set_name}</h></div>`);
    $("#right_panel").append(`<div id="img_set_config" class="scrollable_padded_area" style="height: 390px";"></div>`);

    
    $("#img_set_config").append(`<div><h class="header2" `+
                               `style="font-size: 22px; text-align: center; word-wrap: break-word; color: white">`+
                               `Metadata</h></div>`);
    $("#img_set_config").append(`<br>`);
    $("#img_set_config").append(`<table id="img_set_metadata_table"></table>`);


    let field_col_width = "265px";
    let val_col_width = "225px";


    let fields = ["Number of Images", "Number of Annotations"];
    let vals = [cur_img_set_config["num_images"], cur_img_set_config["annotation_counts"]["plant"], 
                Object.keys(cur_img_set_config["class_map"]).length];

    let max_width_fields = get_max_name_width(fields, "16px arial") + "px";
    let max_width_vals = get_max_name_width(vals, "16px arial") + "px";
    for (let i = 0; i < fields.length; i++) {
        $("#img_set_metadata_table").append(`<tr>` +
            `<td style="width: ${field_col_width}">` +
                `<div style="width: ${max_width_fields}; margin: 0 auto; text-align: left">${fields[i]}</div></td>`+
            `<td style="width: ${val_col_width}">` +
                `<div style="width: ${max_width_vals}; margin: 0 auto; text-align: right">${vals[i]}</div></td>`+
            `</tr>`);
    }

    $("#img_set_config").append(`<br><hr><br>`);
    $("#img_set_config").append(`<div><h class="header2" `+
                               `style="font-size: 22px; text-align: center; word-wrap: break-word; color: white">`+
                               `Images</h></div>`);
    $("#img_set_config").append(`<br>`);
    $("#img_set_config").append(`<table id="img_set_table"></table>`);

    let image_name_col_width = "200px";
    let image_status_col_width = "200px";

    $("#img_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${image_name_col_width};">Name</div></th>` +
            `<th><div class="table_header" style="width: ${image_status_col_width}">Status</div></th>` +
            `</tr>`);

    let img_names = natsort(Object.keys(cur_img_set_config["images"]));
    for (img_name of img_names) {
        let img_status = cur_img_set_config["images"][img_name]["status"];
        $("#img_set_table").append(`<tr>` +
            `<td><div>${img_name}</div></td>` +
            `<td><div>${img_status}</div></td>` +
            `</tr>`);

    }

    $("#right_panel").append(`<button id="annotate_button" class="std-button std-button-hover" `+
                               `onclick="annotate_request()">`+
                                `<span>Annotate</span></button>`);



/*
    $("#img_set_config").append(`<br><hr><br>`);
    $("#img_set_config").append(`<div><h class="header2" `+
                               `style="font-size: 22px; text-align: center; word-wrap: break-word; color: white">`+
                               `Annotation Breakdown</h></div>`);
    $("#img_set_config").append(`<br>`);
    $("#img_set_config").append(`<table id="img_set_table"></table>`);

    let dataset_name_col_width = "140px";
    let img_count_col_width = "100px";
    let box_count_col_width = "250px";

    let class_combo_width = get_max_name_width(Object.keys(cur_img_set_config["class_map"]), "16px arial") + 30 + "px";
    $("#img_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${dataset_name_col_width};">Dataset Name</div></th>` +
            `<th><div class="table_header" style="width: ${img_count_col_width}">Images</div></th>` +
            `<th><div class="table_header" style="width: ${box_count_col_width}">` +
                `<select class="dropdown" id="box_count_combo" onchange="update_box_counts()"` +
                `style="width: ${class_combo_width}; margin: 0px 10px; padding: 0px 0px"><select> Boxes`+
                `</div></th>` +
            `</tr>`);

    let dataset_name;
    let dataset_img_count;
    let box_count_id;
    let dataset_names = ["training", "validation", "test", "total"];
    let max_width_dataset_name = get_max_name_width(dataset_names, "bold 16px arial") + "px";
    let img_counts = [cur_img_set_config["num_training_images"],
                      cur_img_set_config["num_validation_images"],
                      cur_img_set_config["num_test_images"],
                      cur_img_set_config["num_annotated_images"]];
    let max_width_img_count = get_max_name_width(img_counts, "bold 16px arial") + "px";

    let dataset_name_style;
    let img_count_style;
    let box_count_style;
    for (let i = 0; i < dataset_names.length; i++) {
        dataset_name = dataset_names[i];
        dataset_img_count = img_counts[i];
        box_count_id = dataset_name + "_box_count";
        dataset_name_style = "width: " + max_width_dataset_name + "; margin: 0 auto; text-align: left;";
        img_count_style = "width: " + max_width_img_count + "; margin: 0 auto; text-align: right;";
        box_count_style = "margin: 0 auto; text-align: right;";

        if (i == dataset_names.length - 1) {
            dataset_name_style = dataset_name_style + " font-weight: bold";
            img_count_style = img_count_style + " font-weight: bold";
            box_count_style = box_count_style + " font-weight: bold";
        }
        $("#img_set_table").append(`<tr>` +
            `<td><div style="${dataset_name_style}">${dataset_name}</div></td>` +
            `<td><div style="${img_count_style}">${dataset_img_count}</div></td>` +
            `<td><div style="${box_count_style}" id=${box_count_id}></div></td>` +
            `</tr>`);
    }

    for (class_name of Object.keys(cur_img_set_config["class_map"])) {
        $("#box_count_combo").append($('<option>', {
            value: class_name,
            text: class_name
        }));
    }
    $("#box_count_combo").val(Object.keys(cur_img_set_config["class_map"])[0]).change();
    */
}



$(document).ready(function() {

    update_containers();

    console.log("image_sets_data", image_sets_data);

    for (const farm_name in image_sets_data) {
        $("#farm_combo").append($('<option>', {
            value: farm_name,
            text: farm_name
        }));
    }
    $("#farm_combo").prop("selectedIndex", -1);


    $("#farm_combo").change(function() {
        console.log("farm combo changed");

        let farm_name = $(this).val();

        $("#field_combo").empty();
        $("#mission_combo").empty();
        $("#right_panel").empty();

        for (const field_name in image_sets_data[farm_name]) {
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
        $("#right_panel").empty();

        for (const mission_date of image_sets_data[farm_name][field_name]) {
            $("#mission_combo").append($('<option>', {
                value: mission_date,
                text: mission_date
            }));
        }
        $("#mission_combo").val($("#mission_combo:first").val()).change();
    });

    $("#mission_combo").change(function() {
        show_image_set_details();

    })



    $(window).resize(function() {
        update_containers();
    });
});
