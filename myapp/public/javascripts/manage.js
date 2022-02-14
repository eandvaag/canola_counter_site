


function inspect_job(job_uuid) {
    inspected_job = job_uuid;
    if (first) {
        //console.log("setting interval");

        setInterval(inspect_job_internal, 10000);
        first = false;
    
    }
    //window.clearInterval();
    inspect_job_internal();
    
    //inspect_job_internal(job_uuid);
}

function inspect_unstopped_job(job_status) {


    let job_config = job_configs[inspected_job];

    $("#job_name").empty();
    $("#job_name").html(job_config["job_name"]);

    let model_name_col_width = "130px";
    let model_status_col_width = "130px";

    if (job_status === "Running") {
        $("#loader_area").empty();
        $("#loader_area").append(`<hr>`)
        $("#loader_area").append(`<div id="update_loader" class="loader" ` +
                                `style="float: left; margin: auto 0px; margin-left: 20px; width: 15px; height: 15px"></div>`);
        $("#loader_area").append(`<p style="margin: 0px; padding: 0px; padding-top:3px">Loss values are automatically updated every ten seconds.</p>`)
        
    }
    else {
        $("#loader_area").append(`<button class="x-button x-button-hover" style="width: 200px" onclick="destroy_job_request()">`+
        `<span><i class="fa-regular fa-circle-xmark" style="margin-right:8px"></i> Destroy Job</span></button>`);
    }
    //$("#update_loader").show();
    $("#job_info").empty();
    $("#job_info").append(`<select id="model_combo" class="nonfixed_dropdown" style="width: 150px;"></select>`);
    $("#job_info").append(`<br><br><hr>`)
    $("#job_info").append(`<table class="transparent_table" id="job_info_table"></table>`);
    $("#job_info_table").empty();
    $("#job_info_table").append(`<tr>` +
        `<th><div class="table_header" style="width: ${model_name_col_width};">Model Name</div></th>` +
        `<th><div class="table_header" style="width: ${model_status_col_width};">Status</div></th>` +
    `<tr>`);
    let model_uuids = [];
    for (model_rec of job_config["model_info"]) {
        let model_uuid = model_rec["model_uuid"];
        let model_name = model_rec["model_name"];
        let model_stage = model_rec["stage"];
        model_uuids.push(model_uuid);
        $("#job_info_table").append(`<tr style="height: 50px">` +
        `<td><div class="table_center_text">${model_name}</div></td>` +
        `<td><div class="table_center_text">${model_stage}</div></td>` +
        `<tr>`);
        $("#model_combo").append($('<option>', {
            value: model_uuid,
            text: model_name
        }));
    }

    $("#model_combo").prop("selectedIndex", job_config["model_info"].length-1);

    $.post($(location).attr('href'),
    {
        action: "get_loss_records",
        model_uuids: model_uuids.join(","),
    },
    function(response, status) {
        if (response.error) { 
            console.log("error occurred", response.error);
        }
        else {
            //console.log("obtained loss records");
            let loss_records = JSON.parse(response.loss_records);
            //console.log("loss_records", loss_records);
            draw_loss_chart(loss_records);
            //window.location.href = response.redirect;
        }
    });
}

function destroy_job_request() {

    $.post($(location).attr('href'),
    {
        action: "destroy_job",
        job_uuid: inspected_job,
    },
    function(response, status) {
        if (response.error) { 
            console.log("error occurred", response.error);
        }
        else {
            
            //console.log("obtained loss records");
            //let loss_records = JSON.parse(response.loss_records);
            //console.log("loss_records", loss_records);
            //draw_loss_chart(loss_records);
            //window.location.href = response.redirect;
            delete job_configs[inspected_job];
            $("#job_name").empty();
            $("#loss_chart").empty();
            $("#job_info").empty();
            $("#loader_area").empty();
            fill_jobs_table();

        }
    });

}
function inspect_stopped_job() {


    $("#job_name").empty();
    $("#job_name").html(job_config["job_name"]);

    let job_exception = job_configs[inspected_job]["exception"];
    $("#loss_chart").empty();
    $("#loss_chart").append(`<p>The job was stopped due to the following exception:<br>${job_exception}</p>`);
    $("#loader_area").empty();
    $("#loader_area").append(`<button class="x-button x-button-hover" style="width: 200px" onclick="destroy_job_request()">`+
                                `<span><i class="fa-regular fa-circle-xmark" style="margin-right:8px"></i> Destroy Job</span></button>`);
}

function inspect_job_internal() {
    //console.log("inspecting job", inspected_job);
    let job_status = job_configs[inspected_job]["status"];

    if (job_status === "Running") {
        inspect_unstopped_job(job_status);
    }
    else if (job_status === "Finished") {
        inspect_unstopped_job(job_status);
    }
    else {
        inspect_stopped_job();
    }
}

let sorted_job_configs;
let inspected_job;
let first = true;

let job_col_width = "200px";
let started_col_width = "180px";
let finished_col_width = "180px";
let status_col_width = "100px";

function fill_jobs_table() {

    update_sorted_job_configs();

    $("#jobs_table_content").empty();
    let filter_val = $("#filter_combo").val();



    for (job_config of sorted_job_configs) {
        if (filter_val === "All" || filter_val === job_config["status"]) {
            let job_uuid = job_config["job_uuid"];
            let job_name = job_config["job_name"];
            let start_time = job_config["start_time"];
            let end_time;
            let status = job_config["status"];
            if ("end_time" in job_config) {
                end_time = job_config["end_time"];
            }
            else {
                end_time = "---";
            }
    
            $("#jobs_table_content").append(`<tr>` + // style="height: 50px">` +
                `<td><div class="table_button table_button_hover" style="width: ${job_col_width};" onclick="inspect_job('${job_uuid}')">${job_name}</div></td>` +
                `<td><div class="table_entry" style="width: ${started_col_width};">${start_time}</div></td>` +
                `<td><div class="table_entry" style="width: ${finished_col_width};">${end_time}</div></td>` +
                `<td><div class="table_entry" style="width: ${status_col_width};">${status}</div></td>` +
            `<tr>`);
        }
    }
}

function update_sorted_job_configs() {

    sorted_job_configs = Object.values(job_configs);

    sorted_job_configs.sort(function(a, b) {
        let keyA = new Date(a.start_time);
        let keyB = new Date(b.start_time);
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });
}

$(document).ready(function() {
    

    console.log("job_configs", job_configs);

    $("#jobs_table_head").append(`<tr>` +
        `<th><div class="table_header" style="width: ${job_col_width};">Job Name</div></th>` +
        `<th><div class="table_header" style="width: ${started_col_width};">Started</div></th>` +
        `<th><div class="table_header" style="width: ${finished_col_width};">Finished</div></th>` +
        `<th><div class="table_header" style="width: ${status_col_width};">Status</div></th>` +
    `<tr>`);

    fill_jobs_table();

    $("#filter_combo").change(function() {
        fill_jobs_table();
    });

});