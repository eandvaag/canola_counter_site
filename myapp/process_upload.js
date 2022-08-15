const path = require('path');
const fs = require('fs');
const { spawn, exec, execSync, fork } = require('child_process');
const { exit } = require('process');

const USR_DATA_ROOT = path.join("usr", "data");
const USR_SHARED_ROOT = path.join("usr", "shared");

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}



function write_upload_status(upload_status_path, upload_status) {
    try {
        fs.writeFileSync(upload_status_path, JSON.stringify(upload_status));
    }
    catch (error) {
        console.log(error);
    }
}

// function sleep(ms) {
//     return new Promise((resolve) => {
//       setTimeout(resolve, ms);
//     });
// }


async function process_upload(username, farm_name, field_name, mission_date, flight_height) {

    console.log("processing upload");

    let image_sets_root = path.join(USR_DATA_ROOT, username, "image_sets");
    let farm_dir = path.join(image_sets_root, farm_name);
    let field_dir = path.join(farm_dir, field_name);
    let mission_dir = path.join(field_dir, mission_date);

    let upload_status_path = path.join(mission_dir, "upload_status.json");


    write_upload_status(upload_status_path, {"status": "processing"});

    let images_dir = path.join(mission_dir, "images");
    let dzi_images_dir = path.join(mission_dir, "dzi_images");
    let conversion_tmp_dir = path.join(dzi_images_dir, "conversion_tmp");
    let annotations_dir = path.join(mission_dir, "annotations");
    let metadata_dir = path.join(mission_dir, "metadata");
    
    let patches_dir = path.join(mission_dir, "patches");
    let excess_green_dir = path.join(mission_dir, "excess_green");

    let model_dir = path.join(mission_dir, "model");
    let training_dir = path.join(model_dir, "training");
    let prediction_dir = path.join(model_dir, "prediction");
    let image_requests_dir = path.join(prediction_dir, "image_requests");
    let image_set_requests_dir = path.join(prediction_dir, "image_set_requests");
    let pending_dir = path.join(image_set_requests_dir, "pending");
    let aborted_dir = path.join(image_set_requests_dir, "aborted");
    let weights_dir = path.join(model_dir, "weights");
    let results_dir = path.join(model_dir, "results");


    let image_names = [];
    fs.readdirSync(images_dir).forEach(image_name => {
        image_names.push(image_name);
    });
    
    console.log("image_names", image_names);

    console.log("creating image set directories");

    fs.mkdirSync(dzi_images_dir, { recursive: true });
    fs.mkdirSync(conversion_tmp_dir, { recursive: true });
    fs.mkdirSync(annotations_dir, { recursive: true });
    fs.mkdirSync(metadata_dir, { recursive: true });
    fs.mkdirSync(patches_dir, { recursive: true });
    fs.mkdirSync(excess_green_dir, { recursive: true });
    fs.mkdirSync(model_dir, { recursive: true });
    fs.mkdirSync(training_dir, { recursive: true });
    fs.mkdirSync(prediction_dir, { recursive: true });
    fs.mkdirSync(image_requests_dir, { recursive: true });
    fs.mkdirSync(image_set_requests_dir, { recursive: true });
    fs.mkdirSync(pending_dir, { recursive: true });
    fs.mkdirSync(aborted_dir, { recursive: true });
    fs.mkdirSync(weights_dir, { recursive: true });
    fs.mkdirSync(results_dir, { recursive: true});

    
    console.log("Copying initial model weights");
    let source_weights_path = path.join(USR_SHARED_ROOT, "weights", "default_weights.h5");
    let best_weights_path = path.join(weights_dir, "best_weights.h5");
    let cur_weights_path = path.join(weights_dir, "cur_weights.h5");
    try {
        fs.copyFileSync(source_weights_path, best_weights_path);
        fs.copyFileSync(source_weights_path, cur_weights_path);
    }
    catch (error) {
        write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
        return;
    }

    let status = {
        "status": "idle",
        "num_images_fully_trained_on": 0,
        "update_num": 0
    };
    let status_path = path.join(model_dir, "status.json");
    try {
        fs.writeFileSync(status_path, JSON.stringify(status));
    }
    catch (error) {
        write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
        return;
    }


    console.log("Making the annotations file");
    let annotations_path = path.join(annotations_dir, "annotations_w3c.json");
    let annotations = {};
    for (image_name of image_names) {
        //let sanitized_fname = sanitize(filename);
        //let extensionless_fname = sanitized_fname.substring(0, sanitized_fname.length-4);
        let extensionless_fname = image_name.substring(0, image_name.length-4);
        annotations[extensionless_fname] = {
            "status": "unannotated",
            "annotations": []
        };
    }
    console.log("Writing the annotations file");
    try {
        fs.writeFileSync(annotations_path, JSON.stringify(annotations));
    }
    catch (error) {
        write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
        return;
    }

    let annotations_lock_path = path.join(annotations_dir, "lock.json")
    let annotations_lock = {
        "last_refresh": 0
    };
    try {
        fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
    }
    catch (error) {
        write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
        return;
    }

    let loss_record_path = path.join(training_dir, "loss_record.json")
    let loss_record = {
        "training_loss": { "values": [],
                           "best": 100000000,
                           "epochs_since_improvement": 100000000}, 
        "validation_loss": {"values": [],
                            "best": 100000000,
                            "epochs_since_improvement": 100000000},
        "num_training_images": 0
    }
    try {
        fs.writeFileSync(loss_record_path, JSON.stringify(loss_record));
    }
    catch (error) {
        write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
        return;
    }
    // try {
    //     throw "test error";
    // }
    // catch (error) {
    //     write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
    //     return;
    // }


    //let remaining = image_names.length;
    let conv_index = 0;
    let num_converted = 0;
    let num_converting = 0;
    const max_subprocesses = 10;
    const no_convert_extensions = [".jpg", ".JPG", ".png", ".PNG"];
    let error_written = false;


    while (num_converted < image_names.length) {
        if (num_converting < max_subprocesses && conv_index < image_names.length) {
            image_name = image_names[conv_index];
            conv_index++;
            num_converting++;

            let extension = image_name.substring(image_name.length-4);
            let extensionless_fname = image_name.substring(0, image_name.length-4);
            let fpath = path.join(images_dir, image_name);
            let img_dzi_path = path.join(dzi_images_dir, extensionless_fname);


            if (!(no_convert_extensions.includes(extension))) {
                console.log("conversion is required");
                let tmp_path = path.join(conversion_tmp_dir, extensionless_fname + ".jpg");
                let conv_cmd = "convert " + fpath + " " + tmp_path;
                let slice_cmd = "./MagickSlicer/magick-slicer.sh '" + tmp_path + "' '" + img_dzi_path + "'";

                exec(conv_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {

                    if ((error) && (!error_written)) {
                        console.log(error.stack);
                        console.log('Error code: '+error.code);
                        console.log('Signal received: '+error.signal);
                        write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
                        process.exit(1);
                    }

                    exec(slice_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                        if ((error) && (!error_written)) {
                            error_written = true;
                            console.log(error.stack);
                            console.log('Error code: '+error.code);
                            console.log('Signal received: '+error.signal);
                            write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
                            process.exit(1);
                        }
                        try {
                            fs.unlinkSync(tmp_path);
                        }
                        catch (error) {
                            write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
                            process.exit(1);
                        }

                        num_converting--;
                        num_converted++;
                    });
                });

            }
            else {

                console.log("conversion is not required");
                let slice_cmd = "./MagickSlicer/magick-slicer.sh '" + fpath + "' '" + img_dzi_path + "'";
                // try {
                //     execSync(slice_cmd, {shell: "/bin/bash"});
                // }
                exec(slice_cmd,  {shell: "/bin/bash"}, function (error, stdout, stderr) {
                    if ((error) && (!error_written)) {
                        error_written = true;
                        console.log(error.stack);
                        console.log('Error code: '+error.code);
                        console.log('Signal received: '+error.signal);
                        write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
                        process.exit(1);
                    }
                    num_converting--;
                    num_converted++;
                });
            }



        }
        // if (error_written) {
        //     return;
        // }
        //await sleep(100);
        await new Promise(resolve => setTimeout(resolve, 100));

    }




    // for (image_name of image_names) {

    //     console.log("processing", image_name);

    //     let extension = image_name.substring(image_name.length-4);
    //     let extensionless_fname = image_name.substring(0, image_name.length-4);
    //     let fpath = path.join(images_dir, image_name);
    //     let img_dzi_path = path.join(dzi_images_dir, extensionless_fname);


    //     let no_convert_extensions = [".jpg", ".JPG", ".png", ".PNG"];
    //     if (!(no_convert_extensions.includes(extension))) {
    //         console.log("conversion is required");
    //         let tmp_path = path.join(conversion_tmp_dir, extensionless_fname + ".jpg");
    //         let conv_cmd = "convert " + fpath + " " + tmp_path;
    //         let slice_cmd = "./MagickSlicer/magick-slicer.sh '" + tmp_path + "' '" + img_dzi_path + "'";
    //         try {
    //             execSync(conv_cmd, {shell: "/bin/bash"});
    //         }
    //         catch (error) {
    //             console.log(error.stack);
    //             console.log('Error code: '+error.code);
    //             console.log('Signal received: '+error.signal);
    //             write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
    //             return;
    //         }
    //         try {
    //             execSync(slice_cmd, {shell: "/bin/bash"});
    //         }
    //         catch (error) {
    //             console.log(error.stack);
    //             console.log('Error code: '+error.code);
    //             console.log('Signal received: '+error.signal);
    //             write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
    //             return;
    //         }
    //         try {
    //             fs.unlinkSync(tmp_path);
    //         }
    //         catch (error) {
    //             write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
    //             return;
    //         }
    //     }
    //     else {
    //         console.log("conversion is not required");
    //         let slice_cmd = "./MagickSlicer/magick-slicer.sh '" + fpath + "' '" + img_dzi_path + "'";
    //         try {
    //             execSync(slice_cmd, {shell: "/bin/bash"});
    //         }
    //         catch (error) {
    //             console.log(error.stack);
    //             console.log('Error code: '+error.code);
    //             console.log('Signal received: '+error.signal);
    //             write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
    //             return;
    //         }
    //     }
    // }

    console.log("Creating excess green images...")
    let exg_command = "python ../../plant_detection/src/excess_green.py " + mission_dir;
    try {
        execSync(exg_command, {shell: "/bin/bash"});
    }
    catch (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
        write_upload_status(upload_status_path, {"status": "failed", "error": error.toString()});
        return;
    }

    console.log("Collecting metadata...");
    console.log("flight_height", flight_height);
    let metadata_command = "python ../../plant_detection/src/metadata.py " + mission_dir;
    if (isNumeric(flight_height)) {
        numeric_flight_height = parseFloat(flight_height);
        if (numeric_flight_height < 0.1 || numeric_flight_height > 100) {
            write_upload_status(upload_status_path, {"status": "failed", "error": "Provided flight height is invalid."});
            return;
        }
    }
    else {
        write_upload_status(upload_status_path, {"status": "failed", "error": "Provided flight height is invalid."});
        return;
    }
    metadata_command = metadata_command + " --flight_height " + flight_height;
    console.log(metadata_command);
    try {
        execSync(metadata_command, {shell: "/bin/bash"});
    }
    catch (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);  
        write_upload_status(upload_status_path, {"status": "failed", "error": "Error occurred during metadata extraction."});
        return;
    }

    write_upload_status(upload_status_path, {"status": "uploaded"});
    return;
}



let username = process.argv[2]
let farm_name = process.argv[3];
let field_name = process.argv[4];
let mission_date = process.argv[5];
let flight_height=  process.argv[6];

process_upload(username, farm_name, field_name, mission_date, flight_height);