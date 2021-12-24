function disable_input() {

    let buttons = ["#submit_button"];

    for (button of buttons) {
        $(button).prop('disabled', true);
        $(button).removeClass("std-button-hover");
        $(button).css("opacity", 0.5);
        $(button).css("cursor", "default");
    }

}

function enable_input() {

    let buttons = ["#submit_button"];

    for (button of buttons) {
        $(button).prop('disabled', false);
        $(button).addClass("std-button-hover");
        $(button).css("opacity", 1);
        $(button).css("cursor", "pointer");
    }

}



const config_values = {

    "backbone_type": {
        "RetinaNet": ["resnet18", "resnet34", "resnet50", "resnet101", "resnet152"],
        "CenterNet": ["resnet18", "resnet34", "resnet50", "resnet101", "resnet152"],
        "YOLOv4": ["csp_darknet53"],
        "YOLOv4 Tiny": ["csp_darknet53_tiny"]
    },

    "neck_type": {
        "RetinaNet": ["fpn"],
        "CenterNet": ["resnet_deconv"],
        "YOLOv4": ["spp_pan"],
        "YOLOv4 Tiny": ["yolov4_tiny_deconv"]
    }

    /*,


    "network_input_width_height": {
        "RetinaNet": [128, 1024, 32, 800],
        "CenterNet": [128, 1024, 32, 512],
        "YOLOv4": [128, 1024, 32, 416],
        "YOLOv4 Tiny": [128, 1024, 32, 416]
    },

    "max_detections_per_patch": {
        "RetinaNet": [10, 50, 5, 30],
        "CenterNet": [10, 50, 5, 30],
        "YOLOv4": [10, 50, 5, 30],
        "YOLOv4 Tiny": [10, 50, 5, 30]
    },

    "training_batch_size": {
        "RetinaNet": [1, 4, 1, 2],
        "CenterNet": [1, 4, 1, 2],
        "YOLOv4": [1, 8, 1, 8],
        "YOLOv4 Tiny": [1, 16, 1, 16]
    }*/
}



function update_containers() {
    let width = $(window).width();
    if (width < 1000) {
        $("#train_container").removeClass("grid-container-2");
        $("#train_container").addClass("grid-container-1");
    }
    else {
        $("#train_container").removeClass("grid-container-1");
        $("#train_container").addClass("grid-container-2");     
    }
}


function add_custom_extraction_parameter(content_element, dataset_name) {
    console.log("add");
    let content_id = content_element.id;

    //let method_id = method_element.id;

    //console.log("tab_id", tab_id);
    console.log(dataset_name);
    let method_id = content_id + "_" + dataset_name + "_patch_method";
    let additional_label_id = content_id + "_" + dataset_name + "_patch_additional_label";
    let additional_input_id = content_id + "_" + dataset_name + "_patch_additional_input";
    patch_method = $("#" + method_id).val();
    console.log("additional_label_id", additional_label_id);
    if (patch_method === "Tile") {
        $("#" + additional_label_id).html("Patch Overlap Percent:")
        $("#" + additional_input_id).prop("min", 0);
        $("#" + additional_input_id).prop("max", 95);
        $("#" + additional_input_id).prop("step", 5);
    }
    else if (patch_method === "JitterBox") {
        $("#" + additional_label_id).html("Patches Per Box:")
        $("#" + additional_input_id).prop("min", 1);
        $("#" + additional_input_id).prop("max", 3);
        $("#" + additional_input_id).prop("step", 1);        
    }
    $("#" + additional_input_id).prop('disabled', false);
    $("#" + additional_input_id).val("");
}

function add_collapsible_listener(id) {
    $("#" + id).on("click", function() {
        this.classList.toggle("active");
        let content = this.nextElementSibling;
        if (content.style.display === "block") {
          content.style.display = "none";
        } else {
          content.style.display = "block";
        }
    });

}

