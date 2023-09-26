

var session = require('express-session');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const xml_js_convert = require('xml-js');
const nat_orderBy = require('natural-orderby');
const { spawn, exec, execSync, fork } = require('child_process');
const http = require('http');
//const sizeOf = require('buffer-image-size'); //require('image-size')
//const gm = require('gm').subClass({ imageMagick: true });
//; //.subClass({ imageMagick: '7+' });

//const sanitize = require('sanitize-filename');

const models = require('../models');
//const { response } = require('express');

const glob = require("glob");
//const { parse, join } = require('path');


var socket_api = require('../socket_api');
const { response } = require('express');
//const { rawListeners } = require('process');


const USR_DATA_ROOT = path.join("usr", "data");
const USR_SHARED_ROOT = path.join("usr", "shared");

let active_uploads = {};
var Mutex = require('async-mutex').Mutex;


//const annotation_mutex = new Mutex();
const image_sets_mutex = new Mutex();
const camera_mutex = new Mutex();



const MAX_EXTENSIONLESS_FILENAME_LENGTH = 100;
//const valid_extensions = [".jpg", ".JPG", ".png", ".PNG", ".tif", ".TIF"];
const valid_extensions = ["jpg", "JPG", "jpeg", "JPEG", "png", "PNG", "tif", "TIF", "tiff", "TIFF"]; //, "bin"];


