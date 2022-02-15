

/*
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
*/



function inspect_unstopped_job(job_status) {

    


    let job_config = job_configs[inspected_job];

    $("#job_details_container").empty();
    $("#job_details_container").append(`<div id="job_name" style="height: 30px; font-size: 20px"></div>`);
    $("#job_details_container").append(`<div id="loss_chart" style="height: 345px; border:none"></div>`);
    $("#job_details_container").append(`<div id="job_info" style="height: 325px; width: 500px"></div>`);
    $("#job_details_container").append(`<div id="loader_area" style="height: 25px"></div>`);

    //$("#job_name").empty();
    $("#job_name").html(job_config["job_name"]);

    let model_name_col_width = "130px";
    let model_status_col_width = "130px";

    if (job_status === "Running") {
        //$("#loader_area").empty();
        $("#loader_area").append(`<hr>`)
        $("#loader_area").append(`<div id="update_loader" class="loader" ` +
                                `style="float: left; margin: auto 0px; margin-left: 20px; width: 15px; height: 15px"></div>`);
        $("#loader_area").append(`<p style="margin: 0px; padding: 0px; padding-top:3px">Loss values are automatically updated every 30 seconds.</p>`)
        
    }
    /*
    else {
        $("#loader_area").append(`<button class="x-button x-button-hover" style="width: 200px" onclick="destroy_job_request()">`+
        `<span><i class="fa-regular fa-circle-xmark" style="margin-right:8px"></i> Destroy Job</span></button>`);
    }*/
    //$("#update_loader").show();
    //$("#job_info").empty();
    $("#job_info").append(`<select id="model_combo" class="nonfixed_dropdown" style="width: 120px;"></select>`);
    $("#job_info").append(`<br><br><hr>`)
    $("#job_info").append(`<table class="transparent_table" id="job_info_table_head"></table>`);
    $("#job_info_table_head").append(`<tr>` +
        `<th><div class="table_header" style="width: ${model_name_col_width};">Model Name</div></th>` +
        `<th><div class="table_header" style="width: ${model_status_col_width};">Status</div></th>` +
    `<tr>`);
    $("#job_info").append(`<div class="scrollable_area" style="height: 235px; border: none;">` +
                          `<table class="transparent_table" id="job_info_table_content"></table></div>`);
    //$("#job_info").append(`<table class="transparent_table" id="job_info_table_content"></table>`)

    //let model_uuids = [];
    //let cur_running = null;
    for (model_rec of job_config["model_info"]) {
        let model_uuid = model_rec["model_uuid"];
        let model_name = model_rec["model_name"];
        let model_stage = model_rec["stage"];
        //model_uuids.push(model_uuid);
        $("#job_info_table_content").append(`<tr>` +
        `<td><div class="table_entry" style="width: ${model_name_col_width};">${model_name}</div></td>` +
        `<td><div class="table_entry" style="width: ${model_status_col_width};">${model_stage}</div></td>` +
        `<tr>`);
        $("#model_combo").append($('<option>', {
            value: model_uuid,
            text: model_name
        }));
        /*
        if (model_stage == "Training" || model_stage == "Predicting") {
            cur_running = model_uuid;
        }*/
    }

    $("#model_combo").prop("selectedIndex", job_config["model_info"].length-1);

    /* FIX selected_model_name may come from previously inspected job. This doesn't work */
    /*
    if (selected_model_name == null) {
        if (cur_running !== null) {
            $("#model_combo").val(cur_running);
        }
        else {
            $("#model_combo").prop("selectedIndex", job_config["model_info"].length-1);
        }
        selected_model_name = $("#model_combo").val();
    }
    else {
        $("#model_combo").val(selected_model_name);
    }*/

    $("#model_combo").change(function() {
        selected_model_name = $("#model_combo").val();
        inspect_job();
    });

    if (loss_records !== null) { 
        draw_loss_chart(loss_records);
    }

}

function stop_job_request(job_uuid) {
    //console.log("stop_job_request", job_uuid);

    $.post($(location).attr('href'),
    {
        action: "stop_job",
        job_uuid: job_uuid
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
            //delete job_configs[inspected_job];
            //$("#job_name").empty();
            //$("#loss_chart").empty();
            //$("#job_info").empty();
            //$("#loader_area").empty();

            //fill_jobs_table();
            
            post_for_updates();

        }
    });
}