function add_image_set_config(content_id) {
    let farm_name_id = content_id + "_farm_name";
    let field_name_id = content_id + "_field_name";
    let mission_date_id = content_id + "_mission_date";

    $("#" + content_id).append(
    `<div class="col_label" style="text-align: left">Image Set</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Farm Name: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<select id=${farm_name_id} class="nonfixed_dropdown"></select>` +
        `</div>` +
    `</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Field Name: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<select id=${field_name_id} class="nonfixed_dropdown"></select>` +
        `</div>` +
    `</div>` +        
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Mission Date: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<select id=${mission_date_id} class="nonfixed_dropdown"></select>` +
        `</div>` +
    `</div>`);



}

function add_patch_extraction_config(content_id, dataset_name) {

    let method_id = content_id + "_" + dataset_name + "_patch_method";
    let size_id = content_id + "_" + dataset_name + "_patch_size";
    let additional_label_id = content_id + "_" + dataset_name + "_patch_additional_label";
    let additional_input_id = content_id + "_" + dataset_name + "_patch_additional_input";

    let capitalized_dataset_name = dataset_name[0].toUpperCase() + dataset_name.substring(1);

    $("#" + content_id).append(
    `<div class="col_label" style="text-align: left">${capitalized_dataset_name} Patch Extraction</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Method: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<select id=${method_id} class="nonfixed_dropdown" ` +
                `onchange="add_custom_extraction_parameter(${content_id}, '${dataset_name}')">` +
                `<option>Tile</option>` +
                `<option>JitterBox</option>` +
            `</select>` +
        `</div>` +
    `</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Size: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<input type="number" id=${size_id} class="nonfixed_number_input" ` +
                `min=50 max=2000 step=10></input>` +
        `</div>` +
    `</div>` +
    `<div class="row">` +

        `<div class="col_left">` +
            `<div class="col_label" id=${additional_label_id}></div>` +
        `</div>` +
        `<div class="col_right">` +
            `<input type="number" id=${additional_input_id} ` +
                `class="nonfixed_number_input" disabled="true"></input>` +
        `</div>` +

    `</div>`);

    $("#" + method_id).prop("selectedIndex", -1);

}

function add_dataset_config(content_id) {

    console.log("add_dataset_config");
    add_image_set_config(content_id);
    $("#" + content_id).append(`<hr>`);
    add_patch_extraction_config(content_id, "training");
    $("#" + content_id).append(`<hr>`);
    add_patch_extraction_config(content_id, "validation");
}

function add_data_augmentation_config(content_id) {
    console.log("adding data augmentation config");
    let horizontal_flip_id = content_id + "_horizontal_flip";
    let vertical_flip_id = content_id + "_vertical_flip";
    let rotate_90_id = content_id + "_rotate_90";

    $("#" + content_id).append(
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Horizontal Flip: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<select id=${horizontal_flip_id} class="nonfixed_dropdown">` +
                `<option>Yes</option>` +
                `<option>No</option>` +
            `</select>` +
        `</div>` +
    `</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Vertical Flip: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<select id=${vertical_flip_id} class="nonfixed_dropdown">` +
                `<option>Yes</option>` +
                `<option>No</option>` +
            `</select>` +
        `</div>` +
    `</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Rotate 90: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<select id=${rotate_90_id} class="nonfixed_dropdown">` +
                `<option>Yes</option>` +
                `<option>No</option>` +
            `</select>` +
        `</div>` +
    `</div>`);

    $("#" + horizontal_flip_id).prop("selectedIndex", -1);
    $("#" + vertical_flip_id).prop("selectedIndex", -1);
    $("#" + rotate_90_id).prop("selectedIndex", -1);

}


