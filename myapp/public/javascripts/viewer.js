

let metadata;
let job_config;
let overlays;
//let predictions;
let metrics;
let dzi_dir;
let dzi_image_paths;
let sorted_overlay_names;
let sorted_overlay_ids;
let overlay_colors;
let dataset_images;

let image_names = {
    "all": [],
    "completed": [],
    "unannotated": [],
    "training/validation": [],
    "testing": []
};

let viewer;
let anno;
let cur_img_name;

function change_image(dzi_image_path) {
    viewer.open(dzi_image_path);
}


function overlay_initialization() {

    sorted_overlay_names = [];
    sorted_overlay_ids = [];

    let model_items = job_config["model_info"]
    model_items.sort(function(first, second) {
        if (first["model_name"] < second["model_name"]) return -1;
        if (first["model_name"] > second["model_name"]) return 1;
        return 0;
    });

    for (model_item of model_items) {
        sorted_overlay_names.push(model_item["model_name"]);
        sorted_overlay_ids.push(model_item["model_uuid"]); 
    }

    sorted_overlay_names = ["annotations", ...sorted_overlay_names];
    sorted_overlay_ids = ["annotations", ...sorted_overlay_ids];


    let colors = ["#0080C0",        
                  "#FF4040", 
                  "#f5a70b", 
                  "#b95fb9", 
                  "#00695C",
                  "#00C0C0", 
                  "#C0C080", 
                  "#FFC0C0", 
                  "#C08040", 
                  "#FF8040"];
    let overflow_color = "#A0A0A0";

    overlay_colors = {};
    for (let i = 0; i < sorted_overlay_names.length; i++) {
        if (i < colors.length)
            overlay_colors[sorted_overlay_names[i]] = colors[i];
        else
            overlay_colors[sorted_overlay_names[i]] = overflow_color;
    }

    let color_id;
    for (let i = 0; i < sorted_overlay_names.length; i++) {

        if (i < colors.length)
            color_id = "COLOR_" + i;
        else
            color_id = "COLOR_DEFAULT";

        //console.log("for loop started");
        for (img_name of Object.keys(overlays[sorted_overlay_ids[i]])) {
            for (annotation of overlays[sorted_overlay_ids[i]][img_name]["annotations"]) {
                annotation["body"].push({"value": color_id, "purpose": "highlighting"})
            }
        }
        //console.log("for loop finished");

    }

}

function create_models_table() {

    let models_col_width = "215px";

    for (let i = 0; i < sorted_overlay_names.length; i++) {
        let overlay_name = sorted_overlay_names[i];
        let overlay_id = sorted_overlay_ids[i];
        let overlay_color = overlay_colors[overlay_name];
        console.log("overlay_color", overlay_color);
        $("#models_table").append(`<tr>` +
            `<td><label class="table_label" ` +
            `style="width: ${models_col_width}; background-color: ${overlay_color};">` +
            `<input id=${overlay_id} type="checkbox" style="cursor: pointer"></input>   ${overlay_name}</label>` +
            `</td>`+

/*
                    `<td><input class="table_label" type="checkbox">` +
                    ` ${overlay_name}</label></td>` +
                    */
/*

            `<td><div class="table_button table_button_hover" ` +
            `style="width: ${models_col_width}; background-color: ${overlay_color}"` +
                 `>${overlay_name}</div></td>` +*/
            `</tr>`);
    }
}


