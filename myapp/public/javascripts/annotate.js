

// import { bilinearInterpolation } from "simple-bilinear-interpolation";




let image_set_info;
let metadata;
let dzi_image_paths;
let annotations;
let image_to_dzi;

let viewer;
let anno;
let cur_img_name;
let cur_view;

let map_url = null;

/*
function update_containers() {
    let width = $(window).width();
    if (width < 1000) {
        $("#annotate_container").removeClass("grid-container-2");
        $("#annotate_container").addClass("grid-container-1");
    }
    else {
        $("#annotate_container").removeClass("grid-container-1");
        $("#annotate_container").addClass("grid-container-2");     
    }
}*/


function show_help_modal() {
    $("#help_modal").css("display", "block");
}

function close_help_modal() {
    $("#help_modal").css("display", "none");
}


function change_image(dzi_image_path) {
    // if (viewer == null) {
    //     create_viewer_and_anno();
    // }
    console.log("changing to", dzi_image_path);
    viewer.open(dzi_image_path);
}

function create_image_set_table() {

    let image_name_col_width = "100px";
    let image_status_col_width = "150px";
    let image_dataset_col_width = "200px";

    $("#image_set_table").empty();
    /*
    $("#image_set_table").append(`<tr>` +
            `<th><div class="table_header" style="width: ${image_name_col_width};">Name</div></th>` +
            //`<th><div class="table_header" style="width: ${image_status_col_width}">Annotation Status</div></th>` +
            //`<th><div class="table_header" style="width: ${image_dataset_col_width}">Assigned Dataset</div></th>` +
            `</tr>`);*/
    for (dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path)
        let extensionless_name = image_name.substring(0, image_name.length - 4);

        //let img_status = image_set_data["images"][extensionless_name]["status"];
        let image_status = annotations[extensionless_name]["status"]
        $("#image_set_table").append(`<tr>` +
            `<td><div class="table_button table_button_hover"` +
                 `onclick="change_image('${dzi_image_path}')">${extensionless_name}</div></td>` +
            //`<td><div>${extensionless_name}</div></td>` +
            `<td><div class="table_entry" style="border: 1px solid white">${image_status}</div></td>` +
            //`<td><div class="table_entry">${img_dataset}</div></td>` +
            `</tr>`);
    }
}



function resize_px_str(px_str) {
    console.log(px_str);
    px_str = px_str.substring(11);
    let px_lst = px_str.split(",").map(x => parseFloat(x));
    let img_dims = viewer.world.getItemAt(0).getContentSize();
    let img_w = img_dims.x;
    let img_h = img_dims.y;
    console.log(px_str);
    console.log(px_lst);
    console.log("img_dims", img_dims);

    let box_min_x = Math.max(px_lst[0], 0);
    let box_min_y = Math.max(px_lst[1], 0);

    let box_max_x = Math.min(px_lst[0] + px_lst[2], img_w);
    let box_max_y = Math.min(px_lst[1] + px_lst[3], img_h);


    let box_centre_x = (box_max_x + box_min_x) / 2;
    let box_centre_y = (box_max_y + box_min_y) / 2;

    let box_w = box_max_x - box_min_x;
    let box_h = box_max_y - box_min_y;

    let min_dim = 4;
    if (box_w < min_dim) {

        let tentative_box_min_x = box_centre_x - Math.floor(min_dim / 2);
        let tentative_box_max_x = box_centre_x + Math.floor(min_dim / 2);
        if (tentative_box_min_x < 0) {
            box_min_x = 0;
            box_max_x = min_dim;
        }
        else if (tentative_box_max_x > img_w) {
            box_min_x = (img_w) - min_dim;
            box_max_x = img_w;
        }
        else {
            box_min_x = tentative_box_min_x;
            box_max_x = tentative_box_max_x;
        }
        
    }
    if (box_h < min_dim) {
        let tentative_box_min_y = box_centre_y - Math.floor(min_dim / 2);
        let tentative_box_max_y = box_centre_y + Math.floor(min_dim / 2);
        if (tentative_box_min_y < 0) {
            box_min_y = 0;
            box_max_y = min_dim;
        }
        else if (tentative_box_max_y > img_h) {
            box_min_y = (img_h) - min_dim;
            box_max_y = img_h;
        }
        else {
            box_min_y = tentative_box_min_y;
            box_max_y = tentative_box_max_y;
        }
    }

    box_w = box_max_x - box_min_x;
    box_h = box_max_y - box_min_y;

    let updated_px_str = "xywh=pixel:" + box_min_x + "," + box_min_y +
                         "," + box_w + "," + box_h;

    console.log("updated_px_str", updated_px_str);
    return updated_px_str;

}