const FILE_FORMAT = /[\s `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
const FARM_FIELD_MISSION_FORMAT = /[\s `!@#$%^&*()+\=\[\]{}.;':"\\|,<>\/?~]/;
const MODEL_NAME_FORMAT = /[\s `!@#$%^&*()+\=\[\]{}.;':"\\|,<>\/?~]/;


Date.prototype.isValid = function () {
    // An invalid date object returns NaN for getTime() and NaN is the only
    // object not strictly equal to itself.
    return this.getTime() === this.getTime();
};  

/*
exports.sessionChecker = function(req, res, next) {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect(APP_PREFIX + '/user');
    } else {
        next();
    }
}
*/

// scheduler();

// function scheduler() {

//     console.log("scheduler ran");
//     setTimeout(scheduler, 5000);

// }

/*
console.log("Starting the python server...");

let scheduler = spawn("python3", ["../../plant_detection/src/server.py"]);


scheduler.on('close', (code) => {
    console.log("Scheduler finished.");
    console.log("code", code);  
});

scheduler.stderr.on('data', (data) => {
    // for some reason listening on stderr is required for files to be 
    //   output correctly by the subprocess ?? 
    console.error(`scheduler stderr: ${data}`);
});
scheduler.stdout.on('data', (data) => {
    console.log(`scheduler stdout: ${data}`);
});

scheduler.on('SIGINT', function() {
    console.log('Received SIGINT signal');
});

scheduler.on('error', (error) => {
    console.log("Failed to start subprocess.");
    console.log(error);
});*/


exports.get_sign_in = function(req, res, next) {
    res.render('sign_in');
}


// exports.get_test_anno = function(req, res, next) {
//     res.render('test_anno');
// }

exports.post_sign_in = function(req, res, next) {
    let response = {};
    response.not_found = false;
    response.error = false;
    response.maintenance = false;

    return models.users.findOne({
    where: {
        username: req.body.username,
    }
    }).then(user => {
        if (!user) {
            response.not_found = true;
            return res.json(response);
        }
        else {
            if (!user.check_password(req.body.password)) {
                response.not_found = true;
                return res.json(response);
            }
            else {
                if (fpath_exists(path.join(USR_SHARED_ROOT, "admin.txt")) && (req.body.username !== "erik")) {
                    response.maintenance = true;
                    return res.json(response);
                }


                req.session.user = user.dataValues;
                response.redirect = process.env.CC_PATH + "/home/" + req.body.username;
                return res.json(response);
            }
        }
    }).catch(error => {
        response.error = true;
        return res.json(response);
    });
}


function get_subdirnames(dir) {
    let subdirnames = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        let fpath = path.join(dir, file);
        let stat = fs.statSync(fpath);
        if (stat && stat.isDirectory()) {
            subdirnames.push(file);
        }
    });
    return subdirnames;
}

function get_subdirpaths(dir) {
    let subdirpaths = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        let fpath = path.join(dir, file);
        let stat = fs.statSync(fpath);
        if (stat && stat.isDirectory()) {
            subdirpaths.push(fpath);
        }
    });
    return subdirpaths;
}

function fpath_exists(fpath) {
    let exists = true;
    try {
        fs.accessSync(fpath, fs.constants.F_OK);
    }
    catch (e) {
        exists = false;
    }
    return exists;
}


exports.get_home = function(req, res, next) {

    if ((req.session.user && req.cookies.user_sid) && (req.params.username === req.session.user.username)) {

        console.log("Gathering image_sets");

        let image_sets_data = {};
        let image_sets_root = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets");
        let farm_names;
        try {
           farm_names = get_subdirnames(image_sets_root);
        }
        catch (error) {
            return res.redirect(process.env.CC_PATH);
        }

        let overlay_appearance;
        let overlay_appearance_path = path.join(USR_DATA_ROOT, req.session.user.username, "overlay_appearance.json");
        try {
            overlay_appearance = JSON.parse(fs.readFileSync(overlay_appearance_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }

        for (let farm_name of farm_names) {
            
            let farm_root = path.join(image_sets_root, farm_name);
            let field_names = get_subdirnames(farm_root);

            for (let field_name of field_names) {
                let field_root = path.join(farm_root, field_name);
                let mission_dates = get_subdirnames(field_root);
                
                for (let mission_date of mission_dates) {
                    let mission_root = path.join(field_root, mission_date);

                    let upload_status_path = path.join(mission_root, "upload_status.json");
                    if (fs.existsSync(upload_status_path)) {

                        try {
                            upload_status = JSON.parse(fs.readFileSync(upload_status_path, 'utf8'));
                        }
                        catch (error) {
                            return res.redirect(process.env.CC_PATH);
                        }

                        if (!(farm_name in image_sets_data)) {
                            image_sets_data[farm_name] = {};
                        }
                        if (!(field_name in image_sets_data[farm_name])) {
                            image_sets_data[farm_name][field_name] = {};
                        }

                        image_sets_data[farm_name][field_name][mission_date] = upload_status;
                    }

                    //else {
                        /* Upload was never completed, remove the directory */
                        //fs.rmSync(mission_root, { recursive: true, force: true });
/*
                        let missions = get_subdirs(field_dir);
                        if (missions.length == 0) {
                            fs.rmSync(field_dir, { recursive: true, force: true });
                            let fields = get_subdirs(farm_dir);
                            if (fields.length == 0) {
                                fs.rmSync(farm_dir, { recursive: true, force: true });
                            }
                        }*/
                    //}
                }
            }
        }


        image_sets_mutex.acquire()
        .then(function(release) {
            let public_image_sets_path = path.join(USR_SHARED_ROOT, "public_image_sets.json");
            let available_image_sets;
            try {
                available_image_sets = JSON.parse(fs.readFileSync(public_image_sets_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                res.redirect(process.env.CC_PATH);
            }

            let private_image_sets_path = path.join(USR_DATA_ROOT, req.session.user.username, "private_image_sets.json");
            let private_image_sets;
            try {
                private_image_sets = JSON.parse(fs.readFileSync(private_image_sets_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                res.redirect(process.env.CC_PATH);
            }

            release();

            for (let username of Object.keys(private_image_sets)) {
                if (!(username in available_image_sets)) {
                    available_image_sets[username] = {};
                }
                for (let farm_name of Object.keys(private_image_sets[username])) {
                    if (!(farm_name in available_image_sets[username])) {
                        available_image_sets[username][farm_name] = {};
                    }
                    for (let field_name of Object.keys(private_image_sets[username][farm_name])) {
                        if (!(field_name in available_image_sets[username][farm_name])) {
                            available_image_sets[username][farm_name][field_name] = {};
                        }
                        for (let mission_date of Object.keys(private_image_sets[username][farm_name][field_name])) {
                            available_image_sets[username][farm_name][field_name][mission_date] = private_image_sets[username][farm_name][field_name][mission_date];
                        }
                    }
                }
            }

                
            let objects_path = path.join(USR_SHARED_ROOT, "objects.json");
            let objects;
            try {
                objects = JSON.parse(fs.readFileSync(objects_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
                res.redirect(process.env.CC_PATH);
            }
            


            camera_mutex.acquire()
            .then(function(release) {

                let camera_specs;
                let camera_specs_path = path.join(USR_DATA_ROOT, req.session.user.username, "cameras", "cameras.json");
                try {
                    camera_specs = JSON.parse(fs.readFileSync(camera_specs_path, 'utf8'));
                }
                catch (error) {
                    release();
                    console.log(error);
                    res.redirect(process.env.CC_PATH);
                }


                release();

                let data = {};
                data["username"] = req.session.user.username;
                data["image_sets_data"] = image_sets_data;
                data["camera_specs"] = camera_specs;
                data["objects"] = objects;
                data["available_image_sets"] = available_image_sets;
                data["overlay_appearance"] = overlay_appearance;
            
                res.render("home", {
                    username: req.session.user.username, 
                    data: data
                    // image_sets_data: image_sets_data,
                    // camera_specs: camera_specs,
                    // objects: objects,
                    // available_image_sets: available_image_sets,
                    // overlay_colors: overlay_colors
                });


            }).catch(function(error) {
                console.log(error);
                res.redirect(process.env.CC_PATH);
            });

        }).catch(function(error) {
            console.log(error);
            res.redirect(process.env.CC_PATH);
        });
    }
    else {
        res.redirect(process.env.CC_PATH);
    }
}

function is_hex_color(hex_color) {
    if (hex_color.length != 7) {
        return false;
    }
    if (hex_color[0] !== "#") {
        return false;
    }
    let valid_chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", 
    "a", "b", "c", "d", "e", "f", "A", "B", "C", "D", "E", "F"];
    for (let i = 1; i < hex_color.length; i++) {
        if (!(valid_chars.includes(hex_color[i]))) {
            return false;
        }
    }

    return true;

    // var s = new Option().style;
    // s.color = strColor;
    // return s.color == strColor;
}

exports.post_overlay_appearance_change = function(req, res, next) {

    let overlay_appearance = JSON.parse(req.body.overlay_appearance);
    let overlay_appearance_path = path.join(USR_DATA_ROOT, req.session.user.username, "overlay_appearance.json");

    let response = {};
    if (Object.keys(overlay_appearance["colors"]).length != 4) {
        response.error = true;
        response.message = "Invalid overlay colors object.";
        return res.json(response);
    }

    for (let overlay_key of ["annotation", "prediction", "region_of_interest", "training_region", "test_region"]) {
        if (!(overlay_key in overlay_appearance["colors"])) {
            response.error = true;
            response.message = "Missing overlay key: '" + overlay_key + "'.";
            return res.json(response);
        }
        if (!(is_hex_color(overlay_appearance["colors"][overlay_key]))) {
            response.error = true;
            response.message = "Invalid overlay color provided.";
            return res.json(response);
        }

    }

    try {
        fs.writeFileSync(overlay_appearance_path, JSON.stringify(overlay_appearance));
    }
    catch (error) {
        response.error = true;
        response.message = "Failed to save overlay colors.";
        return res.json(response);
    }

    response.error = false;
    return res.json(response);


}

exports.get_workspace = function(req, res, next) {

    if ((req.session.user && req.cookies.user_sid) && (req.params.username === req.session.user.username)) {
        
        let farm_name = req.params.farm_name;
        let field_name = req.params.field_name;
        let mission_date = req.params.mission_date;
        let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name, field_name, mission_date);

        if (!(fpath_exists(image_set_dir))) {
            return res.redirect(process.env.CC_PATH);
        }

        let key = req.session.user.username + "/" + farm_name + "/" + field_name + "/" + mission_date;

        //annotation_mutex.acquire()
        //.then(function(release) {
        for (let socket_id of Object.keys(socket_api.workspace_id_to_key)) {
            if (socket_api.workspace_id_to_key[socket_id] === key) {
                console.log("The workspace is in use", key);
                //release();
                return res.redirect(process.env.CC_PATH + "/home/" + req.session.user.username); 
            }
        }

            /*
            if (key in socket_api.workspace_key_to_id) {
                console.log("The workspace is in use", key);
                release();
                return res.redirect(process.env.CC_PATH + "/home/" + req.session.user.username);
            }*/

            //socket_api.workspace_key_to_id[key] = "tmp_hold";
            //release();


        glob(path.join(image_set_dir, "images", "*"), function(error, image_paths) {
            if (error) {
                return res.redirect(process.env.CC_PATH);
            }
            let image_ext = image_paths[0].substring(image_paths[0].length - 4);
            /*
            let status_path = path.join(image_set_dir, "model", "status.json");
            let status;
            try {
                status = JSON.parse(fs.readFileSync(status_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
                return res.redirect(process.env.CC_PATH);
            }*/

            let overlay_appearance;
            let overlay_appearance_path = path.join(USR_DATA_ROOT, req.session.user.username, "overlay_appearance.json");
            try {
                overlay_appearance = JSON.parse(fs.readFileSync(overlay_appearance_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
                return res.redirect(process.env.CC_PATH);
            }

            console.log("getting annotations");
            let annotations_dir = path.join(image_set_dir, "annotations");
            let annotations_path = path.join(annotations_dir, "annotations.json");
            let annotations;
            try {
                annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
                return res.redirect(process.env.CC_PATH);
            }

            console.log("getting metadata");
            let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
            let metadata;
            try {
                metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
                return res.redirect(process.env.CC_PATH);
            }

            console.log("getting camera specs");
            let camera_specs_path = path.join(USR_DATA_ROOT, req.session.user.username, "cameras", "cameras.json");
            let camera_specs;
            try {
                camera_specs = JSON.parse(fs.readFileSync(camera_specs_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
                return res.redirect(process.env.CC_PATH);
            }

            let excess_green_record;
            console.log("getting exg record");
            let excess_green_record_path = path.join(image_set_dir, "excess_green", "record.json");
            
            try {
                excess_green_record = JSON.parse(fs.readFileSync(excess_green_record_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
                return res.redirect(process.env.CC_PATH);
            }

            let tags;
            console.log("getting tags");
            let tags_path = path.join(image_set_dir, "annotations", "tags.json");
            
            try {
                tags = JSON.parse(fs.readFileSync(tags_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
                return res.redirect(process.env.CC_PATH);
            }


            console.log("getting dzi image paths");
            let dzi_images_dir = path.join(image_set_dir, "dzi_images");
            let dzi_image_paths = [];
            for (let image_name of Object.keys(annotations)) {
                let dzi_image_path = path.join(process.env.CC_PATH, dzi_images_dir, image_name + ".dzi");
                dzi_image_paths.push(dzi_image_path);
            }

            let prediction_dir = path.join(image_set_dir, "model", "prediction");
            let predictions = {};
            console.log("getting predictions")
            glob(path.join(prediction_dir, "images", "*"), function(error, image_prediction_dirs) {

                if (error) {
                    console.log(error);
                    return res.redirect(process.env.CC_PATH);
                }

                for (let image_prediction_dir of image_prediction_dirs) {
                    let image_name = path.basename(image_prediction_dir);

                    let predictions_path = path.join(image_prediction_dir, "predictions.json");
                    if (fs.existsSync(predictions_path)) {
                        let image_predictions;
                        try {
                            image_predictions = JSON.parse(fs.readFileSync(predictions_path, 'utf8'));
                        }
                        catch {
                            console.log(error);
                            return res.redirect(process.env.CC_PATH);
                        }
                        predictions[image_name] = image_predictions[image_name];
                    }
                }
        
                let image_set_info = {
                    "farm_name": farm_name,
                    "field_name": field_name,
                    "mission_date": mission_date,
                    "image_ext": image_ext,
                    //"object_name": object_info["object_name"]
                }
        
                let data = {};

                data["image_set_info"] = image_set_info;
                data["metadata"] = metadata;
                data["dzi_image_paths"] = nat_orderBy.orderBy(dzi_image_paths);
                data["annotations"] = annotations;
                data["excess_green_record"] = excess_green_record;
                data["tags"] = tags;
                data["camera_specs"] = camera_specs;
                data["predictions"] = predictions;
                data["overlay_appearance"] = overlay_appearance;

                //data["model_status"] = status;

                res.render("workspace", {username: req.session.user.username, data: data});
                // res.render("test_anno", {username: req.session.user.username, data: data});

            });
/*
            let image_set_info = {
                "farm_name": farm_name,
                "field_name": field_name,
                "mission_date": mission_date,
                "image_ext": image_ext,
                //"object_name": object_info["object_name"]
            }
    
            let data = {};

            data["image_set_info"] = image_set_info;
            data["metadata"] = metadata;
            data["dzi_image_paths"] = nat_orderBy.orderBy(dzi_image_paths);
            data["annotations"] = annotations;
            data["excess_green_record"] = excess_green_record;
            data["camera_specs"] = camera_specs;

            res.render("workspace", {username: req.session.user.username, data: data});
*/
        });

            /*
        }).catch(function(error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        });*/
    }
    else {
        return res.redirect(process.env.CC_PATH);
    }

}

/*
exports.post_baseline = function(req, res, next) {

    let response = {};


    // let farm_name = req.params.farm_name;
    // let field_name = req.params.field_name;
    // let mission_date = req.params.mission_date;
    // let action = req.body.action;

    // let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name,
    //                                     field_name, mission_date);

    //let image_sets = req.body.image_sets;

    let scheduler_request = {
        "model_name": req.body.model_name, //"my_front_end_baseline",
        "model_creator": req.session.user.username,
        "request_type": "baseline_training",
        "public": req.body.public,
        "image_sets": req.body.image_sets
    };

    console.log("scheduler_request", scheduler_request);

    notify_scheduler(scheduler_request);

    return res.json(response);

    // if (action === "save_annotations") {
    //     let annotations_path = path.join(image_set_dir, "annotations", "annotations_w3c.json");


}
*/


/*
function get_all_datasets(caller_username, public_only=true) {
    let data = {};

    let usernames;
    try {
        usernames = get_subdirs(USR_DATA_ROOT);
    }
    catch (error) {
        return res.redirect(process.env.CC_PATH);
    }

    console.log("usernames", usernames);
    for (let username of usernames) {
        let user_image_sets_root = path.join(USR_DATA_ROOT, username, "image_sets");
        let farm_names;
        try {
            farm_names = get_subdirs(user_image_sets_root);
        }
        catch (error) {
            continue;
        }

        for (let farm_name of farm_names) {
        
            let farm_root = path.join(user_image_sets_root, farm_name);
            let field_names;
            try {
                field_names = get_subdirs(farm_root);
            }
            catch (error) {
                continue;
            }

            for (let field_name of field_names) {
                let field_root = path.join(farm_root, field_name);
                let mission_dates;
                try {
                   mission_dates = get_subdirs(field_root);
                }
                catch (error) {
                    continue;
                }
                
                for (let mission_date of mission_dates) {
                    let mission_root = path.join(field_root, mission_date);

                    
                    let metadata_path = path.join(mission_root, "metadata", "metadata.json");
                    let metadata;
                    try {
                        metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
                    }
                    catch (error) {
                        continue;
                    }
                    let is_public = metadata["is_public"] === "yes";

                    if ((username === caller_username) || (is_public || !(public_only))) { 
                        

                        let annotations_path = path.join(mission_root, "annotations", "annotations.json");
                        //console.log("annotations_path", annotations_path);

                        
                        // let object_info_path = path.join(mission_root, "annotations", "object_info.json");
                        // let object_info;
                        // try {
                        //     object_info = JSON.parse(fs.readFileSync(object_info_path, 'utf8'));
                        // }
                        // catch (error) {
                        //     continue;
                        // }


                        let annotations;
                        try {
                            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
                        }
                        catch (error) {
                            continue;
                        }

                        // for (let image_name of Object.keys(annotations)) {
                            
                        // }
                        let num_annotations = 0;
                        let image_names = [];
                        for (let image_name of Object.keys(annotations)) {
                            if (annotations[image_name]["training_regions"].length > 0 || annotations[image_name]["test_regions"].length > 0) {
                                image_names.push(image_name);
                            }
                            
                            // if (annotations[image_name]["status"] === "completed_for_training" || annotations[image_name]["status"] === "completed_for_testing") {
                            //     image_names.push(image_name);
                            //     num_annotations += annotations[image_name]["boxes"].length;
                            // }
                        }

                        if (image_names.length > 0) {
                            // let username = path.basename(user_path);
                            // let farm_name = path.basename(farm_path);
                            // let field_name = path.basename(field_path);
                            // let mission_date = path.basename(mission_path);
                            if (!(username in data)) {
                                data[username] = {};
                            }
                            if (!(farm_name in data[username])) {
                                data[username][farm_name] = {};
                            }
                            if (!(field_name in data[username][farm_name])) {
                                data[username][farm_name][field_name] = {};
                            }
                            data[username][farm_name][field_name][mission_date] = {
                                "num_annotations": num_annotations,
                                "annotated_images": image_names,
                                "object_name": metadata["object_name"]
                            };

                        }
                    }
                }
            }
        }  
    }
    return data;

}*/

/*
exports.get_baseline = function(req, res, next) {

    if ((req.session.user && req.cookies.user_sid) && (req.params.username === req.session.user.username)) {
        console.log("get_baseline");
        let data = {};

        let usernames;
        try {
            usernames = get_subdirs(USR_DATA_ROOT);
        }
        catch (error) {
            return res.redirect(process.env.CC_PATH);
        }

        console.log("usernames", usernames);
        for (let username of usernames) {
            let user_image_sets_root = path.join(USR_DATA_ROOT, username, "image_sets");
            let farm_names;
            try {
                farm_names = get_subdirs(user_image_sets_root);
            }
            catch (error) {
                return res.redirect(process.env.CC_PATH);
            }

            for (let farm_name of farm_names) {
            
                let farm_root = path.join(user_image_sets_root, farm_name);
                let field_names;
                try {
                    field_names = get_subdirs(farm_root);
                }
                catch (error) {
                    return res.redirect(process.env.CC_PATH);
                }
    
                for (let field_name of field_names) {
                    let field_root = path.join(farm_root, field_name);
                    let mission_dates;
                    try {
                       mission_dates = get_subdirs(field_root);
                    }
                    catch (error) {
                        return res.redirect(process.env.CC_PATH);
                    }
                    
                    for (let mission_date of mission_dates) {
                        let mission_root = path.join(field_root, mission_date);
                        let annotations_path = path.join(mission_root, "annotations", "annotations_w3c.json");
                        console.log("annotations_path", annotations_path);
                        let annotations;
                        try {
                            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
                        }
                        catch (error) {
                            continue; //return res.redirect(process.env.CC_PATH);
                        }
    
                        let num_annotations = 0;
                        let image_names = [];
                        for (let image_name of Object.keys(annotations)) {
                            if (annotations[image_name]["status"] === "completed_for_training" || annotations[image_name]["status"] === "completed_for_testing") {
                                image_names.push(image_name);
                                num_annotations += annotations[image_name]["annotations"].length;
                            }
                        }
    
                        if (num_annotations > 0) {
                            // let username = path.basename(user_path);
                            // let farm_name = path.basename(farm_path);
                            // let field_name = path.basename(field_path);
                            // let mission_date = path.basename(mission_path);
                            if (!(username in data)) {
                                data[username] = {};
                            }
                            if (!(farm_name in data[username])) {
                                data[username][farm_name] = {};
                            }
                            if (!(field_name in data[username][farm_name])) {
                                data[username][farm_name][field_name] = {};
                            }
                            data[username][farm_name][field_name][mission_date] = {
                                "num_annotations": num_annotations,
                                "annotated_images": image_names
                            };
    
                        }
                    }
                }
            }  
        }
        res.render("baseline", {username: req.session.user.username, data: data});
    
*/

        /*
        glob(path.join(USR_DATA_ROOT, "*"), function(error, user_paths) {
            if (error) {
                return res.redirect(process.env.CC_PATH);
            }

            for (let user_path of user_paths) {
                glob(path.join(user_path, "image_sets", "*"), function(error, farm_paths) {
                    if (error) {
                        return res.redirect(process.env.CC_PATH);
                    }


                    for (let farm_path of farm_paths) {
                        glob(path.join(farm_path, "*"), function(error, field_paths) {
                            if (error) {
                                return res.redirect(process.env.CC_PATH);
                            }


                            for (let field_path of field_paths) {
                                glob(path.join(field_path, "*"), function(error, mission_paths) {
                                    if (error) {
                                        return res.redirect(process.env.CC_PATH);
                                    }

                                    for (let mission_path of mission_paths) {

                                        let annotations_path = path.join(mission_path, "annotations", "annotations_w3c.json");
                                        console.log("annotations_path", annotations_path);
                                        let annotations;
                                        try {
                                            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
                                        }
                                        catch (error) {
                                            return res.redirect(process.env.CC_PATH);
                                        }

                                        let num_annotations = 0;
                                        for (let image_name of Object.keys(annotations)) {
                                            num_annotations += annotations[image_name]["annotations"].length;
                                        }

                                        if (num_annotations > 0) {
                                            let username = path.basename(user_path);
                                            let farm_name = path.basename(farm_path);
                                            let field_name = path.basename(field_path);
                                            let mission_date = path.basename(mission_path);
                                            data[username] = {};
                                            data[username][farm_name] = {};
                                            data[username][farm_name][field_name] = {};
                                            data[username][farm_name][field_name][mission_date] = {
                                                "num_annotations": num_annotations
                                            };

                                        }
                                        
                                    }
                                });
                            }
                        });
                    }
                });
            }
            res.render("baseline", {username: req.session.user.username, data: data});
        });*/
     /*   
    }
    else {
        return res.redirect(process.env.CC_PATH);
    }

}*/

function notify_scheduler(request) { //farm_name, field_name, mission_date, request_type) {

    // console.log("notifying scheduler of new request", request_type);

    let data = JSON.stringify(request);
    // let data = JSON.stringify({
    //     username: username,
    //     farm_name: farm_name,
    //     field_name: field_name,
    //     mission_date: mission_date,
    //     request_type: request_type
    // });

    let options = {
        hostname: process.env.CC_IP, //'172.16.1.75', //71',
        port: parseInt(process.env.CC_PY_PORT), //8110,
        path: process.env.CC_PATH + '/add_request',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    let req = http.request(options, res => {
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

function results_name_is_valid(results_name) {

    let format = /[`!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
    if (format.test(results_name)) {
        return false;
    }
    if ((results_name.length < 1) || (results_name.length > 50)) {
        return false;
    }
    return true;
}


function results_comment_is_valid(results_comment) {

    let format = /[`!@#$%^&*\=\[\]{}|<>?~]/;
    if (format.test(results_comment)) {
        return false;
    }
    if (results_comment.length > 255) {
        return false;
    }
    return true;
}

function get_models(model_paths, username, farm_name, field_name, mission_date) {

    let models = [];
    for (let model_path of model_paths) {
        let log_path = path.join(model_path, "log.json");
        let log = JSON.parse(fs.readFileSync(log_path, 'utf8'));



        let image_set_used_to_train_model = false;
        for (let image_set of log["image_sets"]) {
            if ((image_set["username"] === username && image_set["farm_name"] === farm_name) &&
                (image_set["field_name"] === field_name && image_set["mission_date"] === mission_date)) {
                    image_set_used_to_train_model = true;
                    break;
            }
        }
        //if (valid) {
        models.push({
            "model_creator": log["model_creator"],
            "model_name": log["model_name"],
            "model_object": log["model_object"],
            "image_set_used_to_train_model": image_set_used_to_train_model
        });
        //}
        // if (valid) {
        //     model_logs.push(log);
        // }
    }
    return models;
}



function box_intersects_region(box, region) {
    return ((box[1] < region[3] && box[3] > region[1]) && (box[0] < region[2] && box[2] > region[0]));
}

function get_num_useable_boxes(annotations) {
    let num_boxes = 0;
    for (let image_name of Object.keys(annotations)) {
        for (let i = 0; i < annotations[image_name]["boxes"].length; i++) {
            let intersects = false;
            for (let j = 0; j < annotations[image_name]["training_regions"].length; j++) {
                if (box_intersects_region(annotations[image_name]["boxes"][i], annotations[image_name]["training_regions"][j])) {
                    intersects = true;
                    break;
                }
            }
            if (!(intersects)) {
                for (let j = 0; j < annotations[image_name]["test_regions"].length; j++) {
                    if (box_intersects_region(annotations[image_name]["boxes"][i], annotations[image_name]["test_regions"][j])) {
                        intersects = true;
                        break;
                    }
                }
            }
            if (intersects) {
                num_boxes++;
            }
        }
    }
    return num_boxes;
}


exports.post_annotations_upload = function(req, res, next) {
    let response = {};

    console.log("got request", req)

    let farm_name = req.params.farm_name;
    let field_name = req.params.field_name;
    let mission_date = req.params.mission_date;

    console.log("farm_name", farm_name);
    console.log("field_name", field_name);
    console.log("mission_date", mission_date);

    // let box_format = req.body.box_format;
    // let coordinates_format = req.body.coordinates_format;

    // console.log("box_format", box_format);
    // console.log("coordinates_format", coordinates_format);
    console.log("req.files", req.files);

    let annotations_file = req.files[0].buffer;
    //let filename = file.originalname;


    let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name,
                                        field_name, mission_date);

    console.log("image_set_dir", image_set_dir);

    console.log("trying to parse annotations_file")
    let annotations;
    try {
        annotations = JSON.parse(annotations_file);
    }
    catch (error) {
        return res.status(422).json({
            error: "Unable to parse the annotations file."
        });
        // response.error = true;
        // response.message = "Unable to parse the annotations file.";
        // return res.json(response);
    }

    // console.log("parsed annotations_file")
    // let valid_box_formats = [
    //     "[ x_min, y_min, x_max, y_max ]",
    //     "[ x_min, y_min, width, height ]",
    //     "[ x_centre, y_centre, width, height ]"
    // ];

    // let valid_coordinates_formats = [
    //     "pixel_coordinates",
    //     "normalized_coordinates"
    // ];

    

    // if (!(valid_box_formats.includes(box_format))) {
    //     return res.status(422).json({
    //         error: "Invalid box format requested."
    //     });
    //     // response.error = true;
    //     // response.message = "Invalid box format requested.";
    //     // return res.json(response);
    // }
    // if (!(valid_coordinates_formats.includes(coordinates_format))) {
    //     return res.status(422).json({
    //         error: "Invalid coordinates format requested."
    //     });
    //     // response.error = true;
    //     // response.message = "Invalid coordinates format requested.";
    //     // return res.json(response);
    // }

    let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
    let metadata;
    // if (coordinates_format === "normalized_coordinates") {
    try {
        metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
    }
    catch(error) {
        return res.status(422).json({
            error: "Failed to read metadata file."
        });
        // response.error = true;
        // response.message = "Failed to read metadata file.";
        // return res.json(response);
    }
    // }


    let annotations_path = path.join(image_set_dir, "annotations", "annotations.json");
    let existing_annotations;
    try {
        existing_annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
    }
    catch(error) {
        return res.status(422).json({
            error: "Failed to read existing annotations."
        });
    }




    let min_box_dim = 1;
    let max_box_dim = 800;
    let new_annotations; // = {};


    new_annotations = existing_annotations;
    // for (let image_name of Object.keys(metadata["images"])) {
    //     new_annotations[image_name] = {
    //         "boxes": [],
    //         "test_regions": existing_annotations[image_name]["test_regions"],
    //         "training_regions": existing_annotations[image_name]["training_regions"],
    //         "source": "uploaded"
    //     };
    // }

    let num_training_regions_increased = false;
    for (let entry_name of Object.keys(annotations)) {
        //let image_path = path.join(image_set_dir, "images", image_name + ".*");

        let image_name;
        let image_path;
        let entry_pieces = entry_name.split(".");
        image_name = entry_pieces[0];
        if (entry_pieces.length == 1) {
            image_path = path.join(image_set_dir, "images", image_name + ".*");
        }
        else if (entry_pieces.length == 2) {
            image_path = path.join(image_set_dir, "images", entry_name);
        }
        else {
            return res.status(422).json({
                error: "The uploaded annotation file contains an invalid key: " + entry_name
            });
        }

        console.log("checking", image_name, image_path);

        let matched_image_paths;
        try {
            matched_image_paths = glob.sync(image_path);
        }
        catch (error) {
            return res.status(422).json({
                error: "An error occurred while checking the validity of the annotation file's keys."
            });
        }
        console.log("image_paths", matched_image_paths);
        if (matched_image_paths.length != 1) {
            return res.status(422).json({
                error: "The uploaded annotation file contains an invalid key: " + entry_name
            });
        }



        // let image_path_exists;
        // try {
        //     image_path_exists = fs.existsSync(image_path);
        // }
        // catch (error) {
        //     return res.status(422).json({
        //         error: "Failed to determine if annotations file is valid."
        //     });
        //     // response.message = "Failed to determine if annotations file is valid.";
        //     // response.error = true;
        //     // return res.json(response);
        // }
        // if (!(image_path_exists)) {
        //     return res.status(422).json({
        //         error: "At least one of the keys in the uploaded annotations file does not match with any of the uploaded images."
        //     });
        //     // response.message = "At least one of the keys in the uploaded annotations file does not match with any of the uploaded images.";
        //     // response.error = true;
        //     // return res.json(response);
        // }

        new_annotations[image_name] = {
            "boxes": [],
            "regions_of_interest": [],
            "training_regions": [],
            "test_regions": [],
            "source": "uploaded"
        };

        if ("regions_of_interest" in annotations[entry_name]) {
            if (!(Array.isArray(annotations[entry_name]["regions_of_interest"]))) {
                return res.status(422).json({
                    error: "The uploaded annotations file contains an invalid value (not an array). Problematic key: " + entry_name + "."
                });
            }
            let num_regions = annotations[entry_name]["regions_of_interest"].length;
            if (num_regions > 99) {
                return res.status(422).json({
                    error: "The uploaded annotations file contains too many regions of interest" +
                            " for image " + entry_name + ". A maximum of 99 regions of interest " + 
                            " are allowed per image. " + num_regions + " were provided."
                });
            }

            for (let i = 0; i < annotations[entry_name]["regions_of_interest"].length; i++) {
                let poly = annotations[image_name]["regions_of_interest"][i];
                
                if (!(Array.isArray(poly))) {
                    return res.status(422).json({
                        error: "The uploaded annotations file contains an invalid polygon (not an array). Problematic key: " + entry_name + "."
                    });
                }
                if (poly.length < 3) {
                    return res.status(422).json({
                        error: "The uploaded annotations file contains an invalid polygon (number of points is less than 3). Problematic key: " + entry_name + "."
                    });
                }

                let image_w = metadata["images"][image_name]["width_px"];
                let image_h = metadata["images"][image_name]["height_px"];

                let uploaded_poly = [];
                for (let pt of poly) {
                    if (!(Array.isArray(pt))) {
                        return res.status(422).json({
                            error: "The uploaded annotations file contains an invalid polygon (at least one point is not an array). Problematic key: " + entry_name + "."
                        });
                    }
                    if (pt.length != 2) {
                        return res.status(422).json({
                            error: "The uploaded annotations file contains an invalid polygon (at least one point is not an array of length 2). Problematic key: " + entry_name + "."
                        });
                    }

                    if ((pt[0] < 0 || pt[0] > image_w) || (pt[1] < 0 || pt[1] > image_h)) {
                        return res.status(422).json({
                            error: "The uploaded annotations file contains a polygon with a point located outside of the image boundaries. Problematic key: " + entry_name + "."
                        });
                    }

                    let all_numbers = pt.every(element => { return typeof element === "number"; });
                    if (!(all_numbers)) {
                        return res.status(422).json({
                            error: "The uploaded annotations file contains a polygon coordinate with non-numeric values. Problematic key: " + entry_name + "."
                        });
                    }


                    uploaded_poly.push([pt[1], pt[0]]);
                }

                new_annotations[image_name]["regions_of_interest"].push(
                    uploaded_poly
                );
            }
        }

        for (let annotation_key of ["annotations", "fine_tuning_regions", "test_regions"]) {
            if (!(annotation_key in annotations[entry_name])) {
                continue;
            }
            if (!(Array.isArray(annotations[entry_name][annotation_key]))) {
                return res.status(422).json({
                    error: "The uploaded annotations file contains an invalid value (not an array). Problematic key: " + entry_name + "."
                });
                // response.message = "The uploaded annotations file contains an invalid box array.";
                // response.error = true;
                // return res.json(response);
            }
            if ((annotation_key === "fine_tuning_regions") || (annotation_key === "test_regions")) {
                let annotation_key_text;
                if (annotation_key === "fine_tuning_regions") {
                    annotation_key_text = "fine tuning regions";
                }
                else {
                    annotation_key_text = "test regions";
                }
                let num_regions = annotations[entry_name][annotation_key].length;
                if (num_regions > 99) {
                    return res.status(422).json({
                        error: "The uploaded annotations file contains too many " + annotation_key_text + 
                                " for image " + entry_name + ". A maximum of 99 " + annotation_key_text + 
                                " are allowed per image. " + num_regions + " were provided."
                    });
                }
            }

            for (let i = 0; i < annotations[entry_name][annotation_key].length; i++) {
                let box = annotations[entry_name][annotation_key][i];
                if (!(Array.isArray(box))) {
                    return res.status(422).json({
                        error: "The uploaded annotations file contains an invalid box (not an array). Problematic key: " + entry_name + "."
                    });
                    // response.message = "The uploaded annotations file contains an invalid box array.";
                    // response.error = true;
                    // return res.json(response);
                }
                if (box.length != 4) {
                    return res.status(422).json({
                        error: "The uploaded annotations file contains a malformed box (number of elements is not equal to 4). Problematic key: " + entry_name + "."
                    });
                    // response.message = "The uploaded annotations file contains a malformed box (number of elements is not equal to 4).";
                    // response.error = true;
                    // return res.json(response);
                }

                let all_numbers = box.every(element => { return typeof element === "number"; });
                if (!(all_numbers)) {
                    return res.status(422).json({
                        error: "The uploaded annotations file contains a box with non-numeric values. Problematic key: " + entry_name + "."
                    });
                    // response.message = "The uploaded annotations file contains a box with non-numeric values.";
                    // response.error = true;
                    // return res.json(response);
                }

                // let y_min, x_min, y_max, x_max;
                // if (box_format === "[ x_min, y_min, x_max, y_max ]") {
                let y_min = Math.round(box[1]);
                let x_min = Math.round(box[0]);
                let y_max = Math.round(box[3]);
                let x_max = Math.round(box[2]);
                // }
                // else if (box_format === "[ x_min, y_min, width, height ]") {
                //     y_min = box[1];
                //     x_min = box[0];
                //     y_max = box[1] + box[3];
                //     x_max = box[0] + box[2];
                // }
                // else {
                //     let half_width = box[2] / 2;
                //     let half_height = box[3] / 2;
                //     y_min = box[1] - half_height;
                //     x_min = box[0] - half_width;
                //     y_max = box[1] + half_height;
                //     x_max = box[0] + half_width;
                // }

                let image_w = metadata["images"][image_name]["width_px"];
                let image_h = metadata["images"][image_name]["height_px"];

                // if (coordinates_format === "normalized_coordinates") {
                //     // console.log("applying multiplication");
                //     y_min = y_min * image_h;
                //     x_min = x_min * image_w;
                //     y_max = y_max * image_h;
                //     x_max = x_max * image_w;
                // }

                // y_min = Math.round(y_min);
                // x_min = Math.round(x_min);
                // y_max = Math.round(y_max);
                // x_max = Math.round(x_max);


                if (((y_min < 0) || (x_min < 0)) || ((y_max > image_h) || (x_max > image_w))) {
                    return res.status(422).json({
                        error: "The uploaded annotations file contains a box with coordinates outside of the image boundaries. Problematic key: " + entry_name + "."
                    });
                    // response.message = "The uploaded annotations file contains a box with coordinates outside of the image area.";
                    // response.error = true;
                    // return res.json(response);
                }

                let box_height = y_max - y_min;
                let box_width = x_max - x_min;

                let pixel_text;
                if (box_height == 1) {
                    pixel_text = "pixel";
                }
                else {
                    pixel_text = "pixels";
                }

                if (box_height < min_box_dim) {
                    // console.log("org_box", box);
                    // let half_width = box[2] / 2;
                    // let half_height = box[3] / 2;

                    // console.log("half_width", half_width);
                    // console.log("half_height", half_height);

                    // y_min = box[1] - half_height;
                    // x_min = box[0] - half_width;
                    // y_max = box[1] + half_height;
                    // x_max = box[0] + half_width;
                    // console.log("normalized", y_min, x_min, y_max, x_max);
                    // y_min = y_min * image_h;
                    // x_min = x_min * image_w;
                    // y_max = y_max * image_h;
                    // x_max = x_max * image_w;
                    // console.log("multiplied", y_min, x_min, y_max, x_max);
                    // y_min = Math.round(y_min);
                    // x_min = Math.round(x_min);
                    // y_max = Math.round(y_max);
                    // x_max = Math.round(x_max);
                    // console.log("rounded", y_min, x_min, y_max, x_max);



                    //console.log(y_min, x_min, y_max, x_max);
                    // console.log(image_w, image_h);
                    // console.log("box_height", box_height);

                    return res.status(422).json({
                        error: "At least one uploaded box has a height that is smaller than the minimum allowed height. " +
                                "(Box height: " + box_height + " " + pixel_text + ". Minimum allowed height: " + min_box_dim + 
                                " pixel. Problematic key: " + entry_name + ".)"
                    });
                    // response.message = "At least one uploaded box has a height that is smaller than the minimum allowed height. " +
                    //                     "(Box height: " + box_height + ". Minimum allowed height: " + min_box_dim + ".)";
                    // response.error = true;
                    // return res.json(response);
                }
                
                if (box_width < min_box_dim) {
                    return res.status(422).json({
                        error: "At least one uploaded box has a width that is smaller than the minimum allowed width. " +
                            "(Box width: " + box_width + " " + pixel_text + ". Minimum allowed width: " + min_box_dim + 
                            " pixel. Problematic key: " + entry_name + ".)"
                    });
                    // response.message = "At least one uploaded box has a width that is smaller than the minimum allowed width. " +
                    //                     "(Box width: " + box_width + ". Minimum allowed width: " + min_box_dim + ".)";
                    // response.error = true;
                    // return res.json(response);
                }
                // if (annotation_key == "annotations") {
                //     if (box_height > max_box_dim) {
                //         return res.status(422).json({
                //             error: "At least one uploaded box has a height that is larger than the maximum allowed height. " +
                //                     "(Box height: " + box_height + " " + pixel_text + ". Maximum allowed height: " + max_box_dim + 
                //                     " pixels. Problematic key: " + entry_name + ".)"
                //         });
                //         // response.message = "At least one uploaded box has a height that is larger than the maximum allowed height. " +
                //         //                     "(Box height: " + box_height + ". Maximum allowed height: " + max_box_dim + ".)";
                //         // response.error = true;
                //         // return res.json(response);
                //     }
                //     if (box_width > max_box_dim) {
                //         return res.status(422).json({
                //             error: "At least one uploaded box has a width that is larger than the maximum allowed width. " +
                //                 "(Box width: " + box_width + " " + pixel_text + ". Maximum allowed width: " + max_box_dim + 
                //                 " pixels. Problematic key: " + entry_name + ".)"
                //         });
                //         // response.message = "At least one uploaded box has a width that is larger than the maximum allowed width. " +
                //         //                     "(Box width: " + box_width + ". Maximum allowed width: " + max_box_dim + ".)";
                //         // response.error = true;
                //         // return res.json(response);
                //     }
                // }

                let internal_annotation_key;
                if (annotation_key === "annotations") {
                    internal_annotation_key = "boxes";
                }
                else if (annotation_key === "regions_of_interest") {
                    internal_annotation_key = "regions_of_interest";
                }
                else if (annotation_key === "fine_tuning_regions") {
                    internal_annotation_key = "training_regions";
                    num_training_regions_increased = true;
                }
                else {
                    internal_annotation_key = "test_regions"
                }

                new_annotations[image_name][internal_annotation_key].push([
                    y_min, x_min, y_max, x_max
                ]);
            }
        }
    }



        





    // let annotations_prior_to_upload_path = path.join(image_set_dir, "annotations", "annotations_prior_to_upload.json");
    // let annotations_prior_to_upload_exists;
    // try {
    //     annotations_prior_to_upload_exists = fs.existsSync(annotations_prior_to_upload_path);
    // }
    // catch (error) {
    //     response.message = "Error occurred while saving uploaded annotations.";
    //     response.error = true;
    //     return res.json(response);
    // }
    // if (annotations_prior_to_upload_exists) {
    try {
        fs.writeFileSync(annotations_path, JSON.stringify(new_annotations));
    }
    catch (error) {
        return res.status(422).json({
            error: "Failed to save uploaded annotations."
        });
    }

    //response.error = false;
    //response.annotations = new_annotations;
    //return res.json(response);
    if (num_training_regions_increased) {
        let scheduler_request = {
            "username": req.session.user.username,
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "request_type": "training"
        };
        notify_scheduler(scheduler_request);
    }


    let empty = true;
            
    for (let image_name of Object.keys(new_annotations)) {
        if (new_annotations[image_name]["training_regions"].length > 0) {
            empty = false;
            break;
        }
        if (new_annotations[image_name]["test_regions"].length > 0) {
            empty = false;
            break;
        }
    }

    let num_useable_boxes = get_num_useable_boxes(new_annotations);


    // let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
    // let metadata;
    // try {
    //     metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
    // }
    // catch (error) {
    //     response.error = true;
    //     response.message = "Failed to read metadata file.";
    //     return res.json(response);
    // }

    let image_sets_path;
    if (metadata["is_public"] === "yes") {
        image_sets_path = path.join(USR_SHARED_ROOT, "public_image_sets.json");
    }
    else {
        image_sets_path = path.join(USR_DATA_ROOT, req.session.user.username, "private_image_sets.json");
    }
    image_sets_mutex.acquire()
    .then(function(release) {
        let image_sets;
        try {
            image_sets = JSON.parse(fs.readFileSync(image_sets_path, 'utf8'));
        }
        catch (error) {
            release();
            response.error = true;
            response.message = "Failed to read image sets file.";
            return res.json(response);
        }

        if (empty) {
            if (req.session.user.username in image_sets) {
                if (farm_name in image_sets[req.session.user.username]) {
                    if (field_name in image_sets[req.session.user.username][farm_name]) {
                        if (mission_date in image_sets[req.session.user.username][farm_name][field_name]) {
                            delete image_sets[req.session.user.username][farm_name][field_name][mission_date];

                            if (Object.keys(image_sets[req.session.user.username][farm_name][field_name]).length == 0) {
                                delete image_sets[req.session.user.username][farm_name][field_name];
                            }

                            if (Object.keys(image_sets[req.session.user.username][farm_name]).length == 0) {
                                delete image_sets[req.session.user.username][farm_name];
                            }

                            if (Object.keys(image_sets[req.session.user.username]).length == 0) {
                                delete image_sets[req.session.user.username];
                            }
                        }
                    }
                }
            }
        }
        else {

            if (!(req.session.user.username in image_sets)) {
                image_sets[req.session.user.username] = {};
            }
            if (!(farm_name in image_sets[req.session.user.username])) {
                image_sets[req.session.user.username][farm_name] = {};
            }
            if (!(field_name in image_sets[req.session.user.username][farm_name])) {
                image_sets[req.session.user.username][farm_name][field_name] = {};
            }
            image_sets[req.session.user.username][farm_name][field_name][mission_date] = {
                "object_name": metadata["object_name"],
                "num_useable_boxes": num_useable_boxes
            }
        }

        try {
            fs.writeFileSync(image_sets_path, JSON.stringify(image_sets));
        }
        catch (error) {
            release();
            response.message = "Failed to write image sets file.";
            response.error = true;
            return res.json(response);
        }


        release();

        response.error = false;
        response.annotations = new_annotations;
    
        return res.json(response);

    }).catch(function(error) {
        console.log(error);
        response.error = true;
        response.message = "Failed to acquire image sets mutex.";
        return res.json(response);
    });



    // }
    // else {
    //     fs.rename(annotations_path, annotations_prior_to_upload_path, (error) => {
    //         if (error) {
    //             return res.status(422).json({
    //                 error: "Failed to write backup annotations file."
    //             });
    //             // response.message = "Failed to write backup annotations file.";
    //             // response.error = true;
    //             // return res.json(response);
    //         }

    //         try {
    //             fs.writeFileSync(annotations_path, JSON.stringify(new_annotations));
    //         }
    //         catch (error) {
    //             return res.status(422).json({
    //                 error: "Failed to write uploaded annotations."
    //             });
    //             // response.message = "Failed to write uploaded annotations.";
    //             // response.error = true;
    //             // return res.json(response);
    //         }

    //         // response.error = false;
    //         // response.annotations = new_annotations;
    //         // return res.json(response);

    //         if (num_training_regions_increased) {
    //             let scheduler_request = {
    //                 "username": req.session.user.username,
    //                 "farm_name": farm_name,
    //                 "field_name": field_name,
    //                 "mission_date": mission_date,
    //                 "request_type": "training"
    //             };
    //             notify_scheduler(scheduler_request);
    //         }

    //         response = update_image_sets_file(image_set_dir, new_annotations);
    //         response.annotations = new_annotations;
    
    //         return res.json(response);
    //     });
    // }
}


// function update_image_sets_file(image_set_dir, annotations) {

//     let response = {};

//     let empty = true;
            
//     for (let image_name of Object.keys(annotations)) {
//         if (annotations[image_name]["training_regions"].length > 0) {
//             empty = false;
//             break;
//         }
//         if (annotations[image_name]["test_regions"].length > 0) {
//             empty = false;
//             break;
//         }
//     }

//     let num_useable_boxes = get_num_useable_boxes(annotations);


//     let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
//     let metadata;
//     try {
//         metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
//     }
//     catch (error) {
//         response.error = true;
//         response.message = "Failed to read metadata file.";
//         return response; //res.json(response);
//     }

//     let image_sets_path;
//     if (metadata["is_public"] === "yes") {
//         image_sets_path = path.join(USR_SHARED_ROOT, "public_image_sets.json");
//     }
//     else {
//         image_sets_path = path.join(USR_DATA_ROOT, req.session.user.username, "private_image_sets.json");
//     }
//     image_sets_mutex.acquire()
//     .then(function(release) {
//         let image_sets;
//         try {
//             image_sets = JSON.parse(fs.readFileSync(image_sets_path, 'utf8'));
//         }
//         catch (error) {
//             release();
//             response.error = true;
//             response.message = "Failed to read image sets file.";
//             return response; //res.json(response);
//         }

//         if (empty) {
//             if (req.session.user.username in image_sets) {
//                 if (farm_name in image_sets[req.session.user.username]) {
//                     if (field_name in image_sets[req.session.user.username][farm_name]) {
//                         if (mission_date in image_sets[req.session.user.username][farm_name][field_name]) {
//                             delete image_sets[req.session.user.username][farm_name][field_name][mission_date];

//                             if (Object.keys(image_sets[req.session.user.username][farm_name][field_name]).length == 0) {
//                                 delete image_sets[req.session.user.username][farm_name][field_name];
//                             }

//                             if (Object.keys(image_sets[req.session.user.username][farm_name]).length == 0) {
//                                 delete image_sets[req.session.user.username][farm_name];
//                             }

//                             if (Object.keys(image_sets[req.session.user.username]).length == 0) {
//                                 delete image_sets[req.session.user.username];
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//         else {

//             if (!(req.session.user.username in image_sets)) {
//                 image_sets[req.session.user.username] = {};
//             }
//             if (!(farm_name in image_sets[req.session.user.username])) {
//                 image_sets[req.session.user.username][farm_name] = {};
//             }
//             if (!(field_name in image_sets[req.session.user.username][farm_name])) {
//                 image_sets[req.session.user.username][farm_name][field_name] = {};
//             }
//             image_sets[req.session.user.username][farm_name][field_name][mission_date] = {
//                 "object_name": req.body.object_name,
//                 "num_useable_boxes": num_useable_boxes
//             }
//         }

//         try {
//             fs.writeFileSync(image_sets_path, JSON.stringify(image_sets));
//         }
//         catch (error) {
//             release();
//             response.message = "Failed to write image sets file.";
//             response.error = true;
//             return response; //res.json(response);
//         }


//         release();

//         response.error = false;
//         return response; //res.json(response);

//     }).catch(function(error) {
//         console.log(error);
//         response.error = true;
//         response.message = "Failed to acquire image sets mutex.";
//         return response; //res.json(response);
//     });


// }

function verify_annotations(annotations) {
    // TODO
}


function verify_excess_green_record(excess_green_record) {
    // TODO
}

function verify_tags(tags) {
    // TODO
}

exports.post_workspace = function(req, res, next) {

    //console.log("post_workspace");

    let response = {};


    let farm_name = req.params.farm_name;
    let field_name = req.params.field_name;
    let mission_date = req.params.mission_date;
    let action = req.body.action;

    let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name,
                                        field_name, mission_date);


    // if (action === "save_annotations_for_image_set") {
    //     let annotations_path = path.join(image_set_dir, "annotations", "annotations.json");

    //     try {
    //         fs.writeFileSync(annotations_path, req.body.annotations);
    //     }
    //     catch (error) {
    //         console.log(error);
    //         response.error = true;
    //         return res.json(response);
    //     }

    //     //if (req.body.is_ortho === "no") {
    //     let excess_green_record_path = path.join(image_set_dir, "excess_green", "record.json");
    //     try {
    //         fs.writeFileSync(excess_green_record_path, req.body.excess_green_record);
    //     }
    //     catch (error) {
    //         console.log(error);
    //         response.error = true;
    //         return res.json(response);
    //     }
    

    //     if (req.body.num_training_images_increased === "yes") {
    //         let scheduler_request = {
    //             "username": req.session.user.username,
    //             "farm_name": farm_name,
    //             "field_name": field_name,
    //             "mission_date": mission_date,
    //             "request_type": "training"
    //         };
    //         notify_scheduler(scheduler_request);
    //     }
    //     //}

    //     response.error = false;
    //     return res.json(response);
    // }

    if (action === "health_check") {
        let options = {
            hostname: process.env.CC_IP, //'172.16.1.75', //71',
            port: parseInt(process.env.CC_PY_PORT), //8110,
            path: process.env.CC_PATH + '/health_request',
            requestTimeout: 5 * 1000,
            method: 'POST',
            // headers: {
            //     'Content-Type': 'application/json',
            //     'Content-Length': data.length
            // }
        };
        response.error = true;


        let req = http.request(options, health_res => {
            //console.log(`statusCode: ${res.statusCode}`);
            if (health_res.statusCode !== 200) {
                response.error = true;
                response.message = "Response status code is: " + health_res.statusCode;
                return res.json(response);
            }
            let raw_data = '';
            health_res.on("data", (chunk) => { raw_data += chunk; });
            health_res.on('end', () => {
                try {
                    const parsed_data = JSON.parse(raw_data);
                    // console.log("parsed_data", parsed_data);
                    if ((!("message" in parsed_data)) || (parsed_data["message"] !== "alive")) {
                        response.error = true;
                        response.message = "Got unexpected health response from server";
                        return res.json(response);
                    }
                    response.error = false;
                    return res.json(response);
                }
                catch (error) {
                    console.log(error);
                    response.error = true;
                    response.message = "Failed to parse server's response";
                    return res.json(response);
                }
            });
        });
    
        req.on("error", error => {
            console.log(error);
            if (error.code === "ECONNREFUSED") {
                response.message = "Failed to connect to the server."
            }
            else {
                response.message = error.message;
            }
            response.error = true;
            return res.json(response);
        });

        req.on('timeout', () => {
            console.log("request timed out");
            response.error = true;
            response.message = "The health check request timed out.";
            return res.json(response);
        });
    
        //req.write(data);
        req.end();







/*

        http.request(options, (health_res) => {
            console.log("health_res", health_res);
            const { status_code } = health_res.statusCode;
            console.log("health_res status code", status_code);
            const contentType = health_res.headers['content-type'];

            if (status_code !== 200) {
                response.error = true;
                response.message = "Response status code is: " + status_code;
                health_res.resume();
                return res.json(response);
            }
            if (!/^application\/json/.test(contentType)) {
                response.error = true;
                response.message = "Server did not return JSON response.";
                health_res.resume();
                return res.json(response);
            }

            health_res.setEncoding('utf8');
            let raw_data = '';
            health_res.on('data', (chunk) => { raw_data += chunk; });
            health_res.on('end', () => {
                try {
                    const parsed_data = JSON.parse(raw_data);
                    console.log("parsed_data", parsed_data);
                    response.error = false;
                    return res.json(response);
                }
                catch (error) {
                    console.log(error);
                    response.error = true;
                    response.message = "Failed to parse server's response";
                    return res.json(response);
                }
            });
        }).on('error', (error) => {
            console.log(error);
            response.error = true;
            response.message = error.message;
            return res.json(response);
        }).on('timeout', () => {
            console.log("request timed out");
            response.error = false;
            response.timeout = true;
            return res.json(response);
        });*/


        //let data = JSON.stringify(request);
        // let data = JSON.stringify({
        //     username: username,
        //     farm_name: farm_name,
        //     field_name: field_name,
        //     mission_date: mission_date,
        //     request_type: request_type
        // });

        // let options = {
        //     hostname: process.env.CC_IP, //'172.16.1.75', //71',
        //     port: parseInt(process.env.CC_PY_PORT), //8110,
        //     path: process.env.CC_PATH + '/health_request',
        //     method: 'GET',
        //     // headers: {
        //     //     'Content-Type': 'application/json',
        //     //     'Content-Length': data.length
        //     // },
        //     requestTimeout: 5 * 1000
        // };

        // let req = http.request(options, res => {
        //     console.log(`statusCode: ${res.statusCode}`);

        //     res.on("data", d => {
        //         console.log(d);
        //         //process.stdout.write(d);
        //     });
        // });

        // req.on("error", error => {
        //     console.log(error);
        //     response.error = true;
        //     return res.json(response);
        // });

        // req.on("timeout", () => {
        //     req.destroy();
        //     response.error = false;
        //     response.no_response = true;
        //     return res.json(response);
            
        // });

        // //req.write(data);
        // req.end();


    }
    else if (action === "auto_select_model") {

        // let annotations_path = path.join(image_set_dir, "annotations", "annotations.json");
        // let annotations_backup_path = path.join(image_set_dir, "annotations", "backup_annotations.json");
        // let annotations = JSON.parse(req.body.annotations);
        // console.log("got annotations", annotations);

        let annotations_dir = path.join(image_set_dir, "annotations");
        let annotations_path = path.join(annotations_dir, "annotations.json");
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }


        let num_annotations = 0;
        for (let image_name of Object.keys(annotations)) {
            num_annotations += annotations[image_name]["boxes"].length;
        }

        if (num_annotations < 10) {
            response.message = "A minimum of 10 objects must be annotated before auto-selection can be performed. Remember to click 'Save All Changes' to send your annotations to the server.";
            response.error = true;
            return res.json(response);
        }


        // fs.rename(annotations_path, annotations_backup_path, (error) => {
        //     if (error) {
        //         response.message = "Failed to write backup annotations file.";
        //         response.error = true;
        //         return res.json(response);
        //     }
        
        //     try {
        //         fs.writeFileSync(annotations_path, req.body.annotations);
        //     }
        //     catch (error) {
        //         response.message = "Failed to write annotations.";
        //         response.error = true;
        //         return res.json(response);
        //     }


        let auto_select_req_path = path.join(image_set_dir, "model", "auto_select_request.json");

        // let switch_request = {
        //     "auto": true
        // };
        
        // let request = {
        //     "farm_name": farm_name,
        //     "field_name": field_name,
        //     "mission_date": mission_date
        // };
        // let request_uuid = uuidv4().toString();
        
        // let request_path = path.join(USR_REQUESTS_ROOT, "restart",
                                    //  request_uuid + ".json");
        try {
            fs.writeFileSync(auto_select_req_path, JSON.stringify({}));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create auto-select request.";
            response.error = true;
            return res.json(response);
        }
        let scheduler_request = {
            "username": req.session.user.username,
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "request_type": "auto_select" //"restart"
        };
        notify_scheduler(scheduler_request);


        response.error = false;
        return res.json(response);


        // });
    }
    else if (action === "save_annotations") {
        console.log("saving annotations");

        let annotations_path = path.join(image_set_dir, "annotations", "annotations.json");
        let annotations_backup_path = path.join(image_set_dir, "annotations", "backup_annotations.json");
        let annotations = JSON.parse(req.body.annotations);
        let excess_green_record = JSON.parse(req.body.excess_green_record);
        let tags = JSON.parse(req.body.tags);

        verify_annotations(annotations);
        verify_excess_green_record(excess_green_record);
        verify_tags(tags);


        //console.log("got annotations", annotations);
        fs.rename(annotations_path, annotations_backup_path, (error) => {
            if (error) {
                response.message = "Failed to write backup annotations file.";
                response.error = true;
                return res.json(response);
            }
        
            try {
                fs.writeFileSync(annotations_path, req.body.annotations);
            }
            catch (error) {
                response.message = "Failed to write annotations.";
                response.error = true;
                return res.json(response);
            }

            let excess_green_record_path = path.join(image_set_dir, "excess_green", "record.json");
            try {
                fs.writeFileSync(excess_green_record_path, req.body.excess_green_record);
            }
            catch (error) {
                response.error = true;
                response.message = "Failed to write excess green record.";
                return res.json(response);
            }

            let tags_path = path.join(image_set_dir, "annotations", "tags.json");
            try {
                fs.writeFileSync(tags_path, req.body.tags);
            }
            catch (error) {
                response.error = true;
                response.message = "Failed to write tags.";
                return res.json(response);
            }

            if (req.body.num_training_regions_increased === "yes") {
                let scheduler_request = {
                    "username": req.session.user.username,
                    "farm_name": farm_name,
                    "field_name": field_name,
                    "mission_date": mission_date,
                    "request_type": "training"
                };
                notify_scheduler(scheduler_request);
            }


            // let response = update_image_sets_file(image_set_dir, annotations);
            // return res.json(response);
    
            
    
            // let entry = {
            //     "num_training_annotations": 0,
            //     "num_test_annotations": 0,
            //     //"num_training_regions": 0,
            //     //"num_test_regions": 0
            // };
            //let num_annotations = 0;
            let empty = true;
            
            //loop1:
            for (let image_name of Object.keys(annotations)) {
                if (annotations[image_name]["training_regions"].length > 0) {
                    empty = false;
                    break;
                }
                if (annotations[image_name]["test_regions"].length > 0) {
                    empty = false;
                    break;
                }
            }

            let num_useable_boxes = get_num_useable_boxes(annotations);
            /*
                for (let key of ["training", "test"]) {
                    for (let i = 0; i < annotations[image_name][key + "_regions"].length; i++) {
                        //entry["num_" + key + "_regions"]++;
                        for (let j = 0; j < annotations[image_name]["boxes"].length; j++) {
                            if (box_intersects_region(annotations[image_name]["boxes"][j], annotations[image_name][key + "_regions"][i])) {
                                //entry["num_" + key + "_annotations"]++;
                                num_annotations++; //entry["num_annotations"]++;
                            }
                        }
                    }
                }
            }*/

            // let object_info_path = path.join(image_set_dir, "annotations", "object_info.json");
            // let object_info;
            // try {
            //     object_info = JSON.parse(fs.readFileSync(object_info_path, 'utf8'));
            // }
            // catch (error) {
            //     response.error = true;
            //     response.message = "Failed to read image sets file.";
            //     return res.json(response);
            // }


            let image_sets_path;
            if (req.body.is_public === "yes") {
                image_sets_path = path.join(USR_SHARED_ROOT, "public_image_sets.json");
            }
            else {
                image_sets_path = path.join(USR_DATA_ROOT, req.session.user.username, "private_image_sets.json");
            }

            

            image_sets_mutex.acquire()
            .then(function(release) {
                let image_sets;
                try {
                    image_sets = JSON.parse(fs.readFileSync(image_sets_path, 'utf8'));
                }
                catch (error) {
                    release();
                    response.error = true;
                    response.message = "Failed to read image sets file.";
                    return res.json(response);
                }

                if (empty) {
                    if (req.session.user.username in image_sets) {
                        if (farm_name in image_sets[req.session.user.username]) {
                            if (field_name in image_sets[req.session.user.username][farm_name]) {
                                if (mission_date in image_sets[req.session.user.username][farm_name][field_name]) {
                                    delete image_sets[req.session.user.username][farm_name][field_name][mission_date];

                                    if (Object.keys(image_sets[req.session.user.username][farm_name][field_name]).length == 0) {
                                        delete image_sets[req.session.user.username][farm_name][field_name];
                                    }

                                    if (Object.keys(image_sets[req.session.user.username][farm_name]).length == 0) {
                                        delete image_sets[req.session.user.username][farm_name];
                                    }

                                    if (Object.keys(image_sets[req.session.user.username]).length == 0) {
                                        delete image_sets[req.session.user.username];
                                    }
                                }
                            }
                        }
                    }
                }
                else {

                    if (!(req.session.user.username in image_sets)) {
                        image_sets[req.session.user.username] = {};
                    }
                    if (!(farm_name in image_sets[req.session.user.username])) {
                        image_sets[req.session.user.username][farm_name] = {};
                    }
                    if (!(field_name in image_sets[req.session.user.username][farm_name])) {
                        image_sets[req.session.user.username][farm_name][field_name] = {};
                    }
                    image_sets[req.session.user.username][farm_name][field_name][mission_date] = {
                        "object_name": req.body.object_name,
                        "num_useable_boxes": num_useable_boxes
                    }
                }

                try {
                    fs.writeFileSync(image_sets_path, JSON.stringify(image_sets));
                }
                catch (error) {
                    release();
                    response.message = "Failed to write image sets file.";
                    response.error = true;
                    return res.json(response);
                }


                release();

                response.error = false;
                return res.json(response);

            }).catch(function(error) {
                console.log(error);
                response.error = true;
                response.message = "Failed to acquire image sets mutex.";
                return res.json(response);
            });
        });

    }
    else if (action === "download_annotations") {

        // let box_format = req.body.box_format;
        // let coordinates_format = req.body.coordinates_format;

        // let valid_box_formats = [
        //     "[ x_min, y_min, x_max, y_max ]",
        //     "[ x_min, y_min, width, height ]",
        //     "[ x_centre, y_centre, width, height ]"
        // ];

        // let valid_coordinates_formats = [
        //     "pixel_coordinates",
        //     "normalized_coordinates"
        // ];

        // if (!(valid_box_formats.includes(box_format))) {
        //     response.error = true;
        //     response.message = "Invalid box format requested.";
        //     return res.json(response);
        // }
        // if (!(valid_coordinates_formats.includes(coordinates_format))) {
        //     response.error = true;
        //     response.message = "Invalid coordinates format requested.";
        //     return res.json(response);
        // }

        let annotations_path = path.join(image_set_dir, "annotations", "annotations.json");
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch(error) {
            response.error = true;
            response.message = "Failed to read annotations file.";
            return res.json(response);
        }

        
        // let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
        // let metadata;
        // if (coordinates_format === "normalized_coordinates") {
        //     try {
        //         metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
        //     }
        //     catch(error) {
        //         response.error = true;
        //         response.message = "Failed to read metadata file.";
        //         return res.json(response);
        //     }
        // }


        let download_annotations = {};
        for (let image_name of Object.keys(annotations)) {
            download_annotations[image_name] = {};


            download_annotations[image_name]["regions_of_interest"] = [];
            for (let i = 0; i < annotations[image_name]["regions_of_interest"].length; i++) {
                let download_region = [];
                for (let j = 0; j < annotations[image_name]["regions_of_interest"][i].length; j++) {
                    let pt = annotations[image_name]["regions_of_interest"][i][j];
                    let download_pt = [
                        pt[1], pt[0]
                    ];
                    download_region.push(download_pt);
                }
                download_annotations[image_name]["regions_of_interest"].push(download_region);
            }

            for (let annotation_key of ["boxes", "training_regions", "test_regions"]) {

                let external_annotation_key;
                if (annotation_key === "boxes") {
                    external_annotation_key = "annotations";
                }
                else if (annotation_key === "training_regions") {
                    external_annotation_key = "fine_tuning_regions";
                }
                else {
                    external_annotation_key = "test_regions";
                }

                download_annotations[image_name][external_annotation_key] = []

                for (let i = 0; i < annotations[image_name][annotation_key].length; i++) {
                    let box = annotations[image_name][annotation_key][i];
                    let download_box = [
                        box[1], box[0], box[3], box[2]
                    ];

                    // if (box_format === "[ x_min, y_min, x_max, y_max ]") {
                    // download_box = [
                    //     box[1], box[0], box[3], box[2]
                    // ];
                    // }
                    // else if (box_format === "[ x_min, y_min, width, height ]") {
                    //     download_box = [
                    //         box[1], box[0], (box[3] - box[1]), (box[2] - box[0])
                    //     ];
                    // }
                    // else {
                    //     download_box = [
                    //         (box[1] + box[3]) / 2, (box[0] + box[2]) / 2, (box[3] - box[1]), (box[2] - box[0])
                    //     ];
                    // }

                    // if (coordinates_format === "normalized_coordinates") {
                    //     let image_width_px = metadata["images"][image_name]["width_px"];
                    //     let image_height_px = metadata["images"][image_name]["height_px"];
                    //     download_box = [
                    //         download_box[0] / image_width_px,
                    //         download_box[1] / image_height_px,
                    //         download_box[2] / image_width_px,
                    //         download_box[3] / image_height_px
                    //     ];

                    // }
                    download_annotations[image_name][external_annotation_key].push(download_box);
                }
            }
        }

        let annotations_download_path = path.join(image_set_dir, "annotations", "download_annotations.json");
        try {
            fs.writeFileSync(annotations_download_path, JSON.stringify(download_annotations));
        }
        catch (error) {
            response.error = true;
            response.message = "Failed to write downloadable annotations file.";
            return res.json(response);
        }

        response.error = false;
        return res.json(response);

    }
    else if (action === "build_map") {


        console.log("gathering predictions...");
        glob(path.join(image_set_dir, "model", "prediction", "images", "*"), function(error, image_prediction_dirs) {
            if (error) {
                response.error = true;
                response.message = "Failed to gather predictions.";
                return res.json(response);
            }
            let predictions = {};
            for (let image_prediction_dir of image_prediction_dirs) {
                let image_predictions_path = path.join(image_prediction_dir, "predictions.json");
                let image_predictions;
                try {
                    image_predictions = JSON.parse(fs.readFileSync(image_predictions_path, 'utf8'));
                }
                catch(error) {
                    response.error = true;
                    response.message = "Failed to read predictions file.";
                    return res.json(response);
                }

                let image_name = path.basename(image_prediction_dir);
                predictions[image_name] = image_predictions[image_name];
            }

            let maps_dir = path.join(image_set_dir, "maps");
            if (!(fs.existsSync(maps_dir))) {
                try {
                    fs.mkdirSync(maps_dir, { recursive: true });
                }
                catch(error) {
                    response.error = true;
                    response.message = "Failed to create maps directory.";
                    return res.json(response);
                }
            }

            let predictions_out_path = path.join(maps_dir, "predictions.json");
            try {
                fs.writeFileSync(predictions_out_path, JSON.stringify(predictions));
            }
            catch (error) {
                console.log(error);
                response.message = "Failed to write predictions.";
                response.error = true;
                return res.json(response);
            }

            console.log("finished gathering predictions. building map...")
            let rebuild_command = "python ../../plant_detection/src/interpolate.py " + req.session.user.username + " " +
                farm_name + " " + field_name + " " + mission_date + " " + predictions_out_path + 
                " " + maps_dir + " obj_density";

            if (req.body.interpolation === "nearest") {
                rebuild_command = rebuild_command + " -nearest";
            }
            if (req.body.tile_size !== "") {
                rebuild_command = rebuild_command + " -tile_size " + req.body.tile_size;
            }
            console.log(rebuild_command);
            let result = exec(rebuild_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                if (error) {
                    console.log(error.stack);
                    console.log('Error code: '+error.code);
                    console.log('Signal received: '+error.signal);
                    response.error = true;
                }
                else {
                    response.error = false;
                }
                return res.json(response);
            });


        });


    }
    /*
    else if (action === "switch_model") {

        let model_creator = req.body.model_creator;
        let model_name = req.body.model_name;

        // TODO: check these inputs
        let model_public_path = path.join(USR_DATA_ROOT, model_creator, "models", "available", "public", model_name);
        let model_private_path = path.join(USR_DATA_ROOT, model_creator, "models", "available", "private", model_name);
        console.log("model_public_path", model_public_path);
        console.log("model_private_path", model_private_path);
        
        if (!(fs.existsSync(model_public_path)) && !(fs.existsSync(model_private_path))) {
            response.message = "Selected model could not be located.";
            response.error = true;
            return res.json(response);
        }

        

        let status_path = path.join(image_set_dir, "model", "status.json");
        let status;
        try {
            status = JSON.parse(fs.readFileSync(status_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to read model status.";
            response.error = true;
            return res.json(response);
        }

        status["model_name"] = model_name;
        status["model_creator"] = model_creator;

        try {
            fs.writeFileSync(status_path, JSON.stringify(status));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to write model status.";
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);
    } */
    else if (action === "fetch_models") {
        //let model_logs = [];
        let models = [];
        let usr_dirs;
        try {
           usr_dirs = get_subdirpaths(USR_DATA_ROOT);
        }
        catch (error) {
            response.message = "Failed to retrieve models.";
            response.error = true;
            return res.json(response);
        }

        for (let usr_dir of usr_dirs) {
            let public_models_dir = path.join(usr_dir, "models", "available", "public");

            let public_dirs;
            try {
                public_dirs = get_subdirpaths(public_models_dir);
            }
            catch (error) {
                response.message = "Failed to retrieve models.";
                response.error = true;
                return res.json(response);
            }

            let cur_models;
            try {
                cur_models = get_models(public_dirs, req.session.user.username, farm_name, field_name, mission_date);
            }
            catch (error) {
                response.message = "Failed to retrieve models.";
                response.error = true;
                return res.json(response);
            }

            models = models.concat(cur_models);

            if (path.basename(usr_dir) === req.session.user.username) {

                let private_models_dir = path.join(usr_dir, "models", "available", "private");

                let private_dirs;
                try {
                    private_dirs = get_subdirpaths(private_models_dir);
                }
                catch (error) {
                    response.message = "Failed to retrieve models.";
                    response.error = true;
                    return res.json(response);
                }

                try {
                    cur_models = get_models(private_dirs, req.session.user.username, farm_name, field_name, mission_date);
                }
                catch (error) {
                    response.message = "Failed to retrieve models.";
                    response.error = true;
                    return res.json(response);
                }

                models = models.concat(cur_models);
            }

        }

        response.error = false;
        response.models = nat_orderBy.orderBy(models, 
            [v => v.model_creator, v => v.model_name], 
            ['asc', 'asc']);
        return res.json(response);
        /*


        glob(path.join(USR_DATA_ROOT, "*"), function(error, usr_dirs) {
            if (error) {
                response.error = true;
                return res.json(response);
            }
            for (let i = 0; i < usr_dirs.length; i++) {
                let public_models_dir = path.join(usr_dirs[i], "models", "available", "public");
                let private_models_dir = path.join(usr_dirs[i], "models", "available", "private");


                glob(path.join(public_models_dir, "*"), function(error, public_paths) {

                    if (error) {
                        response.message = "Failed to retrieve public model listing";
                        response.error = true;
                        return res.json(response);
                    }
        
                    glob(path.join(private_models_dir, "*"), function(error, private_paths) {
                        if (error) {
                            response.message = "Failed to retrieve private model listing.";
                            response.error = true;
                            return res.json(response);
                        }

                        let cur_models;
                        try {
                            cur_models = get_models(public_paths, req.session.user.username, farm_name, field_name, mission_date);
                        }
                        catch (error) {
                            response.message = "Failed to retrieve models.";
                            response.error = true;
                            return res.json(response);
                        }
    
                        models = models.concat(cur_models);

                        if (path.basename(usr_dirs[i]) === req.session.user.username) {

                            try {
                                cur_models = get_models(private_paths, req.session.user.username, farm_name, field_name, mission_date);
                            }
                            catch (error) {
                                response.message = "Failed to retrieve models.";
                                response.error = true;
                                return res.json(response);
                            }
        
                            models = models.concat(cur_models);

                        }


*/



/*
                glob(path.join(public_models_dir, "*"), function(error, public_paths) {
                    if (error) {
                        response.error = true;
                        return res.json(response);
                    }

                    let cur_models;
                    try {
                        cur_models = get_models(public_paths, req.session.user.username, farm_name, field_name, mission_date);
                    }
                    catch (error) {
                        response.message = "Failed to retrieve models.";
                        response.error = true;
                        return res.json(response);
                    }

                    models = models.concat(cur_models);*/

                    /*
                    for (let public_path of public_paths) {

                        let log_path = path.join(public_path, "log.json");
                        let log;
                        try {
                            log = JSON.parse(fs.readFileSync(log_path, 'utf8'));
                        }
                        catch (error) {
                            response.message = "Failed to retrieve models.";
                            response.error = true;
                            return res.json(response);
                        }


                        let keep = true;
                        for (let image_set of log["image_sets"]) {
                            if ((image_set["username"] == req.session.user.username && image_set["farm_name"] == farm_name) &&
                                (image_set["field_name"] == field_name && image_set["mission_date"] == mission_date)) {
                                    keep = false;
                            }
                        }
                        if (keep) {
                            model_logs.push(log);
                        }
                    }*/
                    

                        // if (i == usr_dirs.length-1) {
                        //     response.error = false;
                        //     response.models = nat_orderBy.orderBy(models, 
                        //         [v => v.model_creator, v => v.model_name], 
                        //         ['asc', 'asc']);
                        //     //models;
                        //     return res.json(response);
                        // }
/*
                });*/

    //                 });
    //             });
    //         }
    //     });
    // }
//     else if (action === "fetch_my_models") {

//         let available_dir = path.join(USR_DATA_ROOT, req.session.user.username, "models", 
//                                         "available");

//         glob(path.join(available_dir, "public", "*"), function(error, public_paths) {

//             if (error) {
//                 response.message = "Failed to retrieve public model listing";
//                 response.error = true;
//                 return res.json(response);
//             }
// /*
//             for (let pending_path of pending_paths) {
//                 try {
//                     response.pending_results.push(JSON.parse(fs.readFileSync(pending_path, 'utf8')));
//                 }
//                 catch (error) {
//                     response.error = true;
//                     return res.json(response);
//                 }
//             }*/

//             glob(path.join(available_dir, "private", "*"), function(error, private_paths) {
//                 if (error) {
//                     response.message = "Failed to retrieve private model listing.";
//                     response.error = true;
//                     return res.json(response);
//                 }

//                 let models = [];

//                 let public_models;
//                 try {
//                     public_models = get_models(public_paths, req.session.user.username, farm_name, field_name, mission_date);
//                 }
//                 catch (error) {
//                     response.message = "Failed to retrieve valid public models.";
//                     response.error = true;
//                     return res.json(response);
//                 }

//                 models = models.concat(public_models);

//                 let private_models;
//                 try {
//                     private_models = get_models(private_paths, req.session.user.username, farm_name, field_name, mission_date);
//                 }
//                 catch (error) {
//                     response.message = "Failed to retrieve valid private models.";
//                     response.error = true;
//                     return res.json(response);
//                 }

//                 models = models.concat(private_models);


//                 /*
//                 for (let public_path of public_paths) {
//                     models.push({
//                         "name": path.basename(public_path),
//                         "creator": req.session.user.username
//                     });
//                 }
//                 for (let private_path of private_paths) {
//                     models.push({
//                         "name": path.basename(private_path),
//                         "creator": req.session.user.username
//                     });
//                 }*/

                

//                 response.models = nat_orderBy.orderBy(models, [v => v.model_name], ['asc']);
//                 response.error = false;
//                 return res.json(response);


//             });
//         });


    }
    else if (action === "inspect_model") {
        let model_creator = req.body.model_creator;
        let model_name = req.body.model_name;

        let public_log_path = path.join(USR_DATA_ROOT, model_creator, "models", "available", "public", model_name, "log.json");
        let private_log_path = path.join(USR_DATA_ROOT, model_creator, "models", "available", "private", model_name, "log.json");
        let log;
        try {
            log = JSON.parse(fs.readFileSync(public_log_path, 'utf8'));
        }
        catch(error) {
            try {
                log = JSON.parse(fs.readFileSync(private_log_path, 'utf8'));
            }
            catch(error) {
                response.error = true;
                return res.json(response);
            }
        }

        // let annotations_path = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
        //                                     farm_name, field_name, mission_date,
        //                                     "annotations", "annotations.json");
        // let annotations;
        // try {
        //     annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        // }
        // catch(error) {
        //     response.error = true;
        //     return res.json(response);
        // }

        // response.annotations = annotations;
        response.model_log = log;
        response.error = false;
        return res.json(response);
    }
    else if (action === "fetch_model_annotations") {
        let model_creator = req.body.model_creator;
        let model_name = req.body.model_name;
        let image_set_username = req.body.username;
        let image_set_farm_name = req.body.farm_name;
        let image_set_field_name = req.body.field_name;
        let image_set_mission_date = req.body.mission_date;



        let public_model_dir = path.join(USR_DATA_ROOT, model_creator, "models", "available", "public", model_name);
        let private_model_dir = path.join(USR_DATA_ROOT, model_creator, "models", "available", "private", model_name);

        let public_annotations_path = path.join(public_model_dir, "annotations", image_set_username,
                                            image_set_farm_name, image_set_field_name, image_set_mission_date,
                                            "annotations.json");

        let private_annotations_path = path.join(private_model_dir, "annotations", image_set_username,
                                            image_set_farm_name, image_set_field_name, image_set_mission_date,
                                            "annotations.json");
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(public_annotations_path, 'utf8'));
        }
        catch (error) {
            try {
                annotations = JSON.parse(fs.readFileSync(private_annotations_path, 'utf8'));
            }
            catch (error) {
                response.message = "Failed to retrieve image set annotations."
                response.error = true;
                return res.json(response);
            }
        }

        response.annotations = annotations;
        response.error = false;
        return res.json(response);
    }
    else if (action === "predict") {

        console.log("got to predict");

        let image_names = JSON.parse(req.body.image_names);
        let regions = JSON.parse(req.body.regions)
        let save_result = req.body.save_result === "True";
        let regions_only = req.body.regions_only === "True";
        let calculate_vegetation_coverage = req.body.calculate_vegetation_coverage === "True";
        let request_uuid = uuidv4().toString();
        let request = {
            "request_uuid": request_uuid,
            "start_time": Math.floor(Date.now() / 1000),
            "image_names": image_names,
            "regions": regions,
            "save_result": save_result,
            "regions_only": regions_only,
            "calculate_vegetation_coverage": calculate_vegetation_coverage
        };

        let request_path;
        if (save_result) {
            let results_name = req.body.results_name;
            if (!(results_name_is_valid(results_name))) {
                response.message = "Results name is invalid";
                response.error = true;
                return res.json(response);
            }

            let results_comment = req.body.results_comment;
            if (!(results_comment_is_valid(results_comment))) {
                response.message = "Results comment is invalid";
                response.error = true;
                return res.json(response);
            }

            request["results_name"] = results_name;
            request["results_comment"] = results_comment;

            request_path = path.join(USR_DATA_ROOT, req.session.user.username,
                "image_sets", farm_name, field_name, mission_date,
                "model", "prediction", "image_set_requests", "pending", request_uuid + ".json");            
        }
        else {

            request_path = path.join(USR_DATA_ROOT, req.session.user.username,
                                "image_sets", farm_name, field_name, mission_date,
                                "model", "prediction", "image_requests", request_uuid + ".json");
        }

        try {
            fs.writeFileSync(request_path, JSON.stringify(request));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create prediction request.";
            response.error = true;
            return res.json(response);
        }

        if (save_result) {
            socket_api.results_notification(req.session.user.username, farm_name, field_name, mission_date);
        }

        let scheduler_request = {
            "username": req.session.user.username,
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "request_type": "prediction"
        };
        notify_scheduler(scheduler_request); //req.session.user.username, farm_name, field_name, mission_date, "prediction");

        response.error = false;
        return res.json(response);
    }
    else if (action === "retrieve_predictions") {

        let image_names = req.body.image_names.split(",");
        //let image_name = req.body.image_name;
        response.predictions = {};

        for (let image_name of image_names) {

            let prediction_path = path.join(image_set_dir, "model", "prediction",
                    "images", image_name, "predictions.json");


            let image_predictions;
            try {
                image_predictions = JSON.parse(fs.readFileSync(prediction_path, 'utf8'));
            }
            catch (error) {
                console.log(error);
                response.error = true;
                response.message = "Failed to retrieve predictions.";
                return res.json(response);
            }
            response.predictions[image_name] = image_predictions[image_name];
        }
        response.error = false;
        return res.json(response);


/*
        for (let image_name of image_names) {
            let prediction_path = path.join(image_set_dir, "model", "prediction",
                "images", image_name, "predictions_w3c.json");
            // let metrics_path = path.join(image_set_dir, "model", "prediction",
            //     "images", image_name, "metrics.json");    


            if (fs.existsSync(prediction_path)) {

                let image_predictions;


                if (req.body.is_ortho === "yes") {

                    prediction_path = path.join(image_set_dir, "model", "prediction",
                    "images", image_name, "predictions.json");
                    try {
                        image_predictions = JSON.parse(fs.readFileSync(prediction_path, 'utf8'));
                    }
                    catch (error) {
                        console.log(error);
                        response.error = true;
                        response.message = "Failed to retrieve predictions.";
                        return res.json(response);
                        //response.message = "Failed to retrieve predictions.";
                        //response.error = true;
                        //return res.json(response);
                    }                    
                    response.predictions[image_name] = image_predictions[image_name];


                    /*
                    let command = "python ../../plant_detection/src/get_viewport_predictions.py " + 
                                    image_set_dir + " " + image_names[0] + " " + "viewport," + req.body.viewport;
                    console.log("executing command", command);
                    try {
                        result = execSync(command, {shell: "/bin/bash"});
                    }
                    catch (error) {
                        console.log(error.stack);
                        console.log('Error code', error.code);
                        console.log('Signal received', error.signal);
                        console.log("Error status", error.status);

                        response.error = true;
                        response.message = "Failed to retrieve viewport predictions.";
                        return res.json(response);

                    }
                    console.log(result.toString("utf8"));


                    let subset_prediction_path = path.join(image_set_dir, "model", "prediction",
                                                        "images", image_name, "subset_predictions_w3c.json");

                    try {
                        image_predictions = JSON.parse(fs.readFileSync(subset_prediction_path, 'utf8'));
                    }
                    catch (error) {
                        console.log(error);
                        response.error = true;
                        response.message = "The viewer cannot display all of the annotations. Try zooming in further.";
                        return res.json(response);
                        //response.message = "Failed to retrieve predictions.";
                        //response.error = true;
                        //return res.json(response);
                    }                    
                    response.predictions[image_name] = image_predictions[image_name];
                    */
                   /*
                }
                else {

                    try {
                        image_predictions = JSON.parse(fs.readFileSync(prediction_path, 'utf8'));
                    }
                    catch (error) {
                        console.log(error);
                        response.message = "Failed to retrieve predictions.";
                        response.error = true;
                        return res.json(response);
                    }
                    response.predictions[image_name] = image_predictions[image_name];
                }
            }
            else {
                console.log("No predictions exist for this image");
                response.predictions_exist = false;
                //response.message = "No predictions found for the current image.";
                //response.error = true;
                return res.json(response);
            }

            // if (fs.existsSync(metrics_path)) {
            //     let image_metrics;
            //     try {
            //         image_metrics = JSON.parse(fs.readFileSync(metrics_path, 'utf8'));
            //     }
            //     catch (error) {
            //         console.log(error);
            //         response.message = "Failed to retrieve prediction metrics.";
            //         response.error = true;
            //         return res.json(response);
            //     }
            //     response.metrics[image_name] = image_metrics[image_name];
            // }
            // else {
            //     console.log("No prediction metrics exist for this image");
            //     response.metrics[image_name] = "";
            //     // response.message = "No prediction metrics found for the current image.";
            //     // response.error = true;
            //     // return res.json(response);
            // }
        }

        response.error = false;
        response.predictions_exist = true;
        return res.json(response);*/

    }
    else if (action === "segment") {

        let image_name = req.body.image_name;
        let threshold = req.body.threshold;


        let segment_command = "python ../../plant_detection/src/segment.py " + farm_name + " " + field_name + " " + mission_date + 
                              " " + image_name + " " + threshold;
        let result = exec(segment_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);
                response.error = true;
            }
            else {
                response.error = false;
            }
            return res.json(response);
        });
    }
    else if (action === "block_training") {

        let block_op = req.body.block_op;
        let usr_block_path = path.join(USR_DATA_ROOT, req.session.user.username,
            "image_sets", farm_name, field_name, mission_date,
            "model", "training", "usr_block.json");
        if (block_op === "block") {
            // create block file
            console.log("creating usr block file");
            try {
                fs.writeFileSync(usr_block_path, JSON.stringify({}));
            }
            catch (error) {
                console.log(error);
                response.error = true;
                return res.json(response);
            }
        }
        else {
            // delete block file
            console.log("deleting usr block file");
            try {
                fs.unlinkSync(usr_block_path);
            }
            catch (error) {
                console.log(error);
                response.error = true;
                return res.json(response);                
            }

            let scheduler_request = {
                "username": req.session.user.username,
                "farm_name": farm_name,
                "field_name": field_name,
                "mission_date": mission_date,
                "request_type": "training"
            };
            notify_scheduler(scheduler_request); //req.session.user.username, farm_name, field_name, mission_date, "training")
        }

        response.error = false;
        return res.json(response);
    }

    else if (action === "switch_to_random_model") {
        let switch_req_path = path.join(image_set_dir, "model", "switch_request.json");

        let switch_request = {
            "model_creator": "",
            "model_name": "random_weights",
            // "auto": false
        };

        try {
            fs.writeFileSync(switch_req_path, JSON.stringify(switch_request));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create switch request.";
            response.error = true;
            return res.json(response);
        }
        let scheduler_request = {
            "username": req.session.user.username,
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "request_type": "switch" //"restart"
        };
        notify_scheduler(scheduler_request); //req.session.user.username, farm_name, field_name, mission_date, "restart")

        response.error = false;
        return res.json(response);

    }
    else if (action === "switch_model") {

        let model_creator = req.body.model_creator;
        let model_name = req.body.model_name;

        let switch_req_path = path.join(image_set_dir, "model", "switch_request.json");

        let switch_request = {
            "model_creator": model_creator,
            "model_name": model_name,
            // "auto": false
        };
        
        // let request = {
        //     "farm_name": farm_name,
        //     "field_name": field_name,
        //     "mission_date": mission_date
        // };
        // let request_uuid = uuidv4().toString();
        
        // let request_path = path.join(USR_REQUESTS_ROOT, "restart",
                                    //  request_uuid + ".json");
        try {
            fs.writeFileSync(switch_req_path, JSON.stringify(switch_request));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create switch request.";
            response.error = true;
            return res.json(response);
        }
        let scheduler_request = {
            "username": req.session.user.username,
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "request_type": "switch" //"restart"
        };
        notify_scheduler(scheduler_request); //req.session.user.username, farm_name, field_name, mission_date, "restart")

        response.error = false;
        return res.json(response);

    }
}




function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function remove_image_set(username, farm_name, field_name, mission_date) {

    console.log("remove_image_set");
    console.log("username", username);
    console.log("farm_name", farm_name);
    console.log("field_name", field_name);
    console.log("mission_date", mission_date);

    if ((username === "" || farm_name === "") || (field_name === "" || mission_date === "")) {
        throw "Empty string argument provided";
    }

    if ((username == null || farm_name == null) || (field_name == null || mission_date == null)) {
        throw "Null argument provided";
    }

    let farm_dir = path.join(USR_DATA_ROOT, username, "image_sets", farm_name);
    let field_dir = path.join(farm_dir, field_name);
    let mission_dir = path.join(field_dir, mission_date);

    if (fs.existsSync(mission_dir)) {
        console.log("removing mission_dir", mission_dir);
        fs.rmSync(mission_dir, { recursive: true, force: false });
    }
    if (fs.existsSync(field_dir)) {
        let missions = get_subdirnames(field_dir);
        if (missions.length == 0) {
            console.log("removing field_dir", field_dir);
            fs.rmSync(field_dir, { recursive: true, force: false });
        }
    }
    if (fs.existsSync(farm_dir)) {
        let fields = get_subdirnames(farm_dir);
        if (fields.length == 0) {
            console.log("removing farm_dir", farm_dir);
            fs.rmSync(farm_dir, { recursive: true, force: false });
        }
    }
}

exports.post_orthomosaic_upload = function(req, res, next) {

    console.log("got_to_post_orthomosaic_upload");
    // console.log(req);

    let dzchunkindex = req.body.dzchunkindex;
    let dztotalfilesize = req.body.dztotalfilesize;
    let dzchunksize = req.body.dzchunksize;
    let dztotalchunkcount = req.body.dztotalchunkcount;
    let dzchunkbyteoffset = req.body.dzchunkbyteoffset;

    let upload_uuid = req.body.upload_uuid;
    let farm_name = req.body.farm_name;
    let field_name = req.body.field_name;
    let mission_date = req.body.mission_date;
    let object_name = req.body.object_name;
    let is_public = req.body.is_public;
    let camera_height = req.body.camera_height;
    let queued_filenames = req.body.queued_filenames.split(",");

    let file = req.files[0];
    let filename = file.originalname;

    let first = dzchunkindex == 0;
    let last = dzchunkindex == dztotalchunkcount - 1;


    let image_sets_root = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets");
    let farm_dir = path.join(image_sets_root, farm_name);
    let field_dir = path.join(farm_dir, field_name);
    let mission_dir = path.join(field_dir, mission_date);
    let images_dir = path.join(mission_dir, "images");
    let fpath = path.join(images_dir, filename); //filename.substring(0, filename.length-4) + "_" + dzchunkindex + ".JPG");
    

    if (queued_filenames.length != 1) {
        return res.status(422).json({
            error: "Only one orthomosaic can be uploaded at a time."
        });

    }

    console.log("dzchunkindex", dzchunkindex);
    console.log("dzchunktotalcount", dztotalchunkcount);
    console.log("first?", first);
    console.log("last?", last);
    console.log("upload_uuid", upload_uuid);

    if (first) {
        //let writeStream = fs.createWriteStream(fpath);
        if (upload_uuid in active_uploads) {
            return res.status(422).json({
                error: "Upload key conflict."
            });
        }
        else {
            active_uploads[upload_uuid] = {
                "status": "active"
                //"stream": writeStream
            };
        }
    }
    else {
        if (!(upload_uuid in active_uploads)) {
            return res.status(422).json({
                error: "Upload is no longer active."
            });
        }
    }




    
    if (first) {
        let split_filename = filename.split(".");
        // let image_set_extension = split_filename[split_filename.length-1];
        //let image_set_extension = filename.substring(filename.length-4);
        // if (!(valid_extensions.includes(image_set_extension))) {
        //     delete active_uploads[upload_uuid];
        //     return res.status(422).json({
        //         error: "The provided file does not have an accepted file extension. (Accepted extensions are: '.jpg', '.png', and '.tif')."
        //     });
        // }

        if (FILE_FORMAT.test(filename)) {
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "The provided filename contains illegal characters."
            });
        }

        
        if ((split_filename.length != 1) && (split_filename.length != 2)) {
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "The provided filename contains an illegal '.' character."
            });
        }

        //let extension = filename.substring(filename.length-4);
        

        //let extensionless_fname = filename.substring(0, filename.length-4);
        let extensionless_fname = split_filename[0];
        if (extensionless_fname.length > MAX_EXTENSIONLESS_FILENAME_LENGTH) {
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "The provided filename exceeds the maximum allowed length of " + MAX_EXTENSIONLESS_FILENAME_LENGTH + " characters."
            });
        }


        if (fpath_exists(mission_dir)) {
            
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "The provided farm-field-mission combination already exists."
            });
        }

        console.log("checking components");
        let id_components = [farm_name, field_name, mission_date];
        for (let id_component of id_components) {
            if (id_component.length < 3) {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "The provided farm name, field name, or mission date is too short."
                });
            }
            if (id_component.length > 20) {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "The provided farm name, field name, or mission date is too long."
                });
            }
            if (FARM_FIELD_MISSION_FORMAT.test(id_component)) {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "The provided farm name, field name, or mission date contains illegal characters."
                });
            }
        }
        let date = new Date(mission_date);
        if (!(date.isValid())) {
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "The provided mission date is invalid."
            });
        }

        let objects_path = path.join(USR_SHARED_ROOT, "objects.json");
        let objects;
        try {
            objects = JSON.parse(fs.readFileSync(objects_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            res.redirect(process.env.CC_PATH);
        }
        if (!(objects["object_names"].includes(object_name))) {
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "The provided object name is not recognized by the system."
            });
        }

        if (camera_height.length > 0) {
            if (isNumeric(camera_height)) {
                let numeric_camera_height = parseFloat(camera_height);
                if (numeric_camera_height < 0.01 || numeric_camera_height > 1000) {
                    delete active_uploads[upload_uuid];
                    return res.status(422).json({
                        error: "The provided camera height falls outside of the accepted range."
                    });
                }
            }
            else {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "The provided camera height is invalid."
                });
            }
        }


        console.log("Making the images directory");
        fs.mkdirSync(images_dir, { recursive: true });
    }
    else {
        if (!(fpath_exists(mission_dir))) {
            try {
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            }
            catch (error) {
                console.log("Failed to remove image set");
                console.log(error);
            }
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "Image set directories were not created by initial request."
            });
        }
    }

    //let writableStream = fs.createWriteStream(fpath);




    // const stream = fs.createWriteStream(fpath);

    // stream.on('open', () => req.pipe(stream));


    // stream.on('drain', () => {
    // // Calculate how much data has been piped yet
    // const written = parseInt(stream.bytesWritten);
    // const total = parseInt(headers['content-length']);
    // const pWritten = (written / total * 100).toFixed(2)
    // console.log(`Processing  ...  ${pWritten}% done`);
    // });

    // stream.on('close', () => {
    // // Send a success response back to the client
    // const msg = `Data uploaded to ${filePath}`;
    // console.log('Processing  ...  100%');
    // console.log(msg);
    // res.status(200).send({ status: 'success', msg });
    // });

    // stream.on('error', err => {
    // // Send an error message to the client
    // console.error(err);
    // res.status(500).send({ status: 'error', err });
    // });

    if (first) {
        let writeStream = fs.createWriteStream(fpath);
        active_uploads[upload_uuid]["stream"] = writeStream;
    }


    active_uploads[upload_uuid]["stream"].write(file.buffer, file.encoding, function(error) {
    //writableStream.write(file.buffer, function(error) {
        if (error) {
            try {
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            }
            catch (error) {
                console.log("Failed to remove image set");
                console.log(error);
            }
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "Error occurred when writing image file."
            });
        }

        if (last) {
            active_uploads[upload_uuid]["stream"].end();

            fork("process_upload.js", 
                [req.session.user.username, 
                    farm_name, 
                    field_name, 
                    mission_date, 
                    object_name, 
                    camera_height,
                    is_public,
                    "yes"]);
            delete active_uploads[upload_uuid];


        }

        return res.sendStatus(200);
    });
   
/*
    try {
        fs.writeFileSync(fpath, file.buffer);
    }
    catch (error) {
        console.log(error);
        try {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
        }
        catch (error) {
            console.log("Failed to remove image set");
            console.log(error);
        }
        delete active_uploads[upload_uuid];
        return res.status(422).json({
            error: "Error occurred when writing image file."
        });
    }

    return res.sendStatus(200);*/

}

// async function get_image_depth(file_buffer) {
//     return new Promise((resolve, reject) => {
//         gm(file_buffer)
//         .depth((error, depth) => {
//             if (error) {
//                 console.error('Failed to get image size:', error);
//                 reject(error);
//             } else {
//                 resolve(depth);
//             }
//         });
//     });
// }


// const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


exports.post_image_set_upload = async function(req, res, next) {
    //if (req.session.user && req.cookies.user_sid) {

    let upload_uuid;
    let farm_name;
    let field_name;
    let mission_date;
    let object_name;
    let is_public;
    let first;
    let last;
    let queued_filenames;
    let camera_height;
    // let sent_response = false;
    
    if (req.files.length > 1) {
        upload_uuid = req.body.upload_uuid[0];
        farm_name = req.body.farm_name[0];
        field_name = req.body.field_name[0];
        mission_date = req.body.mission_date[0];
        object_name = req.body.object_name[0];
        is_public = req.body.is_public[0];
        first = false;
        last = false;
        queued_filenames = req.body.queued_filenames[0].split(",");
        //console.log("queued_filenames", queued_filenames);
        camera_height = req.body.camera_height[0];
        let num_sent;
        for (let i = 0; i < req.body.num_sent.length; i++) {
            num_sent = parseInt(req.body.num_sent[i])
            //console.log("num_sent", num_sent);
            if (num_sent == 1) {
                first = true;
            }
            if (num_sent == queued_filenames.length) {
                last = true;
            }
        }
        
    }
    else {
        upload_uuid = req.body.upload_uuid;
        farm_name = req.body.farm_name;
        field_name = req.body.field_name;
        mission_date = req.body.mission_date;
        object_name = req.body.object_name;
        is_public = req.body.is_public;
        queued_filenames = req.body.queued_filenames.split(",");
        first = parseInt(req.body.num_sent) == 1;
        last = parseInt(req.body.num_sent) == queued_filenames.length;
        camera_height = req.body.camera_height;
    }

    console.log("first?", first);
    console.log("last?", last);

    
    if (first) {
        if (upload_uuid in active_uploads) {
            return res.status(422).json({
                error: "Upload key conflict."
            });
        }
        else {
            active_uploads[upload_uuid] = queued_filenames.length;
        }
    }
    else {
        if (!(upload_uuid in active_uploads)) {
            // if (active_uploads[upload_uuid] !== "valid") {
            //     if (last) {
            //         delete active_uploads[upload_uuid];
            //     }
    
            //     return res.status(422).json({
            //         error: "The image set upload has failed."
            //     });
            // }
        // }
        // else {
            // try {
            //     remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            // }
            // catch (error) {
            //     console.log("Failed to remove image set");
            //     console.log(error);
            // }


            return res.status(422).json({
                error: "Upload is no longer active."
            });
        }
        else {
            if (req.files.length > 1) {
                for (let i = 0; i < req.body.queued_filenames.length; i++) {
                    let queued_filenames = req.body.queued_filenames[i].split(",");
                    if (queued_filenames.length != active_uploads[upload_uuid]) {

                        try {
                            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                        }
                        catch (error) {
                            console.log("Failed to remove image set");
                            console.log(error);
                        }

                        return res.status(422).json({
                            error: "Size of image set changed during upload."
                        });
                    }
                }
            }
            else {
                let queued_filenames = req.body.queued_filenames.split(",");
                if (queued_filenames.length != active_uploads[upload_uuid]) {

                    try {
                        remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                    }
                    catch (error) {
                        console.log("Failed to remove image set");
                        console.log(error);
                    }

                    return res.status(422).json({
                        error: "Size of image set changed during upload."
                    });
                }
            }
        }
    }

    //let format = /[\s `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;

    let image_sets_root = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets");
    let farm_dir = path.join(image_sets_root, farm_name);
    let field_dir = path.join(farm_dir, field_name);
    let mission_dir = path.join(field_dir, mission_date);
    let images_dir = path.join(mission_dir, "images");

    
    if (first) {
        // let split_filename = queued_filenames[0].split(".");
        // let image_set_extension = split_filename[split_filename.length-1]; // queued_filenames[0].substring(queued_filenames[0].length-4);
        // if (!(valid_extensions.includes(image_set_extension))) {
        //     delete active_uploads[upload_uuid];
        //     return res.status(422).json({
        //         error: "At least one of the provided files does not have an accepted file extension. (Accepted extensions are '.jpg', '.png', and '.tif')."
        //     });
        // }

        for (let filename of queued_filenames) {
            if (FILE_FORMAT.test(filename)) {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "One or more provided filenames contains illegal characters."
                });
            }
            let split_filename = filename.split(".");
            if ((split_filename.length != 1) && (split_filename.length != 2)) {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "At least one filename contains an illegal '.' character."
                });

            }
    
            // if (filename.split(".").length !== 2) {
            //     delete active_uploads[upload_uuid];
            //     return res.status(422).json({
            //         error: "At least one filename contains an illegal '.' character."
            //     });
            // }

            // let split_filename = filename.split(".");
            // let extension = split_filename[split_filename.length-1];
            
            // if (extension !== image_set_extension) {
            //     delete active_uploads[upload_uuid];
            //     return res.status(422).json({
            //         error: "All images within an image set must have the same file extension."
            //     });
            // }
    
            //let extensionless_fname = filename.substring(0, filename.length-4);
            let extensionless_fname = split_filename[0];
            if (extensionless_fname.length > MAX_EXTENSIONLESS_FILENAME_LENGTH) {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "One or more filenames exceeds maximum allowed length of " + MAX_EXTENSIONLESS_FILENAME_LENGTH + " characters."
                });
            }
    
        }


        if (fpath_exists(mission_dir)) {
            // if (!sent_response) {
            //     sent_response = true;
            // active_uploads[upload_uuid] = "failed";
            
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "The provided farm-field-mission combination already exists."
            });
            // }
        }
        console.log("checking components");
        let id_components = [farm_name, field_name, mission_date];
        for (let id_component of id_components) {
            if (id_component.length < 3) {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "The provided farm name, field name, or mission date is too short."
                });
            }
            if (id_component.length > 20) {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "The provided farm name, field name, or mission date is too long."
                });
            }
            if (FARM_FIELD_MISSION_FORMAT.test(id_component)) {
                // if (!sent_response) {
                //     sent_response = true;
                // active_uploads[upload_uuid] = "failed";
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "The provided farm, field, or mission date contains illegal characters."
                });
                // }
            }
        }
        let date = new Date(mission_date);
        if (!(date.isValid())) {
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "The provided mission date is invalid."
            });
        }


        let objects_path = path.join(USR_SHARED_ROOT, "objects.json");
        let objects;
        try {
            objects = JSON.parse(fs.readFileSync(objects_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            res.redirect(process.env.CC_PATH);
        }
        if (!(objects["object_names"].includes(object_name))) {
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "The provided object name is not recognized by the system."
            });
        }

        if (camera_height.length > 0) {
            if (isNumeric(camera_height)) {
                let numeric_camera_height = parseFloat(camera_height);
                if (numeric_camera_height < 0.01 || numeric_camera_height > 1000) {
                    delete active_uploads[upload_uuid];
                    return res.status(422).json({
                        error: "The provided camera height falls outside of the accepted range."
                    });
                }
            }
            else {
                delete active_uploads[upload_uuid];
                return res.status(422).json({
                    error: "The provided camera height is invalid."
                });
            }
        }


        console.log("Making the images directory");
        fs.mkdirSync(images_dir, { recursive: true });

    }
    else {
        if (!(fpath_exists(mission_dir))) {
            try {
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            }
            catch (error) {
                console.log("Failed to remove image set");
                console.log(error);
            }
            // if (!sent_response) {
            //     sent_response = true;
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "Image set directories were not created by initial request."
            });
            // }
        }
    }

    console.log("Writing the image files");
    for (let file_index = 0; file_index < req.files.length; file_index++) {
        let file = req.files[file_index];
    //for (let file of req.files) {
        console.log(file);
        console.log(file.buffer);

        // if (!(file.mimetype.startsWith('image/'))) {
        //     try {
        //         remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
        //     }
        //     catch (error) {
        //         console.log("Failed to remove image set");
        //         console.log(error);
        //     }
        //     // if (!sent_response) {
        //     //     sent_response = true;
        //     delete active_uploads[upload_uuid];
        //     return res.status(422).json({
        //         error: "One or more provided files is not an image."
        //     });
        //     // }
        // }

        //gm(file.buffer).depth();

        // let depth = await get_image_depth(file.buffer);
        // console.log("depth", depth);

        // console.log("file", file);
        // console.log("file", sizeOf(file.buffer));
        /*
        if (format.test(file.originalname)) {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            // if (!sent_response) {
            //     sent_response = true;
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "One or more provided filenames contains illegal characters."
            });
            // }
        }

        if (file.originalname.split(".").length !== 2) {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "At least one filename contains an illegal '.' character."
            });
        }

        //let sanitized_fname = sanitize(file.originalname);
        let extension = file.originalname.substring(file.originalname.length-4);
        let valid_extensions = [".jpg", ".JPG", ".png", ".PNG", ".tif", ".TIF"];
        if (!(valid_extensions.includes(extension))) {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "At least one of the provided files does not have an accepted file extension. (Accepted extensions are '.jpg', '.png', and '.tif')."
            });
        }
        */

        //let extensionless_fname = file.originalname.substring(0, file.originalname.length-4);
        let split_filename = file.originalname.split(".");
        let extensionless_fname = split_filename[0];
        if (extensionless_fname.length > MAX_EXTENSIONLESS_FILENAME_LENGTH) {
            try {
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            }
            catch (error) {
                console.log("Failed to remove image set");
                console.log(error);
            }
            // if (!sent_response) {
            //     sent_response = true;
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "One or more filenames exceeds maximum allowed length of " + MAX_EXTENSIONLESS_FILENAME_LENGTH + " characters."
            });
            // }
        }

        let fpath = path.join(images_dir, file.originalname);
        try {
            fs.writeFileSync(fpath, file.buffer);
        }
        catch (error) {
            console.log(error);
            try {
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            }
            catch (error) {
                console.log("Failed to remove image set");
                console.log(error);
            }
            // if (!sent_response) {
            //     sent_response = true;
            delete active_uploads[upload_uuid];
            return res.status(422).json({
                error: "Error occurred when writing image file."
            });
            // }
        }

        // console.log("waiting 5 seconds before moving");
        // await delay(5000);
        // console.log("moving")

        // let rename_command = "mv " + fpath + " " + final_fpath + " && chmod 777 " + final_fpath;
        // try {
        //     execSync(rename_command, {shell: "/bin/bash"});
        // }
        // catch (error) {
        //     console.log(error);
        //     try {
        //         remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
        //     }
        //     catch (error) {
        //         console.log("Failed to remove image set");
        //         console.log(error);
        //     }

        //     delete active_uploads[upload_uuid];
        //     return res.status(422).json({
        //         error: "Error occurred when renaming image file."
        //     });
        // }



        // console.log("renaming");
        // console.log("current fpath: ", fpath);
        // console.log("final fpath:   ", final_fpath);

        // try {
        //     fs.renameSync(fpath, final_fpath);
        // }
        // catch (error) {
        //     console.log(error);
        //     try {
        //         remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
        //     }
        //     catch (error) {
        //         console.log("Failed to remove image set");
        //         console.log(error);
        //     }
        //     delete active_uploads[upload_uuid];
        //     return res.status(422).json({
        //         error: "Error occurred when renaming image file."
        //     });
        // }


        // fs.writeFile(fpath, file.buffer, null, (error) => {
        //     if (error) {
        //         console.log(error);
        //         try {
        //             remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
        //         }
        //         catch (error) {
        //             console.log("Failed to remove image set");
        //             console.log(error);
        //         }

        //         delete active_uploads[upload_uuid];
        //         return res.status(422).json({
        //             error: "Error occurred when writing image file."
        //         });
        //     }

        //     fs.rename(fpath, final_fpath, (error) => {

        //         if (error) {
        //             try {
        //                 remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
        //             }
        //             catch (error) {
        //                 console.log("Failed to remove image set");
        //                 console.log(error);
        //             }
    
        //             delete active_uploads[upload_uuid];
        //             return res.status(422).json({
        //                 error: "Error occurred when renaming image file."
        //             });

        //         }

        //         if (file_index == req.files.length-1) {
        //             if (last) {
    
        //                 fork("process_upload.js", 
        //                 [req.session.user.username, 
        //                  farm_name, 
        //                  field_name, 
        //                  mission_date, 
        //                  object_name, 
        //                  camera_height,
        //                  is_public,
        //                  "no"]);
        //                 delete active_uploads[upload_uuid];
    
        //             }
    
        //             return res.sendStatus(200);
        //         }

        //     });
        // });

        // try {
        //     fs.writeFileSync(fpath, file.buffer);
        // }
        // catch (error) {
        //     console.log(error);
        //     try {
        //         remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
        //     }
        //     catch (error) {
        //         console.log("Failed to remove image set");
        //         console.log(error);
        //     }
        //     // if (!sent_response) {
        //     //     sent_response = true;
        //     delete active_uploads[upload_uuid];
        //     return res.status(422).json({
        //         error: "Error occurred when writing image file."
        //     });
        //     // }
        // }
    }

    if (last) {

        //process_upload(req.session.user.username, farm_name, field_name, mission_date, camera_height);

        // TODO if multiple uploads are processed simultaneously, resources may become exhausted
        fork("process_upload.js", 
            [req.session.user.username, 
             farm_name, 
             field_name, 
             mission_date, 
             object_name, 
             camera_height,
             is_public,
             "no"]);
        delete active_uploads[upload_uuid];
    }

    return res.sendStatus(200);

}