function destroy_job_request(job_uuid) {
    //console.log("destroy_job", job_uuid);

    $.post($(location).attr('href'),
    {
        action: "destroy_job",
        job_uuid: job_uuid
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
            //delete job_configs[inspected_job];
            //$("#job_name").empty();
            //$("#loss_chart").empty();
            //$("#job_info").empty();
            //$("#loader_area").empty();
            //fill_jobs_table();
            if (job_uuid === inspected_job) {
                inspected_job = null;
            }
            post_for_updates();


        }
    });

}
function inspect_stopped_job() {

    $("#job_details_container").empty();
    $("#job_details_container").append(`<div id="job_name" style="height: 30px; font-size: 20px"></div>`);
    $("#job_details_container").append(`<div id="info_area" class="scrollable_area" style="height: 710px; border: none"></div>`);
    //$("#job_details_container").append(`<div id="job_info" style="height: 325px; width: 500px"></div>`);
    //$("#job_details_container").append(`<div id="loader_area" style="height: 25px"></div>`);

    //$("#job_name").empty();
    $("#job_name").html(job_configs[inspected_job]["job_name"]);

    let job_exception = job_configs[inspected_job]["exception"];
    //$("#loss_chart").empty();
    $("#info_area").append(`<p style="text-decoration: underline">The job was stopped due to the following exception:</p>` +
                           `<p>${job_exception}</p>`);
    //$("#loader_area").empty();
    //$("#loader_area").append(`<button class="x-button x-button-hover" style="width: 200px" onclick="destroy_job_request()">`+
    //                            `<span><i class="fa-regular fa-circle-xmark" style="margin-right:8px"></i> Destroy Job</span></button>`);
}

function job_clicked(job_uuid) {
    inspected_job = job_uuid
    post_for_updates();
}

function inspect_job() {
    //console.log("inspecting job", inspected_job);

    /* needs to fetch the most recent config */

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
let loss_records = null;
let inspected_job = null;
let selected_model_name = null;

let job_col_width = "200px";
let started_col_width = "180px";
let finished_col_width = "180px";
let status_col_width = "100px";
let manage_col_width = "140px";

function fill_jobs_table() {
    //console.log("fill_jobs_table");

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
            //let manage_text;
            //let manage_func;
            let manage_entry;
            if (status === "Running") {
                //manage_text = "Stop";
                //manage_func = "stop_job_request('" + job_uuid + "')";

                manage_entry = `<td><div class="table_entry_container" style="width: ${manage_col_width};"><button class="stop-button stop-button-hover" ` +
                `onclick="stop_job_request('${job_uuid}')">` +
                `<span style="margin-right: 14px"><i class="fa-regular fa-hand" style="margin-right:18px;"></i> Stop</span></button></div></td>`;
            }
            else {
                manage_entry = `<td><div class="table_entry_container" style="width: ${manage_col_width};"><button class="x-button x-button-hover" ` +
                `onclick="destroy_job_request('${job_uuid}')">` +
                `<span><i class="fa-regular fa-circle-xmark" style="margin-right:8px"></i> Destroy</span></button></div></td>`;
                //manage_func = "destroy_job_request('" + job_uuid + "')";
            }
            //console.log("manage_text", manage_text, manage_func);

    
            $("#jobs_table_content").append(`<tr>` + // style="height: 50px">` +
                `<td><div class="table_entry_container" style="width: ${job_col_width};"><div class="table_button table_button_hover" onclick="job_clicked('${job_uuid}')">${job_name}</div></div></td>` +
                `<td><div class="table_entry_container" style="width: ${started_col_width};"><div class="table_entry">${start_time}</div></div></td>` +
                `<td><div class="table_entry_container" style="width: ${finished_col_width};"><div class="table_entry">${end_time}</div></div></td>` +
                `<td><div class="table_entry_container" style="width: ${status_col_width};"><div class="table_entry">${status}</div></div></td>` +
                manage_entry + 
            `<tr>`);
        }
    }
}

function update_sorted_job_configs() {

    sorted_job_configs = Object.values(job_configs);

    sorted_job_configs.sort(function(a, b) {
        let keyA = new Date(a.start_time);
        let keyB = new Date(b.start_time);
        if (keyA > keyB) return -1;
        if (keyA < keyB) return 1;
        return 0;
    });
}

function post_for_updates() {
    //console.log("refreshing...");
    let model_uuids = [];
    if (inspected_job !== null) {
        if ("model_info" in job_configs[inspected_job]) {
            for (model_rec of job_configs[inspected_job]["model_info"]) {
                model_uuids.push(model_rec["model_uuid"]);
            }
        }
    }
    

    $.post($(location).attr('href'),
    {
        action: "refresh",
        model_uuids: model_uuids.join(","),
    },
    function(response, status) {
        if (response.error) { 
            console.log("error occurred", response.error);
        }
        else {
            //console.log("obtained loss records");
            job_configs = JSON.parse(response.job_configs);
            loss_records = JSON.parse(response.loss_records);

            //console.log("loss_records", loss_records);
            fill_jobs_table();
            if (inspected_job in job_configs) {
                inspect_job();
            }
            else {
                $("#job_details_container").empty();
            }

            //window.location.href = response.redirect;
        }
    });
}

$(document).ready(function() {
    setInterval(post_for_updates, 30000);

    //console.log("job_configs", job_configs);

    $("#jobs_table_head").append(`<tr>` +
        `<th><div class="table_header" style="width: ${job_col_width};">Job Name</div></th>` +
        `<th><div class="table_header" style="width: ${started_col_width};">Started</div></th>` +
        `<th><div class="table_header" style="width: ${finished_col_width};">Finished</div></th>` +
        `<th><div class="table_header" style="width: ${status_col_width};">Status</div></th>` +
        `<th><div class="table_header" style="width: ${manage_col_width};">Action</div></th>` +
    `<tr>`);

    fill_jobs_table();

    $("#filter_combo").change(function() {
        fill_jobs_table();
    });

});