function update_image_status() {
    let prev_status = annotations[cur_img_name]["status"];
    let num_annotations = annotations[cur_img_name]["annotations"].length;
    let new_status = prev_status;
    if (prev_status === "unannotated" && num_annotations > 0) {
        new_status = "started";
    }
    else if (prev_status === "started" && num_annotations == 0) {
        new_status = "unannotated";
    }
    annotations[cur_img_name]["status"] = new_status;
}

function set_image_status_combo() {

    let cur_status = annotations[cur_img_name]["status"];
    let num_annotations = annotations[cur_img_name]["annotations"].length;
    let image_status_options;
    if (cur_status === "completed") {
        if (num_annotations > 0) {
            image_status_options = ["started", "completed"];
        }
        else {
            image_status_options = ["unannotated", "completed"];
        }
    }
    else if (cur_status === "started") {
        image_status_options = ["started", "completed"];
    }
    else if (cur_status === "unannotated") {
        image_status_options = ["unannotated", "completed"]
    }

    $("#status_combo").empty();
    for (image_status of image_status_options) {
        $("#status_combo").append($('<option>', {
            value: image_status,
            text: image_status
        }));
    }
    $("#status_combo").val(cur_status);
}






function create_viewer_and_anno() {

    $("#seadragon_viewer").empty();


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
        disableEditor: true
    });

    //document.getElementById('seadragon_viewer').querySelector('.openseadragon-canvas').focus();

    viewer.innerTracker.keyDownHandler = function(e) {

        if (e.keyCode == 46) {
            let selected = anno.getSelected();
            anno.removeAnnotation(selected);

            annotations[cur_img_name]["annotations"] = anno.getAnnotations();
            update_image_status();
            set_image_status_combo();
            create_image_set_table();
            $("#save_icon").css("color", "#ed452b");

        }

    }

    viewer.addHandler("open", function(event) {
        anno.clearAnnotations();

        let img_files_name = basename(event.source);
        let img_name = img_files_name.substring(0, img_files_name.length - 4);
        //let img_status = image_set_data["images"][img_name]["status"];
        //console.log("img_status", img_status);
        cur_img_name = img_name;

        $("#image_name").text(cur_img_name);
        set_image_status_combo();


        for (annotation of annotations[cur_img_name]["annotations"]) {
            anno.addAnnotation(annotation);
        }
        //update_overlays();
        //update_count_chart();
    });


    //anno = OpenSeadragon.Annotorious(viewer);

    /*
    anno.makeAnnotatable(viewer);*/

    anno.on('createAnnotation', function(annotation) {
    //anno.handleAnnotationCreated(function(annotation, overrideId) {    
    //anno.addHandler('createAnnotation', function(annotation, overrideId) {
    //anno.on('handleAnnotationCreated', function(annotation, overrideId) {  
        console.log(annotation);

        annotations[cur_img_name]["annotations"] = anno.getAnnotations();

        update_image_status();
        set_image_status_combo();
        $("#save_icon").css("color", "#ed452b");
        create_image_set_table();
    });

    anno.on('createSelection', async function(selection) {

        selection.target.source = window.location.href;

        selection.body = [{
            type: 'TextualBody',
            purpose: 'class',
            value: 'plant'
        }];

        let px_str = selection.target.selector.value;
        let updated_px_str = resize_px_str(px_str);

        selection.target.selector.value = updated_px_str;

        

        // Make sure to wait before saving!
        await anno.updateSelected(selection);
        anno.saveSelected();

        


        //anno.fitBounds(selection);
        //annotations[cur_img_name] = anno.getAnnotations();

    });

    anno.on('startSelection', function(selection) {
        console.log("startSelection");
    });

    anno.on('mouseLeaveAnnotation', function(selection) {
        console.log("mouseLeaveAnnotation");
    });

    anno.on('selectAnnotation', function(annotation, element) {
      console.log("selectAnnotation")
    });

    anno.on('updateAnnotation', async function(annotation, previous) {
        console.log("updateAnnotation");
        let px_str = annotation.target.selector.value;
        let updated_px_str = resize_px_str(px_str);

        annotation.target.selector.value = updated_px_str;

        await anno.updateSelected(annotation);
        anno.saveSelected();

        annotations[cur_img_name]["annotations"] = anno.getAnnotations();
        $("#save_icon").css("color", "#ed452b");

        anno.clearAnnotations();

        for (annotation of annotations[cur_img_name]["annotations"]) {
            anno.addAnnotation(annotation);
        }
    });
    

    anno.on('cancelSelected', function(selection) {
        console.log("cancelSelected");
    });

    anno.on('cancelSelectedTarget', function(selection) {
        console.log("cancelSelectedTarget");
    });

    anno.on('changeSelectionTarget', async function(target) {
        console.log("changeSelectionTarget");
        let selection = anno.getSelected();
        /*
        console.log("selection", selection);

        let px_str = selection.target.selector.value;
        console.log("px_str", px_str);
        
        let updated_px_str = resize_px_str(px_str);
        console.log(updated_px_str);
        
        selection.target.selector.value = updated_px_str;
*/
        console.log(anno.getSelected());
        // Make sure to wait before saving!
        /*
        console.log("selection", selection);
        await anno.updateSelected(selection);
        anno.saveSelected();
        */
        
        //anno.updateSelected(selection, true);
    });


}