exports.post_home = function(req, res, next) {

    //if (req.session.user && req.cookies.user_sid) {
    let action = req.body.action;
    let response = {};

    if (action === "get_annotations") {
        let anno_username = req.body.username; 
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;
        let image_set_dir = path.join(USR_DATA_ROOT, anno_username, "image_sets", 
                                        farm_name, field_name, mission_date);
        let annotations_path = path.join(image_set_dir, "annotations", "annotations.json");
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            response.message = "Failed to read annotations file";
            response.error = true;
            return res.json(response);
        }
        response.annotations = annotations;
        response.error = false;
        return res.json(response);

    }
    else if (action === "destroy_model") {
        let model_name = req.body.model_name;
        let model_state = req.body.model_state;
        let models_dir = path.join(USR_DATA_ROOT, req.session.user.username, "models");

        if (model_state !== "available" && model_state !== "aborted") {
            response.message = "Invalid model state provided.";
            response.error = true;
            return res.json(response);
        }

        if (MODEL_NAME_FORMAT.test(model_name)) {
            response.message = "Model name contains illegal characters.";
            response.error = true;
            return res.json(response);
        }

        if ((model_name.length < 3) || (model_name.length > 50)) {
            response.message = "Illegal model name length.";
            response.error = true;
            return res.json(response);
        }

        let model_path;
        if (model_state === "available") {
            let model_public_path = path.join(models_dir, "available", "public", model_name);
            let model_private_path = path.join(models_dir, "available", "private", model_name);
            let public_path_exists;
            try {
                public_path_exists = fs.existsSync(model_public_path);
            }
            catch (error) {
                response.message = "Failed to find model.";
                response.error = true;
                return res.json(response);
            }
            if (public_path_exists) {
                model_path = model_public_path;
            }
            else {
                model_path = model_private_path;
            }
        }
        else {
            model_path = path.join(models_dir, "aborted", model_name);
        }

        try {
            fs.rmSync(model_path, { recursive: true, force: false });
        }
        catch (error) {
            response.message = "Failed to destroy model.";
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);

    }
    else if (action === "fetch_my_models") {

        let model_state = req.body.model_state;
        let models_dir = path.join(USR_DATA_ROOT, req.session.user.username, "models");

        if (model_state === "available") {

            let available_dir = path.join(models_dir, "available");

            glob(path.join(available_dir, "public", "*"), function(error, public_paths) {

                if (error) {
                    response.message = "Failed to retrieve models.";
                    response.error = true;
                    return res.json(response);
                }

                glob(path.join(available_dir, "private", "*"), function(error, private_paths) {
                    if (error) {
                        response.message = "Failed to retrieve models.";
                        response.error = true;
                        return res.json(response);
                    }

                    let models = [];

                    for (let public_path of public_paths) {

                        let log_path = path.join(public_path, "log.json");
                        let log;
                        try {
                            log = JSON.parse(fs.readFileSync(log_path, 'utf8'));
                        }
                        catch (error) {
                            response.message = "Failed to read model log.";
                            response.error = true;
                            return res.json(response);
                        }
                        models.push({
                            //"model_name": path.basename(public_path),
                            "log": log,
                            //"public": true
                        });
                    }
                    for (let private_path of private_paths) {

                        let log_path = path.join(private_path, "log.json");
                        let log;
                        try {
                            log = JSON.parse(fs.readFileSync(log_path, 'utf8'));
                        }
                        catch (error) {
                            response.message = "Failed to read model log.";
                            response.error = true;
                            return res.json(response);
                        }
                        models.push({
                            //"model_name": path.basename(private_path),
                            "log": log,
                            //"public": false
                        });
                    }
                    response.models = models;
                    response.error = false;
                    return res.json(response);
                });
            });
        }

        else if (model_state === "pending") {

            let pending_dir = path.join(models_dir, "pending");

            glob(path.join(pending_dir, "*"), function(error, model_paths) {
                if (error) {
                    response.error = true;
                    return res.json(response);
                }

                let models = [];
                for (let model_path of model_paths) {

                    let log_path = path.join(model_path, "log.json");
                    let log;
                    try {
                        log = JSON.parse(fs.readFileSync(log_path, 'utf8'));
                    }
                    catch (error) {
                        response.error = true;
                        return res.json(response);
                    }

                    models.push({
                        //"model_name": path.basename(model_path),
                       // "public": log["public"]
                       "log": log
                    });
                }

                response.models = models;
                response.error = false;
                return res.json(response);

            });
        }

        else if (model_state === "aborted") {
            let aborted_dir = path.join(models_dir, "aborted");

            glob(path.join(aborted_dir, "*"), function(error, model_paths) {
                if (error) {
                    response.error = true;
                    return res.json(response);
                }

                let models = [];
                for (let model_path of model_paths) {
                    let log_path = path.join(model_path, "log.json");
                    let log;
                    try {
                        log = JSON.parse(fs.readFileSync(log_path, 'utf8'));
                    }
                    catch (error) {
                        response.error = true;
                        return res.json(response);
                    }

                    models.push({
                        "log": log
                        // "model_name": path.basename(model_path),
                        // "error_message": log["error_message"],
                        // "aborted_time": log["aborted_time"]
                    });
                }

                response.models = models;
                response.error = false;
                return res.json(response);

            });


        }
    }
    else if (action === "get_overview_info") {

        console.log("get_overview_info");
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;

        let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", 
                                    farm_name, field_name, mission_date);