function add_training_loop_configuration(content_id) {
    let batch_size_id = content_id + "_batch_size";
    let min_epochs_id = content_id + "_min_num_epochs";
    let max_epochs_id = content_id + "_max_num_epochs";
    let learning_rate_id = content_id + "_learning_rate";
    let early_stopping_tolerance_id = content_id + "_early_stopping_tolerance";


    $("#" + content_id).append(
    /*`<div class="col_label" style="text-align: left">${capitalized_dataset_name} Patch Extraction</div>` +*/
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Batch Size: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<input type="number" id=${batch_size_id} class="nonfixed_number_input" ` +
                `min=1 max=16 step=1></input>` +
            `</select>` +
        `</div>` +
    `</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Min Number of Epochs: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<input type="number" id=${min_epochs_id} class="nonfixed_number_input" ` +
                `min=1 max=500 step=1></input>` +
            `</select>` +
        `</div>` +
    `</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Max Number of Epochs: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<input type="number" id=${max_epochs_id} class="nonfixed_number_input" ` +
                `min=1 max=500 step=1></input>` +
            `</select>` +
        `</div>` +
    `</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Learning Rate: </div>` +
        `</div>` +
        `<div class="col_right">` +
            `<input type="number" id=${learning_rate_id} class="nonfixed_number_input" ` +
                `min=0.0000001 max=0.1 step=0.0000001></input>` +
            `</select>` +
        `</div>` +
    `</div>` +
    `<div class="row">` +
        `<div class="col_left">` +
            `<div class="col_label">Val. Loss Early Stop Tolerance (Epochs)</div>` +
        `</div>` +
        `<div class="col_right">` +
            `<input type="number" id=${early_stopping_tolerance_id} class="nonfixed_number_input" ` +
                `min=1 max=500 step=1></input>` +
            `</select>` +
        `</div>` +
    `</div>`);


    $("#" + early_stopping_tolerance_id).prop("selectedIndex", -1);


}



function populate_tab(tab_id) {

    console.log("populating tab", tab_id);
    let model_type = $("#model_type").val();

    $("#" + tab_id).empty();

    let sequence_num = tab_id.substring(9, tab_id.length - 4);
    let table_id = tab_id + "_table";


    let dataset_collapse_id = tab_id + "_dataset_collapse";
    let dataset_content_id = tab_id + "_dataset_content";
    $("#" + tab_id).append(
        `<button type="button" class="collapsible" id=${dataset_collapse_id}>Dataset</button>` +
        `<div id=${dataset_content_id} class="content"></div>`);
    add_dataset_config(dataset_content_id);
    add_collapsible_listener(dataset_collapse_id);

    let augmentations_collapse_id = tab_id + "_data_augmentation_collapse";
    let data_augmentation_content_id = tab_id + "_data_augmentation_content";
    $("#" + tab_id).append(
        `<button type="button" class="collapsible" id=${augmentations_collapse_id}>Data Augmentation</button>` +
        `<div id=${data_augmentation_content_id} class="content"></div>`);
    add_data_augmentation_config(data_augmentation_content_id);
    add_collapsible_listener(augmentations_collapse_id);

    let training_loop_collapse_id = tab_id + "_training_loop_collapse";
    let training_loop_content_id = tab_id + "_training_loop_content";
    $("#" + tab_id).append(
        `<button type="button" class="collapsible" id=${training_loop_collapse_id}>Training Loop</button>` +
        `<div id=${training_loop_content_id} class="content"></div>`);
    add_training_loop_configuration(training_loop_content_id);
    add_collapsible_listener(training_loop_collapse_id);

}


function show_tab(tab_btn_id) {

    //let tab_btn_id = tab_btn.id;
    console.log("tab_btn_id", tab_btn_id);

    let tabs = [];//["default_tab"];
    for (let i = 1; i <= num_sequences; i++) {
        tabs.push("sequence_" + i + "_tab");
    }

    let sel_tab = tab_btn_id.substring(0, tab_btn_id.length - 4);

    for (tab of tabs) {
        $("#" + tab).hide();
        $("#" + tab + "_btn").removeClass("tab-btn-active");
    }

    $("#" + tab_btn_id).addClass("tab-btn-active");
    console.log("showing", sel_tab);
    $("#" + sel_tab).show();

/*
    $("#" + training_tab_id).append(`<table class="transparent_table">` +
        `<tr>` +
            `<td class="table_head"> Training Patch Extraction Parameters<td>` +
            `<td>` +
                `<select id="training_patch_extraction_method"> Method` +
                    `<option>Tile</option>` +
                    `<option>JitterBox</option>` +
                `</select>` +
            `</td>` + 
        `</tr>` +
    `</table>`);
*/

}

function all_filled(req_keys) {
    let v;
    for (req_key of req_keys) {
        v = $("#" + req_key).val();
        if (v === null || v === "")
            return false;
    }
    return true;
    /*
    return fields.each(function() {
        //console.log(this);
        //return $("#" + this).value === '';
        return $("#" + this).val() === '';
    }).length == 0;*/
}

function check_for_completion() {
/*
    let req_keys = $(
        "#model_type, " +
        "#backbone_type, " +
        "#neck_type, " +
        "#network_input_width_height, " +
        "#max_detections_per_patch");*/
    let req_keys = ["model_type",
        "backbone_type",
        "neck_type",
        "network_input_width_height",
        "max_detections_per_patch"];

    for (let i = 1; i <= num_sequences; i++) {
        req_keys = req_keys.concat([
            /*
            "sequence_" + i + "_tab_dataset_content_farm_name",
            "sequence_" + i + "_tab_dataset_content_field_name",
            "sequence_" + i + "_tab_dataset_content_mission_date",*/
            "sequence_" + i + "_tab_dataset_content_training_patch_method",
            "sequence_" + i + "_tab_dataset_content_training_patch_size",
            "sequence_" + i + "_tab_dataset_content_training_patch_additional_input",
            "sequence_" + i + "_tab_dataset_content_validation_patch_method",
            "sequence_" + i + "_tab_dataset_content_validation_patch_size",
            "sequence_" + i + "_tab_dataset_content_validation_patch_additional_input",
            "sequence_" + i + "_tab_data_augmentation_content_horizontal_flip",
            "sequence_" + i + "_tab_data_augmentation_content_vertical_flip",
            "sequence_" + i + "_tab_data_augmentation_content_rotate_90",
            "sequence_" + i + "_tab_training_loop_content_batch_size",
            "sequence_" + i + "_tab_training_loop_content_min_num_epochs",
            "sequence_" + i + "_tab_training_loop_content_max_num_epochs",
            "sequence_" + i + "_tab_training_loop_content_learning_rate",
            "sequence_" + i + "_tab_training_loop_content_early_stopping_tolerance"

        ]);

    }

    console.log("req_keys", req_keys);
    let complete = all_filled(req_keys);
/*
    let completed = true;
    for (req_key of req_keys) {
        if (req_key === null) {
            console.log("not done");
            completed = false;
        }
    }
*/
/*
    if (complete) {
        console.log("ready to submit");
    }
    else {
        console.log("not ready");
    }
*/
    return complete;


}
function remove_sequence() {
    if (num_sequences > 1) {
        console.log("remove");

        let sequence_num = num_sequences;
        let sequence_id = "sequence_" + sequence_num + "_tab";
        let sequence_btn_id = sequence_id + "_btn";

        if ($("#" + sequence_btn_id).hasClass("tab-btn-active")) {
            let prev_sequence_num = num_sequences - 1;
            let prev_sequence_btn_id = "sequence_" + prev_sequence_num + "_tab_btn";
            show_tab(prev_sequence_btn_id);
        }

        $("#" + sequence_btn_id).remove();
        $("#" + sequence_id).remove();

        num_sequences--;
        if (num_sequences == 1) {
            $("#rm_seq_btn").css("opacity", 0.5);
        }
    }
    $("#add_seq_btn").css("opacity", 1.0);
    $("#train_container").change();
}

function add_sequence() {

    if (num_sequences < 5) {
        console.log("adding sequence");
        num_sequences++;
        let sequence_num = num_sequences;
        let sequence_id = "sequence_" + sequence_num + "_tab";
        let sequence_btn_id = sequence_id + "_btn";
        console.log("sequence_btn_id", sequence_btn_id);
        $("#sequence_select").append(
            `<li class="nav" id=${sequence_btn_id} onclick="show_tab(this.id)">` +
            `<a class="nav"><div>${sequence_num}</div></a></li>`);

        // append actual tab
        $("#scrollable_training_area").append(
            `<div id=${sequence_id} style="display: none"></div>`);

        populate_tab(sequence_id);
        if (num_sequences == 5) {
            $("#add_seq_btn").css("opacity", 0.5);
        }
    }

    $("#rm_seq_btn").css("opacity", 1.0);
    $("#train_container").change();
}

let num_sequences = 1;

$(document).ready(function(){

    update_containers();
    disable_input();

    let model_types = ["RetinaNet", "CenterNet", "YOLOv4", "YOLOv4 Tiny"];

    for (model_type of model_types) {
        $("#model_type").append($('<option>', {
            value: model_type,
            text: model_type
        }));
    }

    $("#model_type").prop("selectedIndex", -1);


    //populate_training_tab("default-tab")

    populate_tab("sequence_1_tab");
    

    $("#model_type").change(function() {

        $("#backbone_type").empty();

        let model_type = $("#model_type").val();

        let backbone_types = config_values["backbone_type"][model_type];

        for (backbone_type of backbone_types) {
            $("#backbone_type").append($('<option>', {
                value: backbone_type,
                text: backbone_type
            }));            
        }

        $("#backbone_type").prop("selectedIndex", -1);


        $("#neck_type").empty();
        
        let neck_types = config_values["neck_type"][model_type];

        for (neck_type of neck_types) {
            $("#neck_type").append($('<option>', {
                value: neck_type,
                text: neck_type
            }));            
        }

        $("#neck_type").prop("selectedIndex", -1);

        /*
        $("#network_input_width_height").empty();

        let input_output_sizes = config_values["network_input_width_height"][model_type];

        let min = input_output_sizes[0];
        let max = input_output_sizes[1];
        let step = input_output_sizes[2];
        let default_val = input_output_sizes[3];

        $("#network_input_width_height").attr("min", min);
        $("#network_input_width_height").attr("max", max);
        $("#network_input_width_height").attr("step", step);
        $("#network_input_width_height").attr("value", default_val);

        $("#max_detections_per_patch").empty();

        let max_detection_values = config_values["max_detections_per_patch"][model_type];

        min = max_detection_values[0];
        max = max_detection_values[1];
        step = max_detection_values[2];
        default_val = max_detection_values[3];

        $("#max_detections_per_patch").attr("min", min);
        $("#max_detections_per_patch").attr("max", max);
        $("#max_detections_per_patch").attr("step", step);
        $("#max_detections_per_patch").attr("value", default_val);*/


        //check_for_completion();

    });

/*
    $("#backbone_type").change(function() {
        check_for_completion();
    });

    $("#neck_type").change(function() {
        check_for_completion();
    });

    $("#network_input_width_height").change(function() {
        check_for_completion();
    });    
    
    $("#max_detections_per_patch").change(function() {
        check_for_completion();
    });
*/

    $("#train_container").change(function() {
        console.log("something changed");
        let complete = check_for_completion();
        if (complete) {
            enable_input();
        }
        else {
            disable_input();
        }
    });

    $(window).resize(function() {
        update_containers();
    });

    $("#submit_button").click(function() {
        disable_input();
        let complete = check_for_completion();
        if (!complete) {
            enable_input();
            $("#submit_error_message").html("Missing a required field!");
        }
        else {
            console.log("Submitting request");

            /*
            let network_input_wh = $("#network_input_width_height").val()

            let req {
                "request_type": "run_group",
                "request_args": {

                    "group_name":
                    "group_description":

                    "replications": 1,
                    "arch_config": {

                        "model_type": $("#model_type").val(),
                        "backbone_config": {
                            "backbone_type": $("#backbone_type").val()
                        },
                        "neck_config": {
                            "neck_type": $("#neck_type").val()
                        },
                        "max_detections": $("#max_detections_per_patch").val(),
                        "input_img_shape": [network_input_wh, network_input_wh, 3]
                    },

                    "training_config": {
                        "training_sequence": []
                    }
                    "inference_config": {
                    }
                }
            };

            for (let i = 0; i < num_sequences; i++) {
                let training_patch_method = $("#sequence_" + i + "_tab_dataset_content_training_patch_method");
                if (train_patch_method === "Tile") {
                    let training_patch_additional_key = "patch_overlap_percent";
                }
                else if (train_patch_method === "JitterBox") { 
                    let training_patch_additional_key = "num_patches_per_box";
                }
                req["request_args"]["training_config"]["training_sequence"].push({

                    "image_sets": [

                    ],
                    "training_patch_extraction_params": {
                        "method": $("#sequence_" + i + "_tab_dataset_content_training_patch_method"),
                        "patch_size": $("#sequence_" + i + "_tab_dataset_content_training_patch_size"),
                    }
                })
            }
            */
        }

    });


});