function disable_build() {

    let buttons = ["#build_map_button"];

    for (button of buttons) {
        $(button).prop('disabled', true);
        $(button).removeClass("table_button_hover");
        $(button).css("opacity", 0.5);
        $(button).css("cursor", "default");
    }
}


function enable_build() {

    let buttons = ["#build_map_button"];

    for (button of buttons) {
        $(button).prop('disabled', false);
        $(button).addClass("table_button_hover");
        $(button).css("opacity", 1);
        $(button).css("cursor", "pointer");
    }
}



function build_map() {
    disable_build();
    $("#build_loader").show();
    //let sel_metric = $("input[type='radio'][name='metric']:checked").val();
    let sel_interpolation = $("input[type='radio'][name='interpolation']:checked").val();

    //console.log("sel_metric", sel_metric);
    console.log("sel_interpolation", sel_interpolation);
    
    

    $.post($(location).attr('href'),
    {
        action: "build_map",
        //metric: sel_metric,
        interpolation: sel_interpolation
        //image_set_data: JSON.stringify(image_set_data)
    },
    
    function(response, status) {
        $("#build_loader").hide();
        enable_build();
        if (response.error) {    
            console.log("error occurred");
        }
        else {
            let timestamp = new Date().getTime();    

            map_url = "/plant_detection/usr/data/image_sets/" + image_set_info["farm_name"] + "/" + 
                            image_set_info["field_name"] + "/" + image_set_info["mission_date"] + 
                            "/maps/annotated_map.svg?t=" + timestamp;
            console.log("showing map");
            draw_map_chart();
        }
    });


}