function create_image_set_table(filter) {

    let image_name_col_width = "100px";
    let image_status_col_width = "150px";
    let image_dataset_col_width = "200px";

    $("#images_table").empty();
    /*
    $("#image_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${image_name_col_width};">Name</div></th>` +
            //`<th><div class="table_header" style="width: ${image_status_col_width}">Annotation Status</div></th>` +
            //`<th><div class="table_header" style="width: ${image_dataset_col_width}">Assigned Dataset</div></th>` +
            `</tr>`);*/
    //for (dzi_image_path of dzi_image_paths) {

    let filter_val = $("#filter_combo").val();
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
    }


    for (image_name of selected_image_names) {
        //let image_name = basename(dzi_image_path)
        //let extensionless_name = image_name.substring(0, image_name.length - 4);
        let dzi_image_path = dzi_dir + "/" + image_name + ".dzi";

        //let img_status = image_set_data["images"][extensionless_name]["status"];
        let image_status = overlays["annotations"][image_name]["status"];
        $("#images_table").append(`<tr>` +
            `<td><div class="table_button table_button_hover"` +
                 `onclick="change_image('${dzi_image_path}')">${image_name}</div></td>` +
            //`<td><div>${extensionless_name}</div></td>` +
            `<td><div class="table_entry" style="border: 1px solid white">${image_status}</div></td>` +
            //`<td><div class="table_entry">${img_dataset}</div></td>` +
            `</tr>`);
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
    for (overlay_id of sorted_overlay_ids) {
        if ($("#" + overlay_id).is(":checked")) {
            for (annotation of overlays[overlay_id][cur_img_name]["annotations"]) {
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

/*
function assemble_datasets() {
    dataset_images = {};
    for (image_set of job_config["inference_config"]["datasets"]){ //image_sets"]) {
        if ((image_set["farm_name"] === metadata["farm_name"] &&
             image_set["field_name"] === metadata["field_name"]) &&
             image_set["mission_date"] === metadata["mission_date"]) {
            dataset_images["training"] = natsort(image_set["training_image_names"]);
            dataset_images["validation"] = natsort(image_set["validation_image_names"]);
            dataset_images["test"] = natsort(image_set["test_image_names"]);
        }
    }
    dataset_images["all"] = natsort(Object.keys(data["overlays"]["annotations"]));
}
*/

let used_for = {};


$(document).ready(function() {
    
    metadata = data["metadata"];
    job_config = data["job_config"];
    overlays = data["overlays"];
    //predictions = data["predictions"];
    metrics = data["metrics"];
    dzi_dir = data["dzi_dir"];
    dzi_image_paths = data["dzi_image_paths"];


    let download_path = "/plant_detection/usr/data/results/" + job_config["target_farm_name"] + "/" +
                        job_config["target_field_name"] + "/" + job_config["target_mission_date"] + "/" +
                        job_config["job_uuid"] + "/results.xlsx";
    
    //let download_path = "/plant_detection/usr/data/results.xlsx";
    console.log("download_path", download_path);
    $("#download_button").attr("href", download_path);


    $("#image_set_name").text(metadata["farm_name"] + "  |  " + 
                              metadata["field_name"] + "  |  " + 
                              metadata["mission_date"]);

    image_names["all"] = natsort(Object.keys(data["overlays"]["annotations"]));
    for (image_name of image_names["all"]) {

        let status = data["overlays"]["annotations"][image_name]["status"];
        if (status === "completed") {
            image_names["completed"].push(image_name);


            if (job_config["test_reserved_images"].includes(image_name)) {
                image_names["testing"].push(image_name)
                used_for[image_name] = "testing";
            }
            else if (job_config["training_validation_images"].includes(image_name)) {
                image_names["training/validation"].push(image_name);
                used_for[image_name] = "training/validation";
            }
            else {
                used_for[image_name] = "NA";
            }

        }
        else if (status === "unannotated") {
            image_names["unannotated"].push(image_name);
            used_for[image_name] = "NA";
        }
 
    }
    


    let img_files_name = basename(dzi_image_paths[0]);
    cur_img_name = img_files_name.substring(0, img_files_name.length - 4);

    //assemble_datasets();
    overlay_initialization();
    create_image_set_table(); //dataset_images["all"]);
    create_models_table();
    set_count_chart_data();
    draw_count_chart();


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
        

        let img_files_name = basename(event.source);
        let img_name = img_files_name.substring(0, img_files_name.length - 4);

        //let img_status = image_set_data["images"][img_name]["status"];
        //console.log("img_status", img_status);
        cur_img_name = img_name;
        let cur_status = overlays["annotations"][cur_img_name]["status"];
        let use = used_for[cur_img_name];

        $("#image_name").text(cur_img_name);
        $("#image_status").text(cur_status);
        $("#used_for").text(use);




        update_overlays();
        update_count_chart();
        //update_overlays();
        //update_count_chart();
    });



    $("#models_table").change(function() {
        update_overlays();
    });

    $("#dataset_combo").change(function() {
        console.log("changing dataset");
        let combo_val = $("#dataset_combo").val();
        let sel_images;

        if (combo_val === "Training") {
            sel_images = dataset_images["training"];
        }
        else if (combo_val === "Validation") {
            sel_images = dataset_images["validation"];
        }
        else if (combo_val === "Test") {
            sel_images = dataset_images["test"];
        }
        else {
            sel_images = dataset_images["all"];
        }

        create_image_set_table(sel_images);

        let dzi_image_path = dzi_dir + "/" + sel_images[0] + ".dzi";
        if (sel_images.length > 0) {
            change_image(dzi_image_path);
        }
        else {
            anno.clearAnnotations();
            viewer.close(); //viewer.world.resetItems();
            zero_count_chart();
        }
    });

    $("#confidence_slider").change(function() {
        let slider_val = Number.parseFloat($("#confidence_slider").val()).toFixed(2);

        $("#slider_val").html(slider_val);
        update_overlays();
        set_count_chart_data();
        update_count_chart();
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
    })

});