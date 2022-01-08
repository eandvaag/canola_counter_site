
function clear_form() {
    $("#farm_input").val("");
    $("#field_input").val("");
    $("#mission_input").val("");
    dropzone_handler.removeAllFiles();
}

function close_modal() {
    $("#modal_header_text").val("");
    $("#modal_message").val("");
    $("#result_modal").css("display", "none");
}

function disable_input() {

    let buttons = ["#upload_button"];

    for (button of buttons) {
        $(button).prop('disabled', true);
        $(button).removeClass("std-button-hover");
        $(button).css("opacity", 0.5);
        $(button).css("cursor", "default");
    }

    let inputs = ["farm_input", "field_input", "mission_input"];

    for (input of inputs) {
        $("#" + input).prop("disabled", true);
        $("#" + input).css("opacity", 0.5);
    }

    $("#file-drop").addClass("disabled_dropzone");
    $("#file-drop").css("opacity", 0.7);
}

function disable_submit() {

    let buttons = ["#upload_button"];

    for (button of buttons) {
        $(button).prop('disabled', true);
        $(button).removeClass("std-button-hover");
        $(button).css("opacity", 0.5);
        $(button).css("cursor", "default");
    }
}



function enable_input() {

    let buttons = ["#upload_button"];

    for (button of buttons) {
        $(button).prop('disabled', false);
        $(button).addClass("std-button-hover");
        $(button).css("opacity", 1);
        $(button).css("cursor", "pointer");
    }

    let inputs = ["farm_input", "field_input", "mission_input"];

    for (input of inputs) {
        $("#" + input).prop("disabled", false);
        $("#" + input).css("opacity", 1.0);
    }

    $("#file-drop").removeClass("disabled_dropzone");
    $("#file-drop").css("opacity", 1.0);

}


function enable_submit() {

    let buttons = ["#upload_button"];

    for (button of buttons) {
        $(button).prop('disabled', false);
        $(button).addClass("std-button-hover");
        $(button).css("opacity", 1);
        $(button).css("cursor", "pointer");
    }
}

function form_is_complete() {
    let inputs_to_check = ["farm_input", "field_input", "mission_input"];
    for (input of inputs_to_check) {
        if ($("#" + input).val() === "") {
            return false;
        }
    }
    if (dropzone_handler.files.length == 0) {
        return false;
    }
    return true;
}

function update_submit() {
    if (form_is_complete()) {
        enable_submit();
    }
    else {
        disable_submit();
    }
}
//const { Dropzone } = require("dropzone");


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

let dropzone_handler;
let errors = [];

$(document).ready(function() {

    update_containers();

    disable_submit();
    $("#upload_loader").hide();
    //$("#file_drop").dropzone({ 
    /*
    dropzone_handler = new Dropzone("#file_drop",
    {
        url: "/plant_detection/upload_images",
        //acceptedFiles: [".png", ".PNG", ".jpg", ".JPG"],
        autoProcessQueue: false,
        addRemoveLinks: true
    });

    //let myDropzone = Dropzone("#my-element", {  options  });
    dropzone_handler.on("addedfile", file => {
      console.log("A file has been added");
    });*/
    /*
    let myDropzone = new Dropzone("#my-form");
    */
    /*
    $("#file_drop").on("addedfile", file => {
        console.log(`file added: ${file.name}`);
    });*/


    //$("#submit_button").click(function(e) {

    dropzone_handler = new Dropzone("#file-drop", { 
        url: "/plant_detection/upload",
        autoProcessQueue: false,
        paramName: function(n) { return 'source_file[]'; },
        uploadMultiple: true,
        farm_name: '',
        field_name: '',
        mission_date: '',
        //addRemoveLinks : true,
        parallelUploads: 100,
        maxUploads: 100
    });

    dropzone_handler.on("queuecomplete", function(files, response) {


        if (dropzone_handler.getAcceptedFiles().length > 0) {
            console.log("An error occurred");
            $("#modal_header_text").html("Error");
            $("#modal_message").html("An error occurred during the upload process:<br>" + errors[0]);
            $("#result_modal").css("display", "block");
            errors = [];
        }
        else {
            console.log("All done!");
            $("#modal_header_text").html("Success!");
            $("#modal_message").html("Your image set was successfully uploaded!" +
                                     "<br>The image set should now appear on the Home page.");
            $("#result_modal").css("display", "block");

            //$("#upload_message").html("Success!");
        }
        clear_form();
        enable_input();
        disable_submit();
        $("#upload_loader").hide();
    });
    dropzone_handler.on("success", function(file, response) {    
        console.log("complete!");
        console.log("response", response);
        console.log("response.code", response.code);
        console.log("file", file);
        dropzone_handler.removeFile(file);



        /*
        if (response == 422) {
            console.log(response.error);
        }*/
/*
      if(response.code == 501){ // succeeded
        return file.previewElement.classList.add("dz-success"); // from source
      }else if (response.code == 403){  //  error
        // below is from the source code too
        var node, _i, _len, _ref, _results;
        var message = response.msg // modify it to your error message
        file.previewElement.classList.add("dz-error");
        _ref = file.previewElement.querySelectorAll("[data-dz-errormessage]");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          _results.push(node.textContent = message);
        }
        return _results;
      }*/

    });

    dropzone_handler.on("error", function(files, response) {

        console.log("error!");
        console.log("response", response);
        console.log("files", files);
        console.log("response.error", response.error);
        errors.push(response.error);
    });




    dropzone_handler.on("addedfile", function() {
        console.log("added file!");
        $("form").change();
        /*
        if (form_is_complete()) {
            enable_input();
        }*/
    });

    dropzone_handler.on('sending', function(file, xhr, formData) {
        formData.append('farm_name', $("#farm_input").val());
        formData.append('field_name', $("#field_input").val());
        formData.append('mission_date', $("#mission_input").val());
    });

    $("#upload_button").click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        disable_input();
        $("#upload_loader").show();

        dropzone_handler.processQueue();
    });


    /*
    Dropzone.options.fileDrop = {
        url: "/plant_detection/upload_images",
        autoProcessQueue: false,
        paramName: function(n) { return 'source_file[]'; },
        uploadMultiple: true,
        parallelUploads: 4,

        init: function() {
            var myDropzone = this;
            this.on("completemultiple", function(files, response) {
                console.log("complete!");
            });

            this.on("addedfile", function() {
                console.log("added file!");
                enable_input();
            });

            $("#upload_button").click(function(e) {
                console.log("now uploading!");

                e.preventDefault();
                e.stopPropagation();

                myDropzone.processQueue();
            })
        }
    }*/

/*
    dropzone_handler = new Dropzone("#file-drop",
    {
        url: "/plant_detection/upload_images",
    });*/


    /*
    $("#upload_form").submit(function(e) {
        e.preventDefault();
        console.log("now submitting");

        dropzone_handler.processQueue();
    });*/


    $("#farm_input").on("input", function(e) {
        update_submit();
    });

    $("#field_input").on("input", function(e) {
        update_submit();
    });

    $("#mission_input").on("input", function(e) {
        update_submit();
    });

    $("form").change(function() {
        update_submit();
    });

    $("#modal_close").click(function() {
        console.log("closing modal");
        close_modal();
    });

    $(window).resize(function() {
        update_containers();
    });

});
