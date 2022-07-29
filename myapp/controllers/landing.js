

var session = require('express-session');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const xml_js_convert = require('xml-js');
const nat_orderBy = require('natural-orderby');
const { spawn, exec } = require('child_process');
const sanitize = require('sanitize-filename');

const models = require('../models');
const { response } = require('express');

const glob = require("glob");
/*
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
*/

/*
var socket_io = require('socket.io');
var io = socket_io();

io.on('connection', (socket) => {
    console.log("a user connected");
});*/


/*
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);*/

//import express from "express";
//import { createServer } from "http";
//import { Server } from "socket.io";
//import session from "express-session";
//const app = express();
//const httpServer = createServer(app);
//const io = new Server(httpServer);
/*
let socket_io = require('socket.io');
let io = socket_io();*/

const APP_PREFIX = '/plant_detection';
const USR_DATA_ROOT = path.join("usr", "data");
//const USR_REQUESTS_ROOT = path.join("usr", "requests");
const USR_SHARED_ROOT = path.join("usr", "shared");

const ANNOTATION_LOCK_TIMEOUT = 240000; // 4 minutes
// const AsyncLock = require('async-lock');
// const job_lock = new AsyncLock();

// let jobs;
// let active_subprocesses = {};
let sockets = {};
var Mutex = require('async-mutex').Mutex;


const annotation_mutex = new Mutex();
const camera_mutex = new Mutex();


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
console.log("STARTING THE PYTHON PROCESS");

let scheduler = spawn("python3", ["../../plant_detection/src/scheduler.py"]);


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

exports.post_sign_in = function(req, res, next) {
    let response = {};
    response.not_found = false;
    response.error = false;

    return models.users.findOne({
    where: {
        username: req.body.username,
    }
    }).then(user => {
        if (!user) {
            response.not_found = true;
            res.json(response);
        }
        else {
            if (!user.check_password(req.body.password)) {
                response.not_found = true;
                res.json(response);
            }
            else {
                req.session.user = user.dataValues;
                response.redirect = APP_PREFIX + "/home/" + req.body.username;
                res.json(response);
            }
        }
    }).catch(error => {
        response.error = true;
        res.json(response);
    });
}


function get_subdirs(dir) {
    let subdirs = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        let fpath = path.join(dir, file);
        let stat = fs.statSync(fpath);
        if (stat && stat.isDirectory()) {
            subdirs.push(file);
        }
    });
    return subdirs;
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

    if (req.session.user && req.cookies.user_sid) {

        console.log("gathering image_sets data");

        let image_sets_data = {};
        let image_sets_root = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets");
        let farm_names = get_subdirs(image_sets_root);

        console.log("farm_names", farm_names);
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

                    let upload_complete_path = path.join(mission_root, "upload_complete.json");
                    if (fs.existsSync(upload_complete_path)) {

                        if (!(farm_name in image_sets_data)) {
                            image_sets_data[farm_name] = {};
                        }
                        if (!(field_name in image_sets_data[farm_name])) {
                            image_sets_data[farm_name][field_name] = []
                        }
                        image_sets_data[farm_name][field_name].push(mission_date);
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
                res.redirect(APP_PREFIX);
            }


            release();
            
            res.render("home", {
                username: req.session.user.username, 
                image_sets_data: image_sets_data, 
                camera_specs: camera_specs
            });


        }).catch(function(error) {
            console.log(error);
            res.redirect(APP_PREFIX);
        });

        
    }
    else {
        res.redirect(APP_PREFIX);
    }
}

