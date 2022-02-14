
let metadata;
let job_config;
let overlays;
let predictions;
let dzi_dir;
let dzi_image_paths;
let sorted_overlay_names;
let sorted_overlay_ids;
let overlay_colors;
let dataset_images;

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


    let colors = ["#0080C0", "#FF4040", "#FFC040", "#40C040", "#C080C0", "#00C0C0", "#C0C080", 
                  "#FFC0C0", "#408040", "#C08040", "#FF8040"];
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

        for (img_name of Object.keys(overlays[sorted_overlay_ids[i]])) {
            for (annotation of overlays[sorted_overlay_ids[i]][img_name]["annotations"]) {
                annotation["body"].push({"value": color_id, "purpose": "highlighting"})
            }
        }

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

function create_image_set_table(image_names) {

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
    for (image_name of image_names) {
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
  var highlightBody = annotation.bodies.find(function(b) {
    return b.purpose == 'highlighting';
  });

  if (highlightBody)
    return highlightBody.value;
};


function update_overlays() {
    anno.clearAnnotations();
    console.log("update_overlays");
    for (overlay_id of sorted_overlay_ids) {
        if ($("#" + overlay_id).is(":checked")) {
            for (annotation of overlays[overlay_id][cur_img_name]["annotations"]) {
                //annotation["body"].push({"value": "COLOR_1", "purpose": "highlighting"})
                anno.addAnnotation(annotation);
            }
        }

    }
/*
    if $("#annotations")
    for (annotation of annotations[cur_img_name]["annotations"]) {
        anno.addAnnotation(annotation);
    }*/
}

function assemble_datasets() {
    dataset_images = {};
    for (image_set of job_config["inference_config"]["image_sets"]) {
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



$(document).ready(function() {
    
    metadata = data["metadata"];
    job_config = data["job_config"];
    overlays = data["overlays"];
    predictions = data["predictions"];
    dzi_dir = data["dzi_dir"];
    dzi_image_paths = data["dzi_image_paths"];

    $("#image_set_name").text(metadata["farm_name"] + "  |  " + 
                              metadata["field_name"] + "  |  " + 
                              metadata["mission_date"]);


    let img_files_name = basename(dzi_image_paths[0]);
    cur_img_name = img_files_name.substring(0, img_files_name.length - 4);

    assemble_datasets();
    overlay_initialization();
    create_image_set_table(dataset_images["all"]);
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

        $("#image_name").text(cur_img_name);
        $("#image_status").text(cur_status);




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




});