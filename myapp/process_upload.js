const path = require('path');
const fs = require('fs');
const { spawn, exec, execSync, fork } = require('child_process');
const { exit } = require('process');
const https = require('https');

const USR_DATA_ROOT = path.join("usr", "data");
const USR_SHARED_ROOT = path.join("usr", "shared");



// let socket_api = require("./socket_api");

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

function write_and_notify(upload_status_path, upload_status, notify_data) {
    write_upload_status(upload_status_path, upload_status)
    upload_notify(notify_data["username"], notify_data["farm_name"], notify_data["field_name"], notify_data["mission_date"]);
}

// function sleep(ms) {
//     return new Promise((resolve) => {
//       setTimeout(resolve, ms);
//     });
// }


function upload_notify(username, farm_name, field_name, mission_date) {

    console.log("attempting to notify the server");

    let data = JSON.stringify({
        username: username,
        farm_name: farm_name,
        field_name: field_name,
        mission_date: mission_date
    });

    let options = {
        hostname: process.env.CC_IP, //'172.16.1.75', //71',
        port: parseInt(process.env.CC_PORT), //8110,
        path: process.env.CC_PATH + '/upload_notification',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
        rejectUnauthorized: false
    };

    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);

        res.on("data", d => {
            process.stdout.write(d);
        });
    });

    req.on("error", error => {
        console.log(error);
    });

    req.write(data);
    req.end();
}