exports.get_annotate = function(req, res, next) {

    if (req.session.user && req.cookies.user_sid) {
        
        let farm_name = req.params.farm_name;
        let field_name = req.params.field_name;
        let mission_date = req.params.mission_date;
        let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name, field_name, mission_date);

        glob(path.join(image_set_dir, "images", "*"), function(error, image_paths) {
            if (error) {
                return res.redirect(APP_PREFIX);
            }

            console.log("image_paths", image_paths);
            let image_ext = image_paths[0].substring(image_paths[0].length - 4);
            console.log("image_ext", image_ext);
    
            
            let annotations_dir = path.join(image_set_dir, "annotations");
            let annotations_lock_path = path.join(annotations_dir, "lock.json")
    
            annotation_mutex.acquire()
            .then(function(release) {
                let annotations_lock;
                try {
                    annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
                }
                catch (error) {
                    release();
                    return res.redirect(APP_PREFIX);
                }
    
                let last_refresh = annotations_lock["last_refresh"];
                let cur_time = Date.now()
                if ((cur_time - last_refresh) < ANNOTATION_LOCK_TIMEOUT) {
                    release();
                    // TODO: redirect to an error page
                    return res.redirect(APP_PREFIX);
                }
                annotations_lock["last_refresh"] = Date.now();
                try {
                    fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
                }
                catch (error) {
                    release();
                    // TODO: redirect to an error page
                    return res.redirect(APP_PREFIX);
                }
                release();
    
                let annotations_path = path.join(annotations_dir, "annotations_w3c.json");
                let annotations;
                try {
                    annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
                }
                catch (error) {
                    console.log(error);
                    return res.redirect(APP_PREFIX);
                }
        
                let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
                let metadata;
                try {
                    metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
                }
                catch (error) {
                    console.log(error);
                    return res.redirect(APP_PREFIX);
                }

                let excess_green_record_path = path.join(image_set_dir, "excess_green", "record.json");
                let excess_green_record;
                try {
                    excess_green_record = JSON.parse(fs.readFileSync(excess_green_record_path, 'utf8'));
                }
                catch (error) {
                    console.log(error);
                    return res.redirect(APP_PREFIX);
                }
        
                let dzi_images_dir = path.join(image_set_dir, "dzi_images");
                let dzi_image_paths = [];
                for (image_name of Object.keys(annotations)) {
                    let dzi_image_path = path.join(APP_PREFIX, dzi_images_dir, image_name + ".dzi");
                    dzi_image_paths.push(dzi_image_path);
                }
        
                let image_set_info = {
                    "farm_name": farm_name,
                    "field_name": field_name,
                    "mission_date": mission_date,
                    "image_ext": image_ext
                }
        
                console.log("ready to render");
                let data = {};

                //let cur_weights_path = path.join(image_set_dir, "model", "weights", "best_weights.h5");
                //data["baseline_initialized"] = fs.existsSync(cur_weights_path);
                //console.log("baseline_initialized", data["baseline_initialized"]);

                data["image_set_info"] = image_set_info;
                data["metadata"] = metadata;
                data["dzi_image_paths"] = nat_orderBy.orderBy(dzi_image_paths);
                data["annotations"] = annotations;
                data["excess_green_record"] = excess_green_record;
                res.render("annotate", {username: req.session.user.username, data: data});
    
    
            }).catch(function(error) {
                console.log(error);
                return res.redirect(APP_PREFIX);
            });
    
    

        });
        
        
    }
    else {
        return res.redirect(APP_PREFIX);
    }

}