function show_map() {
    cur_view = "map";
    save_annotations();


    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-image" style="padding-right: 10px; color: white;"></i>Image View`);

    $("#image_view_container").hide();
    $("#map_view_container").show();


    let num_completed = 0;
    for (image_name of Object.keys(annotations)) {
        if (annotations[image_name]["status"] == "completed") {
            num_completed++;
        }
    }

    if (num_completed >= 3) {
        $("#insufficient_annotation_container").hide();
        $("#map_builder_controls_container").show();
    }
    else {
        $("#map_builder_controls_container").hide();
        $("#insufficient_annotation_container").show();
    }

    draw_map_chart();
}


function show_image() {
    cur_view = "image";

    $("#view_button_text").empty();
    $("#view_button_text").append(
        `<i class="fa-solid fa-location-dot" style="padding-right: 10px; color: white;"></i>Map View`);
    
    $("#map_view_container").hide();
    $("#image_view_container").show();

    create_image_set_table();
}

function save_annotations() {


    $.post($(location).attr('href'),
    {
        action: "save_annotations",
        annotations: JSON.stringify(annotations),
        //image_set_data: JSON.stringify(image_set_data)
    },
    
    function(response, status) {

        if (response.error) {    
            console.log("error occurred");
        }
        else {
            console.log("Annotations Saved!");
            //console.log("image_set_data", response.image_set_data);
            //image_set_data = response.image_set_data;
            create_image_set_table();
            $("#save_icon").css("color", "white");
        }
    });
}

$(document).ready(function() {
    //update_containers();
    console.log(window.location.href);
    console.log("data", data);

    image_set_info = data["image_set_info"];
    //image_set_data = data["image_set_data"];
    dzi_image_paths = data["dzi_image_paths"];
    annotations = data["annotations"];
    metadata = data["metadata"];


    $("#image_set_name").text(image_set_info["farm_name"] + "  |  " + 
                              image_set_info["field_name"] + "  |  " + 
                              image_set_info["mission_date"]);

    image_to_dzi = {};
    for (dzi_image_path of dzi_image_paths) {
        let image_name = basename(dzi_image_path)
        let extensionless_name = image_name.substring(0, image_name.length - 4);
        image_to_dzi[extensionless_name] = dzi_image_path;
    }


    cur_img_name = basename(dzi_image_paths[0]);
    cur_view = "image";


    if ((!(metadata["missing"]["latitude"]) && !(metadata["missing"]["longitude"])) && (!(metadata["missing"]["area_m2"]))) {

        $("#view_button_container").append(
            `<button style="width: 140px; margin: 0px;" id="view_button" class="table_button table_button_hover">` +
            `<div id="view_button_text"></div></button>`
        );


        $("#view_button").click(function() {
            if (cur_view == "image") {
                show_map();
            }
            else {
                show_image();
            }
        });
    }



    create_viewer_and_anno();
    show_image();

    console.log("anno", anno);


    $("#save_button").click(function() {

        //let selected = anno.getSelected();

        save_annotations();
    });

    $("#status_combo").change(function() {

        annotations[cur_img_name]["status"] = $("#status_combo").val();
        set_image_status_combo();
        $("#save_icon").css("color", "#ed452b");
        create_image_set_table();
    });
    /*
    $("#seadragon_viewer").keypress(function(e) {
        //console.log(e);
        if ((e.which == 46) || (e.which == 127)) {
            console.log('pressed delete');
            let selected = anno.getSelected();
            anno.removeAnnotation(selected);

            annotations[cur_img_name]["annotations"] = anno.getAnnotations();
            update_image_status();
            set_image_status_combo();
            create_image_set_table();
            $("#save_icon").css("color", "#ed452b");

        }

    });*/

/*
    $(window).resize(function() {
        update_containers();
    });*/

    $("#help_button").click(function() {
        show_help_modal();
    })

    $("#help_modal_close").click(function() {
        close_help_modal();
    });





});