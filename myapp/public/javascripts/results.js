


function show_image_set_details() {
    let farm_name = $("#farm_combo").val();
    let field_name = $("#field_combo").val();
    let mission_date = $("#mission_combo").val();

    console.log("found groups", results_data[farm_name][field_name][mission_date]);

    let group_col_width = "300px";
    let started_col_width = "100px";
    let finished_col_width = "100px";

    $("#image_set_table").empty();
    $("#image_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${group_col_width};">Groups</div></th>` +
            `<th><div class="table_header" style="width: ${started_col_width};">Started</div></th>` +
            `<th><div class="table_header" style="width: ${finished_col_width};">Finished</div></th>` +
            `<tr>`);
    let group_configs = [];
    for (const group_uuid of results_data[farm_name][field_name][mission_date]) {
        let group_url = "/plant_detection/usr/data/groups/" + group_uuid + ".json";
    
        let group_config = get_config(group_url);
        group_configs.push(group_config);
    }
    group_configs.sort(function(a, b) {
        return a["end_time"] - b["end_time"];
    });
    console.log("showing group_configs");
    for (group_config of group_configs) {
        //let group_config_str = JSON.stringify(group_config, null, 4);

        let group_name = group_config["group_name"];
        let start_time = group_config["start_time"];
        let end_time = group_config["end_time"];
        $("#image_set_table").append(`<tr>` +
        `<td><div class="table_button table_button_hover"` +
             `onclick="view_group('${group_uuid}')">${group_name}</div></td>` +
             `<td><div class="table_entry">${start_time}</div></td>` +   
             `<td><div class="table_entry">${end_time}</div></td>` +             
        //`<td><div>${extensionless_name}</div></td>` +
        //`<td><div class="table_entry">${image_status}</div></td>` +
        //`<td><div class="table_entry">${img_dataset}</div></td>` +
        `</tr>`);

    }
}

function view_group(group_uuid) {
    console.log("request to view group", group_uuid);


    $.post($(location).attr('href'),
    {
        farm_name: $("#farm_combo").val(),
        field_name: $("#field_combo").val(),
        mission_date: $("#mission_combo").val(),
        group_uuid: group_uuid,
    },
    function(response, status) {
        if (response.error) { 
            console.log("error occurred", response.error);
        }
        else {
            window.location.href = response.redirect;
        }
    });
}

$(document).ready(function() {

    //update_containers();

    console.log("results_data", results_data);

    for (const farm_name in results_data) {
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

        for (const field_name in results_data[farm_name]) {
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

        for (const mission_date in results_data[farm_name][field_name]) {
            $("#mission_combo").append($('<option>', {
                value: mission_date,
                text: mission_date
            }));
        }
        $("#mission_combo").val($("#mission_combo:first").val()).change();
    });

    $("#mission_combo").change(function() {
        show_image_set_details();
    });
});