exports.post_annotate = function(req, res, next) {

    //if (req.session.user && req.cookies.user_sid) {

    let response = {};


    let farm_name = req.params.farm_name;
    let field_name = req.params.field_name;
    let mission_date = req.params.mission_date;
    let action = req.body.action;

    let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name,
                                        field_name, mission_date);


    if (action === "save_annotations") {
        let annotations_path = path.join(image_set_dir, "annotations", "annotations_w3c.json");

        try {
            fs.writeFileSync(annotations_path, req.body.annotations);
        }
        catch (error) {
            console.log(error);
            response.error = true;
            return res.json(response);
        }

        let excess_green_record_path = path.join(image_set_dir, "excess_green", "record.json");
        try {
            fs.writeFileSync(excess_green_record_path, req.body.excess_green_record);
        }
        catch (error) {
            console.log(error);
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);
    }
    else if (action === "build_map") {

        console.log(farm_name);
        console.log(field_name);
        console.log(mission_date);
        let out_dir = path.join(image_set_dir, "maps");
        let annotations_path = path.join(image_set_dir, "annotations", "annotations_w3c.json");
        let rebuild_command = "python ../../plant_detection/src/interpolate.py " + req.session.user.username + " " +
                            farm_name + " " + field_name + " " + mission_date + " " + annotations_path + " " + out_dir;

        if (req.body.interpolation == "nearest") {
            rebuild_command = rebuild_command + " -nearest";
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
    }
    else if (action === "refresh_lock_file") {

        let annotations_lock_path = path.join(image_set_dir, "annotations", "lock.json");


        annotation_mutex.acquire()
        .then(function(release) {
            let annotations_lock;
            try {
                annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read annotation lock file.";
                response.error = true;
                response.redirect = APP_PREFIX;
                return res.json(response);
            }

            annotations_lock["last_refresh"] = Date.now();

            try {
                fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
            }
            catch (error) {
                release();
                // TODO: redirect to an error page
                response.message = "Failed to write annotation lock file.";
                response.error = true;
                response.redirect = APP_PREFIX;
                return res.json(response);

            }

            // success
            release();
            response.error = false;
            return res.json(response);

        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire annotation mutex.";
            response.error = true;
            response.redirect = APP_PREFIX;
            return res.json(response);
        });


    }
    else if (action === "expired_lock_file") {

        let annotations_lock_path = path.join(image_set_dir, "annotations", "lock.json");

        annotation_mutex.acquire()
        .then(function(release) {
            let annotations_lock;
            try {
                annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read annotation lock file.";
                response.error = true;
                response.redirect = APP_PREFIX;
                return res.json(response);
            }

            annotations_lock["last_refresh"] = 0;

            try {
                fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
            }
            catch (error) {
                release();
                // TODO: redirect to an error page
                response.message = "Failed to write annotation lock file.";
                response.error = true;
                response.redirect = APP_PREFIX;
                return res.json(response);

            }

            // success
            release();
            response.error = false;
            response.redirect = APP_PREFIX + "/home/" + req.session.user.username;
            return res.json(response);

        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire annotation mutex.";
            response.error = true;
            response.redirect = APP_PREFIX;
            return res.json(response);
        });

    }
    else if (action === "predict") {

        let image_name = req.body.image_name;

        let request_uuid = uuidv4().toString();
        let request = {
            "request_uuid": request_uuid,
            "start_time": Math.floor(Date.now() / 1000),
            "image_names": [image_name],
            "save_result": false
        };
        
        
        let request_path = path.join(USR_DATA_ROOT, req.session.user.username,
                                    "image_sets", farm_name, field_name, mission_date,
                                    "model", "prediction", "image_requests", request_uuid + ".json");

        try {
            fs.writeFileSync(request_path, JSON.stringify(request));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create prediction request.";
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);
    }
    else if (action === "get_result") {

        let annotations_path = path.join(image_set_dir, "annotations", "annotations_w3c.json")

        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            response.message = "Failed to read annotation file."
            response.error = true;
            return res.json(response);
        }

        let image_names = [];
        for (image_name of Object.keys(annotations)) {
            image_names.push(image_name);
            /*
            if (annotations[image_name]["status"] === "completed_for_testing") {
                image_names.push(image_name);
            }*/
        }
        let request_uuid = uuidv4().toString();
        let request = {
            "request_uuid": request_uuid,
            "start_time": Math.floor(Date.now() / 1000),
            "image_names": image_names,
            "save_result": true
        };
        
        let request_path = path.join(USR_DATA_ROOT, req.session.user.username,
                                     "image_sets", farm_name, field_name, mission_date,
                                     "model", "prediction", "image_set_requests", "pending", request_uuid + ".json");
        try {
            fs.writeFileSync(request_path, JSON.stringify(request));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create prediction request.";
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);
    }
    else if (action === "retrieve_prediction") {
        let image_name = req.body.image_name;
        let prediction_path = path.join(image_set_dir, "model", "prediction",
            "images", image_name, "predictions_w3c.json");

        
        if (fs.existsSync(prediction_path)) {

            try {
                predictions = JSON.parse(fs.readFileSync(prediction_path, 'utf8'));
                response.error = false;
                response.predictions = predictions;
                return res.json(response);
            }
            catch (error) {
                console.log(error);
                response.message = "Failed to retrieve predictions.";
                response.error = true;
                return res.json(response);
            }
        }
        else {
            console.log("No predictions exist for this image");
            response.message = "No predictions found for the current image.";
            response.error = true;
            return res.json(response);
        }

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

    /*
    else if (action === "restart_model") {
        
        let request = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date
        };
        let request_uuid = uuidv4().toString();
        
        let request_path = path.join(USR_REQUESTS_ROOT, "restart",
                                     request_uuid + ".json");
        try {
            fs.writeFileSync(request_path, JSON.stringify(request));
        }
        catch (error) {
            console.log(error);
            response.message = "Failed to create restart request.";
            response.error = true;
            return res.json(response);
        }

        response.error = false;
        return res.json(response);

    }*/

    /*
    else if (action === "initialize_model") {

        let annotations_path = path.join(image_set_dir, "annotations", "annotations_w3c.json");

        try {
            fs.writeFileSync(annotations_path, req.body.annotations);
        }
        catch (error) {
            console.log(error);
            //response.error = true;
            //return res.json(response);
        }

        let initialize_request_path = path.join(image_set_dir, "model", "initialize.json")
        let initialize_request = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "annotation_guides": JSON.parse(req.body.annotation_guides)
        }
        try {
            fs.writeFileSync(initialize_request_path, JSON.stringify(initialize_request));
        }
        catch (error) {
            console.log(error);
            //response.error = true;
            //return res.json(response);
        }
        response.message = "The model is now being initialized!";
        response.error = false;
        return res.json(response);

    }*/

/*
    }
    else {
        res.cookie_expired = true;
        response.redirect = APP_PREFIX;
        return res.json(response);
    }*/
}