/*
        let public_path = path.join(image_set_dir, "public.json");
        let is_public;
        try {
            is_public = fs.existsSync(public_path);
        }
        catch (error) {
            response.message = "Failed to read public file";
            response.error = true;
            return res.json(response);
        }                     
*/
        let annotations_path = path.join(image_set_dir, "annotations", "annotations.json");
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            response.message = "Failed to read annotations file";
            response.error = true;
            return res.json(response);
        }

        let annotation_info = {
            "num_annotations": 0,
            "num_images": 0,
            // "num_completed": 0,
            // "num_started": 0,
            // "num_unannotated": 0
            "num_regions_of_interest": 0,
            "num_training_regions": 0,
            "num_test_regions": 0
        };
        for (let image_name of Object.keys(annotations)) {
            annotation_info["num_annotations"] += annotations[image_name]["boxes"].length;
            annotation_info["num_regions_of_interest"] += annotations[image_name]["regions_of_interest"].length;
            annotation_info["num_training_regions"] += annotations[image_name]["training_regions"].length;
            annotation_info["num_test_regions"] += annotations[image_name]["test_regions"].length;
            annotation_info["num_images"]++;
            // if (annotations[image_name]["status"] === "completed_for_training" || annotations[image_name]["status"] === "completed_for_testing") {
            //     annotation_info["num_completed"]++;
            // }
            // else if (annotations[image_name]["status"] === "started") {
            //     annotation_info["num_started"]++;
            // }
            // else {
            //     annotation_info["num_unannotated"]++;
            // }
        }

        let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
        let metadata;
        try {
            metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
        }
        catch (error) {
            response.message = "Failed to read metadata file";
            response.error = true;
            return res.json(response);
        }

        response.annotation_info = annotation_info;
        //response.is_public = is_public;
        response.metadata = metadata;
        response.error = false;
        return res.json(response);
    }
    // else if (action === "rename_image_set") {
    //     let old_farm_name = req.body.old_farm_name;
    //     let old_field_name = req.body.old_field_name;
    //     let old_mission_date = req.body.old_mission_date;

    //     let new_farm_name = req.body.old_farm_name;
    //     let new_field_name = req.body.old_field_name;
    //     let new_mission_date = req.body.old_mission_date;



    // }
    else if (action === "delete_image_set") {
        
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;

        if ((farm_name === "" || field_name === "") || mission_date === "") {
            response.message = "Could not delete the image set: an illegal farm/field/mission combination was provided.";
            response.error = true;
            return res.json(response);
        }
        if ((farm_name == null || field_name == null) || mission_date == null) {
            response.message = "Could not delete the image set: an illegal farm/field/mission combination was provided.";
            response.error = true;
            return res.json(response);
        }


        let mission_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", 
                                    farm_name, field_name, mission_date);

        //let annotations_lock_path = path.join(mission_dir, "annotations", "lock.json");
        /*
        let restart_req_path = path.join(mission_dir, "model", "training", "restart_request.json");
        if (fs.existsSync(restart_req_path)) {
            response.message = "The image set cannot be deleted while a restart request has yet to be processed";
            response.error = true;
            return res.json(response);
        }*/


        let key = req.session.user.username + "/" + farm_name + "/" + field_name + "/" + mission_date;
        for (let socket_id of Object.keys(socket_api.workspace_id_to_key)) {
            if (socket_api.workspace_id_to_key[socket_id] === key) {
                response.message = "The image set cannot be deleted since the corresponding annotation file is currently in use. Please try again later.";
                response.error = true;
                return res.json(response);
            }
        }


        /*
        if (key in socket_api.workspace_key_to_id) {
            response.message = "The image set cannot be deleted since the corresponding annotation file is currently in use. Please try again later.";
            response.error = true;
            return res.json(response);
        }*/
            
        let annotations_path = path.join(mission_dir, "annotations", "annotations.json");
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            console.log("Annotations file does not exist. Removing image set.");
            try {
                fs.rmSync(mission_dir, { recursive: true, force: false });

                let field_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name, field_name);
                let missions = get_subdirnames(field_dir);
                if (missions.length == 0) {
                    fs.rmSync(field_dir, { recursive: true, force: false });
                    let farm_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name);
                    let fields = get_subdirnames(farm_dir);
                    if (fields.length == 0) {
                        fs.rmSync(farm_dir, { recursive: true, force: false });
                    }
                }
            }
            catch (error) {
                console.log(error);
                response.error = true;
                response.message = "An error occurred while deleting the image set: " + error.toString();
                return res.json(response);
            }
            response.error = false;
            response.redirect = process.env.CC_PATH + "/home/" + req.session.user.username;
            return res.json(response);
        }


        let empty = true;
        for (let image_name of Object.keys(annotations)) {
            if (annotations[image_name]["boxes"].length > 0) {
                empty = false;
                break;
            }
        }
        if (!(empty)) {
            response.error = true;
            response.message = "Cannot delete an image set with annotations."
            return res.json(response);
        }
        else {
            console.log("No annotations found, deleting image set");

            try {
                fs.rmSync(mission_dir, { recursive: true, force: false });

                let field_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name, field_name);
                let missions = get_subdirnames(field_dir);
                if (missions.length == 0) {
                    fs.rmSync(field_dir, { recursive: true, force: false });
                    let farm_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name);
                    let fields = get_subdirnames(farm_dir);
                    if (fields.length == 0) {
                        fs.rmSync(farm_dir, { recursive: true, force: false });
                    }
                }
            }
            catch (error) {
                console.log(error);
                response.error = true;
                response.message = "An error occurred while deleting the image set: " + error.toString();
                return res.json(response);
            }

            // TODO: remove unneeded keys from cameras.json ??
            

            response.error = false;
            response.redirect = process.env.CC_PATH + "/home/" + req.session.user.username;
            return res.json(response);
        }

    }
    else if (action === "access_workspace") {

        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;


        let mission_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", 
                                    farm_name, field_name, mission_date);

        /*
        let restart_req_path = path.join(mission_dir, "model", "training", "restart_request.json");
        if (fs.existsSync(restart_req_path)) {
            response.message = "A restart request was made for this image set. The workspace cannot be accessed until the request is processed.";
            response.error = true;
            return res.json(response);
        }*/


        let key = req.session.user.username + "/" + farm_name + "/" + field_name + "/" + mission_date;
        for (let socket_id of Object.keys(socket_api.workspace_id_to_key)) {
            if (socket_api.workspace_id_to_key[socket_id] === key) {
                console.log("The workspace is in use", key);
                response.error = true;
                response.message = "The requested annotation file is currently in use. Please try again later.";
                return res.json(response);
            }
        }

        /*
        if (key in socket_api.workspace_key_to_id) {
            console.log("The workspace is in use", key);
            response.error = true;
            response.message = "The requested annotation file is currently in use. Please try again later.";
            return res.json(response);
        }*/
        response.error = false;
        response.redirect = process.env.CC_PATH + "/workspace/" + req.session.user.username + "/" + farm_name + "/" +
                            field_name + "/" + mission_date;
        return res.json(response);
    }
    else if (action === "fetch_upload_status") {
       
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;


        let upload_status_path = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                  farm_name, field_name, mission_date, "upload_status.json");

        try {
            upload_status = JSON.parse(fs.readFileSync(upload_status_path, 'utf8'));
        }
        catch (error) {
            response.error = true;
            return res.json(response);
        }
        response.error = false;
        response.status = upload_status;
        return res.json(response);

    }
    else if (action === "fetch_results") {

        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;


        let model_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                  farm_name, field_name, mission_date, "model");
        let prediction_dir = path.join(model_dir, "prediction");
        let results_dir = path.join(model_dir, "results");

        response.pending_results = [];
        response.aborted_results = [];
        response.completed_results = [];
        glob(path.join(prediction_dir, "image_set_requests", "pending", "*"), function(error, pending_paths) {

            if (error) {
                console.log(error);
                response.error = true;
                return res.json(response);
            }

            for (let pending_path of pending_paths) {
                try {
                    response.pending_results.push(JSON.parse(fs.readFileSync(pending_path, 'utf8')));
                }
                catch (error) {
                    console.log(error);
                    // response.error = true;
                    // return res.json(response);
                }
            }

            glob(path.join(prediction_dir, "image_set_requests", "aborted", "*"), function(error, aborted_paths) {

                if (error) {
                    console.log(error);
                    response.error = true;
                    return res.json(response);
                }

                for (let aborted_path of aborted_paths) {
                    try {
                        response.aborted_results.push(JSON.parse(fs.readFileSync(aborted_path, 'utf8')));
                    }
                    catch (error) {
                        console.log(error);
                        // response.error = true;
                        // return res.json(response);
                    }
                }

                glob(path.join(results_dir, "*"), function(error, completed_dirs) {
                    if (error) {
                        console.log(error);
                        // response.error = true;
                        // return res.json(response);
                    }

                    for (let completed_dir of completed_dirs) {
                        try {
                            response.completed_results.push(JSON.parse(fs.readFileSync(path.join(completed_dir, "request.json"), 'utf8')));
                        }
                        catch (error) {
                            console.log(error);
                            
                            //response.error = true;
                            //return res.json(response);
                        }
                    }

                    response.error = false;
                    return res.json(response);
                });
            });
        });


    }
    else if (action === "delete_result") {
       
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;
        let result_type = req.body.result_type;
        let result_id = req.body.result_id;

        console.log("delete_result");
        console.log("result_type", result_type);
        console.log("result_id", result_id);

        if (result_id === "" || result_id == null) {
            response.message = "Cannot destroy result: invalid result identifier provided.";
            response.error = true;
            return res.json(response);
        }

        if (result_type === "completed") {

            let result_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                  farm_name, field_name, mission_date, "model", "results", result_id);

            try {
                fs.rmSync(result_dir, { recursive: true, force: false });
            }
            catch (error) {
                console.log(error);
                response.message = "Failed to destroy result.";
                response.error = true;
                return res.json(response);
            }
        }
        else if (result_type === "aborted") {
            
            let request_path = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                   farm_name, field_name, mission_date, "model", "prediction", 
                                   "image_set_requests", "aborted", result_id + ".json");
            try {
                fs.unlinkSync(request_path);
            }
            catch (error) {
                console.log(error);
                response.message = "Failed to destroy result.";
                response.error = true;
                return res.json(response);
            }
        }

        socket_api.results_notification(req.session.user.username, farm_name, field_name, mission_date);

        response.error = false;
        return res.json(response);

    }
    else if (action === "add_camera") {

        let make = req.body.make;
        let model = req.body.model;
        let sensor_width = req.body.sensor_width;
        let sensor_height = req.body.sensor_height;
        let focal_length = req.body.focal_length;
        let image_width_px = req.body.image_width_px;
        let image_height_px = req.body.image_height_px;
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;


        let format = /[`!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
        for (let input of [make, model, sensor_width, sensor_height, focal_length, image_width_px, image_height_px]) {
            if (format.test(input)) {
                response.message = "Provided metadata contains invalid characters."
                response.error = true;
                return res.json(response);
            }
        }
        for (let input of [make, model]) {
            if ((input.length < 3 || input.length > 20)) {
                response.message = "Provided metadata is invalid."
                response.error = true;
                return res.json(response);
            }
        }

        for (let input of [sensor_width, sensor_height, focal_length, image_width_px, image_height_px]) {
            if (input.length < 1 || input.length > 10) {
                response.message = "Provided metadata is invalid."
                response.error = true;
                return res.json(response);
            }
            if (!(isNumeric(input))) {
                response.message = "Provided metadata is invalid."
                response.error = true;
                return res.json(response);
            }
            input = parseFloat(input);
            if (input <= 0) {
                response.message = "Provided metadata is invalid."
                response.error = true;
                return res.json(response);
            }
        }

        for (let input of [image_width_px, image_height_px]) {
            input = parseFloat(input);
            if (!(Number.isInteger(input))) {
                return false;
            }
        }

        sensor_width = parseFloat(sensor_width);
        sensor_height = parseFloat(sensor_height);
        focal_length = parseFloat(focal_length);
        image_width_px = parseInt(image_width_px);
        image_height_px = parseInt(image_height_px);


        camera_mutex.acquire()
        .then(function(release) {

            let camera_specs;
            let camera_specs_path = path.join(USR_DATA_ROOT, req.session.user.username, "cameras", "cameras.json");
            try {
                camera_specs = JSON.parse(fs.readFileSync(camera_specs_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read camera metadata file.";
                response.error = true;
                return res.json(response);
            }

            if (!(make in camera_specs)) {
                camera_specs[make] = {};
            }

            camera_specs[make][model] = {
                "sensor_width": sensor_width,
                "sensor_height": sensor_height,
                "focal_length": focal_length,
                "image_width_px": image_width_px,
                "image_height_px": image_height_px
            }

            let metadata;
            let metadata_path = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                         farm_name, field_name, mission_date, "metadata", "metadata.json");
            try {
                metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read image set metadata file.";
                response.error = true;
                return res.json(response);
            }

            metadata["camera_info"]["make"] = make;
            metadata["camera_info"]["model"] = model;

            console.log("updating metadata for image_set", metadata);

            try {
                fs.writeFileSync(metadata_path, JSON.stringify(metadata));
            }
            catch (error) {
                release();
                response.message = "Failed to write image set metadata file.";
                response.error = true;
                return res.json(response);
            }

            /*
            // remove unused keys

            
            let image_sets_root = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets");
            let farm_names = get_subdirs(image_sets_root);
            console.log("farm_names", farm_names);
            let used_cameras = {};
            let cur_make;
            let cur_model;
            //let cur_camera_height;
            //let metadata_commands = [];
            for (farm_name of farm_names) {
            
                let farm_root = path.join(image_sets_root, farm_name);
                let field_names = get_subdirs(farm_root);
                console.log("field_names", field_names);
    
                for (field_name of field_names) {
                    let field_root = path.join(farm_root, field_name);
                    let mission_dates = get_subdirs(field_root);
                    console.log("mission_dates", mission_dates);
                    
                    
                    for (mission_date of mission_dates) {
                        let mission_root = path.join(field_root, mission_date);

                        let metadata_path = path.join(mission_root, "metadata", "metadata.json");

                        if (fpath_exists(metadata_path)) {

                            try {
                                metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
                            }
                            catch (error) {
                                release();
                                console.log(error);
                                response.message = "Failed to read image set metadata file.";
                                response.error = true;
                                return res.json(response);
                            }

                            cur_make = metadata["camera_info"]["make"];
                            cur_model = metadata["camera_info"]["model"];
                            // cur_camera_height = metadata["camera_height"];

                            if (!(cur_make in used_cameras)) {
                                used_cameras[cur_make] = [];
                            }
                            if (!(used_cameras[cur_make].includes(cur_model))) {
                                used_cameras[cur_make].push(cur_model);
                            }
                        }
                    }
                }
            }

            console.log("used_cameras", used_cameras);

            for (make of Object.keys(camera_specs)) {
                if (make in used_cameras) {
                    for (model of Object.keys(camera_specs[make])) {
                        if (!(used_cameras[make].includes(model))) {
                            delete camera_specs[make][model];
                        }
                    }
                }
                else {
                    delete camera_specs[make];
                }
            }
            */

            try {
                fs.writeFileSync(camera_specs_path, JSON.stringify(camera_specs));
            }
            catch (error) {
                release();
                response.message = "Failed to write camera metadata file.";
                response.error = true;
                return res.json(response);
            }

            release();
            
            response.error = false;
            response.camera_specs = camera_specs;

            // for (metadata_command of metadata_commands) {
            //     console.log("re-running metadata extraction:", metadata_command);
            //     exec(metadata_command,  {shell: "/bin/bash"}, function (error, stdout, stderr) {
            //         if (error) {
            //             console.log( error);
            //         }
            //     });
            // }
            return res.json(response);


        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire camera metadata mutex.";
            response.error = true;
            return res.json(response);
        });

    }
    else if (action === "update_camera_height") {

        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;
        let camera_height = req.body.camera_height;

        let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                      farm_name, field_name, mission_date);

        let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");

        console.log("metadata_path", metadata_path);
        console.log("camera_height", camera_height);

        let camera_height_val;
        if (camera_height.length == 0) {
            camera_height_val = "";
        }
        else {
            // response.error = true;
            // response.message = "Provided camera height is invalid";
            // return res.json(response);

            if (!(isNumeric(camera_height))) {
                response.error = true;
                response.message = "Provided camera height is invalid.";
                return res.json(response);
            }
            camera_height_val = parseFloat(camera_height);
            if (camera_height_val < 0.01 || camera_height_val > 1000) {
                response.error = true;
                response.message = "Provided camera height is invalid.";
                return res.json(response);
            }
        }



        if (fpath_exists(metadata_path)) {
            try {
                metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
            }
            catch (error) {
                response.error = true;
                response.message = "Failed to read camera metadata file.";
                return res.json(response);
            }
            metadata["camera_height"] = camera_height_val;
            try {
                fs.writeFileSync(metadata_path, JSON.stringify(metadata));
            }
            catch (error) {
                response.error = true;
                response.message = "Failed to write camera metadata file.";
                return res.json(response);
            }
            response.error = false;
            return res.json(response);

        }
        else {
            response.error = true;
            response.message = "Metadata file does not exist.";
            return res.json(response);
        }

        



    }
    else if (action === "train") {


        

        let model_name = req.body.model_name;
        if (MODEL_NAME_FORMAT.test(model_name)) {
            response.message = "Model name contains illegal characters.";
            response.error = true;
            return res.json(response);
        }

        if ((model_name.length < 3) || (model_name.length > 50)) {
            response.message = "Illegal model name length.";
            response.error = true;
            return res.json(response);
        }

        if (model_name === "random_weights") {
            response.message = "Illegal model name.";
            response.error = true;
            return res.json(response);
        }

        let is_public = req.body.is_public;
        if (is_public !== "yes" && is_public !== "no") {
            response.message = "Invalid value for model's 'public' attribute.";
            response.error = true;
            return res.json(response);
        }

        /* TODO: additional error checking for image_sets and model_object */

        let models_dir = path.join(USR_DATA_ROOT, req.session.user.username, "models");
        let available_dir = path.join(models_dir, "available");
        let pending_dir = path.join(models_dir, "pending");
        let aborted_dir = path.join(models_dir, "aborted");

        let public_model_path = path.join(available_dir, "public", model_name);
        let private_model_path = path.join(available_dir, "private", model_name);
        let pending_model_path = path.join(pending_dir, model_name);
        let aborted_model_path = path.join(aborted_dir, model_name);

        let possible_paths = [public_model_path, private_model_path, pending_model_path, aborted_model_path];

        for (let possible_path of possible_paths) {
            let possible_path_exists;
            try {
                possible_path_exists = fs.existsSync(possible_path);
            }
            catch (error) {
                response.message = "An error occurred during model submission.";
                response.error = true;
                return res.json(response);
            }
            if (possible_path_exists) {
                response.message = "You have already created a model with the same name. Choose a different model name or delete the existing model.";
                response.error = true;
                return res.json(response);
            }
        }

        try {
            fs.mkdirSync(pending_model_path);
        }
        catch (error) {
            response.message = "An error occurred during model submission.";
            response.error = true;
            return res.json(response);
        }

        let log = {
            "model_name": req.body.model_name,
            "model_creator": req.session.user.username,
            "model_object": req.body.model_object,
            "public": req.body.is_public,
            "image_sets": req.body.image_sets,
            "submission_time": parseInt(Date.now() / 1000)
        };

        let log_path = path.join(pending_model_path, "log.json");
        try {
            fs.writeFileSync(log_path, JSON.stringify(log));
        }
        catch (error) {
            try {
                fs.rmSync(pending_model_path, { recursive: true, force: false });
            }
            catch (error) {
                console.log("Failed to remove pending model after error.");
            }

            response.message = "An error occurred during model submission.";
            response.error = true;
            return res.json(response);
        }

        /*
        for (let image_set of req.body.image_sets) {
            if (!("num_annotations" in image_set)) {
                responser.error = true;
                response.message = "Invalid image set information.";
                return res.json(response);
            }
            if (!(isNumeric(image_set["num_annotations"]))) {
                responser.error = true;
                response.message = "Invalid image set information.";
                return res.json(response);
            }
            image_set["num_annotations"] = parseInt(image_set["num_annotations"]);
        }*/




        let scheduler_request = {
            "model_name": req.body.model_name, //"my_front_end_baseline",
            //"model_object": req.body.model_object,
            "model_creator": req.session.user.username,
            "request_type": "baseline_training",
            "public": req.body.is_public,
            //"image_sets": req.body.image_sets
        };

        console.log("scheduler_request", scheduler_request);

        notify_scheduler(scheduler_request);

        response.error = false;
        response.message = "Your training request has been successfully submitted.";
        return res.json(response);

    }
    else {
        console.log("invalid action", action);
        response.message = "Invalid action specified.";
        response.error = true;
        return res.json(response);
    }
    /*
    }
    else {
        res.cookie_expired = true;
        response.redirect = process.env.CC_PATH;
        return res.json(response);
    }*/

}

exports.get_timeline = function(req, res, next) {

    if ((req.session.user && req.cookies.user_sid) && (req.params.username === req.session.user.username)) {
        
        let farm_name = req.params.farm_name;
        let field_name = req.params.field_name;
        let mission_date = req.params.mission_date;

        let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                        farm_name, field_name, mission_date);

        let results_dir = path.join(image_set_dir, "model", "results");

        let annotations_path = path.join(image_set_dir, "annotations", "annotations.json")
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }

        let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
        let metadata;
        try {
            metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }

        let camera_specs_path = path.join(USR_DATA_ROOT, req.session.user.username, "cameras", "cameras.json");
        let camera_specs;
        try {
            camera_specs = JSON.parse(fs.readFileSync(camera_specs_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }


        let predictions = {};
        glob(path.join(results_dir, "*"), function(error, result_paths) {
            if (error) {
                return res.redirect(process.env.CC_PATH);
            }
            for (let result_path of result_paths) {
                let result_predictions_path = path.join(result_path,  "predictions.json");
                let result_predictions;
                try {
                    result_predictions = JSON.parse(fs.readFileSync(result_predictions_path, 'utf8'));
                }
                catch (error) {
                    console.log(error);
                    return res.redirect(process.env.CC_PATH);
                }
                predictions[path.basename(result_path)] = result_predictions;
            }

            let data = {};
            data["annotations"] = annotations;
            data["predictions"] = predictions;
            data["metadata"] = metadata;
            data["camera_specs"] = camera_specs;
            res.render("timeline", {username: req.session.user.username, "data": data});
        });




    }
    else {
        res.redirect(process.env.CC_PATH);
    }

}



// exports.post_timeline = function(req, res, next) {

//     let action = req.body.action;
//     let response = {};
//     if (action === "calculate_mAP") {
        
//         let farm_name = req.params.farm_name;
//         let field_name = req.params.field_name;
//         let mission_date = req.params.mission_date;

//         let mission_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", 
//                                     farm_name, field_name, mission_date);

//         let results_dir = path.join(mission_dir, "model", "results");
//         //let download_uuids = [];
//         let metrics = {};

//         glob(path.join(results_dir, "*"), function(error, result_paths) {
//             if (error) {
//                 return res.redirect(process.env.CC_PATH);
//             }
//             //for (let i = 0; i < result_paths.length; i++) { 
//             for (let result_path of result_paths) {

//                 //let result_path = result_paths[i];

//                 let result_uuid = path.basename(result_path);

//         //let results_path = path.join(results_dir, timestamp, "retrieval", download_uuid, "results.csv");

//                 let download_uuid = uuidv4().toString();

//                 //console.log("download uuid is", download_uuid);
                

//                 let create_spreadsheet_command = "python ../../plant_detection/src/create_spreadsheet.py " +
//                     req.session.user.username + " " +
//                     farm_name + " " +
//                     field_name + " " + 
//                     mission_date + " " + 
//                     result_uuid + " " +
//                     download_uuid + " " +
//                     "most_recent";

//                 console.log("executing:", create_spreadsheet_command);
        

//                 exec(create_spreadsheet_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
//                     if (error) {
//                         console.log(error.stack);
//                         console.log('Error code: '+error.code);
//                         console.log('Signal received: '+error.signal);
//                         response.error = true;
//                         return res.json(response);
//                     }

//                     console.log("finished", create_spreadsheet_command);
//                     console.log("result_path", result_path);
//                     //console.log("timestamp", timestamp);
//                     console.log("download_uuid", download_uuid);
//                     //response.error = false;
//                     //response.download_uuid = download_uuid;
//                     //console.log("returning new download_uuid", download_uuid);
//                     //return res.json(response);

//                     let result_metrics_path = path.join(result_path, "retrieval", download_uuid, "metrics.json");
//                     let result_metrics;
//                     try {
//                         result_metrics = JSON.parse(fs.readFileSync(result_metrics_path, 'utf8'));
//                     }
//                     catch (error) {
//                         console.log(error);
//                         response.error = true;
//                         return res.json(response);
//                     }

//                     metrics[timestamp] = result_metrics;


//                     //download_uuids.push(download_uuid);
//                     if (Object.keys(metrics).length == result_paths.length) {
//                         //response.download_uuids = download_uuids.join(",");
//                         response.metrics = metrics;
//                         return res.json(response);
//                     }
//                 });
//             }
//         });
//     }
// }




exports.get_viewer = function(req, res, next) {
    
    if ((req.session.user && req.cookies.user_sid) && (req.params.username === req.session.user.username)) {
        
        let farm_name = req.params.farm_name;
        let field_name = req.params.field_name;
        let mission_date = req.params.mission_date;
        let result_uuid = req.params.result_uuid;

        console.log("result_uuid", result_uuid);


        let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                      farm_name, field_name, mission_date);

        let sel_results_dir = path.join(image_set_dir, "model", "results", result_uuid);


        if (!(fpath_exists(sel_results_dir))) {
            return res.redirect(process.env.CC_PATH);
        }


        let overlay_appearance;
        let overlay_appearance_path = path.join(USR_DATA_ROOT, req.session.user.username, "overlay_appearance.json");
        try {
            overlay_appearance = JSON.parse(fs.readFileSync(overlay_appearance_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }


        let request_path = path.join(sel_results_dir, "request.json");
        let request;
        try {
            request = JSON.parse(fs.readFileSync(request_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }

        let annotations_path = path.join(sel_results_dir, "annotations.json");
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }
        let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
        let metadata;
        try {
            metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }
        let camera_specs_path = path.join(USR_DATA_ROOT, req.session.user.username, "cameras", "cameras.json");
        let camera_specs;
        try {
            camera_specs = JSON.parse(fs.readFileSync(camera_specs_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }
        let predictions_path = path.join(sel_results_dir, "predictions.json")
        let predictions;
        try {
            predictions = JSON.parse(fs.readFileSync(predictions_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }
        let metrics_path = path.join(sel_results_dir, "metrics.json");
        let metrics;
        try {
            metrics = JSON.parse(fs.readFileSync(metrics_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }

        let tags_path = path.join(sel_results_dir, "tags.json");
        let tags;        
        try {
            tags = JSON.parse(fs.readFileSync(tags_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }

        let excess_green_record_path = path.join(sel_results_dir, "excess_green_record.json");
        let excess_green_record;
        try {
            excess_green_record = JSON.parse(fs.readFileSync(excess_green_record_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }
        
        let dzi_images_dir = path.join(image_set_dir, "dzi_images");

        let dzi_image_paths = [];
        for (let image_name of Object.keys(annotations)) {
            let dzi_image_path = path.join(process.env.CC_PATH, dzi_images_dir, image_name + ".dzi");
            dzi_image_paths.push(dzi_image_path);

        }

        let areas_path = path.join(sel_results_dir, "areas.xlsx");
        let areas_spreadsheet_exists;
        try {
            areas_spreadsheet_exists = fs.existsSync(areas_path);
        }
        catch (error) {
            console.log(error);
            return res.redirect(process.env.CC_PATH);
        }

        // let maps_exist = ((fpath_exists(path.join(sel_results_dir, "maps", "linear_predicted_map.svg"))) && 
        //                   (fpath_exists(path.join(sel_results_dir, "maps", "nearest_predicted_map.svg"))));

        // let existing_maps = {};
        // existing_maps["linear"] = fpath_exists(path.join(sel_results_dir, "maps", "linear_predicted_map.svg"));
        // existing_maps["nearest"] = fpath_exists(path.join(sel_results_dir, "maps", "nearest_predicted_map.svg"));

        let image_set_info = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "result_uuid": result_uuid
        };


        let data = {};

        data["image_set_info"] = image_set_info;
        data["annotations"] = annotations;
        data["predictions"] = predictions;
        data["metadata"] = metadata;
        data["camera_specs"] = camera_specs;
        data["excess_green_record"] = excess_green_record;
        data["metrics"] = metrics;
        data["request"] = request;
        data["areas_spreadsheet_exists"] = areas_spreadsheet_exists;
        data["tags"] = tags;

        //data["dzi_dir"] = path.join(process.env.CC_PATH, dzi_images_dir);
        data["dzi_image_paths"] = nat_orderBy.orderBy(dzi_image_paths);
        data["overlay_appearance"] = overlay_appearance;
        // data["existing_maps"] = existing_maps;

        res.render("viewer", {username: req.session.user.username, "data": data});
    }
    
    else {
        res.redirect(process.env.CC_PATH);
    }
}

exports.post_viewer = function(req, res, next) {

    //if (req.session.user && req.cookies.user_sid) {

    let response = {};

    let farm_name = req.params.farm_name;
    let field_name = req.params.field_name;
    let mission_date = req.params.mission_date;
    let result_uuid = req.params.result_uuid;
    let action = req.body.action;


    if (action == "build_map") {

        let interpolated_value = req.body.interpolated_value;

        console.log(farm_name);
        console.log(field_name);
        console.log(mission_date);

        // let annotation_version = req.body.annotation_version;
        
        let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name, field_name, mission_date);
        let results_dir = path.join(image_set_dir, "model", "results", result_uuid);

        let predictions_path = path.join(results_dir, "predictions.json");
        let maps_dir = path.join(results_dir, "maps");

        let rebuild_command = "python ../../plant_detection/src/interpolate.py " + req.session.user.username + " " +
            farm_name + " " + field_name + " " + mission_date + " " + predictions_path + 
            " " + maps_dir + " " + interpolated_value;
        

        if (req.body.interpolation === "nearest") {
            rebuild_command = rebuild_command + " -nearest";
        }
        if (req.body.tile_size !== "") {
            rebuild_command = rebuild_command + " -tile_size " + req.body.tile_size;
        }
        if (req.body.interpolated_value !== "obj_density") {
            let vegetation_record_path = path.join(results_dir, "vegetation_record.json");
            rebuild_command = rebuild_command + " -vegetation_record_path " + vegetation_record_path;
        }
        // if (req.body.pred_image_status === "completed") {
        //     rebuild_command = rebuild_command + " -completed_only";
        // }
        // if (req.body.comparison_type == "diff") {
        //     rebuild_command = rebuild_command + " -diff";
        // }
        console.log(rebuild_command);
        let result = exec(rebuild_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);
                response.error = true;
            }
            else {
                response.error = false;
            }
            return res.json(response);
        });
    }

    // else if (action === "create_spreadsheet") {

    //     let download_uuid = req.body.download_uuid;


    //     let results_path = path.join(USR_DATA_ROOT, req.session.user.username,
    //                             "image_sets", farm_name, field_name, mission_date,
    //                             "model", "results", result_uuid, "retrieval", download_uuid, "results.xlsx");

    //     if ((download_uuid === "") || !(fs.existsSync(results_path))) {

    //         download_uuid = uuidv4().toString();

    //         console.log("results not found, new download uuid is", download_uuid);

    //         let create_spreadsheet_command = "python ../../plant_detection/src/create_spreadsheet.py " +
    //             req.session.user.username + " " +
    //             farm_name + " " +
    //             field_name + " " + 
    //             mission_date + " " + 
    //             result_uuid + " " +
    //             download_uuid; //+ " " +
    //             // req.body.annotation_version;
            
    //         let result = exec(create_spreadsheet_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
    //             if (error) {
    //                 console.log(error.stack);
    //                 console.log('Error code: '+error.code);
    //                 console.log('Signal received: '+error.signal);
    //                 response.error = true;
    //                 return res.json(response);
    //             }
    //             response.error = false;
    //             response.download_uuid = download_uuid;
    //             console.log("returning new download_uuid", download_uuid);
    //             return res.json(response);
    //         });
    //     }
    //     else {
    //         response.error = false;
    //         response.download_uuid = download_uuid;
    //         return res.json(response);
    //     }

    // }

    // else if (action === "prepare_raw_outputs_download") {

    //     if (file_format === "json") {

    //     }
    //     else if (file_format === "shapefile") {

    //     }
    //     else {
    //         response.error = true;
    //         response.message = "Invalid file format specified";
    //         return res.json(response);
    //     }

    // }
    // else if (action === "switch_annotation_version") {

    //     let annotation_version = req.body.annotation_version;
    //     let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username,
    //                                   "image_sets", farm_name, field_name, mission_date);
    //     let results_dir = path.join(image_set_dir, "model", "results", timestamp);
        
    //     let download_uuid = uuidv4().toString();
    //     console.log("switch annotation version, new download_uuid", download_uuid);

    //     let create_spreadsheet_command = "python ../../plant_detection/src/create_spreadsheet.py " +
    //                             req.session.user.username + " " +
    //                             farm_name + " " +
    //                             field_name + " " + 
    //                             mission_date + " " + 
    //                             timestamp + " " +
    //                             download_uuid + " " +
    //                             req.body.annotation_version;

    //     console.log("executing command", create_spreadsheet_command);
                            
    //     let result = exec(create_spreadsheet_command, {shell: "/bin/bash"}, function (error, stdout, stderr) {
    //         if (error) {
    //             console.log(error.stack);
    //             console.log('Error code: '+error.code);
    //             console.log('Signal received: '+error.signal);
    //             response.error = true;
    //             return res.json(response);
    //         }


    //         let metrics_path = path.join(results_dir, "retrieval", download_uuid, "metrics.json");
    //         let metrics;
    //         try {
    //             metrics = JSON.parse(fs.readFileSync(metrics_path, 'utf8'));
    //         }
    //         catch (error) {
    //             console.log(error);
    //             response.error = true;
    //             return res.json(response);
    //         }

    //         let annotations_path;
    //         let excess_green_record_path;
    //         if (annotation_version === "most_recent") {
    //             annotations_path = path.join(image_set_dir, "annotations", "annotations.json");
    //             excess_green_record_path = path.join(image_set_dir, "excess_green", "record.json");
    //         }
    //         else {
    //             annotations_path = path.join(results_dir, "annotations.json");
    //             excess_green_record_path = path.join(results_dir, "excess_green_record.json");
    //         }

    //         let annotations;
    //         try {
    //             annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
    //         }
    //         catch (error) {
    //             console.log(error);
    //             response.error = true;
    //             return res.json(response);
    //         }

    //         let excess_green_record;
    //         try {
    //             excess_green_record = JSON.parse(fs.readFileSync(excess_green_record_path, 'utf8'));
    //         }
    //         catch (error) {
    //             console.log(error);
    //             response.error = true;
    //             return res.json(response);
    //         }

    //         response.error = false;
    //         response["annotations"] = annotations;
    //         response["excess_green_record"] = excess_green_record;
    //         response["metrics"] = metrics;
    //         response["download_uuid"] = download_uuid;
    //         return res.json(response);
    //     });
    // }
}


// exports.get_download = function(req, res, next) {
//     if ((req.session.user && req.cookies.user_sid) && (req.params.username === req.session.user.username)) {


//         let farm_name = req.params.farm_name;
//         let field_name = req.params.field_name;
//         let mission_date = req.params.mission_date;
//         let result_uuid = req.params.result_uuid;
//         let download_uuid = req.params.download_uuid;

//         let results_path = path.join(USR_DATA_ROOT, req.session.user.username,
//                                 "image_sets", farm_name, field_name, mission_date,
//                                 "model", "results", result_uuid, "retrieval", download_uuid, "results.xlsx");

//         res.download(results_path, "results.xlsx");
//     }
// }
        


exports.logout = function(req, res, next) {
    console.log("logging out");
    if (req.session.user && req.cookies.user_sid) {
        console.log("clearing cookies");
        res.clearCookie('user_sid');
        console.log("cookies cleared");
    }
    console.log("redirecting");
    res.redirect(process.env.CC_PATH);
}