async function process_upload(username, farm_name, field_name, mission_date, camera_height) {

    let notify_data = {
        "username": username,
        "farm_name": farm_name,
        "field_name": field_name,
        "mission_date": mission_date
    }

    console.log("processing upload");

    let image_sets_root = path.join(USR_DATA_ROOT, username, "image_sets");
    let farm_dir = path.join(image_sets_root, farm_name);
    let field_dir = path.join(farm_dir, field_name);
    let mission_dir = path.join(field_dir, mission_date);

    let upload_status_path = path.join(mission_dir, "upload_status.json");


    write_upload_status(upload_status_path, {"status": "processing"});

    let images_dir = path.join(mission_dir, "images");
    let dzi_images_dir = path.join(mission_dir, "dzi_images");
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
    try {
        fs.readdirSync(images_dir).forEach(image_name => {
            image_names.push(image_name);
        });
    }
    catch (error) {
        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
        return;
    }

    console.log("Creating image set directories");
    try {
        fs.mkdirSync(dzi_images_dir, { recursive: true });
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
        // fs.mkdirSync(retrieval_dir, { recursive: true});
    }
    catch (error) {
        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
        return;
    }    

    
    console.log("Copying initial model weights");
    let source_weights_path = path.join(USR_SHARED_ROOT, "weights", "default_weights.h5");
    let best_weights_path = path.join(weights_dir, "best_weights.h5");
    let cur_weights_path = path.join(weights_dir, "cur_weights.h5");
    try {
        fs.copyFileSync(source_weights_path, best_weights_path);
        fs.copyFileSync(source_weights_path, cur_weights_path);
    }
    catch (error) {
        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
        return;
    }

    let status = {
        // "username": username,
        // "farm_name": farm_name,
        // "field_name": field_name,
        // "mission_date": mission_date,
        "num_images_fully_trained_on": 0
        // "status": "idle",
        // "num_images_fully_trained_on": 0,
        // "fully_trained": "True",
        // "update_num": 0
    };
    let status_path = path.join(model_dir, "status.json");
    try {
        fs.writeFileSync(status_path, JSON.stringify(status));
    }
    catch (error) {
        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
        return;
    }


    console.log("Making the annotations file");
    let annotations_path = path.join(annotations_dir, "annotations_w3c.json");
    let annotations = {};
    for (let image_name of image_names) {
        //let sanitized_fname = sanitize(filename);
        //let extensionless_fname = sanitized_fname.substring(0, sanitized_fname.length-4);
        let extensionless_fname = image_name.substring(0, image_name.length-4);
        annotations[extensionless_fname] = {
            "status": "unannotated",
            "annotations": [],
            // "update_time": 0
            // "write_time": 0
        };
    }
    console.log("Writing the annotations file");
    try {
        fs.writeFileSync(annotations_path, JSON.stringify(annotations));
    }
    catch (error) {
        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
        return;
    }

    // let annotations_lock_path = path.join(annotations_dir, "lock.json")
    // let annotations_lock = {
    //     "last_refresh": 0
    // };
    // try {
    //     fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
    // }
    // catch (error) {
    //     write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
    //     return;
    // }

    let loss_record_path = path.join(training_dir, "loss_record.json")
    let loss_record = {
        "training_loss": { "values": [],
                           "best": 100000000,
                           "epochs_since_improvement": 100000000}, 
        "validation_loss": {"values": [],
                            "best": 100000000,
                            "epochs_since_improvement": 100000000}
    }
    try {
        fs.writeFileSync(loss_record_path, JSON.stringify(loss_record));
    }
    catch (error) {
        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
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

            console.log("Creating DZI image (%i / %i)", conv_index+1, image_names.length);

            image_name = image_names[conv_index];
            conv_index++;
            num_converting++;

            let extension = image_name.substring(image_name.length-4);
            let extensionless_fname = image_name.substring(0, image_name.length-4);
            let fpath = path.join(images_dir, image_name);
            let img_dzi_path = path.join(dzi_images_dir, extensionless_fname);


            if (!(no_convert_extensions.includes(extension))) {
                // console.log("conversion is required");

                // convert to .png
                let new_path = path.join(images_dir, extensionless_fname + ".png");
                let conv_cmd = "convert " + fpath + " " + new_path;
                let slice_cmd = "./MagickSlicer/magick-slicer.sh -v1 '" + new_path + "' '" + img_dzi_path + "'";

                exec(conv_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {

                    if ((error) && (!error_written)) {
                        console.log(error.stack);
                        console.log('Error code: '+error.code);
                        console.log('Signal received: '+error.signal);
                        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
                        //process.exit(1);
                        return;
                    }

                    exec(slice_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                        if ((error) && (!error_written)) {
                            error_written = true;
                            console.log(error.stack);
                            console.log('Error code: '+error.code);
                            console.log('Signal received: '+error.signal);
                            write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
                            process.exit(1);
                        }

                        // delete original file
                        try {
                            fs.unlinkSync(fpath);
                        }
                        catch (error) {
                            write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
                            //process.exit(1);
                            return;
                        }

                        num_converting--;
                        num_converted++;
                    });
                });
            }
            else {

                // console.log("conversion is not required");
                let slice_cmd = "./MagickSlicer/magick-slicer.sh -v1 '" + fpath + "' '" + img_dzi_path + "'";
                // try {
                //     execSync(slice_cmd, {shell: "/bin/bash"});
                // }
                exec(slice_cmd,  {shell: "/bin/bash"}, function (error, stdout, stderr) {
                    if ((error) && (!error_written)) {
                        error_written = true;
                        console.log(error.stack);
                        console.log('Error code: '+error.code);
                        console.log('Signal received: '+error.signal);
                        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
                        //process.exit(1);
                        return;
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



    console.log("Creating excess green images...")
    let exg_command = "python ../../plant_detection/src/excess_green.py " + mission_dir;
    try {
        execSync(exg_command, {shell: "/bin/bash"});
    }
    catch (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
        return;
    }

    console.log("Collecting metadata...");
    console.log("camera_height", camera_height);
    let metadata_command = "python ../../plant_detection/src/metadata.py " + mission_dir;
    if (camera_height.length > 0) {
        if (isNumeric(camera_height)) {
            let numeric_camera_height = parseFloat(camera_height);
            if (numeric_camera_height < 0.01 || numeric_camera_height > 1000) {
                write_and_notify(upload_status_path, {"status": "failed", "error": "Provided camera height is invalid."}, notify_data);
                return;
            }
        }
        else {
            write_and_notify(upload_status_path, {"status": "failed", "error": "Provided camera height is invalid."}, notify_data);
            return;
        }
        metadata_command = metadata_command + " --camera_height " + camera_height;
    }
    console.log(metadata_command);
    try {
        execSync(metadata_command, {shell: "/bin/bash"});
    }
    catch (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);  
        write_and_notify(upload_status_path, {"status": "failed", "error": error.toString()}, notify_data);
        return;
    }

    write_and_notify(upload_status_path, {"status": "uploaded"}, notify_data);

    console.log("finished processing");

    return;
}



let username = process.argv[2]
let farm_name = process.argv[3];
let field_name = process.argv[4];
let mission_date = process.argv[5];
let camera_height = process.argv[6];

process_upload(username, farm_name, field_name, mission_date, camera_height);