function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function remove_image_set(username, farm_name, field_name, mission_date) {

    let farm_dir = path.join(USR_DATA_ROOT, username, "image_sets", farm_name);
    let field_dir = path.join(farm_dir, field_name);
    let mission_dir = path.join(field_dir, mission_date);

    if (fs.existsSync(mission_dir)) {
        fs.rmSync(mission_dir, { recursive: true, force: true });
    }
    if (fs.existsSync(field_dir)) {
        let missions = get_subdirs(field_dir);
        if (missions.length == 0) {
            fs.rmSync(field_dir, { recursive: true, force: true });
        }
    }
    if (fs.existsSync(farm_dir)) {
        let fields = get_subdirs(farm_dir);
        if (fields.length == 0) {
            fs.rmSync(farm_dir, { recursive: true, force: true });
        }
    }
}


exports.post_upload = function(req, res, next) {
    //if (req.session.user && req.cookies.user_sid) {


    let farm_name;
    let field_name;
    let mission_date;
    let first;
    let last;
    let queued_filenames;
    let flight_height;
    let sent_response = false;
    if (req.files.length > 1) {
        farm_name = req.body.farm_name[0];
        field_name = req.body.field_name[0];
        mission_date = req.body.mission_date[0];
        first = false;
        last = false;
        queued_filenames = req.body.queued_filenames[0].split(",");
        flight_height = req.body.flight_height[0];
        let num_sent;
        for (let i = 0; i < req.body.num_sent.length; i++) {
            num_sent = parseInt(req.body.num_sent[i])
            console.log("num_sent", num_sent);
            if (num_sent == 1) {
                first = true;
            }
            if (num_sent == queued_filenames.length) {
                last = true;
            }
        }
        
    }
    else {
        farm_name = req.body.farm_name;
        field_name = req.body.field_name;
        mission_date = req.body.mission_date;
        queued_filenames = req.body.queued_filenames.split(",");
        first = parseInt(req.body.num_sent) == 1;
        last = parseInt(req.body.num_sent) == queued_filenames.length;
        flight_height = req.body.flight_height;
    }
    console.log(req.body.num_sent);

    console.log("contains first?", first);
    console.log("queued_filenames", queued_filenames);

    let format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
    for (file of req.files) {
        if (!(file.mimetype.startsWith('image/'))) {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "One or more provided files is not an image."
                });
            }
        }
        if (format.test(file.originalname)) {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "One or more provided filenames contains illegal characters."
                });
            }
        }
    }


    let image_sets_root = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets");
    let farm_dir = path.join(image_sets_root, farm_name);
    let field_dir = path.join(farm_dir, field_name);
    let mission_dir = path.join(field_dir, mission_date);
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


    
    if (first) {
        console.log("checking components");
        let id_components = [farm_name, field_name, mission_date];
        for (id_component of id_components) {
            if (format.test(id_component)) {
                if (!sent_response) {
                    sent_response = true;
                    remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                    return res.status(422).json({
                        error: "The provided farm, field, or mission date contains illegal characters."
                    });
                }
            }
        }
        if (fpath_exists(mission_dir)) {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "The provided farm-field-mission combination already exists."
                });
            }
        }
        else {
            console.log("Making the image set directories");
            fs.mkdirSync(images_dir, { recursive: true });
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
            }
            catch (error) {
                console.log("Error occurred while copying weights", error);
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred while copying weights."
                    });
                }
            }
            try {
                fs.copyFileSync(source_weights_path, cur_weights_path);
            }
            catch (error) {
                console.log("Error occurred while copying weights", error);
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred while copying weights."
                    });
                }
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
                console.log(error);
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred when writing status file."
                    });
                }
            }


            console.log("Making the annotations file");
            let annotations_path = path.join(annotations_dir, "annotations_w3c.json");
            let annotations = {};
            for (filename of queued_filenames) {
                let sanitized_fname = sanitize(filename);
                let extensionless_fname = sanitized_fname.substring(0, sanitized_fname.length-4);
                annotations[extensionless_fname] = {
                    "status": "unannotated",
                    //"available_for_training": false,
                    "annotations": []
                };
            }
            console.log("Writing the annotations file");
            try {
                fs.writeFileSync(annotations_path, JSON.stringify(annotations));
            }
            catch (error) {
                console.log(error);
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred when writing annotations file."
                    });
                }
            }
            let annotations_lock_path = path.join(annotations_dir, "lock.json")
            let annotations_lock = {
                "last_refresh": 0
            };
            try {
                fs.writeFileSync(annotations_lock_path, JSON.stringify(annotations_lock));
            }
            catch (error) {
                console.log(error);
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred when writing annotations lock file."
                    });
                }
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
                console.log(error);
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred when writing loss record."
                    });
                }
            }
        }
    }
    else {
        if (!(fpath_exists(mission_dir))) {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "Image set directories were not created by initial request."
                });
            }
        }
    }
    console.log("Converting the files");
    for (file of req.files) {
        let sanitized_fname = sanitize(file.originalname);
        let extensionless_fname = sanitized_fname.substring(0, sanitized_fname.length-4);
        if (extensionless_fname.length > 50) {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "One or more filenames exceeds maximum allowed length of 50 characters."
                });
            }
        }



        let extension = sanitized_fname.substring(sanitized_fname.length-4);
        let fpath = path.join(images_dir, sanitized_fname);
        try {
            fs.writeFileSync(fpath, file.buffer);
        }
        catch (error) {
            console.log(error);
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "Error occurred when writing image file."
                });
            }
        }

        let img_dzi_path = path.join(dzi_images_dir, extensionless_fname);

        let no_convert_extensions = [".jpg", ".JPG", ".png", ".PNG"];
        if (!(no_convert_extensions.includes(extension))) {
            let tmp_path = path.join(conversion_tmp_dir, extensionless_fname + ".jpg");
            let conv_cmd = "convert " + fpath + " " + tmp_path;
            let slice_cmd = "./MagickSlicer/magick-slicer.sh '" + tmp_path + "' '" + img_dzi_path + "'";
            let result = exec(conv_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                if (error) {

                    console.log(error.stack);
                    console.log('Error code: '+error.code);
                    console.log('Signal received: '+error.signal);

                    remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                    if (!sent_response) {
                        sent_response = true;
                        return res.status(422).json({
                            error: "Error occurred during image conversion process."
                        });
                    }
                }
                else {
                    let result = exec(slice_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                        if (error) {
                            console.log(error.stack);
                            console.log('Error code: '+error.code);
                            console.log('Signal received: '+error.signal);

                            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                            if (!sent_response) {
                                sent_response = true;
                                return res.status(422).json({
                                    error: "Error occurred during image conversion process."
                                });
                            }
                        }
                        else {
                            try {
                                fs.unlinkSync(tmp_path);
                            }
                            catch (error) {
                                console.log(error);
                                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                                if (!sent_response) {
                                    sent_response = true;
                                    return res.status(422).json({
                                        error: "Error occurred during image conversion process."
                                    });
                                }
                            }
                        }
                    });

                }
            });
        }
        else {
            let slice_cmd = "./MagickSlicer/magick-slicer.sh '" + fpath + "' '" + img_dzi_path + "'";
            let result = exec(slice_cmd, {shell: "/bin/bash"}, function (error, stdout, stderr) {
                if (error) {

                    console.log(error.stack);
                    console.log('Error code: '+error.code);
                    console.log('Signal received: '+error.signal);
                    remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                    if (!sent_response) {
                        sent_response = true;
                        return res.status(422).json({
                            error: "Error occurred during image conversion process."
                        });
                    }
                }
            });
        }

        let exg_command = "python ../../plant_detection/src/excess_green.py " + mission_dir + " " + extensionless_fname;
        let result = exec(exg_command, {shell: "/bin/bash"}, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);   

                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred during creation of excess green image."
                    });
                }
            }
        });  
    }


    if (last) {
        console.log("Collecting metadata...");
        console.log("flight_height", flight_height);
        let metadata_command = "python ../../plant_detection/src/metadata.py " + mission_dir;
        if (isNumeric(flight_height)) {
            numeric_flight_height = parseFloat(flight_height);
            if (numeric_flight_height < 0.1 || numeric_flight_height > 100) {
                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Provided flight height is invalid."
                    });
                }

            }
            metadata_command = metadata_command + " --flight_height " + flight_height;
        }
        else {
            remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
            if (!sent_response) {
                sent_response = true;
                return res.status(422).json({
                    error: "Provided flight height is invalid."
                });
            }
        }
        console.log(metadata_command);
        let result = exec(metadata_command, {shell: "/bin/bash"}, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);   

                remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                if (!sent_response) {
                    sent_response = true;
                    return res.status(422).json({
                        error: "Error occurred during metadata extraction."
                    });
                }
            }
            else {

                console.log("Writing upload_complete file...");
                let upload_complete = {}
                let upload_complete_path = path.join(mission_dir, "upload_complete.json");

                try {
                    fs.writeFileSync(upload_complete_path, JSON.stringify(upload_complete));
                }
                catch (error) {
                    console.log(error);
                    remove_image_set(req.session.user.username, farm_name, field_name, mission_date);
                    if (!sent_response) {
                        sent_response = true;
                        return res.status(422).json({
                            error: "Error occurred when writing upload completion record."
                        });
                    }
                }

                console.log("Sending final success status");
                if (!sent_response) {
                    sent_response = true;
                    return res.sendStatus(200);
                }
            }
        });

    }
    else {
        console.log("Sending success status");
        if (!sent_response) {
            sent_response = true;
            return res.sendStatus(200);
        }
    }
}


exports.post_home = function(req, res, next) {

    //if (req.session.user && req.cookies.user_sid) {
    let action = req.body.action;
    let response = {};
    if (action === "delete_image_set") {
        
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;

        let mission_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", 
                                    farm_name, field_name, mission_date);

        let annotations_lock_path = path.join(mission_dir, "annotations", "lock.json");

        console.log("acquiring annotation mutex");
        annotation_mutex.acquire()
        .then(function(release) {
            let annotations_lock;
            try {
                annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read annotation lock file.";
                response.error = true;
                return res.json(response);
            }

            let last_refresh = annotations_lock["last_refresh"];
            let cur_time = Date.now();
            if ((cur_time - last_refresh) < ANNOTATION_LOCK_TIMEOUT) {
                release();
                console.log("Annotation file is currently locked");
                response.message = "The image set cannot be deleted since the corresponding annotation file is currently in use. Please try again later.";
                response.error = true;
                return res.json(response);
            }

            // success
            release();
            response.error = false;


            console.log("reading annotations file");
            
            let annotations_path = path.join(mission_dir, "annotations", "annotations_w3c.json");
            let annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
            console.log("checking number of annotations");
            let total_annotations = 0;
            for (image_name of Object.keys(annotations)) {
                total_annotations += annotations[image_name]["annotations"].length;
            }
            if (total_annotations !== 0) {
                response.error = true;
                response.message = "Cannot delete an image set with annotations."
                return res.json(response);
            }
            else {
                console.log("No annotations found, deleting image set");

                fs.rmSync(mission_dir, { recursive: true, force: true });

                let field_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name, field_name);
                let missions = get_subdirs(field_dir);
                if (missions.length == 0) {
                    fs.rmSync(field_dir, { recursive: true, force: true });
                    let farm_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name);
                    let fields = get_subdirs(farm_dir);
                    if (fields.length == 0) {
                        fs.rmSync(farm_dir, { recursive: true, force: true });
                    }
                }

                // TODO: remove unneeded keys from cameras.json
                

                response.error = false;
                response.redirect = APP_PREFIX + "/home/" + req.session.user.usename;
                return res.json(response);
            }
        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire annotation mutex.";
            response.error = true;
            return res.json(response);
        });
    }
    else if (action === "annotate_image_set") {

        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;

        let mission_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name, field_name, mission_date);
        let annotations_dir = path.join(mission_dir, "annotations");
        let annotations_lock_path = path.join(annotations_dir, "lock.json")

        //annotations_lock.acquire(anno_lock_key, function() {
        console.log("acquiring annotation mutex");
        annotation_mutex.acquire()
        .then(function(release) {
            let annotations_lock;
            try {
                annotations_lock = JSON.parse(fs.readFileSync(annotations_lock_path, 'utf8'));
            }
            catch (error) {
                release();
                console.log(error);
                response.message = "Failed to read annotation lock file.";
                response.error = true;
                return res.json(response);
            }

            let last_refresh = annotations_lock["last_refresh"];
            let cur_time = Date.now();
            if ((cur_time - last_refresh) < ANNOTATION_LOCK_TIMEOUT) {
                release();
                console.log("Annotation file is currently locked");
                response.message = "The requested annotation file is currently in use. Please try again later.";
                response.error = true;
                return res.json(response);
            }

            // success
            release();
            response.error = false;
            response.redirect = APP_PREFIX + "/annotate/" + req.session.user.username + "/" + farm_name + "/" +
                                field_name + "/" + mission_date;
            return res.json(response);

        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire annotation mutex.";
            response.error = true;
            return res.json(response);
        });





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
                response.error = true;
                return res.json(response);
            }

            console.log("pending_paths", pending_paths);

            for (pending_path of pending_paths) {
                try {
                    response.pending_results.push(JSON.parse(fs.readFileSync(pending_path, 'utf8')));
                }
                catch (error) {
                    response.error = true;
                    return res.json(response);
                }
            }

            glob(path.join(prediction_dir, "image_set_requests", "aborted", "*"), function(error, aborted_paths) {

                if (error) {
                    response.error = true;
                    return res.json(response);
                }

                console.log("aborted_paths", aborted_paths);

                for (aborted_path of aborted_paths) {
                    try {
                        response.aborted_results.push(JSON.parse(fs.readFileSync(aborted_path, 'utf8')));
                    }
                    catch (error) {
                        response.error = true;
                        return res.json(response);
                    }
                }

                glob(path.join(results_dir, "*"), function(error, completed_dirs) {
                    if (error) {
                        response.error = true;
                        return res.json(response);
                    }

                    console.log("completed_dirs", completed_dirs);

                    for (completed_dir of completed_dirs) {
                        try {
                            response.completed_results.push(JSON.parse(fs.readFileSync(path.join(completed_dir, "request.json"), 'utf8')));
                        }
                        catch (error) {
                            response.error = true;
                            return res.json(response);
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

        console.log("result_type", result_type);
        console.log("result_id", result_id);

        if (result_type === "completed") {

            let result_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                  farm_name, field_name, mission_date, "model", "results", result_id);

            console.log("removing result", result_dir);
            try {
                fs.rmSync(result_dir, { recursive: true, force: true });
            }
            catch (error) {
                console.log(error);
                response.error = true;
                return res.json(response);
            }
        }
        else if (result_type === "aborted") {
            
            let request_path = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                   farm_name, field_name, mission_date, "model", "prediction", 
                                   "image_set_requests", "aborted", result_id + ".json");

            console.log("removing request", request_path);
            try {
                fs.unlinkSync(request_path);
            }
            catch (error) {
                console.log(error);
                response.error = true;
                return res.json(response);
            }
        }

        response.error = false;
        return res.json(response);

    }
    else if (action === "add_camera") {

        let make = req.body.make;
        let model = req.body.model;
        let sensor_width = req.body.sensor_width;
        let sensor_height = req.body.sensor_height;
        let focal_length = req.body.focal_length;
        let farm_name = req.body.farm_name;
        let field_name = req.body.field_name;
        let mission_date = req.body.mission_date;


        let format = /[`!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
        for (input of [make, model, sensor_width, sensor_height, focal_length]) {
            if (format.test(input)) {
                response.message = "Provided metadata contains invalid characters."
                response.error = true;
                return res.json(response);
            }
        }
        for (input of [make, model]) {
            if ((input.length < 3 || input.length > 20) || input === "???") {
                response.message = "Provided metadata is invalid."
                response.error = true;
                return res.json(response);
            }
        }

        for (input of [sensor_width, sensor_height, focal_length]) {
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

        sensor_width = sensor_width + " mm";
        sensor_height = sensor_height + " mm";
        focal_length = focal_length + " mm";

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
                "focal_length": focal_length
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

            try {
                fs.writeFileSync(metadata_path, JSON.stringify(metadata));
            }
            catch (error) {
                release();
                response.message = "Failed to write image set metadata file.";
                response.error = true;
                return res.json(response);
            }


            // remove unused keys

            let image_sets_root = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets");
            let farm_names = get_subdirs(image_sets_root);
            console.log("farm_names", farm_names);
            let used_cameras = {};
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

                        make = metadata["camera_info"]["make"];
                        model = metadata["camera_info"]["model"];

                        if (!(make in used_cameras)) {
                            used_cameras[make] = [];
                        }
                        if (!(used_cameras[make].includes(model))) {
                            used_cameras[make].push(model);
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
            return res.json(response);


        }).catch(function(error) {
            console.log(error);
            response.message = "Failed to acquire camera metadata mutex.";
            response.error = true;
            return res.json(response);
        });

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
        response.redirect = APP_PREFIX;
        return res.json(response);
    }*/

}

exports.get_viewer = function(req, res, next) {
    
    if (req.session.user && req.cookies.user_sid) {
        
        let farm_name = req.params.farm_name;
        let field_name = req.params.field_name;
        let mission_date = req.params.mission_date;
        let timestamp = req.params.timestamp;


        let image_set_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets",
                                      farm_name, field_name, mission_date);

        let sel_results_dir = path.join(image_set_dir, "model", "results", timestamp);

        let annotations_path = path.join(sel_results_dir, "annotations_w3c.json")
        let annotations;
        try {
            annotations = JSON.parse(fs.readFileSync(annotations_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }
        let metadata_path = path.join(image_set_dir, "metadata", "metadata.json");
        let metadata;
        try {
            metadata = JSON.parse(fs.readFileSync(metadata_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }
        let predictions_path = path.join(sel_results_dir, "predictions_w3c.json")
        let predictions;
        try {
            predictions = JSON.parse(fs.readFileSync(predictions_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }
        let metrics_path = path.join(sel_results_dir, "metrics.json");
        let metrics;
        try {
            metrics = JSON.parse(fs.readFileSync(metrics_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }
        let excess_green_record_path = path.join(sel_results_dir, "excess_green_record.json");
        let excess_green_record;
        try {
            excess_green_record = JSON.parse(fs.readFileSync(excess_green_record_path, 'utf8'));
        }
        catch (error) {
            console.log(error);
        }
        
        let dzi_images_dir = path.join(image_set_dir, "dzi_images");

        let dzi_image_paths = [];
        for (image_name of Object.keys(annotations)) {
            let dzi_image_path = path.join(APP_PREFIX, dzi_images_dir, image_name + ".dzi");
            dzi_image_paths.push(dzi_image_path);

        }

        let image_set_info = {
            "farm_name": farm_name,
            "field_name": field_name,
            "mission_date": mission_date,
            "timestamp": timestamp
        };


        let data = {};

        data["image_set_info"] = image_set_info;
        data["annotations"] = annotations;
        data["predictions"] = predictions;
        data["metadata"] = metadata;
        data["excess_green_record"] = excess_green_record;
        data["metrics"] = metrics;
        data["dzi_dir"] = path.join(APP_PREFIX, dzi_images_dir);
        data["dzi_image_paths"] = nat_orderBy.orderBy(dzi_image_paths);

        res.render("viewer", {username: req.session.user.username, "data": data});
    }
    
    else {
        res.redirect(APP_PREFIX);
    }
}

exports.post_viewer = function(req, res, next) {

    //if (req.session.user && req.cookies.user_sid) {

    let response = {};

    let farm_name = req.params.farm_name;
    let field_name = req.params.field_name;
    let mission_date = req.params.mission_date;
    let timestamp = req.params.timestamp;
    let action = req.body.action;


    if (action == "build_map") {

        console.log(farm_name);
        console.log(field_name);
        console.log(mission_date);
        
        let model_results_dir = path.join(USR_DATA_ROOT, req.session.user.username, "image_sets", farm_name, field_name, mission_date,
                                          "model", "results", timestamp);
        let annotations_path = path.join(model_results_dir, "annotations_w3c.json");
        let pred_path = path.join(model_results_dir, "predictions_w3c.json");
        let out_dir = path.join(model_results_dir, "maps");

        let rebuild_command = "python ../../plant_detection/src/interpolate.py " + req.session.user.username + " " +
                            farm_name + " " + field_name + " " + mission_date + " " + annotations_path + " " +
                                out_dir + " -p " + pred_path;

        if (req.body.interpolation == "nearest") {
            rebuild_command = rebuild_command + " -nearest";
        }
        if (req.body.pred_image_status == "completed") {
            rebuild_command = rebuild_command + " -completed_only";
        }
        if (req.body.comparison_type == "diff") {
            rebuild_command = rebuild_command + " -diff";
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
    }
    /*
    }
    else {
        res.cookie_expired = true;
        response.redirect = APP_PREFIX;
        return res.json(response);
    }*/
}


exports.logout = function(req, res, next) {
    console.log("got to logout");
    if (req.session.user && req.cookies.user_sid) {
        console.log("clearing cookies");
        res.clearCookie('user_sid');
        console.log("done clearing cookies");
    }
    console.log("redirecting");
    res.redirect(APP_PREFIX);
}